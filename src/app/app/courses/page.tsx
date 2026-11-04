"use client";

import { useState } from "react";
import Link from "next/link";
import { usePolling } from "@/hooks/usePolling";
import OrderTracking from "@/components/client/OrderTracking";
import { Card, EmptyState, StatusPill, Spinner } from "@/components/ui";
import { PACKAGE_TYPES, formatDate, formatFcfa } from "@/lib/constants";

type Order = {
  id: number;
  reference: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number;
  totalFcfa: number;
  packageType: string;
  createdAt: string;
};

export default function ClientCoursesPage() {
  const [trackingId, setTrackingId] = useState<number | null>(null);

  const { data, loading } = usePolling<{ orders: Order[] }>(
    async () => {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) return { orders: [] };
      return res.json();
    },
    15_000,
  );

  if (trackingId) {
    return (
      <OrderTracking
        orderId={trackingId}
        onBack={() => setTrackingId(null)}
        onNewOrder={() => setTrackingId(null)}
      />
    );
  }

  const orders = data?.orders ?? [];
  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const past = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-gozo-900">Mes courses</h1>
        <p className="text-sm text-slate-500">Historique de vos livraisons GOZO</p>
      </div>

      {loading && !orders.length ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-8 w-8 text-gozo-600" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="🛵"
          title="Aucune course pour le moment"
          hint="Vos prochaines livraisons apparaîtront ici."
        />
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gozo-600">En cours</h2>
              <div className="space-y-3">
                {active.map((o) => (
                  <OrderRow key={o.id} order={o} onTrack={() => setTrackingId(o.id)} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Terminées</h2>
              <div className="space-y-3">
                {past.map((o) => (
                  <OrderRow key={o.id} order={o} onTrack={() => setTrackingId(o.id)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Link href="/app" className="block">
        <div className="rounded-3xl border-2 border-dashed border-gozo-300 p-5 text-center text-sm font-bold text-gozo-600">
          + Commander une nouvelle livraison
        </div>
      </Link>
    </div>
  );
}

function OrderRow({ order, onTrack }: { order: Order; onTrack: () => void }) {
  const pkg = PACKAGE_TYPES.find((p) => p.id === order.packageType);
  return (
    <Card className="p-0">
      <button onClick={onTrack} className="w-full p-4 text-left active:bg-slate-50">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-gozo-600">{order.reference}</span>
          <StatusPill status={order.status} />
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-lg">{pkg?.icon}</span>
          <span className="truncate font-semibold text-gozo-800">
            {order.pickupAddress} → {order.dropoffAddress}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>
            {order.distanceKm} km · {formatDate(order.createdAt)}
          </span>
          <span className="font-bold text-gozo-700">{formatFcfa(order.totalFcfa)}</span>
        </div>
      </button>
    </Card>
  );
}
