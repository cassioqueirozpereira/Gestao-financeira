import React from "react";
import { db } from "@/lib/db";
import { ShoppingBag, Lock, Info } from "lucide-react";
import { CatalogClientView } from "./CatalogClientView";
import { getStoredCatalogSections } from "@/lib/catalog-sections";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  let products: any[] = [];
  let rawMaterials: any[] = [];
  let packagings: any[] = [];
  let chartOfAccounts: any[] = [];

  try {
    const [prods, raws, packs, coas] = await Promise.all([
      db.product.findMany({
        orderBy: [{ category: "asc" }, { basePrice: "asc" }],
      }),
      db.rawMaterial.findMany({
        where: { isActive: true },
        include: { chartOfAccount: true },
        orderBy: { name: "asc" },
      }),
      db.packaging.findMany({
        where: { isActive: true },
        include: { chartOfAccount: true },
        orderBy: { name: "asc" },
      }),
      db.chartOfAccount.findMany({
        where: { isActive: true, code: { in: ["2", "2.1", "2.2", "2.3"] } },
        orderBy: { code: "asc" },
      }),
    ]);
    products = prods;
    rawMaterials = raws;
    packagings = packs;
    chartOfAccounts = coas;
  } catch (error) {
    console.error("Erro ao carregar dados do catálogo e insumos:", error);
  }

  const storedSections = getStoredCatalogSections();

  // Limpa e atualiza automaticamente no Supabase qualquer produto salvo anteriormente com prefixo SECTION_...
  try {
    const sectionProducts = products.filter((p) => p.category && p.category.startsWith("SECTION_"));
    for (const sp of sectionProducts) {
      const cleanName =
        storedSections[sp.category] ||
        sp.category
          .replace(/^SECTION_/, "")
          .replace(/_\d+$/, "")
          .replace(/_/g, " ")
          .trim();

      if (cleanName && cleanName !== sp.category) {
        await db.product.updateMany({
          where: { category: sp.category },
          data: { category: cleanName },
        });
        sp.category = cleanName;
        storedSections[cleanName] = cleanName;
        delete storedSections[sp.category];
      }
    }
  } catch (cleanErr) {
    console.warn("Aviso na limpeza de categorias com prefixo:", cleanErr);
  }

  // Serializa datas e Decimals
  const serializedProducts = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const serializedRawMaterials = rawMaterials.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category || "",
    unit: r.unit || "G",
    unitCost: Number(r.unitCost) || 0,
    currentStock: Number(r.currentStock) || 0,
    chartOfAccountId: r.chartOfAccountId || null,
    chartOfAccountCode: r.chartOfAccount?.code || null,
    chartOfAccountName: r.chartOfAccount?.name || null,
  }));

  const serializedPackagings = packagings.map((p) => ({
    id: p.id,
    name: p.name,
    unit: p.unit || "UN",
    unitCost: Number(p.unitCost) || 0,
    currentStock: Number(p.currentStock) || 0,
    chartOfAccountId: p.chartOfAccountId || null,
    chartOfAccountCode: p.chartOfAccount?.code || null,
    chartOfAccountName: p.chartOfAccount?.name || null,
  }));

  const serializedChartOfAccounts = chartOfAccounts.map((coa) => ({
    id: coa.id,
    code: coa.code,
    name: coa.name,
    level: coa.level,
    type: coa.type,
  }));

  // Constrói as seções EXCLUSIVAMENTE a partir das categorias reais salvas no banco de dados
  const categoryLabels: Record<string, string> = {};

  products.forEach((p) => {
    if (p.category) {
      let clean = p.category;
      if (clean.startsWith("SECTION_")) {
        clean = clean.replace(/^SECTION_/, "").replace(/_\d+$/, "").replace(/_/g, " ").trim();
      }
      if (clean) {
        categoryLabels[clean] = clean;
      }
    }
  });

  // Mescla apenas seções ativas criadas explicitamente pelo usuário
  for (const [k, v] of Object.entries(storedSections)) {
    if (!k.startsWith("SECTION_") && v) {
      categoryLabels[k] = v;
    }
  }

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
        initialRawMaterials={serializedRawMaterials}
        initialPackagings={serializedPackagings}
        initialChartOfAccounts={serializedChartOfAccounts}
      />
    </div>
  );
}
