"use client";

import { useEffect, useState } from "react";
import { usePolling } from "@/hooks/usePolling";
import OtpLogin from "@/components/client/OtpLogin";
import OrderForm from "@/components/client/OrderForm";
import OrderTracking from "@/components/client/OrderTracking";
import { EmptyState, Spinner } from "@/components/ui";
import { Logo } from "@/components/Logo";

type MeData = {
  session: { userId: number; phone: string; name: string; role: string } | null;
};

export default function ClientOrderPage() {
  const [trackingId, setTrackingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, refresh } = usePolling<MeData>(
    async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      return res.json();
    },
    60_000,
  );


  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-gozo-600" />
      </div>
    );
  }

  const session = data?.session;

  // Non connecté → connexion OTP
  if (!session) {
    return (
      <div className="animate-fade-up">
        <div className="mb-6 text-center">
          <Logo className="mx-auto mb-3 h-16" />
          <h1 className="text-xl font-extrabold text-gozo-900">Bienvenue chez GOZO LIVRAISON</h1>
          <p className="mt-1 text-sm text-slate-500">
            Commandez une livraison à moto à Gagnoa et suivez votre colis en direct sur la carte.
          </p>
        </div>
        <OtpLogin role="client" redirectTo="/app" onLoggedIn={refresh} />
      </div>
    );
  }

  // Suivi d'une course
  if (trackingId) {
    return <OrderTracking orderId={trackingId} onBack={() => setTrackingId(null)} onNewOrder={() => setTrackingId(null)} />;
  }

  // Formulaire de commande
  return (
    <div className="animate-fade-up">
      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-gozo-900">Nouvelle livraison 🛵</h1>
        <p className="text-sm text-slate-500">Bonjour {session.name || session.phone}, où livrons-nous aujourd'hui ?</p>
      </div>
      <OrderForm user={{ id: session.userId, phone: session.phone, name: session.name }} onOrderCreated={(id) => setTrackingId(id)} />
    </div>
  );
}
