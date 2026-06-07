import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dirija Melhor | Gestao de Autoescola",
  description: "Sistema web para gerenciar alunos, aulas, frota e financeiro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
