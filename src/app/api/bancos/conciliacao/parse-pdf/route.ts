import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import zlib from "zlib";

/**
 * Extrai texto bruto de um buffer de PDF inspecionando streams FlateDecode e operadores Tj/TJ.
 */
function extractRawTextFromPDF(buffer: Buffer): string {
  const binary = buffer.toString("binary");
  const extractedChunks: string[] = [];

  // 1. Localiza streams no PDF
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binary)) !== null) {
    const rawStream = match[1];
    let decompressed: Buffer | null = null;

    try {
      // Tenta descomprimir com zlib / FlateDecode
      const streamBuf = Buffer.from(rawStream, "binary");
      decompressed = zlib.inflateSync(streamBuf);
    } catch {
      try {
        const streamBuf = Buffer.from(rawStream, "binary");
        decompressed = zlib.inflateRawSync(streamBuf);
      } catch {
        // Stream não comprimido ou formato diferente
        decompressed = Buffer.from(rawStream, "binary");
      }
    }

    if (decompressed) {
      const text = decompressed.toString("latin1");
      // Extrai operadores de texto do PDF: (texto) Tj ou [(t1)(t2)] TJ
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(text)) !== null) {
        extractedChunks.push(tjMatch[1]);
      }

      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      let tjArrMatch: RegExpExecArray | null;
      while ((tjArrMatch = tjArrayRegex.exec(text)) !== null) {
        const inner = tjArrMatch[1];
        const innerStrings = inner.match(/\(([^)]*)\)/g) || [];
        const combined = innerStrings.map((s) => s.slice(1, -1)).join("");
        if (combined) extractedChunks.push(combined);
      }
    }
  }

  // 2. Se nenhum chunk foi encontrado via streams, tenta extrair strings literais no PDF completo
  if (extractedChunks.length === 0) {
    const literalRegex = /\(([^)]{3,})\)/g;
    let litMatch: RegExpExecArray | null;
    while ((litMatch = literalRegex.exec(binary)) !== null) {
      extractedChunks.push(litMatch[1]);
    }
  }

  // Decodifica escapes básicos
  return extractedChunks
    .join(" ")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

/**
 * Converte o texto extraído de extratos bancários em transações padronizadas.
 */
function parseExtratoTransactions(rawText: string) {
  const transactions: Array<{ date: string; description: string; amount: number }> = [];
  const lines = rawText.split(/[\r\n]+/);

  const currentYear = new Date().getFullYear();

  // Regex para linha de extrato bancário brasileiro:
  // Ex: "28/10/2026 PIX RECEBIDO JOAO SILVA 150,00"
  // Ex: "25/10 PAGAMENTO FORNECEDOR CERA -250,50"
  // Ex: "15/10/2026 TARIFA BANCARIA 19,90 D"
  const dateAmountRegex = /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.*?)\s+([+-]?\s*(?:R\$\s*)?[\d.]*,\d{2}(?:\s*[CDcd])?)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(dateAmountRegex);
    if (match) {
      let rawDate = match[1];
      const desc = match[2].trim();
      let rawVal = match[3].trim();

      // Normaliza data para YYYY-MM-DD
      const dateParts = rawDate.split("/");
      let day = dateParts[0];
      let month = dateParts[1];
      let year = dateParts[2] || String(currentYear);
      if (year.length === 2) year = `20${year}`;
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      // Determina débito ou crédito
      let isNegative = false;
      if (rawVal.includes("-") || rawVal.toUpperCase().endsWith("D")) {
        isNegative = true;
      }

      // Limpa valor numérico
      let cleanVal = rawVal
        .replace(/[+-]/g, "")
        .replace(/R\$/gi, "")
        .replace(/[CDcd]/gi, "")
        .trim();

      if (cleanVal.includes(".") && cleanVal.includes(",")) {
        cleanVal = cleanVal.replace(/\./g, "").replace(",", ".");
      } else if (cleanVal.includes(",")) {
        cleanVal = cleanVal.replace(",", ".");
      }

      let numericAmount = parseFloat(cleanVal);
      if (!isNaN(numericAmount)) {
        if (isNegative) numericAmount = -Math.abs(numericAmount);
        transactions.push({
          date: isoDate,
          description: desc || "Lançamento Extrato",
          amount: numericAmount,
        });
      }
    }
  }

  // Fallback se o PDF gerou texto contínuo sem quebras por linha
  if (transactions.length === 0) {
    const globalTrxRegex = /(\d{2}\/\d{2}(?:\/\d{4})?)\s+([A-Za-z0-9\s\-_./]+?)\s+([+-]?\s*(?:R\$\s*)?[\d.]*,\d{2}(?:\s*[CDcd])?)/g;
    let globalMatch: RegExpExecArray | null;
    while ((globalMatch = globalTrxRegex.exec(rawText)) !== null) {
      let rawDate = globalMatch[1];
      const desc = globalMatch[2].trim();
      let rawVal = globalMatch[3].trim();

      const dateParts = rawDate.split("/");
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

      const num = parseFloat(cleanVal);
      if (!isNaN(num)) {
        transactions.push({
          date: isoDate,
          description: desc,
          amount: isNegative ? -Math.abs(num) : num,
        });
      }
    }
  }

  return transactions;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo PDF enviado" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extrai o texto contido no PDF
    const text = extractRawTextFromPDF(buffer);
    const transactions = parseExtratoTransactions(text);

    // Converte para formato texto amigável: DD/MM/YYYY; Descrição; Valor
    const formattedLines = transactions.map((t) => {
      const [y, m, d] = t.date.split("-");
      const brDate = `${d}/${m}/${y}`;
      return `${brDate}; ${t.description}; ${t.amount.toFixed(2)}`;
    });

    return NextResponse.json({
      success: true,
      fileName: file.name,
      transactionsCount: transactions.length,
      transactions,
      csvText: formattedLines.join("\n"),
      rawExtractedPreview: text.slice(0, 1000),
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Falha ao processar extrato PDF: ${error.message}` }, { status: 500 });
  }
}
