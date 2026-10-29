"use client";

import React, { useState } from "react";
import {
  Boxes,
  Layers,
  Package,
  History,
  AlertTriangle,
  Plus,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Trash2,
  CheckCircle,
  Building2,
  DollarSign,
  TrendingDown,
  X,
  Scale,
  Sparkles,
  Edit2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface EstoqueClientViewProps {
  initialRawMaterials: any[];
  initialPackagings: any[];
  initialProducts: any[];
  initialMovements: any[];
  suppliers: any[];
  costCenters?: any[];
  chartOfAccounts?: any[];
}

export function EstoqueClientView({
  initialRawMaterials,
  initialPackagings,
  initialProducts,
  initialMovements,
  suppliers,
  costCenters = [],
  chartOfAccounts = [],
}: EstoqueClientViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "MATERIAS_PRIMAS" | "EMBALAGENS" | "PRODUTOS_ACABADOS" | "MOVIMENTACOES" | "ALERTAS"
  >("MATERIAS_PRIMAS");

  const [rawMaterials, setRawMaterials] = useState<any[]>(initialRawMaterials);
  const [packagings, setPackagings] = useState<any[]>(initialPackagings);
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [movements, setMovements] = useState<any[]>(initialMovements);
  const [search, setSearch] = useState("");

  // Modais
  const [showRawModal, setShowRawModal] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<any | null>(null);
  const [movementItemType, setMovementItemType] = useState<"MATERIA_PRIMA" | "EMBALAGEM" | "PRODUTO_ACABADO">("MATERIA_PRIMA");

  // Form states - Movimentação
  const [moveType, setMoveType] = useState<"ENTRADA" | "SAIDA" | "AJUSTE" | "PERDA">("ENTRADA");
  const [moveQuantity, setMoveQuantity] = useState("");
  const [moveInputUnit, setMoveInputUnit] = useState("G");
  const [moveOrigin, setMoveOrigin] = useState("MANUAL");
  const [moveDocRef, setMoveDocRef] = useState("");
  const [moveNotes, setMoveNotes] = useState("");
  const [savingMove, setSavingMove] = useState(false);

  // Form states - Novo Insumo
  const [rawName, setRawName] = useState("");
  const [rawCode, setRawCode] = useState("");
  const [rawCategory, setRawCategory] = useState("CERA");
  const [rawUnit, setRawUnit] = useState("KG");
  const [rawCurrentStock, setRawCurrentStock] = useState("0");
  const [rawMinStock, setRawMinStock] = useState("5");
  const [rawUnitCost, setRawUnitCost] = useState("0");
  const [rawCostCenterId, setRawCostCenterId] = useState("");
  const [rawChartOfAccountId, setRawChartOfAccountId] = useState("");
  const [rawSupplierId, setRawSupplierId] = useState("");
  const [savingRaw, setSavingRaw] = useState(false);

  // Form states - Nova Embalagem
  const [packName, setPackName] = useState("");
  const [packCode, setPackCode] = useState("");
  const [packUnit, setPackUnit] = useState("UN");
  const [packCurrentStock, setPackCurrentStock] = useState("0");
  const [packMinStock, setPackMinStock] = useState("20");
  const [packUnitCost, setPackUnitCost] = useState("0");
  const [packCostCenterId, setPackCostCenterId] = useState("");
  const [packChartOfAccountId, setPackChartOfAccountId] = useState("");
  const [packSupplierId, setPackSupplierId] = useState("");
  const [savingPack, setSavingPack] = useState(false);

  // Form states - Editar Item Existente
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editingItemType, setEditingItemType] = useState<"MATERIA_PRIMA" | "EMBALAGEM">("MATERIA_PRIMA");
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editUnit, setEditUnit] = useState("UN");
  const [editMinStock, setEditMinStock] = useState("");
  const [editUnitCost, setEditUnitCost] = useState("");
  const [editCostCenterId, setEditCostCenterId] = useState("");
  const [editChartOfAccountId, setEditChartOfAccountId] = useState("");
  const [editSupplierId, setEditSupplierId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Cálculos de Totais
  const totalRawValue = rawMaterials.reduce(
    (acc, m) => acc + Number(m.currentStock) * Number(m.unitCost),
    0
  );
  const totalPackValue = packagings.reduce(
    (acc, p) => acc + Number(p.currentStock) * Number(p.unitCost),
    0
  );
  const totalProdValue = products.reduce(
    (acc, pr) => acc + Number(pr.stockQuantity) * Number(pr.calculatedCost || pr.basePrice),
    0
  );
  const totalInventoryValue = totalRawValue + totalPackValue + totalProdValue;

  const lowStockRaw = rawMaterials.filter((m) => Number(m.currentStock) <= Number(m.minStock));
  const lowStockPack = packagings.filter((p) => Number(p.currentStock) <= Number(p.minStock));
  const lowStockProd = products.filter((pr) => Number(pr.stockQuantity) <= Number(pr.minStockQuantity));
  const totalAlerts = lowStockRaw.length + lowStockPack.length + lowStockProd.length;

  const handleOpenMovement = (item: any, type: "MATERIA_PRIMA" | "EMBALAGEM" | "PRODUTO_ACABADO", defaultMoveType: "ENTRADA" | "SAIDA" | "AJUSTE" | "PERDA" = "ENTRADA") => {
    setSelectedItemForMovement(item);
    setMovementItemType(type);
    setMoveType(defaultMoveType);
    setMoveQuantity("");
    setMoveDocRef("");
    setMoveNotes("");
    setMoveOrigin(defaultMoveType === "PERDA" ? "PERDA" : defaultMoveType === "AJUSTE" ? "AJUSTE" : "MANUAL");

    if (type === "MATERIA_PRIMA") {
      setMoveInputUnit(item.unit.toUpperCase() === "KG" ? "G" : item.unit.toUpperCase() === "L" ? "ML" : item.unit);
    } else {
      setMoveInputUnit(item.unit || "UN");
    }
    setShowMovementModal(true);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForMovement || !moveQuantity) return;

    setSavingMove(true);
    try {
      const res = await fetch("/api/estoque/movimentacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: movementItemType,
          itemId: selectedItemForMovement.id,
          movementType: moveType,
          quantity: parseFloat(moveQuantity),
          inputUnit: moveInputUnit,
          origin: moveOrigin,
          documentReference: moveDocRef,
          notes: moveNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar movimentação");

      // Atualiza lista local
      if (movementItemType === "MATERIA_PRIMA") {
        setRawMaterials((prev) =>
          prev.map((m) => {
            if (m.id === selectedItemForMovement.id) {
              let qty = parseFloat(moveQuantity);
              if (m.unit.toUpperCase() === "KG" && moveInputUnit.toUpperCase() === "G") qty /= 1000;
              if (m.unit.toUpperCase() === "L" && moveInputUnit.toUpperCase() === "ML") qty /= 1000;
              const newStk = moveType === "ENTRADA" ? m.currentStock + qty : moveType === "AJUSTE" ? qty : m.currentStock - qty;
              return { ...m, currentStock: newStk };
            }
            return m;
          })
        );
      } else if (movementItemType === "EMBALAGEM") {
        setPackagings((prev) =>
          prev.map((p) => {
            if (p.id === selectedItemForMovement.id) {
              const qty = parseInt(moveQuantity, 10);
              const newStk = moveType === "ENTRADA" ? p.currentStock + qty : moveType === "AJUSTE" ? qty : p.currentStock - qty;
              return { ...p, currentStock: newStk };
            }
            return p;
          })
        );
      } else {
        setProducts((prev) =>
          prev.map((pr) => {
            if (pr.id === selectedItemForMovement.id) {
              const qty = parseInt(moveQuantity, 10);
              const newStk = moveType === "ENTRADA" ? pr.stockQuantity + qty : moveType === "AJUSTE" ? qty : pr.stockQuantity - qty;
              return { ...pr, stockQuantity: newStk };
            }
            return pr;
          })
        );
      }

      setMovements((prev) => [data.movement, ...prev]);
      setShowMovementModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingMove(false);
    }
  };

  const handleCreateRaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawName.trim()) return;

    setSavingRaw(true);
    try {
      const res = await fetch("/api/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "MATERIA_PRIMA",
          name: rawName,
          code: rawCode,
          category: rawCategory,
          unit: rawUnit,
          currentStock: parseFloat(rawCurrentStock) || 0,
          minStock: parseFloat(rawMinStock) || 0,
          unitCost: parseFloat(rawUnitCost) || 0,
          costCenterId: rawCostCenterId || null,
          chartOfAccountId: rawChartOfAccountId || null,
          supplierId: rawSupplierId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar insumo");

      setRawMaterials((prev) => [...prev, data.item].sort((a, b) => a.name.localeCompare(b.name)));
      setShowRawModal(false);
      // Limpa campos
      setRawName("");
      setRawCode("");
      setRawCurrentStock("0");
      setRawMinStock("5");
      setRawUnitCost("0");
      setRawCostCenterId("");
      setRawChartOfAccountId("");
      setRawSupplierId("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingRaw(false);
    }
  };

  const handleCreatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName.trim()) return;

    setSavingPack(true);
    try {
      const res = await fetch("/api/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "EMBALAGEM",
          name: packName,
          code: packCode,
          unit: packUnit,
          currentStock: parseInt(packCurrentStock, 10) || 0,
          minStock: parseInt(packMinStock, 10) || 0,
          unitCost: parseFloat(packUnitCost) || 0,
          costCenterId: packCostCenterId || null,
          chartOfAccountId: packChartOfAccountId || null,
          supplierId: packSupplierId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar embalagem");

      setPackagings((prev) => [...prev, data.item].sort((a, b) => a.name.localeCompare(b.name)));
      setShowPackModal(false);
      // Limpa campos
      setPackName("");
      setPackCode("");
      setPackCurrentStock("0");
      setPackMinStock("20");
      setPackUnitCost("0");
      setPackCostCenterId("");
      setPackChartOfAccountId("");
      setPackSupplierId("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPack(false);
    }
  };

  const handleOpenEdit = (item: any, type: "MATERIA_PRIMA" | "EMBALAGEM") => {
    setEditingItem(item);
    setEditingItemType(type);
    setEditName(item.name || "");
    setEditCode(item.code || "");
    setEditCategory(item.category || (type === "MATERIA_PRIMA" ? "CERA" : "EMBALAGEM"));
    setEditUnit(item.unit || "UN");
    setEditMinStock(String(item.minStock || 0));
    setEditUnitCost(String(item.unitCost || 0));
    setEditCostCenterId(item.costCenterId || "");
    setEditChartOfAccountId(item.chartOfAccountId || "");
    setEditSupplierId(item.supplierId || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/estoque", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          itemType: editingItemType,
          name: editName,
          code: editCode,
          category: editCategory,
          unit: editUnit,
          minStock: parseFloat(editMinStock) || 0,
          unitCost: parseFloat(editUnitCost) || 0,
          costCenterId: editCostCenterId || null,
          chartOfAccountId: editChartOfAccountId || null,
          supplierId: editSupplierId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar item");

      if (editingItemType === "MATERIA_PRIMA") {
        setRawMaterials((prev) =>
          prev.map((m) => (m.id === editingItem.id ? data.item : m)).sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        setPackagings((prev) =>
          prev.map((p) => (p.id === editingItem.id ? data.item : p)).sort((a, b) => a.name.localeCompare(b.name))
        );
      }

      setEditingItem(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Patrimônio em Estoque</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatBRL(totalInventoryValue)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Insumos + Embalagens + Acabados</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Matérias-Primas</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatBRL(totalRawValue)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{rawMaterials.length} itens cadastrados</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Embalagens & Caixas</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{formatBRL(totalPackValue)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{packagings.length} recipientes cadastrados</p>
        </div>

        <div className={`border rounded-2xl p-5 shadow-sm ${
          totalAlerts > 0
            ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Alertas de Reposição</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{totalAlerts}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Abaixo ou no limite mínimo</p>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab("MATERIAS_PRIMAS")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
              activeTab === "MATERIAS_PRIMAS"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Matérias-Primas ({rawMaterials.length})
          </button>
          <button
            onClick={() => setActiveTab("EMBALAGENS")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
              activeTab === "EMBALAGENS"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Embalagens ({packagings.length})
          </button>
          <button
            onClick={() => setActiveTab("PRODUTOS_ACABADOS")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
              activeTab === "PRODUTOS_ACABADOS"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Produtos Acabados ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("MOVIMENTACOES")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
              activeTab === "MOVIMENTACOES"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Movimentações ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab("ALERTAS")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
              activeTab === "ALERTAS"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm font-bold"
                : "text-rose-500 hover:text-rose-700"
            }`}
          >
            Alertas ({totalAlerts})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {activeTab === "MATERIAS_PRIMAS" && (
            <button
              onClick={() => setShowRawModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Insumo
            </button>
          )}

          {activeTab === "EMBALAGENS" && (
            <button
              onClick={() => setShowPackModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Embalagem
            </button>
          )}
        </div>
      </div>

      {/* 1. ABA: MATÉRIAS-PRIMAS */}
      {activeTab === "MATERIAS_PRIMAS" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Insumo</th>
                  <th className="px-6 py-4">Fornecedor</th>
                  <th className="px-6 py-4 text-center">Unidade</th>
                  <th className="px-6 py-4 text-right">Custo Unitário</th>
                  <th className="px-6 py-4 text-right">Estoque Mínimo</th>
                  <th className="px-6 py-4 text-right">Saldo Atual</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-right">Ações de Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {rawMaterials
                  .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
                  .map((mat) => {
                    const isLow = Number(mat.currentStock) <= Number(mat.minStock);
                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{mat.name}</div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {mat.code && <span className="text-[10px] font-mono text-slate-400">Cód: {mat.code}</span>}
                            {mat.costCenter && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                {mat.costCenter.name}
                              </span>
                            )}
                            {mat.chartOfAccount && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                {mat.chartOfAccount.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {mat.supplier ? mat.supplier.name : <span className="italic text-slate-400">-</span>}
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-xs">{mat.unit}</td>
                        <td className="px-6 py-4 text-right font-mono">{formatBRL(Number(mat.unitCost))}</td>
                        <td className="px-6 py-4 text-right font-mono text-slate-400">
                          {Number(mat.minStock).toFixed(2)} {mat.unit}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold">
                          <span className={isLow ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {Number(mat.currentStock).toFixed(2)} {mat.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {formatBRL(Number(mat.currentStock) * Number(mat.unitCost))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(mat, "MATERIA_PRIMA")}
                              title="Editar Insumo (Dados, Centro de Custo e Categoria)"
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenMovement(mat, "MATERIA_PRIMA", "ENTRADA")}
                              title="Adicionar Entrada Manual"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                            >
                              <ArrowDownCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenMovement(mat, "MATERIA_PRIMA", "PERDA")}
                              title="Registrar Perda / Descarte"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenMovement(mat, "MATERIA_PRIMA", "AJUSTE")}
                              title="Ajuste de Balanço / Inventário"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ABA: EMBALAGENS */}
      {activeTab === "EMBALAGENS" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Embalagem / Recipiente</th>
                  <th className="px-6 py-4">Fornecedor</th>
                  <th className="px-6 py-4 text-center">Unidade</th>
                  <th className="px-6 py-4 text-right">Custo Unitário</th>
                  <th className="px-6 py-4 text-right">Estoque Mínimo</th>
                  <th className="px-6 py-4 text-right">Saldo Atual</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-right">Ações de Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {packagings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      Nenhuma embalagem cadastrada. Clique em "Nova Embalagem" acima para começar.
                    </td>
                  </tr>
                ) : (
                  packagings
                    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                    .map((pack) => {
                      const isLow = pack.currentStock <= pack.minStock;
                      return (
                        <tr key={pack.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{pack.name}</div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {pack.code && <span className="text-[10px] font-mono text-slate-400">Cód: {pack.code}</span>}
                              {pack.costCenter && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                  {pack.costCenter.name}
                                </span>
                              )}
                              {pack.chartOfAccount && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                  {pack.chartOfAccount.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {pack.supplier ? pack.supplier.name : <span className="italic text-slate-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-xs">{pack.unit}</td>
                          <td className="px-6 py-4 text-right font-mono">{formatBRL(Number(pack.unitCost))}</td>
                          <td className="px-6 py-4 text-right font-mono text-slate-400">{pack.minStock} {pack.unit}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold">
                            <span className={isLow ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                              {pack.currentStock} {pack.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                            {formatBRL(pack.currentStock * Number(pack.unitCost))}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(pack, "EMBALAGEM")}
                                title="Editar Embalagem (Dados, Centro de Custo e Categoria)"
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenMovement(pack, "EMBALAGEM", "ENTRADA")}
                                title="Entrada de Embalagens"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                              >
                                <ArrowDownCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenMovement(pack, "EMBALAGEM", "PERDA")}
                                title="Descarte / Avaria de Embalagem"
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenMovement(pack, "EMBALAGEM", "AJUSTE")}
                                title="Ajuste de Balanço"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ABA: PRODUTOS ACABADOS */}
      {activeTab === "PRODUTOS_ACABADOS" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Categoria Oficial</th>
                  <th className="px-6 py-4 text-right">Custo de Produção</th>
                  <th className="px-6 py-4 text-right">Preço de Venda</th>
                  <th className="px-6 py-4 text-right">Estoque Mínimo</th>
                  <th className="px-6 py-4 text-right">Estoque Disponível</th>
                  <th className="px-6 py-4 text-right">Valor em Estoque</th>
                  <th className="px-6 py-4 text-right">Ajuste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {products
                  .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                  .map((prod) => {
                    const isLow = prod.stockQuantity <= prod.minStockQuantity;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{prod.name}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {prod.categoryRef ? prod.categoryRef.name : prod.category}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-500">
                          {formatBRL(Number(prod.calculatedCost))}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatBRL(Number(prod.basePrice))}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-400">{prod.minStockQuantity} un</td>
                        <td className="px-6 py-4 text-right font-mono font-bold">
                          <span className={isLow ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {prod.stockQuantity} un
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {formatBRL(prod.stockQuantity * Number(prod.calculatedCost || prod.basePrice))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenMovement(prod, "PRODUTO_ACABADO", "ENTRADA")}
                              title="Adicionar Estoque Acabado"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                            >
                              <ArrowDownCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenMovement(prod, "PRODUTO_ACABADO", "AJUSTE")}
                              title="Ajuste de Balanço"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ABA: MOVIMENTAÇÕES DE ESTOQUE */}
      {activeTab === "MOVIMENTACOES" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Data / Hora</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Item Movimentado</th>
                  <th className="px-6 py-4">Movimento</th>
                  <th className="px-6 py-4 text-right">Quantidade</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4">Origem / Referência</th>
                  <th className="px-6 py-4">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      Nenhuma movimentação de estoque registrada até o momento.
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => {
                    const isEntrada = mov.movementType === "ENTRADA";
                    const isPerda = mov.movementType === "PERDA";
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                          {new Date(mov.date).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {mov.itemType}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{mov.itemName}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isEntrada
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : isPerda
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400"
                            }`}
                          >
                            {isEntrada ? <ArrowDownCircle className="w-3 h-3" /> : isPerda ? <Trash2 className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                            {mov.movementType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold">
                          {isEntrada ? "+" : isPerda ? "-" : ""}{Number(mov.quantity).toFixed(2)} {mov.unit}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs">{formatBRL(Number(mov.totalCost))}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                          {mov.origin} {mov.documentReference ? `(${mov.documentReference})` : ""}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{mov.notes || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ABA: ALERTAS DE REPOSIÇÃO */}
      {activeTab === "ALERTAS" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center gap-3 text-amber-900 dark:text-amber-200 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
              <strong>Necessidade de Compra:</strong> Os itens listados abaixo atingiram ou estão abaixo do estoque mínimo de segurança definido.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matérias-Primas Críticas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3 text-sm">
                <Layers className="w-4 h-4 text-emerald-600" />
                Matérias-Primas Abaixo do Mínimo ({lowStockRaw.length})
              </h3>
              {lowStockRaw.length === 0 ? (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5 py-4">
                  <CheckCircle className="w-4 h-4" /> Todas as matérias-primas com saldo acima do mínimo!
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                  {lowStockRaw.map((mat) => (
                    <div key={mat.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{mat.name}</span>
                        <span className="text-[11px] text-slate-400">Fornecedor: {mat.supplier?.name || "Não informado"}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-600 block">
                          {Number(mat.currentStock).toFixed(2)} / {Number(mat.minStock).toFixed(2)} {mat.unit}
                        </span>
                        <button
                          onClick={() => handleOpenMovement(mat, "MATERIA_PRIMA", "ENTRADA")}
                          className="text-[11px] font-semibold text-indigo-600 hover:underline"
                        >
                          Lançar Entrada
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Embalagens Críticas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3 text-sm">
                <Package className="w-4 h-4 text-blue-600" />
                Embalagens Abaixo do Mínimo ({lowStockPack.length})
              </h3>
              {lowStockPack.length === 0 ? (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5 py-4">
                  <CheckCircle className="w-4 h-4" /> Todas as embalagens com saldo seguro!
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                  {lowStockPack.map((pack) => (
                    <div key={pack.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{pack.name}</span>
                        <span className="text-[11px] text-slate-400">Fornecedor: {pack.supplier?.name || "Não informado"}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-600 block">
                          {pack.currentStock} / {pack.minStock} {pack.unit}
                        </span>
                        <button
                          onClick={() => handleOpenMovement(pack, "EMBALAGEM", "ENTRADA")}
                          className="text-[11px] font-semibold text-indigo-600 hover:underline"
                        >
                          Lançar Entrada
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal - Registrar Movimentação de Estoque */}
      {showMovementModal && selectedItemForMovement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Movimentação de Estoque ({movementItemType})
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {selectedItemForMovement.name}
                </h3>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Tipo de Movimento *
                  </label>
                  <select
                    value={moveType}
                    onChange={(e: any) => setMoveType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="ENTRADA">Entrada (+)</option>
                    <option value="SAIDA">Saída (-)</option>
                    <option value="PERDA">Perda / Descarte (-)</option>
                    <option value="AJUSTE">Ajuste de Balanço (=)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Unidade de Entrada
                  </label>
                  <select
                    value={moveInputUnit}
                    onChange={(e) => setMoveInputUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {movementItemType === "MATERIA_PRIMA" ? (
                      <>
                        <option value="G">Gramas (g) - Auto converte</option>
                        <option value="KG">Quilos (kg)</option>
                        <option value="ML">Mililitros (ml) - Auto converte</option>
                        <option value="L">Litros (L)</option>
                        <option value="UN">Unidades (un)</option>
                      </>
                    ) : (
                      <>
                        <option value="UN">Unidades (un)</option>
                        <option value="CENTO">Cento (100 un)</option>
                        <option value="MILHEIRO">Milheiro (1000 un)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Quantidade *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Ex: 500 para 500g ou 10 para 10 un"
                  value={moveQuantity}
                  onChange={(e) => setMoveQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm text-indigo-600"
                />
                {movementItemType === "MATERIA_PRIMA" && selectedItemForMovement.unit.toUpperCase() === "KG" && moveInputUnit.toUpperCase() === "G" && moveQuantity && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    ↳ Equivale a <strong>{(parseFloat(moveQuantity) / 1000).toFixed(3)} kg</strong> no estoque oficial.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Origem / Motivo
                </label>
                <select
                  value={moveOrigin}
                  onChange={(e) => setMoveOrigin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="MANUAL">Lançamento Manual</option>
                  <option value="COMPRA">Recebimento de Compra</option>
                  <option value="PERDA">Avaria / Quebra / Descarte</option>
                  <option value="DEFEITO_FABRICA">Defeito de Fábrica</option>
                  <option value="INVENTARIO">Contagem Física de Inventário</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Documento ou Referência (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF #1024, Lote #22"
                  value={moveDocRef}
                  onChange={(e) => setMoveDocRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Justificativa da perda, contagem ou lote..."
                  value={moveNotes}
                  onChange={(e) => setMoveNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMove}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  {savingMove ? "Processando..." : "Confirmar Movimentação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Cadastrar Nova Matéria-Prima */}
      {showRawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                Cadastrar Matéria-Prima
              </h3>
              <button onClick={() => setShowRawModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRaw} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Nome do Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cera de Soja Tipo Ecomix"
                  value={rawName}
                  onChange={(e) => setRawName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MP-CERA-01"
                    value={rawCode}
                    onChange={(e) => setRawCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Unidade de Armazenamento *
                  </label>
                  <select
                    value={rawUnit}
                    onChange={(e) => setRawUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="KG">Quilo (kg)</option>
                    <option value="G">Grama (g)</option>
                    <option value="L">Litro (L)</option>
                    <option value="ML">Mililitro (ml)</option>
                    <option value="UN">Unidade (un)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rawCurrentStock}
                    onChange={(e) => setRawCurrentStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rawMinStock}
                    onChange={(e) => setRawMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Custo / Unidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rawUnitCost}
                    onChange={(e) => setRawUnitCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Fornecedor Preferencial
                </label>
                <select
                  value={rawSupplierId}
                  onChange={(e) => setRawSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="">Selecione o fornecedor (opcional)...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Centro de Custo Padrão
                  </label>
                  <select
                    value={rawCostCenterId}
                    onChange={(e) => setRawCostCenterId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Selecione o centro de custo...</option>
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Categoria / Plano de Contas
                  </label>
                  <select
                    value={rawChartOfAccountId}
                    onChange={(e) => setRawChartOfAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Selecione a categoria...</option>
                    {chartOfAccounts.map((ca) => (
                      <option key={ca.id} value={ca.id}>
                        {ca.code ? `[${ca.code}] ` : ""}{ca.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                💡 Ao efetuar a compra em Compras e Suprimentos, o título no Contas a Pagar herdará automaticamente este centro de custo e categoria.
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRawModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingRaw}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  {savingRaw ? "Salvando..." : "Salvar Matéria-Prima"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Cadastrar Nova Embalagem */}
      {showPackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Cadastrar Embalagem / Recipiente
              </h3>
              <button onClick={() => setShowPackModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePack} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Nome da Embalagem / Pote *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Copo de Vidro Nadir Figueiredo 200ml"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: EMB-COP-200"
                    value={packCode}
                    onChange={(e) => setPackCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Unidade
                  </label>
                  <select
                    value={packUnit}
                    onChange={(e) => setPackUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="UN">Unidade (un)</option>
                    <option value="CX">Caixa (cx)</option>
                    <option value="PCT">Pacote (pct)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    value={packCurrentStock}
                    onChange={(e) => setPackCurrentStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    value={packMinStock}
                    onChange={(e) => setPackMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={packUnitCost}
                    onChange={(e) => setPackUnitCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Fornecedor Preferencial
                </label>
                <select
                  value={packSupplierId}
                  onChange={(e) => setPackSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="">Selecione o fornecedor (opcional)...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Centro de Custo Padrão
                  </label>
                  <select
                    value={packCostCenterId}
                    onChange={(e) => setPackCostCenterId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Selecione o centro de custo...</option>
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Categoria / Plano de Contas
                  </label>
                  <select
                    value={packChartOfAccountId}
                    onChange={(e) => setPackChartOfAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Selecione a categoria...</option>
                    {chartOfAccounts.map((ca) => (
                      <option key={ca.id} value={ca.id}>
                        {ca.code ? `[${ca.code}] ` : ""}{ca.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                💡 Ao efetuar a compra em Compras e Suprimentos, o título no Contas a Pagar herdará automaticamente este centro de custo e categoria.
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPackModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPack}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  {savingPack ? "Salvando..." : "Salvar Embalagem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Editar Item de Estoque (Matéria-Prima ou Embalagem) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Editar {editingItemType === "MATERIA_PRIMA" ? "Matéria-Prima" : "Embalagem"}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editingItem.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Unidade
                  </label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="UN">Unidade (un)</option>
                    <option value="KG">Quilo (kg)</option>
                    <option value="G">Grama (g)</option>
                    <option value="L">Litro (L)</option>
                    <option value="ML">Mililitro (ml)</option>
                    <option value="CX">Caixa (cx)</option>
                    <option value="PCT">Pacote (pct)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editUnitCost}
                    onChange={(e) => setEditUnitCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Fornecedor Preferencial
                </label>
                <select
                  value={editSupplierId}
                  onChange={(e) => setEditSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="">Selecione o fornecedor (opcional)...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Centro de Custo Padrão
                  </label>
                  <select
                    value={editCostCenterId}
                    onChange={(e) => setEditCostCenterId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Selecione o centro de custo...</option>
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Categoria / Plano de Contas
                  </label>
                  <select
                    value={editChartOfAccountId}
                    onChange={(e) => setEditChartOfAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">Selecione a categoria...</option>
                    {chartOfAccounts.map((ca) => (
                      <option key={ca.id} value={ca.id}>
                        {ca.code ? `[${ca.code}] ` : ""}{ca.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                💡 O centro de custo e a categoria definidos aqui serão preenchidos automaticamente nas compras em Compras e Suprimentos e no Contas a Pagar.
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  {savingEdit ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
