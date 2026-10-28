import React from "react";
import { db } from "@/lib/db";
import { FolderTree } from "lucide-react";
import { CategoriasClientView } from "./CategoriasClientView";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  let categories: any[] = [];

  try {
    categories = await db.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Erro ao carregar categorias oficiais:", error);
  }

  // Serializa campos de data
  const serializedCategories = categories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-indigo-600" />
            Categorias Oficiais de Produtos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cadastro centralizado e padronizado de categorias para organização do catálogo de produtos.
          </p>
        </div>
      </div>

      <CategoriasClientView initialCategories={serializedCategories} />
    </div>
  );
}
