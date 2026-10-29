/**
 * Utilitários para formatação e manipulação de valores monetários no padrão brasileiro (BRL).
 * Implementa máscara automática onde a vírgula é posicionada sempre nas duas últimas casas decimais.
 */

/**
 * Converte qualquer entrada numérica ou texto para o formato com 2 casas decimais.
 * Exemplo: digita "1500" -> "15,00"; digita "5" -> "0,05"; digita "123456" -> "1.234,56"
 */
export function formatCurrencyFromDigits(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "0,00";

  // Se já for um número decimal (ex: 15.5)
  if (typeof value === "number") {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  // Remove tudo que não for dígito
  const digits = value.replace(/\D/g, "");
  if (!digits) return "0,00";

  // Converte os dígitos inteiros dividindo por 100
  const numberValue = parseInt(digits, 10) / 100;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
}

/**
 * Converte string formatada em pt-BR (ex: "1.250,50") de volta para número float (ex: 1250.50).
 */
export function parseCurrencyToNumber(formattedValue: string | number): number {
  if (typeof formattedValue === "number") return formattedValue;
  if (!formattedValue || typeof formattedValue !== "string") return 0;

  // Remove pontos de milhar e troca vírgula por ponto
  const clean = formattedValue
    .replace(/[^\d,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata um número float para exibição padrão R$ 0,00
 */
export function formatBRL(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) || 0 : value || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}
