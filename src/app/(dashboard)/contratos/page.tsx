import React from "react";
import { db } from "@/lib/db";
import { FileText, Plus, ShieldCheck, Download, CheckCircle2 } from "lucide-react";
import { ContractsClientView } from "./ContractsClientView";

export default async function ContractsPage() {
  let contracts: any[] = [];
  let companies: any[] = [];
  let customers: any[] = [];

  try {
    contracts = await db.contract.findMany({
      include: {
        company: true,
        customer: true,
        receivables: {
          orderBy: { dueDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Erro ao carregar contratos:", e);
  }

  try {
    companies = await db.company.findMany({
      where: { isPersonal: false },
    });
  } catch (e) {
    console.error("Erro ao carregar empresas:", e);
  }

  try {
    customers = await db.customer.findMany({
      include: {
        contracts: true,
        accountsReceivable: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar clientes:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Contratos com Geração Automática
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Modelos adaptados para CassaraTech, D.A. Com Carinho e Mídia Social com preenchimento das partes.
          </p>
        </div>
      </div>

      <ContractsClientView
        initialContracts={contracts}
        companies={companies}
        customers={customers}
      />
    </div>
  );
}
