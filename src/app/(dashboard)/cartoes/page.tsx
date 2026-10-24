"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
  CheckCircle2,
  AlertCircle,
  Building2,
  CalendarClock,
} from "lucide-react";

export default function CartoesPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [cardPayables, setCardPayables] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Seleção de Cartão e Aba (Fatura Atual vs Faturas Futuras)
  const [selectedCardId, setSelectedCardId] = useState<string>("TODOS");
  const [activeTab, setActiveTab] = useState<"ATUAL" | "FUTURAS">("ATUAL");

  // Modais
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form states - Compra Cartão
  const [expenseForm, setExpenseForm] = useState({
    cardId: "",
    description: "",
    totalAmount: "",
    installments: "1",
    costCenterId: "",
    chartOfAccountId: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Form states - Novo Cartão
  const [cardForm, setCardForm] = useState({
    nickname: "",
    cardBrand: "Mastercard",
    holderName: "",
    creditLimit: "5000",
    closingDay: "25",
    dueDay: "5",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cartoes");
      const data = await res.json();
      if (data.cards) {
        setCards(data.cards);
        if (data.cards.length > 0 && !expenseForm.cardId) {
          setExpenseForm((prev) => ({ ...prev, cardId: data.cards[0].id }));
        }
      }
      if (data.cardPayables) setCardPayables(data.cardPayables);

      // Busca centros de custo e plano de contas
      const resCC = await fetch("/api/contas-pagar");
      const dataCC = await resCC.json();
      if (dataCC.payables) {
        // extrai centros únicos
        const ccs: any[] = [];
        dataCC.payables.forEach((p: any) => {
          if (p.costCenter && !ccs.some((c) => c.id === p.costCenter.id)) {
            ccs.push(p.costCenter);
          }
        });
        if (ccs.length > 0) {
          setCostCenters(ccs);
          setExpenseForm((prev) => ({ ...prev, costCenterId: ccs[0].id }));
        }
      }
    } catch {
      setFeedback("Erro ao carregar dados dos cartões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cartoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao lançar despesa");

      setShowExpenseModal(false);
      setFeedback(`Compra lançada com sucesso em ${data.createdCount} parcela(s)!`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cartoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_card", ...cardForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar cartão");

      setShowCardModal(false);
      setFeedback("Cartão de crédito cadastrado com sucesso!");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Mês atual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Separação de lançamentos: Fatura Atual vs Faturas Futuras
  const currentInvoicesItems = cardPayables.filter((p) => {
    const d = new Date(p.dueDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const futureInvoicesItems = cardPayables.filter((p) => {
    const d = new Date(p.dueDate);
    return d > new Date(currentYear, currentMonth + 1, 0); // Vencimento após o fim do mês atual
  });

  // Agrupamento de Faturas Futuras por Mês/Ano
  const futureGrouped: { [key: string]: { monthName: string; total: number; items: any[] } } = {};
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  futureInvoicesItems.forEach((item) => {
    const d = new Date(item.dueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!futureGrouped[key]) {
      futureGrouped[key] = {
        monthName: `${monthNames[d.getMonth()]} / ${d.getFullYear()}`,
        total: 0,
        items: [],
      };
    }
    futureGrouped[key].total += Number(item.originalAmount);
    futureGrouped[key].items.push(item);
  });

  const currentTotal = currentInvoicesItems.reduce((s, i) => s + Number(i.originalAmount), 0);
  const futureTotal = futureInvoicesItems.reduce((s, i) => s + Number(i.originalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-900/40">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Gestão de Meios de Pagamento</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Cartões de Crédito & Faturas Futuras</h2>
          <p className="text-sm text-purple-200 mt-1 max-w-xl">
            Acompanhe os lançamentos da fatura atual, compras parceladas e a projeção exata das
            faturas futuras para não comprometer o fluxo de caixa.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowCardModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold border border-slate-700 text-xs sm:text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 text-xs sm:text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Compra no Cartão</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold uppercase">Fechar</button>
        </div>
      )}

      {/* Cartões Cadastrados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.length === 0 ? (
          <div className="col-span-3 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
            Nenhum cartão de crédito cadastrado ainda. Clique em "+ Novo Cartão" para começar.
          </div>
        ) : (
          cards.map((c) => (
            <div
              key={c.id}
              className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
                    {c.cardBrand}
                  </span>
                  <h3 className="text-lg font-bold">{c.nickname}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Limite Total:</span>
                  <span className="text-white font-bold">{formatBRL(Number(c.creditLimit))}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Fechamento da Fatura:</span>
                  <span className="text-white font-medium">Dia {c.closingDay}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Vencimento do Boleto:</span>
                  <span className="text-purple-300 font-bold">Dia {c.dueDay}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Abas: Fatura Atual vs Faturas Futuras */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("ATUAL")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === "ATUAL"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Fatura Vigente ({monthNames[currentMonth]})</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {formatBRL(currentTotal)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("FUTURAS")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            activeTab === "FUTURAS"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white"
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>Faturas Futuras (Parcelas Projetadas)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {formatBRL(futureTotal)}
          </span>
        </button>
      </div>

      {/* Conteúdo da Aba */}
      {activeTab === "ATUAL" ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Lançamentos da Fatura Vigente ({currentInvoicesItems.length} compras)
            </span>
            <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
              Total Fatura: {formatBRL(currentTotal)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Descrição da Compra</th>
                  <th className="px-5 py-3">Centro de Custo</th>
                  <th className="px-5 py-3">Parcela</th>
                  <th className="px-5 py-3">Vencimento Fatura</th>
                  <th className="px-5 py-3 font-bold text-right">Valor Parcela (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentInvoicesItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      Nenhuma compra em cartão registrada para este mês vigente.
                    </td>
                  </tr>
                ) : (
                  currentInvoicesItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        {item.description}
                        {item.notes && <p className="text-[10px] text-slate-400 font-normal">{item.notes}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                        {item.costCenter?.name || "Geral"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-semibold">
                        {item.installmentNumber ? `${item.installmentNumber}/${item.totalInstallments}` : "À vista"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {new Date(item.dueDate).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3.5 font-extrabold text-slate-900 dark:text-white text-right">
                        {formatBRL(Number(item.originalAmount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(futureGrouped).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              Não existem compras parceladas futuras projetadas nos cartões cadastrados.
            </div>
          ) : (
            Object.keys(futureGrouped).map((key) => {
              const group = futureGrouped[key];
              return (
                <div
                  key={key}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Fatura Futura — {group.monthName}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                      Total Projetado: {formatBRL(group.total)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="px-5 py-2.5">Descrição</th>
                          <th className="px-5 py-2.5">Centro de Custo</th>
                          <th className="px-5 py-2.5">Parcela</th>
                          <th className="px-5 py-2.5">Vencimento Programado</th>
                          <th className="px-5 py-2.5 font-bold text-right">Valor da Parcela (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {group.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                              {item.description}
                              {item.notes && <p className="text-[10px] text-slate-400 font-normal">{item.notes}</p>}
                            </td>
                            <td className="px-5 py-3 text-slate-500">
                              {item.costCenter?.name || "Geral"}
                            </td>
                            <td className="px-5 py-3 font-semibold text-purple-600 dark:text-purple-400">
                              {item.installmentNumber}/{item.totalInstallments}
                            </td>
                            <td className="px-5 py-3 text-slate-500">
                              {new Date(item.dueDate).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-5 py-3 font-bold text-right text-slate-900 dark:text-white">
                              {formatBRL(Number(item.originalAmount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal - Nova Compra no Cartão */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Lançar Despesa / Compra no Cartão de Crédito
            </h3>
            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Cartão Utilizado *
                </label>
                <select
                  required
                  value={expenseForm.cardId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, cardId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nickname} ({c.cardBrand}) - Fecha dia {c.closingDay} / Vence dia {c.dueDay}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Descrição da Compra *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Ex: Compra de Embalagens e Moldes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Valor Total da Compra (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseForm.totalAmount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Número de Parcelas *
                  </label>
                  <select
                    value={expenseForm.installments}
                    onChange={(e) => setExpenseForm({ ...expenseForm, installments: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <option key={num} value={num}>
                        {num}x {expenseForm.totalAmount ? `de ${formatBRL(Number(expenseForm.totalAmount) / num)}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Centro de Custo
                  </label>
                  <select
                    value={expenseForm.costCenterId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, costCenterId: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>{cc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.purchaseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Compra no Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Novo Cartão */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Cadastrar Novo Cartão de Crédito
            </h3>
            <form onSubmit={handleCreateCard} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Nome / Apelido do Cartão *
                </label>
                <input
                  type="text"
                  required
                  value={cardForm.nickname}
                  onChange={(e) => setCardForm({ ...cardForm, nickname: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Ex: Nubank Corporativo CassaraTech"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Bandeira
                  </label>
                  <select
                    value={cardForm.cardBrand}
                    onChange={(e) => setCardForm({ ...cardForm, cardBrand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Mastercard">Mastercard</option>
                    <option value="Visa">Visa</option>
                    <option value="Elo">Elo</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Limite Total (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    value={cardForm.creditLimit}
                    onChange={(e) => setCardForm({ ...cardForm, creditLimit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Dia de Fechamento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cardForm.closingDay}
                    onChange={(e) => setCardForm({ ...cardForm, closingDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Dia de Vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cardForm.dueDay}
                    onChange={(e) => setCardForm({ ...cardForm, dueDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
