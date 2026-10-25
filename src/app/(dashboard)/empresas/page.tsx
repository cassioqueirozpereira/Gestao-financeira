import React from "react";
import { db } from "@/lib/db";
import { Building2, Layers, ShieldCheck, Home } from "lucide-react";

export default async function CompaniesAndCostCentersPage() {
  let companies: any[] = [];
  let costCenters: any[] = [];

  try {
    companies = await db.company.findMany({
      include: {
        costCenters: true,
      },
      orderBy: { createdAt: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar empresas:", e);
  }

  try {
    costCenters = await db.costCenter.findMany({
      include: {
        company: true,
      },
      orderBy: { createdAt: "asc" },
    });
  } catch (e) {
    console.error("Erro ao carregar centros de custo:", e);
  }

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

      {/* Seção 1: Unidades Cadastradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((company) => (
          <div
            key={company.id}
            className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
              company.isPersonal
                ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/20"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  {company.isPersonal ? <Home className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    company.isPersonal
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                      : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400"
                  }`}
                >
                  {company.isPersonal ? "Residencial / Pessoal" : "Unidade Empresarial"}
                </span>
              </div>

              <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                {company.tradeName}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{company.name}</p>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Documento:</span>
                  <span className="font-medium">{company.documentNumber || "Não aplicável"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">E-mail:</span>
                  <span className="font-medium">{company.email || "Não informado"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Centro de Custo Vinculado:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {company.costCenters?.map((cc: any) => (
                  <span
                    key={cc.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
                  >
                    <Layers className="w-3 h-3 text-indigo-500" />
                    {cc.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seção 2: Regras e Diretrizes dos Centros de Custo */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5 mb-3 text-indigo-400">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="font-bold text-base">Diretrizes de Classificação e Rateio</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          O centro de custo identifica a operação beneficiada e é 100% independente do plano de contas.
          Quando uma despesa beneficiar mais de um centro, o sistema permite rateá-la por valor fixo ou percentual,
          garantindo que a soma dos rateios seja exatamente igual ao valor original.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <strong className="text-indigo-300 block mb-1">1. Sistemas</strong>
            Desenvolvimento, hospedagem, implantação e manutenção de tecnologia.
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <strong className="text-indigo-300 block mb-1">2. Velas</strong>
            Matérias-primas, embalagens, produção e comercialização de velas.
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <strong className="text-indigo-300 block mb-1">3. Resinas</strong>
            Resinas, moldes, pigmentos e produção de peças decorativas.
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <strong className="text-indigo-300 block mb-1">4. Mídia Social</strong>
            Serviços, ferramentas, consultorias e campanhas de redes sociais.
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <strong className="text-indigo-300 block mb-1">5. Casa</strong>
            Despesas domésticas e pessoais separadas dos resultados operacionais.
          </div>
        </div>
      </div>
    </div>
  );
}
