"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro capturado no Dashboard:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/10">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Instabilidade Temporária no Carregamento
      </h1>

      <p className="text-slate-600 dark:text-slate-400 max-w-md text-sm mb-6">
        Ocorreu um erro no servidor ao consultar as informações desta página. Geralmente isso ocorre quando o banco de dados Supabase precisa atualizar as novas colunas ou a conexão expirou.
      </p>

      {error.digest && (
        <div className="mb-6 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-500">
          Código do Erro (Digest): <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{error.digest}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-xl transition"
        >
          <Home className="w-4 h-4" />
          Página Inicial
        </Link>
      </div>
    </div>
  );
}
