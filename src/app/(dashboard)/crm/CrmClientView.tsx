"use client";

import React, { useState } from "react";
import { Users, Phone, Mail, ArrowRight, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

interface CrmClientViewProps {
  initialCustomers: any[];
}

const STAGES = [
  { id: "NOVO_CONTATO", label: "Novo Contato", color: "border-blue-500" },
  { id: "EM_ATENDIMENTO", label: "Em Atendimento", color: "border-indigo-500" },
  { id: "LEVANTAMENTO", label: "Levantamento", color: "border-amber-500" },
  { id: "PROPOSTA_ENVIADA", label: "Proposta Enviada", color: "border-purple-500" },
  { id: "APROVADA", label: "Aprovada / Convertida", color: "border-emerald-500" },
  { id: "PERDIDA", label: "Perdida", color: "border-red-500" },
];

export function CrmClientView({ initialCustomers }: CrmClientViewProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAdvanceStatus = async (customerId: string, nextStatus: string) => {
    setLoadingId(customerId);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(customers.map((c) => (c.id === customerId ? data.customer : c)));
        router.refresh();
      }
    } catch {
      alert("Erro ao atualizar estágio");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visualização de Colunas do Funil */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageCustomers = customers.filter(
            (c) =>
              c.status === stage.id ||
              (stage.id === "APROVADA" && (c.status === "CONVERTIDA" || c.status === "APROVADA"))
          );

          return (
            <div
              key={stage.id}
              className={`bg-white dark:bg-slate-900 border-t-4 ${stage.color} border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm min-w-[200px] flex flex-col justify-between`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {stage.label}
                  </h4>
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-500">
                    {stageCustomers.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {stageCustomers.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs shadow-sm"
                    >
                      <h5 className="font-bold text-slate-900 dark:text-white leading-tight mb-1">
                        {c.name}
                      </h5>
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-md mb-2">
                        {c.interestedIn || "Geral"}
                      </span>

                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>{c.phone}</span>
                        </div>
                      )}

                      {c.notes && (
                        <p className="text-[10px] text-slate-400 line-clamp-2 my-2 italic">
                          "{c.notes}"
                        </p>
                      )}

                      {/* Botão de avanço rápido */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <select
                          value={c.status}
                          disabled={loadingId === c.id}
                          onChange={(e) => handleAdvanceStatus(c.id, e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[10px] rounded-lg px-2 py-1 outline-none text-slate-700 dark:text-slate-300 font-medium"
                        >
                          <option value="NOVO_CONTATO">Mover: Novo Contato</option>
                          <option value="EM_ATENDIMENTO">Mover: Em Atendimento</option>
                          <option value="LEVANTAMENTO">Mover: Levantamento</option>
                          <option value="PROPOSTA_ENVIADA">Mover: Proposta Enviada</option>
                          <option value="APROVADA">Mover: Aprovada</option>
                          <option value="PERDIDA">Mover: Perdida</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
