import React from "react";
import Link from "next/link";
import {
  FolderTree,
  Truck,
  ListTree,
  Coins,
  ArrowRight,
  Database,
  Building2,
  Layers,
} from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CadastrosHubPage() {
  const [
    catCountRes,
    suppCountRes,
    accCountRes,
    rawCountRes,
    packCountRes,
  ] = await Promise.allSettled([
    db.category.count(),
    db.supplier.count(),
    db.chartOfAccount.count(),
    db.rawMaterial.count(),
    db.packaging.count(),
  ]);

  const categoriesCount = catCountRes.status === "fulfilled" ? catCountRes.value : 0;
  const suppliersCount = suppCountRes.status === "fulfilled" ? suppCountRes.value : 0;
  const accountsCount = accCountRes.status === "fulfilled" ? accCountRes.value : 0;
  const rawMaterialsCount = rawCountRes.status === "fulfilled" ? rawCountRes.value : 0;
  const packagingsCount = packCountRes.status === "fulfilled" ? packCountRes.value : 0;

  const sections = [
    {
      title: "Fornecedores",
      description: "Cadastro centralizado de fornecedores de matéria-prima, embalagens, equipamentos e prestadores de serviços.",
      href: "/cadastros/fornecedores",
      icon: Truck,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900",
      stats: `${suppliersCount} fornecedores cadastrados`,
    },
    {
      title: "Categorias Oficiais",
      description: "Categorias padronizadas de produtos para organização do catálogo, relatórios de vendas e controle de estoque.",
      href: "/cadastros/categorias",
      icon: FolderTree,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900",
      stats: `${categoriesCount} categorias oficiais`,
    },
    {
      title: "Plano de Contas",
      description: "Estrutura hierárquica contábil e gerencial (receitas, custos diretos/indiretos, despesas administrativas e aportes).",
      href: "/plano-contas",
      icon: ListTree,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900",
      stats: `${accountsCount} contas contábeis`,
    },
    {
      title: "Controle de Custos",
      description: "Evolução dos custos unitários de matérias-primas e embalagens, com monitoramento de margem bruta por produto.",
      href: "/cadastros/custos",
      icon: Coins,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900",
      stats: `${rawMaterialsCount + packagingsCount} insumos/embalagens monitorados`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-600" />
          Central de Cadastros Auxiliares
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gerenciamento compartilhado de dados mestres utilizados em compras, financeiro, produção e vendas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${sec.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {sec.stats}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {sec.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {sec.description}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Acessar Módulo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
