"use client";

import React, { useState } from "react";
import {
  Coins,
  TrendingUp,
  Percent,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CustosClientViewProps {
  rawMaterials: any[];
  packagings: any[];
  products: any[];
}

export function CustosClientView({
  rawMaterials: initialRawMaterials,
  packagings: initialPackagings,
  products: initialProducts,
}: CustosClientViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"PRODUTOS" | "INSUMOS" | "EMBALAGENS">("PRODUTOS");
  const [products, setProducts] = useState(initialProducts);
  const [rawMaterials, setRawMaterials] = useState(initialRawMaterials);
  const [packagings, setPackagings] = useState(initialPackagings);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const handleUpdateCost = async (type: "RAW_MATERIAL" | "PACKAGING" | "PRODUCT", id: string, val: number) => {
    setSaving(true);
    try {
      const payload: any = { type, id };
      if (type === "PRODUCT") {
        payload.basePrice = val;
      } else {
        payload.unitCost = val;
      }

      const res = await fetch("/api/cadastros/custos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar");

      if (type === "RAW_MATERIAL") {
        setRawMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, unitCost: val } : m)));
      } else if (type === "PACKAGING") {
        setPackagings((prev) => prev.map((p) => (p.id === id ? { ...p, unitCost: val } : p)));
      } else {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, basePrice: val } : p)));
      }

      setEditingId(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Produtos Analisados</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{products.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Modelos com margem e custo unitário</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Insumos & Matérias-Primas</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{rawMaterials.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Ceras, resinas, essências e pavios</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Embalagens & Recipientes</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{packagings.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Copos, potes, caixas e rótulos</p>
        </div>
      </div>

      {/* Tabs & Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("PRODUTOS")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "PRODUTOS"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Margens dos Produtos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("INSUMOS")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "INSUMOS"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Custos de Matéria-Prima ({rawMaterials.length})
          </button>
          <button
            onClick={() => setActiveTab("EMBALAGENS")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "EMBALAGENS"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Custos de Embalagem ({packagings.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Conteúdo da Aba */}
      {activeTab === "PRODUTOS" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Categoria Oficial</th>
                  <th className="px-6 py-4 text-right">Custo Calculado</th>
                  <th className="px-6 py-4 text-right">Preço de Venda</th>
                  <th className="px-6 py-4 text-right">Margem Bruta (R$)</th>
                  <th className="px-6 py-4 text-center">Margem (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {products
                  .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                  .map((prod) => {
                    const cost = Number(prod.calculatedCost) || 0;
                    const price = Number(prod.basePrice) || 0;
                    const marginValue = price - cost;
                    const marginPercent = cost > 0 ? (marginValue / cost) * 100 : 0;
                    const isHealthy = marginPercent >= 40;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          {prod.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                            {prod.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-slate-500">
                          {formatBRL(cost)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {editingId === prod.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-20 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-800 text-right"
                              />
                              <button
                                onClick={() => handleUpdateCost("PRODUCT", prod.id, parseFloat(editValue))}
                                disabled={saving}
                                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => {
                                setEditingId(prod.id);
                                setEditValue(String(prod.basePrice));
                              }}
                              className="cursor-pointer hover:underline text-indigo-600 dark:text-indigo-400"
                              title="Clique para editar preço de venda"
                            >
                              {formatBRL(price)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-emerald-600">
                          {formatBRL(marginValue)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isHealthy
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                            }`}
                          >
                            {isHealthy ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {marginPercent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "INSUMOS" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Insumo</th>
                  <th className="px-6 py-4">Fornecedor</th>
                  <th className="px-6 py-4">Unidade</th>
                  <th className="px-6 py-4 text-right">Estoque Atual</th>
                  <th className="px-6 py-4 text-right">Custo Unitário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {rawMaterials
                  .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
                  .map((mat) => (
                    <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{mat.code || "-"}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{mat.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{mat.supplier?.name || "Não vinculado"}</td>
                      <td className="px-6 py-4 font-mono text-xs">{mat.unit}</td>
                      <td className="px-6 py-4 text-right font-mono font-medium">{Number(mat.currentStock).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {editingId === mat.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-800 text-right"
                            />
                            <button
                              onClick={() => handleUpdateCost("RAW_MATERIAL", mat.id, parseFloat(editValue))}
                              disabled={saving}
                              className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setEditingId(mat.id);
                              setEditValue(String(mat.unitCost));
                            }}
                            className="cursor-pointer hover:underline"
                            title="Clique para atualizar custo unitário do insumo"
                          >
                            {formatBRL(Number(mat.unitCost))}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "EMBALAGENS" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Embalagem / Recipiente</th>
                  <th className="px-6 py-4">Fornecedor</th>
                  <th className="px-6 py-4">Unidade</th>
                  <th className="px-6 py-4 text-right">Estoque Atual</th>
                  <th className="px-6 py-4 text-right">Custo Unitário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {packagings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Nenhuma embalagem cadastrada ainda. Acesse o módulo de Estoque para cadastrar recipientes e embalagens.
                    </td>
                  </tr>
                ) : (
                  packagings
                    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                    .map((pack) => (
                      <tr key={pack.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{pack.code || "-"}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{pack.name}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{pack.supplier?.name || "Não vinculado"}</td>
                        <td className="px-6 py-4 font-mono text-xs">{pack.unit}</td>
                        <td className="px-6 py-4 text-right font-mono font-medium">{pack.currentStock}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {editingId === pack.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-20 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-800 text-right"
                              />
                              <button
                                onClick={() => handleUpdateCost("PACKAGING", pack.id, parseFloat(editValue))}
                                disabled={saving}
                                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => {
                                setEditingId(pack.id);
                                setEditValue(String(pack.unitCost));
                              }}
                              className="cursor-pointer hover:underline"
                              title="Clique para atualizar custo unitário da embalagem"
                            >
                              {formatBRL(Number(pack.unitCost))}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
