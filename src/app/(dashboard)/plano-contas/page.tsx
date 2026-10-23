import React from "react";
import { db } from "@/lib/db";
import { ListTree, ShieldAlert, CheckCircle } from "lucide-react";

export default async function ChartOfAccountsPage() {
  const accounts = await db.chartOfAccount.findMany({
    orderBy: { code: "asc" },
  });

  const typeLabels: Record<string, { label: string; color: string }> = {
    RECEITA_OPERACIONAL: { label: "Receita Operacional", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
    CUSTO_DIRETO: { label: "Custo Direto", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40" },
    CUSTO_INDIRETO: { label: "Custo Indireto", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
    DESPESA_ADMINISTRATIVA: { label: "Despesa Administrativa", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" },
    DESPESA_COMERCIAL_MARKETING: { label: "Comercial / Mídia", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" },
    INVESTIMENTO_ATIVO: { label: "Investimento / Ativo", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
    APORTE_CAPITAL: { label: "Aporte de Capital (Não-Receita)", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40" },
    TRANSFERENCIA_INTERNA: { label: "Transferência Interna (Neutro)", color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
    APLICACAO_RESGATE: { label: "Aplicação / Resgate", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ListTree className="w-6 h-6 text-indigo-600" />
          Plano de Contas Hierárquico
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Classificação gerencial em até 4 níveis para apuração de DRE, fluxo de caixa e custos reais.
        </p>
      </div>

      {/* Regra de Ouro Contábil */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div className="text-xs space-y-1">
          <h2 className="font-bold text-sm text-slate-200">Regras de Validação Gerencial:</h2>
          <p className="text-slate-400">
            • Aportes de capital e transferências entre contas próprias nunca são classificados como receita operacional.
          </p>
          <p className="text-slate-400">
            • Compras de matéria-prima para estoque não são confundidas com consumo direto na produção.
          </p>
        </div>
      </div>

      {/* Lista da Árvore */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>Código & Descrição da Conta</span>
          <span>Natureza / Classificação Contábil</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {accounts.map((acc) => {
            const badge = typeLabels[acc.type] || {
              label: acc.type,
              color: "text-slate-600 bg-slate-100",
            };
            const paddingLeft =
              acc.level === 1 ? "pl-4" : acc.level === 2 ? "pl-9" : acc.level === 3 ? "pl-14" : "pl-20";

            return (
              <div
                key={acc.id}
                className={`py-3 pr-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${paddingLeft}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs ${
                      acc.level === 1
                        ? "font-bold text-indigo-600 dark:text-indigo-400 text-sm"
                        : "text-slate-500 font-semibold"
                    }`}
                  >
                    {acc.code}
                  </span>
                  <span
                    className={`text-sm ${
                      acc.level === 1
                        ? "font-bold text-slate-900 dark:text-white"
                        : "text-slate-700 dark:text-slate-300 font-medium"
                    }`}
                  >
                    {acc.name}
                  </span>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badge.color}`}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
