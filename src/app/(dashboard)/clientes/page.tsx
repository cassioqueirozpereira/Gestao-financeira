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
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

                      <td className="px-5 py-4 text-right space-x-2">
                        {Number(c.monthlyFee || 0) > 0 && (
                          <button
                            onClick={() => handleGenerateMonthlyFee(c.id, c.name)}
                            disabled={generatingId === c.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all disabled:opacity-50"
                            title="Lança a fatura do mês atual no Contas a Receber"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {generatingId === c.id ? "Gerando..." : "Gerar Mensalidade"}
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
