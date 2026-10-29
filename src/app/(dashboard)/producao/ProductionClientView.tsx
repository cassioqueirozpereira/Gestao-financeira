"use client";

import React, { useState } from "react";
import {
  Plus,
  X,
  Flame,
  ShieldAlert,
  Sparkles,
  AlertCircle,
  Calculator,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  TrendingUp,
  Trash2,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductionClientViewProps {
  initialOrders: any[];
  products?: any[];
  rawMaterials?: any[];
  packagings?: any[];
}

// Catálogo de Vasilhas / Potes com valores médios de mercado
const POTES_CATALOGO = [
  { id: "pote_pate_150", name: "Pote de Vidro Patê 150ml c/ Rolha/Tampa", price: 4.50 },
  { id: "pote_cilindro_200", name: "Pote de Vidro Cilindro 200ml", price: 5.80 },
  { id: "pote_canelado_madeira", name: "Pote Canelado c/ Tampa de Madeira", price: 8.20 },
  { id: "lata_aluminio_100", name: "Lata de Alumínio Decorativa 100ml", price: 3.90 },
  { id: "copo_whisky_300", name: "Copo Whisky 300ml Preto Fosco/Âmbar", price: 9.50 },
  { id: "molde_resina_epoxi", name: "Base/Molde em Resina Epóxi", price: 6.50 },
  { id: "outro_avulso", name: "Outro / Pote Fornecido pelo Cliente", price: 0.00 },
];

export function ProductionClientView({
  initialOrders,
  products = [],
  rawMaterials = [],
  packagings = [],
}: ProductionClientViewProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Informações Gerais do Lote
  const [batchNumber, setBatchNumber] = useState(
    `LOTE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-01`
  );
  const [costCenter, setCostCenter] = useState<"VELAS" | "RESINAS">("VELAS");

  // Lista dinâmica de múltiplos modelos produzidos no lote
  const [producedModels, setProducedModels] = useState<
    Array<{ productId: string; productName: string; quantity: number }>
  >([
    {
      productId: products[0]?.id || "",
      productName: products[0]?.name || "Vela Aromática Artesanal",
      quantity: 10,
    },
  ]);

  // Quantidade total calculada a partir de todos os modelos
  const unitsToProduce = Math.max(
    1,
    producedModels.reduce((acc, m) => acc + (Number(m.quantity) || 0), 0)
  );

  const handleAddModel = () => {
    const nextProd =
      products.find((p) => !producedModels.some((m) => m.productId === p.id)) || products[0];
    if (nextProd) {
      setProducedModels((prev) => [
        ...prev,
        {
          productId: nextProd.id,
          productName: nextProd.name,
          quantity: 5,
        },
      ]);
    }
  };

  const handleRemoveModel = (idx: number) => {
    if (producedModels.length <= 1) return;
    setProducedModels((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleModelChange = (idx: number, field: "productId" | "quantity", val: any) => {
    setProducedModels((prev) => {
      const copy = [...prev];
      if (field === "productId") {
        const p = products.find((prod) => prod.id === val);
        copy[idx] = { ...copy[idx], productId: val, productName: p?.name || "" };
      } else {
        copy[idx] = { ...copy[idx], quantity: Math.max(1, parseInt(val, 10) || 1) };
      }
      return copy;
    });
  };

  // Vínculo aos Insumos do Banco de Dados
  const ceraFromDb = rawMaterials.find(
    (m) => m.name.toLowerCase().includes("cera") || m.category === "CERA"
  );
  const essenciaFromDb = rawMaterials.find(
    (m) =>
      m.name.toLowerCase().includes("essência") ||
      m.name.toLowerCase().includes("essencia") ||
      m.category === "ESSENCIA"
  );
  const pavioFromDb = rawMaterials.find((m) => m.name.toLowerCase().includes("pavio"));

  // 1. CERA (Preço da última compra por kg / 1000g)
  const [ceraId, setCeraId] = useState(ceraFromDb?.id || "");
  const [ceraPurchasePricePerKg, setCeraPurchasePricePerKg] = useState(
    Number(ceraFromDb?.unitCost ? Number(ceraFromDb.unitCost) * 1000 : 40.0)
  );
  const [ceraGramsPerUnit, setCeraGramsPerUnit] = useState(100); // 100g por vela

  // 2. ESSÊNCIA (Preço da última compra por litro / 1000ml)
  const [essenciaId, setEssenciaId] = useState(essenciaFromDb?.id || "");
  const [essenciaPurchasePricePerLiter, setEssenciaPurchasePricePerLiter] = useState(
    Number(essenciaFromDb?.unitCost ? Number(essenciaFromDb.unitCost) * 1000 : 120.0)
  );
  const [essenciaMlPerUnit, setEssenciaMlPerUnit] = useState(10); // 10ml por vela

  // 3. PAVIO & ILHÓS (Unidade)
  const [pavioUnitPrice, setPavioUnitPrice] = useState(
    Number(pavioFromDb?.unitCost || 0.8)
  );

  // 4. CORANTE (Gotas/g)
  const [coranteUnitPrice, setCoranteUnitPrice] = useState(0.2);

  // 5. POTE / VASILHA (Puxado diretamente do estoque de embalagens)
  const defaultPote =
    packagings.find(
      (p) =>
        p.name.toLowerCase().includes("pote") ||
        p.name.toLowerCase().includes("vidro") ||
        p.name.toLowerCase().includes("lata")
    ) || packagings[0];

  const [selectedPoteId, setSelectedPoteId] = useState(defaultPote?.id || "");
  const [customPotePrice, setCustomPotePrice] = useState(
    Number(defaultPote?.unitCost || 5.8)
  );

  // 6. EMBALAGEM DE ENTREGA / TRANSPORTE (Puxada diretamente do estoque)
  const defaultDeliveryPack = packagings.find(
    (p) =>
      p.name.toLowerCase().includes("sacola") ||
      p.name.toLowerCase().includes("caixa") ||
      p.name.toLowerCase().includes("entrega")
  );
  const [deliveryPackagingId, setDeliveryPackagingId] = useState(
    defaultDeliveryPack?.id || ""
  );
  const [deliveryPackagingPrice, setDeliveryPackagingPrice] = useState(
    Number(defaultDeliveryPack?.unitCost || 2.5)
  );
  const [deliveryPackagingQty, setDeliveryPackagingQty] = useState(1);

  // 7. RÓTULO ADICIONAL (se houver)
  const [rotuloEmbalagemPrice, setRotuloEmbalagemPrice] = useState(1.5);

  // 8. INSUMOS FIXOS OPERACIONAIS (Gás, Energia, Mão de Obra, Perda 10%)
  const [gasCost, setGasCost] = useState(0.2);
  const [energyCost, setEnergyCost] = useState(0.45);
  const [laborHours, setLaborHours] = useState(2); // 2 horas de produção
  const laborHourlyRate = 60.0 / 8; // R$ 7,50/h
  const [includeLossMargin, setIncludeLossMargin] = useState(true);

  // CÁLCULOS AUTOMÁTICOS INSTANTÂNEOS
  const ceraPricePerGram = ceraPurchasePricePerKg / 1000;
  const ceraCostTotal = unitsToProduce * ceraGramsPerUnit * ceraPricePerGram;

  const essenciaPricePerMl = essenciaPurchasePricePerLiter / 1000;
  const essenciaCostTotal = unitsToProduce * essenciaMlPerUnit * essenciaPricePerMl;

  const pavioCostTotal = unitsToProduce * pavioUnitPrice;
  const coranteCostTotal = unitsToProduce * coranteUnitPrice;
  const poteCostTotal = selectedPoteId ? unitsToProduce * customPotePrice : 0;
  const deliveryPackCostTotal = deliveryPackagingId
    ? deliveryPackagingQty * deliveryPackagingPrice
    : 0;
  const embalagemCostTotal =
    poteCostTotal + deliveryPackCostTotal + unitsToProduce * rotuloEmbalagemPrice;

  const rawMaterialsSubtotal =
    ceraCostTotal +
    essenciaCostTotal +
    pavioCostTotal +
    coranteCostTotal +
    embalagemCostTotal;

  const technicalLossAmount = includeLossMargin ? rawMaterialsSubtotal * 0.1 : 0;
  const totalRawMaterialsWithLoss = rawMaterialsSubtotal + technicalLossAmount;

  const calculatedLaborCost = laborHours * laborHourlyRate;
  const totalBatchCost =
    totalRawMaterialsWithLoss + gasCost + energyCost + calculatedLaborCost;
  const unitCost = unitsToProduce > 0 ? totalBatchCost / unitsToProduce : 0;
  const suggestedPrice50 = unitCost * 1.5;
  const suggestedPrice100 = unitCost * 2.0;

  const handlePoteSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const packId = e.target.value;
    setSelectedPoteId(packId);
    const found = packagings.find((p) => p.id === packId);
    if (found) {
      setCustomPotePrice(Number(found.unitCost || 0));
    }
  };

  const handleDeliveryPackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const packId = e.target.value;
    setDeliveryPackagingId(packId);
    const found = packagings.find((p) => p.id === packId);
    if (found) {
      setDeliveryPackagingPrice(Number(found.unitCost || 0));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const modelsSummary = producedModels
      .map((m) => `${m.quantity} un de ${m.productName}`)
      .join(", ");

    const notesSummary = `Modelos: [${modelsSummary}] (Total: ${unitsToProduce} un). Cera: ${
      unitsToProduce * ceraGramsPerUnit
    }g (R$ ${ceraCostTotal.toFixed(2)}). Essência: ${
      unitsToProduce * essenciaMlPerUnit
    }ml (R$ ${essenciaCostTotal.toFixed(2)}). Embalagens/Potes: R$ ${embalagemCostTotal.toFixed(
      2
    )}. Perda 10%: R$ ${technicalLossAmount.toFixed(
      2
    )}. Custo Unitário Médio: R$ ${unitCost.toFixed(2)}/peça.`;

    // Constrói consumos reais para dar baixa no estoque
    const ingredientConsumptions: any[] = [];
    if (ceraId) {
      ingredientConsumptions.push({
        rawMaterialId: ceraId,
        quantityUsed: unitsToProduce * ceraGramsPerUnit,
        unit: "G",
        unitCost: ceraPricePerGram * 1000,
      });
    }
    if (essenciaId) {
      ingredientConsumptions.push({
        rawMaterialId: essenciaId,
        quantityUsed: unitsToProduce * essenciaMlPerUnit,
        unit: "ML",
        unitCost: essenciaPricePerMl * 1000,
      });
    }
    if (pavioFromDb) {
      ingredientConsumptions.push({
        rawMaterialId: pavioFromDb.id,
        quantityUsed: unitsToProduce,
        unit: pavioFromDb.unit || "UN",
        unitCost: pavioUnitPrice,
      });
    }

    // Consumo de Vasilha/Pote e Embalagem de Entrega
    const packagingConsumptions: any[] = [];
    if (selectedPoteId) {
      packagingConsumptions.push({
        packagingId: selectedPoteId,
        quantityUsed: unitsToProduce,
        unitCost: customPotePrice,
      });
    }
    if (deliveryPackagingId) {
      packagingConsumptions.push({
        packagingId: deliveryPackagingId,
        quantityUsed: deliveryPackagingQty,
        unitCost: deliveryPackagingPrice,
      });
    }

    try {
      const res = await fetch("/api/producao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchNumber,
          productId: producedModels[0]?.productId || null,
          producedProducts: producedModels,
          costCenter,
          quantityProduced: unitsToProduce,
          materialCost: parseFloat(totalRawMaterialsWithLoss.toFixed(2)),
          packagingCost: parseFloat(embalagemCostTotal.toFixed(2)),
          gasCost: parseFloat(gasCost.toFixed(2)),
          energyCost: parseFloat(energyCost.toFixed(2)),
          laborCost: parseFloat(calculatedLaborCost.toFixed(2)),
          notes: notesSummary,
          ingredientConsumptions,
          packagingConsumptions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar lote");

      setOrders([data.order, ...orders]);
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      {/* Alerta de Governança dos Lotes Históricos */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <strong>Histórico de Produção a Conferir:</strong> Os lotes anteriores de 19/10 e 22/10
          (totalizando R$ 152,18 estimados) são mantidos como dados históricos de referência. O
          cálculo automático agora calcula cada grama de cera, ml de essência e pote com base no custo de compra.
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Total de Lotes Registrados: {orders.length}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
        >
          <Calculator className="w-4 h-4" />
          Novo Lote com Cálculo Automático
        </button>
      </div>

      {/* Grid de Lotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-3 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
            Nenhuma ordem de produção registrada ainda.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {order.costCenter} {order.quantityProduced ? `• ${order.quantityProduced} un` : ""}
                    {order.unitCost > 0 ? ` • ${formatBRL(Number(order.unitCost))}/un` : ""}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {order.batchNumber} {order.product ? `— ${order.product.name}` : ""}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  <Flame className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Matéria-Prima</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatBRL(Number(order.materialCost))}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Mão de Obra</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatBRL(Number(order.laborCost))}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Gás & Energia</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatBRL(Number(order.gasCost) + Number(order.energyCost))}
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-900/40">
                  <span className="text-amber-700 dark:text-amber-400 block text-[10px] font-bold">Custo Total Lote</span>
                  <span className="font-extrabold text-amber-900 dark:text-amber-200">
                    {formatBRL(Number(order.totalCost))}
                  </span>
                </div>
              </div>

              {order.notes && (
                <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                  {order.notes}
                </p>
              )}

              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Data do Lote: {new Date(order.productionDate).toLocaleDateString("pt-BR")}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ficha Validada
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal - Calculadora Dinâmica de Matéria-Prima [Item 9] */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" />
                  Calculadora Dinâmica de Insumos & Matéria-Prima
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Lançar Produção com Custo Automático
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {/* Identificação Básica e Centro de Custo */}
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Centro Operacional
                  </label>
                  <select
                    value={costCenter}
                    onChange={(e: any) => setCostCenter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="VELAS">Velas — D.A. Com Carinho</option>
                    <option value="RESINAS">Resinas — D.A. Com Carinho</option>
                  </select>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Total do Lote</span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {unitsToProduce} un
                  </span>
                </div>
              </div>

              {/* 1. Modelos de Produtos Fabricados neste Lote (Multi-modelos) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider block">
                    1. Modelos Fabricados no Lote ({producedModels.length} {producedModels.length === 1 ? "modelo" : "modelos"})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddModel}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Outro Modelo
                  </button>
                </div>

                <div className="space-y-2">
                  {producedModels.map((model, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-8">
                        <label className="block text-[10px] text-slate-500 mb-0.5">
                          Modelo / Produto do Catálogo
                        </label>
                        {products.length > 0 ? (
                          <select
                            value={model.productId}
                            onChange={(e) => handleModelChange(idx, "productId", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs text-slate-900 dark:text-white"
                          >
                            <option value="">Selecione o produto...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} [{p.category}] (Estoque atual: {p.stockQuantity} un)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Nome do produto"
                            value={model.productName}
                            onChange={(e) => handleModelChange(idx, "productId", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs"
                          />
                        )}
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] text-slate-500 mb-0.5">
                          Qtd Fabricada
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={model.quantity}
                          onChange={(e) => handleModelChange(idx, "quantity", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-extrabold text-amber-600 dark:text-amber-400 text-center text-xs"
                        />
                      </div>

                      <div className="col-span-1 text-right pt-4">
                        {producedModels.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveModel(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                            title="Remover este modelo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Insumos da Vela: Cera & Essência */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider block">
                  2. Cera & Essência Aromática (Regra de Três da Última Compra)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Custo Cera (R$/kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={ceraPurchasePricePerKg}
                      onChange={(e) => setCeraPurchasePricePerKg(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    />
                    <span className="text-[9px] text-slate-400">R$ {ceraPricePerGram.toFixed(4)}/g</span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Gramas por Vela (g)
                    </label>
                    <input
                      type="number"
                      value={ceraGramsPerUnit}
                      onChange={(e) => setCeraGramsPerUnit(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    />
                    <span className="text-[9px] text-amber-600 font-semibold">Total: {formatBRL(ceraCostTotal)}</span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Custo Essência (R$/L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={essenciaPurchasePricePerLiter}
                      onChange={(e) => setEssenciaPurchasePricePerLiter(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    />
                    <span className="text-[9px] text-slate-400">R$ {essenciaPricePerMl.toFixed(4)}/ml</span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Ml Essência por Vela (ml)
                    </label>
                    <input
                      type="number"
                      value={essenciaMlPerUnit}
                      onChange={(e) => setEssenciaMlPerUnit(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    />
                    <span className="text-[9px] text-amber-600 font-semibold">Total: {formatBRL(essenciaCostTotal)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Vasilha / Pote (Puxado do Estoque) e Embalagem de Entrega */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider block">
                  3. Vasilha / Pote & Embalagem de Entrega (Puxados do Estoque)
                </span>

                {/* Vasilha / Pote */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Vasilha / Pote (Item do Estoque) *
                    </label>
                    <select
                      value={selectedPoteId}
                      onChange={handlePoteSelectChange}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Sem pote / Pote fornecido pelo cliente (R$ 0,00)</option>
                      {packagings.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Estoque: {p.currentStock} {p.unit} | Custo: {formatBRL(Number(p.unitCost))}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Valor Unit. Pote (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customPotePrice}
                      onChange={(e) => setCustomPotePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs"
                    />
                    <span className="text-[9px] text-amber-600 font-semibold">Total: {formatBRL(poteCostTotal)}</span>
                  </div>
                </div>

                {/* Embalagem de Entrega / Transporte */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Embalagem para Entrega / Transporte (Item do Estoque)
                    </label>
                    <select
                      value={deliveryPackagingId}
                      onChange={handleDeliveryPackChange}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Nenhuma / Sem embalagem de entrega (R$ 0,00)</option>
                      {packagings.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Estoque: {p.currentStock} {p.unit} | Custo: {formatBRL(Number(p.unitCost))}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Qtd Embalagens
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={deliveryPackagingQty}
                      onChange={(e) => setDeliveryPackagingQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Valor Unit. (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={deliveryPackagingPrice}
                      onChange={(e) => setDeliveryPackagingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs"
                    />
                    <span className="text-[9px] text-amber-600 font-semibold">Total: {formatBRL(deliveryPackCostTotal)}</span>
                  </div>
                </div>

                {/* Pavio, Corante e Rótulo */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Pavio c/ Ilhós (R$/un)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={pavioUnitPrice}
                      onChange={(e) => setPavioUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Corante (R$/un)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={coranteUnitPrice}
                      onChange={(e) => setCoranteUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Rótulo / Adesivo (R$/un)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={rotuloEmbalagemPrice}
                      onChange={(e) => setRotuloEmbalagemPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Operacionais: Gás, Energia, Mão de Obra e Perda 10% */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider block">
                  3. Insumos Operacionais Fixos & Margem de Perda
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Gás por Queima (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={gasCost}
                      onChange={(e) => setGasCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Energia por Lote (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={energyCost}
                      onChange={(e) => setEnergyCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">
                      Horas Trabalhadas (h)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={laborHours}
                      onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                    <span className="text-[9px] text-slate-400">R$ {formatBRL(calculatedLaborCost)}</span>
                  </div>
                  <div className="flex items-center pt-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLossMargin}
                        onChange={(e) => setIncludeLossMargin(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        +10% Perda Técnica (+{formatBRL(technicalLossAmount)})
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* PAINEL DE RESULTADO FINAL DO CUSTO */}
              <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-600/10 to-orange-500/10 border-2 border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Custo Unitário Fabricado:
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatBRL(unitCost)} <span className="text-xs font-normal text-slate-400">/ unidade</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Custo Total do Lote ({unitsToProduce} un):
                    </span>
                    <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                      {formatBRL(totalBatchCost)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/20 flex flex-wrap gap-4 text-[11px]">
                  <span className="text-slate-500">
                    Sugestão de Venda com 50% de Margem: <strong className="text-emerald-600">{formatBRL(suggestedPrice50)}</strong>
                  </span>
                  <span className="text-slate-500">
                    Sugestão de Venda com 100% de Margem: <strong className="text-indigo-600">{formatBRL(suggestedPrice100)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Lote de Produção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
