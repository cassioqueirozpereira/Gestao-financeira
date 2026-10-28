"use client";

import React, { useState } from "react";
import {
  FolderTree,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Package,
  X,
  AlertCircle,
  Tag,
  Power,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CategoryItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

interface CategoriasClientViewProps {
  initialCategories: CategoryItem[];
}

export function CategoriasClientView({ initialCategories }: CategoriasClientViewProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [filterStatus, setFilterStatus] = useState<"TODAS" | "ATIVAS" | "INATIVAS">("ATIVAS");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setFormIsActive(true);
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormCode(cat.code || "");
    setFormDescription(cat.description || "");
    setFormIsActive(cat.isActive);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg("O nome da categoria é obrigatório.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const url = "/api/cadastros/categorias";
      const method = editingCategory ? "PUT" : "POST";
      const payload: any = {
        name: formName.trim(),
        code: formCode.trim() || null,
        description: formDescription.trim() || null,
        isActive: formIsActive,
      };

      if (editingCategory) {
        payload.id = editingCategory.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar categoria");
      }

      if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...data.category } : c))
        );
      } else {
        setCategories((prev) => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (cat: CategoryItem) => {
    const action = cat.isActive ? "inativar" : "reativar";
    if (!confirm(`Deseja realmente ${action} a categoria "${cat.name}"?`)) return;

    setActionLoading((prev) => ({ ...prev, [cat.id]: true }));
    try {
      const res = await fetch("/api/cadastros/categorias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cat.id,
          isActive: !cat.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ao ${action} categoria`);

      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      );
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [cat.id]: false }));
    }
  };

  // Filtragem
  const filtered = categories.filter((cat) => {
    if (filterStatus === "ATIVAS" && !cat.isActive) return false;
    if (filterStatus === "INATIVAS" && cat.isActive) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = cat.name.toLowerCase().includes(q);
      const matchCode = cat.code?.toLowerCase().includes(q);
      const matchDesc = cat.description?.toLowerCase().includes(q);
      return matchName || matchCode || matchDesc;
    }
    return true;
  });

  const totalAtivas = categories.filter((c) => c.isActive).length;
  const totalInativas = categories.filter((c) => !c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Cards Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Cadastrado</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{categories.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Categorias oficiais registradas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Ativas p/ Seleção</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalAtivas}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Disponíveis em novos produtos</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Inativas (Histórico)</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{totalInativas}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Preservadas para relatórios</p>
        </div>
      </div>

      {/* Controles de Busca e Botão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, código ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(["ATIVAS", "INATIVAS", "TODAS"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterStatus === st
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {st === "ATIVAS" ? `Ativas (${totalAtivas})` : st === "INATIVAS" ? `Inativas (${totalInativas})` : `Todas (${categories.length})`}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria Oficial
        </button>
      </div>

      {/* Tabela de Categorias */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Nome da Categoria</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4 text-center">Produtos Vinculados</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhuma categoria encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      {cat.code ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {cat.code}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-500 shrink-0" />
                      {cat.name}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {cat.description || <span className="text-slate-400 italic">Sem descrição</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        <Package className="w-3.5 h-3.5" />
                        {cat._count?.products || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cat.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                          <XCircle className="w-3 h-3" />
                          Inativa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          title="Editar Categoria"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(cat)}
                          disabled={actionLoading[cat.id]}
                          title={cat.isActive ? "Inativar Categoria" : "Reativar Categoria"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            cat.isActive
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          <Power className={`w-4 h-4 ${actionLoading[cat.id] ? "animate-spin" : ""}`} />
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

      {/* Modal Criar / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {editingCategory ? "Editar Categoria Oficial" : "Nova Categoria Oficial"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Velas Aromáticas em Copo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Código Identificador Oficial (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: CAT-VEL-01"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Descrição Padronizada
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva o propósito e as especificações desta categoria oficial..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="catIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="catIsActive" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <strong className="block font-medium">Categoria Ativa</strong>
                  <span className="text-[11px] text-slate-500">Categorias inativas ficam ocultas em novos cadastros mas preservam o histórico.</span>
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
                  {saving ? "Salvando..." : editingCategory ? "Atualizar Categoria" : "Salvar Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
