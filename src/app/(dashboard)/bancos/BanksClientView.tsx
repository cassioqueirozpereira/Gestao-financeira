"use client";

import React, { useState } from "react";
import { Plus, X, Landmark, CreditCard, ShieldCheck, Wallet, DollarSign, AlertCircle } from "lucide-react";
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
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {acc.bankName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400">
                      {acc.accountType}
                    </span>
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
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {card.nickname}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-400">
                      {card.cardBrand}
                    </span>
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-xs">
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

      {/* Modal Novo Cartão */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-xs">
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
