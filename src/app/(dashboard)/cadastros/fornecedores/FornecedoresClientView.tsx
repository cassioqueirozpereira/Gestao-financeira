"use client";

import React, { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Power,
  Phone,
  Mail,
  MapPin,
  X,
  AlertCircle,
  Building2,
  FileText,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SupplierItem {
  id: string;
  name: string;
  tradeName: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    accountsPayable: number;
    rawMaterials: number;
    packagings: number;
    purchases: number;
  };
}

interface FornecedoresClientViewProps {
  initialSuppliers: SupplierItem[];
}

export function FornecedoresClientView({ initialSuppliers }: FornecedoresClientViewProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(initialSuppliers);
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "ATIVOS" | "INATIVOS">("ATIVOS");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formTradeName, setFormTradeName] = useState("");
  const [formDocument, setFormDocument] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCategory, setFormCategory] = useState("MATERIA_PRIMA");
  const [formNotes, setFormNotes] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormName("");
    setFormTradeName("");
    setFormDocument("");
    setFormEmail("");
    setFormPhone("");
    setFormAddress("");
    setFormCategory("MATERIA_PRIMA");
    setFormNotes("");
    setFormIsActive(true);
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEditModal = (sup: SupplierItem) => {
    setEditingSupplier(sup);
    setFormName(sup.name);
    setFormTradeName(sup.tradeName || "");
    setFormDocument(sup.documentNumber || "");
    setFormEmail(sup.email || "");
    setFormPhone(sup.phone || "");
    setFormAddress(sup.address || "");
    setFormCategory(sup.category || "MATERIA_PRIMA");
    setFormNotes(sup.notes || "");
    setFormIsActive(sup.isActive);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg("A razão social / nome do fornecedor é obrigatório.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const url = "/api/fornecedores";
      const method = editingSupplier ? "PUT" : "POST";
      const payload: any = {
        name: formName.trim(),
        tradeName: formTradeName.trim() || null,
        documentNumber: formDocument.trim() || null,
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        address: formAddress.trim() || null,
        category: formCategory.trim() || null,
        notes: formNotes.trim() || null,
        isActive: formIsActive,
      };

      if (editingSupplier) {
        payload.id = editingSupplier.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar fornecedor");

      if (editingSupplier) {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingSupplier.id ? { ...s, ...data.supplier } : s))
        );
      } else {
        setSuppliers((prev) => [...prev, data.supplier].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (sup: SupplierItem) => {
    const action = sup.isActive ? "inativar" : "reativar";
    if (!confirm(`Deseja realmente ${action} o fornecedor "${sup.name}"?`)) return;

    setActionLoading((prev) => ({ ...prev, [sup.id]: true }));
    try {
      const res = await fetch("/api/fornecedores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sup.id,
          isActive: !sup.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ao ${action} fornecedor`);

      setSuppliers((prev) =>
        prev.map((s) => (s.id === sup.id ? { ...s, isActive: !s.isActive } : s))
      );
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [sup.id]: false }));
    }
  };

  const handleDelete = async (sup: SupplierItem) => {
    if (!confirm(`Deseja realmente excluir permanentemente o fornecedor "${sup.name}"?`)) return;

    setActionLoading((prev) => ({ ...prev, [sup.id]: true }));
    try {
      const res = await fetch(`/api/fornecedores?id=${sup.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir fornecedor");

      setSuppliers((prev) => prev.filter((s) => s.id !== sup.id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [sup.id]: false }));
    }
  };

  const filtered = suppliers.filter((sup) => {
    if (filterStatus === "ATIVOS" && !sup.isActive) return false;
    if (filterStatus === "INATIVOS" && sup.isActive) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = sup.name.toLowerCase().includes(q);
      const matchTrade = sup.tradeName?.toLowerCase().includes(q);
      const matchDoc = sup.documentNumber?.toLowerCase().includes(q);
      const matchCat = sup.category?.toLowerCase().includes(q);
      return matchName || matchTrade || matchDoc || matchCat;
    }
    return true;
  });

  const totalAtivos = suppliers.filter((s) => s.isActive).length;
  const totalInativos = suppliers.filter((s) => !s.isActive).length;
  const totalComContas = suppliers.filter((s) => (s._count?.accountsPayable || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Fornecedores</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{suppliers.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Parceiros e fornecedores comerciais</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Fornecedores Ativos</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalAtivos}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Habilitados para compras e despesas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Inativos (Histórico)</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{totalInativos}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Preservados para conciliação e DRE</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Com Contas a Pagar</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{totalComContas}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Histórico financeiro vinculado</p>
        </div>
      </div>

      {/* Controles e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, razão, CNPJ/CPF ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(["ATIVOS", "INATIVOS", "TODOS"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterStatus === st
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {st === "ATIVOS" ? `Ativos (${totalAtivos})` : st === "INATIVOS" ? `Inativos (${totalInativos})` : `Todos (${suppliers.length})`}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Fornecedor
        </button>
      </div>

      {/* Tabela de Fornecedores */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Razão / Nome Fantasia</th>
                <th className="px-6 py-4">CNPJ / CPF</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-center">Vínculos</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Nenhum fornecedor encontrado para o filtro aplicado.
                  </td>
                </tr>
              ) : (
                filtered.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{sup.name}</span>
                      </div>
                      {sup.tradeName && (
                        <p className="text-xs text-slate-500 pl-6">Fantasia: {sup.tradeName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {sup.documentNumber || <span className="text-slate-400 italic">Não informado</span>}
                    </td>
                    <td className="px-6 py-4 text-xs space-y-0.5">
                      {sup.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sup.phone}</span>
                        </div>
                      )}
                      {sup.email && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[180px]">{sup.email}</span>
                        </div>
                      )}
                      {!sup.phone && !sup.email && (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sup.category || "Geral"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
                        <span title="Contas a Pagar" className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                          {sup._count?.accountsPayable || 0} tit.
                        </span>
                        <span title="Insumos / Embalagens" className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                          {(sup._count?.rawMaterials || 0) + (sup._count?.packagings || 0)} itens
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sup.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                          <XCircle className="w-3 h-3" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(sup)}
                          title="Editar Dados"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(sup)}
                          disabled={actionLoading[sup.id]}
                          title={sup.isActive ? "Inativar Fornecedor" : "Reativar Fornecedor"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            sup.isActive
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          <Power className={`w-4 h-4 ${actionLoading[sup.id] ? "animate-spin" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(sup)}
                          disabled={actionLoading[sup.id]}
                          title="Excluir Fornecedor (se sem movimentações)"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Fornecedor */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {editingSupplier ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Razão Social / Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ceraria Nacional Ltda"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ceras Brasil"
                    value={formTradeName}
                    onChange={(e) => setFormTradeName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 00.000.000/0001-00"
                    value={formDocument}
                    onChange={(e) => setFormDocument(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    placeholder="Ex: pedidos@cerasbrasil.com.br"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Segmento / Categoria de Fornecimento
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="MATERIA_PRIMA">Matéria-Prima (Ceras, Resinas, Pavios, Essências)</option>
                    <option value="EMBALAGENS">Embalagens (Copos, Potes, Caixas, Rótulos, Sacolas)</option>
                    <option value="SERVICOS">Prestador de Serviços / Tecnologia / Marketing</option>
                    <option value="EQUIPAMENTOS">Máquinas, Moldes e Equipamentos</option>
                    <option value="UTILIDADES">Energia, Gás, Internet e Despesas Operacionais</option>
                    <option value="OUTROS">Outros Fornecedores</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações e Condições Comerciais (Chave PIX, Prazos de Pagamento)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Pagamento 50% antecipado e 50% contra entrega. Chave PIX: financeiro@..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="supIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="supIsActive" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <strong className="block font-medium">Fornecedor Ativo</strong>
                  <span className="text-[11px] text-slate-500">Fornecedores inativos são preservados em lançamentos anteriores mas não aparecem em novas compras.</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : editingSupplier ? "Atualizar Fornecedor" : "Salvar Fornecedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
