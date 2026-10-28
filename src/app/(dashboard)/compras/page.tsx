import React from "react";
import { db } from "@/lib/db";
import { ShoppingBag } from "lucide-react";
import { ComprasClientView } from "./ComprasClientView";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const [
    purchasesRes,
    suppliersRes,
    rawRes,
    packRes,
    costCentersRes,
    chartRes,
  ] = await Promise.allSettled([
    db.purchase.findMany({
      include: {
        supplier: true,
        items: true,
        accountPayable: true,
      },
      orderBy: { orderDate: "desc" },
    }),
    db.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.rawMaterial.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.packaging.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.costCenter.findMany({ orderBy: { name: "asc" } }),
    db.chartOfAccount.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const purchases = purchasesRes.status === "fulfilled" ? purchasesRes.value : [];
  const suppliers = suppliersRes.status === "fulfilled" ? suppliersRes.value : [];
  const rawMaterials = rawRes.status === "fulfilled" ? rawRes.value : [];
  const packagings = packRes.status === "fulfilled" ? packRes.value : [];
  const costCenters = costCentersRes.status === "fulfilled" ? costCentersRes.value : [];
  const chartOfAccounts = chartRes.status === "fulfilled" ? chartRes.value : [];

  const serializedPurchases = purchases.map((p) => ({
    ...p,
    totalAmount: Number(p.totalAmount),
    freightAmount: Number(p.freightAmount),
    orderDate: p.orderDate.toISOString(),
    deliveryDate: p.deliveryDate ? p.deliveryDate.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    items: p.items.map((it: any) => ({
      ...it,
      quantity: Number(it.quantity),
      unitCost: Number(it.unitCost),
      totalCost: Number(it.totalCost),
      receivedQuantity: Number(it.receivedQuantity),
    })),
  }));

  const serializedRaw = rawMaterials.map((m) => ({
    ...m,
    currentStock: Number(m.currentStock),
    minStock: Number(m.minStock),
    unitCost: Number(m.unitCost),
  }));

  const serializedPack = packagings.map((p) => ({
    ...p,
    unitCost: Number(p.unitCost),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            Compras & Pedidos de Suprimentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pedidos de compra multi-item com recebimento físico no estoque e integração automática ao Contas a Pagar.
          </p>
        </div>
      </div>

      <ComprasClientView
        initialPurchases={serializedPurchases}
        suppliers={suppliers}
        rawMaterials={serializedRaw}
        packagings={serializedPack}
        costCenters={costCenters}
        chartOfAccounts={chartOfAccounts}
      />
    </div>
  );
}
