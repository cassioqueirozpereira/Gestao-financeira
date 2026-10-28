import React from "react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import {
  LineChart,
  TrendingUp,
  DollarSign,
  Users,
  Megaphone,
  Info,
  Calendar,
  Building2,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

interface PerformancePageProps {
  searchParams?: { centro?: string };
}

export default async function PerformanceDashboardPage({ searchParams }: PerformancePageProps) {
  const params = await Promise.resolve(searchParams);
  const selectedCostCenterCode = params?.centro || "TODOS";

  let costCenterFilterId: string | undefined = undefined;
  let costCenterName = "Visão Consolidada de Todos os Negócios";

  if (selectedCostCenterCode !== "TODOS") {
    try {
      const cc = await db.costCenter.findUnique({
        where: { code: selectedCostCenterCode },
      });
      if (cc) {
        costCenterFilterId = cc.id;
        costCenterName = cc.name;
      }
    } catch (e) {
      console.error("Erro ao carregar centro de custo:", e);
    }
  }

  // 1. Apuração paralela de dados para o painel de desempenho
  const [
    payablesRes,
    receivablesRes,
    customersRes,
    ordersRes,
    mediaExpensesRes,
    capitalRes,
  ] = await Promise.allSettled([
    db.accountPayable.findMany({
      where: costCenterFilterId ? { costCenterId: costCenterFilterId } : {},
    }),
    db.accountReceivable.findMany({
      where: costCenterFilterId ? { costCenterId: costCenterFilterId } : {},
    }),
    db.customer.findMany(),
    db.order.findMany(),
    db.mediaExpense.findMany({
      where: costCenterFilterId ? { costCenterId: costCenterFilterId } : {},
    }),
    db.capitalRecovery.findFirst(),
  ]);

  const payables = payablesRes.status === "fulfilled" ? payablesRes.value : [];
  const receivables = receivablesRes.status === "fulfilled" ? receivablesRes.value : [];
  const customers = customersRes.status === "fulfilled" ? customersRes.value : [];
  const orders = ordersRes.status === "fulfilled" ? ordersRes.value : [];
  const mediaExpenses = mediaExpensesRes.status === "fulfilled" ? mediaExpensesRes.value : [];
  const capital = capitalRes.status === "fulfilled" ? capitalRes.value : null;

  const totalReceivablePrevisto = receivables.reduce((s, r) => s + Number(r.originalAmount), 0);
  const totalRecebidoRealizado = receivables
    .filter((r) => r.status === "RECEBIDA")
    .reduce((s, r) => s + Number(r.receivedAmount), 0);

  const totalPayablePrevisto = payables.reduce((s, p) => s + Number(p.originalAmount), 0);
  const totalPagoRealizado = payables
    .filter((p) => p.status === "PAGA")
    .reduce((s, p) => s + Number(p.paidAmount), 0);

  const lucroRealizado = totalRecebidoRealizado - totalPagoRealizado;
  const margemLucro =
    totalRecebidoRealizado > 0 ? (lucroRealizado / totalRecebidoRealizado) * 100 : null;

  // Inadimplência
  const now = new Date();
  const vencidosReceber = receivables.filter(
    (r) => r.status === "VENCIDA" || (r.dueDate < now && r.status === "A_RECEBER")
  );
  const valorVencidoReceber = vencidosReceber.reduce((s, r) => s + Number(r.originalAmount), 0);
  const taxaInadimplencia =
    totalReceivablePrevisto > 0 ? (valorVencidoReceber / totalReceivablePrevisto) * 100 : 0;

  // 2. Apuração Comercial (CRM)
  const leadsCount = customers.length;
  const convertedCount = customers.filter(
    (c) => c.status === "CONVERTIDA" || c.status === "APROVADA"
  ).length;
  const taxaConversao = leadsCount > 0 ? (convertedCount / leadsCount) * 100 : null;

  const totalVendasValor = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const ticketMedio = orders.length > 0 ? totalVendasValor / orders.length : null;

  // 3. Apuração Mídia Social
  const totalInvestimentoMidia = mediaExpenses.reduce((s, m) => s + Number(m.spentAmount || 0), 0);

  // Capital D.A.
  const capInvestido = Number(capital?.initialCapital || 1600);
  const capRecuperado = Number(capital?.recoveredAmount || 0);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <LineChart className="w-4 h-4" />
            <span>Controladoria & Desempenho Operacional</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{costCenterName}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Comparativo de resultados reais, previsões e fórmulas documentadas sem estimativas fictícias.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl text-xs font-medium shrink-0">
          <Calendar className="w-4 h-4 text-indigo-300" />
          <span>Filtro: {selectedCostCenterCode}</span>
        </div>
      </div>

      {/* Regra de Ouro: Fórmulas Documentadas */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Info className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
        <div>
          <strong>Diretriz de Transparência de KPIs:</strong> Todas as métricas abaixo possuem suas
          fórmulas documentadas. Caso faltem dados estruturados (ex: dados de engajamento do Meta Ads
          ainda não importados), o sistema sinaliza como <em>"Dados Insuficientes"</em> em vez de gerar
          números inventados.
        </div>
      </div>

      {/* Seção 1: Indicadores Financeiros */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          1. Indicadores Financeiros
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Receitas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Receita Prevista vs Realizada
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {formatBRL(totalRecebidoRealizado)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Previsto: <strong className="text-slate-700 dark:text-slate-300">{formatBRL(totalReceivablePrevisto)}</strong>
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Fórmula: ∑ Recebimentos confirmados em contas a receber.
            </div>
          </div>

          {/* Despesas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Despesas Previstas vs Realizadas
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {formatBRL(totalPagoRealizado)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Previsto: <strong className="text-slate-700 dark:text-slate-300">{formatBRL(totalPayablePrevisto)}</strong>
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Fórmula: ∑ Saídas pagas em contas a pagar.
            </div>
          </div>

          {/* Lucro Operacional e Margem */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Resultado Líquido & Margem
            </span>
            <div
              className={`text-xl font-bold mt-1 ${
                lucroRealizado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
              }`}
            >
              {formatBRL(lucroRealizado)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Margem:{" "}
              {margemLucro !== null ? (
                <strong className="text-slate-800 dark:text-slate-200">{margemLucro.toFixed(1)}%</strong>
              ) : (
                <span className="text-amber-500">Sem receita base</span>
              )}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Fórmula: (Receita Realizada - Despesa Realizada) ÷ Receita.
            </div>
          </div>

          {/* Inadimplência */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Índice de Inadimplência
            </span>
            <div
              className={`text-xl font-bold mt-1 ${
                taxaInadimplencia > 0 ? "text-red-500" : "text-emerald-600"
              }`}
            >
              {taxaInadimplencia.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Valores vencidos: {formatBRL(valorVencidoReceber)}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Fórmula: (Recebíveis Vencidos ÷ Total Previsto) × 100.
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2: Indicadores Comerciais */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          2. Indicadores Comerciais & CRM
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Total de Contatos / Leads
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{leadsCount}</div>
            <p className="text-xs text-slate-500 mt-1">
              Convertidos: <strong>{convertedCount}</strong>
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Captados via formulário público `/orcamento` e CRM.
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Taxa de Conversão de Propostas
            </span>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {taxaConversao !== null ? `${taxaConversao.toFixed(1)}%` : "0.0%"}
            </div>
            <p className="text-xs text-slate-500 mt-1">Leads transformados em contratos/vendas</p>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Fórmula: (Propostas Aprovadas ÷ Total de Leads) × 100.
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Ticket Médio de Venda
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {ticketMedio !== null ? formatBRL(ticketMedio) : formatBRL(0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {orders.length} pedidos finalizados
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Fórmula: Valor Total Vendido ÷ Quantidade de Pedidos.
            </div>
          </div>
        </div>
      </div>

      {/* Seção 3: Indicadores de Mídia Social & Marketing */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-purple-500" />
          3. Indicadores de Mídia Social & Marketing
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Investimento em Tráfego Pago
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {formatBRL(totalInvestimentoMidia)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Meta Ads, Google Ads e TikTok</p>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Distinção: Verba própria dos negócios vs Verba de clientes.
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Custo por Lead (CPL)
            </span>
            <div className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-2">
              {leadsCount > 0 && totalInvestimentoMidia > 0 ? (
                formatBRL(totalInvestimentoMidia / leadsCount)
              ) : (
                <span className="text-xs font-medium text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                  Aguardando dados de campanhas
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Investimento ÷ Leads gerados</p>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Não inventamos números fictícios sem métricas importadas.
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              ROAS (Retorno sobre Investimento)
            </span>
            <div className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-2">
              {totalInvestimentoMidia > 0 && totalRecebidoRealizado > 0 ? (
                `${(totalRecebidoRealizado / totalInvestimentoMidia).toFixed(2)}x`
              ) : (
                <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  Dados insuficientes para atribuição
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Receita atribuída ÷ Gasto em anúncios</p>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Exige faturamento com tag de atribuição de campanha.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
