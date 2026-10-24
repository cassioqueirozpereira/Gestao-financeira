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
  Users,
  CalendarClock,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard Geral", href: "/", icon: LayoutDashboard },
  { name: "Painel de Desempenho", href: "/desempenho", icon: LineChart },
  { name: "Clientes & Mensalidades", href: "/clientes", icon: Users },
  { name: "Vendas Velas & Resinas", href: "/vendas", icon: ShoppingBag },
  { name: "Títulos a Vencer", href: "/vencimentos", icon: CalendarClock },
  { name: "Contas a Receber", href: "/contas-receber", icon: ArrowUpCircle },
  { name: "Contas a Pagar", href: "/contas-pagar", icon: ArrowDownCircle },
  { name: "Faturas de Cartão", href: "/cartoes", icon: CreditCard },
  { name: "Fluxo de Caixa", href: "/fluxo-caixa", icon: Wallet },
  { name: "Bancos & Saldos", href: "/bancos", icon: Landmark },
  { name: "CRM & Oportunidades", href: "/crm", icon: Layers },
  { name: "Contratos Automáticos", href: "/contratos", icon: FileText },
  { name: "Catálogo D.A. Com Carinho", href: "/catalogo", icon: ShoppingBag },
  { name: "Produção & Custos", href: "/producao", icon: Flame },
  { name: "Controle de Comissões", href: "/comissoes", icon: Percent },
  { name: "Metas & Planejamento", href: "/metas", icon: Target },
  { name: "Dívidas & Obrigações", href: "/dividas", icon: Landmark },
  { name: "Gestão de Mídia Social", href: "/midia", icon: Megaphone },
  { name: "Gestão de Parcerias", href: "/parcerias", icon: Handshake },
  { name: "Investimentos & Capital", href: "/investimentos", icon: TrendingUp },
  { name: "Centros de Custo & Empresas", href: "/empresas", icon: Building2 },
  { name: "Plano de Contas", href: "/plano-contas", icon: ListTree },
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
        <div className="h-16 flex items-center px-4 border-b border-slate-800 gap-3">
          <img
            src="/icon-192.png"
            alt="CassaraTech ERP"
            className="w-10 h-10 rounded-xl object-contain bg-slate-950 p-1 border border-slate-800 shadow-md shadow-indigo-600/30 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">ERP Integrado</h1>
            <p className="text-[10px] text-indigo-400 font-medium truncate">CassaraTech Multinegócios</p>
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

        {/* Footer info & CassaraTech Brand */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-300 font-semibold">Argon2id Ativo</span>
            </div>
            <span className="text-[10px] text-slate-500">v2.0 ERP</span>
          </div>
          <div className="pt-1 border-t border-slate-800/60 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="CassaraTech - Soluções Digitais"
              className="h-7 w-auto object-contain opacity-75 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
