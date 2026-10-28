import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await db.product.findMany({
      include: {
        categoryRef: true,
      },
      orderBy: [{ category: "asc" }, { basePrice: "asc" }],
    });
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      category = "VELAS_NORMAIS_COLORIDAS",
      categoryId = null,
      basePrice = 0,
      calculatedCost = 0,
      desiredMargin = 30,
      stockQuantity = 0,
      minStockQuantity = 5,
      description = "",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome do produto é obrigatório" }, { status: 400 });
    }

    const newProduct = await db.product.create({
      data: {
        name: name.trim(),
        category,
        categoryId: categoryId || null,
        basePrice: Number(basePrice) || 0,
        calculatedCost: Number(calculatedCost) || 0,
        desiredMargin: Number(desiredMargin) || 30,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        minStockQuantity: parseInt(minStockQuantity, 10) || 5,
        description: description || null,
      },
      include: {
        categoryRef: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Product",
      entityId: newProduct.id,
      newValues: { name: newProduct.name, category: newProduct.category, categoryId: newProduct.categoryId, basePrice: newProduct.basePrice },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Inclusão de novo item no catálogo: ${newProduct.name}`,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, name, category, categoryId, basePrice, calculatedCost, desiredMargin, stockQuantity, minStockQuantity, description } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    const updated = await db.product.update({
      where: { id },
      data: {
        name: name || existing.name,
        category: category !== undefined ? category : existing.category,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        basePrice: basePrice !== undefined ? Number(basePrice) : existing.basePrice,
        calculatedCost: calculatedCost !== undefined ? Number(calculatedCost) : existing.calculatedCost,
        desiredMargin: desiredMargin !== undefined ? Number(desiredMargin) : existing.desiredMargin,
        stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity, 10) : existing.stockQuantity,
        minStockQuantity: minStockQuantity !== undefined ? parseInt(minStockQuantity, 10) : existing.minStockQuantity,
        description: description !== undefined ? description : existing.description,
      },
      include: {
        categoryRef: true,
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
