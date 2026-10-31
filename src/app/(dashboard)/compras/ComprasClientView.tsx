"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Package,
  Calendar,
  DollarSign,
  Layers,
  ArrowRight,
  X,
  Trash2,
  AlertCircle,
  Check,
  Edit2,
  RotateCcw,
  Ban,
  Info,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ComprasClientViewProps {
  initialPurchases: any[];
  suppliers: any[];
  rawMaterials: any[];
  packagings: any[];
  costCenters: any[];
  chartOfAccounts: any[];
  creditCards?: any[];
}

export function ComprasClientView({
  initialPurchases,
  suppliers,
  rawMaterials,
  packagings,
  costCenters,
  chartOfAccounts,
  creditCards = [],
}: ComprasClientViewProps) {
  const router = useRouter();
  const [purchases, setPurchases] = useState<any[]>(initialPurchases);
  const [filterStatus, setFilterStatus] = useState<"TODAS" | "PENDENTE_ENTREGA" | "RECEBIDO" | "CANCELADO">("TODAS");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Modal Novo Pedido de Compra
  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [freightAmount, setFreightAmount] = useState("0");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [generatePayables, setGeneratePayables] = useState(true);
  const [financialDestination, setFinancialDestination] = useState<
    "CONTAS_PAGAR" | "CARTAO_CREDITO" | "NENHUM"
  >("CONTAS_PAGAR");
  const [selectedCreditCardId, setSelectedCreditCardId] = useState(creditCards[0]?.id || "");
  const [cardInstallmentsCount, setCardInstallmentsCount] = useState(1);
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [costCenterId, setCostCenterId] = useState(costCenters[0]?.id || "");
  const [chartOfAccountId, setChartOfAccountId] = useState(chartOfAccounts[0]?.id || "");

  // Lista dinâmica de itens da compra
  const [items, setItems] = useState<any[]>([
    {
      itemType: "MATERIA_PRIMA",
      itemId: rawMaterials[0]?.id || "",
      name: rawMaterials[0]?.name || "",
      quantity: 1,
      unit: rawMaterials[0]?.unit || "KG",
      unitCost: Number(rawMaterials[0]?.unitCost || 0),
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal Edição de Pedido de Compra
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any | null>(null);
  const [editSupplierId, setEditSupplierId] = useState("");
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editFreightAmount, setEditFreightAmount] = useState("0");
  const [editNotes, setEditNotes] = useState("");
  const [editOrderDate, setEditOrderDate] = useState("");
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const handleAddItemRow = () => {
    const defaultRaw = rawMaterials[0];
    if (defaultRaw) {
      setItems((prev) => [
        ...prev,
        {
          itemType: "MATERIA_PRIMA",
          itemId: defaultRaw.id,
          name: defaultRaw.name,
          quantity: 1,
          unit: defaultRaw.unit,
          unitCost: Number(defaultRaw.unitCost || 0),
        },
      ]);
      if (items.length === 0) {
        if (defaultRaw.costCenterId) setCostCenterId(defaultRaw.costCenterId);
        if (defaultRaw.chartOfAccountId) setChartOfAccountId(defaultRaw.chartOfAccountId);
      }
    } else if (packagings[0]) {
      const defaultPack = packagings[0];
      setItems((prev) => [
        ...prev,
        {
          itemType: "EMBALAGEM",
          itemId: defaultPack.id,
          name: defaultPack.name,
          quantity: 1,
          unit: defaultPack.unit,
          unitCost: Number(defaultPack.unitCost || 0),
        },
      ]);
      if (items.length === 0) {
        if (defaultPack.costCenterId) setCostCenterId(defaultPack.costCenterId);
        if (defaultPack.chartOfAccountId) setChartOfAccountId(defaultPack.chartOfAccountId);
      }
    }
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "itemType") {
        item.itemType = value;
        if (value === "MATERIA_PRIMA") {
          const first = rawMaterials[0];
          if (first) {
            item.itemId = first.id;
            item.name = first.name;
            item.unit = first.unit;
            item.unitCost = Number(first.unitCost);
            if (first.costCenterId) setCostCenterId(first.costCenterId);
            if (first.chartOfAccountId) setChartOfAccountId(first.chartOfAccountId);
          }
        } else {
          const first = packagings[0];
          if (first) {
            item.itemId = first.id;
            item.name = first.name;
            item.unit = first.unit;
            item.unitCost = Number(first.unitCost);
            if (first.costCenterId) setCostCenterId(first.costCenterId);
            if (first.chartOfAccountId) setChartOfAccountId(first.chartOfAccountId);
          }
        }
      } else if (field === "itemId") {
        item.itemId = value;
        if (item.itemType === "MATERIA_PRIMA") {
          const found = rawMaterials.find((m) => m.id === value);
          if (found) {
            item.name = found.name;
            item.unit = found.unit;
            item.unitCost = Number(found.unitCost);
            if (found.costCenterId) setCostCenterId(found.costCenterId);
            if (found.chartOfAccountId) setChartOfAccountId(found.chartOfAccountId);
          }
        } else {
          const found = packagings.find((p) => p.id === value);
          if (found) {
            item.name = found.name;
            item.unit = found.unit;
            item.unitCost = Number(found.unitCost);
            if (found.costCenterId) setCostCenterId(found.costCenterId);
            if (found.chartOfAccountId) setChartOfAccountId(found.chartOfAccountId);
          }
        }
      } else {
        item[field] = value;
      }

      updated[index] = item;
      return updated;
    });
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (Number(freightAmount) || 0);
  };

  const selectedCard = creditCards.find((c) => c.id === selectedCreditCardId) || creditCards[0];

  const getCardDuePreview = (card: any) => {
    if (!card) return "-";
    const today = new Date();
    let m = today.getMonth();
    let y = today.getFullYear();
    if (today.getDate() > (card.closingDay || 25)) {
      m += 1;
      if (m > 11) {
        y += 1;
        m = 0;
      }
    }
    const d = new Date(y, m, card.dueDay || 10);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setErrorMsg("Selecione um fornecedor");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Adicione ao menos um item ao pedido");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          freightAmount: parseFloat(freightAmount) || 0,
          invoiceNumber,
          notes,
          items,
          financialDestination,
          generatePayables: financialDestination === "CONTAS_PAGAR",
          creditCardId: financialDestination === "CARTAO_CREDITO" ? selectedCreditCardId : null,
          cardInstallments: cardInstallmentsCount,
          installmentsCount: financialDestination === "CARTAO_CREDITO" ? cardInstallmentsCount : installmentsCount,
          firstDueDate,
          costCenterId,
          chartOfAccountId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar compra");

      setPurchases((prev) => [data.purchase, ...prev]);
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReceipt = async (p: any) => {
    if (!confirm(`Deseja confirmar o RECEBIMENTO FÍSICO da compra ${p.purchaseNumber}? O estoque dos itens será incrementado imediatamente.`)) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [p.id]: true }));
    try {
      const res = await fetch("/api/compras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, action: "RECEIVE" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao confirmar recebimento");

      setPurchases((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, status: "RECEBIDO", deliveryDate: new Date().toISOString() } : item))
      );
      alert("Recebimento físico confirmado! Estoque e movimentações atualizados com sucesso.");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [p.id]: false }));
    }
  };

  const handleRevertReceipt = async (p: any) => {
    if (
      !confirm(
        `Deseja realmente ESTORNAR o recebimento físico da compra ${p.purchaseNumber}?\n\n- O estoque dos itens recebidos será subtraído do estoque atual.\n- O status da compra voltará para 'Pendente de Entrega'.`
      )
    ) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [p.id]: true }));
    try {
      const res = await fetch("/api/compras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, action: "REVERT_RECEIPT" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao estornar recebimento");

      setPurchases((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, status: "PENDENTE_ENTREGA", deliveryDate: null } : item
        )
      );
      alert(data.message || "Recebimento físico estornado com sucesso! O estoque foi regularizado.");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [p.id]: false }));
    }
  };

  const handleCancelPurchase = async (p: any) => {
    if (
      !confirm(
        `Deseja realmente CANCELAR o pedido de compra ${p.purchaseNumber}?\n\nSe houver parcelas geradas no Contas a Pagar em aberto, elas também serão canceladas automaticamente.`
      )
    ) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [p.id]: true }));
    try {
      const res = await fetch("/api/compras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, action: "CANCEL" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cancelar compra");

      setPurchases((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, status: "CANCELADO" } : item))
      );
      alert(data.message || "Pedido de compra cancelado com sucesso!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [p.id]: false }));
    }
  };

  const handleOpenEdit = (p: any) => {
    setEditingPurchase(p);
    setEditSupplierId(p.supplierId || p.supplier?.id || "");
    setEditInvoiceNumber(p.invoiceNumber || "");
    setEditFreightAmount(String(p.freightAmount || 0));
    setEditNotes(p.notes || "");
    setEditOrderDate(p.orderDate ? new Date(p.orderDate).toISOString().slice(0, 10) : "");
    if (p.items && p.items.length > 0) {
      setEditItems(
        p.items.map((it: any) => ({
          itemType: it.itemType,
          itemId: it.itemId,
          name: it.name,
          quantity: Number(it.quantity),
          unit: it.unit,
          unitCost: Number(it.unitCost),
        }))
      );
    } else {
      setEditItems([]);
    }
    setEditErrorMsg(null);
    setShowEditModal(true);
  };

  const handleAddEditItemRow = () => {
    const defaultRaw = rawMaterials[0];
    if (defaultRaw) {
      setEditItems((prev) => [
        ...prev,
        {
          itemType: "MATERIA_PRIMA",
          itemId: defaultRaw.id,
          name: defaultRaw.name,
          quantity: 1,
          unit: defaultRaw.unit,
          unitCost: Number(defaultRaw.unitCost || 0),
        },
      ]);
    } else if (packagings[0]) {
      const defaultPack = packagings[0];
      setEditItems((prev) => [
        ...prev,
        {
          itemType: "EMBALAGEM",
          itemId: defaultPack.id,
          name: defaultPack.name,
          quantity: 1,
          unit: defaultPack.unit,
          unitCost: Number(defaultPack.unitCost || 0),
        },
      ]);
    }
  };

  const handleRemoveEditItemRow = (index: number) => {
    if (editItems.length <= 1) return;
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditItemChange = (index: number, field: string, value: any) => {
    setEditItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "itemType") {
        item.itemType = value;
        if (value === "MATERIA_PRIMA") {
          const first = rawMaterials[0];
          if (first) {
            item.itemId = first.id;
            item.name = first.name;
            item.unit = first.unit;
            item.unitCost = Number(first.unitCost);
          }
        } else {
          const first = packagings[0];
          if (first) {
            item.itemId = first.id;
            item.name = first.name;
            item.unit = first.unit;
            item.unitCost = Number(first.unitCost);
          }
        }
      } else if (field === "itemId") {
        item.itemId = value;
        if (item.itemType === "MATERIA_PRIMA") {
          const found = rawMaterials.find((m) => m.id === value);
          if (found) {
            item.name = found.name;
            item.unit = found.unit;
            item.unitCost = Number(found.unitCost);
          }
        } else {
          const found = packagings.find((p) => p.id === value);
          if (found) {
            item.name = found.name;
            item.unit = found.unit;
            item.unitCost = Number(found.unitCost);
          }
        }
      } else {
        item[field] = value;
      }

      updated[index] = item;
      return updated;
    });
  };

  const calculateEditTotal = () => {
    const sub = editItems.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0),
      0
    );
    return sub + (Number(editFreightAmount) || 0);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    setEditSaving(true);
    setEditErrorMsg(null);

    try {
      const res = await fetch("/api/compras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPurchase.id,
          action: "UPDATE",
          supplierId: editSupplierId,
          invoiceNumber: editInvoiceNumber,
          freightAmount: parseFloat(editFreightAmount) || 0,
          notes: editNotes,
          orderDate: editOrderDate,
          items: editingPurchase.status === "PENDENTE_ENTREGA" ? editItems : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar compra");

      setPurchases((prev) =>
        prev.map((item) => (item.id === editingPurchase.id ? { ...item, ...data.purchase } : item))
      );
      setShowEditModal(false);
      alert("Pedido de compra atualizado com sucesso!");
      router.refresh();
    } catch (err: any) {
      setEditErrorMsg(err.message || "Erro desconhecido");
    } finally {
      setEditSaving(false);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    if (filterStatus !== "TODAS" && p.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = p.purchaseNumber.toLowerCase().includes(q);
      const matchSup = p.supplier?.name.toLowerCase().includes(q);
      const matchNF = p.invoiceNumber?.toLowerCase().includes(q);
      return matchNum || matchSup || matchNF;
    }
    return true;
  });

  const totalPendente = purchases.filter((p) => p.status === "PENDENTE_ENTREGA").length;
  const totalRecebidas = purchases.filter((p) => p.status === "RECEBIDO").length;
  const totalValor = purchases.reduce((acc, p) => acc + Number(p.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Cards Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total de Pedidos</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{purchases.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Compras de insumos e embalagens</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Pendentes de Entrega</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{totalPendente}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Aguardando conferência física</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Recebidas no Estoque</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalRecebidas}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Entrada física confirmada</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Comprado</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatBRL(totalValor)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Integrado a Contas a Pagar</p>
        </div>
      </div>

      {/* Controles de Busca e Botão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número do pedido, fornecedor ou NF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(["TODAS", "PENDENTE_ENTREGA", "RECEBIDO", "CANCELADO"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterStatus === st
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {st === "TODAS"
                  ? "Todas"
                  : st === "PENDENTE_ENTREGA"
                  ? `Pendentes (${totalPendente})`
                  : st === "RECEBIDO"
                  ? `Recebidas (${totalRecebidas})`
                  : "Canceladas"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Pedido de Compra
        </button>
      </div>

      {/* Tabela de Compras */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Pedido / Data</th>
                <th className="px-6 py-4">Fornecedor</th>
                <th className="px-6 py-4">Itens Incluídos</th>
                <th className="px-6 py-4 text-right">Frete</th>
                <th className="px-6 py-4 text-right">Valor Total</th>
                <th className="px-6 py-4 text-center">Status Físico</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Nenhum pedido de compra encontrado.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const isPending = p.status === "PENDENTE_ENTREGA";
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{p.purchaseNumber}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(p.orderDate).toLocaleDateString("pt-BR")}
                          {p.invoiceNumber ? ` • NF: ${p.invoiceNumber}` : ""}
                        </div>
                        {p.accountPayable && (
                          <div className="mt-1">
                            {p.accountPayable.paymentType === "CARTAO" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <CreditCard className="w-3 h-3" />
                                Fatura de Cartão
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                <DollarSign className="w-3 h-3" />
                                Contas a Pagar
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900 dark:text-white block">{p.supplier?.name}</span>
                        {p.supplier?.phone && <span className="text-xs text-slate-400">{p.supplier.phone}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-0.5">
                          {p.items?.map((it: any, i: number) => (
                            <div key={i} className="text-slate-600 dark:text-slate-300">
                              • {it.quantity} {it.unit} de <strong>{it.name}</strong>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">
                        {formatBRL(Number(p.freightAmount))}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatBRL(Number(p.totalAmount))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {p.status === "RECEBIDO" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Recebido no Estoque
                          </span>
                        ) : p.status === "PENDENTE_ENTREGA" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            Pendente de Entrega
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400">
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Botão Editar: para compras ativas (pendentes ou recebidas) */}
                          {p.status !== "CANCELADO" && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              disabled={actionLoading[p.id]}
                              title="Editar dados da compra"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar
                            </button>
                          )}

                          {/* Botões para compra pendente de entrega */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleConfirmReceipt(p)}
                                disabled={actionLoading[p.id]}
                                title="Confirmar entrada física no estoque"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {actionLoading[p.id] ? "Recebendo..." : "Receber"}
                              </button>

                              <button
                                onClick={() => handleCancelPurchase(p)}
                                disabled={actionLoading[p.id]}
                                title="Cancelar pedido de compra e contas vinculadas"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Cancelar
                              </button>
                            </>
                          )}

                          {/* Botão para compra já recebida no estoque */}
                          {p.status === "RECEBIDO" && (
                            <button
                              onClick={() => handleRevertReceipt(p)}
                              disabled={actionLoading[p.id]}
                              title="Estornar recebimento físico e deduzir itens do estoque"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              {actionLoading[p.id] ? "Estornando..." : "Estornar"}
                            </button>
                          )}
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

      {/* Modal - Novo Pedido de Compra */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full h-full sm:max-w-[96vw] sm:max-h-[96vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Novo Pedido de Compra Multi-Item</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Fornecedor *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.tradeName ? `(${s.tradeName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Número da Nota Fiscal (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NF-e 12450"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Valor do Frete (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Tabela de Itens do Pedido */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-[10px] tracking-wider text-slate-500">
                    Itens do Pedido (Matérias-Primas e Embalagens)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-3">
                        <select
                          value={it.itemType}
                          onChange={(e) => handleItemChange(idx, "itemType", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs"
                        >
                          <option value="MATERIA_PRIMA">Insumo / Matéria</option>
                          <option value="EMBALAGEM">Embalagem / Pote</option>
                        </select>
                      </div>

                      <div className="col-span-4">
                        <select
                          value={it.itemId}
                          onChange={(e) => handleItemChange(idx, "itemId", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                        >
                          {it.itemType === "MATERIA_PRIMA"
                            ? rawMaterials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.unit})
                                </option>
                              ))
                            : packagings.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.unit})
                                </option>
                              ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Qtd"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs text-right font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="R$ Unit"
                          value={it.unitCost}
                          onChange={(e) => handleItemChange(idx, "unitCost", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs text-right font-bold text-indigo-600"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                    Total do Pedido (Itens + Frete):
                  </span>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-base">
                    {formatBRL(calculateTotal())}
                  </span>
                </div>
              </div>

              {/* Integração Financeira */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                    Destino Financeiro do Pedido
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Opção 1: Contas a Pagar */}
                    <button
                      type="button"
                      onClick={() => setFinancialDestination("CONTAS_PAGAR")}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                        financialDestination === "CONTAS_PAGAR"
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <DollarSign
                          className={`w-4 h-4 ${
                            financialDestination === "CONTAS_PAGAR" ? "text-indigo-600" : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            financialDestination === "CONTAS_PAGAR"
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {financialDestination === "CONTAS_PAGAR" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        Contas a Pagar
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Boleto, Pix ou Fornecedor
                      </span>
                    </button>

                    {/* Opção 2: Faturas de Cartão de Crédito */}
                    <button
                      type="button"
                      onClick={() => setFinancialDestination("CARTAO_CREDITO")}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                        financialDestination === "CARTAO_CREDITO"
                          ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <CreditCard
                          className={`w-4 h-4 ${
                            financialDestination === "CARTAO_CREDITO" ? "text-purple-600" : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            financialDestination === "CARTAO_CREDITO"
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {financialDestination === "CARTAO_CREDITO" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        Faturas de Cartão
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Cartão corporativo ou pessoal
                      </span>
                    </button>

                    {/* Opção 3: Não gerar financeiro */}
                    <button
                      type="button"
                      onClick={() => setFinancialDestination("NENHUM")}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                        financialDestination === "NENHUM"
                          ? "bg-slate-200/70 dark:bg-slate-800 border-slate-400 ring-2 ring-slate-400/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Ban
                          className={`w-4 h-4 ${
                            financialDestination === "NENHUM"
                              ? "text-slate-700 dark:text-slate-300"
                              : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            financialDestination === "NENHUM"
                              ? "border-slate-600 bg-slate-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {financialDestination === "NENHUM" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        Não Gerar Agora
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Apenas entrada de estoque
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sub-formulário Contas a Pagar */}
                {financialDestination === "CONTAS_PAGAR" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Número de Parcelas
                      </label>
                      <select
                        value={installmentsCount}
                        onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                      >
                        <option value={1}>1x À Vista ({formatBRL(calculateTotal())})</option>
                        <option value={2}>2x de {formatBRL(calculateTotal() / 2)}</option>
                        <option value={3}>3x de {formatBRL(calculateTotal() / 3)}</option>
                        <option value={4}>4x de {formatBRL(calculateTotal() / 4)}</option>
                        <option value={5}>5x de {formatBRL(calculateTotal() / 5)}</option>
                        <option value={6}>6x de {formatBRL(calculateTotal() / 6)}</option>
                        <option value={10}>10x de {formatBRL(calculateTotal() / 10)}</option>
                        <option value={12}>12x de {formatBRL(calculateTotal() / 12)}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Primeiro Vencimento *
                      </label>
                      <input
                        type="date"
                        required
                        value={firstDueDate}
                        onChange={(e) => setFirstDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-formulário Faturas de Cartão de Crédito */}
                {financialDestination === "CARTAO_CREDITO" && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          Cartão de Crédito *
                        </label>
                        {creditCards.length === 0 ? (
                          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-200">
                            Nenhum cartão cadastrado. Cadastre em Financeiro &gt; Faturas de Cartão.
                          </div>
                        ) : (
                          <select
                            required
                            value={selectedCreditCardId}
                            onChange={(e) => setSelectedCreditCardId(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                          >
                            {creditCards.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nickname} ({c.cardBrand}) • Fecha dia {c.closingDay} / Vence dia {c.dueDay}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                          Parcelas no Cartão
                        </label>
                        <select
                          value={cardInstallmentsCount}
                          onChange={(e) => setCardInstallmentsCount(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                        >
                          <option value={1}>1x À Vista ({formatBRL(calculateTotal())})</option>
                          <option value={2}>2x de {formatBRL(calculateTotal() / 2)} /fatura</option>
                          <option value={3}>3x de {formatBRL(calculateTotal() / 3)} /fatura</option>
                          <option value={4}>4x de {formatBRL(calculateTotal() / 4)} /fatura</option>
                          <option value={5}>5x de {formatBRL(calculateTotal() / 5)} /fatura</option>
                          <option value={6}>6x de {formatBRL(calculateTotal() / 6)} /fatura</option>
                          <option value={10}>10x de {formatBRL(calculateTotal() / 10)} /fatura</option>
                          <option value={12}>12x de {formatBRL(calculateTotal() / 12)} /fatura</option>
                        </select>
                      </div>
                    </div>

                    {selectedCard && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="text-purple-950 dark:text-purple-200">
                            <strong>{selectedCard.nickname}</strong>: Fecha dia {selectedCard.closingDay} / Vencimento dia {selectedCard.dueDay}.
                          </span>
                        </div>
                        <span className="font-bold text-purple-700 dark:text-purple-300">
                          1ª Parcela: Vence em {getCardDuePreview(selectedCard)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Observações Gerais da Compra
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções de entrega, contato com a transportadora..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  {saving ? "Salvando Pedido..." : "Emitir Pedido de Compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal - Edição de Pedido de Compra */}
      {showEditModal && editingPurchase && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full h-full sm:max-w-[96vw] sm:max-h-[96vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Editar Pedido: {editingPurchase.purchaseNumber}
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {editErrorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editErrorMsg}</span>
                </div>
              )}

              {editingPurchase.status === "RECEBIDO" && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block">Entrada física já confirmada no estoque</span>
                    <span className="text-[11px] opacity-90">
                      Este pedido já teve os itens lançados no estoque. Aqui você pode alterar a Nota Fiscal e Observações. Para alterar os itens ou quantidades, feche este modal e utilize o botão <strong>Estornar</strong>.
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Fornecedor *
                  </label>
                  <select
                    value={editSupplierId}
                    onChange={(e) => setEditSupplierId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.tradeName ? `(${s.tradeName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Número da Nota Fiscal (NF-e)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NF-e 12450"
                    value={editInvoiceNumber}
                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Data do Pedido
                  </label>
                  <input
                    type="date"
                    value={editOrderDate}
                    onChange={(e) => setEditOrderDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Valor do Frete (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFreightAmount}
                    onChange={(e) => setEditFreightAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                    Status Atual
                  </label>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                    {editingPurchase.status === "RECEBIDO"
                      ? "Recebido no Estoque"
                      : editingPurchase.status === "PENDENTE_ENTREGA"
                      ? "Pendente de Entrega"
                      : "Cancelado"}
                  </div>
                </div>
              </div>

              {/* Tabela de Itens (Editável apenas se PENDENTE_ENTREGA) */}
              {editingPurchase.status === "PENDENTE_ENTREGA" && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[10px] tracking-wider text-slate-500">
                      Itens do Pedido (Matérias-Primas e Embalagens)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEditItemRow}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editItems.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-3">
                          <select
                            value={it.itemType}
                            onChange={(e) => handleEditItemChange(idx, "itemType", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs"
                          >
                            <option value="MATERIA_PRIMA">Insumo / Matéria</option>
                            <option value="EMBALAGEM">Embalagem / Pote</option>
                          </select>
                        </div>

                        <div className="col-span-4">
                          <select
                            value={it.itemId}
                            onChange={(e) => handleEditItemChange(idx, "itemId", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                          >
                            {it.itemType === "MATERIA_PRIMA"
                              ? rawMaterials.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.unit})
                                  </option>
                                ))
                              : packagings.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.unit})
                                  </option>
                                ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Qtd"
                            value={it.quantity}
                            onChange={(e) => handleEditItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs text-right font-bold"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="R$ Unit"
                            value={it.unitCost}
                            onChange={(e) => handleEditItemChange(idx, "unitCost", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs text-right font-bold text-indigo-600"
                          />
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveEditItemRow(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs">
                    <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                      Total Recalculado (Itens + Frete):
                    </span>
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-base">
                      {formatBRL(calculateEditTotal())}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Observações Gerais da Compra
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções de entrega, transportadora, etc..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  {editSaving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
