import React from "react";
import { db } from "@/lib/db";
import { Flame, Plus, ShieldAlert, Clock, Sparkles } from "lucide-react";
import { ProductionClientView } from "./ProductionClientView";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  let productionOrders: any[] = [];
  try {
    productionOrders = await db.productionOrder.findMany({
      orderBy: { productionDate: "desc" },
    });
  } catch (e) {
    console.error("Erro ao carregar ordens de produção:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            Produção, Lotes e Custos — D.A. Com Carinho
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento de custos de fabricação (matéria-prima, gás, energia elétrica e mão de obra) e histórico de lotes.
          </p>
        </div>
      </div>

      <ProductionClientView initialOrders={productionOrders} />
    </div>
  );
}
