import React from "react";
import { db } from "@/lib/db";
import { ShoppingBag, Lock, Info } from "lucide-react";
import { CatalogClientView } from "./CatalogClientView";
import { getStoredCatalogSections } from "@/lib/catalog-sections";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const [productsRes, categoriesRes] = await Promise.allSettled([
    db.product.findMany({
      include: {
        categoryRef: true,
      },
      orderBy: [{ category: "asc" }, { basePrice: "asc" }],
    }),
    db.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const products = productsRes.status === "fulfilled" ? productsRes.value : [];
  const officialCategories = categoriesRes.status === "fulfilled" ? categoriesRes.value : [];

  // Serializa datas
  const serializedProducts = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const serializedCategories = officialCategories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const storedSections = getStoredCatalogSections();
  const categoryLabels: Record<string, string> = { ...storedSections };

  // Mescla categorias salvas no PostgreSQL para garantir persistência total mesmo após F5 ou em ambientes serverless
  officialCategories.forEach((cat) => {
    if (cat.isActive !== false) {
      const k = cat.code || cat.name;
      categoryLabels[k] = cat.name;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            Catálogo Oficial D.A. Com Carinho
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            29 modelos oficiais com calculadora de custos por item e definição de margem de lucro.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs font-semibold">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Edição com cálculo de margem e registro de auditoria ativo.</span>
        </div>
      </div>

      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Info className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
        <div>
          <strong>Calculadora de Precificação:</strong> Abra o modal de qualquer item para decompor os custos
          (cera/resina, pote, pavio, operacional), simular a margem de lucro desejada (%) e atualizar o preço oficial de venda.
        </div>
      </div>

      <CatalogClientView
        initialProducts={serializedProducts}
        categoryLabels={categoryLabels}
        officialCategories={serializedCategories}
      />
    </div>
  );
}
