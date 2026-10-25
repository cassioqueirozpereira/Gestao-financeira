import React from "react";
import { db } from "@/lib/db";
import { Megaphone, Plus, ShieldCheck, DollarSign, BarChart2 } from "lucide-react";
import { MediaClientView } from "./MediaClientView";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  let expenses: any[] = [];
  let costCenters: any[] = [];

  try {
    expenses = await db.mediaExpense.findMany({
      include: { costCenter: true },
      orderBy: { date: "desc" },
    });
  } catch (e) {
    console.error("Erro ao carregar despesas de mídia:", e);
  }

  try {
    costCenters = await db.costCenter.findMany();
  } catch (e) {
    console.error("Erro ao carregar centros de custo:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-rose-500" />
            Gestão de Mídia Social & Tráfego Pago
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle de campanhas em Meta Ads, Google Ads e TikTok, com separação estrita entre verba própria e verba de clientes.
          </p>
        </div>
      </div>

      <MediaClientView initialExpenses={expenses} costCenters={costCenters} />
    </div>
  );
}
