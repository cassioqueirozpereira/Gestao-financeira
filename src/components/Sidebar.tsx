"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ListTree,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  CreditCard,
  ShoppingBag,
  Flame,
  Layers,
  FileText,
  Megaphone,
  TrendingUp,
  ShieldCheck,
  Target,
  Percent,
  Handshake,
  Landmark,
  LineChart,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard Geral", href: "/", icon: LayoutDashboard },
  { name: "Painel de Desempenho", href: "/desempenho", icon: LineChart },
  { name: "Metas & Planejamento", href: "/metas", icon: Target },
  { name: "Dívidas & Obrigações", href: "/dividas", icon: Landmark },
  { name: "Controle de Comissões", href: "/comissoes", icon: Percent },
  { name: "Gestão de Parcerias", href: "/parcerias", icon: Handshake },
  { name: "Centros de Custo & Empresas", href: "/empresas", icon: Building2 },
  { name: "Plano de Contas", href: "/plano-contas", icon: ListTree },
  { name: "Contas a Pagar", href: "/contas-pagar", icon: ArrowDownCircle },
  { name: "Contas a Receber", href: "/contas-receber", icon: ArrowUpCircle },
  { name: "Fluxo de Caixa", href: "/fluxo-caixa", icon: Wallet },
  { name: "Bancos & Cartões", href: "/bancos", icon: CreditCard },
  { name: "Catálogo D.A. Com Carinho", href: "/catalogo", icon: ShoppingBag },
  { name: "Produção & Custos", href: "/producao", icon: Flame },
  { name: "CRM & Oportunidades", href: "/crm", icon: Layers },
  { name: "Contratos Automáticos", href: "/contratos", icon: FileText },
  { name: "Gestão de Mídia Social", href: "/midia", icon: Megaphone },
  { name: "Investimentos & Capital", href: "/investimentos", icon: TrendingUp },
  { name: "Auditoria & Logs", href: "/auditoria", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg shadow-md border border-slate-700"
        aria-label="Abrir menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay para celular */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">SGE Integrado</h1>
            <p className="text-[10px] text-slate-400 font-medium">Gestão Multinegócios</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300 font-semibold">Argon2id Ativo</span>
          </div>
          <span className="text-slate-400">Ambiente Seguro</span>
        </div>
      </aside>
    </>
  );
}
