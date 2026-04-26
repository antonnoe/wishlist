import type { Metadata } from "next";
import "./globals.css";
import FrameOnlyRedirect from "@/components/FrameOnlyRedirect";
import { NingAuthProvider } from "@/components/NingAuthProvider";

export const metadata: Metadata = {
  title: "Boîte à idées — Communities Abroad",
  description: "Ideeën en wensen voor de Communities Abroad tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Kill-switch via env-var. Standaard uit; admin zet 'm aan
  // door NEXT_PUBLIC_NING_GATE='true' te zetten in Vercel.
  const gateEnabled = process.env.NEXT_PUBLIC_NING_GATE === 'true';

  return (
    <html lang="nl">
      <head>
        <FrameOnlyRedirect />
      </head>
      <body>
        <NingAuthProvider gateEnabled={gateEnabled}>{children}</NingAuthProvider>
      </body>
    </html>
  );
}
