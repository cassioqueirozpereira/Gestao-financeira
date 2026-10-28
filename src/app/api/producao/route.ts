import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await db.productionOrder.findMany({
      include: {
        product: {
          include: { categoryRef: true },
        },
        ingredientConsumptions: {
          include: { rawMaterial: true },
        },
        packagingConsumptions: {
          include: { packaging: true },
        },
      },
      orderBy: { productionDate: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("Erro ao listar produção:", error);
    return NextResponse.json({ error: "Erro ao buscar produção" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      batchNumber,
      productId, // Compatibilidade com chamada simples
      producedProducts = [], // Array de múltiplos modelos: [{ productId, quantity }]
      costCenter = "VELAS",
      quantityProduced = 1,
      materialCost = 0,
      packagingCost = 0,
      gasCost = 0.20,
      energyCost = 0.45,
      laborCost = 60.00,
      notes,
      ingredientConsumptions = [], // [{ rawMaterialId, quantityUsed, unit, unitCost }]
      packagingConsumptions = [], // [{ packagingId, quantityUsed, unitCost }]
    } = body;

    if (!batchNumber || !batchNumber.trim()) {
      return NextResponse.json({ error: "Número do lote é obrigatório" }, { status: 400 });
    }

    // Calcula unidades totais considerando múltiplos modelos ou quantidade única
    let units = Math.max(1, parseInt(quantityProduced, 10) || 1);
    if (producedProducts && Array.isArray(producedProducts) && producedProducts.length > 0) {
      const sumUnits = producedProducts.reduce((acc: number, p: any) => acc + (Number(p.quantity) || 0), 0);
      if (sumUnits > 0) units = sumUnits;
    }

    const totalCost = Number(materialCost) + Number(packagingCost) + Number(gasCost) + Number(energyCost) + Number(laborCost);
    const unitCost = Number((totalCost / units).toFixed(2));

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Produto principal de referência da ordem
    const mainProductId = (producedProducts && producedProducts[0]?.productId) || productId || null;

    const result = await db.$transaction(async (tx) => {
      // 1. Cria a Ordem de Produção
      const order = await tx.productionOrder.create({
        data: {
          batchNumber: batchNumber.trim(),
          productId: mainProductId,
          costCenter,
          quantityProduced: units,
          materialCost: Number(materialCost),
          packagingCost: Number(packagingCost),
          gasCost: Number(gasCost),
          energyCost: Number(energyCost),
          laborCost: Number(laborCost),
          totalCost: Number(totalCost),
          unitCost: Number(unitCost),
          notes: notes?.trim() || null,
          isConfirmed: true,
          productionDate: new Date(),
        },
      });

      // 2. Registra consumo e baixa de matérias-primas
      for (const ing of ingredientConsumptions) {
        if (!ing.rawMaterialId || !ing.quantityUsed) continue;

        const raw = await tx.rawMaterial.findUnique({ where: { id: ing.rawMaterialId } });
        if (!raw) continue;

        const rawQty = Number(ing.quantityUsed);
        let convertedQty = rawQty;

        // Conversão automática: se raw está em KG e input foi em G
        if (raw.unit.toUpperCase() === "KG" && ing.unit?.toUpperCase() === "G") {
          convertedQty = rawQty / 1000;
        } else if (raw.unit.toUpperCase() === "G" && ing.unit?.toUpperCase() === "KG") {
          convertedQty = rawQty * 1000;
        }
        // Conversão automática: se raw está em L e input foi em ML
        else if (raw.unit.toUpperCase() === "L" && ing.unit?.toUpperCase() === "ML") {
          convertedQty = rawQty / 1000;
        } else if (raw.unit.toUpperCase() === "ML" && ing.unit?.toUpperCase() === "L") {
          convertedQty = rawQty * 1000;
        }

        const ingUnitCost = Number(ing.unitCost || raw.unitCost);
        const ingTotalCost = convertedQty * ingUnitCost;

        await tx.productionIngredientConsumption.create({
          data: {
            productionOrderId: order.id,
            rawMaterialId: raw.id,
            quantityUsed: convertedQty,
            unit: raw.unit,
            unitCost: ingUnitCost,
            totalCost: ingTotalCost,
          },
        });

        // Deduz do estoque de matéria-prima
        const newRawStock = Math.max(0, Number(raw.currentStock) - convertedQty);
        await tx.rawMaterial.update({
          where: { id: raw.id },
          data: { currentStock: newRawStock },
        });

        // Registra movimentação de saída
        await tx.stockMovement.create({
          data: {
            itemType: "MATERIA_PRIMA",
            itemId: raw.id,
            itemName: raw.name,
            movementType: "SAIDA",
            quantity: convertedQty,
            unit: raw.unit,
            unitCost: ingUnitCost,
            totalCost: ingTotalCost,
            origin: "PRODUCAO",
            batchNumber: order.batchNumber,
            documentReference: `Lote ${order.batchNumber}`,
            notes: `Consumo na fabricação de ${units} un do lote ${order.batchNumber}`,
            userId: user.id,
          },
        });
      }

      // 3. Registra consumo e baixa de embalagens
      for (const packItem of packagingConsumptions) {
        if (!packItem.packagingId || !packItem.quantityUsed) continue;

        const pack = await tx.packaging.findUnique({ where: { id: packItem.packagingId } });
        if (!pack) continue;

        const packQty = Math.round(Number(packItem.quantityUsed));
        const packUnitCost = Number(packItem.unitCost || pack.unitCost);
        const packTotalCost = packQty * packUnitCost;

        await tx.productionPackagingConsumption.create({
          data: {
            productionOrderId: order.id,
            packagingId: pack.id,
            quantityUsed: packQty,
            unitCost: packUnitCost,
            totalCost: packTotalCost,
          },
        });

        // Deduz do estoque de embalagens
        const newPackStock = Math.max(0, pack.currentStock - packQty);
        await tx.packaging.update({
          where: { id: pack.id },
          data: { currentStock: newPackStock },
        });

        // Registra movimentação de saída
        await tx.stockMovement.create({
          data: {
            itemType: "EMBALAGEM",
            itemId: pack.id,
            itemName: pack.name,
            movementType: "SAIDA",
            quantity: packQty,
            unit: pack.unit,
            unitCost: packUnitCost,
            totalCost: packTotalCost,
            origin: "PRODUCAO",
            batchNumber: order.batchNumber,
            documentReference: `Lote ${order.batchNumber}`,
            notes: `Consumo de embalagem no lote ${order.batchNumber}`,
            userId: user.id,
          },
        });
      }

      // 4. Incrementa o estoque e gera movimentação para cada modelo produzido no lote
      if (producedProducts && Array.isArray(producedProducts) && producedProducts.length > 0) {
        for (const prodItem of producedProducts) {
          if (!prodItem.productId || !prodItem.quantity) continue;
          const prod = await tx.product.findUnique({ where: { id: prodItem.productId } });
          if (prod) {
            const qty = Number(prodItem.quantity);
            const newProdStock = prod.stockQuantity + qty;
            await tx.product.update({
              where: { id: prodItem.productId },
              data: {
                stockQuantity: newProdStock,
                calculatedCost: unitCost,
              },
            });

            // Registra movimentação de entrada para este modelo
            await tx.stockMovement.create({
              data: {
                itemType: "PRODUTO_ACABADO",
                itemId: prod.id,
                itemName: prod.name,
                movementType: "ENTRADA",
                quantity: qty,
                unit: "UN",
                unitCost,
                totalCost: qty * unitCost,
                origin: "PRODUCAO",
                batchNumber: order.batchNumber,
                documentReference: `Lote ${order.batchNumber}`,
                notes: `Produção concluída de ${qty} unidades do modelo "${prod.name}" no lote ${order.batchNumber}`,
                userId: user.id,
              },
            });
          }
        }
      } else if (productId) {
        // Fallback para produção de modelo único
        const prod = await tx.product.findUnique({ where: { id: productId } });
        if (prod) {
          const newProdStock = prod.stockQuantity + units;
          await tx.product.update({
            where: { id: productId },
            data: {
              stockQuantity: newProdStock,
              calculatedCost: unitCost,
            },
          });

          // Registra movimentação de entrada de produto acabado
          await tx.stockMovement.create({
            data: {
              itemType: "PRODUTO_ACABADO",
              itemId: prod.id,
              itemName: prod.name,
              movementType: "ENTRADA",
              quantity: units,
              unit: "UN",
              unitCost,
              totalCost,
              origin: "PRODUCAO",
              batchNumber: order.batchNumber,
              documentReference: `Lote ${order.batchNumber}`,
              notes: `Produção concluída de ${units} unidades do lote ${order.batchNumber}`,
              userId: user.id,
            },
          });
        }
      }

      return order;
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "ProductionOrder",
      entityId: result.id,
      newValues: { batchNumber, totalCost, unitCost, quantityProduced: units },
      ipAddress,
      description: `Registrado lote de produção ${result.batchNumber} com custo total de R$ ${totalCost.toFixed(2)} (R$ ${unitCost.toFixed(2)}/un). Estoque atualizado automaticamente.`,
    });

    return NextResponse.json({ success: true, order: result });
  } catch (error: any) {
    console.error("Erro ao criar ordem de produção com consumo real:", error);
    return NextResponse.json({ error: error.message || "Erro ao registrar lote" }, { status: 500 });
  }
}
