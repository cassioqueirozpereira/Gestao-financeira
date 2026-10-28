import React from "react";
import { db } from "@/lib/db";
import { FileSpreadsheet } from "lucide-react";
import { RelatoriosClientView } from "./RelatoriosClientView";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  let initialData: any = {
    financeiro: { totalReceitas: 0, totalDespesas: 0, resultadoLiquido: 0, receivedItems: [], paidItems: [] },
    estoque: { totalInventoryValue: 0, totalRawValue: 0, totalPackValue: 0, totalProdValue: 0 },
    producao: { totalLotes: 0, totalUnidadesProduzidas: 0, totalCustoProducao: 0, orders: [] },
    compras: { totalCompras: 0, purchasesCount: 0, purchases: [] },
  };

  let costCenters: any[] = [];

  try {
    const [
      costCentersRes,
      receivedRes,
      paidRes,
      rawMaterialsRes,
      packagingsRes,
      productsRes,
      productionOrdersRes,
      purchasesRes,
    ] = await Promise.allSettled([
      db.costCenter.findMany({ orderBy: { name: "asc" } }),
      db.accountReceivable.findMany({
        where: { status: "RECEBIDA" },
        include: { costCenter: true, chartOfAccount: true, customer: true },
        take: 20,
      }),
      db.accountPayable.findMany({
        where: { status: "PAGA" },
        include: { costCenter: true, chartOfAccount: true, supplier: true },
        take: 20,
      }),
      db.rawMaterial.findMany(),
      db.packaging.findMany(),
      db.product.findMany(),
      db.productionOrder.findMany({ take: 20, orderBy: { productionDate: "desc" } }),
      db.purchase.findMany({ include: { supplier: true }, take: 20, orderBy: { orderDate: "desc" } }),
    ]);

    costCenters = costCentersRes.status === "fulfilled" ? costCentersRes.value : [];
    const received = receivedRes.status === "fulfilled" ? receivedRes.value : [];
    const paid = paidRes.status === "fulfilled" ? paidRes.value : [];
    const rawMaterials = rawMaterialsRes.status === "fulfilled" ? rawMaterialsRes.value : [];
    const packagings = packagingsRes.status === "fulfilled" ? packagingsRes.value : [];
    const products = productsRes.status === "fulfilled" ? productsRes.value : [];
    const productionOrders = productionOrdersRes.status === "fulfilled" ? productionOrdersRes.value : [];
    const purchases = purchasesRes.status === "fulfilled" ? purchasesRes.value : [];

    const totalReceitas = received.reduce((acc, r) => acc + Number(r.receivedAmount), 0);
    const totalDespesas = paid.reduce((acc, p) => acc + Number(p.paidAmount), 0);

    const totalRawValue = rawMaterials.reduce((acc, m) => acc + Number(m.currentStock) * Number(m.unitCost), 0);
    const totalPackValue = packagings.reduce((acc, p) => acc + p.currentStock * Number(p.unitCost), 0);
    const totalProdValue = products.reduce((acc, pr) => acc + pr.stockQuantity * Number(pr.calculatedCost || pr.basePrice), 0);

    initialData = {
      financeiro: {
        totalReceitas,
        totalDespesas,
        resultadoLiquido: totalReceitas - totalDespesas,
        receivedCount: received.length,
        paidCount: paid.length,
        receivedItems: received.map((r) => ({
          ...r,
          receivedAmount: Number(r.receivedAmount),
          receivedAt: r.receivedAt?.toISOString() || null,
          dueDate: r.dueDate.toISOString(),
        })),
        paidItems: paid.map((p) => ({
          ...p,
          paidAmount: Number(p.paidAmount),
          paidAt: p.paidAt?.toISOString() || null,
          dueDate: p.dueDate.toISOString(),
        })),
      },
      estoque: {
        totalRawValue,
        totalPackValue,
        totalProdValue,
        totalInventoryValue: totalRawValue + totalPackValue + totalProdValue,
        rawMaterials: rawMaterials.map((m) => ({ ...m, currentStock: Number(m.currentStock), unitCost: Number(m.unitCost) })),
        packagings: packagings.map((p) => ({ ...p, unitCost: Number(p.unitCost) })),
        products: products.map((pr) => ({ ...pr, calculatedCost: Number(pr.calculatedCost) })),
      },
      producao: {
        totalLotes: productionOrders.length,
        totalUnidadesProduzidas: productionOrders.reduce((acc, o) => acc + o.quantityProduced, 0),
        totalCustoProducao: productionOrders.reduce((acc, o) => acc + Number(o.totalCost), 0),
        orders: productionOrders.map((o) => ({
          ...o,
          totalCost: Number(o.totalCost),
          materialCost: Number(o.materialCost),
          gasCost: Number(o.gasCost),
          energyCost: Number(o.energyCost),
          laborCost: Number(o.laborCost),
          unitCost: Number(o.unitCost),
          productionDate: o.productionDate.toISOString(),
        })),
      },
      compras: {
        totalCompras: purchases.reduce((acc, c) => acc + Number(c.totalAmount), 0),
        purchasesCount: purchases.length,
        purchases: purchases.map((c) => ({
          ...c,
          totalAmount: Number(c.totalAmount),
          freightAmount: Number(c.freightAmount),
          orderDate: c.orderDate.toISOString(),
        })),
      },
    };
  } catch (e) {
    console.error("Erro ao carregar dados iniciais de relatórios:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Central de Relatórios & Inteligência
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Demonstrativos financeiros, posição patrimonial de estoque, custos de produção e histórico de compras com exportação CSV.
          </p>
        </div>
      </div>

      <RelatoriosClientView initialData={initialData} costCenters={costCenters} />
    </div>
  );
}
