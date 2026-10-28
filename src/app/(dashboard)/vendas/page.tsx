"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Users,
  Search,
  Sparkles,
  Edit2,
  Ban,
  X,
  Package,
} from "lucide-react";

export default function VendasPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [packagings, setPackagings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal Nova Venda
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [discountAmount, setDiscountAmount] = useState("0");

  // Embalagem para Entrega na Venda
  const [hasPackaging, setHasPackaging] = useState(false);
  const [selectedPackagingId, setSelectedPackagingId] = useState("");
  const [packagingQuantity, setPackagingQuantity] = useState(1);
  const [packagingPrice, setPackagingPrice] = useState("0.00");

  // Modal Edição
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editChannel, setEditChannel] = useState("");
  const [editDiscount, setEditDiscount] = useState("0");
  const [editItems, setEditItems] = useState<{ productId: string; quantity: number; unitPrice: number; productName?: string }[]>([]);
  const [editSelectedProductId, setEditSelectedProductId] = useState("");

  // Itens da Venda
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vendas");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
      if (data.products) {
        setProducts(data.products);
        if (data.products.length > 0 && !selectedProductId) {
          setSelectedProductId(data.products[0].id);
        }
      }
      if (data.customers) {
        setCustomers(data.customers);
        if (data.customers.length > 0 && !customerId) {
          setCustomerId(data.customers[0].id);
        }
      }
      if (data.packagings) {
        setPackagings(data.packagings);
        if (data.packagings.length > 0 && !selectedPackagingId) {
          setSelectedPackagingId(data.packagings[0].id);
        }
      }
    } catch {
      setFeedback("Erro ao carregar dados de vendas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Se já existe, incrementa quantidade
    const existingIndex = items.findIndex((it) => it.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          quantity: 1,
          unitPrice: Number(prod.basePrice),
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, quantity);
    setItems(updated);
  };

  const packagingTotal = hasPackaging
    ? (parseInt(String(packagingQuantity), 10) || 1) * (parseFloat(packagingPrice) || 0)
    : 0;
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const totalSale = Math.max(0, subtotal + packagingTotal - (parseFloat(discountAmount) || 0));

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Adicione pelo menos 1 item ao pedido.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || undefined,
          customerName: !customerId ? newCustomerName : undefined,
          items,
          packagingId: hasPackaging ? selectedPackagingId : undefined,
          packagingQuantity: hasPackaging ? (parseInt(String(packagingQuantity), 10) || 1) : undefined,
          packagingPrice: hasPackaging ? (parseFloat(packagingPrice) || 0) : undefined,
          discountAmount: parseFloat(discountAmount),
          paymentMethod,
          saleDate,
          dueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar venda");

      setOrders([data.order, ...orders]);
      setShowModal(false);
      setItems([]);
      setDiscountAmount("0");
      setHasPackaging(false);
      setPackagingQuantity(1);
      setPackagingPrice("0.00");
      setFeedback(
        `Venda ${data.order.orderNumber} registrada com sucesso! Título a vencer emitido no Contas a Receber.`
      );
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInactivateSale = async (order: any) => {
    if (
      !confirm(
        `Deseja realmente inativar/cancelar a venda ${order.orderNumber}? Os itens vendidos retornarão automaticamente ao estoque e o título no Contas a Receber será cancelado.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/vendas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, action: "inactivate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao inativar venda");

      setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: "CANCELADO" } : o)));
      setFeedback(`Venda ${order.orderNumber} inativada com sucesso! Itens devolvidos ao estoque.`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (order: any) => {
    setEditingOrder(order);
    setEditChannel(order.channel || "Balcão / Instagram");
    setEditDiscount(String(order.discountAmount || 0));
    setEditItems(
      (order.items || []).map((it: any) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        productName: it.product?.name || "Produto",
      }))
    );
    if (products.length > 0) {
      setEditSelectedProductId(products[0].id);
    }
  };

  const handleEditAddItem = () => {
    const prod = products.find((p) => p.id === editSelectedProductId);
    if (!prod) return;

    const existingIndex = editItems.findIndex((it) => it.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...editItems];
      updated[existingIndex].quantity += 1;
      setEditItems(updated);
    } else {
      setEditItems([
        ...editItems,
        {
          productId: prod.id,
          quantity: 1,
          unitPrice: Number(prod.basePrice),
          productName: prod.name,
        },
      ]);
    }
  };

  const handleEditRemoveItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleEditItemQuantityChange = (index: number, quantity: number) => {
    const updated = [...editItems];
    updated[index].quantity = Math.max(1, quantity);
    setEditItems(updated);
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (editItems.length === 0) {
      alert("O pedido deve ter pelo menos 1 item.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/vendas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingOrder.id,
          action: "edit",
          channel: editChannel,
          discountAmount: parseFloat(editDiscount) || 0,
          items: editItems.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações");

      setOrders(orders.map((o) => (o.id === editingOrder.id ? { ...o, ...data.order } : o)));
      setEditingOrder(null);
      setFeedback(`Venda ${data.order.orderNumber} atualizada com sucesso! Itens e estoque atualizados.`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-rose-900/40">
        <div>
          <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Ponto de Venda & Emissão de Títulos</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Vendas de Velas & Resinas — D.A. Com Carinho</h2>
          <p className="text-sm text-rose-200 mt-1 max-w-xl">
            Efetue vendas rápidas selecionando itens do catálogo com baixa automática de estoque
            e emissão imediata do título a vencer no Contas a Receber.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-lg shadow-rose-600/30 text-xs sm:text-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Venda com Título a Vencer</span>
        </button>
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

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Total Faturado em Vendas
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatBRL(totalRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Soma de pedidos D.A. Com Carinho</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vendas Concluídas
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {orders.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Pedidos registrados no ERP</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Títulos a Vencer Emitidos
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {orders.length} títulos
          </div>
          <p className="text-xs text-slate-500 mt-1">Integrados ao Contas a Receber</p>
        </div>
      </div>

      {/* Tabela de Vendas Realizadas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Histórico de Vendas Realizadas ({orders.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Pedido & Data</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Itens Comprados</th>
                <th className="px-5 py-3.5">Canal</th>
                <th className="px-5 py-3.5">Situação</th>
                <th className="px-5 py-3.5 font-bold">Valor Total (R$)</th>
                <th className="px-5 py-3.5">Título a Vencer</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Nenhuma venda registrada ainda. Clique em "+ Nova Venda" para começar.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const rec = o.receivables && o.receivables[0];
                  const isCancelled = o.status === "CANCELADO";

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                        isCancelled ? "opacity-60 bg-slate-50/30 dark:bg-slate-900/30" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className={`font-bold ${isCancelled ? "text-slate-500 line-through" : "text-rose-600 dark:text-rose-400"}`}>
                          {o.orderNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {o.customer?.name}
                        </div>
                        {o.customer?.phone && (
                          <div className="text-[10px] text-slate-400">{o.customer.phone}</div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1 max-w-xs">
                          {o.items?.map((it: any) => (
                            <div key={it.id} className="text-xs text-slate-700 dark:text-slate-300">
                              <span className="font-bold text-slate-900 dark:text-white">{it.quantity}x</span> {it.product?.name} ({formatBRL(Number(it.unitPrice))})
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {o.channel}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isCancelled
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          }`}
                        >
                          {isCancelled ? "CANCELADA / INATIVA" : "CONCLUÍDA"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className={`font-black text-slate-900 dark:text-white text-base ${isCancelled ? "line-through text-slate-400" : ""}`}>
                          {formatBRL(Number(o.totalAmount))}
                        </div>
                        {Number(o.discountAmount) > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Desc: -{formatBRL(Number(o.discountAmount))}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {rec ? (
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === "CANCELADA"
                                  ? "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              {rec.status}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Venc: {new Date(rec.dueDate).toLocaleDateString("pt-BR")} ({rec.paymentType || "PIX"})
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Sem Título / Liquidado</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
                        {!isCancelled && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(o)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                              title="Editar venda"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleInactivateSale(o)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 transition"
                              title="Inativar venda e devolver produtos ao estoque"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Inativar</span>
                            </button>
                          </>
                        )}
                        {isCancelled && (
                          <span className="text-[11px] text-slate-400 italic">Itens devolvidos</span>
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

      {/* Modal - Registrar Nova Venda & Emitir Título [Item 14] */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Ponto de Venda — D.A. Com Carinho
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Registrar Venda & Emitir Título a Vencer
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4 text-xs">
              {/* Cliente e Datas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Selecione o Cliente
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="">Novo Cliente / Consumidor Avulso</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                    ))}
                  </select>
                </div>

                {!customerId && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Nome do Cliente Avulso *
                    </label>
                    <input
                      type="text"
                      required={!customerId}
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                      placeholder="Ex: Maria Eduarda"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Data da Compra *
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Vencimento do Título *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="CARTAO">Cartão de Crédito</option>
                    <option value="DINHEIRO">Dinheiro</option>
                  </select>
                </div>
              </div>

              {/* Seletor de Itens do Catálogo */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider block">
                  Adicionar Produtos do Catálogo à Venda
                </span>

                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatBRL(Number(p.basePrice))} (Estoque: {p.stockQuantity} un)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shrink-0 shadow-sm"
                  >
                    + Adicionar Item
                  </button>
                </div>

                {/* Lista de Itens Adicionados */}
                {items.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 italic">
                    Nenhum produto adicionado ainda. Escolha no catálogo acima.
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    {items.map((it, idx) => {
                      const prod = products.find((p) => p.id === it.productId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {prod?.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Unitário: {formatBRL(it.unitPrice)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 text-[10px]">Qtd:</span>
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) =>
                                  handleItemQuantityChange(idx, parseInt(e.target.value, 10) || 1)
                                }
                                className="w-14 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                              />
                            </div>

                            <span className="font-black text-slate-900 dark:text-white w-20 text-right">
                              {formatBRL(it.quantity * it.unitPrice)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
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

              {/* Campo de Desconto Promocional / Especial (Item 4) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Desconto Especial (R$)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Subtotal dos itens: <strong>{formatBRL(subtotal)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">R$ Desconto:</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-28 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-rose-600 text-right text-xs"
                  />
                </div>
              </div>

              {/* Seção Embalagem para Entrega / Transporte com Baixa Automática de Estoque */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPackaging}
                      onChange={(e) => setHasPackaging(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-indigo-500" />
                      Incluir Embalagem / Sacola / Caixa de Entrega
                    </span>
                  </label>
                  {hasPackaging && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      Baixa automática de estoque
                    </span>
                  )}
                </div>

                {hasPackaging && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Embalagem do Estoque *
                      </label>
                      <select
                        value={selectedPackagingId}
                        onChange={(e) => setSelectedPackagingId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                      >
                        {packagings.length === 0 ? (
                          <option value="">Nenhuma embalagem cadastrada</option>
                        ) : (
                          packagings.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} (Saldo: {pkg.currentStock} {pkg.unit || "un"})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Qtd a Baixar
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={packagingQuantity}
                        onChange={(e) =>
                          setPackagingQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Valor de Venda da Embalagem (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={packagingPrice}
                        onChange={(e) => setPackagingPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs text-indigo-600"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Digite 0,00 para cortesia ou o valor cobrado.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Totalizador da Venda e Emissão de Título */}
              <div className="p-4 bg-gradient-to-br from-rose-500/10 to-indigo-500/10 border-2 border-rose-500/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Emissão Automática de Título Financeiro
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    O título entrará em <strong>Contas a Receber</strong> com vencimento em{" "}
                    <strong>{new Date(dueDate).toLocaleDateString("pt-BR")}</strong>.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Total a Cobrar:
                  </span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {formatBRL(totalSale)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0 || isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? "Registrando Venda..." : "Concluir Venda & Emitir Título"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Editar Venda com opção de adicionar novos itens */}
      {editingOrder && (() => {
        const editSubtotal = editItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
        const editTotalSale = Math.max(0, editSubtotal - (parseFloat(editDiscount) || 0));

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Edição do Pedido
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-rose-500" />
                    Editar Venda {editingOrder.orderNumber}
                  </h3>
                </div>
                <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmEdit} className="space-y-4 text-xs">
                {/* Cliente e Canal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Cliente
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingOrder.customer?.name || "Consumidor Avulso"}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 font-semibold cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Canal de Venda
                    </label>
                    <input
                      type="text"
                      value={editChannel}
                      onChange={(e) => setEditChannel(e.target.value)}
                      placeholder="Ex: Balcão, Instagram, WhatsApp, Feira"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>
                </div>

                {/* Seção de Adicionar Novos Itens e Gerenciar Itens do Pedido */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider block">
                      Itens do Pedido & Adição de Novos Produtos
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {editItems.length} produto(s) no pedido
                    </span>
                  </div>

                  {/* Seletor para adicionar novo item ao pedido */}
                  <div className="flex gap-2">
                    <select
                      value={editSelectedProductId}
                      onChange={(e) => setEditSelectedProductId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatBRL(Number(p.basePrice))} (Estoque: {p.stockQuantity} un)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleEditAddItem}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shrink-0 shadow-sm flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Item</span>
                    </button>
                  </div>

                  {/* Lista de Itens do Pedido */}
                  {editItems.length === 0 ? (
                    <div className="text-center py-4 text-xs text-red-500 font-semibold italic">
                      O pedido precisa de pelo menos 1 item. Adicione um produto acima.
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
                      {editItems.map((it, idx) => {
                        const prod = products.find((p) => p.id === it.productId);
                        const displayName = it.productName || prod?.name || "Produto";
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="font-bold text-slate-900 dark:text-white block truncate">
                                {displayName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Unitário: {formatBRL(it.unitPrice)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-[10px]">Qtd:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={it.quantity}
                                  onChange={(e) =>
                                    handleEditItemQuantityChange(
                                      idx,
                                      parseInt(e.target.value, 10) || 1
                                    )
                                  }
                                  className="w-14 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                                />
                              </div>

                              <span className="font-black text-slate-900 dark:text-white w-20 text-right">
                                {formatBRL(it.quantity * it.unitPrice)}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleEditRemoveItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remover item do pedido"
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

                {/* Desconto */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      Desconto Concedido (R$)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Subtotal dos itens: <strong>{formatBRL(editSubtotal)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">R$ Desconto:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editDiscount}
                      onChange={(e) => setEditDiscount(e.target.value)}
                      className="w-28 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-rose-600 text-right text-xs"
                    />
                  </div>
                </div>

                {/* Totalizador */}
                <div className="p-4 bg-gradient-to-br from-rose-500/10 to-indigo-500/10 border-2 border-rose-500/30 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Novo Total da Venda
                    </span>
                    <p className="text-[11px] text-slate-500">
                      O título a vencer e o estoque serão recalculados.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                      {formatBRL(editTotalSale)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editItems.length === 0 || isSubmitting}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? "Salvando Alterações..." : "Salvar Alterações do Pedido"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
