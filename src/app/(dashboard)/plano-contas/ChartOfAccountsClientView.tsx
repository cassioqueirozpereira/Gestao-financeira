"use client";

import React, { useState } from "react";
import {
  ListTree,
  Plus,
  Edit2,
  ShieldAlert,
  X,
  CheckCircle2,
  Search,
  Power,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ChartOfAccountsClientViewProps {
  initialAccounts: any[];
}

export function ChartOfAccountsClientView({ initialAccounts }: ChartOfAccountsClientViewProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>(initialAccounts);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ATIVAS" | "INATIVAS" | "TODAS">("ATIVAS");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "RECEITA_OPERACIONAL",
    parentId: "",
    isActive: true,
  });

  const typeLabels: Record<string, { label: string; color: string }> = {
    RECEITA_OPERACIONAL: { label: "Receita Operacional", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
    CUSTO_DIRETO: { label: "Custo Direto", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40" },
    CUSTO_INDIRETO: { label: "Custo Indireto", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
    DESPESA_ADMINISTRATIVA: { label: "Despesa Administrativa", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" },
    DESPESA_COMERCIAL_MARKETING: { label: "Comercial / Mídia", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" },
    INVESTIMENTO_ATIVO: { label: "Investimento / Ativo", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
    APORTE_CAPITAL: { label: "Aporte de Capital (Não-Receita)", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40" },
    TRANSFERENCIA_INTERNA: { label: "Transferência Interna (Neutro)", color: "text-slate-600 bg-slate-100 dark:bg-slate-800" },
    APLICACAO_RESGATE: { label: "Aplicação / Resgate", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" },
  };

  const handleOpenNew = () => {
    setEditingAccount(null);
    setForm({
      code: "",
      name: "",
      type: "RECEITA_OPERACIONAL",
      parentId: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccount(acc);
    setForm({
      code: acc.code || "",
      name: acc.name || "",
      type: acc.type || "RECEITA_OPERACIONAL",
      parentId: acc.parentId || "",
      isActive: acc.isActive !== undefined ? acc.isActive : true,
    });
    setShowModal(true);
  };

  const toggleStatus = async (acc: any) => {
    const action = acc.isActive ? "inativar" : "reativar";
    if (!confirm(`Deseja realmente ${action} a conta "${acc.code} - ${acc.name}"?`)) return;

    setActionLoading((prev) => ({ ...prev, [acc.id]: true }));
    try {
      const res = await fetch("/api/plano-contas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: acc.id,
          isActive: !acc.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ao ${action} conta`);

      setAccounts((prev) =>
        prev.map((a) => (a.id === acc.id ? { ...a, isActive: !a.isActive } : a))
      );
      setFeedback(`Conta "${acc.code} - ${acc.name}" foi ${action === "inativar" ? "inativada" : "reativada"} com sucesso!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [acc.id]: false }));
    }
  };

  const handleDelete = async (acc: any) => {
    if (!confirm(`Deseja realmente excluir a conta contábil "${acc.code} - ${acc.name}"?`)) return;

    setActionLoading((prev) => ({ ...prev, [acc.id]: true }));
    try {
      const res = await fetch(`/api/plano-contas?id=${acc.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir conta");

      setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
      setFeedback(`Conta "${acc.code} - ${acc.name}" excluída com sucesso!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [acc.id]: false }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = !!editingAccount;
      const res = await fetch("/api/plano-contas", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAccount?.id,
          ...form,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar conta contábil");

      if (isEdit) {
        setAccounts(
          accounts.map((a) => (a.id === data.account.id ? data.account : a)).sort((a, b) => a.code.localeCompare(b.code))
        );
        setFeedback(`Conta "${data.account.code} - ${data.account.name}" atualizada com sucesso!`);
      } else {
        setAccounts([...accounts, data.account].sort((a, b) => a.code.localeCompare(b.code)));
        setFeedback(`Conta "${data.account.code} - ${data.account.name}" cadastrada com sucesso!`);
      }
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (filterStatus === "ATIVAS" && acc.isActive === false) return false;
    if (filterStatus === "INATIVAS" && acc.isActive !== false) return false;
    if (searchTerm.trim()) {
      return (
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.code.includes(searchTerm)
      );
    }
    return true;
  });

  const totalAtivas = accounts.filter((a) => a.isActive !== false).length;
  const totalInativas = accounts.filter((a) => a.isActive === false).length;

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold uppercase">Fechar</button>
        </div>
      )}

      {/* Regra de Ouro Contábil */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div className="text-xs space-y-1">
          <h2 className="font-bold text-sm text-slate-200">Regras de Validação Gerencial:</h2>
          <p className="text-slate-400">
            • Aportes de capital e transferências entre contas próprias nunca são classificados como receita operacional.
          </p>
          <p className="text-slate-400">
            • Compras de matéria-prima para estoque não são confundidas com consumo direto na produção.
          </p>
        </div>
      </div>

      {/* Barra de Ações & Filtro */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
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
                {st === "ATIVAS" ? `Ativas (${totalAtivas})` : st === "INATIVAS" ? `Inativas (${totalInativas})` : `Todas (${accounts.length})`}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Conta Contábil
        </button>
      </div>

      {/* Lista da Árvore */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>Código & Descrição da Conta</span>
          <div className="flex items-center gap-8">
            <span>Natureza Contábil</span>
            <span className="w-24 text-right">Ações</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredAccounts.map((acc) => {
            const badge = typeLabels[acc.type] || {
              label: acc.type,
              color: "text-slate-600 bg-slate-100",
            };
            const paddingLeft =
              acc.level === 1 ? "pl-4" : acc.level === 2 ? "pl-9" : acc.level === 3 ? "pl-14" : "pl-20";

            const isInactive = acc.isActive === false;

            return (
              <div
                key={acc.id}
                className={`py-3 pr-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${paddingLeft} ${
                  isInactive ? "opacity-60 bg-slate-50/40 dark:bg-slate-900/40" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs ${
                      acc.level === 1
                        ? "font-bold text-indigo-600 dark:text-indigo-400 text-sm"
                        : "text-slate-500 font-semibold"
                    }`}
                  >
                    {acc.code}
                  </span>
                  <span
                    className={`text-sm ${
                      acc.level === 1
                        ? "font-bold text-slate-900 dark:text-white"
                        : "text-slate-700 dark:text-slate-300 font-medium"
                    }`}
                  >
                    {acc.name}
                  </span>
                  {isInactive && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                      Inativa
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Editar Conta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleStatus(acc)}
                      disabled={actionLoading[acc.id]}
                      className={`p-1.5 rounded-lg transition ${
                        isInactive
                          ? "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          : "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      }`}
                      title={isInactive ? "Reativar Conta" : "Inativar Conta"}
                    >
                      <Power className={`w-3.5 h-3.5 ${actionLoading[acc.id] ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(acc)}
                      disabled={actionLoading[acc.id]}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Excluir Conta (se sem lançamentos)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Cadastrar / Editar Conta */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListTree className="w-5 h-5 text-indigo-600" />
                {editingAccount ? `Editar Conta: ${editingAccount.code}` : "Nova Conta Contábil"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Código da Conta *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 1.1.03 ou 2.1.05"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Natureza Contábil *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {Object.entries(typeLabels).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Nome / Descrição da Conta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Receita com Cursos e Treinamentos"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Conta Sintética (Pai Opcional)
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="">Nenhuma (Conta Raiz ou Nível 1)</option>
                  {accounts
                    .filter((a) => !editingAccount || a.id !== editingAccount.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="accIsActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="accIsActive" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <strong className="block font-medium">Conta Ativa</strong>
                  <span className="text-[11px] text-slate-500">Contas inativas não aparecem em novos lançamentos mas preservam o histórico.</span>
                </label>
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
                  {loading ? "Salvando..." : "Salvar Conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
