"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  DollarSign,
  Phone,
  CheckSquare,
  MessageCircle,
  ExternalLink,
  Users,
} from "lucide-react";

export default function VencimentosPage() {
  const [titles, setTitles] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"TODOS" | "ATRASADOS" | "PROX_7" | "RECEBIDOS">("TODOS");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal Baixa Individual
  const [settleModal, setSettleModal] = useState<any | null>(null);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split("T")[0]);
  const [bankAccountId, setBankAccountId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Baixa em Lote
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  const fetchTitles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vencimentos");
      const data = await res.json();
      if (data.titles) setTitles(data.titles);

      const resBanks = await fetch("/api/bancos");
      const dataBanks = await resBanks.json();
      const accountsList = dataBanks.bankAccounts || dataBanks.accounts || [];
      if (accountsList.length > 0) {
        setBankAccounts(accountsList);
        setBankAccountId((prev) => (prev ? prev : accountsList[0].id));
      }
    } catch {
      setFeedback("Erro ao carregar títulos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles();
  }, []);

  const handleSettleTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModal) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/vencimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "settle_title",
          titleId: settleModal.id,
          receivedAmount: parseFloat(receivedAmount),
          receivedAt,
          bankAccountId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao dar baixa");

      setTitles(
        titles.map((t) =>
          t.id === settleModal.id
            ? { ...t, status: "RECEBIDA", receivedAmount: parseFloat(receivedAmount), receivedAt }
            : t
        )
      );
      setSelectedIds((prev) => prev.filter((id) => id !== settleModal.id));
      setSettleModal(null);
      setFeedback("Título liquidado com sucesso!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/vencimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_settle",
          titleIds: selectedIds,
          receivedAt,
          bankAccountId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao baixar títulos em lote");

      setTitles(
        titles.map((t) =>
          selectedIds.includes(t.id)
            ? { ...t, status: "RECEBIDA", receivedAmount: Number(t.originalAmount), receivedAt }
            : t
        )
      );
      setFeedback(`${data.count || selectedIds.length} títulos baixados em lote com sucesso!`);
      setSelectedIds([]);
      setBatchModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Cálculos de Indicadores
  const overdueTitles = titles.filter((t) => {
    if (t.status === "RECEBIDA") return false;
    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d < now;
  });

  const dueNext7DaysTitles = titles.filter((t) => {
    if (t.status === "RECEBIDA") return false;
    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const totalOverdue = overdueTitles.reduce((s, t) => s + Number(t.originalAmount), 0);
  const totalNext7 = dueNext7DaysTitles.reduce((s, t) => s + Number(t.originalAmount), 0);
  const totalPending = titles
    .filter((t) => t.status !== "RECEBIDA")
    .reduce((s, t) => s + Number(t.originalAmount), 0);

  // Filtragem da lista
  const filteredTitles = titles.filter((t) => {
    const matchSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customer?.name && t.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);

    if (filterMode === "ATRASADOS") {
      return t.status !== "RECEBIDA" && d < now;
    }
    if (filterMode === "PROX_7") {
      const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return t.status !== "RECEBIDA" && diffDays >= 0 && diffDays <= 7;
    }
    if (filterMode === "RECEBIDOS") {
      return t.status === "RECEBIDA";
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-orange-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-900/40">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <CalendarClock className="w-4 h-4" />
            <span>Gestão de Títulos & Cobranças</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Títulos a Vencer & Inadimplência</h2>
          <p className="text-sm text-amber-200 mt-1 max-w-xl">
            Acompanhe boletos e títulos a vencer por cliente, controle inadimplência com alertas em tempo
            real e acione lembretes de pagamento diretamente pelo WhatsApp.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold uppercase">Fechar</button>
        </div>
      )}

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Inadimplente */}
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Títulos Vencidos (Inadimplência)
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400">
            {formatBRL(totalOverdue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {overdueTitles.length} cliente(s) com títulos em atraso
          </p>
        </div>

        {/* Próximos 7 Dias */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Vencendo nos Próximos 7 Dias
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {formatBRL(totalNext7)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {dueNext7DaysTitles.length} título(s) a vencer esta semana
          </p>
        </div>

        {/* Total Pendente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Geral a Receber
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatBRL(totalPending)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Soma de todos os títulos em aberto</p>
        </div>
      </div>

      {/* Barra de Filtros e Abas Rápidas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMode("TODOS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterMode === "TODOS"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            Todos ({titles.length})
          </button>
          <button
            onClick={() => setFilterMode("ATRASADOS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              filterMode === "ATRASADOS"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Atrasados / Inadimplência ({overdueTitles.length})
          </button>
          <button
            onClick={() => setFilterMode("PROX_7")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterMode === "PROX_7"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
            }`}
          >
            Próximos 7 Dias ({dueNext7DaysTitles.length})
          </button>
          <button
            onClick={() => setFilterMode("RECEBIDOS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterMode === "RECEBIDOS"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            Já Recebidos
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente ou título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Tabela de Títulos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-200 dark:border-indigo-900 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? "título selecionado" : "títulos selecionados"} — Total:{" "}
                <strong>
                  {formatBRL(
                    titles
                      .filter((t) => selectedIds.includes(t.id))
                      .reduce((sum, t) => sum + Number(t.originalAmount || 0), 0)
                  )}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
              >
                Desmarcar Todos
              </button>
              <button
                onClick={() => setBatchModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Baixar Selecionados em Lote
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={
                      filteredTitles.filter((t) => t.status !== "RECEBIDA").length > 0 &&
                      filteredTitles
                        .filter((t) => t.status !== "RECEBIDA")
                        .every((t) => selectedIds.includes(t.id))
                    }
                    onChange={(e) => {
                      const pendingTitles = filteredTitles.filter((t) => t.status !== "RECEBIDA");
                      if (e.target.checked) {
                        const newSelected = Array.from(new Set([...selectedIds, ...pendingTitles.map((t) => t.id)]));
                        setSelectedIds(newSelected);
                      } else {
                        const pendingIds = new Set(pendingTitles.map((t) => t.id));
                        setSelectedIds(selectedIds.filter((id) => !pendingIds.has(id)));
                      }
                    }}
                  />
                </th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Título / Descrição</th>
                <th className="px-5 py-3.5">Forma</th>
                <th className="px-5 py-3.5">Vencimento</th>
                <th className="px-5 py-3.5">Situação</th>
                <th className="px-5 py-3.5 font-bold">Valor do Título (R$)</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTitles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Nenhum título encontrado com o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredTitles.map((t) => {
                  const isReceived = t.status === "RECEBIDA";
                  const dueDate = new Date(t.dueDate);
                  dueDate.setHours(0, 0, 0, 0);
                  const diffTime = dueDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isOverdue = !isReceived && diffDays < 0;
                  const isSelected = selectedIds.includes(t.id);

                  // Template mensagem WhatsApp de cobrança / lembrete
                  const clientPhone = t.customer?.phone ? t.customer.phone.replace(/\D/g, "") : "";
                  const greeting = "Olá, tudo bem?";
                  const textMsg = encodeURIComponent(
                    `${greeting} Passando para lembrar do vencimento do seu título/fatura "${t.description}" no valor de ${formatBRL(
                      Number(t.originalAmount)
                    )} com vencimento em ${new Date(t.dueDate).toLocaleDateString("pt-BR")}. Caso já tenha efetuado o pagamento, por favor desconsidere.`
                  );
                  const waUrl = clientPhone ? `https://wa.me/55${clientPhone}?text=${textMsg}` : null;

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      <td className="px-4 py-4 w-10 text-center">
                        <input
                          type="checkbox"
                          disabled={isReceived}
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, t.id]);
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== t.id));
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-30 cursor-pointer"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {t.customer?.name || "Consumidor Avulso"}
                        </div>
                        {t.customer?.phone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            {t.customer.phone}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {t.description}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {t.costCenter?.name || "Geral"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {t.paymentType || "PIX"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {new Date(t.dueDate).toLocaleDateString("pt-BR")}
                        </div>
                        {!isReceived && (
                          <div className="text-[10px] mt-0.5 font-bold">
                            {diffDays < 0 ? (
                              <span className="text-red-500">Atrasado há {Math.abs(diffDays)} dia(s)</span>
                            ) : diffDays === 0 ? (
                              <span className="text-amber-500">Vence Hoje!</span>
                            ) : (
                              <span className="text-blue-500">Vence em {diffDays} dia(s)</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isReceived
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : isOverdue
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                          }`}
                        >
                          {isReceived ? "RECEBIDO" : isOverdue ? "INADIMPLENTE" : "A VENCER"}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white">
                        {formatBRL(Number(t.originalAmount))}
                      </td>

                      <td className="px-5 py-4 text-right space-x-2">
                        {waUrl && !isReceived && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/20 transition"
                            title="Enviar lembrete / cobrança no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Cobrar WhatsApp</span>
                          </a>
                        )}

                        {!isReceived && (
                          <button
                            onClick={() => {
                              setSettleModal(t);
                              setReceivedAmount(String(t.originalAmount));
                              if (!bankAccountId && bankAccounts.length > 0) {
                                setBankAccountId(bankAccounts[0].id);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                            title="Dar baixa no título"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Baixar Título</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Baixa de Título Individual */}
      {settleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Dar Baixa no Título do Cliente
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {settleModal.description} — Cliente: {settleModal.customer?.name || "Consumidor"}
            </p>

            <form onSubmit={handleSettleTitle} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Valor Efetivamente Recebido (R$) *
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Data do Recebimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={receivedAt}
                    onChange={(e) => setReceivedAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Conta Bancária de Destino
                  </label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    {bankAccounts.length === 0 ? (
                      <option value="">Nenhuma conta cadastrada</option>
                    ) : (
                      bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} {b.accountNumber ? `(${b.accountNumber})` : ""} - {b.holderName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSettleModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Baixando..." : "Confirmar Baixa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Baixa em Lote */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Baixa de Títulos em Lote
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Você está prestes a liquidar <strong>{selectedIds.length}</strong> títulos de clientes.
            </p>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl mb-4">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                Valor Total Liquidado:
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatBRL(
                  titles
                    .filter((t) => selectedIds.includes(t.id))
                    .reduce((sum, t) => sum + Number(t.originalAmount || 0), 0)
                )}
              </span>
            </div>

            <form onSubmit={handleBatchSettle} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Data do Recebimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={receivedAt}
                    onChange={(e) => setReceivedAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Conta Bancária de Destino
                  </label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    {bankAccounts.length === 0 ? (
                      <option value="">Nenhuma conta cadastrada</option>
                    ) : (
                      bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} {b.accountNumber ? `(${b.accountNumber})` : ""} - {b.holderName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Processando..." : "Confirmar Baixa em Lote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
