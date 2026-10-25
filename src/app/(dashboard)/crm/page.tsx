import React from "react";
import { db } from "@/lib/db";
import { Layers, Users, Sparkles, Phone, Mail, ArrowRight } from "lucide-react";
import { CrmClientView } from "./CrmClientView";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  let customers: any[] = [];
  try {
    customers = await db.customer.findMany({
      include: {
        partner: true,
        contracts: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Erro ao carregar clientes do CRM:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            CRM e Funil Comercial
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento de leads, orçamentos públicos recebidos, propostas enviadas e conversão em contratos.
          </p>
        </div>
      </div>

      <CrmClientView initialCustomers={customers} />
    </div>
  );
}
