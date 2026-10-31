"use client";

import React, { useState } from "react";
import {
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Percent,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Trash2,
  Filter,
  FileText,
  DollarSign,
  User,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CommissionsClientViewProps {
  initialRules: any[];
  initialRecords: any[];
  contracts: any[];
  costCenters: any[];
  accounts: any[];
}

export function CommissionsClientView({
  initialRules,
  initialRecords,
  contracts,
  costCenters,
  accounts,
}: CommissionsClientViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"records" | "rules">("records");
  const [rules, setRules] = useState(initialRules);
  const [records, setRecords] = useState(initialRecords);

  // Filtros
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [approveRecord, setApproveRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form states - Nova Comissão Vinculada a Contrato [Item 12]
  const [selectedContractId, setSelectedContractId] = useState(contracts[0]?.id || "");
  const [beneficiary, setBeneficiary] = useState("");
  const [baseType, setBaseType] = useState<"TOTAL" | "INSTALACAO" | "MENSALIDADE">("TOTAL");
  const [rateApplied, setRateApplied] = useState("10"); // 10%
  const [recordStatus, setRecordStatus] = useState("PREVISTA");

  // Form states - Edição de Comissão
  const [editBeneficiary, setEditBeneficiary] = useState("");
  const [editBaseType, setEditBaseType] = useState("TOTAL");
  const [editRate, setEditRate] = useState("10");
  const [editAmount, setEditAmount] = useState("");
  const [editStatus, setEditStatus] = useState("PREVISTA");

  // Form states - Aprovação
  const [chartOfAccountId, setChartOfAccountId] = useState(accounts[0]?.id || "");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);

  // Contrato Selecionado para Cálculo Prévio
  const currentSelectedContract = contracts.find((c) => c.id === selectedContractId);
  const previewBase =
    baseType === "TOTAL"
      ? Number(currentSelectedContract?.totalAmount || 0)
      : baseType === "INSTALACAO"
      ? Number(currentSelectedContract?.installationFee || 0)
      : Number(currentSelectedContract?.monthlyFee || 0);

  const previewAmount = (previewBase * (parseFloat(rateApplied) || 0)) / 100;

  const handleCreateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/comissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: selectedContractId,
          beneficiary,
          baseType,
          rateApplied: parseFloat(rateApplied),
          status: recordStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar comissão");

      setRecords([data.record, ...records]);
      setShowCreateModal(false);
      setBeneficiary("");
      setFeedback("Comissão vinculada ao contrato cadastrada com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (rec: any) => {
    setEditingRecord(rec);
    setEditBeneficiary(rec.beneficiary);
    setEditBaseType(rec.baseType || "TOTAL");
    setEditRate(String(rec.rateApplied));
    setEditAmount(String(rec.calculatedAmount));
    setEditStatus(rec.status);
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setLoading(true);

    try {
      const res = await fetch("/api/comissoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRecord.id,
          beneficiary: editBeneficiary,
          baseType: editBaseType,
          rateApplied: parseFloat(editRate),
          calculatedAmount: parseFloat(editAmount),
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar comissão");

      setRecords(records.map((r) => (r.id === editingRecord.id ? { ...r, ...data.record } : r)));
      setEditingRecord(null);
      setFeedback("Comissão atualizada com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a comissão de ${name}?`)) return;

    try {
      const res = await fetch(`/api/comissoes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir");

      setRecords(records.filter((r) => r.id !== id));
      setFeedback("Comissão excluída com sucesso.");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveRecord) return;
    setLoading(true);

    try {
      const res = await fetch("/api/comissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          recordId: approveRecord.id,
          chartOfAccountId,
          dueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao aprovar comissão");

      setRecords(
        records.map((r) => (r.id === approveRecord.id ? { ...r, status: "APROVADA" } : r))
      );
      setApproveRecord(null);
      setFeedback("Comissão aprovada e conta a pagar gerada com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Aplicação dos Filtros
  const filteredRecords = records.filter((r) => {
    if (filterStatus !== "TODOS") {
      if (filterStatus === "PENDENTE" && r.status !== "PREVISTA" && r.status !== "EM_APURACAO")
        return false;
      if (filterStatus === "EFETIVADA" && r.status !== "APROVADA" && r.status !== "PAGA")
        return false;
      if (filterStatus === "NEGOCIACAO" && r.status !== "EM_NEGOCIACAO")
        return false;
    }

    if (filterStartDate) {
      const d = new Date(r.createdAt).toISOString().split("T")[0];
      if (d < filterStartDate) return false;
    }
    if (filterEndDate) {
      const d = new Date(r.createdAt).toISOString().split("T")[0];
      if (d > filterEndDate) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Listando {filteredRecords.length} comissões registradas
        </span>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Vincular Comissão a Contrato
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold uppercase">Fechar</button>
        </div>
      )}

      {/* Painel de Filtros [Item 12] */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span>Filtros de Comissões</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto text-xs">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5 font-semibold">Situação</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE">Pendente / Em Apuração</option>
              <option value="EFETIVADA">Efetivada / Aprovada</option>
              <option value="NEGOCIACAO">Em Negociação</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5 font-semibold">Data Início</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5 font-semibold">Data Fim</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Tabela de Comissões */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Beneficiário</th>
                <th className="px-5 py-3.5">Contrato de Origem</th>
                <th className="px-5 py-3.5">Base de Cálculo</th>
                <th className="px-5 py-3.5">Taxa (%)</th>
                <th className="px-5 py-3.5 font-bold">Valor Comissão</th>
                <th className="px-5 py-3.5">Situação</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Nenhuma comissão encontrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isAprovada = r.status === "APROVADA" || r.status === "PAGA";

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                        {r.beneficiary}
                      </td>

                      <td className="px-5 py-4">
                        {r.contract ? (
                          <div>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {r.contract.contractNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Cliente: {r.contract.customer?.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Venda / Operação Avulsa</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {r.baseType === "INSTALACAO"
                            ? "Taxa de Instalação"
                            : r.baseType === "MENSALIDADE"
                            ? "Mensalidade"
                            : "Total do Contrato"}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Base: {formatBRL(Number(r.calculationBase))}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">
                        {r.rateApplied}%
                      </td>

                      <td className="px-5 py-4 font-black text-indigo-600 dark:text-indigo-400">
                        {formatBRL(Number(r.calculatedAmount))}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isAprovada
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right space-x-2">
                        {!isAprovada && (
                          <button
                            onClick={() => setApproveRecord(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                            title="Aprovar e gerar Conta a Pagar"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Aprovar</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                          title="Editar comissão"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.beneficiary)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition"
                          title="Excluir comissão"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Nova Comissão Vinculada a Contrato [Item 12] */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Vincular Nova Comissão a Contrato
            </h3>

            <form onSubmit={handleCreateCommission} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Selecione o Contrato de Origem *
                </label>
                <select
                  required
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {contracts.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.contractNumber} — {ct.customer?.name} (Total: {formatBRL(Number(ct.totalAmount))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Nome do Beneficiário / Parceiro / Vendedor *
                </label>
                <input
                  type="text"
                  required
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Ex: Carlos Consultor de TI"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Base de Cálculo *
                  </label>
                  <select
                    value={baseType}
                    onChange={(e: any) => setBaseType(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="TOTAL">Sobre o Total do Contrato</option>
                    <option value="INSTALACAO">Sobre a Taxa de Instalação</option>
                    <option value="MENSALIDADE">Sobre a Mensalidade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Percentual (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={rateApplied}
                    onChange={(e) => setRateApplied(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Pré-visualização do Cálculo Instantâneo */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 block">Base de Cálculo:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatBRL(previewBase)}</span>
                </div>
                <div className="text-right">
                  <span className="text-indigo-600 dark:text-indigo-400 block font-bold">Comissão Estimada:</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                    {formatBRL(previewAmount)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Registrar Comissão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Edição de Comissão [Item 12] */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Editar Comissão Existente
            </h3>
            <form onSubmit={handleConfirmEdit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Beneficiário
                </label>
                <input
                  type="text"
                  required
                  value={editBeneficiary}
                  onChange={(e) => setEditBeneficiary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Taxa (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Valor Calculado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Situação
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="PREVISTA">Prevista</option>
                  <option value="EM_APURACAO">Em Apuração</option>
                  <option value="EM_NEGOCIACAO">Em Negociação</option>
                  <option value="APROVADA">Aprovada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Edição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Aprovar Comissão */}
      {approveRecord && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Aprovar Comissão & Gerar Conta a Pagar
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Beneficiário: {approveRecord.beneficiary} — Valor: {formatBRL(Number(approveRecord.calculatedAmount))}
            </p>
            <form onSubmit={handleApprove} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Categoria de Despesa *
                </label>
                <select
                  value={chartOfAccountId}
                  onChange={(e) => setChartOfAccountId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Vencimento do Pagamento *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setApproveRecord(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Confirmar Aprovação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
