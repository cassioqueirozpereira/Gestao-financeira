"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  FileText,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Edit2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  X,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  paymentMethod: string | null;
  monthlyFee: number | null;
  billingDay: number | null;
  notes: string | null;
  contracts: any[];
  accountsReceivable: any[];
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState("TODOS");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    documentNumber: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "PIX",
    monthlyFee: "0",
    billingDay: "10",
    notes: "",
  });

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal para Gerar Próximos Meses da Mensalidade
  const [feeModalCustomer, setFeeModalCustomer] = useState<Customer | null>(null);
  const [feeMonthsCount, setFeeMonthsCount] = useState<number>(3);
  const [feeStartOffset, setFeeStartOffset] = useState<number>(0);
  const [isGeneratingFees, setIsGeneratingFees] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clientes");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Erro ao carregar clientes." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      documentNumber: "",
      email: "",
      phone: "",
      address: "",
      paymentMethod: "PIX",
      monthlyFee: "0",
      billingDay: "10",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      documentNumber: c.documentNumber || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      paymentMethod: c.paymentMethod || "PIX",
      monthlyFee: String(c.monthlyFee || 0),
      billingDay: String(c.billingDay || 10),
      notes: c.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const url = "/api/clientes";
      const method = editingCustomer ? "PUT" : "POST";
      const body = editingCustomer ? { id: editingCustomer.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erro ao salvar cliente.");

      setFeedbackMsg({
        type: "success",
        text: editingCustomer ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!",
      });
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateMonthlyFee = async (customerId: string, clientName: string) => {
    if (!confirm(`Deseja gerar a mensalidade do mês atual para ${clientName}? Ela entrará automaticamente no Contas a Receber.`)) {
      return;
    }

    try {
      setGeneratingId(customerId);
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_monthly_fee",
          customerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar mensalidade.");

      setFeedbackMsg({
        type: "success",
        text: `Mensalidade de ${clientName} gerada com sucesso no Contas a Receber!`,
      });
      fetchCustomers();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message });
    } finally {
      setGeneratingId(null);
    }
  };

  const openFeeModal = (c: Customer) => {
    if (!c.monthlyFee || Number(c.monthlyFee) <= 0) {
      setFeedbackMsg({ type: "error", text: "Este cliente não possui valor de mensalidade cadastrado." });
      return;
    }
    setFeeModalCustomer(c);
    setFeeMonthsCount(3);
    setFeeStartOffset(0);
  };

  const handleConfirmGenerateFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeModalCustomer || isGeneratingFees) return;
    setIsGeneratingFees(true);

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_monthly_fee",
          customerId: feeModalCustomer.id,
          monthsCount: feeMonthsCount,
          startOffset: feeStartOffset,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar mensalidades.");

      if (data.createdCount > 0) {
        setFeedbackMsg({
          type: "success",
          text: `${data.createdCount} mensalidade(s) emitida(s) com sucesso no Contas a Receber para ${feeModalCustomer.name}!${
            data.skippedCount ? ` (${data.skippedCount} já existiam e foram preservadas).` : ""
          }`,
        });
      } else {
        setFeedbackMsg({
          type: "success",
          text: `Todas as ${feeMonthsCount} mensalidades selecionadas já estavam geradas no sistema.`,
        });
      }

      setFeeModalCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message });
    } finally {
      setIsGeneratingFees(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Cálculos de Resumo
  const totalCustomers = customers.length;
  const activeContractsCount = customers.filter(
    (c) => c.contracts && c.contracts.some((k) => k.status === "ATIVO")
  ).length;
  const totalMRR = customers.reduce((sum, c) => sum + Number(c.monthlyFee || 0), 0);

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm));
    const matchPayment = filterPayment === "TODOS" || c.paymentMethod === filterPayment;
    return matchSearch && matchPayment;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Gestão Comercial e Recorrência</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Clientes & Mensalidades Ativas</h2>
          <p className="text-sm text-blue-200 mt-1 max-w-xl">
            Acompanhe contratos ativos, forma de pagamento preferencial e gere cobranças mensais
            recorrentes diretamente para o Contas a Receber com um clique.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all shrink-0 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Alerta de Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            feedbackMsg.type === "success"
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
              : "bg-red-950/60 border-red-800 text-red-300"
          }`}
        >
          <div className="flex items-center gap-3 text-sm">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs uppercase font-bold hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Clientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {totalCustomers}
          </div>
          <p className="text-xs text-slate-500 mt-1">Base cadastrada no ERP</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Contratos Ativos
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {activeContractsCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Clientes com contratos vigentes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Receita Recorrente (MRR)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatBRL(totalMRR)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Potencial mensal de assinaturas</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            Forma de Pagamento:
          </label>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="TODOS">Todas as Formas</option>
            <option value="PIX">PIX</option>
            <option value="BOLETO">Boleto Bancário</option>
            <option value="CARTAO">Cartão de Crédito</option>
            <option value="TRANSFERENCIA">Transferência / TED</option>
          </select>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Cliente & Contatos</th>
                <th className="px-5 py-3.5">Contrato Ativo</th>
                <th className="px-5 py-3.5">Forma de Pagamento</th>
                <th className="px-5 py-3.5">Mensalidade (R$)</th>
                <th className="px-5 py-3.5">Dia Vencimento</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Carregando clientes...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Nenhum cliente encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const activeContract = c.contracts?.find((k) => k.status === "ATIVO");

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <a
                              href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              {c.phone}
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {activeContract ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {activeContract.contractNumber} ({activeContract.title})
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Sem contrato ativo
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {c.paymentMethod || "PIX"}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white">
                        {formatBRL(Number(c.monthlyFee || 0))}
                      </td>

                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          Dia {c.billingDay || 10}
                        </span>{" "}
                        de cada mês
                      </td>

                      <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                        {Number(c.monthlyFee || 0) > 0 && (
                          <button
                            onClick={() => openFeeModal(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                            title="Gerar títulos dos próximos meses da mensalidade no Contas a Receber"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Gerar Próximos Meses</span>
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingCustomer ? "Editar Dados do Cliente" : "Cadastrar Novo Cliente"}
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Nome Completo ou Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    CPF / CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Forma Pagamento
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="CARTAO">Cartão</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Dia Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.billingDay}
                    onChange={(e) => setFormData({ ...formData, billingDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Observações / Escopo do Sistema
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Ex: Assinatura do sistema CassaraTech v2.0 com suporte mensal."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? "Salvando..." : "Salvar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Gerar Próximos Meses da Mensalidade (Item 2) */}
      {feeModalCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Recorrência Financeira
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Gerar Próximos Meses da Mensalidade
                </h3>
              </div>
              <button
                onClick={() => setFeeModalCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmGenerateFees} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <div className="text-xs text-slate-500">Cliente Selecionado:</div>
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {feeModalCustomer.name}
                </div>
                <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <span>
                    Mensalidade:{" "}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {formatBRL(Number(feeModalCustomer.monthlyFee || 0))}
                    </strong>
                  </span>
                  <span>
                    Vencimento: <strong>Dia {feeModalCustomer.billingDay || 10}</strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  A partir de qual mês?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeeStartOffset(0)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                      feeStartOffset === 0
                        ? "bg-indigo-600 border-indigo-600 text-white shadow"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    Mês Atual
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeStartOffset(1)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                      feeStartOffset === 1
                        ? "bg-indigo-600 border-indigo-600 text-white shadow"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    Próximo Mês
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Quantos meses deseja gerar no Contas a Receber?
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFeeMonthsCount(m)}
                      className={`p-2 rounded-xl border text-xs font-bold transition text-center ${
                        feeMonthsCount === m
                          ? "bg-indigo-600 border-indigo-600 text-white shadow"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {m} {m === 1 ? "mês" : "meses"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Ou digite a quantidade:</span>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={feeMonthsCount}
                    onChange={(e) =>
                      setFeeMonthsCount(
                        Math.min(24, Math.max(1, parseInt(e.target.value, 10) || 1))
                      )
                    }
                    className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                  />
                  <span className="text-xs text-slate-500">meses</span>
                </div>
              </div>

              {/* Pré-visualização das parcelas */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Pré-visualização dos títulos a serem criados:
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {Array.from({ length: feeMonthsCount }).map((_, idx) => {
                    const now = new Date();
                    const target = new Date(
                      now.getFullYear(),
                      now.getMonth() + feeStartOffset + idx,
                      1
                    );
                    const mName = target.toLocaleString("pt-BR", { month: "long" });
                    const monthCapitalized =
                      mName.charAt(0).toUpperCase() + mName.slice(1);
                    const year = target.getFullYear();
                    const bDay = feeModalCustomer.billingDay || 10;
                    const maxDays = new Date(year, target.getMonth() + 1, 0).getDate();
                    const actualDay = Math.min(bDay, maxDays);
                    const dueDateStr = `${String(actualDay).padStart(2, "0")}/${String(
                      target.getMonth() + 1
                    ).padStart(2, "0")}/${year}`;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {idx + 1}ª Parcela — {monthCapitalized}/{year}
                        </span>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">
                            Venc: {dueDateStr}
                          </span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {formatBRL(Number(feeModalCustomer.monthlyFee || 0))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Total a programar:</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {formatBRL(
                      Number(feeModalCustomer.monthlyFee || 0) * feeMonthsCount
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isGeneratingFees}
                  onClick={() => setFeeModalCustomer(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingFees}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {isGeneratingFees
                      ? "Gerando Títulos..."
                      : `Confirmar e Gerar ${feeMonthsCount} Meses`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
