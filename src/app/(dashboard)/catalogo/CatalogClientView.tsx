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
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Layers,
  Box,
  TrendingUp,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FichaTecnicaModal } from "./FichaTecnicaModal";

interface CatalogClientViewProps {
  initialProducts: any[];
  categoryLabels: Record<string, string>;
  initialRawMaterials?: any[];
  initialPackagings?: any[];
  initialChartOfAccounts?: any[];
}

export function CatalogClientView({
  initialProducts,
  categoryLabels,
  initialRawMaterials = [],
  initialPackagings = [],
  initialChartOfAccounts = [],
}: CatalogClientViewProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [visualSections, setVisualSections] = useState<Record<string, string>>(categoryLabels);
  const [selectedProductForFicha, setSelectedProductForFicha] = useState<any | null>(null);

  // Sistema de Toast Personalizado (Cores e tema do Casaratech)
  const [toast, setToast] = useState<{
    id: number;
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info" | "warning", message: string) => {
    setToast({ id: Date.now(), type, message });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Modal de Confirmação Personalizado (substitui window.confirm nativo do navegador)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "default";
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Lista de seções legadas do código antigo que foram excluídas e NUNCA devem voltar
  const legacyDeletedKeys = [
    "CHANTILLY_E_FLOR",
    "Chantilly e Flor",
    "VASOS_DECORATIVOS",
    "Vasos e Produtos Decorativos",
    "COLECAO_NATAL",
    "Coleção Natal",
    "ARVORES_NATAL_AVULSAS",
    "Árvores de Natal Avulsas",
    "ARVORES_NATAL_COPO",
    "Árvores de Natal Dentro do Copo",
  ];

  // Sincroniza com localStorage no carregamento do cliente e expurga seções excluídas
  useEffect(() => {
    try {
      const stored = localStorage.getItem("da_catalog_visual_sections");
      if (stored) {
        const parsed = JSON.parse(stored);
        const cleaned: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (
            !k.startsWith("SECTION_") &&
            !legacyDeletedKeys.includes(k) &&
            !legacyDeletedKeys.includes(String(v))
          ) {
            cleaned[k] = String(v);
          }
        }
        try {
          localStorage.setItem("da_catalog_visual_sections", JSON.stringify(cleaned));
        } catch {}

        setVisualSections((prev) => {
          const merged = { ...prev };
          // Remove seções legadas antigas e chaves com SECTION_
          for (const key of Object.keys(merged)) {
            if (key.startsWith("SECTION_") || legacyDeletedKeys.includes(key)) {
              delete merged[key];
            }
          }
          for (const [k, v] of Object.entries(cleaned)) {
            merged[k] = v;
          }
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

  // Insumos e Plano de Contas carregados para Ficha Técnica e Criação
  const [rawMaterials, setRawMaterials] = useState<any[]>(initialRawMaterials);
  const [packagings, setPackagings] = useState<any[]>(initialPackagings);
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>(initialChartOfAccounts);

  useEffect(() => {
    if (rawMaterials.length === 0 || packagings.length === 0) {
      fetch("/api/estoque")
        .then((res) => res.json())
        .then((data) => {
          if (data.rawMaterials) setRawMaterials(data.rawMaterials);
          if (data.packagings) setPackagings(data.packagings);
          if (data.chartOfAccounts) setChartOfAccounts(data.chartOfAccounts);
        })
        .catch(() => {});
    }
  }, []);

  // Form states de criação (Repaginado sem custo/margem fictícios)
  const [createName, setCreateName] = useState("");
  const [createCategory, setCreateCategory] = useState("Velas Normais e Coloridas");
  const [createBasePrice, setCreateBasePrice] = useState("35.00");
  const [createStock, setCreateStock] = useState("10");
  const [createMinStock, setCreateMinStock] = useState("5");
  const [createDescription, setCreateDescription] = useState("");

  // Composição selecionada na criação do item
  const [selectedRawMaterials, setSelectedRawMaterials] = useState<
    Array<{
      rawMaterialId: string;
      name: string;
      quantity: number;
      unit: string;
      unitCost: number;
    }>
  >([]);

  const [selectedPackagings, setSelectedPackagings] = useState<
    Array<{
      packagingId: string;
      name: string;
      quantity: number;
      unitCost: number;
    }>
  >([]);

  const [rawSearchTerm, setRawSearchTerm] = useState("");
  const [packSearchTerm, setPackSearchTerm] = useState("");
  const [mobileTab, setMobileTab] = useState<"materials" | "packaging">("materials");

  // Identificação dinâmica da Seção Visual e Conta Contábil (Velas = 2.1, Resinas = 2.2, Embalagens = 2.3)
  const isVelasCategory = (cat: string) => {
    const c = (cat || "").toLowerCase();
    return c.startsWith("vela") || c.includes("vela");
  };

  const isResinasCategory = (cat: string) => {
    const c = (cat || "").toLowerCase();
    return c.startsWith("resina") || c.includes("resina");
  };

  const activeRawAccountCode = isVelasCategory(createCategory)
    ? "2.1"
    : isResinasCategory(createCategory)
    ? "2.2"
    : "2.1";

  const activeRawAccountName = isVelasCategory(createCategory)
    ? "Conta 2.1 • Matéria-Prima para Velas (Ceras, Essências, Pavios)"
    : isResinasCategory(createCategory)
    ? "Conta 2.2 • Matéria-Prima para Resinas (Epóxi, Pigmentos, Moldes)"
    : "Custos Diretos de Produção • Matérias-Primas";

  // Matérias-primas filtradas pelo Plano de Contas e Seção Visual
  const filteredRawMaterials = rawMaterials.filter((raw) => {
    const accCode = raw.chartOfAccountCode || raw.chartOfAccount?.code || "";
    const cat = (raw.category || "").toLowerCase();
    const name = (raw.name || "").toLowerCase();

    let matchesCategory = true;
    if (isVelasCategory(createCategory)) {
      matchesCategory =
        accCode === "2.1" ||
        cat === "cera" ||
        cat === "essencia" ||
        cat === "pavio" ||
        cat.includes("vela") ||
        name.includes("cera") ||
        name.includes("essência") ||
        name.includes("essencia") ||
        name.includes("pavio") ||
        name.includes("parafina");
    } else if (isResinasCategory(createCategory)) {
      matchesCategory =
        accCode === "2.2" ||
        cat === "resina" ||
        cat === "pigmento" ||
        cat === "molde" ||
        cat.includes("resina") ||
        name.includes("resina") ||
        name.includes("epóxi") ||
        name.includes("epoxi") ||
        name.includes("pigmento");
    }

    if (!matchesCategory) return false;
    if (!rawSearchTerm.trim()) return true;
    return name.includes(rawSearchTerm.toLowerCase());
  });

  // Embalagens filtradas (Conta 2.3)
  const filteredPackagings = packagings.filter((pack) => {
    if (!packSearchTerm.trim()) return true;
    return (pack.name || "").toLowerCase().includes(packSearchTerm.toLowerCase());
  });

  // Cálculos automáticos reais de custos da composição
  const calculatedRawTotal = selectedRawMaterials.reduce((acc, it) => {
    const qty = Number(it.quantity) || 0;
    const cost = Number(it.unitCost) || 0;
    const isGram = it.unit?.toUpperCase() === "G";
    const lineCost = isGram ? (qty / 1000) * cost : qty * cost;
    return acc + lineCost;
  }, 0);

  const calculatedPackTotal = selectedPackagings.reduce((acc, it) => {
    const qty = Number(it.quantity) || 0;
    const cost = Number(it.unitCost) || 0;
    return acc + qty * cost;
  }, 0);

  const calculatedDirectCost = calculatedRawTotal + calculatedPackTotal;
  const basePriceNum = parseFloat(createBasePrice) || 0;
  const calculatedProfitBRL = basePriceNum > 0 ? basePriceNum - calculatedDirectCost : 0;
  const calculatedMarginPct =
    basePriceNum > 0
      ? Number((((basePriceNum - calculatedDirectCost) / basePriceNum) * 100).toFixed(1))
      : 0;

  // Ações para manipulação dos insumos e embalagens da composição
  const handleAddRawMaterial = (rawId: string) => {
    if (!rawId) return;
    const raw = rawMaterials.find((r) => r.id === rawId);
    if (!raw) return;
    if (selectedRawMaterials.some((it) => it.rawMaterialId === raw.id)) {
      showToast("info", `"${raw.name}" já está na lista de composição.`);
      return;
    }
    const defUnit = raw.unit?.toUpperCase() === "KG" ? "G" : raw.unit || "G";
    const defQty = defUnit === "G" ? 50 : 1;
    setSelectedRawMaterials((prev) => [
      ...prev,
      {
        rawMaterialId: raw.id,
        name: raw.name,
        quantity: defQty,
        unit: defUnit,
        unitCost: Number(raw.unitCost) || 0,
      },
    ]);
  };

  const handleUpdateRawMaterialQty = (rawId: string, qty: number) => {
    setSelectedRawMaterials((prev) =>
      prev.map((it) => (it.rawMaterialId === rawId ? { ...it, quantity: qty } : it))
    );
  };

  const handleRemoveRawMaterial = (rawId: string) => {
    setSelectedRawMaterials((prev) => prev.filter((it) => it.rawMaterialId !== rawId));
  };

  const handleAddPackaging = (packId: string) => {
    if (!packId) return;
    const pack = packagings.find((p) => p.id === packId);
    if (!pack) return;
    if (selectedPackagings.some((it) => it.packagingId === pack.id)) {
      showToast("info", `"${pack.name}" já está na lista.`);
      return;
    }
    setSelectedPackagings((prev) => [
      ...prev,
      {
        packagingId: pack.id,
        name: pack.name,
        quantity: 1,
        unitCost: Number(pack.unitCost) || 0,
      },
    ]);
  };

  const handleUpdatePackagingQty = (packId: string, qty: number) => {
    setSelectedPackagings((prev) =>
      prev.map((it) => (it.packagingId === packId ? { ...it, quantity: qty } : it))
    );
  };

  const handleRemovePackaging = (packId: string) => {
    setSelectedPackagings((prev) => prev.filter((it) => it.packagingId !== packId));
  };

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
      showToast("success", `Seção visual "${nameToSave.trim()}" salva com sucesso!`);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Erro ao salvar seção visual");
    } finally {
      setSavingSection(false);
    }
  };

  const handleSaveVisualSection = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSectionAction(sectionNameInput, editingSectionKey);
  };

  const handleDeleteVisualSection = (key: string) => {
    const countItems = products.filter((p) => p.category === key).length;
    setConfirmModal({
      isOpen: true,
      title: "Excluir Seção Visual",
      message:
        countItems > 0
          ? `A seção "${key}" possui ${countItems} item(ns). Deseja realmente removê-la? Os produtos continuarão no sistema com a seção desvinculada.`
          : `Tem certeza que deseja remover a seção visual "${key}"? Ela será excluída definitivamente e não retornará ao recarregar a página.`,
      confirmText: "Sim, Excluir",
      cancelText: "Cancelar",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setSavingSection(true);
        try {
          const res = await fetch(`/api/catalogo/secoes?key=${encodeURIComponent(key)}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erro ao excluir seção visual");

          setVisualSections((prev) => {
            const next = { ...prev };
            delete next[key];
            for (const [k, v] of Object.entries(next)) {
              if (k === key || v === key) delete next[k];
            }
            try {
              localStorage.setItem("da_catalog_visual_sections", JSON.stringify(next));
            } catch {}
            return next;
          });

          showToast("success", `Seção visual "${key}" removida com sucesso!`);
          router.refresh();
        } catch (err: any) {
          showToast("error", err.message || "Erro ao excluir seção visual");
        } finally {
          setSavingSection(false);
        }
      },
    });
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
      showToast("success", `Preço oficial de "${name}" atualizado para R$ ${parseFloat(basePrice).toFixed(2)}!`);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = (product: any) => {
    if (!product || !product.id) return;

    setConfirmModal({
      isOpen: true,
      title: "Excluir Item do Catálogo",
      message: `Tem certeza que deseja excluir o item "${product.name}" do catálogo comercial oficial?`,
      confirmText: "Sim, Excluir Produto",
      cancelText: "Cancelar",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
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
          showToast("success", `Item "${product.name}" excluído com sucesso do catálogo!`);
          router.refresh();
        } catch (err: any) {
          showToast("error", err.message || "Erro ao excluir produto");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      showToast("warning", "Informe o nome do item para cadastrar.");
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
          calculatedCost: Number(calculatedDirectCost.toFixed(2)),
          desiredMargin: calculatedMarginPct,
          stockQuantity: parseInt(createStock, 10) || 0,
          minStockQuantity: parseInt(createMinStock, 10) || 5,
          description: createDescription,
          items: selectedRawMaterials.map((it) => ({
            rawMaterialId: it.rawMaterialId,
            quantity: it.unit?.toUpperCase() === "G" ? it.quantity / 1000 : it.quantity,
          })),
          packagingItems: selectedPackagings.map((it) => ({
            packagingId: it.packagingId,
            quantity: it.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar item");

      setProducts([...products, data.product]);
      setShowCreateModal(false);
      setCreateName("");
      setCreateDescription("");
      setSelectedRawMaterials([]);
      setSelectedPackagings([]);
      showToast("success", `Item "${data.product.name}" adicionado ao catálogo com sucesso!`);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message || "Erro ao criar item");
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
              {visualSections[category] ||
                categoryLabels[category] ||
                (category.startsWith("SECTION_")
                  ? category.replace(/^SECTION_/, "").replace(/_\d+$/, "").replace(/_/g, " ")
                  : category)}
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

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedProductForFicha(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs font-bold transition shadow-xs"
                        title="Ficha Técnica com busca automática de compras, estoque e financeiro"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ficha Técnica</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition shadow-xs"
                        title="Editar dados cadastrais"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-5xl p-6 sm:p-8 shadow-2xl relative max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" />
                  Calculadora de Preço de Venda com Margem de Lucro
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Editar: {editingProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Nome do Modelo / Produto
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Seção Visual do Catálogo
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-sm"
                  >
                    {Object.entries(visualSections).map(([catKey, catLabel]) => (
                      <option key={catKey} value={catKey}>
                        {catLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Integração Automática com Compras, Estoque e Financeiro */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-slate-50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-black text-indigo-900 dark:text-indigo-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Ficha Técnica Integrada & Custo Real de Produção
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Busca automaticamente os valores pagos em Compras, Estoque e faturas do Financeiro.
                    </p>
                  </div>

                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 shrink-0 shadow-xs">
                    Custo Real: {formatBRL(editingProduct.calculatedCost || totalCalculatedCost)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const currentEditing = editingProduct;
                    setEditingProduct(null);
                    setSelectedProductForFicha(currentEditing);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Abrir Ficha Técnica Completa (Ingredientes, Horas & Canais de Venda)</span>
                </button>
              </div>

              {/* Margem de Lucro Desejada e Preço Sugerido */}
              <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-900 dark:text-white uppercase mb-1">
                      Margem de Lucro Desejada (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={desiredMargin}
                        onChange={(e) => setDesiredMargin(parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-indigo-600 text-base"
                      />
                      <span className="text-xs font-semibold text-slate-500">% sobre o custo de produção</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Preço Sugerido com Lucro
                    </span>
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatBRL(suggestedSalePrice)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleApplyCalculatedPrice}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition"
                  >
                    Usar Preço Sugerido ({formatBRL(suggestedSalePrice)})
                  </button>
                </div>
              </div>

              {/* Preço Oficial e Estoque */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-extrabold text-lg text-indigo-600"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-lg"
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

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDeleteProduct(editingProduct)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 transition disabled:opacity-50"
                  title="Excluir este item definitivamente do catálogo"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Item</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                  >
                    Salvar Preço Oficial
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Cadastrar Novo Item no Catálogo (Repaginado em Tela Cheia & Integrado ao Plano de Contas) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full h-full sm:max-w-[97vw] sm:max-h-[96vh] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header com visual amplo */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Cadastrar Novo Item no Catálogo
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Plano de Contas Integrado
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preencha os dados comerciais e selecione os insumos e embalagens. Os custos e a margem real são calculados automaticamente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll Espaçoso */}
            <form onSubmit={handleCreateProduct} className="flex-1 flex flex-col overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* 1. DADOS COMERCIAIS BÁSICOS DO PRODUTO */}
                <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    1. Identificação Comercial & Seção Visual
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Nome do Produto */}
                    <div className="md:col-span-5">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Nome do Produto / Modelo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Vela Aromática Lavanda Francesa 180g"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Seção Visual */}
                    <div className="md:col-span-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                          Seção Visual do Catálogo *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSectionKey(null);
                            setSectionNameInput("");
                            setShowSectionsModal(true);
                          }}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          title="Adicionar ou editar seções visuais"
                        >
                          <FolderTree className="w-3 h-3" />
                          + Gerenciar Seções
                        </button>
                      </div>
                      <select
                        value={createCategory}
                        onChange={(e) => setCreateCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm text-indigo-700 dark:text-indigo-300"
                      >
                        {Object.entries(visualSections).map(([catKey, catLabel]) => (
                          <option key={catKey} value={catKey}>
                            {catLabel}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preço de Venda */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Preço Oficial de Venda (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0,00"
                        value={createBasePrice}
                        onChange={(e) => setCreateBasePrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-base text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Estoque Inicial */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Estoque Inicial (un)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={createStock}
                        onChange={(e) => setCreateStock(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-center"
                      />
                    </div>

                    {/* Estoque Mínimo */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Estoque Mínimo de Alerta
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={createMinStock}
                        onChange={(e) => setCreateMinStock(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-center"
                      />
                    </div>

                    {/* Descrição */}
                    <div className="md:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Descrição Comercial / Aroma
                      </label>
                      <input
                        type="text"
                        placeholder="Notas olfativas, família aromática ou especificações da peça"
                        value={createDescription}
                        onChange={(e) => setCreateDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. NOVA ÁREA DE INTEGRAÇÃO COM PLANO DE CONTAS */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200">
                          2. Composição de Insumos & Custos pelo Plano de Contas
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Filtro automático baseado na seção selecionada:{" "}
                          <strong className="text-indigo-600 dark:text-indigo-400">{createCategory}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-indigo-200 dark:border-indigo-800">
                        {activeRawAccountName}
                      </span>
                    </div>
                  </div>

                  {/* Controle Mobile de Abas */}
                  <div className="flex sm:hidden p-1 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setMobileTab("materials")}
                      className={`flex-1 py-1.5 rounded-lg transition ${
                        mobileTab === "materials"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      🌿 Matérias-Primas ({selectedRawMaterials.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileTab("packaging")}
                      className={`flex-1 py-1.5 rounded-lg transition ${
                        mobileTab === "packaging"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      📦 Embalagens ({selectedPackagings.length})
                    </button>
                  </div>

                  {/* Grid de 2 Colunas no Desktop / Tablet */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    
                    {/* COLUNA 1: MATÉRIAS-PRIMAS (Conta 2.1 para Velas, 2.2 para Resinas) */}
                    <div
                      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 ${
                        mobileTab !== "materials" ? "hidden sm:flex" : "flex"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            Matérias-Primas (Conta {activeRawAccountCode})
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {selectedRawMaterials.length} item(ns)
                        </span>
                      </div>

                      {/* Dropdown de Seleção de Insumo */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Adicionar Insumo do Estoque:
                        </label>
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => {
                              handleAddRawMaterial(e.target.value);
                              e.target.value = "";
                            }}
                            defaultValue=""
                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                          >
                            <option value="" disabled>
                              Selecione uma matéria-prima da Conta {activeRawAccountCode}...
                            </option>
                            {filteredRawMaterials.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} — Custo: {formatBRL(r.unitCost || 0)} / {r.unit || "g"} (Estoque: {Number(r.currentStock) || 0} {r.unit || "g"})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Chips Rápidos de Insumos Comuns */}
                      {filteredRawMaterials.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 block">Opções Rápidas (Clique para adicionar):</span>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {filteredRawMaterials.slice(0, 8).map((r) => {
                              const isAdded = selectedRawMaterials.some((it) => it.rawMaterialId === r.id);
                              return (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => handleAddRawMaterial(r.id)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                                    isAdded
                                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 opacity-60"
                                      : "bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                                  }`}
                                >
                                  {isAdded && <Check className="w-3 h-3 text-emerald-600" />}
                                  <span>{r.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tabela de Insumos Adicionados */}
                      <div className="flex-1 min-h-[160px] overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/30">
                        {selectedRawMaterials.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                            <Flame className="w-8 h-8 opacity-30 mb-1" />
                            <p className="text-xs font-semibold">Nenhuma matéria-prima incluída.</p>
                            <span className="text-[10px] text-slate-400">Selecione no menu acima os componentes desta receita.</span>
                          </div>
                        ) : (
                          selectedRawMaterials.map((it) => {
                            const isGram = it.unit?.toUpperCase() === "G";
                            const lineCost = isGram
                              ? (it.quantity / 1000) * it.unitCost
                              : it.quantity * it.unitCost;

                            return (
                              <div
                                key={it.rawMaterialId}
                                className="flex items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate block">
                                    {it.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    Custo do estoque: {formatBRL(it.unitCost)}/{isGram ? "kg" : it.unit}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0.1"
                                      value={it.quantity}
                                      onChange={(e) =>
                                        handleUpdateRawMaterialQty(it.rawMaterialId, parseFloat(e.target.value) || 0)
                                      }
                                      className="w-16 px-2 py-1 text-right bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs"
                                    />
                                    <span className="text-[11px] font-bold text-slate-500 uppercase">{it.unit}</span>
                                  </div>

                                  <div className="w-20 text-right">
                                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                                      {formatBRL(lineCost)}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRawMaterial(it.rawMaterialId)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                    title="Remover insumo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Subtotal da Coluna */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 font-bold">
                        <span className="text-slate-500 text-[11px]">Subtotal Matérias-Primas:</span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {formatBRL(calculatedRawTotal)}
                        </span>
                      </div>
                    </div>

                    {/* COLUNA 2: EMBALAGENS E RECIPIENTES (Conta 2.3) */}
                    <div
                      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 ${
                        mobileTab !== "packaging" ? "hidden sm:flex" : "flex"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-indigo-500" />
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            Embalagens & Recipientes (Conta 2.3)
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {selectedPackagings.length} item(ns)
                        </span>
                      </div>

                      {/* Dropdown de Seleção de Embalagem */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Adicionar Embalagem do Estoque:
                        </label>
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => {
                              handleAddPackaging(e.target.value);
                              e.target.value = "";
                            }}
                            defaultValue=""
                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                          >
                            <option value="" disabled>
                              Selecione uma embalagem da Conta 2.3...
                            </option>
                            {filteredPackagings.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — Custo: {formatBRL(p.unitCost || 0)} (Estoque: {p.currentStock} un)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Chips Rápidos de Embalagens Comuns */}
                      {filteredPackagings.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 block">Opções Rápidas (Potes, Frascos, Caixas):</span>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {filteredPackagings.slice(0, 8).map((p) => {
                              const isAdded = selectedPackagings.some((it) => it.packagingId === p.id);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleAddPackaging(p.id)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                                    isAdded
                                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 opacity-60"
                                      : "bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                                  }`}
                                >
                                  {isAdded && <Check className="w-3 h-3 text-emerald-600" />}
                                  <span>{p.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tabela de Embalagens Adicionadas */}
                      <div className="flex-1 min-h-[160px] overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/30">
                        {selectedPackagings.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                            <Box className="w-8 h-8 opacity-30 mb-1" />
                            <p className="text-xs font-semibold">Nenhuma embalagem incluída.</p>
                            <span className="text-[10px] text-slate-400">Selecione potes, caixas ou rótulos acima.</span>
                          </div>
                        ) : (
                          selectedPackagings.map((it) => {
                            const lineCost = it.quantity * it.unitCost;

                            return (
                              <div
                                key={it.packagingId}
                                className="flex items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate block">
                                    {it.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    Custo unitário: {formatBRL(it.unitCost)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="1"
                                      value={it.quantity}
                                      onChange={(e) =>
                                        handleUpdatePackagingQty(it.packagingId, parseInt(e.target.value, 10) || 1)
                                      }
                                      className="w-14 px-2 py-1 text-right bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs"
                                    />
                                    <span className="text-[11px] font-bold text-slate-500">un</span>
                                  </div>

                                  <div className="w-20 text-right">
                                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                                      {formatBRL(lineCost)}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemovePackaging(it.packagingId)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                    title="Remover embalagem"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Subtotal da Coluna */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 font-bold">
                        <span className="text-slate-500 text-[11px]">Subtotal Embalagens:</span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {formatBRL(calculatedPackTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. BARRA DE RESUMO EM TEMPO REAL & AÇÕES */}
              <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Custo Direto Real</span>
                    <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
                      {formatBRL(calculatedDirectCost)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Preço de Venda</span>
                    <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {formatBRL(basePriceNum)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Lucro Bruto Unitário</span>
                    <span className={`text-base sm:text-lg font-black ${calculatedProfitBRL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                      {formatBRL(calculatedProfitBRL)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Margem Real Resultante</span>
                    <span className={`text-base sm:text-lg font-black ${calculatedMarginPct >= 30 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                      {calculatedMarginPct}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !createName.trim()}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
                  >
                    {loading ? (
                      <span>Cadastrando...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Cadastrar no Catálogo com Composição</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Gerenciar / Adicionar / Editar Seções Visuais do Catálogo */}
      {showSectionsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-200">
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

      {/* Modal - Ficha Técnica Integrada & Precificação Automática */}
      {selectedProductForFicha && (
        <FichaTecnicaModal
          product={selectedProductForFicha}
          isOpen={!!selectedProductForFicha}
          onClose={() => setSelectedProductForFicha(null)}
          onSaved={(updated) => {
            setProducts((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
            );
            showToast("success", `Ficha técnica e custos de "${updated.name}" atualizados com sucesso!`);
          }}
        />
      )}

      {/* Toast Notificação Personalizada (Casaratech Theme) */}
      {toast && (
        <div
          role="alert"
          className={`fixed top-6 right-6 z-[9999] max-w-md flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
              : toast.type === "error"
              ? "bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
              : toast.type === "warning"
              ? "bg-amber-50/95 dark:bg-amber-950/90 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100"
              : "bg-indigo-50/95 dark:bg-indigo-950/90 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100"
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
            {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          </div>
          <div className="flex-1 text-sm font-semibold leading-relaxed">
            {toast.message}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal de Confirmação Personalizado (Substitui window.confirm) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  confirmModal.variant === "danger"
                    ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                    : confirmModal.variant === "warning"
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                    : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {confirmModal.variant === "danger" ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmModal.variant === "warning" ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {confirmModal.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                {confirmModal.cancelText || "Cancelar"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  await action();
                }}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md transition ${
                  confirmModal.variant === "danger"
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                    : confirmModal.variant === "warning"
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                }`}
              >
                {confirmModal.confirmText || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
