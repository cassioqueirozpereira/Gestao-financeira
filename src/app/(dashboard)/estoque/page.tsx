import React from "react";
import { db } from "@/lib/db";
import { Boxes } from "lucide-react";
import { EstoqueClientView } from "./EstoqueClientView";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  let rawMaterials: any[] = [];
  let packagings: any[] = [];
  let products: any[] = [];
  let movements: any[] = [];
  let suppliers: any[] = [];

  try {
    rawMaterials = await db.rawMaterial.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar matérias-primas:", e);
  }

  try {
    packagings = await db.packaging.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar embalagens:", e);
  }

  try {
    products = await db.product.findMany({
      include: { categoryRef: true },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar produtos:", e);
  }

  try {
    movements = await db.stockMovement.findMany({
      orderBy: { date: "desc" },
      take: 100,
    });
  } catch (e) {
    console.error("Erro ao carregar movimentações de estoque:", e);
  }

  try {
    suppliers = await db.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar fornecedores:", e);
  }

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
      />
    </div>
  );
}
