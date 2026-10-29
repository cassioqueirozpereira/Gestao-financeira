import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  convertUnit,
  getItemCostData,
  getOperationalRates,
  calculateChannelPricing,
} from "@/lib/technical-sheet-calculator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "ID do produto é obrigatório" }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        technicalSheets: {
          include: {
            items: { include: { rawMaterial: true } },
            packagingItems: { include: { packaging: true } },
          },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // 1. Busca todas as matérias-primas e embalagens ativas
    const [allRawMaterials, allPackagings] = await Promise.all([
      db.rawMaterial.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      db.packaging.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // 2. Busca dados de compras e custo médio ponderado de cada matéria-prima
    const rawMaterialsWithCost = await Promise.all(
      allRawMaterials.map(async (raw) => {
        const costData = await getItemCostData(raw.id, "MATERIA_PRIMA");
        return {
          ...raw,
          currentStock: Number(raw.currentStock) || 0,
          costData,
        };
      })
    );

    // 3. Busca dados de compras e custo médio ponderado de cada embalagem
    const packagingsWithCost = await Promise.all(
      allPackagings.map(async (pack) => {
        const costData = await getItemCostData(pack.id, "EMBALAGEM");
        return {
          ...pack,
          currentStock: Number(pack.currentStock) || 0,
          costData,
        };
      })
    );

    // 4. Busca tarifas e rateios operacionais reais do Financeiro
    const operationalRates = await getOperationalRates();

    // 5. Recupera a Ficha Técnica atual ou cria valores padrão
    let sheet = product.technicalSheets[0];
    let sheetNotes: any = {};
    if (sheet?.notes) {
      try {
        sheetNotes = JSON.parse(sheet.notes);
      } catch {
        sheetNotes = { text: sheet.notes };
      }
    }

    const expectedYield = sheet?.expectedYield || 1;
    const wastePercentage = Number(sheet?.wastePercentage || 5.0);
    const preparationMinutes = sheetNotes.preparationMinutes !== undefined ? Number(sheetNotes.preparationMinutes) : 20;
    const equipmentMinutes = sheetNotes.equipmentMinutes !== undefined ? Number(sheetNotes.equipmentMinutes) : 15;
    const gasMinutes = sheetNotes.gasMinutes !== undefined ? Number(sheetNotes.gasMinutes) : 15;
    const laborHourlyRate = sheetNotes.laborHourlyRate !== undefined ? Number(sheetNotes.laborHourlyRate) : operationalRates.defaultLaborHourlyRate;

    // 6. Mapeia itens salvos da ficha técnica com seus custos reais
    const items = (sheet?.items || []).map((it) => {
      const rawCost = rawMaterialsWithCost.find((r) => r.id === it.rawMaterialId);
      const savedUnit = sheetNotes.itemUnits?.[it.id] || sheetNotes.itemUnits?.[it.rawMaterialId] || rawCost?.unit || "G";
      const savedInputQty = sheetNotes.itemInputQtys?.[it.id] || sheetNotes.itemInputQtys?.[it.rawMaterialId] || Number(it.quantity);

      // Converte para a unidade base da matéria-prima
      const baseUnit = rawCost?.unit || "KG";
      const { convertedQuantity } = convertUnit(savedInputQty, savedUnit, baseUnit);
      const unitCost = rawCost?.costData.unitCost || 0;
      const proportionalCost = convertedQuantity * unitCost;

      return {
        id: it.id,
        rawMaterialId: it.rawMaterialId,
        rawMaterialName: rawCost?.name || it.rawMaterial.name,
        inputQuantity: savedInputQty,
        inputUnit: savedUnit,
        baseUnit,
        convertedQuantity: Number(convertedQuantity.toFixed(4)),
        unitCost,
        costingMethod: rawCost?.costData.costingMethod || "SEM_CUSTO",
        hasRealPurchases: rawCost?.costData.hasRealPurchases || false,
        totalPurchasedQuantity: rawCost?.costData.totalPurchasedQuantity || 0,
        purchasesHistory: rawCost?.costData.purchasesHistory || [],
        proportionalCost: Number(proportionalCost.toFixed(4)),
        currentStock: rawCost?.currentStock || 0,
        warning: rawCost?.costData.warning,
      };
    });

    const packagingItems = (sheet?.packagingItems || []).map((pit) => {
      const packCost = packagingsWithCost.find((p) => p.id === pit.packagingId);
      const qty = pit.quantity || 1;
      const unitCost = packCost?.costData.unitCost || 0;
      const proportionalCost = qty * unitCost;

      return {
        id: pit.id,
        packagingId: pit.packagingId,
        packagingName: packCost?.name || pit.packaging.name,
        quantity: qty,
        unit: packCost?.unit || "UN",
        unitCost,
        costingMethod: packCost?.costData.costingMethod || "SEM_CUSTO",
        hasRealPurchases: packCost?.costData.hasRealPurchases || false,
        purchasesHistory: packCost?.costData.purchasesHistory || [],
        proportionalCost: Number(proportionalCost.toFixed(4)),
        currentStock: packCost?.currentStock || 0,
        warning: packCost?.costData.warning,
      };
    });

    // 7. Cálculos de Totais
    const rawMaterialsSubtotal = items.reduce((acc, it) => acc + it.proportionalCost, 0);
    const packagingSubtotal = packagingItems.reduce((acc, it) => acc + it.proportionalCost, 0);
    const wasteAmount = (rawMaterialsSubtotal + packagingSubtotal) * (wastePercentage / 100);
    const directMaterialsTotal = rawMaterialsSubtotal + packagingSubtotal + wasteAmount;

    // Custos Operacionais
    const laborTotal = (preparationMinutes / 60) * laborHourlyRate;
    const energyTotal = (equipmentMinutes / 60) * operationalRates.energyHourlyRate;
    const gasTotal = (gasMinutes / 60) * operationalRates.gasHourlyRate;
    const operationalTotal = laborTotal + energyTotal + gasTotal;

    // Custo Total do Lote e Unitário
    const batchTotalCost = directMaterialsTotal + operationalTotal;
    const unitCost = expectedYield > 0 ? batchTotalCost / expectedYield : batchTotalCost;

    const desiredMargin = Number(product.desiredMargin || 50);
    const channelPricing = calculateChannelPricing(unitCost, desiredMargin);

    const warnings: string[] = [];
    items.forEach((it) => {
      if (it.warning) warnings.push(it.warning);
    });
    packagingItems.forEach((it) => {
      if (it.warning) warnings.push(it.warning);
    });
    if (operationalRates.energyWarning) warnings.push(operationalRates.energyWarning);
    if (operationalRates.gasWarning) warnings.push(operationalRates.gasWarning);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        basePrice: Number(product.basePrice),
        calculatedCost: Number(product.calculatedCost),
        desiredMargin,
        stockQuantity: product.stockQuantity,
      },
      technicalSheet: {
        id: sheet?.id || null,
        expectedYield,
        wastePercentage,
        preparationMinutes,
        equipmentMinutes,
        gasMinutes,
        laborHourlyRate,
        items,
        packagingItems,
      },
      totals: {
        rawMaterialsSubtotal: Number(rawMaterialsSubtotal.toFixed(2)),
        packagingSubtotal: Number(packagingSubtotal.toFixed(2)),
        wasteAmount: Number(wasteAmount.toFixed(2)),
        directMaterialsTotal: Number(directMaterialsTotal.toFixed(2)),
        laborTotal: Number(laborTotal.toFixed(2)),
        energyTotal: Number(energyTotal.toFixed(2)),
        gasTotal: Number(gasTotal.toFixed(2)),
        operationalTotal: Number(operationalTotal.toFixed(2)),
        batchTotalCost: Number(batchTotalCost.toFixed(2)),
        unitCost: Number(unitCost.toFixed(2)),
      },
      channelPricing,
      operationalRates,
      availableRawMaterials: rawMaterialsWithCost,
      availablePackagings: packagingsWithCost,
      warnings,
    });
  } catch (error: any) {
    console.error("Erro ao buscar ficha técnica:", error);
    return NextResponse.json({ error: error.message || "Erro ao buscar ficha técnica" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      productId,
      expectedYield = 1,
      wastePercentage = 5.0,
      preparationMinutes = 20,
      equipmentMinutes = 15,
      gasMinutes = 15,
      laborHourlyRate = 20.0,
      items = [], // [{ rawMaterialId, inputQuantity, inputUnit }]
      packagingItems = [], // [{ packagingId, quantity }]
      desiredMargin = 50,
      applyToProduct = false,
    } = body;

    if (!productId) {
      return NextResponse.json({ error: "ID do produto é obrigatório" }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const operationalRates = await getOperationalRates();

    // 1. Processa cada item de matéria-prima e calcula custos
    const itemUnits: Record<string, string> = {};
    const itemInputQtys: Record<string, number> = {};
    let rawMaterialsSubtotal = 0;

    const processedItems: Array<{ rawMaterialId: string; quantity: number }> = [];

    for (const it of items) {
      if (!it.rawMaterialId || !it.inputQuantity) continue;
      const raw = await db.rawMaterial.findUnique({ where: { id: it.rawMaterialId } });
      if (!raw) continue;

      const inputQty = Number(it.inputQuantity);
      const inputUnit = it.inputUnit || raw.unit;
      itemUnits[it.rawMaterialId] = inputUnit;
      itemInputQtys[it.rawMaterialId] = inputQty;

      // Converte para unidade base do estoque
      const { convertedQuantity } = convertUnit(inputQty, inputUnit, raw.unit);
      const costData = await getItemCostData(raw.id, "MATERIA_PRIMA");
      const itemCost = convertedQuantity * costData.unitCost;
      rawMaterialsSubtotal += itemCost;

      // Salva a quantidade na unidade base no banco
      processedItems.push({
        rawMaterialId: raw.id,
        quantity: convertedQuantity,
      });
    }

    // 2. Processa embalagens
    let packagingSubtotal = 0;
    const processedPackagings: Array<{ packagingId: string; quantity: number }> = [];

    for (const pit of packagingItems) {
      if (!pit.packagingId || !pit.quantity) continue;
      const pack = await db.packaging.findUnique({ where: { id: pit.packagingId } });
      if (!pack) continue;

      const qty = Math.max(1, parseInt(pit.quantity, 10) || 1);
      const costData = await getItemCostData(pack.id, "EMBALAGEM");
      const packCost = qty * costData.unitCost;
      packagingSubtotal += packCost;

      processedPackagings.push({
        packagingId: pack.id,
        quantity: qty,
      });
    }

    // 3. Cálculos de Custos Totais
    const wasteAmount = (rawMaterialsSubtotal + packagingSubtotal) * (Number(wastePercentage) / 100);
    const directMaterialsTotal = rawMaterialsSubtotal + packagingSubtotal + wasteAmount;

    const laborTotal = (Number(preparationMinutes) / 60) * Number(laborHourlyRate);
    const energyTotal = (Number(equipmentMinutes) / 60) * operationalRates.energyHourlyRate;
    const gasTotal = (Number(gasMinutes) / 60) * operationalRates.gasHourlyRate;
    const operationalTotal = laborTotal + energyTotal + gasTotal;

    const batchTotalCost = directMaterialsTotal + operationalTotal;
    const units = Math.max(1, parseInt(expectedYield, 10) || 1);
    const unitCost = Number((batchTotalCost / units).toFixed(2));

    const finalMargin = Number(desiredMargin) || Number(product.desiredMargin) || 50;
    const suggestedPrice = Number((unitCost * (1 + finalMargin / 100)).toFixed(2));

    const notesObj = {
      preparationMinutes: Number(preparationMinutes),
      equipmentMinutes: Number(equipmentMinutes),
      gasMinutes: Number(gasMinutes),
      laborHourlyRate: Number(laborHourlyRate),
      itemUnits,
      itemInputQtys,
      calculatedAt: new Date().toISOString(),
    };

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // 4. Salva no banco transactionalmente
    const savedSheet = await db.$transaction(async (tx) => {
      // Localiza ficha existente
      let sheet = await tx.technicalSheet.findFirst({
        where: { productId: product.id },
        orderBy: { version: "desc" },
      });

      if (sheet) {
        // Remove itens antigos
        await tx.technicalSheetItem.deleteMany({ where: { technicalSheetId: sheet.id } });
        await tx.technicalSheetPackaging.deleteMany({ where: { technicalSheetId: sheet.id } });

        sheet = await tx.technicalSheet.update({
          where: { id: sheet.id },
          data: {
            expectedYield: units,
            wastePercentage: Number(wastePercentage),
            laborCostEstimated: Number(laborTotal.toFixed(2)),
            energyCostEstimated: Number(energyTotal.toFixed(2)),
            gasCostEstimated: Number(gasTotal.toFixed(2)),
            notes: JSON.stringify(notesObj),
            items: {
              create: processedItems.map((pi) => ({
                rawMaterialId: pi.rawMaterialId,
                quantity: pi.quantity,
              })),
            },
            packagingItems: {
              create: processedPackagings.map((pp) => ({
                packagingId: pp.packagingId,
                quantity: pp.quantity,
              })),
            },
          },
          include: {
            items: { include: { rawMaterial: true } },
            packagingItems: { include: { packaging: true } },
          },
        });
      } else {
        sheet = await tx.technicalSheet.create({
          data: {
            productId: product.id,
            version: 1,
            expectedYield: units,
            wastePercentage: Number(wastePercentage),
            laborCostEstimated: Number(laborTotal.toFixed(2)),
            energyCostEstimated: Number(energyTotal.toFixed(2)),
            gasCostEstimated: Number(gasTotal.toFixed(2)),
            notes: JSON.stringify(notesObj),
            items: {
              create: processedItems.map((pi) => ({
                rawMaterialId: pi.rawMaterialId,
                quantity: pi.quantity,
              })),
            },
            packagingItems: {
              create: processedPackagings.map((pp) => ({
                packagingId: pp.packagingId,
                quantity: pp.quantity,
              })),
            },
          },
          include: {
            items: { include: { rawMaterial: true } },
            packagingItems: { include: { packaging: true } },
          },
        });
      }

      // Se solicitado, atualiza o custo e preço no produto
      if (applyToProduct) {
        await tx.product.update({
          where: { id: product.id },
          data: {
            calculatedCost: unitCost,
            basePrice: suggestedPrice,
            desiredMargin: finalMargin,
          },
        });
      } else {
        // Sempre atualiza o custo calculado para refletir o valor real do estoque/compras
        await tx.product.update({
          where: { id: product.id },
          data: {
            calculatedCost: unitCost,
            desiredMargin: finalMargin,
          },
        });
      }

      return sheet;
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "TechnicalSheet",
      entityId: savedSheet.id,
      newValues: {
        product: product.name,
        unitCost,
        suggestedPrice,
        itemsCount: processedItems.length,
        packagingCount: processedPackagings.length,
      },
      ipAddress,
      description: `Atualizada ficha técnica de "${product.name}": Custo unitário R$ ${unitCost.toFixed(2)} (Batelada R$ ${batchTotalCost.toFixed(2)} p/ ${units} un)`,
    });

    return NextResponse.json({
      success: true,
      unitCost,
      suggestedPrice,
      batchTotalCost: Number(batchTotalCost.toFixed(2)),
      sheet: savedSheet,
    });
  } catch (error: any) {
    console.error("Erro ao salvar ficha técnica:", error);
    return NextResponse.json({ error: error.message || "Erro ao salvar ficha técnica" }, { status: 500 });
  }
}
