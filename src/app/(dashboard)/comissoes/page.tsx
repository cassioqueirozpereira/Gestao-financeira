import React from "react";
import { db } from "@/lib/db";
import { Percent, Plus, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { CommissionsClientView } from "./CommissionsClientView";

export default async function CommissionsPage() {
  let rules: any[] = [];
  let records: any[] = [];
  let contracts: any[] = [];
  let costCenters: any[] = [];
  let accounts: any[] = [];

  try {
    rules = await db.commissionRule.findMany({
      include: { costCenter: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Erro ao carregar regras de comissão:", e);
  }

  try {
    records = await db.commissionRecord.findMany({
      include: {
        rule: true,
        partner: true,
        contract: {
          include: { customer: true },
        },
        accountPayable: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Erro ao carregar registros de comissão:", e);
  }

  try {
    contracts = await db.contract.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Erro ao carregar contratos:", e);
  }

  try {
    costCenters = await db.costCenter.findMany();
  } catch (e) {
    console.error("Erro ao carregar centros de custo:", e);
  }

  try {
    accounts = await db.chartOfAccount.findMany({
      where: {
        type: { in: ["DESPESA_COMERCIAL_MARKETING", "CUSTO_DIRETO", "DESPESA_ADMINISTRATIVA"] },
      },
    });
  } catch (e) {
    console.error("Erro ao carregar plano de contas:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Percent className="w-6 h-6 text-indigo-600" />
            Controle de Comissões
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Regras de apuração vinculadas a contratos, base de cálculo (total ou instalação), edição, exclusão e filtros.
          </p>
        </div>
      </div>

      <CommissionsClientView
        initialRules={rules}
        initialRecords={records}
        contracts={contracts}
        costCenters={costCenters}
        accounts={accounts}
      />
    </div>
  );
}
