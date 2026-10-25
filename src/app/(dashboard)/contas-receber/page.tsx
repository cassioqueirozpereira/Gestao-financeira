import React from "react";
import { db } from "@/lib/db";
import { ArrowUpCircle, Plus, Calendar, Tag, CheckCircle2 } from "lucide-react";
import { ReceivablesClientView } from "./ReceivablesClientView";

export const dynamic = "force-dynamic";

export default async function AccountsReceivablePage() {
  let receivables: any[] = [];
  let costCenters: any[] = [];
  let customers: any[] = [];
  let accounts: any[] = [];

  try {
    receivables = await db.accountReceivable.findMany({
      include: {
        costCenter: true,
        chartOfAccount: true,
        customer: true,
        bankAccount: true,
      },
      orderBy: { dueDate: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar contas a receber:", e);
  }

  try {
    costCenters = await db.costCenter.findMany();
  } catch (e) {
    console.error("Erro ao carregar centros de custo:", e);
  }

  try {
    customers = await db.customer.findMany();
  } catch (e) {
    console.error("Erro ao carregar clientes:", e);
  }

  try {
    accounts = await db.chartOfAccount.findMany({
      where: { type: "RECEITA_OPERACIONAL" },
    });
  } catch (e) {
    console.error("Erro ao carregar plano de contas:", e);
  }

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
