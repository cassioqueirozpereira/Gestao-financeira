"use client";

import React, { useState } from "react";
import { Plus, X, Landmark, CreditCard, ShieldCheck, Wallet, DollarSign, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface BanksClientViewProps {
  initialAccounts: any[];
  initialCards: any[];
  companies: any[];
}

export function BanksClientView({
  initialAccounts,
  initialCards,
  companies,
}: BanksClientViewProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [cards, setCards] = useState(initialCards);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Conta
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("CORRENTE");
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");

  // Form Cartão
  const [cardHolder, setCardHolder] = useState("");
  const [cardBrand, setCardBrand] = useState("Mastercard");
  const [cardNickname, setCardNickname] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [closingDay, setClosingDay] = useState("5");
  const [dueDay, setDueDay] = useState("12");

  // Estados de Edição
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [editingCard, setEditingCard] = useState<any | null>(null);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/bancos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName,
          accountType,
          holderName,
          accountNumber,
          initialBalance: parseFloat(initialBalance),
          companyId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar conta");

      setAccounts([data.account, ...accounts]);
      setShowAccountModal(false);
      setBankName("");
      setInitialBalance("0");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/bancos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CREDIT_CARD",
          holderName: cardHolder,
          cardBrand,
          nickname: cardNickname,
          creditLimit: parseFloat(creditLimit),
          closingDay: parseInt(closingDay),
          dueDay: parseInt(dueDay),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar cartão");

      setCards([data.card, ...cards]);
      setShowCardModal(false);
      setCardNickname("");
      setCreditLimit("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/bancos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAccount),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar conta");

      setAccounts(accounts.map((acc) => (acc.id === editingAccount.id ? { ...acc, ...data.account } : acc)));
      setEditingAccount(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a conta bancária "${name}"? Os lançamentos vinculados terão sua conta desassociada.`)) {
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/bancos?id=${id}&type=ACCOUNT`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir conta");

      setAccounts(accounts.filter((acc) => acc.id !== id));
      if (editingAccount?.id === id) setEditingAccount(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/bancos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "CREDIT_CARD", ...editingCard }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar cartão");

      setCards(cards.map((c) => (c.id === editingCard.id ? { ...c, ...data.card } : c)));
      setEditingCard(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (id: string, nickname: string) => {
    if (!confirm(`Deseja realmente excluir o cartão "${nickname}"? Esta operação é irreversível.`)) {
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/bancos?id=${id}&type=CREDIT_CARD`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir cartão");

      setCards(cards.filter((c) => c.id !== id));
      if (editingCard?.id === id) setEditingCard(null);
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
      {/* Botões de Ação */}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => setShowAccountModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" /> Cadastrar Conta Bancária
        </button>
        <button
          onClick={() => setShowCardModal(true)}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-700 shadow transition"
        >
          <CreditCard className="w-4 h-4" /> Cadastrar Cartão de Crédito
        </button>
      </div>

      {/* Seção 1: Contas Bancárias */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
          <Landmark className="w-4 h-4 text-indigo-500" />
          Contas Bancárias & Caixas
        </h2>

        {accounts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
            Nenhuma instituição financeira cadastrada. Clique em "Cadastrar Conta Bancária" para registrar Nubank, Inter, Caixa, etc.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {acc.bankName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400">
                        {acc.accountType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingAccount({ ...acc })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Editar conta bancária"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(acc.id, acc.bankName)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        title="Excluir conta bancária"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-500 mb-2">Titular: {acc.holderName}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Saldo Atual</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                    {formatBRL(Number(acc.currentBalance))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção 2: Cartões de Crédito */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-violet-500" />
          Cartões de Crédito
        </h2>

        {cards.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
            Nenhum cartão de crédito cadastrado. Os cartões armazenam apenas apelido, limite e datas de fechamento/vencimento (sem números sensíveis).
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {card.nickname}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-400">
                        {card.cardBrand}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingCard({ ...card })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Editar cartão de crédito"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id, card.nickname)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        title="Excluir cartão de crédito"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-500 mb-1">Titular: {card.holderName}</p>
                  <p className="text-slate-400 text-[11px]">
                    Fechamento: Dia {card.closingDay} • Vencimento: Dia {card.dueDay}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Limite Informado</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {formatBRL(Number(card.creditLimit))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nova Conta */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative text-xs max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAccountModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Cadastrar Instituição / Conta Bancária
            </h3>
            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Nome do Banco / Instituição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank, Banco Inter, Caixa Econômica, Caixa Físico"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tipo de Conta</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="CORRENTE">Conta Corrente</option>
                    <option value="POUPANCA">Poupança</option>
                    <option value="PAGAMENTO">Conta de Pagamento</option>
                    <option value="INVESTIMENTO">Conta de Investimento</option>
                    <option value="CAIXA_FISICO">Caixa Físico</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Saldo Inicial (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Nome do Titular *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do titular da conta"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-3 py-1.5 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-xl"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Conta Bancária */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative text-xs max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingAccount(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-indigo-500" />
              Editar Conta Bancária / Caixa
            </h3>
            <form onSubmit={handleUpdateAccount} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Nome do Banco / Instituição *</label>
                <input
                  type="text"
                  required
                  value={editingAccount.bankName || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, bankName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tipo de Conta</label>
                  <select
                    value={editingAccount.accountType || "CORRENTE"}
                    onChange={(e) => setEditingAccount({ ...editingAccount, accountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="CORRENTE">Conta Corrente</option>
                    <option value="POUPANCA">Poupança</option>
                    <option value="PAGAMENTO">Conta de Pagamento</option>
                    <option value="INVESTIMENTO">Conta de Investimento</option>
                    <option value="CAIXA_FISICO">Caixa Físico</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Saldo Atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingAccount.currentBalance ?? 0}
                    onChange={(e) => setEditingAccount({ ...editingAccount, currentBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Nome do Titular *</label>
                <input
                  type="text"
                  required
                  value={editingAccount.holderName || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, holderName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Número da Conta / Agência (Opcional)</label>
                <input
                  type="text"
                  value={editingAccount.accountNumber || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleDeleteAccount(editingAccount.id, editingAccount.bankName)}
                  className="px-3 py-1.5 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-3 py-1.5 border rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-xl shadow"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Cartão de Crédito */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative text-xs max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingCard(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-violet-500" />
              Editar Cartão de Crédito
            </h3>
            <form onSubmit={handleUpdateCard} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Apelido do Cartão *</label>
                <input
                  type="text"
                  required
                  value={editingCard.nickname || ""}
                  onChange={(e) => setEditingCard({ ...editingCard, nickname: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Bandeira</label>
                  <select
                    value={editingCard.cardBrand || "Mastercard"}
                    onChange={(e) => setEditingCard({ ...editingCard, cardBrand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="Mastercard">Mastercard</option>
                    <option value="Visa">Visa</option>
                    <option value="Elo">Elo</option>
                    <option value="Hipercard">Hipercard</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Limite Informado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingCard.creditLimit ?? 0}
                    onChange={(e) => setEditingCard({ ...editingCard, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Dia Fechamento *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={editingCard.closingDay ?? 5}
                    onChange={(e) => setEditingCard({ ...editingCard, closingDay: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Dia Vencimento *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={editingCard.dueDay ?? 12}
                    onChange={(e) => setEditingCard({ ...editingCard, dueDay: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Nome do Titular *</label>
                <input
                  type="text"
                  required
                  value={editingCard.holderName || ""}
                  onChange={(e) => setEditingCard({ ...editingCard, holderName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleDeleteCard(editingCard.id, editingCard.nickname)}
                  className="px-3 py-1.5 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCard(null)}
                    className="px-3 py-1.5 border rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-violet-600 text-white font-semibold rounded-xl shadow"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Cartão */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative text-xs max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCardModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Cadastrar Cartão de Crédito
            </h3>
            <form onSubmit={handleCreateCard} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Apelido do Cartão *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank PJ, Inter Velas, Cartão Pessoal"
                  value={cardNickname}
                  onChange={(e) => setCardNickname(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Bandeira</label>
                  <select
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="Mastercard">Mastercard</option>
                    <option value="Visa">Visa</option>
                    <option value="Elo">Elo</option>
                    <option value="Hipercard">Hipercard</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Limite Informado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Dia Fechamento *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Dia Vencimento *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Nome do Titular *</label>
                <input
                  type="text"
                  required
                  placeholder="Como impresso no cartão"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="px-3 py-1.5 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-violet-600 text-white font-semibold rounded-xl"
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
