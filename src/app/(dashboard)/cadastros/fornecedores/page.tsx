import React from "react";
import { db } from "@/lib/db";
import { Truck } from "lucide-react";
import { FornecedoresClientView } from "./FornecedoresClientView";

export const dynamic = "force-dynamic";

export default async function FornecedoresPage() {
  let suppliers: any[] = [];

  try {
    suppliers = await db.supplier.findMany({
      include: {
        _count: {
          select: {
            accountsPayable: true,
            rawMaterials: true,
            packagings: true,
            purchases: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Erro ao carregar fornecedores:", error);
  }

  const serializedSuppliers = suppliers.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            Cadastro de Fornecedores
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestão centralizada de parceiros comerciais para suprimentos, embalagens e despesas financeiras.
          </p>
        </div>
      </div>

      <FornecedoresClientView initialSuppliers={serializedSuppliers} />
    </div>
  );
}
