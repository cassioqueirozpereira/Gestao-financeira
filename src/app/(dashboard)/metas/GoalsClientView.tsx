"use client";

import React, { useState } from "react";
import { Plus, X, Target, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Clock, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";

interface GoalsClientViewProps {
  initialGoals: any[];
  costCenters: any[];
}

export function GoalsClientView({ initialGoals, costCenters }: GoalsClientViewProps) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [showModal, setShowModal] = useState(false);
  const [updateGoal, setUpdateGoal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form de criação
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [costCenterId, setCostCenterId] = useState(costCenters[0]?.id || "");
  const [period, setPeriod] = useState("MENSAL");
  const [direction, setDirection] = useState<"AUMENTO" | "REDUCAO">("AUMENTO");
  const [unit, setUnit] = useState("BRL");
  const [targetValue, setTargetValue] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0]
  );
  const [responsibleName, setResponsibleName] = useState("");

  // Form de atualização de progresso
  const [progressVal, setProgressVal] = useState("");
  const [goalStatus, setGoalStatus] = useState("EM_ANDAMENTO");
  const [justification, setJustification] = useState("");
  const [actionPlan, setActionPlan] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          costCenterId,
          period,
          direction,
          unit,
          targetValue: parseFloat(targetValue),
          startDate,
          endDate,
          responsibleName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar meta");

      setGoals([...goals, data.goal]);
      setShowModal(false);
      setTitle("");
      setTargetValue("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateGoal) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PROGRESS",
          goalId: updateGoal.id,
          currentValue: parseFloat(progressVal),
          status: goalStatus,
          justification,
          actionPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar meta");

      setGoals(goals.map((g) => (g.id === data.goal.id ? data.goal : g)));
      setUpdateGoal(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = (goal: any) => {
    const target = Number(goal.targetValue);
    const current = Number(goal.currentValue);
    if (target === 0) return 0;

    if (goal.direction === "AUMENTO") {
      return (current / target) * 100;
    } else {
      // Redução: se atual <= target, meta 100% ou mais
      if (current <= target) return 100;
      const excess = current - target;
      return Math.max(0, 100 - (excess / target) * 100);
    }
  };

  const formatValue = (val: number, unitType: string) => {
    if (unitType === "BRL") {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
    }
    if (unitType === "PORCENTAGEM") return `${val.toFixed(1)}%`;
    return `${val} ${unitType.toLowerCase()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" /> Nova Meta de Desempenho
        </button>
      </div>

      {/* Modal Nova Meta */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative text-xs max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Definir Nova Meta de Desempenho
            </h3>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-600 rounded-lg">{errorMsg}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Título da Meta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Faturamento Mensal Velas R$ 15.000, Limite Gastos Mídia R$ 800..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
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
                  <label className="block font-semibold mb-1">Período de Apuração</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="DIARIA">Diária</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="MENSAL">Mensal</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Direção da Meta</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="AUMENTO">📈 Aumento (Ex: Vendas)</option>
                    <option value="REDUCAO">📉 Redução (Ex: Despesas)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Unidade</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="BRL">R$ (Reais)</option>
                    <option value="UNIDADES">Unidades Produzidas</option>
                    <option value="CLIENTES">Novos Clientes</option>
                    <option value="PORCENTAGEM">% Percentual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Valor Alvo (Meta) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Data Início</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Data Prazo Final</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Responsável Interno</label>
                <input
                  type="text"
                  placeholder="Nome do líder ou operador responsável"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
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
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-xl"
                >
                  {loading ? "Salvando..." : "Criar Meta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Atualização de Progresso */}
      {updateGoal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl relative text-xs max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setUpdateGoal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Atualizar Progresso da Meta
            </h3>
            <p className="text-slate-500 mb-4">{updateGoal.title}</p>

            <form onSubmit={handleUpdateProgress} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">
                  Valor Atual Alcançado ({updateGoal.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={progressVal}
                  onChange={(e) => setProgressVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Status da Meta</label>
                <select
                  value={goalStatus}
                  onChange={(e) => setGoalStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                >
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="ATINGIDA">Atingida</option>
                  <option value="SUPERADA">Superada</option>
                  <option value="PARCIALMENTE_ATINGIDA">Parcialmente Atingida</option>
                  <option value="NAO_ATINGIDA">Não Atingida</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Justificativa (Obrigatória se Não Atingida ou Cancelada)
                </label>
                <textarea
                  rows={2}
                  placeholder="Obstáculos encontrados, fatores de mercado, atrasos..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Plano de Ação Corretivo</label>
                <textarea
                  rows={2}
                  placeholder="Medidas a serem adotadas para o próximo ciclo..."
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdateGoal(null)}
                  className="px-3 py-1.5 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-xl"
                >
                  {loading ? "Salvando..." : "Confirmar Atualização"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid de Metas */}
      {goals.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
          Nenhuma meta cadastrada. Clique em "Nova Meta de Desempenho" para estruturar objetivos claros com acompanhamento real.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const completion = calculateCompletion(g);
            return (
              <div
                key={g.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold text-indigo-500 uppercase">
                      {g.costCenter?.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        g.status === "ATINGIDA" || g.status === "SUPERADA"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : g.status === "NAO_ATINGIDA"
                          ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1">
                    {g.title}
                  </h3>
                  <p className="text-slate-400 text-[11px] mb-3">
                    Período: {g.period} • Prazo: {new Date(g.endDate).toLocaleDateString("pt-BR")}
                  </p>

                  <div className="space-y-1.5 my-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Meta Planejada:</span>
                      <strong className="text-slate-700 dark:text-slate-200">
                        {formatValue(Number(g.targetValue), g.unit)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resultado Atual:</span>
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {formatValue(Number(g.currentValue), g.unit)}
                      </strong>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mt-2">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          completion >= 100 ? "bg-emerald-500" : "bg-indigo-600"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                      <span>Progresso: {completion.toFixed(1)}%</span>
                      <span>{g.direction === "AUMENTO" ? "Meta de Crescimento" : "Meta de Redução"}</span>
                    </div>
                  </div>

                  {g.justification && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-lg text-[10px]">
                      <strong>Justificativa:</strong> {g.justification}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      setUpdateGoal(g);
                      setProgressVal(String(g.currentValue));
                      setGoalStatus(g.status);
                      setJustification(g.justification || "");
                      setActionPlan(g.actionPlan || "");
                    }}
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Atualizar Progresso
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
