import React from "react";
import { db } from "@/lib/db";
import { TrendingUp, ShieldCheck, DollarSign, Wallet } from "lucide-react";
import { InvestmentsClientView } from "./InvestmentsClientView";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  let capitalRecovery: any = null;
  try {
    capitalRecovery = await db.capitalRecovery.findFirst();
  } catch (e) {
    console.error("Erro ao carregar recuperação de capital:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Investimentos e Recuperação de Capital
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento do capital investido de R$ 1.600,00 na D.A. Com Carinho, retiradas reais e posições financeiras.
          </p>
        </div>
      </div>

      <InvestmentsClientView initialRecovery={capitalRecovery} />
    </div>
  );
}
