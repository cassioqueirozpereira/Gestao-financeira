import React from "react";
import { db } from "@/lib/db";
import { Landmark } from "lucide-react";
import { ConciliacaoClientView } from "./ConciliacaoClientView";

export const dynamic = "force-dynamic";

export default async function ConciliacaoPage() {
  const [
    banksRes,
    openPayablesRes,
    openReceivablesRes,
    chartRes,
    costCentersRes,
    suppliersRes,
    customersRes,
  ] = await Promise.allSettled([
    db.bankAccount.findMany({
      orderBy: { createdAt: "asc" },
    }),
    db.accountPayable.findMany({
      where: { status: { in: ["EM_ABERTO", "A_VENCER", "VENCIDA"] } },
      include: { supplier: true, chartOfAccount: true },
      orderBy: { dueDate: "asc" },
    }),
    db.accountReceivable.findMany({
      where: { status: { in: ["A_RECEBER", "A_VENCER", "VENCIDA"] } },
      include: { customer: true, chartOfAccount: true },
      orderBy: { dueDate: "asc" },
    }),
    db.chartOfAccount.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    db.costCenter.findMany({ orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  const bankAccounts = banksRes.status === "fulfilled" ? banksRes.value : [];
  const openPayables = openPayablesRes.status === "fulfilled" ? openPayablesRes.value : [];
  const openReceivables = openReceivablesRes.status === "fulfilled" ? openReceivablesRes.value : [];
  const chartOfAccounts = chartRes.status === "fulfilled" ? chartRes.value : [];
  const costCenters = costCentersRes.status === "fulfilled" ? costCentersRes.value : [];
  const suppliers = suppliersRes.status === "fulfilled" ? suppliersRes.value : [];
  const customers = customersRes.status === "fulfilled" ? customersRes.value : [];

  let transactions: any[] = [];
  const defaultBankId = bankAccounts[0]?.id;

  if (defaultBankId) {
    try {
      transactions = await db.bankTransaction.findMany({
        where: { bankAccountId: defaultBankId },
        orderBy: { date: "desc" },
      });
    } catch (e) {
      console.error("Erro ao carregar transações bancárias:", e);
    }
  }

  // Serializa Decimals e Dates
  const serializedBanks = bankAccounts.map((b) => ({
    ...b,
    currentBalance: Number(b.currentBalance),
    initialBalance: Number(b.initialBalance),
    referenceDate: b.referenceDate.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  const serializedTransactions = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
  }));

  const serializedPayables = openPayables.map((p) => ({
    ...p,
    originalAmount: Number(p.originalAmount),
    paidAmount: Number(p.paidAmount),
    dueDate: p.dueDate.toISOString(),
    competenceDate: p.competenceDate.toISOString(),
    issueDate: p.issueDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const serializedReceivables = openReceivables.map((r) => ({
    ...r,
    originalAmount: Number(r.originalAmount),
    receivedAmount: Number(r.receivedAmount),
    dueDate: r.dueDate.toISOString(),
    competenceDate: r.competenceDate.toISOString(),
    issueDate: r.issueDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-600" />
            Conciliação Bancária em Tela Única
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Importação de extratos OFX/CSV, cruzamento automático de valores com contas em aberto e liquidação instantânea.
          </p>
        </div>
      </div>

      <ConciliacaoClientView
        bankAccounts={serializedBanks}
        initialTransactions={serializedTransactions}
        openPayables={serializedPayables}
        openReceivables={serializedReceivables}
        chartOfAccounts={chartOfAccounts}
        costCenters={costCenters}
        suppliers={suppliers}
        customers={customers}
      />
    </div>
  );
}
