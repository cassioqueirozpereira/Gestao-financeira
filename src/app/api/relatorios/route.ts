import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const costCenterId = searchParams.get("costCenterId");

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // 1. Financeiro: Receitas Realizadas
    const recWhere: any = { status: "RECEBIDA" };
    if (costCenterId && costCenterId !== "TODOS") recWhere.costCenterId = costCenterId;
    if (startDate || endDate) recWhere.receivedAt = dateFilter;

    const receivedItems = await db.accountReceivable.findMany({
      where: recWhere,
      include: { costCenter: true, chartOfAccount: true, customer: true },
    });

    // 2. Financeiro: Despesas Pagas
    const payWhere: any = { status: "PAGA" };
    if (costCenterId && costCenterId !== "TODOS") payWhere.costCenterId = costCenterId;
    if (startDate || endDate) payWhere.paidAt = dateFilter;

    const paidItems = await db.accountPayable.findMany({
      where: payWhere,
      include: { costCenter: true, chartOfAccount: true, supplier: true },
    });

    const totalReceitas = receivedItems.reduce((acc, r) => acc + Number(r.receivedAmount), 0);
    const totalDespesas = paidItems.reduce((acc, p) => acc + Number(p.paidAmount), 0);
    const resultadoLiquido = totalReceitas - totalDespesas;

    // 3. Estoque Atual e Posição Patrimonial
    const rawMaterials = await db.rawMaterial.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    });
    const packagings = await db.packaging.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    });
    const products = await db.product.findMany({
      orderBy: { name: "asc" },
    });

    const totalRawValue = rawMaterials.reduce((acc, m) => acc + Number(m.currentStock) * Number(m.unitCost), 0);
    const totalPackValue = packagings.reduce((acc, p) => acc + p.currentStock * Number(p.unitCost), 0);
    const totalProdValue = products.reduce((acc, pr) => acc + pr.stockQuantity * Number(pr.calculatedCost || pr.basePrice), 0);

    // 4. Produção no Período
    const prodWhere: any = {};
    if (costCenterId && costCenterId !== "TODOS") prodWhere.costCenter = costCenterId;
    if (startDate || endDate) prodWhere.productionDate = dateFilter;

    const productionOrders = await db.productionOrder.findMany({
      where: prodWhere,
      include: { product: true },
      orderBy: { productionDate: "desc" },
    });

    const totalLotes = productionOrders.length;
    const totalUnidadesProduzidas = productionOrders.reduce((acc, o) => acc + o.quantityProduced, 0);
    const totalCustoProducao = productionOrders.reduce((acc, o) => acc + Number(o.totalCost), 0);

    // 5. Compras no Período
    const compWhere: any = {};
    if (startDate || endDate) compWhere.orderDate = dateFilter;

    const purchases = await db.purchase.findMany({
      where: compWhere,
      include: { supplier: true, items: true },
      orderBy: { orderDate: "desc" },
    });

    const totalCompras = purchases.reduce((acc, c) => acc + Number(c.totalAmount), 0);

    return NextResponse.json({
      financeiro: {
        totalReceitas,
        totalDespesas,
        resultadoLiquido,
        receivedCount: receivedItems.length,
        paidCount: paidItems.length,
        receivedItems,
        paidItems,
      },
      estoque: {
        totalRawValue,
        totalPackValue,
        totalProdValue,
        totalInventoryValue: totalRawValue + totalPackValue + totalProdValue,
        rawMaterialsCount: rawMaterials.length,
        packagingsCount: packagings.length,
        productsCount: products.length,
        rawMaterials,
        packagings,
        products,
      },
      producao: {
        totalLotes,
        totalUnidadesProduzidas,
        totalCustoProducao,
        orders: productionOrders,
      },
      compras: {
        totalCompras,
        purchasesCount: purchases.length,
        purchases,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar relatórios:", error);
    return NextResponse.json({ error: error.message || "Erro ao gerar dados" }, { status: 500 });
  }
}
