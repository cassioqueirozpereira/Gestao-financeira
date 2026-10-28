import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AccountType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await db.chartOfAccount.findMany({
      include: {
        parent: true,
        children: true,
      },
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { code, name, type, parentId } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ error: "Código, nome e tipo de conta são obrigatórios" }, { status: 400 });
    }

    // Calcula o nível da conta com base nos pontos do código ou no pai (Ex: "1" = 1, "1.1" = 2, "1.1.1" = 3)
    const level = code.split(".").length;

    const newAccount = await db.chartOfAccount.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        type: type as AccountType,
        level,
        parentId: parentId || null,
      },
      include: { parent: true },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "ChartOfAccount",
      entityId: newAccount.id,
      newValues: { code: newAccount.code, name: newAccount.name, type: newAccount.type },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Inclusão de conta no Plano de Contas: ${newAccount.code} - ${newAccount.name}`,
    });

    return NextResponse.json({ success: true, account: newAccount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, code, name, type, parentId, isActive } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const existing = await db.chartOfAccount.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

    const level = code ? code.split(".").length : existing.level;

    const updated = await db.chartOfAccount.update({
      where: { id },
      data: {
        code: code ? code.trim() : undefined,
        name: name ? name.trim() : undefined,
        type: type ? (type as AccountType) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        level,
        parentId: parentId !== undefined ? parentId || null : undefined,
      },
      include: { parent: true },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "ChartOfAccount",
      entityId: id,
      newValues: { code: updated.code, name: updated.name, type: updated.type, isActive: updated.isActive },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Edição de conta no Plano de Contas: ${updated.code} - ${updated.name} (Ativa: ${updated.isActive})`,
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID da conta contábil obrigatório" }, { status: 400 });

    const existing = await db.chartOfAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            accountsPayable: true,
            accountsReceivable: true,
            children: true,
          },
        },
      },
    });

    if (!existing) return NextResponse.json({ error: "Conta contábil não encontrada" }, { status: 404 });

    if (existing._count.children > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir a conta "${existing.code} - ${existing.name}" pois ela possui ${existing._count.children} subcontas vinculadas. Exclua ou transfira as subcontas primeiro.`,
        },
        { status: 400 }
      );
    }

    const linkedRecords = existing._count.accountsPayable + existing._count.accountsReceivable;
    if (linkedRecords > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir esta conta contábil pois ela já possui ${linkedRecords} lançamentos financeiros vinculados (${existing._count.accountsPayable} contas a pagar, ${existing._count.accountsReceivable} contas a receber). Você pode inativá-la para impedir novos lançamentos sem perder o histórico contábil.`,
        },
        { status: 400 }
      );
    }

    await db.chartOfAccount.delete({ where: { id } });

    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "ChartOfAccount",
      entityId: id,
      oldValues: existing,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Exclusão da conta do Plano de Contas: ${existing.code} - ${existing.name}`,
    });

    return NextResponse.json({ success: true, message: "Conta contábil excluída com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir conta contábil:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir conta" }, { status: 500 });
  }
}
