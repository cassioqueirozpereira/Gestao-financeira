"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  Boxes,
  Flame,
  ShoppingBag,
  Filter,
  DollarSign,
  ArrowRight,
  LineChart,
  LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface RelatoriosClientViewProps {
  initialData: any;
  costCenters: any[];
}

export function RelatoriosClientView({ initialData, costCenters }: RelatoriosClientViewProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"DRE" | "ESTOQUE" | "PRODUCAO" | "COMPRAS">("DRE");

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [costCenterId, setCostCenterId] = useState("TODOS");
  const [loading, setLoading] = useState(false);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  const handleApplyFilter = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (costCenterId && costCenterId !== "TODOS") params.set("costCenterId", costCenterId);

      const res = await fetch(`/api/relatorios?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Erro ao aplicar filtros:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === "DRE") {
      csvContent += "Tipo;Descricao;Categoria;CentroDeCusto;Data;Valor\n";
      data.financeiro?.receivedItems?.forEach((r: any) => {
        csvContent += `Receita;${r.description};${r.chartOfAccount?.name || ""};${r.costCenter?.name || ""};${new Date(r.receivedAt || r.dueDate).toLocaleDateString("pt-BR")};${r.receivedAmount}\n`;
      });
      data.financeiro?.paidItems?.forEach((p: any) => {
        csvContent += `Despesa;${p.description};${p.chartOfAccount?.name || ""};${p.costCenter?.name || ""};${new Date(p.paidAt || p.dueDate).toLocaleDateString("pt-BR")};-${p.paidAmount}\n`;
      });
    } else if (activeTab === "ESTOQUE") {
      csvContent += "TipoItem;Nome;Unidade;EstoqueAtual;CustoUnitario;ValorTotal\n";
      data.estoque?.rawMaterials?.forEach((m: any) => {
        csvContent += `MateriaPrima;${m.name};${m.unit};${m.currentStock};${m.unitCost};${(Number(m.currentStock) * Number(m.unitCost)).toFixed(2)}\n`;
      });
      data.estoque?.packagings?.forEach((pk: any) => {
        csvContent += `Embalagem;${pk.name};${pk.unit};${pk.currentStock};${pk.unitCost};${(pk.currentStock * Number(pk.unitCost)).toFixed(2)}\n`;
      });
      data.estoque?.products?.forEach((pr: any) => {
        csvContent += `ProdutoAcabado;${pr.name};UN;${pr.stockQuantity};${pr.calculatedCost};${(pr.stockQuantity * Number(pr.calculatedCost)).toFixed(2)}\n`;
      });
    } else if (activeTab === "PRODUCAO") {
      csvContent += "Lote;CentroDeCusto;QtdProduzida;CustoMaterial;CustoOperacional;CustoTotal;CustoUnitario;Data\n";
      data.producao?.orders?.forEach((o: any) => {
        csvContent += `${o.batchNumber};${o.costCenter};${o.quantityProduced};${o.materialCost};${(Number(o.gasCost) + Number(o.energyCost) + Number(o.laborCost)).toFixed(2)};${o.totalCost};${o.unitCost};${new Date(o.productionDate).toLocaleDateString("pt-BR")}\n`;
      });
    } else if (activeTab === "COMPRAS") {
      csvContent += "NumeroPedido;Fornecedor;Status;TotalItens;ValorFrete;ValorTotal;DataPedido\n";
      data.compras?.purchases?.forEach((c: any) => {
        csvContent += `${c.purchaseNumber};${c.supplier?.name || ""};${c.status};${c.items?.length || 0};${c.freightAmount};${c.totalAmount};${new Date(c.orderDate).toLocaleDateString("pt-BR")}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_${activeTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/"
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Dashboard Geral
              </h4>
              <p className="text-xs text-slate-400">Visão macro de caixa, saldo bancário e metas</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/desempenho"
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Painel de Desempenho
              </h4>
              <p className="text-xs text-slate-400">Métricas analíticas, ticket médio e margens operacionais</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Barra de Filtros e Exportação */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Parâmetros de Consulta & Exportação
            </h3>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            Exportar Dados (CSV / Excel)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Centro de Custo
            </label>
            <select
              value={costCenterId}
              onChange={(e) => setCostCenterId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            >
              <option value="TODOS">Todos os Centros</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyFilter}
              disabled={loading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? "Filtrando..." : "Atualizar Relatório"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs dos Relatórios */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("DRE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "DRE"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          DRE Gerencial & Fluxo
        </button>

        <button
          onClick={() => setActiveTab("ESTOQUE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "ESTOQUE"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Boxes className="w-4 h-4" />
          Posição de Estoque
        </button>

        <button
          onClick={() => setActiveTab("PRODUCAO")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "PRODUCAO"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4" />
          Produção & Custos
        </button>

        <button
          onClick={() => setActiveTab("COMPRAS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "COMPRAS"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Compras & Fornecedores
        </button>
      </div>

      {/* Conteúdo Aba DRE */}
      {activeTab === "DRE" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-emerald-600 uppercase">Receitas Realizadas</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatBRL(data.financeiro?.totalReceitas)}</h3>
              <p className="text-xs text-slate-400 mt-1">{data.financeiro?.receivedCount || 0} títulos recebidos</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-rose-600 uppercase">Despesas Pagas</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1">{formatBRL(data.financeiro?.totalDespesas)}</h3>
              <p className="text-xs text-slate-400 mt-1">{data.financeiro?.paidCount || 0} títulos liquidados</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-indigo-600 uppercase">Resultado Líquido do Período</span>
              <h3 className={`text-2xl font-black mt-1 ${data.financeiro?.resultadoLiquido >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatBRL(data.financeiro?.resultadoLiquido)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Margem líquida apurada</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Detalhamento dos Lançamentos</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Tipo</th>
                    <th className="px-4 py-2.5">Descrição</th>
                    <th className="px-4 py-2.5">Plano de Contas</th>
                    <th className="px-4 py-2.5">Centro de Custo</th>
                    <th className="px-4 py-2.5 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.financeiro?.receivedItems?.slice(0, 15).map((r: any) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 font-bold text-emerald-600">RECEITA</td>
                      <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{r.description}</td>
                      <td className="px-4 py-2 text-slate-500">{r.chartOfAccount?.name}</td>
                      <td className="px-4 py-2 text-slate-500">{r.costCenter?.name}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-emerald-600">+{formatBRL(Number(r.receivedAmount))}</td>
                    </tr>
                  ))}
                  {data.financeiro?.paidItems?.slice(0, 15).map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 font-bold text-rose-600">DESPESA</td>
                      <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{p.description}</td>
                      <td className="px-4 py-2 text-slate-500">{p.chartOfAccount?.name}</td>
                      <td className="px-4 py-2 text-slate-500">{p.costCenter?.name}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-rose-600">-{formatBRL(Number(p.paidAmount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Aba Estoque */}
      {activeTab === "ESTOQUE" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-slate-400 uppercase">Patrimônio em Estoque</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatBRL(data.estoque?.totalInventoryValue)}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-emerald-600 uppercase">Matérias-Primas</span>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatBRL(data.estoque?.totalRawValue)}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-blue-600 uppercase">Embalagens</span>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{formatBRL(data.estoque?.totalPackValue)}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-indigo-600 uppercase">Produtos Acabados</span>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{formatBRL(data.estoque?.totalProdValue)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Aba Produção */}
      {activeTab === "PRODUCAO" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-amber-600 uppercase">Lotes Fabricados</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{data.producao?.totalLotes || 0}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-indigo-600 uppercase">Unidades Produzidas</span>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">{data.producao?.totalUnidadesProduzidas || 0} un</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-slate-400 uppercase">Custo Total de Produção</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatBRL(data.producao?.totalCustoProducao)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Aba Compras */}
      {activeTab === "COMPRAS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-indigo-600 uppercase">Total de Pedidos Emitidos</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{data.compras?.purchasesCount || 0} pedidos</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-emerald-600 uppercase">Volume Total Comprado</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatBRL(data.compras?.totalCompras)}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
