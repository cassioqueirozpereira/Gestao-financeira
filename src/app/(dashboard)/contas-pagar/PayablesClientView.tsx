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
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PayablesClientViewProps {
  initialPayables: any[];
  costCenters: any[];
  accounts: any[];
  bankAccounts: any[];
  suppliers?: any[];
}

export function PayablesClientView({
  initialPayables,
  costCenters,
  accounts,
  bankAccounts,
  suppliers = [],
}: PayablesClientViewProps) {
  const router = useRouter();
  const [payables, setPayables] = useState(initialPayables);

  // Filtros
  const [filterType, setFilterType] = useState("TODOS");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterCostCenter, setFilterCostCenter] = useState("TODOS");
  const [filterSupplier, setFilterSupplier] = useState("TODOS");
  const [filterPeriod, setFilterPeriod] = useState("TODOS");
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
    supplierId: "",
    costCenterId: costCenters[0]?.id || "",
    chartOfAccountId: accounts[0]?.id || "",
    originalAmount: "",
    dueDate: "",
    scheduledDate: "",
    paymentType: "BOLETO",
    isFixed: false,
    competenceDate: new Date().toISOString().split("T")[0],
    notes: "",
    isInstallment: false,
    installmentsCount: 2,
  });

  // Modal Parcelamento de Conta Existente
  const [parcelingItem, setParcelingItem] = useState<any | null>(null);
  const [parcelCount, setParcelCount] = useState(2);
  const [parcelIntervalDays, setParcelIntervalDays] = useState(30);
  const [parcelLoading, setParcelLoading] = useState(false);

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
      const payload: any = {
        ...form,
        installmentsCount: form.isInstallment ? Number(form.installmentsCount) : 1,
      };

      const res = await fetch("/api/contas-pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar lançamento");

      setShowCreateModal(false);
      if (data.payables) {
        setPayables([...data.payables, ...payables]);
        setFeedback(`${data.payables.length} parcelas lançadas com sucesso!`);
      } else {
        setPayables([data.payable, ...payables]);
        setFeedback("Conta a pagar lançada com sucesso!");
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParcelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcelingItem) return;
    setParcelLoading(true);
    try {
      const res = await fetch("/api/contas-pagar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parcelingItem.id,
          action: "parcelar",
          installmentsCount: parcelCount,
          intervalDays: parcelIntervalDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao parcelar conta");

      setFeedback(`Conta parcelada com sucesso em ${parcelCount}x!`);
      setParcelingItem(null);
      router.refresh();

      // Recarrega lista atualizada
      const listRes = await fetch("/api/contas-pagar");
      const listData = await listRes.json();
      if (listData.payables) setPayables(listData.payables);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setParcelLoading(false);
    }
  };

  const handleRevertPayment = async (p: any) => {
    const val = formatBRL(Number(p.paidAmount || p.originalAmount));
    if (
      !confirm(
        `Deseja realmente ESTORNAR a baixa da conta "${p.description}" no valor de ${val}? O status voltará para EM ABERTO e o saldo da conta bancária será recomposto.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contas-pagar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          action: "revert",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao estornar baixa");

      setFeedback(`Baixa da conta "${p.description}" estornada com sucesso.`);
      setPayables((prev) =>
        prev.map((item) =>
          item.id === p.id
            ? { ...item, status: "EM_ABERTO", paidAmount: null, paidAt: null, bankAccountId: null }
            : item
        )
      );
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

  // Formata data brasileira evitando desvio de fuso horário
  const formatDateBR = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return "-";
    if (typeof dateVal === "string") {
      const str = dateVal.split("T")[0];
      if (str.includes("-")) {
        const [y, m, d] = str.split("-");
        if (y && m && d) return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      }
    }
    const d = new Date(dateVal);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  // Limpa o texto de notas para não duplicar a categoria na descrição da conta
  const cleanNotes = (notes: string | null | undefined) => {
    if (!notes) return null;
    const cleaned = notes
      .replace(/[•\s-]*Categoria:\s*[^•\n\r]*/gi, "")
      .replace(/[•\s-]+$/, "")
      .trim();
    return cleaned || null;
  };

  // Aplicação dos filtros
  const filteredPayables = payables.filter((p) => {
    if (filterType !== "TODOS" && (p.paymentType || "BOLETO") !== filterType) return false;
    if (filterStatus !== "TODOS" && p.status !== filterStatus) return false;
    if (filterCostCenter !== "TODOS" && p.costCenterId !== filterCostCenter) return false;
    if (filterSupplier !== "TODOS" && p.supplierId !== filterSupplier) return false;
    if (filterOnlyFixed && !p.isFixed) return false;

    // Filtro por Período
    if (filterPeriod !== "TODOS") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const due = new Date(p.dueDate);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Período de Vencimento
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-indigo-600 dark:text-indigo-400"
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
              Fornecedor
            </label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="TODOS">Todos os Fornecedores</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

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
                <th className="px-4 py-3.5">Data do Gasto</th>
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
                  <td colSpan={9} className="text-center py-10 text-slate-400">
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
                        {cleanNotes(p.notes) && <p className="text-[11px] text-slate-400 mt-0.5">{cleanNotes(p.notes)}</p>}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                        {formatDateBR(p.competenceDate)}
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
                            Prog: {formatDateBR(p.scheduledDate)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className={isOverdue ? "text-red-500 font-bold" : "text-slate-600 dark:text-slate-300"}>
                          {formatDateBR(p.dueDate)}
                        </div>
                        {p.paidAt && (
                          <div className="text-[10px] text-emerald-500 font-medium">
                            Pago em: {formatDateBR(p.paidAt)}
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
                        {!isPaid ? (
                          <>
                            <button
                              onClick={() => handleOpenSettle(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                              title="Dar Baixa de Pagamento"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Baixar</span>
                            </button>
                            <button
                              onClick={() => {
                                setParcelingItem(p);
                                setParcelCount(2);
                                setParcelIntervalDays(30);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition"
                              title="Adicionar parcelas e definir quantas serão"
                            >
                              <Repeat className="w-3.5 h-3.5" />
                              <span>Parcelar</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRevertPayment(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 transition"
                            title="Estornar baixa de pagamento e reverter saldo bancário"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Estornar</span>
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
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

              {suppliers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Vincular Fornecedor (Opcional)
                  </label>
                  <select
                    value={form.supplierId}
                    onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="">Nenhum fornecedor vinculado</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.tradeName ? `(${s.tradeName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              {/* Parcelamento de Nova Despesa */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={form.isInstallment}
                      onChange={(e) => setForm({ ...form, isInstallment: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Parcelar esta conta (adicionar parcelas)</span>
                  </label>
                  {form.isInstallment && (
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Geração Automática Mensal
                    </span>
                  )}
                </div>

                {form.isInstallment && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Quantas parcelas serão?
                      </label>
                      <select
                        value={form.installmentsCount}
                        onChange={(e) => setForm({ ...form, installmentsCount: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24, 36, 48].map((n) => (
                          <option key={n} value={n}>
                            {n}x parcelas
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Valor aproximado por parcela
                      </label>
                      <div className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {form.originalAmount
                          ? formatBRL(Number(form.originalAmount) / form.installmentsCount)
                          : "R$ 0,00"}
                      </div>
                    </div>
                  </div>
                )}
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
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

      {/* Modal - Parcelar Conta Existente */}
      {parcelingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Parcelar Conta a Pagar
                </h3>
              </div>
              <button onClick={() => setParcelingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleParcelSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Conta a Parcelar</span>
                <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{parcelingItem.description}</span>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500">Valor Total:</span>
                  <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                    {formatBRL(Number(parcelingItem.originalAmount))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Definir quantas parcelas serão *
                </label>
                <select
                  value={parcelCount}
                  onChange={(e) => setParcelCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24, 36, 48].map((n) => (
                    <option key={n} value={n}>
                      {n} parcelas ({n}x de ~{formatBRL(Number(parcelingItem.originalAmount) / n)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Intervalo entre parcelas
                </label>
                <select
                  value={parcelIntervalDays}
                  onChange={(e) => setParcelIntervalDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value={30}>Mensal (a cada 30 dias)</option>
                  <option value={15}>Quinzenal (a cada 15 dias)</option>
                  <option value={7}>Semanal (a cada 7 dias)</option>
                </select>
              </div>

              {/* Prévia das parcelas */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl space-y-1.5 max-h-40 overflow-y-auto">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase block">
                  Simulação do Parcelamento
                </span>
                {Array.from({ length: parcelCount }).map((_, idx) => {
                  const baseDueDate = new Date(parcelingItem.dueDate);
                  baseDueDate.setDate(baseDueDate.getDate() + idx * parcelIntervalDays);
                  const approxVal = Number(parcelingItem.originalAmount) / parcelCount;
                  return (
                    <div key={idx} className="flex justify-between text-xs py-0.5 border-b border-indigo-100 dark:border-indigo-950 last:border-0">
                      <span className="text-slate-600 dark:text-slate-300">
                        Parcela {idx + 1}/{parcelCount} — {formatDateBR(baseDueDate)}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatBRL(approxVal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setParcelingItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={parcelLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {parcelLoading ? "Gerando parcelas..." : `Confirmar ${parcelCount}x Parcelas`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
