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
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ComprasClientViewProps {
  initialPurchases: any[];
  suppliers: any[];
  rawMaterials: any[];
  packagings: any[];
  costCenters: any[];
  chartOfAccounts: any[];
}

export function ComprasClientView({
  initialPurchases,
  suppliers,
  rawMaterials,
  packagings,
  costCenters,
  chartOfAccounts,
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

  const calculateSubtotal = () => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (Number(freightAmount) || 0);
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
          generatePayables,
          installmentsCount,
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
                        {isPending && (
                          <button
                            onClick={() => handleConfirmReceipt(p)}
                            disabled={actionLoading[p.id]}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {actionLoading[p.id] ? "Atualizando..." : "Confirmar Recebimento"}
                          </button>
                        )}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
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
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="genPay"
                    checked={generatePayables}
                    onChange={(e) => setGeneratePayables(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="genPay" className="font-bold text-slate-900 dark:text-white cursor-pointer">
                    Gerar títulos automaticamente no Contas a Pagar
                  </label>
                </div>

                {generatePayables && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Número de Parcelas
                      </label>
                      <select
                        value={installmentsCount}
                        onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                      >
                        <option value={1}>1x À Vista ({formatBRL(calculateTotal())})</option>
                        <option value={2}>2x Parcelado ({formatBRL(calculateTotal() / 2)} /mês)</option>
                        <option value={3}>3x Parcelado ({formatBRL(calculateTotal() / 3)} /mês)</option>
                        <option value={4}>4x Parcelado ({formatBRL(calculateTotal() / 4)} /mês)</option>
                        <option value={6}>6x Parcelado ({formatBRL(calculateTotal() / 6)} /mês)</option>
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
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl font-bold"
                      />
                    </div>
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
    </div>
  );
}
