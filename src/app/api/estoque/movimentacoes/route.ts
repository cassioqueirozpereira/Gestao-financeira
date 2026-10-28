import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemType = searchParams.get("itemType");
    const movementType = searchParams.get("movementType");
    const origin = searchParams.get("origin");

    const where: any = {};
    if (itemType && itemType !== "TODOS") where.itemType = itemType;
    if (movementType && movementType !== "TODOS") where.movementType = movementType;
    if (origin && origin !== "TODOS") where.origin = origin;

    const movements = await db.stockMovement.findMany({
      where,
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json({ movements });
  } catch (error: any) {
    console.error("Erro ao listar movimentações de estoque:", error);
    return NextResponse.json({ error: error.message || "Erro ao buscar movimentações" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      itemType, // MATERIA_PRIMA, EMBALAGEM, PRODUTO_ACABADO
      itemId,
      movementType, // ENTRADA, SAIDA, AJUSTE, PERDA
      quantity,
      inputUnit, // g, kg, ml, L, UN
      unitCost,
      origin = "MANUAL", // MANUAL, PERDA, AJUSTE, INVENTARIO
      documentReference,
      notes,
    } = body;

    if (!itemType || !itemId || !movementType || quantity === undefined) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const numQty = Number(quantity);
    if (numQty <= 0 && movementType !== "AJUSTE") {
      return NextResponse.json({ error: "A quantidade deve ser maior que zero" }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await db.$transaction(async (tx) => {
      let itemName = "";
      let targetUnit = "";
      let convertedQty = numQty;
      let effectiveUnitCost = Number(unitCost) || 0;

      if (itemType === "MATERIA_PRIMA") {
        const raw = await tx.rawMaterial.findUnique({ where: { id: itemId } });
        if (!raw) throw new Error("Matéria-prima não encontrada");

        itemName = raw.name;
        targetUnit = raw.unit;
        effectiveUnitCost = effectiveUnitCost || Number(raw.unitCost);

        // Conversão automática: g -> kg se o item estiver em kg
        if (raw.unit.toUpperCase() === "KG" && inputUnit?.toUpperCase() === "G") {
          convertedQty = numQty / 1000;
        } else if (raw.unit.toUpperCase() === "G" && inputUnit?.toUpperCase() === "KG") {
          convertedQty = numQty * 1000;
        }
        // Conversão automática: ml -> L se o item estiver em L
        else if (raw.unit.toUpperCase() === "L" && inputUnit?.toUpperCase() === "ML") {
          convertedQty = numQty / 1000;
        } else if (raw.unit.toUpperCase() === "ML" && inputUnit?.toUpperCase() === "L") {
          convertedQty = numQty * 1000;
        }

        let newStock = Number(raw.currentStock);
        if (movementType === "ENTRADA") {
          newStock += convertedQty;
        } else if (movementType === "SAIDA" || movementType === "PERDA") {
          if (newStock < convertedQty) {
            throw new Error(`Saldo insuficiente. Estoque atual: ${raw.currentStock} ${raw.unit}`);
          }
          newStock -= convertedQty;
        } else if (movementType === "AJUSTE") {
          newStock = convertedQty;
        }

        await tx.rawMaterial.update({
          where: { id: itemId },
          data: { currentStock: newStock },
        });
      } else if (itemType === "EMBALAGEM") {
        const pack = await tx.packaging.findUnique({ where: { id: itemId } });
        if (!pack) throw new Error("Embalagem não encontrada");

        itemName = pack.name;
        targetUnit = pack.unit;
        effectiveUnitCost = effectiveUnitCost || Number(pack.unitCost);
        convertedQty = Math.round(numQty);

        let newStock = pack.currentStock;
        if (movementType === "ENTRADA") {
          newStock += convertedQty;
        } else if (movementType === "SAIDA" || movementType === "PERDA") {
          if (newStock < convertedQty) {
            throw new Error(`Saldo insuficiente de embalagens. Estoque atual: ${pack.currentStock} ${pack.unit}`);
          }
          newStock -= convertedQty;
        } else if (movementType === "AJUSTE") {
          newStock = convertedQty;
        }

        await tx.packaging.update({
          where: { id: itemId },
          data: { currentStock: newStock },
        });
      } else if (itemType === "PRODUTO_ACABADO") {
        const prod = await tx.product.findUnique({ where: { id: itemId } });
        if (!prod) throw new Error("Produto não encontrado");

        itemName = prod.name;
        targetUnit = "UN";
        effectiveUnitCost = effectiveUnitCost || Number(prod.calculatedCost || prod.basePrice);
        convertedQty = Math.round(numQty);

        let newStock = prod.stockQuantity;
        if (movementType === "ENTRADA") {
          newStock += convertedQty;
        } else if (movementType === "SAIDA" || movementType === "PERDA") {
          if (newStock < convertedQty) {
            throw new Error(`Saldo insuficiente de produtos acabados. Estoque atual: ${prod.stockQuantity} un`);
          }
          newStock -= convertedQty;
        } else if (movementType === "AJUSTE") {
          newStock = convertedQty;
        }

        await tx.product.update({
          where: { id: itemId },
          data: { stockQuantity: newStock },
        });
      } else {
        throw new Error("Tipo de item inválido");
      }

      const totalCost = convertedQty * effectiveUnitCost;

      const movement = await tx.stockMovement.create({
        data: {
          itemType,
          itemId,
          itemName,
          movementType,
          quantity: convertedQty,
          unit: targetUnit,
          unitCost: effectiveUnitCost,
          totalCost,
          origin,
          documentReference: documentReference?.trim() || null,
          notes: notes?.trim() || null,
          userId: user.id,
        },
      });

      return movement;
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "StockMovement",
      entityId: result.id,
      newValues: result,
      ipAddress,
      description: `Movimentação de estoque: ${result.movementType} de ${result.quantity} ${result.unit} de "${result.itemName}" (${result.origin})`,
    });

    return NextResponse.json({ success: true, movement: result });
  } catch (error: any) {
    console.error("Erro ao registrar movimentação de estoque:", error);
    return NextResponse.json({ error: error.message || "Erro ao registrar movimentação" }, { status: 400 });
  }
}
