"use client";

import React, { useState } from "react";
import {
  Landmark,
  Upload,
  CheckCircle,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  Search,
  Sparkles,
  Plus,
  X,
  FileText,
  Building2,
  DollarSign,
  Check,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ConciliacaoClientViewProps {
  bankAccounts: any[];
  initialTransactions: any[];
  openPayables: any[];
  openReceivables: any[];
  chartOfAccounts: any[];
  costCenters: any[];
  suppliers: any[];
  customers: any[];
}

export function ConciliacaoClientView({
  bankAccounts,
  initialTransactions,
  openPayables,
  openReceivables,
  chartOfAccounts,
  costCenters,
  suppliers,
  customers,
}: ConciliacaoClientViewProps) {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState(bankAccounts[0]?.id || "");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [payables, setPayables] = useState(openPayables);
  const [receivables, setReceivables] = useState(openReceivables);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "PENDENTES" | "CONCILIADOS">("PENDENTES");

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [extratoText, setExtratoText] = useState("");
  const [importing, setImporting] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Inline Creation Modal / State
  const [inlineModalTx, setInlineModalTx] = useState<any | null>(null);
  const [inlineCategory, setInlineCategory] = useState(chartOfAccounts[0]?.id || "");
  const [inlineCostCenter, setInlineCostCenter] = useState(costCenters[0]?.id || "");
  const [inlinePartnerId, setInlinePartnerId] = useState("");
  const [inlineDescription, setInlineDescription] = useState("");
  const [creatingInline, setCreatingInline] = useState(false);

  const selectedBank = bankAccounts.find((b) => b.id === selectedAccountId);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Parser de OFX / CSV / Extrato Bancário copiado
  const parseExtrato = (text: string) => {
    const parsed: Array<{ date: string; description: string; amount: number; fitid?: string }> = [];

    const isBalanceOrHeader = (desc: string) => {
      const d = desc.toUpperCase();
      return (
        d.includes("SALDO DO DIA") ||
        d.includes("SALDO ANTERIOR") ||
        d.includes("SALDO FINAL") ||
        d.includes("SALDO TOTAL") ||
        d.includes("SDO CTA") ||
        d.includes("SALDO DISPONIVEL") ||
        d.includes("SALDO DISPONÍVEL") ||
        d.includes("SALDO EM CONTA") ||
        d.includes("LIMITE DA CONTA") ||
        d.includes("TOTAL CONTRATADO") ||
        d.includes("SALDO APLIC AUT") ||
        d.includes("SALDO PROVISORIO") ||
        d.includes("EXTRATO CONTA") ||
        d.includes("DATA LANÇAMENTOS")
      );
    };

    // Tenta formato OFX se contiver STMTTRN
    if (text.includes("<STMTTRN>")) {
      const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
      let match;
      while ((match = trnRegex.exec(text)) !== null) {
        const block = match[1];
        const dtMatch = block.match(/<DTPOSTED>(\d{8})/i);
        const amtMatch = block.match(/<TRNAMT>([-\d.,]+)/i);
        const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i);
        const fitidMatch = block.match(/<FITID>([^<\r\n]+)/i);

        if (dtMatch && amtMatch) {
          const rawDate = dtMatch[1];
          const y = rawDate.slice(0, 4);
          const m = rawDate.slice(4, 6);
          const d = rawDate.slice(6, 8);
          const dateStr = `${y}-${m}-${d}`;
          const amount = parseFloat(amtMatch[1].replace(",", "."));
          const description = memoMatch ? memoMatch[1].trim() : "Transação OFX";
          const fitid = fitidMatch ? fitidMatch[1].trim() : undefined;

          if (!isBalanceOrHeader(description)) {
            parsed.push({ date: dateStr, description, amount, fitid });
          }
        }
      }
    } else {
      // Formato Linhas CSV ou Copiado do Banco (Data; Descrição; Valor) ou espaço
      const lines = text.split("\n");
      const currentYear = new Date().getFullYear();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("Data") || trimmed.startsWith("data")) continue;

        const parts = trimmed.includes(";") ? trimmed.split(";") : trimmed.includes(",") ? trimmed.split(",") : trimmed.split("\t");
        if (parts.length >= 3) {
          const rawDate = parts[0].trim();
          const description = parts[1].trim();
          let rawAmount = parts[2].trim().replace("R$", "").replace(/\s/g, "");

          if (isBalanceOrHeader(description)) continue;

          let isNegative = false;
          if (rawAmount.includes("-") || rawAmount.toUpperCase().endsWith("D")) {
            isNegative = true;
          }

          rawAmount = rawAmount.replace(/[+-]/g, "").replace(/[CDcd]/gi, "").trim();

          // Normaliza formato brasileiro 1.500,00 ou americano 1500.00
          if (rawAmount.includes(",") && rawAmount.includes(".")) {
            rawAmount = rawAmount.replace(/\./g, "").replace(",", ".");
          } else if (rawAmount.includes(",")) {
            rawAmount = rawAmount.replace(",", ".");
          }

          let amount = parseFloat(rawAmount);
          if (!isNaN(amount)) {
            if (isNegative) amount = -Math.abs(amount);

            // Converte DD/MM/AAAA para AAAA-MM-DD se necessário
            let finalDate = rawDate;
            if (rawDate.includes("/")) {
              const [d, m, y] = rawDate.split("/");
              let fullY = y || String(currentYear);
              if (fullY.length === 2) fullY = `20${fullY}`;
              finalDate = `${fullY}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            }

            parsed.push({ date: finalDate, description, amount });
          }
        } else {
          // Fallback para linha de extrato bancário separada por espaços
          // Ex: "27/10/2026 PIX TRANSF Rita de27/10 2.000,00"
          const spaceMatch = trimmed.match(/^(\d{2}[/.-]\d{2}(?:[/.-]\d{2,4})?)\s+(.+?)\s+([+-]?\s*(?:R\$\s*)?[\d.]*,\d{2}(?:\s*[CDcd])?)(?:\s+[+-]?\s*(?:R\$\s*)?[\d.]*,\d{2}(?:\s*[CDcd])?)?$/);
          if (spaceMatch) {
            const rawDate = spaceMatch[1];
            const description = spaceMatch[2].trim();
            const rawVal = spaceMatch[3].trim();

            if (isBalanceOrHeader(description)) continue;

            const dateParts = rawDate.split(/[/.-]/);
            let day = dateParts[0];
            let month = dateParts[1];
            let year = dateParts[2] || String(currentYear);
            if (year.length === 2) year = `20${year}`;
            const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

            let isNegative = rawVal.includes("-") || rawVal.toUpperCase().endsWith("D");
            let cleanVal = rawVal.replace(/[+-]/g, "").replace(/R\$/gi, "").replace(/[CDcd]/gi, "").trim();
            if (cleanVal.includes(".") && cleanVal.includes(",")) {
              cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
            } else if (cleanVal.includes(",")) {
              cleanVal = cleanVal.replace(",", ".");
            }

            let amount = parseFloat(cleanVal);
            if (!isNaN(amount)) {
              if (isNegative) amount = -Math.abs(amount);
              parsed.push({ date: isoDate, description, amount });
            }
          }
        }
      }
    }

    return parsed;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith(".pdf")) {
      setParsingPdf(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/bancos/conciliacao/parse-pdf", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao ler extrato PDF");

        if (data.csvText) {
          setExtratoText(data.csvText);
          alert(`Extrato PDF "${file.name}" processado! ${data.transactionsCount} transações identificadas.`);
        } else if (data.rawExtractedPreview) {
          setExtratoText(data.rawExtractedPreview);
          alert(`Texto do PDF "${file.name}" extraído. Verifique o conteúdo na caixa.`);
        }
      } catch (err: any) {
        alert(err.message || "Falha ao processar arquivo PDF");
      } finally {
        setParsingPdf(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setExtratoText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleImportExtrato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extratoText.trim()) return;

    setImporting(true);
    try {
      const parsedTransactions = parseExtrato(extratoText);
      if (parsedTransactions.length === 0) {
        throw new Error("Nenhuma transação válida identificada. Verifique o formato do texto ou arquivo.");
      }

      const res = await fetch("/api/bancos/conciliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "IMPORT",
          bankAccountId: selectedAccountId,
          transactions: parsedTransactions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao importar extrato");

      alert(`Sucesso! ${data.importedCount} novas transações importadas.`);
      setShowImportModal(false);
      setExtratoText("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImporting(false);
    }
  };

  // Encontra sugestão de cruzamento automático pelo valor absoluto
  const findMatchSuggestion = (tx: any) => {
    const txAmount = Math.abs(Number(tx.amount));
    if (tx.amount < 0) {
      // Saída -> busca em Contas a Pagar
      return {
        type: "PAYABLE",
        item: payables.find((p) => Math.abs(Number(p.originalAmount) - txAmount) < 0.05),
      };
    } else {
      // Entrada -> busca em Contas a Receber
      return {
        type: "RECEIVABLE",
        item: receivables.find((r) => Math.abs(Number(r.originalAmount) - txAmount) < 0.05),
      };
    }
  };

  const handleMatchAndSettle = async (tx: any, targetType: string, targetId: string) => {
    setActionLoading((prev) => ({ ...prev, [tx.id]: true }));
    try {
      const res = await fetch("/api/bancos/conciliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MATCH_AND_SETTLE",
          transactionId: tx.id,
          targetType,
          targetId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao conciliar");

      setTransactions((prev) =>
        prev.map((t) => (t.id === tx.id ? { ...t, isReconciled: true, reconciledWith: `${targetType}:${targetId}` } : t))
      );

      if (targetType === "PAYABLE") {
        setPayables((prev) => prev.filter((p) => p.id !== targetId));
      } else {
        setReceivables((prev) => prev.filter((r) => r.id !== targetId));
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [tx.id]: false }));
    }
  };

  const handleOpenInlineCreate = (tx: any) => {
    setInlineModalTx(tx);
    setInlineDescription(tx.description);
    setInlineCategory(chartOfAccounts[0]?.id || "");
    setInlineCostCenter(costCenters[0]?.id || "");
    setInlinePartnerId("");
  };

  const handleCreateAndSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineModalTx) return;

    setCreatingInline(true);
    try {
      const isSaida = inlineModalTx.amount < 0;
      const targetType = isSaida ? "PAYABLE" : "RECEIVABLE";

      const res = await fetch("/api/bancos/conciliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_AND_SETTLE",
          transactionId: inlineModalTx.id,
          targetType,
          chartOfAccountId: inlineCategory,
          costCenterId: inlineCostCenter,
          description: inlineDescription,
          supplierId: isSaida ? inlinePartnerId || null : null,
          customerId: !isSaida ? inlinePartnerId || null : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar título inline");

      setTransactions((prev) =>
        prev.map((t) => (t.id === inlineModalTx.id ? { ...t, isReconciled: true } : t))
      );
      setInlineModalTx(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingInline(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (t.bankAccountId !== selectedAccountId) return false;
    if (filterStatus === "PENDENTES" && t.isReconciled) return false;
    if (filterStatus === "CONCILIADOS" && !t.isReconciled) return false;
    if (search.trim()) {
      return t.description.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const totalPendentes = transactions.filter((t) => t.bankAccountId === selectedAccountId && !t.isReconciled).length;
  const totalConciliados = transactions.filter((t) => t.bankAccountId === selectedAccountId && t.isReconciled).length;

  return (
    <div className="space-y-6">
      {/* Seletor de Conta Bancária & Resumo de Saldo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-900">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400">
              Conta Bancária em Conciliação
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="mt-0.5 text-base font-bold bg-transparent border-b border-indigo-500 focus:outline-none text-slate-900 dark:text-white"
            >
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} — {acc.holderName} ({acc.accountType})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">Saldo Atual em Caixa</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatBRL(Number(selectedBank?.currentBalance || 0))}
            </span>
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition shrink-0"
          >
            <Upload className="w-4 h-4" />
            Importar Extrato (OFX / CSV)
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição no extrato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(["PENDENTES", "CONCILIADOS", "TODOS"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterStatus === st
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {st === "PENDENTES" ? `Pendentes (${totalPendentes})` : st === "CONCILIADOS" ? `Conciliados (${totalConciliados})` : "Todas"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Conciliação em Tela Única */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição no Extrato</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4">Correspondência Sugerida (Auto-Match)</th>
                <th className="px-6 py-4 text-right">Ação de Conciliação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Nenhuma transação encontrada. Importe seu extrato bancário usando o botão acima.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isEntrada = tx.amount > 0;
                  const match = findMatchSuggestion(tx);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString("pt-BR")}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {tx.description}
                        {tx.fitid && <span className="block text-[10px] font-mono text-slate-400">ID: {tx.fitid}</span>}
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {isEntrada ? "+" : ""}{formatBRL(Number(tx.amount))}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {tx.isReconciled ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Conciliado & Liquidado
                          </span>
                        ) : match.item ? (
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs flex items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-indigo-700 dark:text-indigo-300 block">
                                {match.type === "PAYABLE" ? "Conta a Pagar:" : "Conta a Receber:"} {match.item.description}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Venc: {new Date(match.item.dueDate).toLocaleDateString("pt-BR")} • Valor: {formatBRL(Number(match.item.originalAmount))}
                              </span>
                            </div>
                            <button
                              onClick={() => handleMatchAndSettle(tx, match.type, match.item.id)}
                              disabled={actionLoading[tx.id]}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shrink-0"
                            >
                              {actionLoading[tx.id] ? "Processando..." : "Conciliar & Liquidar"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Nenhum título com este valor exato em aberto.
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {!tx.isReconciled && (
                          <button
                            onClick={() => handleOpenInlineCreate(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Criar Título & Liquidar
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

      {/* Modal - Importar Extrato OFX ou CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Importar Extrato Bancário</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportExtrato} className="space-y-4 text-xs">
              <p className="text-slate-500">
                Selecione o arquivo de extrato em <strong>.PDF</strong>, <strong>.OFX</strong> ou <strong>.CSV</strong> do seu banco, ou cole o conteúdo diretamente no campo de texto abaixo.
              </p>

              {/* Botão de Upload de Arquivo PDF / OFX / CSV */}
              <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-4 bg-indigo-50/50 dark:bg-indigo-950/20 text-center hover:border-indigo-400 transition">
                <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
                  <Upload className="w-7 h-7 text-indigo-500 animate-pulse" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {parsingPdf ? "Processando e decodificando extrato PDF..." : "Clique para carregar Extrato (.PDF, .OFX, .CSV)"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Compatível com extratos digitais em PDF emitidos por bancos (Nubank, Itaú, Bradesco, Inter, Santander, BB, etc.)
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.ofx,.csv,.txt"
                    disabled={parsingPdf}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Linhas do Extrato a Importar (Data; Descrição; Valor)
                </label>
                <textarea
                  rows={7}
                  required
                  placeholder={`Cole aqui ou faça o upload do arquivo acima:\n25/10/2026; Pagamento Fornecedor Cera; -150.00\n26/10/2026; Recebimento PIX Cliente; 320.00\n27/10/2026; Tarifa Mensalidade Conta; -29.90`}
                  value={extratoText}
                  onChange={(e) => setExtratoText(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  {importing ? "Processando..." : "Importar Transações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Criar Título Inline e Liquidar */}
      {inlineModalTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative text-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Criar Título & Liquidar Imediatamente
              </h3>
              <button onClick={() => setInlineModalTx(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAndSettle} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Transação Bancária</span>
                <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{inlineModalTx.description}</span>
                <span className={`font-mono font-black text-sm ${inlineModalTx.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatBRL(Number(inlineModalTx.amount))}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Descrição do Lançamento
                </label>
                <input
                  type="text"
                  required
                  value={inlineDescription}
                  onChange={(e) => setInlineDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Classificação / Plano de Contas *
                </label>
                <select
                  value={inlineCategory}
                  onChange={(e) => setInlineCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {chartOfAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Centro de Custo *
                </label>
                <select
                  value={inlineCostCenter}
                  onChange={(e) => setInlineCostCenter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInlineModalTx(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingInline}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  {creatingInline ? "Liquidando..." : "Criar & Conciliar Agora"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
