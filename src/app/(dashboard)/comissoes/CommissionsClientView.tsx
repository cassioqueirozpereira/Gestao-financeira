"use client";

import React, { useState } from "react";
import { Plus, X, CheckCircle2, AlertCircle, Percent, ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface CommissionsClientViewProps {
  initialRules: any[];
  initialRecords: any[];
  costCenters: any[];
  accounts: any[];
}

export function CommissionsClientView({
  initialRules,
  initialRecords,
  costCenters,
  accounts,
}: CommissionsClientViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"records" | "rules">("records");
  const [rules, setRules] = useState(initialRules);
  const [records, setRecords] = useState(initialRecords);

  // Modais
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [approveRecord, setApproveRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form de Regra
  const [ruleName, setRuleName] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [costCenterId, setCostCenterId] = useState(costCenters[0]?.id || "");
  const [baseType, setBaseType] = useState<"VALOR_BRUTO" | "VALOR_LIQUIDO" | "VALOR_FIXO">("VALOR_BRUTO");
  const [percentage, setPercentage] = useState("10");
  const [triggerEvent, setTriggerEvent] = useState("RECEBIMENTO_EFETIVO");

  // Form de Aprovação
  const [chartOfAccountId, setChartOfAccountId] = useState(accounts[0]?.id || "");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/comissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ruleName,
          beneficiary,
          costCenterId,
          baseType,
          percentage: parseFloat(percentage),
          triggerEvent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar regra");

      setRules([data.rule, ...rules]);
      setShowRuleModal(false);
      setRuleName("");
      setBeneficiary("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveRecord) return;
    setLoading(true);
    setErrorMsg(null);

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

      setRecords(records.map((r) => (r.id === data.record.id ? data.record : r)));
      setApproveRecord(null);
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
      {/* Abas e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("records")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "records"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Comissões Apuradas ({records.length})
          </button>
          <button
            onClick={() => setTab("rules")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "rules"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Regras de Comissão ({rules.length})
          </button>
        </div>

        <button
          onClick={() => setShowRuleModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" /> Nova Regra de Comissão
        </button>
      </div>

      {/* Modal Nova Regra */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowRuleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Configurar Regra de Comissão
            </h3>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-600 rounded-lg">{errorMsg}</div>
            )}

            <form onSubmit={handleCreateRule} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Nome da Regra</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Comissão 10% Vendas Velas, Indicação CassaraTech..."
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Beneficiário (Vendedor / Parceiro)</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do parceiro, afiliado ou responsável"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Centro de Custo</label>
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

                <div>
                  <label className="block font-semibold mb-1">Base de Cálculo</label>
                  <select
                    value={baseType}
                    onChange={(e) => setBaseType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="VALOR_BRUTO">Valor Bruto</option>
                    <option value="VALOR_LIQUIDO">Valor Líquido</option>
                    <option value="VALOR_FIXO">Valor Fixo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Percentual (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Evento Gerador</label>
                  <select
                    value={triggerEvent}
                    onChange={(e) => setTriggerEvent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="RECEBIMENTO_EFETIVO">Recebimento Efetivo</option>
                    <option value="VENDA_REALIZADA">Venda Realizada</option>
                    <option value="CONTRATO_ASSINADO">Contrato Assinado</option>
                    <option value="INDICACAO_CONVERTIDA">Indicação Convertida</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-3 py-1.5 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-xl"
                >
                  {loading ? "Salvando..." : "Salvar Regra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Aprovação e Geração de Conta a Pagar */}
      {approveRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-xs">
            <button
              onClick={() => setApproveRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Aprovar Comissão & Gerar Conta a Pagar
              </h3>
            </div>

            <p className="text-slate-500 mb-4">
              Ao aprovar, o sistema gerará automaticamente uma conta a pagar para{" "}
              <strong>{approveRecord.beneficiary}</strong> no valor de{" "}
              <strong className="text-indigo-600">{formatBRL(Number(approveRecord.calculatedAmount))}</strong>,
              evitando duplicidades financeiras.
            </p>

            <form onSubmit={handleApproveCommission} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Categoria Contábil (Plano de Contas)</label>
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

              <div>
                <label className="block font-semibold mb-1">Data de Vencimento do Pagamento</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApproveRecord(null)}
                  className="px-3 py-1.5 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                >
                  {loading ? "Processando..." : "Confirmar Aprovação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba Records */}
      {tab === "records" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {records.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Nenhuma comissão apurada até o momento. As comissões são geradas a partir de pedidos ou contratos conforme as regras ativas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Beneficiário</th>
                    <th className="py-3 px-4">Regra / Origem</th>
                    <th className="py-3 px-4">Base de Cálculo</th>
                    <th className="py-3 px-4">Comissão Calculada</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {r.beneficiary}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {r.rule?.name || "Comissão Direta"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {formatBRL(Number(r.calculationBase))}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                        {formatBRL(Number(r.calculatedAmount))}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === "APROVADA" || r.status === "PAGA"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status === "PREVISTA" || r.status === "EM_APURACAO" ? (
                          <button
                            onClick={() => setApproveRecord(r)}
                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            Aprovar para Pagamento →
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Conta a pagar vinculada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba Rules */}
      {tab === "rules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold text-indigo-500 uppercase">
                    {rule.costCenter?.name || "Todos os centros"}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Ativa
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{rule.name}</h4>
                <p className="text-slate-500 mb-3">Beneficiário: {rule.beneficiary}</p>
                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Taxa Aplicada:</span>
                    <strong className="text-indigo-600">{Number(rule.percentage || 0)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Base:</span>
                    <span>{rule.baseType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gatilho:</span>
                    <span>{rule.triggerEvent}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
