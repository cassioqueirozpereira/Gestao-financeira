"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Lock,
  Flame,
  Info,
  Edit2,
  Calculator,
  Percent,
  CheckCircle2,
  X,
  DollarSign,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CatalogClientViewProps {
  initialProducts: any[];
  categoryLabels: Record<string, string>;
}

export function CatalogClientView({ initialProducts, categoryLabels }: CatalogClientViewProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form states de edição do produto
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [description, setDescription] = useState("");

  // Calculadora de Custo e Margem por Item
  const [costCeraResina, setCostCeraResina] = useState(4.50);
  const [costPoteFrasco, setCostPoteFrasco] = useState(5.80);
  const [costPavioEssencia, setCostPavioEssencia] = useState(2.20);
  const [costMaoDeObraOperacional, setCostMaoDeObraOperacional] = useState(2.50);
  const [desiredMargin, setDesiredMargin] = useState(50); // % de margem de lucro

  const totalCalculatedCost =
    costCeraResina + costPoteFrasco + costPavioEssencia + costMaoDeObraOperacional;

  // Preço Sugerido: Custo * (1 + Margem / 100)
  const suggestedSalePrice = totalCalculatedCost * (1 + desiredMargin / 100);

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setName(p.name);
    setBasePrice(String(p.basePrice));
    setStockQuantity(String(p.stockQuantity));
    setDescription(p.description || "");

    const cost = Number(p.calculatedCost || 15.0);
    setCostCeraResina(parseFloat((cost * 0.35).toFixed(2)));
    setCostPoteFrasco(parseFloat((cost * 0.40).toFixed(2)));
    setCostPavioEssencia(parseFloat((cost * 0.15).toFixed(2)));
    setCostMaoDeObraOperacional(parseFloat((cost * 0.10).toFixed(2)));
    setDesiredMargin(Number(p.desiredMargin || 50));
  };

  const handleApplyCalculatedPrice = () => {
    setBasePrice(suggestedSalePrice.toFixed(2));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoading(true);

    try {
      const res = await fetch("/api/catalogo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct.id,
          name,
          basePrice: parseFloat(basePrice),
          calculatedCost: parseFloat(totalCalculatedCost.toFixed(2)),
          desiredMargin: parseFloat(String(desiredMargin)),
          stockQuantity: parseInt(stockQuantity, 10),
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar produto");

      setProducts(
        products.map((p) => (p.id === editingProduct.id ? { ...p, ...data.product } : p))
      );
      setEditingProduct(null);
      setFeedback(`Preço oficial de "${name}" atualizado para R$ ${parseFloat(basePrice).toFixed(2)}!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Agrupamento por categorias
  const groupedProducts: Record<string, any[]> = {};
  for (const p of products) {
    if (!groupedProducts[p.category]) groupedProducts[p.category] = [];
    groupedProducts[p.category].push(p);
  }

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

      {/* Grid por Categorias */}
      <div className="space-y-8">
        {Object.entries(groupedProducts).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Flame className="w-4 h-4 text-indigo-500" />
              {categoryLabels[category] || category}
              <span className="text-xs font-normal text-slate-400">({items.length} itens)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {item.name}
                      </h3>
                      <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 shrink-0">
                        {item.weightGrams ? `${item.weightGrams} g` : item.volumeMl ? `~${item.volumeMl} ml` : "Unid."}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Preço Oficial
                        </span>
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                          {formatBRL(Number(item.basePrice))}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Estoque</span>
                        <span
                          className={`text-xs font-bold ${
                            item.stockQuantity <= item.minStockQuantity
                              ? "text-red-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {item.stockQuantity} un
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar & Calcular Margem</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Edição do Produto & Calculadora de Margem [Item 11] */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" />
                  Calculadora de Preço de Venda com Margem de Lucro
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Editar: {editingProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Nome do Modelo / Produto
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              {/* Bloco da Calculadora Gasto por Item */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider block">
                  1. Custos Unitários Estimados por Item
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Cera / Resina (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costCeraResina}
                      onChange={(e) => setCostCeraResina(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Pote / Frasco (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPoteFrasco}
                      onChange={(e) => setCostPoteFrasco(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Pavio/Essência (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPavioEssencia}
                      onChange={(e) => setCostPavioEssencia(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Operacional & MO (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costMaoDeObraOperacional}
                      onChange={(e) => setCostMaoDeObraOperacional(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Custo Total de Produção por Peça:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    {formatBRL(totalCalculatedCost)}
                  </span>
                </div>
              </div>

              {/* Margem de Lucro Desejada e Preço Sugerido */}
              <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-900 dark:text-white uppercase mb-0.5">
                      Margem de Lucro Desejada (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={desiredMargin}
                        onChange={(e) => setDesiredMargin(parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-indigo-600 text-sm"
                      />
                      <span className="text-xs text-slate-500">% sobre o custo</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Preço Sugerido com Lucro
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatBRL(suggestedSalePrice)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleApplyCalculatedPrice}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition"
                  >
                    Usar Preço Sugerido ({formatBRL(suggestedSalePrice)})
                  </button>
                </div>
              </div>

              {/* Preço Oficial e Estoque */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Preço Oficial de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-extrabold text-base text-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Quantidade em Estoque (un)
                  </label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Descrição Comercial
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Preço Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
