"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoCompact } from "@/components/Logo";
import { InstallAppCard } from "@/components/PwaSupport";

const TABS = [
  { href: "/app", label: "Commander", icon: "🛵" },
  { href: "/app/courses", label: "Mes courses", icon: "📋" },
  { href: "/app/compte", label: "Compte", icon: "👤" },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-slate-50">
      {/* En-tête */}
      <header className="sticky top-0 z-40 bg-gozo-800 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <LogoCompact className="h-8" />
          </Link>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gold-300">Gagnoa</span>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 px-4 pb-24 pt-4">
        <InstallAppCard className="mb-4" />
        {children}
      </main>

      {/* Navigation basse */}
      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur safe-bottom">
        <div className="flex">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition ${
                  active ? "text-gozo-700" : "text-slate-400"
                }`}
              >
                <span className={`text-xl ${active ? "scale-110" : ""} transition`}>{tab.icon}</span>
                {tab.label}
                {active && <span className="h-1 w-8 rounded-full bg-gold-400" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
