"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  FileSpreadsheet,
  FolderTree,
  Boxes,
  Wallet,
  FolderKanban,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Users,
  Truck,
  Package,
  Building2,
  ListTree,
  Landmark,
  ShoppingCart,
  Flame,
  ShoppingBag,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  CreditCard,
  CheckCheck,
  TrendingUp,
  Layers,
  FileText,
  Percent,
  Target,
  Megaphone,
  Handshake,
  User,
} from "lucide-react";

interface SidebarProps {
  user?: {
    name?: string;
    role?: string;
    email?: string;
  } | null;
}

// 1. Itens independentes no topo (fora dos grupos expansíveis, nesta ordem exata)
const topIndependentItems = [
  { name: "Dashboard Geral", href: "/", icon: LayoutDashboard },
  { name: "Painel de Desempenho", href: "/desempenho", icon: LineChart },
  { name: "Central de Relatórios", href: "/relatorios", icon: FileSpreadsheet },
];

// 2. Cinco Categorias Expansíveis e seus Subitens
const menuCategories = [
  {
    id: "cadastros",
    name: "Cadastros",
    icon: FolderTree,
    items: [
      { name: "Clientes", href: "/clientes", icon: Users },
      { name: "Fornecedores", href: "/cadastros/fornecedores", icon: Truck },
      { name: "Produtos e Serviços", href: "/catalogo", icon: Package },
      { name: "Empresas e Centros de Custo", href: "/empresas", icon: Building2 },
      { name: "Plano de Contas", href: "/plano-contas", icon: ListTree },
      { name: "Bancos e Saldos", href: "/bancos", icon: Landmark },
    ],
  },
  {
    id: "operacoes",
    name: "Operações",
    icon: Boxes,
    items: [
      { name: "Estoque Integrado", href: "/estoque", icon: Boxes },
      { name: "Compras e Suprimentos", href: "/compras", icon: ShoppingCart },
      { name: "Produção e Custos", href: "/producao", icon: Flame },
      { name: "Catálogo D.A. Com Carinho", href: "/catalogo", icon: ShoppingBag },
      { name: "Vendas de Velas e Resinas", href: "/vendas", icon: ShoppingBag },
    ],
  },
  {
    id: "financeiro",
    name: "Financeiro",
    icon: Wallet,
    items: [
      { name: "Contas a Pagar", href: "/contas-pagar", icon: ArrowDownCircle },
      { name: "Contas a Receber", href: "/contas-receber", icon: ArrowUpCircle },
      { name: "Títulos a Vencer", href: "/vencimentos", icon: CalendarClock },
      { name: "Faturas de Cartão", href: "/cartoes", icon: CreditCard },
      { name: "Fluxo de Caixa", href: "/fluxo-caixa", icon: Wallet },
      { name: "Conciliação Bancária", href: "/bancos/conciliacao", icon: CheckCheck },
      { name: "Dívidas e Obrigações", href: "/dividas", icon: Landmark },
      { name: "Investimentos e Capital", href: "/investimentos", icon: TrendingUp },
    ],
  },
  {
    id: "gestao",
    name: "Gestão",
    icon: FolderKanban,
    items: [
      { name: "CRM e Oportunidades", href: "/crm", icon: Layers },
      { name: "Clientes e Mensalidades", href: "/clientes", icon: Users },
      { name: "Contratos Automáticos", href: "/contratos", icon: FileText },
      { name: "Controle de Comissões", href: "/comissoes", icon: Percent },
      { name: "Metas e Planejamento", href: "/metas", icon: Target },
      { name: "Gestão de Mídia Social", href: "/midia", icon: Megaphone },
      { name: "Gestão de Parcerias", href: "/parcerias", icon: Handshake },
    ],
  },
  {
    id: "sistema",
    name: "Sistema",
    icon: ShieldCheck,
    items: [
      { name: "Auditoria e Logs", href: "/auditoria", icon: ShieldCheck },
    ],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Estado de expansão/recolhimento das 5 categorias
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    // Inicialmente abre todas as categorias para fácil localização
    const initial: Record<string, boolean> = {
      cadastros: true,
      operacoes: true,
      financeiro: true,
      gestao: true,
      sistema: true,
    };
    return initial;
  });

  // Garante que a categoria que contém a rota atual esteja aberta
  useEffect(() => {
    menuCategories.forEach((cat) => {
      const hasActiveChild = cat.items.some((item) => {
        if (item.href === "/") return pathname === "/";
        return pathname === item.href || pathname.startsWith(item.href + "/");
      });
      if (hasActiveChild) {
        setOpenCategories((prev) => ({ ...prev, [cat.id]: true }));
      }
    });
  }, [pathname]);

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Botão Mobile (hamburguer no topo para telas pequenas) */}
      <button
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2 bg-slate-800 text-white rounded-xl shadow-md border border-slate-700 hover:bg-slate-700 transition"
        aria-label="Abrir menu"
      >
        {isOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay com blur para celular */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Menu Lateral Fixo: largura exata 220px, sempre aberto no desktop */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-[220px] bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out select-none ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Cabeçalho do Menu Lateral com Identidade Visual */}
        <div className="h-14 flex items-center px-3 border-b border-slate-800/90 gap-2.5 shrink-0 bg-slate-950/30">
          <img
            src="/icon-192.png"
            alt="CassaraTech ERP"
            className="w-8 h-8 rounded-lg object-contain bg-slate-950 p-0.5 border border-slate-800 shadow-sm shrink-0"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="font-bold text-white text-[13px] tracking-tight truncate">
              ERP Integrado
            </h1>
            <p className="text-[9.5px] text-indigo-400 font-medium truncate">
              CassaraTech Multinegócios
            </p>
          </div>
        </div>

        {/* Lista de Navegação com rolagem compacta e suave */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1 text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
          {/* 1. Itens Independentes no Topo */}
          <div className="space-y-0.5 pb-2 border-b border-slate-800/80">
            {topIndependentItems.map((item) => {
              const active = isRouteActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpenMobile(false)}
                  className={`flex items-center gap-2.5 px-2.5 h-[36px] rounded-lg text-xs transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/70 font-medium"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* 2. Cinco Categorias Expansíveis */}
          <div className="pt-1.5 space-y-1">
            {menuCategories.map((category) => {
              const isExpanded = !!openCategories[category.id];
              const CategoryIcon = category.icon;

              // Verifica se algum subitem da categoria está ativo
              const hasActiveChild = category.items.some((sub) => isRouteActive(sub.href));

              return (
                <div key={category.id} className="space-y-0.5">
                  {/* Cabeçalho da Categoria com Seta */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center justify-between px-2.5 h-[34px] rounded-lg text-xs font-semibold transition-all group ${
                      hasActiveChild && !isExpanded
                        ? "text-indigo-400 bg-indigo-950/30 border border-indigo-900/40"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIcon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          hasActiveChild ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"
                        }`}
                      />
                      <span className="truncate uppercase text-[11px] tracking-wider font-bold">
                        {category.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasActiveChild && !isExpanded && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                          isExpanded ? "rotate-0 text-slate-300" : "-rotate-90"
                        }`}
                      />
                    </div>
                  </button>

                  {/* Subitens com Recuo Visual */}
                  {isExpanded && (
                    <div className="ml-2 pl-2 border-l border-slate-800/80 space-y-0.5 py-0.5">
                      {category.items.map((subItem) => {
                        const active = isRouteActive(subItem.href);
                        const SubIcon = subItem.icon;

                        return (
                          <Link
                            key={`${category.id}-${subItem.name}-${subItem.href}`}
                            href={subItem.href}
                            onClick={() => setIsOpenMobile(false)}
                            className={`flex items-center gap-2 px-2 h-[34px] rounded-md text-[11.5px] transition-all ${
                              active
                                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium"
                            }`}
                          >
                            <SubIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                active ? "text-white" : "text-slate-500"
                              }`}
                            />
                            <span className="truncate">{subItem.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Rodapé com Usuário Conectado e Versão do Sistema */}
        <div className="p-2.5 border-t border-slate-800/90 bg-slate-950/50 shrink-0 space-y-2">
          {/* Card do Usuário Conectado */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="w-6 h-6 rounded-md bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] font-bold text-white truncate">
                {user?.name || "Usuário Conectado"}
              </p>
              <p className="text-[9.5px] text-slate-400 uppercase tracking-wider font-semibold">
                {user?.role || "ADMIN"}
              </p>
            </div>
          </div>

          {/* Status & Versão */}
          <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300 font-medium">Online</span>
            </div>
            <span className="text-slate-400 font-mono font-semibold">v2.0 ERP</span>
          </div>

          {/* Logo CassaraTech */}
          <div className="pt-1 border-t border-slate-800/60 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="CassaraTech"
              className="h-5 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
