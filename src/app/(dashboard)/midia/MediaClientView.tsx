"use client";

import React, { useState } from "react";
import { Plus, X, Megaphone, ShieldCheck, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface MediaClientViewProps {
  initialExpenses: any[];
  costCenters: any[];
}

export function MediaClientView({ initialExpenses, costCenters }: MediaClientViewProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [costCenterId, setCostCenterId] = useState(costCenters[0]?.id || "");
  const [targetType, setTargetType] = useState<"DIVULGACAO_PROPRIA" | "VERBA_CLIENTE" | "GESTAO_HONORARIOS">("DIVULGACAO_PROPRIA");
  const [platform, setPlatform] = useState("Meta Ads (Facebook/Instagram)");
  const [campaignName, setCampaignName] = useState("");
  const [budgeted, setBudgeted] = useState("500.00");
  const [spentAmount, setSpentAmount] = useState("350.00");
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/midia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          costCenterId,
          targetType,
          platform,
          campaignName,
          budgeted: parseFloat(budgeted) || 0,
          spentAmount: parseFloat(spentAmount) || 0,
          clientName: targetType === "VERBA_CLIENTE" ? clientName : null,
          date,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar campanha");

      setExpenses([data.expense, ...expenses]);
      setShowModal(false);
      setCampaignName("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
        <div>
          <strong>Diretriz de Transparência de Verbas:</strong> Na operação de Mídia Social, as verbas pagas
          diretamente pelo cliente às plataformas de anúncio (Meta/Google) <strong>não geram saída financeira
          fictícia no caixa da prestadora</strong>. Apenas a taxa de serviço/gestão é reconhecida como receita.
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Registrar Gasto de Mídia / Campanha
        </button>
      </div>

      {/* Lista de Gastos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-xs">
        {expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Nenhuma campanha ou gasto de mídia registrado. Clique no botão acima para adicionar registros de Meta Ads, Google Ads ou TikTok Ads.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Campanha</th>
                  <th className="py-3 px-4">Plataforma</th>
                  <th className="py-3 px-4">Unidade / Negócio</th>
                  <th className="py-3 px-4">Tipo de Verba</th>
                  <th className="py-3 px-4">Orçado</th>
                  <th className="py-3 px-4">Gasto Efetivo</th>
                  <th className="py-3 px-4">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {exp.campaignName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{exp.platform}</td>
                    <td className="py-3 px-4">{exp.costCenter?.name || "-"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.targetType === "VERBA_CLIENTE"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                        }`}
                      >
                        {exp.targetType === "VERBA_CLIENTE" ? "Verba de Cliente" : "Divulgação Própria"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatBRL(Number(exp.budgeted))}</td>
                    <td className="py-3 px-4 font-black text-rose-600 dark:text-rose-400">
                      {formatBRL(Number(exp.spentAmount))}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(exp.date).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-xs">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Registrar Despesa de Mídia & Tráfego
            </h3>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Nome da Campanha *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lançamento Coleção Velas Natal, Anúncios CassaraTech..."
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Plataforma</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="Meta Ads (Facebook/Instagram)">Meta Ads (Instagram/Face)</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="TikTok Ads">TikTok Ads</option>
                    <option value="Impulsionamento Direto">Impulsionamento Direto</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Centro de Custo</label>
                  <select
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Classificação da Verba</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                >
                  <option value="DIVULGACAO_PROPRIA">Divulgação Própria (CassaraTech / D.A. Com Carinho)</option>
                  <option value="VERBA_CLIENTE">Verba Pertencente ao Cliente (Sem saída de caixa própria)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Valor Orçado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgeted}
                    onChange={(e) => setBudgeted(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Valor Gasto (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={spentAmount}
                    onChange={(e) => setSpentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 border rounded-xl">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-xl">
                  {loading ? "Salvando..." : "Salvar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
