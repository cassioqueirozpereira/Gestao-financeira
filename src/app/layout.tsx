import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gestao-financeira-six.vercel.app";
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CassaraTech & D.A. Com Carinho — ERP Integrado, Tecnologia e Artesanato",
    template: "%s | CassaraTech ERP",
  },
  description:
    "ERP Integrado de gestão empresarial multinegócios, desenvolvimento de sistemas sob medida, marketing digital, velas aromáticas artesanais e peças decorativas em resina personalizadas.",
  keywords: [
    "ERP integrado",
    "ERP empresarial",
    "gestão financeira ERP",
    "CassaraTech ERP",
    "desenvolvimento de software",
    "sistemas web sob medida",
    "marketing digital e tráfego pago",
    "gestão de redes sociais",
    "velas aromáticas artesanais",
    "lembrancinhas personalizadas",
    "peças em resina epóxi",
    "D.A. Com Carinho",
    "CassaraTech",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  authors: [{ name: "CassaraTech & D.A. Com Carinho" }],
  creator: "CassaraTech",
  publisher: "CassaraTech",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "CassaraTech & D.A. Com Carinho — ERP Integrado",
    title: "CassaraTech & D.A. Com Carinho — ERP Integrado, Tecnologia e Artesanato",
    description:
      "ERP Integrado de alta performance para tecnologia, velas aromáticas decorativas, peças em resina e gestão de redes sociais.",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1008,
        height: 453,
        alt: "CassaraTech ERP Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CassaraTech & D.A. Com Carinho",
    description:
      "Soluções em tecnologia, marketing digital, velas artesanais e peças decorativas exclusivas.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org Dados Estruturados para o Google
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "CassaraTech & D.A. Com Carinho",
        url: siteUrl,
        logo: `${siteUrl}/favicon.ico`,
        description:
          "Grupo empresarial integrado atuando em Tecnologia da Informação (CassaraTech), Artesanato Premium em Velas e Resinas (D.A. Com Carinho) e Marketing Digital.",
        sameAs: [],
      },
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#localbusiness`,
        name: "D.A. Com Carinho — Velas e Resinas",
        url: `${siteUrl}/orcamento`,
        priceRange: "R$ 10,99 - R$ 57,99",
        description:
          "Produção e venda de velas aromáticas lisas, coloridas, florais, chantilly, canelados e coleção de Natal, além de peças decorativas em resina epóxi.",
      },
    ],
  };

  return (
    <html lang="pt-BR">
      <head>
        {/* JSON-LD Rich Snippets para o Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        {children}

        {/* Vercel Analytics: Monitoramento gratuito de visitantes, acessos e países */}
        <Analytics />

        {/* Vercel Speed Insights: Medição de velocidade e Core Web Vitals reais */}
        <SpeedInsights />

        {/* Google Analytics 4 (Ativado automaticamente caso configure a variável NEXT_PUBLIC_GA_ID) */}
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-analytics-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
