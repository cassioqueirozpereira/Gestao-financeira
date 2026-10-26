"use client";

import React, { useState } from "react";
import {
  Plus,
  X,
  Calendar,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  Filter,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Repeat,
  CreditCard,
  Building2,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PayablesClientViewProps {
  initialPayables: any[];
  costCenters: any[];
  accounts: any[];
  bankAccounts: any[];
}

export function PayablesClientView({
  initialPayables,
  costCenters,
  accounts,
  bankAccounts,
}: PayablesClientViewProps) {
  const router = useRouter();
  const [payables, setPayables] = useState(initialPayables);

  // Filtros
  const [filterType, setFilterType] = useState("TODOS");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterCostCenter, setFilterCostCenter] = useState("TODOS");
  const [filterOnlyFixed, setFilterOnlyFixed] = useState(false);
  const [filterPaidDate, setFilterPaidDate] = useState("");
  const [filterScheduledDate, setFilterScheduledDate] = useState("");

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [settlingItem, setSettlingItem] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form states - Criação
  const [form, setForm] = useState({
    description: "",
    costCenterId: costCenters[0]?.id || "",
    chartOfAccountId: accounts[0]?.id || "",
    originalAmount: "",
    dueDate: "",
    scheduledDate: "",
    paymentType: "BOLETO",
    isFixed: false,
    competenceDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Form states - Dar Baixa
  const [settleForm, setSettleForm] = useState({
    paidAmount: "",
    paidAt: new Date().toISOString().split("T")[0],
    bankAccountId: bankAccounts[0]?.id || "",
    discountAmount: "0",
    interestAmount: "0",
  });

  // Form states - Edição
  const [editForm, setEditForm] = useState({
    description: "",
    originalAmount: "",
    dueDate: "",
    scheduledDate: "",
    paymentType: "BOLETO",
    isFixed: false,
    costCenterId: "",
    chartOfAccountId: "",
    status: "EM_ABERTO",
    notes: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/contas-pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar lançamento");

      setShowCreateModal(false);
      setPayables([data.payable, ...payables]);
      setFeedback("Conta a pagar lançada com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettle = (p: any) => {
    setSettlingItem(p);
    setSettleForm({
      paidAmount: String(p.originalAmount),
      paidAt: new Date().toISOString().split("T")[0],
      bankAccountId: bankAccounts[0]?.id || "",
      discountAmount: "0",
      interestAmount: "0",
    });
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingItem) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contas-pagar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: settlingItem.id,
          action: "settle",
          ...settleForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao dar baixa");

      setPayables(payables.map((item) => (item.id === settlingItem.id ? { ...item, ...data.updated, status: "PAGA" } : item)));
      setSettlingItem(null);
      setFeedback("Baixa de pagamento efetuada com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (p: any) => {
    setEditingItem(p);
    setEditForm({
      description: p.description,
      originalAmount: String(p.originalAmount),
      dueDate: new Date(p.dueDate).toISOString().split("T")[0],
      scheduledDate: p.scheduledDate ? new Date(p.scheduledDate).toISOString().split("T")[0] : "",
      paymentType: p.paymentType || "BOLETO",
      isFixed: Boolean(p.isFixed),
      costCenterId: p.costCenterId,
      chartOfAccountId: p.chartOfAccountId,
      status: p.status,
      notes: p.notes || "",
    });
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contas-pagar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          action: "edit",
          ...editForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao editar lançamento");

      setPayables(payables.map((item) => (item.id === editingItem.id ? { ...item, ...data.updated } : item)));
      setEditingItem(null);
      setFeedback("Lançamento atualizado com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayable = async (id: string, description: string) => {
    if (!confirm(`Deseja realmente excluir a conta a pagar "${description}"? Esta operação é irreversível.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/contas-pagar?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir conta");

      setPayables((prev) => prev.filter((p) => p.id !== id));
      if (editingItem?.id === id) setEditingItem(null);
      setFeedback(`Conta "${description}" excluída com sucesso!`);
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
    if (selectedIds.length === filteredPayables.length && filteredPayables.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPayables.map((p) => p.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (
      !confirm(
        `Deseja realmente apagar todas as ${count} contas a pagar selecionadas de uma só vez? Esta operação é irreversível.`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contas-pagar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir contas");

      setPayables((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      setFeedback(`${count} conta(s) a pagar excluída(s) com sucesso!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Aplicação dos filtros
  const filteredPayables = payables.filter((p) => {
    if (filterType !== "TODOS" && (p.paymentType || "BOLETO") !== filterType) return false;
    if (filterStatus !== "TODOS" && p.status !== filterStatus) return false;
    if (filterCostCenter !== "TODOS" && p.costCenterId !== filterCostCenter) return false;
    if (filterOnlyFixed && !p.isFixed) return false;
    if (filterPaidDate) {
      if (!p.paidAt) return false;
      const pDate = new Date(p.paidAt).toISOString().split("T")[0];
      if (pDate !== filterPaidDate) return false;
    }
    if (filterScheduledDate) {
      if (!p.scheduledDate) return false;
      const sDate = new Date(p.scheduledDate).toISOString().split("T")[0];
      if (sDate !== filterScheduledDate) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total listado: {filteredPayables.length} contas
          </span>
          {selectedIds.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
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
            {selectedIds.length === filteredPayables.length && filteredPayables.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {selectedIds.length === filteredPayables.length && filteredPayables.length > 0
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
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento a Pagar
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold uppercase">Fechar</button>
        </div>
      )}

      {/* Painel de Filtros Avançados */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          <span>Filtros do Contas a Pagar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Tipo de Pagamento
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="PIX">PIX</option>
              <option value="BOLETO">Boleto</option>
              <option value="CARTAO">Cartão de Crédito</option>
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="DINHEIRO">Dinheiro</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Status da Conta
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="EM_ABERTO">Em Aberto</option>
              <option value="A_VENCER">A Vencer</option>
              <option value="VENCIDA">Vencida</option>
              <option value="PAGA">Paga</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Data de Pagamento (Baixa)
            </label>
            <input
              type="date"
              value={filterPaidDate}
              onChange={(e) => setFilterPaidDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Data da Programação
            </label>
            <input
              type="date"
              value={filterScheduledDate}
              onChange={(e) => setFilterScheduledDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 w-full">
              <input
                type="checkbox"
                checked={filterOnlyFixed}
                onChange={(e) => setFilterOnlyFixed(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Repeat className="w-3 h-3 text-indigo-400" />
                Pgto Fixo / Recorrente
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Tabela de Contas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredPayables.length > 0 &&
                      selectedIds.length === filteredPayables.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Selecionar todas as contas"
                  />
                </th>
                <th className="px-4 py-3.5">Descrição</th>
                <th className="px-4 py-3.5">Centro & Categoria</th>
                <th className="px-4 py-3.5">Tipo & Programação</th>
                <th className="px-4 py-3.5">Vencimento</th>
                <th className="px-4 py-3.5">Valor (R$)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Nenhum lançamento a pagar encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredPayables.map((p) => {
                  const isPaid = p.status === "PAGA";
                  const dueDate = new Date(p.dueDate);
                  const isOverdue = !isPaid && dueDate < new Date();
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {p.description}
                          {p.isFixed && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                              Fixo
                            </span>
                          )}
                        </div>
                        {p.notes && <p className="text-[11px] text-slate-400 mt-0.5">{p.notes}</p>}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 dark:text-slate-200 font-medium text-xs">
                          {p.costCenter?.name || "Geral"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.chartOfAccount?.name || "Sem categoria"}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {p.paymentType || "BOLETO"}
                        </span>
                        {p.scheduledDate && (
                          <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Prog: {new Date(p.scheduledDate).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className={isOverdue ? "text-red-500 font-bold" : "text-slate-600 dark:text-slate-300"}>
                          {dueDate.toLocaleDateString("pt-BR")}
                        </div>
                        {p.paidAt && (
                          <div className="text-[10px] text-emerald-500 font-medium">
                            Pago em: {new Date(p.paidAt).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white">
                        {formatBRL(Number(p.originalAmount))}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : isOverdue
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        {!isPaid && (
                          <button
                            onClick={() => handleOpenSettle(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                            title="Dar Baixa de Pagamento"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Baixar</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title="Editar lançamento efetuado"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeletePayable(p.id, p.description)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                          title="Excluir lançamento"
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

      {/* Modal - Novo Lançamento */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Lançar Nova Conta a Pagar
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Descrição da Conta *
                </label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Ex: Fornecedor de Cera de Soja"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Centro de Custo *
                  </label>
                  <select
                    value={form.costCenterId}
                    onChange={(e) => setForm({ ...form, costCenterId: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>{cc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Categoria *
                  </label>
                  <select
                    value={form.chartOfAccountId}
                    onChange={(e) => setForm({ ...form, chartOfAccountId: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
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
                    value={form.originalAmount}
                    onChange={(e) => setForm({ ...form, originalAmount: e.target.value })}
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
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Programado Para
                  </label>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Tipo de Pagamento
                  </label>
                  <select
                    value={form.paymentType}
                    onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO">Cartão de Crédito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="DINHEIRO">Dinheiro</option>
                  </select>
                </div>
                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFixed}
                      onChange={(e) => setForm({ ...form, isFixed: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Pagamento Fixo / Recorrente
                    </span>
                  </label>
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
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Dar Baixa */}
      {settlingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Dar Baixa de Pagamento
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {settlingItem.description} — Vencimento: {new Date(settlingItem.dueDate).toLocaleDateString("pt-BR")}
            </p>

            <form onSubmit={handleConfirmSettle} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Valor Efetivamente Pago (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleForm.paidAmount}
                  onChange={(e) => setSettleForm({ ...settleForm, paidAmount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={settleForm.paidAt}
                    onChange={(e) => setSettleForm({ ...settleForm, paidAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Conta Bancária de Saída
                  </label>
                  <select
                    value={settleForm.bankAccountId}
                    onChange={(e) => setSettleForm({ ...settleForm, bankAccountId: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSettlingItem(null)}
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
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Editar Lançamento Efetuado
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
                    Data Programada
                  </label>
                  <input
                    type="date"
                    value={editForm.scheduledDate}
                    onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Tipo de Pagamento
                  </label>
                  <select
                    value={editForm.paymentType}
                    onChange={(e) => setEditForm({ ...editForm, paymentType: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO">Cartão de Crédito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="DINHEIRO">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsFixed"
                  checked={editForm.isFixed}
                  onChange={(e) => setEditForm({ ...editForm, isFixed: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="editIsFixed" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Marcar como Pagamento Fixo / Recorrente
                </label>
              </div>

              <div className="flex justify-between items-center pt-3">
                <button
                  type="button"
                  onClick={() => handleDeletePayable(editingItem.id, editingItem.description)}
                  className="px-3 py-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Conta</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
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
