"use client";

import React, { useState } from "react";
import { Plus, X, Flame, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductionClientViewProps {
  initialOrders: any[];
}

export function ProductionClientView({ initialOrders }: ProductionClientViewProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [batchNumber, setBatchNumber] = useState(
    `LOTE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-01`
  );
  const [costCenter, setCostCenter] = useState<"VELAS" | "RESINAS">("VELAS");
  const [materialCost, setMaterialCost] = useState("15.50");
  const [gasCost, setGasCost] = useState("0.20");
  const [energyCost, setEnergyCost] = useState("0.45");
  const [laborCost, setLaborCost] = useState("60.00");
  const [notes, setNotes] = useState("");

  const totalCalculado =
    (parseFloat(materialCost) || 0) +
    (parseFloat(gasCost) || 0) +
    (parseFloat(energyCost) || 0) +
    (parseFloat(laborCost) || 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/producao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchNumber,
          costCenter,
          materialCost: parseFloat(materialCost),
          gasCost: parseFloat(gasCost),
          energyCost: parseFloat(energyCost),
          laborCost: parseFloat(laborCost),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar lote");

      setOrders([data.order, ...orders]);
      setShowModal(false);
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
      {/* Alerta de Governança dos Lotes Históricos */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <strong>Histórico de Produção a Conferir:</strong> Os lotes anteriores de 19/10 e 22/10
          (totalizando R$ 152,18 estimados) são mantidos como dados históricos de referência. O
          sistema não cria saídas financeiras automáticas se esses valores já estiverem contemplados
          no investimento de R$ 1.600,00 ou compras registradas.
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Registrar Novo Lote de Produção
        </button>
      </div>

      {/* Grid de Lotes Históricos Registrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lote 19/10 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Lote Histórico 19/10</span>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold text-[10px]">
              Velas & Decorações
            </span>
          </div>
          <p className="text-slate-500">
            6 velas de 24g, 1 vela de 100g, 2 rosas de 8g e 1 pote de 25g (latinhas e vidros).
          </p>
          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>Materiais: {formatBRL(15.15)}</div>
            <div>Gás: {formatBRL(0.20)}</div>
            <div>Energia: {formatBRL(0.45)}</div>
            <div>Mão de Obra: {formatBRL(60.00)}</div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold">
            <span>Custo Total do Lote:</span>
            <span className="text-amber-600 dark:text-amber-400 text-sm">{formatBRL(75.80)}</span>
          </div>
        </div>

        {/* Lote 22/10 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Lote Histórico 22/10</span>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold text-[10px]">
              Velas Trançadas & Vidro
            </span>
          </div>
          <p className="text-slate-500">
            100g cera principal + 20g decorações, 3 pavios, 2 recipientes trançados e 1 copo de vidro.
          </p>
          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>Materiais: {formatBRL(15.73)}</div>
            <div>Gás: {formatBRL(0.20)}</div>
            <div>Energia: {formatBRL(0.45)}</div>
            <div>Mão de Obra: {formatBRL(60.00)}</div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold">
            <span>Custo Total do Lote:</span>
            <span className="text-amber-600 dark:text-amber-400 text-sm">{formatBRL(76.38)}</span>
          </div>
        </div>
      </div>

      {/* Lista de Ordens Recentes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Lotes Cadastrados no Sistema
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Nenhum lote novo registrado além das produções históricas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-4">Materiais</th>
                  <th className="py-3 px-4">Gás/Energia</th>
                  <th className="py-3 px-4">Mão de Obra</th>
                  <th className="py-3 px-4">Custo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">{o.batchNumber}</td>
                    <td className="py-3 px-4">{o.costCenter}</td>
                    <td className="py-3 px-4">{formatBRL(Number(o.materialCost))}</td>
                    <td className="py-3 px-4">{formatBRL(Number(o.gasCost) + Number(o.energyCost))}</td>
                    <td className="py-3 px-4">{formatBRL(Number(o.laborCost))}</td>
                    <td className="py-3 px-4 font-black">{formatBRL(Number(o.totalCost))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Novo Lote */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-xs">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Apuração de Novo Lote de Produção
            </h3>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Identificador do Lote *</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Linha de Produção</label>
                  <select
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="VELAS">Velas Artesanais</option>
                    <option value="RESINAS">Peças em Resina</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Custo de Matérias-Primas (Cera, Essência, Recipientes) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={materialCost}
                  onChange={(e) => setMaterialCost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Gás (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gasCost}
                    onChange={(e) => setGasCost(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Energia (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={energyCost}
                    onChange={(e) => setEnergyCost(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mão de Obra (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center font-bold">
                <span>Custo Total Estimado:</span>
                <span className="text-amber-600 dark:text-amber-400 text-sm">{formatBRL(totalCalculado)}</span>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 border rounded-xl">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-xl">
                  {loading ? "Gravando..." : "Salvar Lote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
