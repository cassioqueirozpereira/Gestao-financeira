import React from "react";
import { db } from "@/lib/db";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Building2,
  TrendingUp,
  ShoppingBag,
  Megaphone,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface DashboardPageProps {
  searchParams: { centro?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const selectedCostCenterCode = searchParams.centro || "TODOS";

  // Busca Centro de Custo se filtrado
  let costCenterFilterId: string | undefined = undefined;
  let costCenterName = "Visão Geral Consolidada";

  if (selectedCostCenterCode !== "TODOS") {
    const cc = await db.costCenter.findUnique({
      where: { code: selectedCostCenterCode },
    });
    if (cc) {
      costCenterFilterId = cc.id;
      costCenterName = cc.name;
    }
  }

  // 1. Saldos Bancários
  const bankAccounts = await db.bankAccount.findMany();
  const totalBankBalance = bankAccounts.reduce(
    (sum, acc) => sum + Number(acc.currentBalance || 0),
    0
  );

  // 2. Contas a Pagar
  const payables = await db.accountPayable.findMany({
    where: costCenterFilterId ? { costCenterId: costCenterFilterId } : {},
  });

  const now = new Date();
  const openPayables = payables.filter((p) => p.status === "EM_ABERTO" || p.status === "A_VENCER");
  const overduePayables = payables.filter((p) => p.status === "VENCIDA" || (p.dueDate < now && p.status === "EM_ABERTO"));
  const paidThisMonth = payables.filter(
    (p) => p.status === "PAGA" && p.paidAt && p.paidAt.getMonth() === now.getMonth()
  );

  const totalOpenPayableAmount = openPayables.reduce((s, p) => s + Number(p.originalAmount), 0);
  const totalOverduePayableAmount = overduePayables.reduce((s, p) => s + Number(p.originalAmount), 0);
  const totalPaidThisMonth = paidThisMonth.reduce((s, p) => s + Number(p.paidAmount), 0);

  // 3. Contas a Receber
  const receivables = await db.accountReceivable.findMany({
    where: costCenterFilterId ? { costCenterId: costCenterFilterId } : {},
  });

  const openReceivables = receivables.filter((r) => r.status === "A_RECEBER" || r.status === "A_VENCER");
  const overdueReceivables = receivables.filter((r) => r.status === "VENCIDA" || (r.dueDate < now && r.status === "A_RECEBER"));
  const receivedThisMonth = receivables.filter(
    (r) => r.status === "RECEBIDA" && r.receivedAt && r.receivedAt.getMonth() === now.getMonth()
  );

  const totalOpenReceivableAmount = openReceivables.reduce((s, r) => s + Number(r.originalAmount), 0);
  const totalOverdueReceivableAmount = overdueReceivables.reduce((s, r) => s + Number(r.originalAmount), 0);
  const totalReceivedThisMonth = receivedThisMonth.reduce((s, r) => s + Number(r.receivedAmount), 0);

  // 4. Catálogo e Estoque
  const products = await db.product.findMany();
  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockQuantity);

  // 5. Recuperação de Capital D.A. Com Carinho
  const capitalRecovery = await db.capitalRecovery.findFirst();
  const initialCap = Number(capitalRecovery?.initialCapital || 1600.0);
  const recoveredCap = Number(capitalRecovery?.recoveredAmount || 0);
  const remainingCap = initialCap - recoveredCap;

  // 6. Gastos com Mídia
  const mediaExpenses = await db.mediaExpense.findMany({
    where: costCenterFilterId ? { costCenterId: costCenterFilterId } : {},
  });
  const totalMediaSpent = mediaExpenses.reduce((s, m) => s + Number(m.spentAmount), 0);

  // Formatação monetária
  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Banner do Centro de Custo Selecionado */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-800/50 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Unidade Operacional Ativa</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{costCenterName}</h2>
          <p className="text-sm text-slate-300 mt-1">
            {selectedCostCenterCode === "TODOS"
              ? "Exibindo consolidação financeira e operacional de todas as unidades integradas."
              : `Filtro aplicado exclusivamente para as transações de ${costCenterName}.`}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 shrink-0">
          <Calendar className="w-4 h-4 text-indigo-300" />
          <span className="text-xs font-medium">Competência: Outubro / 2026</span>
        </div>
      </div>

      {/* Grid de Cards de Disponibilidade e Liquidez */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Bancário */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Disponibilidade em Caixa
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatBRL(totalBankBalance)}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
            <span className="text-blue-600 font-medium">{bankAccounts.length}</span> contas bancárias cadastradas
          </p>
        </div>

        {/* Contas a Receber em Aberto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              A Receber (Previsto)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatBRL(totalOpenReceivableAmount)}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Recebido no mês: {formatBRL(totalReceivedThisMonth)}
          </p>
        </div>

        {/* Contas a Pagar em Aberto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              A Pagar (Compromissos)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatBRL(totalOpenPayableAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Pago no mês: {formatBRL(totalPaidThisMonth)}
          </p>
        </div>

        {/* Inadimplência / Valores Vencidos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Valores Vencidos
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400">
            {formatBRL(totalOverduePayableAmount + totalOverdueReceivableAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Pagar: {formatBRL(totalOverduePayableAmount)} • Receber: {formatBRL(totalOverdueReceivableAmount)}
          </p>
        </div>
      </div>

      {/* Grid de Seções Específicas: D.A. Com Carinho & Mídia & Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Recuperação de Capital D.A. Com Carinho */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Recuperação de Capital — D.A.
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Acompanhamento do capital inicial de R$ 1.600,00 e retiradas reais da operação.
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Investimento Inicial:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatBRL(initialCap)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Valor Efetivamente Recuperado:</span>
                <span className="font-bold text-emerald-600">
                  {formatBRL(recoveredCap)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-200 dark:border-slate-800 pt-2 font-semibold">
                <span>Saldo a Recuperar:</span>
                <span className="text-amber-600 font-extrabold">
                  {formatBRL(remainingCap)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (recoveredCap / initialCap) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 text-right mt-1 font-medium">
                {((recoveredCap / initialCap) * 100).toFixed(1)}% recuperado
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] text-slate-500">
            💡 Nota contábil: Estoque e lucro em papel não contam como capital recuperado até haver retirada real.
          </div>
        </div>

        {/* Card 2: Catálogo & Alertas de Estoque */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-2">
              <ShoppingBag className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Catálogo & Estoque D.A.
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Total de 29 modelos oficiais de velas e peças de resina catalogados.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                <span className="text-xs text-slate-500 block">Itens Ativos</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {products.length}
                </span>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-center">
                <span className="text-xs text-red-500 block font-medium">Estoque Baixo</span>
                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                  {lowStockProducts.length}
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Velas Normais & Coloridas:</span>
                <span className="font-semibold">4 modelos</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Velas Decoradas com Flores:</span>
                <span className="font-semibold">5 modelos</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Vasos & Coleção Natal:</span>
                <span className="font-semibold">17 modelos</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Chantilly e Outros:</span>
                <span className="font-semibold">3 modelos</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <a
              href="/catalogo"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ver Catálogo Completo →
            </a>
          </div>
        </div>

        {/* Card 3: Gestão de Mídia & Marketing */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
              <Megaphone className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Gastos com Mídia & Tráfego
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Meta Ads, Google Ads e TikTok com separação estrita de verbas próprias vs clientes.
            </p>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-4">
              <span className="text-xs text-slate-500 block">Total Investido em Campanhas:</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {formatBRL(totalMediaSpent)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Divulgação Própria (Negócios):</span>
                <span className="font-semibold">{formatBRL(totalMediaSpent)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Verba Direta de Clientes (Mídia Social):</span>
                <span className="font-semibold text-slate-400">{formatBRL(0)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-[11px] text-indigo-700 dark:text-indigo-300">
            🛡️ A verba paga pelo cliente diretamente à plataforma não cria saída financeira fictícia no caixa da prestadora.
          </div>
        </div>
      </div>
    </div>
  );
}
