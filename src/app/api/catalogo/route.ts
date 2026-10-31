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

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      category = "VELAS_NORMAIS_COLORIDAS",
      basePrice = 0,
      calculatedCost = 0,
      desiredMargin = 30,
      stockQuantity = 0,
      minStockQuantity = 5,
      description = "",
      items = [],
      packagingItems = [],
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome do produto é obrigatório" }, { status: 400 });
    }

    let newProduct: any;
    try {
      newProduct = await db.product.create({
        data: {
          name: name.trim(),
          category,
          basePrice: Number(basePrice) || 0,
          calculatedCost: Number(calculatedCost) || 0,
          desiredMargin: Number(desiredMargin) || 30,
          stockQuantity: parseInt(stockQuantity, 10) || 0,
          minStockQuantity: parseInt(minStockQuantity, 10) || 5,
          description: description || null,
        },
      });
    } catch (err: any) {
      // Se falhar devido à coluna category ainda ser um ENUM restrito no PostgreSQL, converte para TEXT e retenta
      try {
        await db.$executeRawUnsafe(`ALTER TABLE "products" ALTER COLUMN "category" TYPE TEXT;`);
        newProduct = await db.product.create({
          data: {
            name: name.trim(),
            category,
            basePrice: Number(basePrice) || 0,
            calculatedCost: Number(calculatedCost) || 0,
            desiredMargin: Number(desiredMargin) || 30,
            stockQuantity: parseInt(stockQuantity, 10) || 0,
            minStockQuantity: parseInt(minStockQuantity, 10) || 5,
            description: description || null,
          },
        });
      } catch (retryErr: any) {
        throw new Error(retryErr.message || err.message);
      }
    }

    // Se foram informados itens de matéria-prima ou embalagens, cria a ficha técnica inicial vinculada
    if ((Array.isArray(items) && items.length > 0) || (Array.isArray(packagingItems) && packagingItems.length > 0)) {
      try {
        await db.technicalSheet.create({
          data: {
            productId: newProduct.id,
            version: 1,
            expectedYield: 1,
            wastePercentage: 5,
            laborCostEstimated: 0,
            energyCostEstimated: 0,
            gasCostEstimated: 0,
            notes: JSON.stringify({
              calculatedAt: new Date().toISOString(),
              createdViaCatalog: true,
            }),
            items: {
              create: items
                .filter((it: any) => it.rawMaterialId && Number(it.quantity) > 0)
                .map((it: any) => ({
                  rawMaterialId: it.rawMaterialId,
                  quantity: Number(it.quantity) || 0,
                })),
            },
            packagingItems: {
              create: packagingItems
                .filter((pit: any) => pit.packagingId && Number(pit.quantity) > 0)
                .map((pit: any) => ({
                  packagingId: pit.packagingId,
                  quantity: parseInt(pit.quantity, 10) || 1,
                })),
            },
          },
        });
      } catch (sheetErr) {
        console.warn("Aviso ao criar ficha técnica inicial:", sheetErr);
      }
    }

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Product",
      entityId: newProduct.id,
      newValues: { name: newProduct.name, category: newProduct.category, basePrice: newProduct.basePrice },
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
    const { id, name, category, basePrice, calculatedCost, desiredMargin, stockQuantity, minStockQuantity, description } = body;

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    let updated: any;
    try {
      updated = await db.product.update({
        where: { id },
        data: {
          name: name || existing.name,
          category: category !== undefined ? category : existing.category,
          basePrice: basePrice !== undefined ? Number(basePrice) : existing.basePrice,
          calculatedCost: calculatedCost !== undefined ? Number(calculatedCost) : existing.calculatedCost,
          desiredMargin: desiredMargin !== undefined ? Number(desiredMargin) : existing.desiredMargin,
          stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity, 10) : existing.stockQuantity,
          minStockQuantity: minStockQuantity !== undefined ? parseInt(minStockQuantity, 10) : existing.minStockQuantity,
          description: description !== undefined ? description : existing.description,
        },
      });
    } catch (err: any) {
      try {
        await db.$executeRawUnsafe(`ALTER TABLE "products" ALTER COLUMN "category" TYPE TEXT;`);
        updated = await db.product.update({
          where: { id },
          data: {
            name: name || existing.name,
            category: category !== undefined ? category : existing.category,
            basePrice: basePrice !== undefined ? Number(basePrice) : existing.basePrice,
            calculatedCost: calculatedCost !== undefined ? Number(calculatedCost) : existing.calculatedCost,
            desiredMargin: desiredMargin !== undefined ? Number(desiredMargin) : existing.desiredMargin,
            stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity, 10) : existing.stockQuantity,
            minStockQuantity: minStockQuantity !== undefined ? parseInt(minStockQuantity, 10) : existing.minStockQuantity,
            description: description !== undefined ? description : existing.description,
          },
        });
      } catch (retryErr: any) {
        throw new Error(retryErr.message || err.message);
      }
    }

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

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do produto não informado" }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Verifica se possui vendas vinculadas
    const orderItemsCount = await db.orderItem.count({
      where: { productId: id },
    });

    if (orderItemsCount > 0) {
      return NextResponse.json(
        {
          error: `Este produto possui ${orderItemsCount} venda(s) registrada(s) no sistema e não pode ser excluído para não corromper o histórico fiscal e de vendas.`,
        },
        { status: 400 }
      );
    }

    // Desvincula de ordens de produção se houver
    await db.productionOrder.updateMany({
      where: { productId: id },
      data: { productId: null },
    });

    // Remove fichas técnicas vinculadas se houver
    await db.technicalSheetPackaging.deleteMany({
      where: { technicalSheet: { productId: id } },
    });
    await db.technicalSheetItem.deleteMany({
      where: { technicalSheet: { productId: id } },
    });
    await db.technicalSheet.deleteMany({
      where: { productId: id },
    });

    // Remove o produto do catálogo
    await db.product.delete({
      where: { id },
    });

    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "Product",
      entityId: id,
      newValues: { name: product.name, category: product.category, basePrice: product.basePrice },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      description: `Exclusão de produto do catálogo: ${product.name}`,
    });

    return NextResponse.json({
      success: true,
      message: `Produto "${product.name}" excluído com sucesso.`,
    });
  } catch (error: any) {
    console.error("Erro ao excluir produto do catálogo:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir produto" }, { status: 500 });
  }
}
