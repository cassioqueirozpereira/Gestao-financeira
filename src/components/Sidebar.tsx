"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Search,
  CornerDownLeft,
} from "lucide-react";

interface SidebarProps {
  user?: {
    name?: string;
    role?: string;
    email?: string;
  } | null;
}

interface SearchableMenuItem {
  name: string;
  href: string;
  icon: any;
  categoryName: string;
  keywords: string[];
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

// 3. Índice Geral de Pesquisa com Palavras-Chave e Sinônimos
const allSearchableItems: SearchableMenuItem[] = [
  // Visão Geral
  {
    name: "Dashboard Geral",
    href: "/",
    icon: LayoutDashboard,
    categoryName: "Visão Geral",
    keywords: ["inicio", "home", "indicadores", "resumo", "painel", "kpi", "faturamento", "geral"],
  },
  {
    name: "Painel de Desempenho",
    href: "/desempenho",
    icon: LineChart,
    categoryName: "Visão Geral",
    keywords: ["graficos", "performance", "evolucao", "resultados", "metricas", "analise", "desempenho"],
  },
  {
    name: "Central de Relatórios",
    href: "/relatorios",
    icon: FileSpreadsheet,
    categoryName: "Visão Geral",
    keywords: ["dre", "relatorio financeiro", "posicao de estoque", "exportar", "planilhas", "fechamento", "contabil"],
  },

  // Cadastros
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
    categoryName: "Cadastros",
    keywords: ["crm", "compradores", "endereco", "whatsapp", "cadastro de clientes", "contatos", "telefone"],
  },
  {
    name: "Fornecedores",
    href: "/cadastros/fornecedores",
    icon: Truck,
    categoryName: "Cadastros",
    keywords: ["distribuidores", "compras", "parceiros de materia-prima", "contato fornecedor", "cnpj"],
  },
  {
    name: "Produtos e Serviços",
    href: "/catalogo",
    icon: Package,
    categoryName: "Cadastros",
    keywords: ["catalogo", "modelos", "velas", "resinas", "aromas", "preco de venda", "margem de lucro", "produtos", "servicos"],
  },
  {
    name: "Empresas e Centros de Custo",
    href: "/empresas",
    icon: Building2,
    categoryName: "Cadastros",
    keywords: ["filiais", "matriz", "centros de custo", "departamentos", "divisoes", "unidades", "cnpj"],
  },
  {
    name: "Plano de Contas",
    href: "/plano-contas",
    icon: ListTree,
    categoryName: "Cadastros",
    keywords: ["categorias financeiras", "despesas", "receitas", "dre", "classificacao", "hierarquia contabil", "contas"],
  },
  {
    name: "Bancos e Saldos",
    href: "/bancos",
    icon: Landmark,
    categoryName: "Cadastros",
    keywords: ["contas bancarias", "saldo atual", "banco do brasil", "inter", "itau", "nubank", "caixa", "saldo"],
  },

  // Operações
  {
    name: "Estoque Integrado",
    href: "/estoque",
    icon: Boxes,
    categoryName: "Operações",
    keywords: ["materias-primas", "embalagens", "cera", "pavio", "essencia", "potes", "saldo de estoque", "inventario", "insumos"],
  },
  {
    name: "Compras e Suprimentos",
    href: "/compras",
    icon: ShoppingCart,
    categoryName: "Operações",
    keywords: ["pedidos de compra", "suprimentos", "ordem de compra", "recebimento", "titulos", "faturas", "comprar"],
  },
  {
    name: "Produção e Custos",
    href: "/producao",
    icon: Flame,
    categoryName: "Operações",
    keywords: ["lotes de fabricacao", "custo de lote", "lucro por lote", "producao de velas", "ordens de producao", "rendimento"],
  },
  {
    name: "Catálogo D.A. Com Carinho",
    href: "/catalogo",
    icon: ShoppingBag,
    categoryName: "Operações",
    keywords: ["secoes visuais", "velas decoradas", "chantilly", "vasos", "natal", "resinas", "precificacao", "aromas", "vitrine"],
  },
  {
    name: "Vendas de Velas e Resinas",
    href: "/vendas",
    icon: ShoppingBag,
    categoryName: "Operações",
    keywords: ["pedidos", "faturamento", "balcao", "encomendas", "checkout", "vender", "vendas"],
  },

  // Financeiro
  {
    name: "Contas a Pagar",
    href: "/contas-pagar",
    icon: ArrowDownCircle,
    categoryName: "Financeiro",
    keywords: ["despesas", "boletos", "fornecedores", "pagamentos", "estorno", "baixa de pagamento", "saidas", "pagar"],
  },
  {
    name: "Contas a Receber",
    href: "/contas-receber",
    icon: ArrowUpCircle,
    categoryName: "Financeiro",
    keywords: ["receitas", "entradas", "recebimentos", "cobrancas", "pix", "faturamentos pendentes", "receber"],
  },
  {
    name: "Títulos a Vencer",
    href: "/vencimentos",
    icon: CalendarClock,
    categoryName: "Financeiro",
    keywords: ["calendario", "contas de hoje", "alertas de vencimento", "proximos pagamentos", "vencendo", "vencimento"],
  },
  {
    name: "Faturas de Cartão",
    href: "/cartoes",
    icon: CreditCard,
    categoryName: "Financeiro",
    keywords: ["cartao de credito", "limite", "fechamento de fatura", "fatura mensal", "compras no cartao", "mastercard", "visa"],
  },
  {
    name: "Fluxo de Caixa",
    href: "/fluxo-caixa",
    icon: Wallet,
    categoryName: "Financeiro",
    keywords: ["entradas e saidas", "saldo diario", "projecao financeira", "movimentacoes diarias", "caixa"],
  },
  {
    name: "Conciliação Bancária",
    href: "/bancos/conciliacao",
    icon: CheckCheck,
    categoryName: "Financeiro",
    keywords: ["extrato bancario", "ofx", "pdf extrato", "conferencia", "bater saldo", "conciliacao"],
  },
  {
    name: "Dívidas e Obrigações",
    href: "/dividas",
    icon: Landmark,
    categoryName: "Financeiro",
    keywords: ["emprestimos", "financiamentos", "parcelamentos", "juros", "credores", "dividas"],
  },
  {
    name: "Investimentos e Capital",
    href: "/investimentos",
    icon: TrendingUp,
    categoryName: "Financeiro",
    keywords: ["aportes", "retiradas", "pro-labore", "distribuicao de lucros", "patrimonio", "capital"],
  },

  // Gestão
  {
    name: "CRM e Oportunidades",
    href: "/crm",
    icon: Layers,
    categoryName: "Gestão",
    keywords: ["funil de vendas", "leads", "propostas", "negociacoes", "contatos comerciais", "crm"],
  },
  {
    name: "Clientes e Mensalidades",
    href: "/clientes",
    icon: Users,
    categoryName: "Gestão",
    keywords: ["mensalistas", "assinaturas", "recorrencia", "cobranca automatica", "mensalidades"],
  },
  {
    name: "Contratos Automáticos",
    href: "/contratos",
    icon: FileText,
    categoryName: "Gestão",
    keywords: ["gerar contrato", "pdf contrato", "documentos assinados", "termos de servico", "contratos"],
  },
  {
    name: "Controle de Comissões",
    href: "/comissoes",
    icon: Percent,
    categoryName: "Gestão",
    keywords: ["comissao vendedores", "representantes", "calculo de comissao", "pagamento comissoes"],
  },
  {
    name: "Metas e Planejamento",
    href: "/metas",
    icon: Target,
    categoryName: "Gestão",
    keywords: ["metas de faturamento", "metas de producao", "objetivos do mes", "indicadores de meta", "metas"],
  },
  {
    name: "Gestão de Mídia Social",
    href: "/midia",
    icon: Megaphone,
    categoryName: "Gestão",
    keywords: ["trafego pago", "anuncios", "instagram", "facebook", "despesas de marketing", "roi", "midia"],
  },
  {
    name: "Gestão de Parcerias",
    href: "/parcerias",
    icon: Handshake,
    categoryName: "Gestão",
    keywords: ["parceiros", "influenciadores", "afiliados", "pontos de venda", "revenda", "parcerias"],
  },

  // Sistema
  {
    name: "Auditoria e Logs",
    href: "/auditoria",
    icon: ShieldCheck,
    categoryName: "Sistema",
    keywords: ["seguranca", "historico de alteracoes", "quem alterou", "logs de auditoria", "rastreabilidade", "auditoria"],
  },
];

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Estado de expansão/recolhimento das 5 categorias
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    return {
      cadastros: true,
      operacoes: true,
      financeiro: true,
      gestao: true,
      sistema: true,
    };
  });

  // Limpa busca e garante que a categoria da rota atual esteja aberta ao mudar de página
  useEffect(() => {
    setSearchTerm("");
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

  // Atalho de teclado global: tecla '/' ou 'Ctrl+K' / 'Cmd+K' foca a busca
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

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

  // Filtragem inteligente por nome, palavras-chave, sinônimos e categoria
  const normalizedQuery = normalizeText(searchTerm);
  const filteredItems = normalizedQuery
    ? allSearchableItems.filter((item) => {
        const nameNorm = normalizeText(item.name);
        const catNorm = normalizeText(item.categoryName);
        if (nameNorm.includes(normalizedQuery) || catNorm.includes(normalizedQuery)) {
          return true;
        }
        return item.keywords.some((kw) => normalizeText(kw).includes(normalizedQuery));
      })
    : [];

  // Reseta índice selecionado quando a pesquisa muda
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Navegação por teclado dentro do campo de busca
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchTerm("");
      searchInputRef.current?.blur();
      return;
    }

    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredItems[selectedIndex];
      if (target) {
        router.push(target.href);
        setSearchTerm("");
        setIsOpenMobile(false);
      }
    }
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

        {/* Barra de Pesquisa Rápida Global do Menu (Antes de Dashboard Geral) */}
        <div className="px-2 pt-2.5 pb-2 border-b border-slate-800/80 bg-slate-950/20 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar no sistema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-950/70 hover:bg-slate-950 focus:bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 text-slate-400 hover:text-white p-0.5"
                title="Limpar busca (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-800/80 rounded border border-slate-700 pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Lista de Navegação com rolagem compacta e suave */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1 text-slate-300 scrollbar-thin scrollbar-thumb-slate-800">
          {searchTerm.trim() ? (
            /* Resultados da Pesquisa Interativa */
            <div className="space-y-1 py-0.5">
              <div className="px-1.5 py-1 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Resultados ({filteredItems.length})</span>
                {filteredItems.length > 0 && (
                  <span className="text-[9px] text-slate-500 font-normal lowercase flex items-center gap-1">
                    <CornerDownLeft className="w-2.5 h-2.5" /> enter p/ abrir
                  </span>
                )}
              </div>

              {filteredItems.length === 0 ? (
                <div className="px-2 py-6 text-center text-xs text-slate-400 space-y-2">
                  <Search className="w-5 h-5 mx-auto text-slate-500 opacity-60" />
                  <p className="font-semibold text-slate-300 text-xs">Nenhuma opção encontrada</p>
                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    Tente termos como estoque, pagar, cliente, vendas, boletos, dre...
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      searchInputRef.current?.focus();
                    }}
                    className="text-xs text-indigo-400 hover:underline font-bold mt-1 inline-block"
                  >
                    Limpar pesquisa
                  </button>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  const active = isRouteActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={`search-${item.categoryName}-${item.name}-${item.href}`}
                      href={item.href}
                      onClick={() => {
                        setIsOpenMobile(false);
                        setSearchTerm("");
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all group ${
                        isSelected
                          ? "bg-indigo-600 text-white font-bold shadow-sm"
                          : active
                          ? "bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 font-semibold"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/70 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isSelected
                              ? "text-white"
                              : active
                              ? "text-indigo-400"
                              : "text-slate-400 group-hover:text-white"
                          }`}
                        />
                        <div className="min-w-0">
                          <span className="truncate block leading-tight text-xs">
                            {item.name}
                          </span>
                          <span
                            className={`text-[9.5px] truncate block ${
                              isSelected ? "text-indigo-200" : "text-slate-500"
                            }`}
                          >
                            {item.categoryName}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[10px] text-indigo-200 shrink-0 font-mono pl-1">
                          ↵
                        </span>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          ) : (
            /* Menu Padrão do Sistema */
            <>
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
            </>
          )}
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
