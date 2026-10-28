import React from "react";
import { db } from "@/lib/db";
import { ShoppingBag } from "lucide-react";
import { ComprasClientView } from "./ComprasClientView";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  let purchases: any[] = [];
  let suppliers: any[] = [];
  let rawMaterials: any[] = [];
  let packagings: any[] = [];
  let costCenters: any[] = [];
  let chartOfAccounts: any[] = [];

  try {
    purchases = await db.purchase.findMany({
      include: {
        supplier: true,
        items: true,
        accountPayable: true,
      },
      orderBy: { orderDate: "desc" },
    });
  } catch (e) {
    console.error("Erro ao carregar compras:", e);
  }

  try {
    suppliers = await db.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar fornecedores:", e);
  }

  try {
    rawMaterials = await db.rawMaterial.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar matérias-primas:", e);
  }

  try {
    packagings = await db.packaging.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar embalagens:", e);
  }

  try {
    costCenters = await db.costCenter.findMany({ orderBy: { name: "asc" } });
    chartOfAccounts = await db.chartOfAccount.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar contas/centros:", e);
  }

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
