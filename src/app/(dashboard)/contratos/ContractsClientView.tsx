"use client";

import React, { useState } from "react";
import {
  Plus,
  X,
  FileText,
  Printer,
  CheckCircle,
  Clock,
  Edit2,
  CheckSquare,
  DollarSign,
  CreditCard,
  Building2,
  Users,
  Eye,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ContractsClientViewProps {
  initialContracts: any[];
  companies: any[];
  customers: any[];
}

export function ContractsClientView({
  initialContracts,
  companies,
  customers,
}: ContractsClientViewProps) {
  const router = useRouter();
  const [contracts, setContracts] = useState(initialContracts);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [detailsContract, setDetailsContract] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states - Criação
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [contractType, setContractType] = useState("CASSARATECH_SUPORTE_MANUTENCAO");
  const [title, setTitle] = useState("Contrato de Prestação de Serviços de Tecnologia e Suporte");
  const [totalAmount, setTotalAmount] = useState("1500.00");
  const [monthlyFee, setMonthlyFee] = useState("250.00");
  const [installationFee, setInstallationFee] = useState("500.00");
  const [paymentMethod, setPaymentMethod] = useState("BOLETO");
  const [billingDay, setBillingDay] = useState("10");
  const [scope, setScope] = useState(
    "Prestação de serviços contínuos de suporte técnico, manutenção preventiva, hospedagem e atualizações de segurança para a infraestrutura de sistemas."
  );

  // Form states - Edição
  const [editForm, setEditForm] = useState({
    title: "",
    totalAmount: "",
    monthlyFee: "",
    installationFee: "",
    paymentMethod: "BOLETO",
    billingDay: "10",
    scope: "",
    status: "RASCUNHO",
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          customerId,
          type: contractType,
          title,
          totalAmount: parseFloat(totalAmount),
          monthlyFee: parseFloat(monthlyFee),
          installationFee: parseFloat(installationFee),
          paymentMethod,
          billingDay: parseInt(billingDay, 10),
          scope,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao emitir contrato");

      setContracts([data.contract, ...contracts]);
      setShowModal(false);
      setFeedback("Contrato emitido e registrado no ERP com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (ct: any) => {
    setEditingContract(ct);
    setEditForm({
      title: ct.title,
      totalAmount: String(ct.totalAmount),
      monthlyFee: String(ct.monthlyFee || 0),
      installationFee: String(ct.installationFee || 0),
      paymentMethod: ct.paymentMethod || "BOLETO",
      billingDay: String(ct.billingDay || 10),
      scope: ct.scope,
      status: ct.status,
    });
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contratos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingContract.id,
          action: "edit",
          ...editForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações");

      setContracts(contracts.map((c) => (c.id === editingContract.id ? { ...c, ...data.contract } : c)));
      setEditingContract(null);
      setFeedback("Contrato atualizado com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEfetivar = async (ct: any) => {
    if (!confirm(`Deseja EFETIVAR o contrato ${ct.contractNumber}? O status passará para ATIVO e será gerado automaticamente o primeiro título a vencer para o cliente.`)) {
      return;
    }

    try {
      const res = await fetch("/api/contratos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ct.id,
          action: "efetivar",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao efetivar contrato");

      setContracts(contracts.map((c) => (c.id === ct.id ? { ...c, status: "ATIVO" } : c)));
      setFeedback(`Contrato ${ct.contractNumber} efetivado com sucesso! Título financeiro gerado.`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-5">
      {/* Top Action */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Total de Contratos: {contracts.length}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Gerar Novo Contrato
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold uppercase">Fechar</button>
        </div>
      )}

      {/* Lista de Contratos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Número & Título</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Forma & Dia</th>
                <th className="px-5 py-3.5">Mensalidade</th>
                <th className="px-5 py-3.5">Valor Global</th>
                <th className="px-5 py-3.5">Situação</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Nenhum contrato gerado ainda. Clique em "Gerar Novo Contrato" para começar.
                  </td>
                </tr>
              ) : (
                contracts.map((ct) => {
                  const isAtivo = ct.status === "ATIVO";

                  return (
                    <tr
                      key={ct.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          {ct.contractNumber}
                        </div>
                        <div className="text-slate-800 dark:text-slate-200 font-medium text-xs mt-0.5">
                          {ct.title}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {ct.customer?.name || "Cliente Não Informado"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {ct.company?.name || "Empresa"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded font-semibold text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {ct.paymentMethod || "BOLETO"}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Vence todo dia {ct.billingDay || 10}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                        {ct.monthlyFee ? formatBRL(Number(ct.monthlyFee)) : "—"}
                      </td>

                      <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white">
                        {formatBRL(Number(ct.totalAmount))}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isAtivo
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                          }`}
                        >
                          {ct.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => setDetailsContract(ct)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                          title="Ver Detalhes do Contrato e Títulos"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detalhes</span>
                        </button>

                        {!isAtivo && (
                          <button
                            onClick={() => handleEfetivar(ct)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                            title="Efetivar contrato e gerar primeiro título"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Efetivar</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(ct)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                          title="Editar contrato após o lançamento"
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

      {/* Modal - Geração de Contrato */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Emitir Novo Contrato Automático
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Empresa Emissora *
                  </label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Cliente Contratante *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {customers.map((cu) => (
                      <option key={cu.id} value={cu.id}>{cu.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Título do Contrato *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Taxa Instalação (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={installationFee}
                    onChange={(e) => setInstallationFee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Valor Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO">Cartão de Crédito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Dia de Vencimento Mensal
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={billingDay}
                    onChange={(e) => setBillingDay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Escopo dos Serviços / Entregáveis
                </label>
                <textarea
                  rows={3}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar e Emitir Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Edição do Contrato [Item 8] */}
      {editingContract && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Editar Contrato {editingContract.contractNumber}
            </h3>
            <form onSubmit={handleConfirmEdit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Título do Contrato
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Taxa Instalação (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.installationFee}
                    onChange={(e) => setEditForm({ ...editForm, installationFee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.monthlyFee}
                    onChange={(e) => setEditForm({ ...editForm, monthlyFee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Valor Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.totalAmount}
                    onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={editForm.paymentMethod}
                    onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO">Cartão de Crédito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Dia Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editForm.billingDay}
                    onChange={(e) => setEditForm({ ...editForm, billingDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Escopo do Contrato
                </label>
                <textarea
                  rows={3}
                  value={editForm.scope}
                  onChange={(e) => setEditForm({ ...editForm, scope: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingContract(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Edição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Detalhes Completos do Contrato [Item 13] */}
      {detailsContract && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Detalhamento Contratual & Títulos a Vencer
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {detailsContract.title} ({detailsContract.contractNumber})
                </h3>
              </div>
              <button
                onClick={() => setDetailsContract(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Cliente Contratante</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {detailsContract.customer?.name}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Forma de Pagamento</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {detailsContract.paymentMethod || "BOLETO"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Mensalidade Recorrente</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {detailsContract.monthlyFee ? formatBRL(Number(detailsContract.monthlyFee)) : "—"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Dia de Vencimento</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Dia {detailsContract.billingDay || 10}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Escopo dos Serviços Contratados
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                {detailsContract.scope}
              </p>
            </div>

            {/* Títulos / Boletos Gerados do Contrato */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Títulos Financeiros & Parcelas Geradas
              </span>
              {detailsContract.receivables && detailsContract.receivables.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Título</th>
                        <th className="p-2.5">Vencimento</th>
                        <th className="p-2.5">Valor</th>
                        <th className="p-2.5">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {detailsContract.receivables.map((r: any) => (
                        <tr key={r.id}>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                            {r.description}
                          </td>
                          <td className="p-2.5 text-slate-500">
                            {new Date(r.dueDate).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-2.5 font-bold">
                            {formatBRL(Number(r.originalAmount))}
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                  Nenhum título gerado ainda para este contrato. Clique em "Efetivar" para gerar a primeira parcela.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailsContract(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
