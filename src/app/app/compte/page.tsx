"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePolling } from "@/hooks/usePolling";
import { Button, Card, SectionTitle } from "@/components/ui";
import { GOZO_PHONES, PAYMENT_METHODS, formatFcfa } from "@/lib/constants";
import { prettyPhone } from "@/lib/phone";

type MeData = {
  session: { userId: number; phone: string; name: string; role: string } | null;
};

export default function ClientAccountPage() {
  const router = useRouter();
  const { data } = usePolling<MeData>(
    async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      return res.json();
    },
    60_000,
  );

  const session = data?.session;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/app");
    router.refresh();
  }

  if (!session) {
    return (
      <div className="pt-10 text-center">
        <p className="mb-4 text-slate-500">Connectez-vous pour accéder à votre compte.</p>
        <Link href="/app">
          <Button>Se connecter</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="text-xl font-extrabold text-gozo-900">Mon compte</h1>

      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gozo-100 text-3xl">👤</div>
          <div>
            <p className="text-lg font-extrabold text-gozo-900">{session.name || "Client GOZO"}</p>
            <p className="text-sm text-slate-500">{prettyPhone(session.phone)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Moyens de paiement acceptés</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
              <span className="text-lg">{m.icon}</span>
              <span className="text-xs font-semibold text-gozo-800">{m.short}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Contact GOZO LIVRAISON</SectionTitle>
        <p className="text-sm text-slate-500">Une question ? Appelez-nous directement :</p>
        <div className="mt-2 space-y-2">
          {GOZO_PHONES.map((p) => (
            <a
              key={p}
              href={`tel:${p.replace(/\s/g, "")}`}
              className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 font-semibold text-emerald-700"
            >
              📞 {p}
              <span className="text-xs font-normal text-emerald-500">Appeler</span>
            </a>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Tarification</SectionTitle>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">✅ <span><strong>500 FCFA</strong> pour les 4 premiers kilomètres</span></li>
          <li className="flex items-center gap-2">➕ <span><strong>200 FCFA</strong> par kilomètre supplémentaire</span></li>
          <li className="flex items-center gap-2">🌙 <span>Majoration de nuit configurable</span></li>
        </ul>
        <p className="mt-3 rounded-xl bg-gozo-50 p-3 text-xs text-gozo-700">
          Le tarif exact est calculé automatiquement et affiché avant validation de votre commande.
        </p>
      </Card>

      <Button variant="ghost" className="w-full" onClick={logout}>
        Se déconnecter
      </Button>
    </div>
  );
}
