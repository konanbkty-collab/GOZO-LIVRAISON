import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/Toast";
import { PwaServiceWorker } from "@/components/PwaSupport";
import "./globals.css";

export const metadata: Metadata = {
  title: "GOZO LIVRAISON — Livraison à moto à Gagnoa",
  description:
    "GOZO LIVRAISON : service de livraison à moto à Gagnoa. Colis, commandes, restaurants, pharmacies et courses. Suivi GPS en temps réel. À partir de 500 FCFA.",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icons/gozo-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "GOZO" },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#14448c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-gozo-950 antialiased">
        <ToastProvider>
          <PwaServiceWorker />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
