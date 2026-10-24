"use client";

import React, { useState } from "react";
import { Plus, X, ArrowUpCircle, CheckCircle2, AlertCircle, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReceivablesClientViewProps {
  initialReceivables: any[];
  costCenters: any[];
  customers: any[];
  accounts: any[];
}

export function ReceivablesClientView({
  initialReceivables,
  costCenters,
  customers,
  accounts,
}: ReceivablesClientViewProps) {
  const router = useRouter();
  const [receivables, setReceivables] = useState(initialReceivables);
  const [showModal, setShowModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states de criação
  const [description, setDescription] = useState("");
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [costCenterId, setCostCenterId] = useState(costCenters[0]?.id || "");
  const [chartOfAccountId, setChartOfAccountId] = useState(accounts[0]?.id || "");
  const [originalAmount, setOriginalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [competenceDate, setCompetenceDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Form states de liquidação
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split("T")[0]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contas-receber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          customerId,
          costCenterId,
          chartOfAccountId,
          originalAmount: parseFloat(originalAmount),
          dueDate,
          competenceDate,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar");

      setReceivables([data.receivable, ...receivables]);
      setShowModal(false);
      setDescription("");
      setOriginalAmount("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveModal) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contas-receber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECEIVE",
          receivableId: receiveModal.id,
          receivedAmount: parseFloat(receivedAmount),
          receivedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao baixar recebível");

      setReceivables(receivables.map((r) => (r.id === data.receivable.id ? data.receivable : r)));
      setReceiveModal(null);
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Novo Lançamento a Receber
        </button>
      </div>

      {/* Modal Novo Recebível */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Cadastrar Conta a Receber
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Descrição do Recebível *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Venda de Velas Aromáticas, Mensalidade CassaraTech..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Centro de Custo</label>
                  <select
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Categoria Contábil</label>
                  <select
                    value={chartOfAccountId}
                    onChange={(e) => setChartOfAccountId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Valor Previsto (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={originalAmount}
                    onChange={(e) => setOriginalAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Competência</label>
                  <input
                    type="date"
                    required
                    value={competenceDate}
                    onChange={(e) => setCompetenceDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                >
                  {loading ? "Salvando..." : "Salvar Recebível"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Recebimento */}
      {receiveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-xs">
            <button
              onClick={() => setReceiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Confirmar Recebimento Efetivo
            </h3>
            <p className="text-slate-500 mb-4">{receiveModal.description}</p>

            <form onSubmit={handleReceive} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Valor Efetivamente Recebido (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Data Efetiva de Entrada</label>
                <input
                  type="date"
                  required
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceiveModal(null)}
                  className="px-3 py-1.5 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                >
                  {loading ? "Confirmando..." : "Dar Baixa no Recebimento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela de Recebíveis */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {receivables.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Nenhuma conta a receber cadastrada. Clique em "Novo Lançamento a Receber" para registrar entradas previstas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Centro de Custo</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Valor Previsto</th>
                  <th className="py-3 px-4">Valor Recebido</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {receivables.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {r.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {r.costCenter?.name || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {new Date(r.dueDate).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formatBRL(Number(r.originalAmount))}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {r.status === "RECEBIDA" ? formatBRL(Number(r.receivedAmount)) : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === "RECEBIDA"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status !== "RECEBIDA" && (
                        <button
                          onClick={() => {
                            setReceiveModal(r);
                            setReceivedAmount(String(r.originalAmount));
                          }}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Confirmar Recebimento →
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
