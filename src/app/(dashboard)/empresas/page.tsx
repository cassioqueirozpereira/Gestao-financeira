import React from "react";
import { db } from "@/lib/db";
import { CompaniesClientView } from "./CompaniesClientView";

export const dynamic = "force-dynamic";

export default async function CompaniesAndCostCentersPage() {
  const [companiesRes, costCentersRes] = await Promise.allSettled([
    db.company.findMany({
      include: {
        costCenters: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.costCenter.findMany({
      include: {
        company: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const companies = companiesRes.status === "fulfilled" ? companiesRes.value : [];
  const costCenters = costCentersRes.status === "fulfilled" ? costCentersRes.value : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Empresas e Centros de Custo
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Estrutura organizacional independente para CassaraTech, D.A. Com Carinho, Mídia Social e Casa.
        </p>
      </div>

      <CompaniesClientView
        initialCompanies={companies}
        initialCostCenters={costCenters}
      />
    </div>
  );
}
