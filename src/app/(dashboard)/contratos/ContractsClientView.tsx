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
  Search,
  Phone,
  Mail,
  ArrowRight,
  Ban,
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
  const [activeTab, setActiveTab] = useState<"CONTRATOS" | "CLIENTES">("CONTRATOS");
  const [contracts, setContracts] = useState(initialContracts);
  const [customerList, setCustomerList] = useState(customers);
  const [clientSearch, setClientSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [detailsContract, setDetailsContract] = useState<any | null>(null);

  // Cliente Modal State
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [clientForm, setClientForm] = useState({
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
  const [generatingFeeId, setGeneratingFeeId] = useState<string | null>(null);

  // Modal para Gerar Próximos Meses da Mensalidade
  const [feeModalCustomer, setFeeModalCustomer] = useState<any | null>(null);
  const [feeMonthsCount, setFeeMonthsCount] = useState<number>(3);
  const [feeStartOffset, setFeeStartOffset] = useState<number>(0);
  const [isGeneratingFees, setIsGeneratingFees] = useState(false);

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
    if (actionLoading[ct.id]) return;
    if (!confirm(`Deseja EFETIVAR o contrato ${ct.contractNumber}? O status passará para ATIVO e será gerado automaticamente o primeiro título a vencer para o cliente.`)) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [ct.id]: true }));
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
    } finally {
      setActionLoading((prev) => ({ ...prev, [ct.id]: false }));
    }
  };

  const handleInativar = async (ct: any) => {
    if (actionLoading[ct.id]) return;
    if (
      !confirm(
        `Deseja realmente INATIVAR o contrato ${ct.contractNumber}? O status passará para CANCELADO e os títulos a vencer pendentes vinculados serão cancelados.`
      )
    ) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [ct.id]: true }));
    try {
      const res = await fetch("/api/contratos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ct.id,
          action: "inativar",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao inativar contrato");

      setContracts(contracts.map((c) => (c.id === ct.id ? { ...c, status: "CANCELADO" } : c)));
      setFeedback(`Contrato ${ct.contractNumber} inativado com sucesso.`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [ct.id]: false }));
    }
  };

  const handleOpenNewClient = () => {
    setEditingCustomer(null);
    setClientForm({
      name: "",
      documentNumber: "",
      email: "",
      phone: "",
      address: "",
      paymentMethod: "PIX",
      monthlyFee: "250.00",
      billingDay: "10",
      notes: "",
    });
    setShowClientModal(true);
  };

  const handleOpenEditClient = (cust: any) => {
    setEditingCustomer(cust);
    setClientForm({
      name: cust.name || "",
      documentNumber: cust.documentNumber || "",
      email: cust.email || "",
      phone: cust.phone || "",
      address: cust.address || "",
      paymentMethod: cust.paymentMethod || "PIX",
      monthlyFee: String(cust.monthlyFee || 0),
      billingDay: String(cust.billingDay || 10),
      notes: cust.notes || "",
    });
    setShowClientModal(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = !!editingCustomer;
      const res = await fetch("/api/clientes", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCustomer?.id,
          ...clientForm,
          monthlyFee: parseFloat(clientForm.monthlyFee) || 0,
          billingDay: parseInt(clientForm.billingDay, 10) || 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar cliente");

      if (isEdit) {
        setCustomerList(customerList.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
        setFeedback(`Cliente "${data.name}" atualizado com sucesso!`);
      } else {
        setCustomerList([data, ...customerList]);
        setFeedback(`Cliente "${data.name}" cadastrado com sucesso!`);
      }
      setShowClientModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeeModal = (cust: any) => {
    const feeVal = Number(cust.monthlyFee || 0);
    if (feeVal <= 0) {
      alert("Este cliente não possui valor de mensalidade cadastrado.");
      return;
    }
    setFeeModalCustomer(cust);
    setFeeMonthsCount(3);
    setFeeStartOffset(0);
  };

  const handleConfirmGenerateFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeModalCustomer) return;
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
      if (!res.ok) throw new Error(data.error || "Erro ao gerar mensalidades");

      if (data.createdCount > 0) {
        setFeedback(
          `${data.createdCount} mensalidade(s) emitida(s) com sucesso no Contas a Receber para ${feeModalCustomer.name}!${
            data.skippedCount ? ` (${data.skippedCount} já existiam e foram preservadas).` : ""
          }`
        );
      } else {
        setFeedback(`Todas as ${feeMonthsCount} mensalidades selecionadas já estavam geradas no Contas a Receber.`);
      }

      setFeeModalCustomer(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingFees(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-5">
      {/* Abas Unificadas: Contratos e Clientes & Mensalidades (Item 2) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("CONTRATOS")}
          className={`pb-3 px-1 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === "CONTRATOS"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Contratos Emitidos ({contracts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CLIENTES")}
          className={`pb-3 px-1 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === "CLIENTES"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          Clientes & Mensalidades ({customerList.length})
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold uppercase">Fechar</button>
        </div>
      )}

      {/* ABA 1: CONTRATOS */}
      {activeTab === "CONTRATOS" && (
        <div className="space-y-4">
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
                                  : ct.status === "CANCELADO"
                                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              }`}
                            >
                              {ct.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => setDetailsContract(ct)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                              title="Ver Detalhes do Contrato e Títulos"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detalhes</span>
                            </button>

                            {!isAtivo && ct.status !== "CANCELADO" && (
                              <button
                                onClick={() => handleEfetivar(ct)}
                                disabled={actionLoading[ct.id]}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition disabled:opacity-50"
                                title="Efetivar contrato e gerar primeiro título"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>{actionLoading[ct.id] ? "Efetivando..." : "Efetivar"}</span>
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

                            {ct.status !== "CANCELADO" && (
                              <button
                                onClick={() => handleInativar(ct)}
                                disabled={actionLoading[ct.id]}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition disabled:opacity-50"
                                title="Inativar contrato e cancelar títulos a vencer pendentes"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Inativar</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: CLIENTES & MENSALIDADES (Item 2) */}
      {activeTab === "CLIENTES" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cliente por nome ou documento..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={handleOpenNewClient}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              Novo Cliente & Mensalidade
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-5 py-3.5">Contato</th>
                    <th className="px-5 py-3.5 font-bold">Mensalidade Recorrente</th>
                    <th className="px-5 py-3.5">Vencimento</th>
                    <th className="px-5 py-3.5">Forma</th>
                    <th className="px-5 py-3.5">Contratos</th>
                    <th className="px-5 py-3.5 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerList
                    .filter(
                      (c) =>
                        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                        (c.documentNumber && c.documentNumber.includes(clientSearch))
                    )
                    .map((c) => {
                      const fee = Number(c.monthlyFee || 0);
                      const isGenerating = generatingFeeId === c.id;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {c.name}
                            </div>
                            {c.documentNumber && (
                              <div className="text-[11px] text-slate-400">Doc: {c.documentNumber}</div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {c.phone && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                                <Phone className="w-3 h-3 text-emerald-500" />
                                {c.phone}
                              </div>
                            )}
                            {c.email && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {c.email}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 font-black text-slate-900 dark:text-white text-base">
                            {fee > 0 ? (
                              formatBRL(fee)
                            ) : (
                              <span className="text-xs font-normal text-slate-400 italic">Sem mensalidade</span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Dia {c.billingDay || 10}
                            </span>
                            <div className="text-[10px] text-slate-400">de cada mês</div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="px-2 py-0.5 rounded font-semibold text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {c.paymentMethod || "PIX"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              {c.contracts ? c.contracts.length : 0} contrato(s)
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                            {fee > 0 && (
                              <button
                                onClick={() => handleOpenFeeModal(c)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
                                title="Emitir parcelas dos próximos meses no Contas a Receber"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Gerar Próximos Meses</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditClient(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                              title="Editar cliente e valor da mensalidade"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal - Cadastro e Edição de Cliente & Mensalidade (Item 2) */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                {editingCustomer ? `Editar Cliente: ${editingCustomer.name}` : "Novo Cliente & Mensalidade"}
              </h3>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Nome Completo / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    placeholder="Ex: João da Silva / Cassara Corp"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={clientForm.documentNumber}
                    onChange={(e) => setClientForm({ ...clientForm, documentNumber: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    placeholder="cliente@exemplo.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 block">
                  Configuração de Mensalidade Recorrente
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Valor Mensal (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={clientForm.monthlyFee}
                      onChange={(e) => setClientForm({ ...clientForm, monthlyFee: e.target.value })}
                      placeholder="250.00"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-extrabold text-indigo-600"
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
                      value={clientForm.billingDay}
                      onChange={(e) => setClientForm({ ...clientForm, billingDay: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Forma Pagamento
                    </label>
                    <select
                      value={clientForm.paymentMethod}
                      onChange={(e) => setClientForm({ ...clientForm, paymentMethod: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                    >
                      <option value="PIX">PIX</option>
                      <option value="BOLETO">Boleto Bancário</option>
                      <option value="CARTAO">Cartão de Crédito</option>
                      <option value="TRANSFERENCIA">Transferência</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  placeholder="Informações adicionais do cliente ou serviço"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {loading ? "Salvando..." : "Salvar Cliente"}
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
