import React from "react";
import { db } from "@/lib/db";
import { TrendingUp } from "lucide-react";
import { InvestmentsClientView } from "./InvestmentsClientView";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  let capitalRecovery: any = null;
  try {
    capitalRecovery = await db.capitalRecovery.findFirst({
      include: {
        entries: {
          orderBy: { date: "desc" },
          take: 50,
        },
      },
    });
  } catch (e) {
    console.error("Erro ao carregar recuperação de capital:", e);
  }

  const serializedRecovery = capitalRecovery
    ? {
        ...capitalRecovery,
        initialCapital: Number(capitalRecovery.initialCapital),
        additionalAports: Number(capitalRecovery.additionalAports),
        recoveredAmount: Number(capitalRecovery.recoveredAmount),
        createdAt: capitalRecovery.createdAt.toISOString(),
        updatedAt: capitalRecovery.updatedAt.toISOString(),
        entries: capitalRecovery.entries.map((entry: any) => ({
          ...entry,
          amount: Number(entry.amount),
          date: entry.date.toISOString(),
          createdAt: entry.createdAt.toISOString(),
        })),
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Investimentos e Recuperação de Capital
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento do capital investido de R$ 1.600,00 na D.A. Com Carinho, amortização automática via recebíveis e histórico de retiradas.
          </p>
        </div>
      </div>

      <InvestmentsClientView initialRecovery={serializedRecovery} />
    </div>
  );
}
