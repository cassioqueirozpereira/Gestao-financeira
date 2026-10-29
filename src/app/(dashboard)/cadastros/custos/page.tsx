import React from "react";
import { db } from "@/lib/db";
import { Coins } from "lucide-react";
import { CustosClientView } from "./CustosClientView";

export const dynamic = "force-dynamic";

export default async function CustosPage() {
  const [rawRes, packRes, prodRes] = await Promise.allSettled([
    db.rawMaterial.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    }),
    db.packaging.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    }),
    db.product.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const rawMaterials = rawRes.status === "fulfilled" ? rawRes.value : [];
  const packagings = packRes.status === "fulfilled" ? packRes.value : [];
  const products = prodRes.status === "fulfilled" ? prodRes.value : [];

  // Serializa Decimals / Dates
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-indigo-600" />
            Controle de Custos & Margens
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento centralizado da evolução dos custos unitários de matérias-primas, embalagens e margens dos produtos.
          </p>
        </div>
      </div>

      <CustosClientView
        rawMaterials={serializedRaw}
        packagings={serializedPack}
        products={serializedProd}
      />
    </div>
  );
}
