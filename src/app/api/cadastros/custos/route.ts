import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawMaterials = await db.rawMaterial.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    });

    const packagings = await db.packaging.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    });

    const products = await db.product.findMany({
      include: { categoryRef: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      rawMaterials,
      packagings,
      products,
    });
  } catch (error: any) {
    console.error("Erro ao carregar controle de custos:", error);
    return NextResponse.json({ error: error.message || "Erro ao carregar dados" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { type, id, unitCost, basePrice, desiredMargin } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "Tipo e ID são obrigatórios" }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (type === "RAW_MATERIAL") {
      const existing = await db.rawMaterial.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Matéria-prima não encontrada" }, { status: 404 });

      const updated = await db.rawMaterial.update({
        where: { id },
        data: { unitCost: Number(unitCost) || 0 },
      });

      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "RawMaterial",
        entityId: id,
        oldValues: { unitCost: existing.unitCost },
        newValues: { unitCost: updated.unitCost },
        ipAddress,
        description: `Atualizado custo unitário de insumo "${updated.name}" de R$ ${existing.unitCost} para R$ ${updated.unitCost}`,
      });

      return NextResponse.json({ success: true, item: updated });
    }

    if (type === "PACKAGING") {
      const existing = await db.packaging.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Embalagem não encontrada" }, { status: 404 });

      const updated = await db.packaging.update({
        where: { id },
        data: { unitCost: Number(unitCost) || 0 },
      });

      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "Packaging",
        entityId: id,
        oldValues: { unitCost: existing.unitCost },
        newValues: { unitCost: updated.unitCost },
        ipAddress,
        description: `Atualizado custo unitário de embalagem "${updated.name}" de R$ ${existing.unitCost} para R$ ${updated.unitCost}`,
      });

      return NextResponse.json({ success: true, item: updated });
    }

    if (type === "PRODUCT") {
      const existing = await db.product.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

      const updated = await db.product.update({
        where: { id },
        data: {
          basePrice: basePrice !== undefined ? Number(basePrice) : existing.basePrice,
          desiredMargin: desiredMargin !== undefined ? Number(desiredMargin) : existing.desiredMargin,
        },
      });

      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "Product",
        entityId: id,
        oldValues: { basePrice: existing.basePrice, desiredMargin: existing.desiredMargin },
        newValues: { basePrice: updated.basePrice, desiredMargin: updated.desiredMargin },
        ipAddress,
        description: `Atualizado preço/margem do produto "${updated.name}" no controle de custos`,
      });

      return NextResponse.json({ success: true, item: updated });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao atualizar custo:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar" }, { status: 500 });
  }
}
