import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const search = searchParams.get("search")?.toLowerCase();

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { tradeName: { contains: search, mode: "insensitive" } },
        { documentNumber: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const suppliers = await db.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            accountsPayable: true,
            rawMaterials: true,
            packagings: true,
            purchases: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ suppliers });
  } catch (error: any) {
    console.error("Erro ao listar fornecedores:", error);
    return NextResponse.json({ error: error.message || "Erro ao listar fornecedores" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { name, tradeName, documentNumber, email, phone, address, category, notes, isActive = true } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Razão social / Nome do fornecedor é obrigatório" }, { status: 400 });
    }

    if (documentNumber && documentNumber.trim()) {
      const existingDoc = await db.supplier.findFirst({
        where: { documentNumber: documentNumber.trim() },
      });
      if (existingDoc) {
        return NextResponse.json({ error: `Já existe fornecedor cadastrado com o CPF/CNPJ ${documentNumber.trim()}` }, { status: 400 });
      }
    }

    const supplier = await db.supplier.create({
      data: {
        name: name.trim(),
        tradeName: tradeName?.trim() || null,
        documentNumber: documentNumber?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        category: category?.trim() || null,
        notes: notes?.trim() || null,
        isActive: Boolean(isActive),
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Supplier",
      entityId: supplier.id,
      newValues: supplier,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Cadastro do fornecedor: ${supplier.name}`,
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    console.error("Erro ao criar fornecedor:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar fornecedor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, name, tradeName, documentNumber, email, phone, address, category, notes, isActive } = body;

    if (!id) return NextResponse.json({ error: "ID do fornecedor é obrigatório" }, { status: 400 });

    const existing = await db.supplier.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });

    if (documentNumber && documentNumber.trim() !== existing.documentNumber) {
      const duplicate = await db.supplier.findFirst({
        where: { documentNumber: documentNumber.trim() },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: `Já existe outro fornecedor cadastrado com o CPF/CNPJ ${documentNumber.trim()}` }, { status: 400 });
      }
    }

    const updated = await db.supplier.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        tradeName: tradeName !== undefined ? (tradeName.trim() || null) : existing.tradeName,
        documentNumber: documentNumber !== undefined ? (documentNumber.trim() || null) : existing.documentNumber,
        email: email !== undefined ? (email.trim() || null) : existing.email,
        phone: phone !== undefined ? (phone.trim() || null) : existing.phone,
        address: address !== undefined ? (address.trim() || null) : existing.address,
        category: category !== undefined ? (category.trim() || null) : existing.category,
        notes: notes !== undefined ? (notes.trim() || null) : existing.notes,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Supplier",
      entityId: id,
      newValues: updated,
      oldValues: existing,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Atualização de dados do fornecedor: ${updated.name}`,
    });

    return NextResponse.json({ success: true, supplier: updated });
  } catch (error: any) {
    console.error("Erro ao atualizar fornecedor:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar fornecedor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const existing = await db.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            accountsPayable: true,
            rawMaterials: true,
            packagings: true,
            purchases: true,
            debts: true,
          },
        },
      },
    });

    if (!existing) return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });

    const totalRelations =
      (existing._count?.accountsPayable || 0) +
      (existing._count?.rawMaterials || 0) +
      (existing._count?.packagings || 0) +
      (existing._count?.purchases || 0) +
      (existing._count?.debts || 0);

    if (totalRelations > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir o fornecedor "${existing.name}" pois ele possui vínculos ativos (${existing._count.accountsPayable} contas a pagar, ${existing._count.rawMaterials} matérias-primas, ${existing._count.packagings} embalagens, ${existing._count.purchases} compras). Utilize a opção Inativar para preservar a integridade histórica.`,
        },
        { status: 400 }
      );
    }

    await db.supplier.delete({ where: { id } });

    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "Supplier",
      entityId: id,
      oldValues: existing,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Exclusão definitiva do fornecedor: ${existing.name}`,
    });

    return NextResponse.json({ success: true, message: "Fornecedor excluído com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir fornecedor:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir fornecedor" }, { status: 500 });
  }
}
