import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anexo — Gestion des annexes pour l'hôtellerie",
  description: "La plateforme tout-en-un et modulaire pour campings, hôtellerie de plein air et hôtels indépendants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
