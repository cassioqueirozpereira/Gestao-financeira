import { db } from "@/lib/db";

/**
 * Converte unidades de medida padrão para cálculo proporcional de custos.
 * Suporta Peso (KG, G, MG), Volume (L, ML), Comprimento (M, CM, MM) e Unidades (UN, PC, CX, etc.).
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string
): { convertedQuantity: number; factor: number } {
  const from = (fromUnit || "UN").trim().toUpperCase();
  const to = (toUnit || "UN").trim().toUpperCase();

  if (from === to) return { convertedQuantity: value, factor: 1 };

  // Peso: KG, G, MG
  if (from === "G" && to === "KG") return { convertedQuantity: value / 1000, factor: 0.001 };
  if (from === "KG" && to === "G") return { convertedQuantity: value * 1000, factor: 1000 };
  if (from === "MG" && to === "G") return { convertedQuantity: value / 1000, factor: 0.001 };
  if (from === "G" && to === "MG") return { convertedQuantity: value * 1000, factor: 1000 };
  if (from === "MG" && to === "KG") return { convertedQuantity: value / 1000000, factor: 0.000001 };
  if (from === "KG" && to === "MG") return { convertedQuantity: value * 1000000, factor: 1000000 };

  // Volume: L, ML
  if (from === "ML" && to === "L") return { convertedQuantity: value / 1000, factor: 0.001 };
  if (from === "L" && to === "ML") return { convertedQuantity: value * 1000, factor: 1000 };

  // Comprimento: M, CM, MM
  if (from === "CM" && to === "M") return { convertedQuantity: value / 100, factor: 0.01 };
  if (from === "M" && to === "CM") return { convertedQuantity: value * 100, factor: 100 };
  if (from === "MM" && to === "M") return { convertedQuantity: value / 1000, factor: 0.001 };
  if (from === "MM" && to === "CM") return { convertedQuantity: value / 10, factor: 0.1 };

  // Fallback para unidades diretas (UN, PC, etc.)
  return { convertedQuantity: value, factor: 1 };
}

export interface PurchaseHistoryItem {
  purchaseNumber: string;
  orderDate: string;
  supplierName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  effectiveUnitCost: number;
  totalCost: number;
  invoiceNumber?: string | null;
}

export interface ItemCostData {
  id: string;
  name: string;
  type: "MATERIA_PRIMA" | "EMBALAGEM";
  baseUnit: string;
  currentStock: number;
  unitCost: number; // Custo unitário efetivo adotado (CMP de compras ou cadastro de estoque)
  costingMethod: "CMP_COMPRAS" | "ESTOQUE_MANUAL" | "SEM_CUSTO";
  hasRealPurchases: boolean;
  totalPurchasedQuantity: number;
  latestPurchaseCost: number | null;
  purchasesCount: number;
  purchasesHistory: PurchaseHistoryItem[];
  warning?: string;
}

/**
 * Busca o histórico de compras e calcula o Custo Médio Ponderado (CMP) real do item
 * considerando valor pago, quantidades e frete rateado.
 */
export async function getItemCostData(
  itemId: string,
  itemType: "MATERIA_PRIMA" | "EMBALAGEM"
): Promise<ItemCostData> {
  let itemName = "";
  let baseUnit = "UN";
  let currentStock = 0;
  let fallbackCost = 0;

  if (itemType === "MATERIA_PRIMA") {
    const raw = await db.rawMaterial.findUnique({ where: { id: itemId } });
    if (raw) {
      itemName = raw.name;
      baseUnit = raw.unit;
      currentStock = Number(raw.currentStock) || 0;
      fallbackCost = Number(raw.unitCost) || 0;
    }
  } else {
    const pack = await db.packaging.findUnique({ where: { id: itemId } });
    if (pack) {
      itemName = pack.name;
      baseUnit = pack.unit;
      currentStock = Number(pack.currentStock) || 0;
      fallbackCost = Number(pack.unitCost) || 0;
    }
  }

  // 1. Busca todos os registros de compra deste item no módulo Compras
  const purchaseItems = await db.purchaseItem.findMany({
    where: {
      itemId,
      itemType,
      purchase: {
        status: { not: "CANCELADO" },
      },
    },
    include: {
      purchase: {
        include: { supplier: true },
      },
    },
    orderBy: {
      purchase: { orderDate: "desc" },
    },
  });

  const purchasesHistory: PurchaseHistoryItem[] = [];
  let totalPurchasedQty = 0;
  let totalWeightedValue = 0;
  let latestPurchaseCost: number | null = null;

  for (const pi of purchaseItems) {
    const qty = Number(pi.quantity) || 0;
    const itemTotal = Number(pi.totalCost) || qty * Number(pi.unitCost);
    const purchaseTotal = Number(pi.purchase.totalAmount) || 0;
    const freight = Number(pi.purchase.freightAmount) || 0;

    // Rateio do frete proporcional ao valor do item na compra
    let proportionalFreight = 0;
    if (freight > 0 && purchaseTotal > freight) {
      const itemsSubtotal = purchaseTotal - freight;
      proportionalFreight = (itemTotal / itemsSubtotal) * freight;
    }

    const effectiveTotal = itemTotal + proportionalFreight;
    const effectiveUnitCost = qty > 0 ? effectiveTotal / qty : Number(pi.unitCost);

    if (latestPurchaseCost === null) {
      latestPurchaseCost = effectiveUnitCost;
    }

    totalPurchasedQty += qty;
    totalWeightedValue += effectiveTotal;

    purchasesHistory.push({
      purchaseNumber: pi.purchase.purchaseNumber,
      orderDate: pi.purchase.orderDate.toISOString(),
      supplierName: pi.purchase.supplier?.name || "Fornecedor não identificado",
      quantity: qty,
      unit: pi.unit,
      unitCost: Number(pi.unitCost),
      effectiveUnitCost: Number(effectiveUnitCost.toFixed(4)),
      totalCost: Number(effectiveTotal.toFixed(2)),
      invoiceNumber: pi.purchase.invoiceNumber,
    });
  }

  // Se houver histórico de compras, calcula Custo Médio Ponderado (CMP)
  if (purchasesHistory.length > 0 && totalPurchasedQty > 0) {
    const cmp = totalWeightedValue / totalPurchasedQty;
    return {
      id: itemId,
      name: itemName,
      type: itemType,
      baseUnit,
      currentStock,
      unitCost: Number(cmp.toFixed(4)),
      costingMethod: "CMP_COMPRAS",
      hasRealPurchases: true,
      totalPurchasedQuantity: totalPurchasedQty,
      latestPurchaseCost: latestPurchaseCost ? Number(latestPurchaseCost.toFixed(4)) : null,
      purchasesCount: purchasesHistory.length,
      purchasesHistory,
    };
  }

  // Se não houver compras registradas, recorre ao custo informado no Estoque
  if (fallbackCost > 0) {
    return {
      id: itemId,
      name: itemName,
      type: itemType,
      baseUnit,
      currentStock,
      unitCost: fallbackCost,
      costingMethod: "ESTOQUE_MANUAL",
      hasRealPurchases: false,
      totalPurchasedQuantity: 0,
      latestPurchaseCost: null,
      purchasesCount: 0,
      purchasesHistory: [],
      warning: `Sem compras cadastradas em Compras para "${itemName}". Utilizando o custo de estoque cadastrado (R$ ${fallbackCost.toFixed(2)} / ${baseUnit}).`,
    };
  }

  // Sem nenhuma informação de custo
  return {
    id: itemId,
    name: itemName,
    type: itemType,
    baseUnit,
    currentStock,
    unitCost: 0,
    costingMethod: "SEM_CUSTO",
    hasRealPurchases: false,
    totalPurchasedQuantity: 0,
    latestPurchaseCost: null,
    purchasesCount: 0,
    purchasesHistory: [],
    warning: `⚠️ Atenção: Nenhuma compra ou custo informado para "${itemName}". Cadastre uma compra em Compras ou informe o custo em Estoque.`,
  };
}

export interface OperationalRates {
  energyBillAmount: number | null;
  energyBillDescription: string | null;
  energyBillDate: string | null;
  energyHourlyRate: number; // R$/hora de operação de equipamento
  energySource: "FINANCEIRO_REAL" | "ESTIMATIVA_PADRAO";
  energyWarning?: string;

  gasCylinderCost: number | null;
  gasDescription: string | null;
  gasHourlyRate: number; // R$/hora de queima em fogão
  gasSource: "FINANCEIRO_REAL" | "ESTIMATIVA_PADRAO";
  gasWarning?: string;

  defaultLaborHourlyRate: number;
}

/**
 * Localiza faturas de energia e compras de gás no Financeiro / Contas a Pagar
 * para apuração das tarifas horárias operacionais.
 */
export async function getOperationalRates(): Promise<OperationalRates> {
  // 1. Busca fatura de energia mais recente em Contas a Pagar
  let energyBillAmount: number | null = null;
  let energyBillDescription: string | null = null;
  let energyBillDate: string | null = null;
  let energyHourlyRate = 1.50; // Fallback: ~R$ 240 / 160h = R$ 1,50/h
  let energySource: "FINANCEIRO_REAL" | "ESTIMATIVA_PADRAO" = "ESTIMATIVA_PADRAO";
  let energyWarning: string | undefined =
    "Fatura de energia elétrica não identificada em Contas a Pagar. Cadastre no Financeiro para rateio automático com dados reais.";

  try {
    const energyPayable = await db.accountPayable.findFirst({
      where: {
        status: { not: "CANCELADA" },
        OR: [
          { description: { contains: "ENEL", mode: "insensitive" } },
          { description: { contains: "CPFL", mode: "insensitive" } },
          { description: { contains: "EQUATORIAL", mode: "insensitive" } },
          { description: { contains: "ELEKTRO", mode: "insensitive" } },
          { description: { contains: "CEMIG", mode: "insensitive" } },
          { description: { contains: "LIGHT", mode: "insensitive" } },
          { description: { contains: "ENERGIA", mode: "insensitive" } },
          { description: { contains: "LUZ", mode: "insensitive" } },
          { chartOfAccount: { name: { contains: "Energia", mode: "insensitive" } } },
          { chartOfAccount: { name: { contains: "Luz", mode: "insensitive" } } },
        ],
      },
      orderBy: { competenceDate: "desc" },
    });

    if (energyPayable) {
      const amount = Number(energyPayable.paidAmount || energyPayable.originalAmount) || 0;
      if (amount > 0) {
        energyBillAmount = amount;
        energyBillDescription = energyPayable.description;
        energyBillDate = energyPayable.competenceDate.toISOString();
        // Rateio padrão: 160 horas operacionais estimadas no mês do ateliê
        energyHourlyRate = Number((amount / 160).toFixed(4));
        energySource = "FINANCEIRO_REAL";
        energyWarning = undefined;
      }
    }
  } catch (e) {
    console.warn("Erro ao buscar fatura de energia:", e);
  }

  // 2. Busca despesa de gás em Contas a Pagar ou Compras
  let gasCylinderCost: number | null = null;
  let gasDescription: string | null = null;
  let gasHourlyRate = 2.45; // Fallback: Botijão R$ 110 / 45 horas de queima = R$ 2,45/h
  let gasSource: "FINANCEIRO_REAL" | "ESTIMATIVA_PADRAO" = "ESTIMATIVA_PADRAO";
  let gasWarning: string | undefined =
    "Compra de gás não identificada no Financeiro ou Compras. Cadastre o botijão de gás para cálculo exato.";

  try {
    // Tenta primeiro em Contas a Pagar
    const gasPayable = await db.accountPayable.findFirst({
      where: {
        status: { not: "CANCELADA" },
        OR: [
          { description: { contains: "GÁS", mode: "insensitive" } },
          { description: { contains: "GAS", mode: "insensitive" } },
          { description: { contains: "ULTRAGAZ", mode: "insensitive" } },
          { description: { contains: "LIQUIGAS", mode: "insensitive" } },
          { description: { contains: "SUPERGASBRAS", mode: "insensitive" } },
          { description: { contains: "BOTIJÃO", mode: "insensitive" } },
          { description: { contains: "BOTIJAO", mode: "insensitive" } },
          { chartOfAccount: { name: { contains: "Gás", mode: "insensitive" } } },
        ],
      },
      orderBy: { competenceDate: "desc" },
    });

    if (gasPayable) {
      const val = Number(gasPayable.paidAmount || gasPayable.originalAmount) || 0;
      if (val > 0) {
        gasCylinderCost = val;
        gasDescription = gasPayable.description;
        // Botijão P-13 médio tem 45 horas de chama em boca média
        gasHourlyRate = Number((val / 45).toFixed(4));
        gasSource = "FINANCEIRO_REAL";
        gasWarning = undefined;
      }
    } else {
      // Tenta em PurchaseItem de Compras
      const gasPurchaseItem = await db.purchaseItem.findFirst({
        where: {
          purchase: { status: { not: "CANCELADO" } },
          OR: [
            { name: { contains: "GÁS", mode: "insensitive" } },
            { name: { contains: "GAS", mode: "insensitive" } },
            { name: { contains: "BOTIJÃO", mode: "insensitive" } },
          ],
        },
        include: { purchase: true },
        orderBy: { purchase: { orderDate: "desc" } },
      });

      if (gasPurchaseItem) {
        const val = Number(gasPurchaseItem.unitCost) || 0;
        if (val > 0) {
          gasCylinderCost = val;
          gasDescription = gasPurchaseItem.name;
          gasHourlyRate = Number((val / 45).toFixed(4));
          gasSource = "FINANCEIRO_REAL";
          gasWarning = undefined;
        }
      }
    }
  } catch (e) {
    console.warn("Erro ao buscar custo de gás:", e);
  }

  return {
    energyBillAmount,
    energyBillDescription,
    energyBillDate,
    energyHourlyRate,
    energySource,
    energyWarning,

    gasCylinderCost,
    gasDescription,
    gasHourlyRate,
    gasSource,
    gasWarning,

    defaultLaborHourlyRate: 20.0, // R$ 20,00 por hora de fabricação
  };
}

export interface ChannelPricing {
  channelKey: string;
  channelName: string;
  feePercentage: number;
  fixedFee: number;
  suggestedSalePrice: number;
  netRevenue: number;
  profitAmount: number;
  netMarginPercentage: number;
}

/**
 * Calcula os preços de venda sugeridos para os principais canais de comercialização,
 * cobrindo as taxas de cada plataforma para preservar a margem líquida desejada.
 */
export function calculateChannelPricing(
  unitCost: number,
  desiredMarginPercent: number
): ChannelPricing[] {
  // Preço base desejado direto sem taxas de intermediários
  // Margem sobre o custo (Markup): Preço = Custo * (1 + Margem / 100)
  const baseTarget = unitCost * (1 + desiredMarginPercent / 100);

  const channels = [
    {
      key: "DIRETO_PIX",
      name: "Venda Direta / Balcão / PIX",
      feePercentage: 0,
      fixedFee: 0,
    },
    {
      key: "CARTAO_CREDITO",
      name: "Cartão de Crédito / Maquininha",
      feePercentage: 3.5, // 3.5%
      fixedFee: 0,
    },
    {
      key: "SITE_PROPRIO",
      name: "Site Próprio (E-commerce)",
      feePercentage: 5.0, // 5% gateway
      fixedFee: 0,
    },
    {
      key: "SHOPEE",
      name: "Shopee (Comissão + Frete)",
      feePercentage: 14.0, // 14%
      fixedFee: 4.0, // R$ 4,00 taxa fixa por item
    },
    {
      key: "MERCADO_LIVRE",
      name: "Mercado Livre (Clássico/Premium)",
      feePercentage: 16.0, // 16%
      fixedFee: 6.0, // R$ 6,00 taxa fixa
    },
  ];

  return channels.map((ch) => {
    // Fórmula para atingir a receita líquida baseTarget após descontar taxas:
    // (Preço * (1 - taxa/100)) - fixedFee = baseTarget
    // Preço = (baseTarget + fixedFee) / (1 - taxa/100)
    let suggested = 0;
    const rateFactor = 1 - ch.feePercentage / 100;
    if (rateFactor > 0) {
      suggested = (baseTarget + ch.fixedFee) / rateFactor;
    } else {
      suggested = baseTarget;
    }

    const suggestedSalePrice = Number(suggested.toFixed(2));
    const feeAmount = (suggestedSalePrice * (ch.feePercentage / 100)) + ch.fixedFee;
    const netRevenue = Number((suggestedSalePrice - feeAmount).toFixed(2));
    const profitAmount = Number((netRevenue - unitCost).toFixed(2));
    const netMarginPercentage = netRevenue > 0 ? Number(((profitAmount / netRevenue) * 100).toFixed(1)) : 0;

    return {
      channelKey: ch.key,
      channelName: ch.name,
      feePercentage: ch.feePercentage,
      fixedFee: ch.fixedFee,
      suggestedSalePrice,
      netRevenue,
      profitAmount,
      netMarginPercentage,
    };
  });
}
