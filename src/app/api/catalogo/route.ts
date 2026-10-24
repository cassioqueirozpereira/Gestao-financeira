import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: [{ category: "asc" }, { basePrice: "asc" }],
    });
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, name, basePrice, calculatedCost, desiredMargin, stockQuantity, description } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    const updated = await db.product.update({
      where: { id },
      data: {
        name: name || existing.name,
        basePrice: basePrice !== undefined ? Number(basePrice) : existing.basePrice,
        calculatedCost: calculatedCost !== undefined ? Number(calculatedCost) : existing.calculatedCost,
        desiredMargin: desiredMargin !== undefined ? Number(desiredMargin) : existing.desiredMargin,
        stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity, 10) : existing.stockQuantity,
        description: description !== undefined ? description : existing.description,
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Product",
      entityId: id,
      newValues: {
        oldPrice: existing.basePrice,
        newPrice: updated.basePrice,
        calculatedCost: updated.calculatedCost,
        desiredMargin: updated.desiredMargin,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Atualização de preço e cálculo de margem do produto: ${updated.name}`,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
