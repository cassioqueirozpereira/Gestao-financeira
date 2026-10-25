import React from "react";
import { db } from "@/lib/db";
import { Landmark, AlertTriangle, TrendingDown, Clock, ShieldAlert } from "lucide-react";
import { DebtsClientView } from "./DebtsClientView";

export default async function DebtsPage() {
  let debts: any[] = [];
  let companies: any[] = [];
  let costCenters: any[] = [];
  let accounts: any[] = [];

  try {
    debts = await db.debtObligation.findMany({
      include: {
        company: true,
        costCenter: true,
        installments: {
          orderBy: { installmentNumber: "asc" },
        },
      },
      orderBy: { contractDate: "desc" },
    });
  } catch (e) {
    console.error("Erro ao carregar dívidas:", e);
  }

  try {
    companies = await db.company.findMany();
  } catch (e) {
    console.error("Erro ao carregar empresas:", e);
  }

  try {
    costCenters = await db.costCenter.findMany();
  } catch (e) {
    console.error("Erro ao carregar centros de custo:", e);
  }

  try {
    accounts = await db.chartOfAccount.findMany({
      where: {
        type: { in: ["OBRIGACAO_FINANCEIRA", "DESPESA_ADMINISTRATIVA", "CUSTO_DIRETO"] },
      },
    });
  } catch (e) {
    console.error("Erro ao carregar plano de contas:", e);
  }

  // Indicadores de endividamento
  const totalDividasOriginal = debts.reduce((s, d) => s + Number(d.originalAmount), 0);
  const totalSaldoDevedor = debts.reduce((s, d) => s + Number(d.currentBalance), 0);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-red-500" />
            Dívidas e Obrigações Financeiras
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle de empréstimos, financiamentos e parcelamentos com separação entre amortização do principal e juros.
          </p>
        </div>
      </div>

      {/* Regra Contábil de Dívidas */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <strong>Diretriz Contábil:</strong> A entrada de um empréstimo não é classificada como receita operacional,
          e o pagamento do principal reduz o passivo sem poluir as despesas operacionais da DRE (apenas juros e encargos compõem despesas financeiras).
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Saldo Devedor Consolidado
          </span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {formatBRL(totalSaldoDevedor)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total Contratado Original: {formatBRL(totalDividasOriginal)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Obrigações Ativas
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {debts.filter((d) => d.status === "ATIVO").length} contratos
          </div>
          <p className="text-xs text-slate-500 mt-1">Empréstimos, mútuos e parcelamentos</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Integração Financeira
          </span>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
            ✓ Cronogramas vinculados ao Contas a Pagar
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Zero risco de esquecimento ou dupla contagem
          </p>
        </div>
      </div>

      <DebtsClientView
        initialDebts={debts}
        companies={companies}
        costCenters={costCenters}
        accounts={accounts}
      />
    </div>
  );
}
