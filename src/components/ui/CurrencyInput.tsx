"use client";

import React, { useState, useEffect } from "react";
import { formatCurrencyFromDigits, parseCurrencyToNumber } from "@/lib/currency";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | string;
  onChangeValue: (numericValue: number, formattedValue: string) => void;
  prefix?: string;
}

export function CurrencyInput({
  value,
  onChangeValue,
  prefix = "R$",
  className = "",
  disabled = false,
  required = false,
  id,
  placeholder = "0,00",
  ...rest
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    return formatCurrencyFromDigits(value);
  });

  useEffect(() => {
    // Sincroniza se o valor externo mudar significativamente
    const currentNumeric = parseCurrencyToNumber(displayValue);
    const incomingNumeric = typeof value === "number" ? value : parseCurrencyToNumber(value);

    if (Math.abs(currentNumeric - incomingNumeric) > 0.001) {
      setDisplayValue(formatCurrencyFromDigits(incomingNumeric));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCurrencyFromDigits(raw);
    const numeric = parseCurrencyToNumber(formatted);
    setDisplayValue(formatted);
    onChangeValue(numeric, formatted);
  };

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-3 text-xs font-bold text-slate-400 select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        id={id}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className={`w-full ${prefix ? "pl-9" : "pl-3"} pr-3 py-2 font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${className}`}
        {...rest}
      />
    </div>
  );
}
