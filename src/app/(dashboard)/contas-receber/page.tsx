import React from "react";
import { db } from "@/lib/db";
import { ArrowUpCircle, Plus, Calendar, Tag, CheckCircle2 } from "lucide-react";
import { ReceivablesClientView } from "./ReceivablesClientView";

export const dynamic = "force-dynamic";

export default async function AccountsReceivablePage() {
  const [
    receivablesRes,
    costCentersRes,
    customersRes,
    accountsRes,
  ] = await Promise.allSettled([
    db.accountReceivable.findMany({
      include: {
        costCenter: true,
        chartOfAccount: true,
        customer: true,
        bankAccount: true,
      },
      orderBy: { dueDate: "asc" },
    }),
    db.costCenter.findMany(),
    db.customer.findMany(),
    db.chartOfAccount.findMany({
      where: { type: "RECEITA_OPERACIONAL" },
    }),
  ]);

  const receivables = receivablesRes.status === "fulfilled" ? receivablesRes.value : [];
  const costCenters = costCentersRes.status === "fulfilled" ? costCentersRes.value : [];
  const customers = customersRes.status === "fulfilled" ? customersRes.value : [];
  const accounts = accountsRes.status === "fulfilled" ? accountsRes.value : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 text-emerald-500" />
            Contas a Receber
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle de faturamentos, cobranças por centro de custo, previsão vs liquidação efetiva e histórico de recebimentos.
          </p>
        </div>
      </div>

      <ReceivablesClientView
        initialReceivables={receivables}
        costCenters={costCenters}
        customers={customers}
        accounts={accounts}
      />
    </div>
  );
}
