import React from "react";
import { db } from "@/lib/db";
import { Target, TrendingUp, CheckCircle, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { GoalsClientView } from "./GoalsClientView";

export default async function GoalsPage() {
  let goals: any[] = [];
  let costCenters: any[] = [];

  try {
    goals = await db.performanceGoal.findMany({
      include: { costCenter: true },
      orderBy: { endDate: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar metas:", e);
  }

  try {
    costCenters = await db.costCenter.findMany();
  } catch (e) {
    console.error("Erro ao carregar centros de custo:", e);
  }

  // Contadores de situação
  const atingidas = goals.filter((g) => g.status === "ATINGIDA" || g.status === "SUPERADA").length;
  const emAndamento = goals.filter((g) => g.status === "EM_ANDAMENTO").length;
  const naoAtingidas = goals.filter((g) => g.status === "NAO_ATINGIDA").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Metas e Planejamento
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento de objetivos por centro de custo, metas de crescimento e de redução, com justificativas formais.
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total de Metas
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {goals.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Planejadas para o ciclo</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Atingidas / Superadas
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {atingidas}
          </div>
          <p className="text-xs text-slate-500 mt-1">Sucesso consolidado</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Em Andamento
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {emAndamento}
          </div>
          <p className="text-xs text-slate-500 mt-1">Dentro do prazo vigente</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-red-500 uppercase tracking-wider block">
            Não Atingidas
          </span>
          <div className="text-2xl font-black text-red-500 mt-1">{naoAtingidas}</div>
          <p className="text-xs text-slate-500 mt-1">Com justificativa exigida</p>
        </div>
      </div>

      <GoalsClientView initialGoals={goals} costCenters={costCenters} />
    </div>
  );
}
