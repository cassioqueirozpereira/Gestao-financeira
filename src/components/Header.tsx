"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogOut, Filter, User } from "lucide-react";

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

export function Header({ userName = "Administrador", userRole = "ADMIN" }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCenter = searchParams.get("centro") || "TODOS";
  const [loggingOut, setLoggingOut] = useState(false);

  const handleCostCenterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(window.location.search);
    if (value === "TODOS") {
      params.delete("centro");
    } else {
      params.set("centro", value);
    }
    router.push(`?${params.toString()}`);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      alert("Erro ao deslogar.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Centro de Custo Selector */}
      <div className="flex items-center gap-2 pl-12 lg:pl-0">
        <Filter className="w-4 h-4 text-indigo-500 hidden sm:block" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
          Centro de Custo:
        </span>
        <select
          value={currentCenter}
          onChange={handleCostCenterChange}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="TODOS">🌐 Visão Geral Consolidada</option>
          <option value="SISTEMAS">💻 Sistemas — CassaraTech</option>
          <option value="VELAS">🕯️ Velas — D.A. Com Carinho</option>
          <option value="RESINAS">✨ Resinas — D.A. Com Carinho</option>
          <option value="MIDIA_SOCIAL">📱 Mídia Social & Marketing</option>
          <option value="CASA">🏠 Casa (Despesas Pessoais)</option>
        </select>
      </div>

      {/* User profile & actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {userName}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
              {userRole}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Encerrar Sessão"
          className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
