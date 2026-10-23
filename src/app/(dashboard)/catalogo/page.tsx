import React from "react";
import { db } from "@/lib/db";
import { ShoppingBag, Lock, Flame, Info } from "lucide-react";

export default async function CatalogPage() {
  const products = await db.product.findMany({
    orderBy: [{ category: "asc" }, { basePrice: "asc" }],
  });

  const categoryLabels: Record<string, string> = {
    VELAS_NORMAIS_COLORIDAS: "14.1. Velas Normais e Coloridas",
    VELAS_DECORADAS_FLORES: "14.2. Velas Decoradas com Flores",
    CHANTILLY_E_FLOR: "14.3. Chantilly e Flor",
    VASOS_DECORATIVOS: "14.4. Vasos e Produtos Decorativos",
    COLECAO_NATAL: "14.5. Coleção Natal",
    ARVORES_NATAL_AVULSAS: "14.6. Árvores de Natal Avulsas",
    ARVORES_NATAL_COPO: "14.7. Árvores de Natal Dentro do Copo",
    RESINAS_DIVERSAS: "14.8. Resinas e Peças Decorativas",
  };

  const groupedProducts: Record<string, typeof products> = {};
  for (const p of products) {
    if (!groupedProducts[p.category]) {
      groupedProducts[p.category] = [];
    }
    groupedProducts[p.category].push(p);
  }

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            Catálogo Oficial D.A. Com Carinho
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            29 modelos oficiais com preços de referência congelados contra alterações automáticas de custos.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs font-semibold">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Preços protegidos: Mudanças exigem aprovação formal e histórico.</span>
        </div>
      </div>

      {/* Alerta de Regra de Negócio */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Info className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
        <div>
          <strong>Diretriz de Precificação:</strong> O módulo de custos calcula a margem e o custo do lote,
          mas <strong>não altera automaticamente</strong> o preço de venda praticado no catálogo.
          Divergências históricas anteriores foram consolidadas com a tabela oficial acordada.
        </div>
      </div>

      {/* Grid por Categorias */}
      <div className="space-y-8">
        {Object.entries(groupedProducts).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Flame className="w-4 h-4 text-indigo-500" />
              {categoryLabels[category] || category}
              <span className="text-xs font-normal text-slate-400">({items.length} itens)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {item.name}
                      </h3>
                      <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 shrink-0">
                        {item.weightGrams ? `${item.weightGrams} g` : item.volumeMl ? `~${item.volumeMl} ml` : "Unid."}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Preço Oficial
                      </span>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {formatBRL(Number(item.basePrice))}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Estoque</span>
                      <span
                        className={`text-xs font-bold ${
                          item.stockQuantity <= item.minStockQuantity
                            ? "text-red-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {item.stockQuantity} un
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
