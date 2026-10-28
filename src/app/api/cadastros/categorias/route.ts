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
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const categories = await db.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("Erro ao listar categorias:", error);
    return NextResponse.json({ error: error.message || "Erro ao listar categorias" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { name, code, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "O nome da categoria é obrigatório" }, { status: 400 });
    }

    // Verifica duplicidade de nome
    const existingName = await db.category.findUnique({
      where: { name: name.trim() },
    });
    if (existingName) {
      return NextResponse.json({ error: "Já existe uma categoria cadastrada com este nome" }, { status: 400 });
    }

    // Verifica duplicidade de código se informado
    if (code && code.trim()) {
      const existingCode = await db.category.findUnique({
        where: { code: code.trim().toUpperCase() },
      });
      if (existingCode) {
        return NextResponse.json({ error: "Já existe uma categoria com este código" }, { status: 400 });
      }
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        code: code?.trim() ? code.trim().toUpperCase() : null,
        description: description?.trim() || null,
        isActive: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Category",
      entityId: category.id,
      newValues: category,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Criação da categoria oficial: ${category.name}`,
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar categoria" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, name, code, description, isActive } = body;

    if (!id) return NextResponse.json({ error: "ID da categoria obrigatório" }, { status: 400 });

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });

    // Verifica duplicidade se alterou o nome
    if (name && name.trim() !== existing.name) {
      const duplicate = await db.category.findUnique({ where: { name: name.trim() } });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: "Já existe uma categoria cadastrada com este nome" }, { status: 400 });
      }
    }

    // Verifica duplicidade se alterou o código
    if (code && code.trim().toUpperCase() !== existing.code) {
      const duplicateCode = await db.category.findUnique({ where: { code: code.trim().toUpperCase() } });
      if (duplicateCode && duplicateCode.id !== id) {
        return NextResponse.json({ error: "Já existe uma categoria com este código" }, { status: 400 });
      }
    }

    const updated = await db.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        code: code !== undefined ? (code.trim() ? code.trim().toUpperCase() : null) : existing.code,
        description: description !== undefined ? (description.trim() || null) : existing.description,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Category",
      entityId: id,
      newValues: updated,
      oldValues: existing,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Atualização da categoria oficial: ${updated.name} (Ativa: ${updated.isActive})`,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar categoria" }, { status: 500 });
  }
}
