import React from "react";
import { db } from "@/lib/db";
import { CreditCard, Landmark, Plus, ShieldCheck, Wallet } from "lucide-react";
import { BanksClientView } from "./BanksClientView";

export const dynamic = "force-dynamic";

export default async function BanksAndCardsPage() {
  const bankAccounts = await db.bankAccount.findMany({
    include: {
      company: true,
      creditCards: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const creditCards = await db.creditCard.findMany({
    include: {
      bankAccount: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const companies = await db.company.findMany();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            Bancos e Cartões de Crédito
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestão de contas correntes, caixas físicos e cartões com prevenção de duplicidade no pagamento de faturas.
          </p>
        </div>
      </div>

      <BanksClientView
        initialAccounts={bankAccounts}
        initialCards={creditCards}
        companies={companies}
      />
    </div>
  );
}
