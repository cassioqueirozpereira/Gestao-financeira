import React from "react";
import { db } from "@/lib/db";
import { Handshake, Plus, Users, DollarSign, Tag } from "lucide-react";
import { PartnersClientView } from "./PartnersClientView";

export default async function PartnersPage() {
  const partners = await db.partner.findMany({
    include: {
      costCenter: true,
      customers: true,
      commissions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const costCenters = await db.costCenter.findMany();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Handshake className="w-6 h-6 text-indigo-600" />
            Gestão de Parcerias Comerciais
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle de afiliados, indicadores, acordos comerciais, comissões e rastreio de clientes indicados.
          </p>
        </div>
      </div>

      <PartnersClientView initialPartners={partners} costCenters={costCenters} />
    </div>
  );
}
