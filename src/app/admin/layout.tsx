"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePolling } from "@/hooks/usePolling";
import OtpLogin from "@/components/client/OtpLogin";
import { Logo } from "@/components/Logo";
import { InstallAppCard } from "@/components/PwaSupport";
import { Spinner } from "@/components/ui";
import { DEMO_MODE } from "@/lib/constants";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: "📊" },
  { href: "/admin/commandes", label: "Commandes", icon: "📦" },
  { href: "/admin/livreurs", label: "Livreurs", icon: "🛵" },
  { href: "/admin/tarifs", label: "Tarification", icon: "💰" },
  { href: "/admin/paiements", label: "Paiements", icon: "🧾" },
];

type MeData = {
  session: { userId: number; phone: string; name: string; role: string } | null;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data, loading, refresh } = usePolling<MeData>(
    async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) return { session: null };
      return res.json();
    },
    60_000,
  );

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-gozo-600" />
      </div>
    );
  }

  if (!data?.session || data.session.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mb-6 text-center">
          <Logo className="mx-auto mb-3 h-14" />
          <h1 className="text-xl font-extrabold text-gozo-900">Administration GOZO LIVRAISON</h1>
          <p className="mt-1 text-sm text-slate-500">Accès réservé à l'équipe GOZO de Gagnoa</p>
        </div>
        <OtpLogin
          role="admin"
          title="Connexion administrateur"
          subtitle={DEMO_MODE ? "Numéro administrateur de démonstration : 07 07 07 07 07" : "Réservé aux numéros administrateurs enregistrés"}
          redirectTo="/admin"
          demoPhones={DEMO_MODE ? [{ name: "Administrateur (démo)", phone: "0707070707" }] : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-gozo-900 p-4 lg:flex">
        <Link href="/admin" className="mb-8 block">
          <Logo className="h-12" withCity={false} />
        </Link>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                  active ? "bg-gold-400 text-gozo-900" : "text-gozo-100 hover:bg-white/10"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl bg-white/5 p-3 text-xs text-gozo-200">
          <p className="font-bold text-white">Gagnoa, Côte d'Ivoire</p>
          <p className="mt-1">GOZO LIVRAISON — panneau d'administration</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-40 flex items-center justify-between bg-gozo-800 px-4 py-3 lg:hidden">
          <Logo className="h-8" withCity={false} />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl bg-white/10 p-2 text-white"
            aria-label="Menu"
          >
            ☰
          </button>
        </header>

        {menuOpen && (
          <nav className="z-30 space-y-1 border-b border-slate-200 bg-white p-2 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold ${
                  pathname === item.href ? "bg-gozo-50 text-gozo-700" : "text-slate-600"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <main className="flex-1 p-4 pb-10 lg:p-6">
          <InstallAppCard className="mb-4 lg:hidden" />
          {children}
        </main>
      </div>
    </div>
  );
}
