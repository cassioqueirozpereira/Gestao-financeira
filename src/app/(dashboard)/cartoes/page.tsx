"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
  CheckCircle2,
  AlertCircle,
  Building2,
  CalendarClock,
  Upload,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  FileSpreadsheet,
  X,
  ChevronRight,
  Filter,
  Tag,
} from "lucide-react";

export default function CartoesPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [cardPayables, setCardPayables] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Seleção de Cartão e Aba (Fatura Atual vs Faturas Futuras)
  const [selectedCardId, setSelectedCardId] = useState<string>("TODOS");
  const [activeTab, setActiveTab] = useState<"ATUAL" | "FUTURAS">("ATUAL");

  // Modais
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form states - Compra Cartão
  const [expenseForm, setExpenseForm] = useState({
    cardId: "",
    description: "",
    totalAmount: "",
    installments: "1",
    costCenterId: "",
    chartOfAccountId: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Form states - Novo Cartão
  const [cardForm, setCardForm] = useState({
    nickname: "",
    cardBrand: "Mastercard",
    holderName: "",
    creditLimit: "5000",
    closingDay: "25",
    dueDay: "5",
  });

  // Estados de Importação de Fatura
  const [importCardId, setImportCardId] = useState<string>("");
  const [importDueDate, setImportDueDate] = useState<string>("");
  const [importStep, setImportStep] = useState<"UPLOAD" | "PREVIEW">("UPLOAD");
  const [importRawText, setImportRawText] = useState<string>("");
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cartoes");
      const data = await res.json();
      if (data.cards) {
        setCards(data.cards);
        if (data.cards.length > 0) {
          if (!expenseForm.cardId) {
            setExpenseForm((prev) => ({ ...prev, cardId: data.cards[0].id }));
          }
          if (!importCardId) {
            setImportCardId(data.cards[0].id);
          }
        }
      }
      if (data.cardPayables) setCardPayables(data.cardPayables);
      if (data.costCenters) {
        setCostCenters(data.costCenters);
        if (data.costCenters.length > 0 && !expenseForm.costCenterId) {
          setExpenseForm((prev) => ({ ...prev, costCenterId: data.costCenters[0].id }));
        }
      }
      if (data.chartOfAccounts) {
        setChartOfAccounts(data.chartOfAccounts);
      }
    } catch {
      setFeedback("Erro ao carregar dados dos cartões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cartoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao lançar despesa");

      setShowExpenseModal(false);
      setFeedback(`Compra lançada com sucesso em ${data.createdCount} parcela(s)!`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cartoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_card", ...cardForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar cartão");

      setShowCardModal(false);
      setFeedback("Cartão de crédito cadastrado com sucesso!");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    try {
      const res = await fetch("/api/cartoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCard),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar cartão");

      setEditingCard(null);
      setFeedback("Cartão atualizado com sucesso!");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCard = async (id: string, nickname: string) => {
    if (
      !confirm(
        `Deseja realmente excluir o cartão "${nickname}"? Os lançamentos associados permanecerão no sistema.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/cartoes?cardId=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir cartão");

      setFeedback("Cartão de crédito excluído com sucesso!");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePayable = async (id: string, description: string) => {
    if (!confirm(`Deseja realmente excluir o lançamento "${description}"?`)) return;
    try {
      const res = await fetch(`/api/cartoes?payableId=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir lançamento");

      setFeedback("Lançamento excluído com sucesso!");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Formata data brasileira evitando desvio de fuso horário
  const formatDateBR = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return "-";
    if (typeof dateVal === "string") {
      const str = dateVal.split("T")[0];
      if (str.includes("-")) {
        const [y, m, d] = str.split("-");
        if (y && m && d) return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      }
    }
    const d = new Date(dateVal);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  // Limpa o texto de notas para não duplicar a categoria na descrição da compra
  const cleanNotes = (notes: string | null | undefined) => {
    if (!notes) return null;
    const cleaned = notes
      .replace(/[•\s-]*Categoria:\s*[^•\n\r]*/gi, "")
      .replace(/[•\s-]+$/, "")
      .trim();
    return cleaned || null;
  };

  // Extrai o nome da Categoria de forma resiliente
  const getCategoryName = (item: any) => {
    if (item.chartOfAccount?.name && item.chartOfAccount.name !== "Despesas Operacionais e Administrativas") {
      return item.chartOfAccount.name;
    }
    if (item.notes) {
      const match = item.notes.match(/Categoria:\s*([^•\n\r]+)/i);
      if (match && match[1]?.trim() && match[1].trim() !== "Geral") {
        return match[1].trim();
      }
    }
    return item.chartOfAccount?.name || "Geral";
  };

  // Parser universal de faturas CSV / Extrato
  const parseCsvContent = (content: string) => {
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      alert("Arquivo vazio ou formato inválido.");
      return;
    }

    const headerLine = lines[0];
    const sep = headerLine.includes(";") ? ";" : headerLine.includes("\t") ? "\t" : ",";

    const headers = headerLine
      .split(sep)
      .map((h) =>
        h
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      );

    const dateIdx = headers.findIndex((h) => h.includes("data") || h.includes("date"));
    const descIdx = headers.findIndex(
      (h) =>
        h.includes("desc") ||
        h.includes("estabelec") ||
        h.includes("histor") ||
        h.includes("loja") ||
        h.includes("item")
    );
    const catIdx = headers.findIndex((h) => h.includes("categ") || h.includes("depart"));
    const typeIdx = headers.findIndex((h) => h.includes("tipo") || h.includes("type"));
    const valIdx = headers.findIndex(
      (h) => h.includes("valor") || h.includes("amount") || h.includes("total") || h.includes("preco")
    );
    const instIdx = headers.findIndex(
      (h) => h.includes("parcela") || h.includes("parc") || h.includes("prest")
    );

    const items: any[] = [];
    const defaultCc = costCenters[0]?.id || "";

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (row.length < 2) continue;

      const rawDate = dateIdx >= 0 ? row[dateIdx] : "";
      const rawDesc = descIdx >= 0 ? row[descIdx] : row[1] || `Despesa Linha ${i}`;
      const rawCat = catIdx >= 0 ? (row[catIdx] || "").trim() : "";
      const rawType = typeIdx >= 0 ? row[typeIdx] : "";
      const rawVal = valIdx >= 0 ? row[valIdx] : row[row.length - 1] || "0";
      const rawInst = instIdx >= 0 ? row[instIdx] : "";

      if (!rawDesc && !rawVal) continue;

      // Data (YYYY-MM-DD ou DD/MM/YYYY)
      let parsedDate = new Date().toISOString().split("T")[0];
      if (rawDate) {
        if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
          parsedDate = rawDate.slice(0, 10);
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(rawDate)) {
          const parts = rawDate.split("/");
          parsedDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }

      // Valor (R$ 682,90 / 40,90 / R$ -4.590,15)
      let cleanVal = rawVal.replace(/R\$\s*/gi, "").replace(/\s+/g, "").trim();
      let isNegative = cleanVal.startsWith("-") || cleanVal.includes("-");
      cleanVal = cleanVal.replace(/^-/, "");

      if (cleanVal.includes(",") && cleanVal.includes(".")) {
        cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
      } else if (cleanVal.includes(",")) {
        cleanVal = cleanVal.replace(",", ".");
      }
      const numericVal = parseFloat(cleanVal) || 0;
      const finalVal = isNegative ? -numericVal : numericVal;

      // Detecta pagamentos de fatura ou estornos
      const lowerDesc = rawDesc.toLowerCase();
      const isPayment =
        finalVal < 0 ||
        rawType.toLowerCase().includes("pagamento") ||
        rawType.toLowerCase().includes("receita") ||
        lowerDesc.includes("pagamento de fatura") ||
        lowerDesc.includes("pagamento recebido") ||
        lowerDesc.includes("estorno") ||
        lowerDesc.includes("crédito de fatura");

      // Parcelas ("4 de 12", "1/2", ou dentro da descrição)
      let instNum: number | undefined;
      let totalInst: number | undefined;
      const instStr = rawInst || rawDesc;
      const instMatch = instStr.match(/(\d+)\s*(?:de|\/)\s*(\d+)/i);
      if (instMatch) {
        instNum = parseInt(instMatch[1], 10);
        totalInst = parseInt(instMatch[2], 10);
      }

      // Categoria limpa do CSV
      const cleanCat = rawCat.replace(/^["']|["']$/g, "").trim();

      // Sugestão inteligente de Centro de Custo com base na Categoria e Descrição do CSV
      let matchedCcId = defaultCc;
      const normCat = cleanCat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normDesc = rawDesc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (
        normCat === "d.a" ||
        normCat.includes("d.a") ||
        normDesc.includes("embalaroma") ||
        normDesc.includes("da embalagens") ||
        normDesc.includes("vela") ||
        normDesc.includes("pavio") ||
        normDesc.includes("cera") ||
        normDesc.includes("resina")
      ) {
        const cc = costCenters.find(
          (c) =>
            c.code === "VELAS" ||
            c.code === "DA_VELAS" ||
            c.name.toLowerCase().includes("vela") ||
            c.name.toLowerCase().includes("resina")
        );
        if (cc) matchedCcId = cc.id;
      } else if (
        normCat.includes("assinatur") &&
        (normDesc.includes("adobe") || normDesc.includes("aws") || normDesc.includes("google") || normDesc.includes("chatgpt"))
      ) {
        const cc = costCenters.find((c) => c.code === "SISTEMAS" || c.name.toLowerCase().includes("sistema"));
        if (cc) matchedCcId = cc.id;
      } else {
        const cc = costCenters.find((c) => c.code === "CASA" || c.name.toLowerCase().includes("casa"));
        if (cc) matchedCcId = cc.id;
      }

      items.push({
        id: `csv_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: parsedDate,
        description: rawDesc,
        category: cleanCat || (isPayment ? "Pagamento Fatura" : "Despesa"),
        amount: Math.abs(finalVal),
        installmentNumber: instNum,
        totalInstallments: totalInst,
        costCenterId: matchedCcId,
        isPayment,
        selected: !isPayment,
      });
    }

    if (items.length === 0) {
      alert("Nenhum lançamento foi reconhecido no arquivo.");
      return;
    }

    setParsedItems(items);
    setImportStep("PREVIEW");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportRawText(text);
        parseCsvContent(text);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleConfirmImport = async () => {
    const selected = parsedItems.filter((i) => i.selected && i.amount > 0);
    if (selected.length === 0) {
      alert("Selecione pelo menos um lançamento para importar.");
      return;
    }

    if (!importCardId) {
      alert("Selecione o cartão de crédito de destino.");
      return;
    }

    try {
      setIsImporting(true);
      const res = await fetch("/api/cartoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_invoice",
          cardId: importCardId,
          defaultDueDate: importDueDate || null,
          items: selected,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao importar fatura");

      setShowImportModal(false);
      setParsedItems([]);
      setImportStep("UPLOAD");
      setImportRawText("");
      setFeedback(`Importação concluída! ${data.count} despesa(s) registradas com suas categorias.`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Mês atual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filtragem de lançamentos
  const filteredPayables = cardPayables.filter((p) => {
    if (selectedCardId === "TODOS") return true;
    const card = cards.find((c) => c.id === selectedCardId);
    if (!card) return true;
    return (
      (p.notes && p.notes.toLowerCase().includes(card.nickname.toLowerCase())) ||
      (p.creditCardInvoice && p.creditCardInvoice.creditCardId === selectedCardId)
    );
  });

  // Separação de lançamentos: Fatura Atual vs Faturas Futuras
  const currentInvoicesItems = filteredPayables.filter((p) => {
    const d = new Date(p.dueDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const futureInvoicesItems = filteredPayables.filter((p) => {
    const d = new Date(p.dueDate);
    return d > new Date(currentYear, currentMonth + 1, 0); // Vencimento após o fim do mês atual
  });

  // Agrupamento de Faturas Futuras por Mês/Ano
  const futureGrouped: { [key: string]: { monthName: string; total: number; items: any[] } } = {};
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  futureInvoicesItems.forEach((item) => {
    const d = new Date(item.dueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!futureGrouped[key]) {
      futureGrouped[key] = {
        monthName: `${monthNames[d.getMonth()]} / ${d.getFullYear()}`,
        total: 0,
        items: [],
      };
    }
    futureGrouped[key].total += Number(item.originalAmount);
    futureGrouped[key].items.push(item);
  });

  const currentTotal = currentInvoicesItems.reduce((s, i) => s + Number(i.originalAmount), 0);
  const futureTotal = futureInvoicesItems.reduce((s, i) => s + Number(i.originalAmount), 0);

  const selectedCount = parsedItems.filter((i) => i.selected).length;
  const selectedSum = parsedItems
    .filter((i) => i.selected)
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-900/40">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Gestão de Meios de Pagamento</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Cartões de Crédito & Faturas Futuras</h2>
          <p className="text-sm text-purple-200 mt-1 max-w-xl">
            Acompanhe faturas atuais, projeções de parcelas futuras e importe arquivos CSV ou extratos de cartões com categorização automática da compra.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setImportStep("UPLOAD");
              setShowImportModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 text-xs sm:text-sm transition"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Fatura (CSV)</span>
          </button>
          <button
            onClick={() => setShowCardModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold border border-slate-700 text-xs sm:text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 text-xs sm:text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Compra</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold uppercase text-[10px]">
            Fechar
          </button>
        </div>
      )}

      {/* Cartões Cadastrados com botões de Edição e Exclusão */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.length === 0 ? (
          <div className="col-span-3 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
            Nenhum cartão de crédito cadastrado ainda. Clique em "+ Novo Cartão" para começar.
          </div>
        ) : (
          cards.map((c) => (
            <div
              key={c.id}
              className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
                    {c.cardBrand}
                  </span>
                  <h3 className="text-lg font-bold">{c.nickname}</h3>
                  {c.holderName && (
                    <p className="text-[11px] text-slate-400">Titular: {c.holderName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingCard({ ...c })}
                    title="Editar Cartão"
                    className="p-1.5 bg-slate-800/80 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCard(c.id, c.nickname)}
                    title="Excluir Cartão"
                    className="p-1.5 bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Limite Total:</span>
                  <span className="text-white font-bold">{formatBRL(Number(c.creditLimit))}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Fechamento da Fatura:</span>
                  <span className="text-white font-medium">Dia {c.closingDay}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Vencimento do Boleto:</span>
                  <span className="text-purple-300 font-bold">Dia {c.dueDay}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Filtro por Cartão e Abas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("ATUAL")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeTab === "ATUAL"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Fatura Vigente ({monthNames[currentMonth]})</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
              {formatBRL(currentTotal)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("FUTURAS")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeTab === "FUTURAS"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span>Faturas Futuras (Projetadas)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
              {formatBRL(futureTotal)}
            </span>
          </button>
        </div>

        {cards.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Filtrar por Cartão:</span>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="TODOS">Todos os Cartões</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nickname}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Conteúdo da Aba */}
      {activeTab === "ATUAL" ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Lançamentos da Fatura Vigente ({currentInvoicesItems.length} compras)
            </span>
            <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
              Total Fatura: {formatBRL(currentTotal)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Descrição da Compra</th>
                  <th className="px-5 py-3">Data do Gasto</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Centro de Custo</th>
                  <th className="px-5 py-3">Parcela</th>
                  <th className="px-5 py-3">Vencimento Fatura</th>
                  <th className="px-5 py-3 font-bold text-right">Valor Parcela (R$)</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentInvoicesItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      Nenhuma compra em cartão registrada para este mês vigente.
                    </td>
                  </tr>
                ) : (
                  currentInvoicesItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        {item.description}
                        {cleanNotes(item.notes) && (
                          <p className="text-[10px] text-slate-400 font-normal">{cleanNotes(item.notes)}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                        {formatDateBR(item.competenceDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                          {getCategoryName(item)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                        {item.costCenter?.name || "Geral"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-semibold">
                        {item.installmentNumber
                          ? `${item.installmentNumber}/${item.totalInstallments}`
                          : "À vista"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {formatDateBR(item.dueDate)}
                      </td>
                      <td className="px-5 py-3.5 font-extrabold text-slate-900 dark:text-white text-right">
                        {formatBRL(Number(item.originalAmount))}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleDeletePayable(item.id, item.description)}
                          title="Excluir lançamento"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(futureGrouped).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              Não existem compras parceladas futuras projetadas nos cartões cadastrados.
            </div>
          ) : (
            Object.keys(futureGrouped).map((key) => {
              const group = futureGrouped[key];
              return (
                <div
                  key={key}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Fatura Futura — {group.monthName}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                      Total Projetado: {formatBRL(group.total)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="px-5 py-2.5">Descrição</th>
                          <th className="px-5 py-2.5">Data da Compra</th>
                          <th className="px-5 py-2.5">Categoria</th>
                          <th className="px-5 py-2.5">Centro de Custo</th>
                          <th className="px-5 py-2.5">Parcela</th>
                          <th className="px-5 py-2.5">Vencimento Programado</th>
                          <th className="px-5 py-2.5 font-bold text-right">Valor Parcela (R$)</th>
                          <th className="px-4 py-2.5 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {group.items.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                              {item.description}
                              {cleanNotes(item.notes) && (
                                <p className="text-[10px] text-slate-400 font-normal">
                                  {cleanNotes(item.notes)}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                              {formatDateBR(item.competenceDate)}
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                                {getCategoryName(item)}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-slate-500">
                              {item.costCenter?.name || "Geral"}
                            </td>
                            <td className="px-5 py-3 font-semibold text-purple-600 dark:text-purple-400">
                              {item.installmentNumber}/{item.totalInstallments}
                            </td>
                            <td className="px-5 py-3 text-slate-500">
                              {formatDateBR(item.dueDate)}
                            </td>
                            <td className="px-5 py-3 font-bold text-right text-slate-900 dark:text-white">
                              {formatBRL(Number(item.originalAmount))}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleDeletePayable(item.id, item.description)}
                                title="Excluir lançamento"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal - Importar Fatura (CSV / Extrato) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Importação de Fatura de Cartão de Crédito
                  </h3>
                  <p className="text-xs text-slate-500">
                    Captura automática da Categoria da compra, valores, parcelas e centro de custo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importStep === "UPLOAD" ? (
              <div className="space-y-4 py-4 flex-1 overflow-y-auto text-xs sm:text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Cartão de Crédito de Destino *
                    </label>
                    <select
                      value={importCardId}
                      onChange={(e) => setImportCardId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                    >
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nickname} ({c.cardBrand}) - Fecha dia {c.closingDay} / Vence dia {c.dueDay}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Vencimento Desta Fatura (Opcional)
                    </label>
                    <input
                      type="date"
                      value={importDueDate}
                      onChange={(e) => setImportDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <span className="text-[10px] text-slate-400">
                      Se não preenchido, será calculado automaticamente pelo dia de vencimento do cartão.
                    </span>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:border-purple-500 transition">
                  <Upload className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                  <p className="font-semibold text-slate-800 dark:text-white mb-1">
                    Arraste ou selecione o arquivo CSV da Fatura
                  </p>
                  <p className="text-xs text-slate-400 mb-4">
                    Formatos aceitos: .csv, .txt (colunas detectadas: Data, Descrição, Categoria, Valor, Parcela)
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-md">
                    <span>Selecionar Arquivo CSV</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Ou cole o texto do arquivo CSV / Extrato aqui:
                  </label>
                  <textarea
                    rows={4}
                    value={importRawText}
                    onChange={(e) => setImportRawText(e.target.value)}
                    placeholder="Exemplo: Data;Descrição;Categoria;Valor;Parcela&#10;2026-10-19;SPOTIFY;Assinaturas;40,90;;"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      disabled={!importRawText.trim()}
                      onClick={() => parseCsvContent(importRawText)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold rounded-xl text-xs transition"
                    >
                      Processar Texto Colado
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col text-xs sm:text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = parsedItems.every((i) => i.selected);
                        setParsedItems(parsedItems.map((i) => ({ ...i, selected: !allSelected })));
                      }}
                      className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300"
                    >
                      {parsedItems.every((i) => i.selected) ? (
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Square className="w-4 h-4 text-purple-400" />
                      )}
                      <span>Marcar/Desmarcar Todos</span>
                    </button>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {selectedCount} de {parsedItems.length} selecionados
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 mr-2">Total a Importar:</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatBRL(selectedSum)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 text-slate-500 uppercase text-[10px] tracking-wider font-semibold z-10">
                      <tr>
                        <th className="px-3 py-2 w-10 text-center">Sel.</th>
                        <th className="px-3 py-2">Data</th>
                        <th className="px-3 py-2">Descrição / Estabelecimento</th>
                        <th className="px-3 py-2">Categoria da Compra</th>
                        <th className="px-3 py-2">Parcela</th>
                        <th className="px-3 py-2">Centro de Custo</th>
                        <th className="px-3 py-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                            item.isPayment ? "bg-slate-50/50 dark:bg-slate-800/20 opacity-60" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => {
                                const next = [...parsedItems];
                                next[index].selected = e.target.checked;
                                setParsedItems(next);
                              }}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.description}
                            </div>
                            {item.isPayment && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-500 font-semibold">
                                Pagamento/Crédito
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.category}
                              onChange={(e) => {
                                const next = [...parsedItems];
                                next[index].category = e.target.value;
                                setParsedItems(next);
                              }}
                              placeholder="Categoria"
                              className="w-32 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300"
                            />
                          </td>
                          <td className="px-3 py-2 text-slate-500 font-semibold whitespace-nowrap">
                            {item.installmentNumber
                              ? `${item.installmentNumber}/${item.totalInstallments || item.installmentNumber}`
                              : "À vista"}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.costCenterId}
                              onChange={(e) => {
                                const next = [...parsedItems];
                                next[index].costCenterId = e.target.value;
                                setParsedItems(next);
                              }}
                              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                            >
                              {costCenters.map((cc) => (
                                <option key={cc.id} value={cc.id}>
                                  {cc.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 font-bold text-right text-slate-900 dark:text-white whitespace-nowrap">
                            {formatBRL(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep("UPLOAD")}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition"
                  >
                    Voltar / Trocar Arquivo
                  </button>
                  <button
                    type="button"
                    disabled={isImporting || selectedCount === 0}
                    onClick={handleConfirmImport}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2"
                  >
                    {isImporting ? (
                      <span>Importando {selectedCount} lançamentos...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar e Importar {selectedCount} Despesa(s)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal - Nova Compra no Cartão */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Lançar Despesa / Compra no Cartão de Crédito
            </h3>
            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Cartão Utilizado *
                </label>
                <select
                  required
                  value={expenseForm.cardId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, cardId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nickname} ({c.cardBrand}) - Fecha dia {c.closingDay} / Vence dia {c.dueDay}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Descrição da Compra *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Ex: Compra de Embalagens e Moldes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Valor Total da Compra (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseForm.totalAmount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, totalAmount: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Número de Parcelas *
                  </label>
                  <select
                    value={expenseForm.installments}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, installments: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <option key={num} value={num}>
                        {num}x{" "}
                        {expenseForm.totalAmount
                          ? `de ${formatBRL(Number(expenseForm.totalAmount) / num)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Centro de Custo
                  </label>
                  <select
                    value={expenseForm.costCenterId}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, costCenterId: e.target.value })
                    }
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.purchaseDate}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, purchaseDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Compra no Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Novo Cartão */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Cadastrar Novo Cartão de Crédito
            </h3>
            <form onSubmit={handleCreateCard} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Nome / Apelido do Cartão *
                </label>
                <input
                  type="text"
                  required
                  value={cardForm.nickname}
                  onChange={(e) => setCardForm({ ...cardForm, nickname: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Ex: Nubank Corporativo CassaraTech"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Titular do Cartão
                </label>
                <input
                  type="text"
                  value={cardForm.holderName}
                  onChange={(e) => setCardForm({ ...cardForm, holderName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Nome impresso no cartão"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Bandeira
                  </label>
                  <select
                    value={cardForm.cardBrand}
                    onChange={(e) => setCardForm({ ...cardForm, cardBrand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Mastercard">Mastercard</option>
                    <option value="Visa">Visa</option>
                    <option value="Elo">Elo</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Limite Total (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    value={cardForm.creditLimit}
                    onChange={(e) => setCardForm({ ...cardForm, creditLimit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Dia de Fechamento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cardForm.closingDay}
                    onChange={(e) => setCardForm({ ...cardForm, closingDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Dia de Vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cardForm.dueDay}
                    onChange={(e) => setCardForm({ ...cardForm, dueDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Editar Cartão */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Editar Cartão de Crédito
            </h3>
            <form onSubmit={handleUpdateCard} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Nome / Apelido do Cartão *
                </label>
                <input
                  type="text"
                  required
                  value={editingCard.nickname || ""}
                  onChange={(e) => setEditingCard({ ...editingCard, nickname: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Titular do Cartão
                </label>
                <input
                  type="text"
                  value={editingCard.holderName || ""}
                  onChange={(e) => setEditingCard({ ...editingCard, holderName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Bandeira
                  </label>
                  <select
                    value={editingCard.cardBrand || "Mastercard"}
                    onChange={(e) => setEditingCard({ ...editingCard, cardBrand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Mastercard">Mastercard</option>
                    <option value="Visa">Visa</option>
                    <option value="Elo">Elo</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Limite Total (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingCard.creditLimit || ""}
                    onChange={(e) => setEditingCard({ ...editingCard, creditLimit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Dia de Fechamento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={editingCard.closingDay || ""}
                    onChange={(e) => setEditingCard({ ...editingCard, closingDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Dia de Vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={editingCard.dueDay || ""}
                    onChange={(e) => setEditingCard({ ...editingCard, dueDay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
