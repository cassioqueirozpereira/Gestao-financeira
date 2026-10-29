import React from "react";
import { db } from "@/lib/db";
import { Flame } from "lucide-react";
import { ProductionClientView } from "./ProductionClientView";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const [
    ordersRes,
    productsRes,
    rawMaterialsRes,
    packagingsRes,
  ] = await Promise.allSettled([
    db.productionOrder.findMany({
      include: {
        product: true,
        ingredientConsumptions: {
          include: { rawMaterial: true },
        },
        packagingConsumptions: {
          include: { packaging: true },
        },
      },
      orderBy: { productionDate: "desc" },
    }),
    db.product.findMany({
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
  ]);

  const productionOrders = ordersRes.status === "fulfilled" ? ordersRes.value : [];
  const products = productsRes.status === "fulfilled" ? productsRes.value : [];
  const rawMaterials = rawMaterialsRes.status === "fulfilled" ? rawMaterialsRes.value : [];
  const packagings = packagingsRes.status === "fulfilled" ? packagingsRes.value : [];

  const serializedOrders = productionOrders.map((o) => ({
    ...o,
    materialCost: Number(o.materialCost),
    packagingCost: Number(o.packagingCost),
    gasCost: Number(o.gasCost),
    energyCost: Number(o.energyCost),
    laborCost: Number(o.laborCost),
    totalCost: Number(o.totalCost),
    unitCost: Number(o.unitCost),
    productionDate: o.productionDate.toISOString(),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    ingredientConsumptions: o.ingredientConsumptions.map((ing: any) => ({
      ...ing,
      quantityUsed: Number(ing.quantityUsed),
      unitCost: Number(ing.unitCost),
      totalCost: Number(ing.totalCost),
    })),
    packagingConsumptions: o.packagingConsumptions.map((p: any) => ({
      ...p,
      quantityUsed: Number(p.quantityUsed),
      unitCost: Number(p.unitCost),
      totalCost: Number(p.totalCost),
    })),
  }));

  const serializedProducts = products.map((pr) => ({
    ...pr,
    basePrice: Number(pr.basePrice),
    calculatedCost: Number(pr.calculatedCost),
    desiredMargin: Number(pr.desiredMargin),
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
            <Flame className="w-6 h-6 text-amber-500" />
            Produção, Lotes e Custos Reais — D.A. Com Carinho
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ficha técnica com consumo real de cera, resinas e embalagens, cálculo do custo unitário efetivo e baixa automática no estoque.
          </p>
        </div>
      </div>

      <ProductionClientView
        initialOrders={serializedOrders}
        products={serializedProducts}
        rawMaterials={serializedRaw}
        packagings={serializedPack}
      />
    </div>
  );
}
