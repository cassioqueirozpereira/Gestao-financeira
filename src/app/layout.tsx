import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGE — Sistema de Gestão Empresarial Integrado",
  description:
    "Sistema integrado para CassaraTech, D.A. Com Carinho, Mídia Social e Residência com segurança de nível militar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
