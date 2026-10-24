import React from "react";
import { db } from "@/lib/db";
import { ArrowDownCircle } from "lucide-react";
import { PayablesClientView } from "./PayablesClientView";

export default async function AccountsPayablePage() {
  const payables = await db.accountPayable.findMany({
    include: {
      costCenter: true,
      chartOfAccount: true,
      supplier: true,
      bankAccount: true,
    },
    orderBy: { dueDate: "asc" },
  });

  const costCenters = await db.costCenter.findMany();
  const bankAccounts = await db.bankAccount.findMany();
  const accounts = await db.chartOfAccount.findMany({
    where: {
      type: {
        in: [
          "CUSTO_DIRETO",
          "CUSTO_INDIRETO",
          "DESPESA_ADMINISTRATIVA",
          "DESPESA_COMERCIAL_MARKETING",
          "INVESTIMENTO_ATIVO",
        ],
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ArrowDownCircle className="w-6 h-6 text-amber-500" />
            Contas a Pagar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle de compromissos com filtros de tipo de pagamento, programação fixa, baixa integrada e edição.
          </p>
        </div>
      </div>

      <PayablesClientView
        initialPayables={payables}
        costCenters={costCenters}
        accounts={accounts}
        bankAccounts={bankAccounts}
      />
    </div>
  );
}
