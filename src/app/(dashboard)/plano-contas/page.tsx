import React from "react";
import { db } from "@/lib/db";
import { ListTree } from "lucide-react";
import { ChartOfAccountsClientView } from "./ChartOfAccountsClientView";

export const dynamic = "force-dynamic";

export default async function ChartOfAccountsPage() {
  let accounts: any[] = [];
  try {
    accounts = await db.chartOfAccount.findMany({
      include: {
        parent: true,
      },
      orderBy: { code: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar plano de contas:", e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ListTree className="w-6 h-6 text-indigo-600" />
          Plano de Contas Hierárquico
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Classificação gerencial em até 4 níveis para apuração de DRE, fluxo de caixa e custos reais.
        </p>
      </div>

      <ChartOfAccountsClientView initialAccounts={accounts} />
    </div>
  );
}
