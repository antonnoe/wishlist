import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boîte à idées — Communities Abroad",
  description: "Ideeën en wensen voor de Communities Abroad tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
