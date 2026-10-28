import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemType = searchParams.get("type"); // MATERIA_PRIMA, EMBALAGEM, PRODUTO_ACABADO, ALL

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

    const lowStockRaw = rawMaterials.filter((m) => Number(m.currentStock) <= Number(m.minStock));
    const lowStockPack = packagings.filter((p) => p.currentStock <= p.minStock);
    const lowStockProd = products.filter((pr) => pr.stockQuantity <= pr.minStockQuantity);

    const totalRawValue = rawMaterials.reduce(
      (acc, m) => acc + Number(m.currentStock) * Number(m.unitCost),
      0
    );
    const totalPackValue = packagings.reduce(
      (acc, p) => acc + p.currentStock * Number(p.unitCost),
      0
    );
    const totalProdValue = products.reduce(
      (acc, pr) => acc + pr.stockQuantity * Number(pr.calculatedCost || pr.basePrice),
      0
    );

    return NextResponse.json({
      rawMaterials,
      packagings,
      products,
      alerts: {
        rawMaterials: lowStockRaw,
        packagings: lowStockPack,
        products: lowStockProd,
        totalAlerts: lowStockRaw.length + lowStockPack.length + lowStockProd.length,
      },
      summary: {
        totalRawValue,
        totalPackValue,
        totalProdValue,
        totalInventoryValue: totalRawValue + totalPackValue + totalProdValue,
      },
    });
  } catch (error: any) {
    console.error("Erro ao carregar estoque:", error);
    return NextResponse.json({ error: error.message || "Erro ao carregar estoque" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { itemType, name, code, category, unit = "UN", currentStock = 0, minStock = 5, unitCost = 0, supplierId, notes } = body;

    if (!itemType || !name || !name.trim()) {
      return NextResponse.json({ error: "Tipo de item e nome são obrigatórios" }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (itemType === "MATERIA_PRIMA") {
      const raw = await db.rawMaterial.create({
        data: {
          name: name.trim(),
          code: code?.trim() ? code.trim().toUpperCase() : null,
          category: category?.trim() || "GERAL",
          unit: unit.trim().toUpperCase(),
          currentStock: Number(currentStock),
          minStock: Number(minStock),
          unitCost: Number(unitCost),
          supplierId: supplierId || null,
          notes: notes?.trim() || null,
          isActive: true,
        },
        include: { supplier: true },
      });

      // Registra movimentação inicial se estoque > 0
      if (Number(currentStock) > 0) {
        await db.stockMovement.create({
          data: {
            itemType: "MATERIA_PRIMA",
            itemId: raw.id,
            itemName: raw.name,
            movementType: "ENTRADA",
            quantity: Number(currentStock),
            unit: raw.unit,
            unitCost: Number(unitCost),
            totalCost: Number(currentStock) * Number(unitCost),
            origin: "INVENTARIO",
            notes: "Saldo inicial de implantação",
            userId: user.id,
          },
        });
      }

      await logAudit({
        userId: user.id,
        action: "CREATE",
        entity: "RawMaterial",
        entityId: raw.id,
        newValues: raw,
        ipAddress,
        description: `Cadastrada matéria-prima: ${raw.name} (${raw.unit})`,
      });

      return NextResponse.json({ success: true, item: raw });
    }

    if (itemType === "EMBALAGEM") {
      const pack = await db.packaging.create({
        data: {
          name: name.trim(),
          code: code?.trim() ? code.trim().toUpperCase() : null,
          unit: unit.trim().toUpperCase() || "UN",
          currentStock: parseInt(currentStock, 10) || 0,
          minStock: parseInt(minStock, 10) || 10,
          unitCost: Number(unitCost) || 0,
          supplierId: supplierId || null,
          notes: notes?.trim() || null,
          isActive: true,
        },
        include: { supplier: true },
      });

      if (parseInt(currentStock, 10) > 0) {
        await db.stockMovement.create({
          data: {
            itemType: "EMBALAGEM",
            itemId: pack.id,
            itemName: pack.name,
            movementType: "ENTRADA",
            quantity: parseInt(currentStock, 10),
            unit: pack.unit,
            unitCost: Number(unitCost),
            totalCost: parseInt(currentStock, 10) * Number(unitCost),
            origin: "INVENTARIO",
            notes: "Saldo inicial de implantação",
            userId: user.id,
          },
        });
      }

      await logAudit({
        userId: user.id,
        action: "CREATE",
        entity: "Packaging",
        entityId: pack.id,
        newValues: pack,
        ipAddress,
        description: `Cadastrada embalagem: ${pack.name} (${pack.unit})`,
      });

      return NextResponse.json({ success: true, item: pack });
    }

    return NextResponse.json({ error: "Tipo de item inválido" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao criar item de estoque:", error);
    return NextResponse.json({ error: error.message || "Erro ao salvar item" }, { status: 500 });
  }
}
