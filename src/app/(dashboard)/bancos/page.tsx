import React from "react";
import { db } from "@/lib/db";
import { CreditCard, Landmark, Plus, ShieldCheck, Wallet } from "lucide-react";
import { BanksClientView } from "./BanksClientView";

export const dynamic = "force-dynamic";

export default async function BanksAndCardsPage() {
  const [
    bankAccountsRes,
    creditCardsRes,
    companiesRes,
  ] = await Promise.allSettled([
    db.bankAccount.findMany({
      include: {
        company: true,
        creditCards: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.creditCard.findMany({
      include: {
        bankAccount: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.company.findMany(),
  ]);

  const bankAccounts = bankAccountsRes.status === "fulfilled" ? bankAccountsRes.value : [];
  const creditCards = creditCardsRes.status === "fulfilled" ? creditCardsRes.value : [];
  const companies = companiesRes.status === "fulfilled" ? companiesRes.value : [];

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

        <a
          href="/bancos/conciliacao"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition shrink-0"
        >
          <Landmark className="w-4 h-4" />
          Conciliação Bancária em Tela Única
        </a>
      </div>

      <BanksClientView
        initialAccounts={bankAccounts}
        initialCards={creditCards}
        companies={companies}
      />
    </div>
  );
}
