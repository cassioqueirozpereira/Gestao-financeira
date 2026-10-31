"use client";

import React, { useState } from "react";
import {
  Layers,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  X,
  MessageCircle,
  ExternalLink,
  DollarSign,
  FileText,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CrmClientViewProps {
  initialCustomers: any[];
}

const STAGES = [
  { id: "NOVO_CONTATO", title: "Novos Leads", color: "border-blue-500 text-blue-500 bg-blue-500/10" },
  { id: "EM_ATENDIMENTO", title: "Em Atendimento", color: "border-indigo-500 text-indigo-500 bg-indigo-500/10" },
  { id: "PROPOSTA_ENVIADA", title: "Proposta Enviada", color: "border-purple-500 text-purple-500 bg-purple-500/10" },
  { id: "NEGOCIACAO", title: "Em Negociação", color: "border-amber-500 text-amber-500 bg-amber-500/10" },
  { id: "CONVERTIDA", title: "Ganhos / Fechados", color: "border-emerald-500 text-emerald-500 bg-emerald-500/10" },
];

export function CrmClientView({ initialCustomers }: CrmClientViewProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states - Novo Lead
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    phone: "",
    email: "",
    interestedIn: "Sistemas",
    estimatedBudget: "1500",
    notes: "",
  });

  const [leadNotes, setLeadNotes] = useState("");

  const handleOpenLead = (c: any) => {
    setSelectedLead(c);
    setLeadNotes(c.notes || "");
  };

  const handleAdvanceStatus = async (newStatus: string) => {
    if (!selectedLead) return;
    setLoading(true);

    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "advance_status",
          customerId: selectedLead.id,
          status: newStatus,
          notes: leadNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar status");

      setCustomers(
        customers.map((c) =>
          c.id === selectedLead.id ? { ...c, status: newStatus, notes: leadNotes } : c
        )
      );
      setSelectedLead({ ...selectedLead, status: newStatus, notes: leadNotes });
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeadForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar lead");

      setCustomers([data.customer, ...customers]);
      setShowNewLeadModal(false);
      setNewLeadForm({
        name: "",
        phone: "",
        email: "",
        interestedIn: "Sistemas",
        estimatedBudget: "1500",
        notes: "",
      });
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-indigo-900/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Funil de CRM & Oportunidades</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Clique em qualquer lead para abrir o modal de atendimento, enviar mensagem e avançar as etapas.
          </p>
        </div>
        <button
          onClick={() => setShowNewLeadModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Lead / Oportunidade
        </button>
      </div>

      {/* Kanban Funil */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageCustomers = customers.filter(
            (c) => c.status === stage.id
          );

          return (
            <div
              key={stage.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-col min-w-[220px]"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${stage.color}`}>
                  {stage.title}
                </span>
                <span className="text-xs font-bold text-slate-400">{stageCustomers.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {stageCustomers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    Nenhum lead nesta etapa
                  </div>
                ) : (
                  stageCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleOpenLead(c)}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl cursor-pointer transition shadow-sm hover:border-indigo-500/50 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                          {c.name}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                          {c.interestedIn || "Geral"}
                        </span>
                      </div>

                      {c.phone && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          {c.phone}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                          Abrir Ações &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal - Próximos Passos & Detalhes do Lead [Item 10] */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Etapa Atual: {selectedLead.status}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedLead.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contatos com Link WhatsApp */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Telefone / WhatsApp</span>
                {selectedLead.phone ? (
                  <a
                    href={`https://wa.me/55${selectedLead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Olá ${selectedLead.name}, tudo bem? Aqui é da equipe CassaraTech / D.A. Com Carinho referente ao seu interesse em ${selectedLead.interestedIn || "nossos serviços"}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5 hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {selectedLead.phone}
                  </a>
                ) : (
                  <span className="font-semibold text-slate-500">Não informado</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Área de Interesse</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedLead.interestedIn || "Sistemas"}
                </span>
              </div>
            </div>

            {/* Observações / Histórico de Contato */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Histórico de Negociação / Próximos Passos
              </label>
              <textarea
                rows={3}
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                placeholder="Ex: Cliente solicitou proposta comercial até sexta-feira com suporte incluso."
              />
            </div>

            {/* Barra de Ações: Avançar Etapa */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Avançar Etapa do Lead:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleAdvanceStatus("EM_ATENDIMENTO")}
                  className="px-2.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100"
                >
                  Em Atendimento
                </button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStatus("PROPOSTA_ENVIADA")}
                  className="px-2.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold hover:bg-purple-100"
                >
                  Proposta Enviada
                </button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStatus("NEGOCIACAO")}
                  className="px-2.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-100"
                >
                  Negociação
                </button>
                <button
                  type="button"
                  onClick={() => handleAdvanceStatus("CONVERTIDA")}
                  className="px-2.5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-sm"
                >
                  Ganho / Fechado!
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => handleAdvanceStatus(selectedLead.status)}
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Salvar Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Novo Lead */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Adicionar Novo Lead no CRM
            </h3>
            <form onSubmit={handleCreateLead} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Nome do Lead / Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Ex: Barbearia Estilo & Corte"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Interesse Principal
                  </label>
                  <select
                    value={newLeadForm.interestedIn}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, interestedIn: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Sistemas">Sistemas — CassaraTech</option>
                    <option value="Velas">Velas — D.A. Com Carinho</option>
                    <option value="Resinas">Resinas — D.A. Com Carinho</option>
                    <option value="Mídia Social">Mídia Social & Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Orçamento Estimado (R$)
                  </label>
                  <input
                    type="number"
                    value={newLeadForm.estimatedBudget}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedBudget: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Detalhes da Necessidade
                </label>
                <textarea
                  rows={2}
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Ex: Precisa de um software de agendamento e PDV."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
