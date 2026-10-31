"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  Package,
  Clock,
  Zap,
  Flame,
  Percent,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  FileText,
  ShoppingBag,
  ExternalLink,
  Store,
  CreditCard,
  Globe,
  Tag,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface FichaTecnicaModalProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedProduct: any) => void;
}

export function FichaTecnicaModal({
  product,
  isOpen,
  onClose,
  onSaved,
}: FichaTecnicaModalProps) {
  const [activeTab, setActiveTab] = useState<"INGREDIENTES" | "OPERACIONAL" | "PRECIFICACAO">("INGREDIENTES");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dados carregados da API
  const [availableRawMaterials, setAvailableRawMaterials] = useState<any[]>([]);
  const [availablePackagings, setAvailablePackagings] = useState<any[]>([]);
  const [operationalRates, setOperationalRates] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Estados da Ficha Técnica
  const [expectedYield, setExpectedYield] = useState<number>(1);
  const [wastePercentage, setWastePercentage] = useState<number>(5.0);
  const [preparationMinutes, setPreparationMinutes] = useState<number>(20);
  const [equipmentMinutes, setEquipmentMinutes] = useState<number>(15);
  const [gasMinutes, setGasMinutes] = useState<number>(15);
  const [laborHourlyRate, setLaborHourlyRate] = useState<number>(20.0);
  const [desiredMargin, setDesiredMargin] = useState<number>(50);

  // Itens da receita
  const [recipeItems, setRecipeItems] = useState<
    Array<{
      id?: string;
      rawMaterialId: string;
      inputQuantity: number;
      inputUnit: string;
    }>
  >([]);

  // Embalagens da receita
  const [recipePackagings, setRecipePackagings] = useState<
    Array<{
      id?: string;
      packagingId: string;
      quantity: number;
    }>
  >([]);

  // Drawer para histórico de compras de um item
  const [viewingPurchaseHistory, setViewingPurchaseHistory] = useState<any | null>(null);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  // Carrega ficha técnica e insumos do produto
  useEffect(() => {
    if (!isOpen || !product?.id) return;

    let isMounted = true;
    setLoading(true);
    setFeedback(null);

    fetch(`/api/catalogo/ficha-tecnica?productId=${encodeURIComponent(product.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.error) throw new Error(data.error);

        setAvailableRawMaterials(data.availableRawMaterials || []);
        setAvailablePackagings(data.availablePackagings || []);
        setOperationalRates(data.operationalRates || null);
        setWarnings(data.warnings || []);

        const sheet = data.technicalSheet;
        if (sheet) {
          setExpectedYield(sheet.expectedYield || 1);
          setWastePercentage(Number(sheet.wastePercentage) || 5.0);
          setPreparationMinutes(Number(sheet.preparationMinutes) || 20);
          setEquipmentMinutes(Number(sheet.equipmentMinutes) || 15);
          setGasMinutes(Number(sheet.gasMinutes) || 15);
          setLaborHourlyRate(Number(sheet.laborHourlyRate) || 20.0);

          // Popula itens de matérias-primas
          if (sheet.items && sheet.items.length > 0) {
            setRecipeItems(
              sheet.items.map((it: any) => ({
                id: it.id,
                rawMaterialId: it.rawMaterialId,
                inputQuantity: it.inputQuantity || 0,
                inputUnit: it.inputUnit || it.baseUnit || "G",
              }))
            );
          } else {
            setRecipeItems([]);
          }

          // Popula embalagens
          if (sheet.packagingItems && sheet.packagingItems.length > 0) {
            setRecipePackagings(
              sheet.packagingItems.map((pit: any) => ({
                id: pit.id,
                packagingId: pit.packagingId,
                quantity: pit.quantity || 1,
              }))
            );
          } else {
            setRecipePackagings([]);
          }
        }

        if (data.product?.desiredMargin) {
          setDesiredMargin(Number(data.product.desiredMargin));
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar ficha técnica:", err);
        if (isMounted) setErrorMessage(err.message || "Erro ao carregar dados da ficha técnica");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, product?.id]);

  // Adiciona novo ingrediente
  const handleAddIngredient = () => {
    const firstAvailable = availableRawMaterials[0];
    if (!firstAvailable) {
      setErrorMessage("Nenhuma matéria-prima cadastrada no sistema. Cadastre matérias-primas no módulo de Estoque.");
      return;
    }
    const defaultUnit = firstAvailable.unit?.toUpperCase() === "KG" ? "G" : firstAvailable.unit || "G";
    setRecipeItems([
      ...recipeItems,
      {
        rawMaterialId: firstAvailable.id,
        inputQuantity: 0,
        inputUnit: defaultUnit,
      },
    ]);
  };

  // Remove ingrediente
  const handleRemoveIngredient = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  // Atualiza ingrediente
  const handleUpdateIngredient = (index: number, field: string, val: any) => {
    const updated = [...recipeItems];
    updated[index] = { ...updated[index], [field]: val };

    // Se mudou a matéria-prima, ajusta a unidade padrão
    if (field === "rawMaterialId") {
      const raw = availableRawMaterials.find((r) => r.id === val);
      if (raw) {
        updated[index].inputUnit = raw.unit?.toUpperCase() === "KG" ? "G" : raw.unit || "G";
      }
    }
    setRecipeItems(updated);
  };

  // Adiciona nova embalagem
  const handleAddPackaging = () => {
    const firstAvailable = availablePackagings[0];
    if (!firstAvailable) {
      setErrorMessage("Nenhuma embalagem cadastrada no sistema. Cadastre embalagens no módulo de Estoque.");
      return;
    }
    setRecipePackagings([
      ...recipePackagings,
      {
        packagingId: firstAvailable.id,
        quantity: 1,
      },
    ]);
  };

  // Remove embalagem
  const handleRemovePackaging = (index: number) => {
    setRecipePackagings(recipePackagings.filter((_, i) => i !== index));
  };

  // Atualiza embalagem
  const handleUpdatePackaging = (index: number, field: string, val: any) => {
    const updated = [...recipePackagings];
    updated[index] = { ...updated[index], [field]: val };
    setRecipePackagings(updated);
  };

  // Cálculos dinâmicos em tempo real no cliente
  const calculateLiveTotals = () => {
    let rawMaterialsSubtotal = 0;
    const computedItems = recipeItems.map((it) => {
      const raw = availableRawMaterials.find((r) => r.id === it.rawMaterialId);
      const baseUnit = raw?.unit || "KG";
      const inputUnit = it.inputUnit || baseUnit;
      const inputQty = Number(it.inputQuantity) || 0;

      // Conversão proporcional
      let convertedQty = inputQty;
      if (inputUnit.toUpperCase() === "G" && baseUnit.toUpperCase() === "KG") {
        convertedQty = inputQty / 1000;
      } else if (inputUnit.toUpperCase() === "KG" && baseUnit.toUpperCase() === "G") {
        convertedQty = inputQty * 1000;
      } else if (inputUnit.toUpperCase() === "ML" && baseUnit.toUpperCase() === "L") {
        convertedQty = inputQty / 1000;
      } else if (inputUnit.toUpperCase() === "L" && baseUnit.toUpperCase() === "ML") {
        convertedQty = inputQty * 1000;
      } else if (inputUnit.toUpperCase() === "CM" && baseUnit.toUpperCase() === "M") {
        convertedQty = inputQty / 100;
      } else if (inputUnit.toUpperCase() === "M" && baseUnit.toUpperCase() === "CM") {
        convertedQty = inputQty * 100;
      }

      const unitCost = Number(raw?.costData?.unitCost) || 0;
      const cost = convertedQty * unitCost;
      rawMaterialsSubtotal += cost;

      return {
        ...it,
        raw,
        convertedQty,
        unitCost,
        cost,
      };
    });

    let packagingSubtotal = 0;
    const computedPackagings = recipePackagings.map((pit) => {
      const pack = availablePackagings.find((p) => p.id === pit.packagingId);
      const qty = Number(pit.quantity) || 0;
      const unitCost = Number(pack?.costData?.unitCost) || 0;
      const cost = qty * unitCost;
      packagingSubtotal += cost;

      return {
        ...pit,
        pack,
        qty,
        unitCost,
        cost,
      };
    });

    // Perdas
    const wasteAmount = (rawMaterialsSubtotal + packagingSubtotal) * (wastePercentage / 100);
    const directMaterialsTotal = rawMaterialsSubtotal + packagingSubtotal + wasteAmount;

    // Custos operacionais rateados
    const energyRate = operationalRates?.energyHourlyRate || 1.5;
    const gasRate = operationalRates?.gasHourlyRate || 2.45;

    const laborTotal = (preparationMinutes / 60) * laborHourlyRate;
    const energyTotal = (equipmentMinutes / 60) * energyRate;
    const gasTotal = (gasMinutes / 60) * gasRate;
    const operationalTotal = laborTotal + energyTotal + gasTotal;

    const batchTotalCost = directMaterialsTotal + operationalTotal;
    const units = Math.max(1, expectedYield || 1);
    const unitCost = batchTotalCost / units;

    // Preços sugeridos
    const baseTarget = unitCost * (1 + desiredMargin / 100);
    const channelPricing = [
      {
        key: "DIRETO_PIX",
        name: "Venda Direta / Balcão (PIX)",
        icon: Store,
        feeRate: 0,
        fixedFee: 0,
        suggestedPrice: Number(baseTarget.toFixed(2)),
      },
      {
        key: "CARTAO",
        name: "Cartão de Crédito / Maquininha",
        icon: CreditCard,
        feeRate: 0.035,
        fixedFee: 0,
        suggestedPrice: Number((baseTarget / (1 - 0.035)).toFixed(2)),
      },
      {
        key: "SITE",
        name: "Loja Virtual / Site Próprio",
        icon: Globe,
        feeRate: 0.05,
        fixedFee: 0,
        suggestedPrice: Number((baseTarget / (1 - 0.05)).toFixed(2)),
      },
      {
        key: "SHOPEE",
        name: "Shopee (Comissão + Frete)",
        icon: Tag,
        feeRate: 0.14,
        fixedFee: 4.0,
        suggestedPrice: Number(((baseTarget + 4.0) / (1 - 0.14)).toFixed(2)),
      },
      {
        key: "MERCADO_LIVRE",
        name: "Mercado Livre",
        icon: ShoppingBag,
        feeRate: 0.16,
        fixedFee: 6.0,
        suggestedPrice: Number(((baseTarget + 6.0) / (1 - 0.16)).toFixed(2)),
      },
    ].map((ch) => {
      const fee = ch.suggestedPrice * ch.feeRate + ch.fixedFee;
      const net = ch.suggestedPrice - fee;
      const profit = net - unitCost;
      const marginPct = net > 0 ? (profit / net) * 100 : 0;
      return {
        ...ch,
        fee,
        net,
        profit,
        marginPct,
      };
    });

    return {
      computedItems,
      computedPackagings,
      rawMaterialsSubtotal,
      packagingSubtotal,
      wasteAmount,
      directMaterialsTotal,
      laborTotal,
      energyTotal,
      gasTotal,
      operationalTotal,
      batchTotalCost,
      unitCost,
      channelPricing,
    };
  };

  const totals = calculateLiveTotals();

  // Salvar Ficha Técnica
  const handleSave = async (applyToProduct = false) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/catalogo/ficha-tecnica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          expectedYield,
          wastePercentage,
          preparationMinutes,
          equipmentMinutes,
          gasMinutes,
          laborHourlyRate,
          items: recipeItems,
          packagingItems: recipePackagings,
          desiredMargin,
          applyToProduct,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar ficha técnica");

      setFeedback(
        applyToProduct
          ? `Ficha técnica salva! Custo unitário atualizado para ${formatBRL(data.unitCost)} e Preço Oficial definido em ${formatBRL(data.suggestedPrice)}!`
          : `Ficha técnica salva com sucesso! Custo unitário calculado em ${formatBRL(data.unitCost)}.`
      );

      onSaved({
        ...product,
        calculatedCost: data.unitCost,
        basePrice: applyToProduct ? data.suggestedPrice : product.basePrice,
        desiredMargin,
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar ficha técnica");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl relative max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-900/50">
                Ficha Técnica Integrada & Precificação
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Compras • Estoque • Financeiro
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {product.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cálculo automático proporcional de ingredientes, embalagens e rateio operacional real.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2 font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center justify-between font-bold animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-500"
              title="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Warnings / Pendências Alert */}
        {warnings.length > 0 && (
          <div className="mx-6 mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 rounded-xl text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Pendências de Informação no Sistema:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700 dark:text-amber-400">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-950/20 text-xs font-bold">
          <button
            onClick={() => setActiveTab("INGREDIENTES")}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === "INGREDIENTES"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>1. Ingredientes & Embalagens</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded-full">
              {recipeItems.length + recipePackagings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("OPERACIONAL")}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === "OPERACIONAL"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>2. Gastos Operacionais</span>
          </button>

          <button
            onClick={() => setActiveTab("PRECIFICACAO")}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === "PRECIFICACAO"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>3. Custo Total & Preço por Canal</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Buscando custos reais em Compras, Estoque e Financeiro...</p>
            </div>
          ) : (
            <>
              {/* ABA 1: INGREDIENTES E EMBALAGENS */}
              {activeTab === "INGREDIENTES" && (
                <div className="space-y-6">
                  {/* Seção Matérias-Primas */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Matérias-Primas e Ingredientes</span>
                          <span className="text-[11px] font-medium text-slate-400">
                            (Ceras, Essências, Pavios, Resinas, Corantes)
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Selecione o ingrediente e a quantidade utilizada. O custo unitário é apurado automaticamente a partir das compras reais.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddIngredient}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs font-bold transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Ingrediente</span>
                      </button>
                    </div>

                    {recipeItems.length === 0 ? (
                      <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
                        Nenhum ingrediente adicionado à ficha técnica ainda. Clique em "Adicionar Ingrediente" acima.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {recipeItems.map((item, idx) => {
                          const raw = availableRawMaterials.find((r) => r.id === item.rawMaterialId);
                          const computed = totals.computedItems[idx];
                          const costData = raw?.costData;

                          return (
                            <div
                              key={idx}
                              className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              {/* Seletor do Material */}
                              <div className="flex-1 min-w-[200px]">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                  Matéria-Prima
                                </label>
                                <select
                                  value={item.rawMaterialId}
                                  onChange={(e) =>
                                    handleUpdateIngredient(idx, "rawMaterialId", e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                                >
                                  {availableRawMaterials.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name} ({r.category || "Insumo"}) • Estoque: {r.currentStock} {r.unit}
                                    </option>
                                  ))}
                                </select>

                                {/* Badges informativas do material */}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                      costData?.hasRealPurchases
                                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                                        : costData?.unitCost > 0
                                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
                                        : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                                    }`}
                                  >
                                    {costData?.hasRealPurchases
                                      ? `✅ CMP Compras: ${formatBRL(costData.unitCost)} / ${costData.baseUnit}`
                                      : costData?.unitCost > 0
                                      ? `ℹ️ Estoque: ${formatBRL(costData.unitCost)} / ${costData.baseUnit}`
                                      : "⚠️ Sem Custo Cadastrado"}
                                  </span>

                                  {costData?.hasRealPurchases && (
                                    <button
                                      type="button"
                                      onClick={() => setViewingPurchaseHistory(costData)}
                                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                                    >
                                      <span>Ver {costData.purchasesCount} compra(s)</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Quantidade e Unidade */}
                              <div className="flex items-center gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    Quantidade Usada
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.inputQuantity || ""}
                                      onChange={(e) =>
                                        handleUpdateIngredient(idx, "inputQuantity", e.target.value)
                                      }
                                      placeholder="Ex: 25"
                                      className="w-24 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-right text-slate-800 dark:text-slate-100"
                                    />
                                    <select
                                      value={item.inputUnit}
                                      onChange={(e) =>
                                        handleUpdateIngredient(idx, "inputUnit", e.target.value)
                                      }
                                      className="w-16 px-2 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold uppercase text-slate-700 dark:text-slate-300"
                                    >
                                      <option value="G">g</option>
                                      <option value="KG">kg</option>
                                      <option value="ML">ml</option>
                                      <option value="L">l</option>
                                      <option value="UN">un</option>
                                      <option value="CM">cm</option>
                                      <option value="M">m</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Custo Proporcional Resultante */}
                                <div className="text-right pl-3 sm:border-l sm:border-slate-200 dark:sm:border-slate-700 min-w-[110px]">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    Custo Usado
                                  </span>
                                  <span className="text-sm font-black text-slate-900 dark:text-white block">
                                    {formatBRL(computed?.cost || 0)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({computed?.convertedQty?.toFixed(3)} {raw?.unit})
                                  </span>
                                </div>

                                {/* Botão Excluir */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredient(idx)}
                                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition shrink-0"
                                  title="Remover este ingrediente"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Seção Embalagens e Componentes */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Embalagens e Componentes</span>
                          <span className="text-[11px] font-medium text-slate-400">
                            (Potes, Frascos, Tampas, Caixas, Rótulos, Etiquetas)
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Frascos, potes de vidro, tampas, laços e caixas utilizados por unidade ou lote.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPackaging}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs font-bold transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Embalagem</span>
                      </button>
                    </div>

                    {recipePackagings.length === 0 ? (
                      <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
                        Nenhuma embalagem adicionada à ficha técnica ainda.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {recipePackagings.map((pit, idx) => {
                          const pack = availablePackagings.find((p) => p.id === pit.packagingId);
                          const computed = totals.computedPackagings[idx];
                          const costData = pack?.costData;

                          return (
                            <div
                              key={idx}
                              className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex-1 min-w-[200px]">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                  Embalagem / Componente
                                </label>
                                <select
                                  value={pit.packagingId}
                                  onChange={(e) =>
                                    handleUpdatePackaging(idx, "packagingId", e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                                >
                                  {availablePackagings.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} • Estoque: {p.currentStock} {p.unit}
                                    </option>
                                  ))}
                                </select>

                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                      costData?.hasRealPurchases
                                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                                        : costData?.unitCost > 0
                                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
                                        : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                                    }`}
                                  >
                                    {costData?.hasRealPurchases
                                      ? `✅ CMP Compras: ${formatBRL(costData.unitCost)} / ${pack?.unit || "UN"}`
                                      : costData?.unitCost > 0
                                      ? `ℹ️ Estoque: ${formatBRL(costData.unitCost)} / ${pack?.unit || "UN"}`
                                      : "⚠️ Sem Custo Cadastrado"}
                                  </span>

                                  {costData?.hasRealPurchases && (
                                    <button
                                      type="button"
                                      onClick={() => setViewingPurchaseHistory(costData)}
                                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                                    >
                                      <span>Ver {costData.purchasesCount} compra(s)</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    Qtd. Usada ({pack?.unit || "UN"})
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={pit.quantity || ""}
                                    onChange={(e) =>
                                      handleUpdatePackaging(idx, "quantity", e.target.value)
                                    }
                                    className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-right text-slate-800 dark:text-slate-100"
                                  />
                                </div>

                                <div className="text-right pl-3 sm:border-l sm:border-slate-200 dark:sm:border-slate-700 min-w-[110px]">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                    Custo Usado
                                  </span>
                                  <span className="text-sm font-black text-slate-900 dark:text-white block">
                                    {formatBRL(computed?.cost || 0)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({pit.quantity}x {formatBRL(computed?.unitCost || 0)})
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemovePackaging(idx)}
                                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition shrink-0"
                                  title="Remover esta embalagem"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Resumo Parcial de Materiais */}
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Subtotal Materiais Diretos:</span>
                      <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                        {formatBRL(totals.directMaterialsTotal)}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        (Ingredientes: {formatBRL(totals.rawMaterialsSubtotal)} • Embalagens: {formatBRL(totals.packagingSubtotal)} • Perdas: {formatBRL(totals.wasteAmount)})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Margem de Perda / Sobras (%):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        value={wastePercentage}
                        onChange={(e) => setWastePercentage(parseFloat(e.target.value) || 0)}
                        className="w-16 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: GASTOS OPERACIONAIS */}
              {activeTab === "OPERACIONAL" && (
                <div className="space-y-6">
                  {/* Rendimento da Batelada */}
                  <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        Rendimento da Batelada / Lote de Produção
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Quantas unidades do produto acabado são fabricadas com esta receita e tempo operacional.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rendimento:</span>
                      <input
                        type="number"
                        min="1"
                        value={expectedYield}
                        onChange={(e) => setExpectedYield(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl font-black text-center text-sm"
                      />
                      <span className="text-xs font-bold text-slate-500">unidade(s)</span>
                    </div>
                  </div>

                  {/* 1. Energia Elétrica */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            Energia Elétrica (Rateio Automático)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Localiza faturas reais no Financeiro e calcula a parcela atribuída pelo tempo de equipamento.
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                          operationalRates?.energySource === "FINANCEIRO_REAL"
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {operationalRates?.energySource === "FINANCEIRO_REAL"
                          ? `Fatura: ${formatBRL(operationalRates.energyBillAmount)} (${operationalRates.energyBillDescription})`
                          : "Estimativa Padrão"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Tempo de Equipamentos (min)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={equipmentMinutes}
                          onChange={(e) => setEquipmentMinutes(parseInt(e.target.value, 10) || 0)}
                          placeholder="Ex: 15"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Fogão elétrico, mixer, soprador, etc.
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Tarifa Rateada por Hora
                        </label>
                        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-slate-800 dark:text-slate-200">
                          {formatBRL(operationalRates?.energyHourlyRate || 1.5)} / hora
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Base: Fatura ÷ 160h operacionais
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Custo Atribuído à Batelada
                        </label>
                        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl font-black text-amber-800 dark:text-amber-300">
                          {formatBRL(totals.energyTotal)}
                          <span className="text-[10px] font-medium text-slate-500 block">
                            ({formatBRL(totals.energyTotal / expectedYield)} / un)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Gás de Cozinha */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            Gás de Cozinha (Rateio Proporcional)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Localiza despesas de botijão registradas no sistema e calcula o custo por tempo de queima.
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                          operationalRates?.gasSource === "FINANCEIRO_REAL"
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {operationalRates?.gasSource === "FINANCEIRO_REAL"
                          ? `Botijão: ${formatBRL(operationalRates.gasCylinderCost)}`
                          : "Estimativa Padrão"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Tempo de Chama / Banho-Maria (min)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={gasMinutes}
                          onChange={(e) => setGasMinutes(parseInt(e.target.value, 10) || 0)}
                          placeholder="Ex: 15"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Tempo de fogo aceso na receita
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Custo da Chama por Hora
                        </label>
                        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-slate-800 dark:text-slate-200">
                          {formatBRL(operationalRates?.gasHourlyRate || 2.45)} / hora
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Base: Botijão ÷ 45h de queima
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Custo Atribuído à Batelada
                        </label>
                        <div className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl font-black text-rose-800 dark:text-rose-300">
                          {formatBRL(totals.gasTotal)}
                          <span className="text-[10px] font-medium text-slate-500 block">
                            ({formatBRL(totals.gasTotal / expectedYield)} / un)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Mão de Obra */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          Mão de Obra Direta
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Remuneração da artesã / operador pelo tempo dedicado de pesagem, preparo, envase e rotulagem.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Tempo de Fabricação (min)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={preparationMinutes}
                          onChange={(e) => setPreparationMinutes(parseInt(e.target.value, 10) || 0)}
                          placeholder="Ex: 20"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Valor da Hora de Trabalho (R$)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={laborHourlyRate}
                          onChange={(e) => setLaborHourlyRate(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Custo de Mão de Obra
                        </label>
                        <div className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl font-black text-indigo-800 dark:text-indigo-300">
                          {formatBRL(totals.laborTotal)}
                          <span className="text-[10px] font-medium text-slate-500 block">
                            ({formatBRL(totals.laborTotal / expectedYield)} / un)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: PRECIFICAÇÃO E CANAIS DE VENDA */}
              {activeTab === "PRECIFICACAO" && (
                <div className="space-y-6">
                  {/* Resumo Consolidado de Custos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Matérias-Primas
                      </span>
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {formatBRL(totals.rawMaterialsSubtotal)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {formatBRL(totals.rawMaterialsSubtotal / expectedYield)} / un
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Embalagens
                      </span>
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {formatBRL(totals.packagingSubtotal)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {formatBRL(totals.packagingSubtotal / expectedYield)} / un
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Mão de Obra
                      </span>
                      <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                        {formatBRL(totals.laborTotal)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {formatBRL(totals.laborTotal / expectedYield)} / un
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Energia + Gás + Perdas
                      </span>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400">
                        {formatBRL(totals.energyTotal + totals.gasTotal + totals.wasteAmount)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {formatBRL((totals.energyTotal + totals.gasTotal + totals.wasteAmount) / expectedYield)} / un
                      </span>
                    </div>
                  </div>

                  {/* Destaque do Custo Unitário Final */}
                  <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                    <div>
                      <span className="text-xs uppercase font-bold text-indigo-300 tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        Custo Unitário Final Apurado
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl sm:text-4xl font-black">
                          {formatBRL(totals.unitCost)}
                        </span>
                        <span className="text-xs text-indigo-200">
                          por unidade produzida (Lote de {expectedYield} un: {formatBRL(totals.batchTotalCost)})
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs text-right">
                      <span className="text-[10px] uppercase font-bold text-indigo-200 block">
                        Margem Desejada
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={desiredMargin}
                          onChange={(e) => setDesiredMargin(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-white/20 border border-white/30 rounded-lg text-white font-black text-center"
                        />
                        <span className="font-bold text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Matriz de Preço Sugerido por Canal */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span>Preço de Venda Sugerido por Canal de Comercialização</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Cobre as comissões e taxas de cada plataforma para garantir a sua margem de lucro líquida de {desiredMargin}%.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {totals.channelPricing.map((ch) => {
                        const Icon = ch.icon;
                        const isMain = ch.key === "DIRETO_PIX";

                        return (
                          <div
                            key={ch.key}
                            className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                              isMain
                                ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                      isMain
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                                    {ch.name}
                                  </span>
                                </div>
                                {isMain && (
                                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-indigo-600 text-white rounded">
                                    Base
                                  </span>
                                )}
                              </div>

                              <div className="my-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                  Preço Sugerido
                                </span>
                                <span className="text-xl font-black text-slate-900 dark:text-white">
                                  {formatBRL(ch.suggestedPrice)}
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1 text-[11px]">
                              <div className="flex justify-between text-slate-500">
                                <span>Taxa da Plataforma:</span>
                                <span>{formatBRL(ch.fee)} ({ch.feeRate > 0 ? `${ch.feeRate * 100}%` : "0%"} {ch.fixedFee > 0 ? `+ ${formatBRL(ch.fixedFee)}` : ""})</span>
                              </div>
                              <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                                <span>Lucro Líquido:</span>
                                <span>{formatBRL(ch.profit)} ({ch.marginPct.toFixed(1)}%)</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer do Modal com Botões de Ação */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span className="font-bold text-slate-900 dark:text-white">
              Custo Unitário: {formatBRL(totals.unitCost)}
            </span>{" "}
            • Preço Balcão Sugerido:{" "}
            <span className="font-black text-indigo-600 dark:text-indigo-400">
              {formatBRL(totals.channelPricing[0]?.suggestedPrice || 0)}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || loading}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition"
            >
              {saving ? "Salvando..." : "Salvar Ficha Técnica"}
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || loading}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Salvar & Aplicar Preço</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drawer de Histórico de Compras Reais */}
      {viewingPurchaseHistory && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-5 shadow-2xl relative max-h-[80vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Histórico de Compras Reais no Sistema
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {viewingPurchaseHistory.name}
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Custo Médio Ponderado (CMP): {formatBRL(viewingPurchaseHistory.unitCost)} / {viewingPurchaseHistory.baseUnit}
                </span>
              </div>
              <button
                onClick={() => setViewingPurchaseHistory(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 text-xs">
              {viewingPurchaseHistory.purchasesHistory.map((ph: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 dark:text-white">{ph.supplierName}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {new Date(ph.orderDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] flex justify-between">
                    <span>Pedido: {ph.purchaseNumber} {ph.invoiceNumber ? `• NF: ${ph.invoiceNumber}` : ""}</span>
                    <span>Qtd: {ph.quantity} {ph.unit}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300">
                      Custo Unitário Efetivo: {formatBRL(ph.effectiveUnitCost)}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">
                      Total Pago: {formatBRL(ph.totalCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                onClick={() => setViewingPurchaseHistory(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
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
