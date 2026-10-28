import React from "react";
import { db } from "@/lib/db";
import { Percent, Plus, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { CommissionsClientView } from "./CommissionsClientView";

export default async function CommissionsPage() {
  const [
    rulesRes,
    recordsRes,
    contractsRes,
    costCentersRes,
    accountsRes,
  ] = await Promise.allSettled([
    db.commissionRule.findMany({
      include: { costCenter: true },
      orderBy: { createdAt: "desc" },
    }),
    db.commissionRecord.findMany({
      include: {
        rule: true,
        partner: true,
        contract: {
          include: { customer: true },
        },
        accountPayable: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.contract.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    }),
    db.costCenter.findMany(),
    db.chartOfAccount.findMany({
      where: {
        type: { in: ["DESPESA_COMERCIAL_MARKETING", "CUSTO_DIRETO", "DESPESA_ADMINISTRATIVA"] },
      },
    }),
  ]);

  const rules = rulesRes.status === "fulfilled" ? rulesRes.value : [];
  const records = recordsRes.status === "fulfilled" ? recordsRes.value : [];
  const contracts = contractsRes.status === "fulfilled" ? contractsRes.value : [];
  const costCenters = costCentersRes.status === "fulfilled" ? costCentersRes.value : [];
  const accounts = accountsRes.status === "fulfilled" ? accountsRes.value : [];

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
