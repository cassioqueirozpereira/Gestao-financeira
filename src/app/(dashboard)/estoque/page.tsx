import React from "react";
import { db } from "@/lib/db";
import { Boxes } from "lucide-react";
import { EstoqueClientView } from "./EstoqueClientView";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const [rawRes, packRes, prodRes, movRes, suppRes, ccRes, accRes] = await Promise.allSettled([
    db.rawMaterial.findMany({
      include: { supplier: true, costCenter: true, chartOfAccount: true },
      orderBy: { name: "asc" },
    }),
    db.packaging.findMany({
      include: { supplier: true, costCenter: true, chartOfAccount: true },
      orderBy: { name: "asc" },
    }),
    db.product.findMany({
      include: { categoryRef: true },
      orderBy: { name: "asc" },
    }),
    db.stockMovement.findMany({
      orderBy: { date: "desc" },
      take: 100,
    }),
    db.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.costCenter.findMany({
      orderBy: { name: "asc" },
    }),
    db.chartOfAccount.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const rawMaterials = rawRes.status === "fulfilled" ? rawRes.value : [];
  const packagings = packRes.status === "fulfilled" ? packRes.value : [];
  const products = prodRes.status === "fulfilled" ? prodRes.value : [];
  const movements = movRes.status === "fulfilled" ? movRes.value : [];
  const suppliers = suppRes.status === "fulfilled" ? suppRes.value : [];
  const costCenters = ccRes.status === "fulfilled" ? ccRes.value : [];
  const chartOfAccounts = accRes.status === "fulfilled" ? accRes.value : [];

  // Serializa Decimals e Dates
  const serializedRaw = rawMaterials.map((m) => ({
    ...m,
    currentStock: Number(m.currentStock),
    minStock: Number(m.minStock),
    unitCost: Number(m.unitCost),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  const serializedPack = packagings.map((p) => ({
    ...p,
    unitCost: Number(p.unitCost),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const serializedProd = products.map((pr) => ({
    ...pr,
    basePrice: Number(pr.basePrice),
    calculatedCost: Number(pr.calculatedCost),
    desiredMargin: Number(pr.desiredMargin),
    createdAt: pr.createdAt.toISOString(),
    updatedAt: pr.updatedAt.toISOString(),
  }));

  const serializedMovements = movements.map((mov) => ({
    ...mov,
    quantity: Number(mov.quantity),
    unitCost: Number(mov.unitCost),
    totalCost: Number(mov.totalCost),
    date: mov.date.toISOString(),
    createdAt: mov.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-600" />
            Controle de Estoque Integrado
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestão unificada de matérias-primas (cera/resina/essência), embalagens, produtos acabados e histórico de movimentações.
          </p>
        </div>
      </div>

      <EstoqueClientView
        initialRawMaterials={serializedRaw}
        initialPackagings={serializedPack}
        initialProducts={serializedProd}
        initialMovements={serializedMovements}
        suppliers={suppliers}
        costCenters={costCenters}
        chartOfAccounts={chartOfAccounts}
      />
    </div>
  );
}
