"use client";

import React, { useState } from "react";
import { Plus, X, Landmark, Calendar, ChevronDown, ChevronUp, DollarSign, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface DebtsClientViewProps {
  initialDebts: any[];
  companies: any[];
  costCenters: any[];
  accounts: any[];
}

export function DebtsClientView({
  initialDebts,
  companies,
  costCenters,
  accounts,
}: DebtsClientViewProps) {
  const router = useRouter();
  const [debts, setDebts] = useState(initialDebts);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [creditorName, setCreditorName] = useState("");
  const [type, setType] = useState("EMPRESTIMO_BANCARIO");
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [costCenterId, setCostCenterId] = useState(costCenters[0]?.id || "");
  const [chartOfAccountId, setChartOfAccountId] = useState(accounts[0]?.id || "");
  const [originalAmount, setOriginalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("1.5");
  const [totalInstallments, setTotalInstallments] = useState("12");
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [contractDate, setContractDate] = useState(new Date().toISOString().split("T")[0]);
  const [guarantees, setGuarantees] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/dividas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditorName,
          type,
          companyId,
          costCenterId,
          chartOfAccountId,
          contractDate,
          originalAmount: parseFloat(originalAmount),
          interestRate: parseFloat(interestRate),
          totalInstallments: parseInt(totalInstallments),
          firstDueDate,
          guarantees,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar dívida");

      setShowModal(false);
      setCreditorName("");
      setOriginalAmount("");
      router.refresh();
      window.location.reload();
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
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" /> Cadastrar Dívida / Empréstimo
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative text-xs animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Registrar Dívida ou Obrigação Financeira
            </h3>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-600 rounded-lg">{errorMsg}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Credor / Instituição *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Banco Santander, Sócio Titular, Fornecedor X"
                    value={creditorName}
                    onChange={(e) => setCreditorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Tipo de Obrigação</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="EMPRESTIMO_BANCARIO">Empréstimo Bancário</option>
                    <option value="FINANCIAMENTO">Financiamento</option>
                    <option value="DIVIDA_FORNECEDOR">Dívida com Fornecedor</option>
                    <option value="MUTUO_SOCIO">Mútuo de Sócio / Proprietário</option>
                    <option value="PARCELAMENTO_FISCAL">Parcelamento Fiscal</option>
                    <option value="RENEGOCIACAO">Dívida Renegociada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Empresa Devedora</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tradeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Centro de Custo Beneficiado</label>
                  <select
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Categoria Contábil das Parcelas</label>
                <select
                  value={chartOfAccountId}
                  onChange={(e) => setChartOfAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Valor Principal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={originalAmount}
                    onChange={(e) => setOriginalAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Taxa de Juros (% a.m.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Qtd Parcelas *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Data da Contratação</label>
                  <input
                    type="date"
                    required
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Vencimento da 1ª Parcela *</label>
                  <input
                    type="date"
                    required
                    value={firstDueDate}
                    onChange={(e) => setFirstDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Garantias / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Garantias vinculadas, número de contrato, conta de crédito..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
                >
                  {loading ? "Registrando..." : "Cadastrar & Gerar Parcelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Dívidas */}
      {debts.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
          Nenhuma dívida ou obrigação cadastrada. O sistema gerencia dívidas com cronograma automático e separação de amortização do principal vs juros.
        </div>
      ) : (
        <div className="space-y-4">
          {debts.map((d) => {
            const isExpanded = expandedDebtId === d.id;
            return (
              <div
                key={d.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {d.creditorName}
                      </span>
                      <span className="bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                        {d.type}
                      </span>
                    </div>
                    <p className="text-slate-500">
                      {d.company?.tradeName} • {d.costCenter?.name} • Contratado em:{" "}
                      {new Date(d.contractDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Saldo Devedor
                      </span>
                      <span className="text-base font-black text-red-600 dark:text-red-400">
                        {formatBRL(Number(d.currentBalance))}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Parcelas
                      </span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {d.totalInstallments}x
                      </span>
                    </div>

                    <button
                      onClick={() => setExpandedDebtId(isExpanded ? null : d.id)}
                      className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500"
                      title="Ver cronograma de parcelas"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Tabela de Parcelas Expandida */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                      Cronograma de Parcelas & Amortização:
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase">
                          <tr>
                            <th className="py-2 px-3">Nº</th>
                            <th className="py-2 px-3">Vencimento</th>
                            <th className="py-2 px-3">Amortização Principal</th>
                            <th className="py-2 px-3">Juros e Encargos</th>
                            <th className="py-2 px-3">Total Parcela</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                          {d.installments.map((inst: any) => (
                            <tr key={inst.id}>
                              <td className="py-2 px-3 font-mono font-bold">
                                {inst.installmentNumber}/{d.totalInstallments}
                              </td>
                              <td className="py-2 px-3 font-mono">
                                {new Date(inst.dueDate).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="py-2 px-3">{formatBRL(Number(inst.principalAmount))}</td>
                              <td className="py-2 px-3 text-amber-600">{formatBRL(Number(inst.interestAmount))}</td>
                              <td className="py-2 px-3 font-bold">{formatBRL(Number(inst.totalAmount))}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    inst.isPaid
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                  }`}
                                >
                                  {inst.isPaid ? "PAGA" : "EM ABERTO"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
