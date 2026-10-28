import React from "react";
import { db } from "@/lib/db";
import { Wallet, ArrowUpCircle, ArrowDownCircle, RefreshCw, Calendar, TrendingUp, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface CashFlowProps {
  searchParams?: { centro?: string };
}

export default async function CashFlowPage({ searchParams }: CashFlowProps) {
  const params = await Promise.resolve(searchParams);
  const selectedCostCenterCode = params?.centro || "TODOS";

  let costCenterFilterId: string | undefined = undefined;
  if (selectedCostCenterCode !== "TODOS") {
    try {
      const cc = await db.costCenter.findUnique({ where: { code: selectedCostCenterCode } });
      if (cc) costCenterFilterId = cc.id;
    } catch (e) {
      console.error("Erro ao carregar centro de custo:", e);
    }
  }

  // 1. Executa consultas em paralelo com Promise.allSettled
  const [bankAccountsRes, receivablesRes, payablesRes] = await Promise.allSettled([
    db.bankAccount.findMany(),
    db.accountReceivable.findMany({
      where: costCenterFilterId ? { costCenterId: costCenterFilterId } : {},
      orderBy: { dueDate: "asc" },
    }),
    db.accountPayable.findMany({
      where: costCenterFilterId ? { costCenterId: costCenterFilterId } : {},
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const bankAccounts = bankAccountsRes.status === "fulfilled" ? bankAccountsRes.value : [];
  const receivables = receivablesRes.status === "fulfilled" ? receivablesRes.value : [];
  const payables = payablesRes.status === "fulfilled" ? payablesRes.value : [];

  const saldoInicialConsolidado = bankAccounts.reduce((s, a) => s + Number(a.initialBalance || 0), 0);
  const saldoAtualConsolidado = bankAccounts.reduce((s, a) => s + Number(a.currentBalance || 0), 0);

  const entradasPrevistas = receivables.reduce((s, r) => s + Number(r.originalAmount || 0), 0);
  const entradasRealizadas = receivables
    .filter((r) => r.status === "RECEBIDA")
    .reduce((s, r) => s + Number(r.receivedAmount || 0), 0);

  const saidasPrevistas = payables.reduce((s, p) => s + Number(p.originalAmount || 0), 0);
  const saidasRealizadas = payables
    .filter((p) => p.status === "PAGA")
    .reduce((s, p) => s + Number(p.paidAmount || 0), 0);

  // 4. Balanços
  const saldoFinalPrevisto = saldoInicialConsolidado + entradasPrevistas - saidasPrevistas;
  const saldoFinalRealizado = saldoInicialConsolidado + entradasRealizadas - saidasRealizadas;

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-indigo-600" />
            Fluxo de Caixa Integrado
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento de entradas e saídas previstas versus realizadas, disponibilidade e projeções de liquidez.
          </p>
        </div>
      </div>

      {/* Grid de Resumo do Fluxo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Inicial */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Saldo Inicial de Referência
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatBRL(saldoInicialConsolidado)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total inicial das contas cadastradas</p>
        </div>

        {/* Entradas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Entradas (Recebimentos)
            </span>
            <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {formatBRL(entradasRealizadas)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Previsto: <strong>{formatBRL(entradasPrevistas)}</strong>
          </p>
        </div>

        {/* Saídas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
              Saídas (Pagamentos)
            </span>
            <ArrowDownCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-bold text-red-500">
            {formatBRL(saidasRealizadas)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Previsto: <strong>{formatBRL(saidasPrevistas)}</strong>
          </p>
        </div>

        {/* Saldo Final */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
            Saldo Final em Caixa
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {formatBRL(saldoAtualConsolidado)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Projeção Final: <strong>{formatBRL(saldoFinalPrevisto)}</strong>
          </p>
        </div>
      </div>

      {/* Linha do Tempo e Projeção */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Cronograma Consolidado de Vencimentos
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Conciliação de compromissos futuros a vencer nos próximos períodos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Próximas Entradas */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-1.5">
              <ArrowUpCircle className="w-4 h-4" /> Próximas Entradas Previstas
            </h4>
            {receivables.filter((r) => r.status === "A_RECEBER").length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum recebível futuro em aberto.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {receivables
                  .filter((r) => r.status === "A_RECEBER")
                  .slice(0, 5)
                  .map((r) => (
                    <div key={r.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{r.description}</span>
                        <span className="text-[10px] text-slate-400">{new Date(r.dueDate).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <span className="font-bold text-emerald-600">{formatBRL(Number(r.originalAmount))}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Próximas Saídas */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-red-500 mb-3 flex items-center gap-1.5">
              <ArrowDownCircle className="w-4 h-4" /> Próximas Saídas Previstas
            </h4>
            {payables.filter((p) => p.status === "EM_ABERTO").length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum compromisso a pagar em aberto.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {payables
                  .filter((p) => p.status === "EM_ABERTO")
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{p.description}</span>
                        <span className="text-[10px] text-slate-400">{new Date(p.dueDate).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <span className="font-bold text-red-500">{formatBRL(Number(p.originalAmount))}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
