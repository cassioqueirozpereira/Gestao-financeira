"use client";

import React, { useState } from "react";
import { TrendingUp, ShieldCheck, DollarSign, Wallet, Edit3, X, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface InvestmentsClientViewProps {
  initialRecovery: any;
}

export function InvestmentsClientView({ initialRecovery }: InvestmentsClientViewProps) {
  const router = useRouter();
  const [recovery, setRecovery] = useState(initialRecovery);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const initialCap = Number(recovery?.initialCapital || 1600.0);
  const aports = Number(recovery?.additionalAports || 0);
  const totalInvested = initialCap + aports;
  const recovered = Number(recovery?.recoveredAmount || 0);
  const remaining = totalInvested - recovered;
  const percentage = totalInvested > 0 ? (recovered / totalInvested) * 100 : 0;

  // Form
  const [newRecovered, setNewRecovered] = useState(String(recovered));
  const [newAports, setNewAports] = useState(String(aports));
  const [notes, setNotes] = useState(recovery?.notes || "");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/investimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoveredAmount: parseFloat(newRecovered) || 0,
          additionalAports: parseFloat(newAports) || 0,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRecovery(data.capitalRecovery);
        setShowModal(false);
        router.refresh();
      }
    } catch {
      alert("Erro ao atualizar capital");
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      {/* Alerta de Governança */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
        <div>
          <strong>Diretriz de Recuperação de Capital:</strong> O capital recuperado é registrado apenas
          quando há retirada de dinheiro gerado pela operação para devolver o capital investido pelos sócios.
          O estoque e o lucro contábil no papel <strong>não são tratados automaticamente como dinheiro recuperado</strong>.
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
        >
          <Edit3 className="w-4 h-4" />
          Registrar Retirada / Aporte de Capital
        </button>
      </div>

      {/* Painel do Capital D.A. Com Carinho */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Status de Payback — D.A. Com Carinho
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 block font-semibold uppercase">Capital Investido</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {formatBRL(totalInvested)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Inicial: {formatBRL(initialCap)}</span>
          </div>

          <div className="p-5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold uppercase">
              Valor Efetivamente Recuperado
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {formatBRL(recovered)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Retiradas reais da operação</span>
          </div>

          <div className="p-5 bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/40">
            <span className="text-xs text-amber-600 dark:text-amber-400 block font-semibold uppercase">
              Saldo Restante a Recuperar
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {formatBRL(remaining)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Para alcançar o ponto de equilíbrio</span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">Progresso do Payback</span>
            <span className="text-indigo-600 dark:text-indigo-400">{percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
        </div>

        {recovery?.notes && (
          <p className="mt-6 text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <strong>Observações:</strong> {recovery.notes}
          </p>
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
              Atualizar Movimentações de Capital
            </h3>
            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Valor Total Efetivamente Recuperado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newRecovered}
                  onChange={(e) => setNewRecovered(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Aportes Adicionais (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAports}
                  onChange={(e) => setNewAports(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Notas / Justificativa</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 border rounded-xl">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-xl">
                  {loading ? "Salvando..." : "Confirmar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
