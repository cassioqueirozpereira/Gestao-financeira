"use client";

import React, { useState, useEffect } from "react";
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
  Plus,
  Search,
  Tag,
  FolderTree,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CatalogClientViewProps {
  initialProducts: any[];
  categoryLabels: Record<string, string>;
}

export function CatalogClientView({
  initialProducts,
  categoryLabels,
}: CatalogClientViewProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [visualSections, setVisualSections] = useState<Record<string, string>>(categoryLabels);

  // Sincroniza com localStorage no carregamento do cliente
  useEffect(() => {
    try {
      const stored = localStorage.getItem("da_catalog_visual_sections");
      if (stored) {
        const parsed = JSON.parse(stored);
        setVisualSections((prev) => {
          const merged = { ...prev, ...parsed };
          return merged;
        });
      }
    } catch (e) {
      console.warn("Erro ao ler seções visuais do localStorage:", e);
    }
  }, []);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de Gestão de Seções Visuais do Catálogo
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [sectionNameInput, setSectionNameInput] = useState("");
  const [savingSection, setSavingSection] = useState(false);

  // Form states de criação
  const [createName, setCreateName] = useState("");
  const [createCategory, setCreateCategory] = useState("VELAS_NORMAIS_COLORIDAS");
  const [createBasePrice, setCreateBasePrice] = useState("35.00");
  const [createCost, setCreateCost] = useState("15.00");
  const [createMargin, setCreateMargin] = useState("50");
  const [createStock, setCreateStock] = useState("10");
  const [createMinStock, setCreateMinStock] = useState("5");
  const [createDescription, setCreateDescription] = useState("");

  // Form states de edição do produto
  const [name, setName] = useState("");
  const [editCategory, setEditCategory] = useState("VELAS_NORMAIS_COLORIDAS");
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
    setEditCategory(p.category || "VELAS_NORMAIS_COLORIDAS");
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

  const handleStartEditSection = (key: string, label: string) => {
    setEditingSectionKey(key);
    setSectionNameInput(label);
  };

  const handleCancelEditSection = () => {
    setEditingSectionKey(null);
    setSectionNameInput("");
  };

  const saveSectionAction = async (nameToSave: string, keyToEdit: string | null) => {
    if (!nameToSave.trim()) return;
    setSavingSection(true);
    try {
      const res = await fetch("/api/catalogo/secoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: keyToEdit,
          label: nameToSave.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar seção visual");

      if (data.sections) {
        setVisualSections(data.sections);
        try {
          localStorage.setItem("da_catalog_visual_sections", JSON.stringify(data.sections));
        } catch {}
      } else if (data.key && data.label) {
        setVisualSections((prev) => {
          const updated = { ...prev, [data.key]: data.label };
          try {
            localStorage.setItem("da_catalog_visual_sections", JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
      setEditingSectionKey(null);
      setSectionNameInput("");
      setFeedback(`Seção visual "${nameToSave.trim()}" salva com sucesso!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar seção visual");
    } finally {
      setSavingSection(false);
    }
  };

  const handleSaveVisualSection = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSectionAction(sectionNameInput, editingSectionKey);
  };

  const handleDeleteVisualSection = async (key: string) => {
    if (
      !confirm(
        `Deseja realmente remover esta seção visual? Itens com esta seção manterão o registro, mas a seção não será mais listada.`
      )
    ) {
      return;
    }
    setSavingSection(true);
    try {
      const res = await fetch(`/api/catalogo/secoes?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir seção visual");

      if (data.sections) {
        setVisualSections(data.sections);
        try {
          localStorage.setItem("da_catalog_visual_sections", JSON.stringify(data.sections));
        } catch {}
      } else {
        setVisualSections((prev) => {
          const next = { ...prev };
          delete next[key];
          try {
            localStorage.setItem("da_catalog_visual_sections", JSON.stringify(next));
          } catch {}
          return next;
        });
      }
      setFeedback(`Seção visual removida com sucesso!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir seção visual");
    } finally {
      setSavingSection(false);
    }
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
          category: editCategory,
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

  const handleDeleteProduct = async (product: any) => {
    if (!product || !product.id) return;

    if (
      !confirm(
        `Tem certeza que deseja excluir o item "${product.name}" do catálogo?\n\nEsta ação removerá o produto do catálogo comercial.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/catalogo?id=${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir produto");

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      if (editingProduct?.id === product.id) {
        setEditingProduct(null);
      }
      setFeedback(`Item "${product.name}" excluído com sucesso do catálogo!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir produto");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      alert("Informe o nome do item");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/catalogo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          category: createCategory,
          basePrice: parseFloat(createBasePrice) || 0,
          calculatedCost: parseFloat(createCost) || 0,
          desiredMargin: parseFloat(createMargin) || 30,
          stockQuantity: parseInt(createStock, 10) || 0,
          minStockQuantity: parseInt(createMinStock, 10) || 5,
          description: createDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar item");

      setProducts([...products, data.product]);
      setShowCreateModal(false);
      setCreateName("");
      setCreateDescription("");
      setFeedback(`Item "${data.product.name}" adicionado ao catálogo com sucesso!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Filtragem flexível por palavras-chave, nome, descrição e categoria oficial
  const filteredProducts = products.filter((p) => {
    if (!searchTerm.trim()) return true;
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
    const searchTarget = [
      p.name || "",
      p.description || "",
      visualSections[p.category] || categoryLabels[p.category] || p.category || "",
    ]
      .join(" ")
      .toLowerCase();

    return tokens.every((token) => searchTarget.includes(token));
  });

  // Agrupamento por categorias
  const groupedProducts: Record<string, any[]> = {};
  for (const p of filteredProducts) {
    if (!groupedProducts[p.category]) groupedProducts[p.category] = [];
    groupedProducts[p.category].push(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Total no Catálogo: {products.length} itens cadastrados {searchTerm && `(${filteredProducts.length} filtrados)`}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setEditingSectionKey(null);
              setSectionNameInput("");
              setShowSectionsModal(true);
            }}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm transition"
            title="Gerenciar e cadastrar seções visuais do catálogo"
          >
            <FolderTree className="w-4 h-4 text-indigo-500" />
            <span>Seções Visuais do Catálogo</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Item no Catálogo</span>
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa por Palavras-Chave e Categoria */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-500 ml-2 shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar por palavras-chave, nome do produto, aroma, descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

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
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhum produto encontrado para &quot;{searchTerm}&quot;
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tente utilizar outras palavras-chave ou termos mais abrangentes de nome ou categoria.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl hover:bg-indigo-100 transition"
            >
              Limpar Pesquisa
            </button>
          </div>
        ) : (
          Object.entries(groupedProducts).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Flame className="w-4 h-4 text-indigo-500" />
              {visualSections[category] || categoryLabels[category] || category}
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar & Margem</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(item)}
                        disabled={loading}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition shrink-0"
                        title={`Excluir "${item.name}" do catálogo`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
        )}
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

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Seção Visual do Catálogo
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {Object.entries(visualSections).map(([catKey, catLabel]) => (
                    <option key={catKey} value={catKey}>
                      {catLabel}
                    </option>
                  ))}
                </select>
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

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDeleteProduct(editingProduct)}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 transition disabled:opacity-50"
                  title="Excluir este item definitivamente do catálogo"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Item</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                  >
                    Salvar Preço Oficial
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Cadastrar Novo Item no Catálogo (Item 5) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                Cadastrar Novo Item no Catálogo
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Nome do Produto / Modelo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vela Aromática Lavanda Francesa 180g"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Seção Visual do Catálogo *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSectionKey(null);
                      setSectionNameInput("");
                      setShowSectionsModal(true);
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    title="Adicionar ou editar seções visuais pré-definidas"
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    + Adicionar / Editar Seções
                  </button>
                </div>
                <select
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {Object.entries(visualSections).map(([catKey, catLabel]) => (
                    <option key={catKey} value={catKey}>
                      {catLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={createBasePrice}
                    onChange={(e) => setCreateBasePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-extrabold text-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Custo Unitário Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={createCost}
                    onChange={(e) => setCreateCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Margem (%)
                  </label>
                  <input
                    type="number"
                    value={createMargin}
                    onChange={(e) => setCreateMargin(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Estoque Inicial (un)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createStock}
                    onChange={(e) => setCreateStock(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createMinStock}
                    onChange={(e) => setCreateMinStock(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Descrição do Item
                </label>
                <textarea
                  rows={2}
                  placeholder="Aroma, composição, detalhes e características do produto"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {loading ? "Cadastrando..." : "Cadastrar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Gerenciar / Adicionar / Editar Seções Visuais do Catálogo */}
      {showSectionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Seções Visuais do Catálogo
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Adicione ou edite os títulos das seções visuais que organizam os produtos no catálogo.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSectionsModal(false);
                  setEditingSectionKey(null);
                  setSectionNameInput("");
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário de Adicionar / Editar Seção */}
            <form onSubmit={handleSaveVisualSection} className="pt-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                {editingSectionKey ? "Editar Seção Visual Selecionada" : "Cadastrar Nova Seção Visual"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: 14.9. Difusores e Home Sprays"
                  value={sectionNameInput}
                  onChange={(e) => setSectionNameInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={savingSection || !sectionNameInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition whitespace-nowrap"
                >
                  {savingSection ? "Salvando..." : editingSectionKey ? "Atualizar" : "Adicionar"}
                </button>
                {editingSectionKey && (
                  <button
                    type="button"
                    onClick={handleCancelEditSection}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-300 transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* Lista das Seções Cadastradas */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Seções Cadastradas ({Object.keys(visualSections).length})
              </span>
              {Object.entries(visualSections).map(([secKey, secLabel]) => {
                const isEditingThis = editingSectionKey === secKey;
                const countItems = products.filter((p) => p.category === secKey).length;

                return (
                  <div
                    key={secKey}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                      isEditingThis
                        ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {secLabel}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 shrink-0 font-medium">
                        {countItems} {countItems === 1 ? "item" : "itens"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditSection(secKey, secLabel)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                        title="Editar nome desta seção"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVisualSection(secKey)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                        title="Remover seção visual"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                disabled={savingSection}
                onClick={async () => {
                  if (sectionNameInput.trim() && !savingSection) {
                    await saveSectionAction(sectionNameInput, editingSectionKey);
                  }
                  setShowSectionsModal(false);
                  setEditingSectionKey(null);
                  setSectionNameInput("");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {savingSection ? "Salvando..." : "Concluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
