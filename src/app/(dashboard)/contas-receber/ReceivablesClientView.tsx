"use client";

import React, { useState } from "react";
import {
  Plus,
  X,
  ArrowUpCircle,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  Building2,
  CheckSquare,
  Square,
} from "lucide-react";
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

  // Filtros Avançados
  const [filterPeriod, setFilterPeriod] = useState("TODOS");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterPaymentType, setFilterPaymentType] = useState("TODOS");
  const [filterCostCenter, setFilterCostCenter] = useState("TODOS");

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState<any | null>(null);
  const [editingModal, setEditingModal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form states de criação
  const [description, setDescription] = useState("");
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [costCenterId, setCostCenterId] = useState(costCenters[0]?.id || "");
  const [chartOfAccountId, setChartOfAccountId] = useState(accounts[0]?.id || "");
  const [originalAmount, setOriginalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentType, setPaymentType] = useState("PIX");
  const [competenceDate, setCompetenceDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Form states de liquidação (baixa)
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split("T")[0]);

  // Form states de edição
  const [editForm, setEditForm] = useState({
    description: "",
    originalAmount: "",
    dueDate: "",
    competenceDate: "",
    customerId: "",
    costCenterId: "",
    chartOfAccountId: "",
    paymentType: "PIX",
    status: "A_RECEBER",
    notes: "",
  });

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
          customerId: customerId || undefined,
          costCenterId,
          chartOfAccountId,
          originalAmount: parseFloat(originalAmount),
          dueDate,
          paymentType,
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
      setFeedback("Conta a receber lançada com sucesso!");
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
      if (!res.ok) throw new Error(data.error || "Erro ao dar baixa");

      setReceivables(
        receivables.map((r) =>
          r.id === receiveModal.id
            ? { ...r, status: "RECEBIDA", receivedAmount: parseFloat(receivedAmount), receivedAt }
            : r
        )
      );
      setReceiveModal(null);
      setFeedback("Recebimento confirmado e adicionado ao saldo!");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (rec: any) => {
    setEditingModal(rec);
    setEditForm({
      description: rec.description,
      originalAmount: String(rec.originalAmount),
      dueDate: new Date(rec.dueDate).toISOString().split("T")[0],
      competenceDate: new Date(rec.competenceDate).toISOString().split("T")[0],
      customerId: rec.customerId || "",
      costCenterId: rec.costCenterId,
      chartOfAccountId: rec.chartOfAccountId,
      paymentType: rec.paymentType || "PIX",
      status: rec.status,
      notes: rec.notes || "",
    });
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModal) return;
    setLoading(true);

    try {
      const res = await fetch("/api/contas-receber", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingModal.id,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao editar lançamento");

      setReceivables(
        receivables.map((r) => (r.id === editingModal.id ? { ...r, ...data.updated } : r))
      );
      setEditingModal(null);
      setFeedback("Lançamento a receber atualizado com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceivable = async (id: string, description: string) => {
    if (!confirm(`Deseja realmente excluir a conta a receber "${description}"? Esta operação é irreversível.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/contas-receber?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir conta");

      setReceivables((prev) => prev.filter((r) => r.id !== id));
      if (editingModal?.id === id) setEditingModal(null);
      setFeedback(`Conta a receber "${description}" excluída com sucesso!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredReceivables.length && filteredReceivables.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReceivables.map((r) => r.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (
      !confirm(
        `Deseja realmente apagar todas as ${count} contas a receber selecionadas de uma só vez? Esta operação é irreversível.`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contas-receber", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir contas");

      setReceivables((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setFeedback(`${count} conta(s) a receber excluída(s) com sucesso!`);
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
  const filteredReceivables = receivables.filter((r) => {
    if (filterStatus !== "TODOS" && r.status !== filterStatus) return false;
    if (filterCostCenter !== "TODOS" && r.costCenterId !== filterCostCenter) return false;
    if (filterPaymentType !== "TODOS" && (r.paymentType || "PIX") !== filterPaymentType) return false;

    // Filtro por Período
    if (filterPeriod !== "TODOS") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const due = new Date(r.dueDate);
      due.setHours(0, 0, 0, 0);

      if (filterPeriod === "HOJE") {
        if (due.getTime() !== now.getTime()) return false;
      } else if (filterPeriod === "SEMANA") {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (due < now || due > weekEnd) return false;
      } else if (filterPeriod === "MES") {
        if (due.getMonth() !== now.getMonth() || due.getFullYear() !== now.getFullYear()) return false;
      } else if (filterPeriod === "PROX_30") {
        const next30 = new Date(now);
        next30.setDate(next30.getDate() + 30);
        if (due < now || due > next30) return false;
      }
    }

    if (filterStartDate) {
      const due = new Date(r.dueDate).toISOString().split("T")[0];
      if (due < filterStartDate) return false;
    }
    if (filterEndDate) {
      const due = new Date(r.dueDate).toISOString().split("T")[0];
      if (due > filterEndDate) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Listando {filteredReceivables.length} contas a receber
          </span>
          {selectedIds.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
              {selectedIds.length} selecionada(s)
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            {selectedIds.length === filteredReceivables.length && filteredReceivables.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {selectedIds.length === filteredReceivables.length && filteredReceivables.length > 0
                ? "Desmarcar Todos"
                : "Selecionar Tudo"}
            </span>
          </button>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Selecionados ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento a Receber
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold uppercase">Fechar</button>
        </div>
      )}

      {/* Painel / Aba de Filtros Avançados */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-3.5 h-3.5 text-emerald-500" />
          <span>Filtros do Contas a Receber</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Período Rápido
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-emerald-600 dark:text-emerald-400"
            >
              <option value="TODOS">Todos os Períodos</option>
              <option value="HOJE">Vencendo Hoje</option>
              <option value="SEMANA">Próximos 7 Dias</option>
              <option value="MES">Este Mês</option>
              <option value="PROX_30">Próximos 30 Dias</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Data Início (Vencimento)
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Data Fim (Vencimento)
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="A_RECEBER">A Receber</option>
              <option value="RECEBIDA">Recebida</option>
              <option value="VENCIDA">Vencida</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={filterPaymentType}
              onChange={(e) => setFilterPaymentType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="TODOS">Todas as Formas</option>
              <option value="PIX">PIX</option>
              <option value="BOLETO">Boleto Bancário</option>
              <option value="CARTAO">Cartão de Crédito</option>
              <option value="TRANSFERENCIA">Transferência / TED</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Centro de Custo
            </label>
            <select
              value={filterCostCenter}
              onChange={(e) => setFilterCostCenter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="TODOS">Todos os Centros</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>{cc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Contas a Receber */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredReceivables.length > 0 &&
                      selectedIds.length === filteredReceivables.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    title="Selecionar todas as contas a receber"
                  />
                </th>
                <th className="px-4 py-3.5">Descrição</th>
                <th className="px-4 py-3.5">Cliente</th>
                <th className="px-4 py-3.5">Centro de Custo</th>
                <th className="px-4 py-3.5">Forma</th>
                <th className="px-4 py-3.5">Vencimento</th>
                <th className="px-4 py-3.5">Valor (R$)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Nenhuma conta a receber encontrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((r) => {
                  const isReceived = r.status === "RECEBIDA";
                  const dueDate = new Date(r.dueDate);
                  const isOverdue = !isReceived && dueDate < new Date();
                  const isSelected = selectedIds.includes(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                      }`}
                    >
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(r.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {r.description}
                        {r.notes && <p className="text-[11px] text-slate-400 font-normal">{r.notes}</p>}
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                        {r.customer?.name || "Consumidor Avulso"}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                        {r.costCenter?.name || "Geral"}
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {r.paymentType || "PIX"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className={isOverdue ? "text-red-500 font-bold" : "text-slate-600 dark:text-slate-300"}>
                          {dueDate.toLocaleDateString("pt-BR")}
                        </div>
                        {r.receivedAt && (
                          <div className="text-[10px] text-emerald-500 font-medium">
                            Recebido em: {new Date(r.receivedAt).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                        {formatBRL(Number(r.originalAmount))}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isReceived
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : isOverdue
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        {!isReceived && (
                          <button
                            onClick={() => {
                              setReceiveModal(r);
                              setReceivedAmount(String(r.originalAmount));
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                            title="Confirmar Recebimento"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Baixar</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title="Editar lançamento efetuado"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteReceivable(r.id, r.description)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                          title="Excluir recebimento"
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

      {/* Modal - Criação */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Lançar Nova Conta a Receber
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Descrição do Recebimento *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Ex: Mensalidade Sistema CassaraTech"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Cliente
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Consumidor Avulso</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Centro de Custo *
                  </label>
                  <select
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>{cc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={originalAmount}
                    onChange={(e) => setOriginalAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Forma Pgto
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="CARTAO">Cartão</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Dar Baixa */}
      {receiveModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Confirmar Recebimento de Valor
            </h3>
            <p className="text-xs text-slate-500 mb-4">{receiveModal.description}</p>
            <form onSubmit={handleReceive} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Valor Recebido (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Data de Entrada *
                </label>
                <input
                  type="date"
                  required
                  value={receivedAt}
                  onChange={(e) => setReceivedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReceiveModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Editar Lançamento */}
      {editingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Editar Lançamento a Receber
            </h3>
            <form onSubmit={handleConfirmEdit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Valor Original (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.originalAmount}
                    onChange={(e) => setEditForm({ ...editForm, originalAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Vencimento
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={editForm.paymentType}
                    onChange={(e) => setEditForm({ ...editForm, paymentType: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="CARTAO">Cartão de Crédito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="A_RECEBER">A Receber</option>
                    <option value="RECEBIDA">Recebida</option>
                    <option value="VENCIDA">Vencida</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3">
                <button
                  type="button"
                  onClick={() => handleDeleteReceivable(editingModal.id, editingModal.description)}
                  className="px-3 py-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Conta</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingModal(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
