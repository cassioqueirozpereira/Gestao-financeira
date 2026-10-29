import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { extractText, getDocumentProxy } from "unpdf";
import zlib from "zlib";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Identifica se a linha ou descrição é apenas um cabeçalho, saldo ou resumo do extrato
 * e não uma transação real.
 */
function isBalanceOrHeader(desc: string): boolean {
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
    d.includes("SALDO PROVISÓRIO") ||
    d.includes("TOTAL APLICADO") ||
    d.includes("RESUMO DO DIA") ||
    d.includes("SDO BANCO") ||
    d.includes("TOTAL DE ENTRADAS") ||
    d.includes("TOTAL DE SAIDAS") ||
    d.includes("TOTAL DE SAÍDAS") ||
    d.includes("TOTAL DE DEBITOS") ||
    d.includes("TOTAL DE DÉBITOS") ||
    d.includes("TOTAL DE CREDITOS") ||
    d.includes("TOTAL DE CRÉDITOS") ||
    d.includes("SUBTOTAL") ||
    d.includes("EXTRATO CONTA") ||
    d.includes("PERÍODO DE VISUALIZAÇÃO") ||
    d.includes("PERIODO DE VISUALIZACAO") ||
    d.includes("DATA LANÇAMENTOS VALOR") ||
    d.includes("DATA LANCAMENTOS VALOR") ||
    d.includes("LIMITE UTILIZADO") ||
    d.includes("LIMITE DISPONÍVEL") ||
    d.includes("LIMITE DISPONIVEL")
  );
}

/**
 * Extração de texto de PDF usando unpdf (compatível com Vercel Serverless e Edge, sem dependências nativas).
 */
async function extractTextWithUnpdf(uint8Array: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(uint8Array);
    const { text } = await extractText(pdf, { mergePages: true });
    if (typeof text === "string" && text.trim().length > 0) {
      return text;
    }
  } catch (err) {
    console.warn("unpdf falhou ao extrair texto, tentando fallback bruto:", err);
  }
  return "";
}

/**
 * Fallback para extrair texto inspecionando streams FlateDecode se necessário.
 */
function extractRawTextFromPDF(buffer: Buffer): string {
  const binary = buffer.toString("binary");
  const extractedChunks: string[] = [];

  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binary)) !== null) {
    const rawStream = match[1];
    let decompressed: Buffer | null = null;

    try {
      const streamBuf = Buffer.from(rawStream, "binary");
      decompressed = zlib.inflateSync(streamBuf);
    } catch {
      try {
        const streamBuf = Buffer.from(rawStream, "binary");
        decompressed = zlib.inflateRawSync(streamBuf);
      } catch {
        decompressed = Buffer.from(rawStream, "binary");
      }
    }

    if (decompressed) {
      const text = decompressed.toString("latin1");
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

  if (extractedChunks.length === 0) {
    const literalRegex = /\(([^)]{3,})\)/g;
    let litMatch: RegExpExecArray | null;
    while ((litMatch = literalRegex.exec(binary)) !== null) {
      extractedChunks.push(litMatch[1]);
    }
  }

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

  // Linha de extrato com data no início, descrição no meio, e valor (+ opcional saldo) no final
  // Ex: "27/10/2026 PIX TRANSF Rita de27/10 2.000,00"
  // Ex: "26/10/2026 APLICACAO COFRINHOS -150,00"
  // Ex: "26/10/2026 PIX TRANSF David V25/10 -100,00 41,20"
  // Ex: "15/10/2026 TARIFA BANCARIA 19,90 D"
  const lineRegex = /^(\d{2}[/.-]\d{2}(?:[/.-]\d{2,4})?)\s+(.+?)\s+([+-]?\s*(?:R\$\s*)?[\d.]*,\d{2}(?:\s*[CDcd])?)(?:\s+[+-]?\s*(?:R\$\s*)?[\d.]*,\d{2}(?:\s*[CDcd])?)?$/;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const match = trimmed.match(lineRegex);
    if (match) {
      const rawDate = match[1];
      const desc = match[2].trim().replace(/\s+/g, " ");
      const rawVal = match[3].trim();

      // Ignora linhas de saldo e cabeçalhos
      if (isBalanceOrHeader(desc)) {
        continue;
      }

      // Converte data para YYYY-MM-DD
      const dateParts = rawDate.split(/[/.-]/);
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
    const globalTrxRegex = /(\d{2}[/.-]\d{2}(?:[/.-]\d{4})?)\s+([A-Za-z0-9\s\-_./]+?)\s+([+-]?\s*(?:R\$\s*)?[\d.]*,\d{2}(?:\s*[CDcd])?)/g;
    let globalMatch: RegExpExecArray | null;
    while ((globalMatch = globalTrxRegex.exec(rawText)) !== null) {
      const rawDate = globalMatch[1];
      const desc = globalMatch[2].trim().replace(/\s+/g, " ");
      const rawVal = globalMatch[3].trim();

      if (isBalanceOrHeader(desc)) continue;

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

      const num = parseFloat(cleanVal);
      if (!isNaN(num)) {
        transactions.push({
          date: isoDate,
          description: desc || "Lançamento Extrato",
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
    const uint8Array = new Uint8Array(arrayBuffer);

    // 1. Tenta extrair com unpdf (100% serverless / Vercel friendly, decodifica fontes Itaú)
    let text = await extractTextWithUnpdf(uint8Array);

    // 2. Se falhar ou vier vazio, usa fallback do extractor de streams
    if (!text || text.trim().length === 0) {
      text = extractRawTextFromPDF(Buffer.from(arrayBuffer));
    }

    // 3. Processa e padroniza as transações
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
