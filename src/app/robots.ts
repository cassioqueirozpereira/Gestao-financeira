import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gestao-financeira-six.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/orcamento"],
        disallow: [
          "/api/",
          "/desempenho",
          "/metas",
          "/dividas",
          "/comissoes",
          "/parcerias",
          "/contas-pagar",
          "/contas-receber",
          "/fluxo-caixa",
          "/bancos",
          "/catalogo",
          "/producao",
          "/crm",
          "/contratos",
          "/midia",
          "/investimentos",
          "/auditoria",
          "/empresas",
          "/plano-contas",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
