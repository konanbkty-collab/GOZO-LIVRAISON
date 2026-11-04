"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePolling, useApi } from "@/hooks/usePolling";
import { useToast } from "@/components/Toast";
import { Button, Card, SectionTitle, Spinner } from "@/components/ui";
import { ORDER_STATUSES, PAYMENT_METHODS, TRACKING_STEPS, formatDateTime, formatFcfa, formatTime } from "@/lib/constants";
import type { MarkerSpec } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type OrderTrackingProps = {
  orderId: number;
  onBack: () => void;
  onNewOrder: () => void;
};

type OrderData = {
  order: Record<string, unknown>;
  events: { id: number; status: string; message: string; createdAt: string }[];
  driver: Record<string, unknown> | null;
};

/** Suivi en direct : statut, position GPS du livreur, preuves de livraison. */
export default function OrderTracking({ orderId, onBack, onNewOrder }: OrderTrackingProps) {
  const toast = useToast();
  const api = useApi();
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);

  const { data, loading, refresh } = usePolling<OrderData>(async () => {
    const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Erreur de chargement");
    return res.json();
  }, 4000);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-gozo-600" />
      </div>
    );
  }
  if (!data) return null;

  const order = data.order as {
    id: number;
    reference: string;
    status: string;
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    dropoffAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    distanceKm: number;
    durationMin: number;
    totalFcfa: number;
    paymentMethod: string;
    packageType: string;
    packageDescription: string;
    recipientName: string;
    recipientPhone: string;
    signatureData: string;
    photoData: string;
    rating: number | null;
    createdAt: string;
  };
  const driver = data.driver as {
    id: number;
    name: string;
    phone: string;
    vehicle: string;
    plate: string;
    rating: number;
    lat: number;
    lng: number;
  } | null;

  const status = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
  const currentStep = status?.step ?? 0;
  const payment = PAYMENT_METHODS.find((m) => m.id === order.paymentMethod);

  const markers: MarkerSpec[] = [
    { id: "pickup", lat: order.pickupLat, lng: order.pickupLng, emoji: "📦", tone: "pickup", label: "Départ", popup: order.pickupAddress },
    { id: "dropoff", lat: order.dropoffLat, lng: order.dropoffLng, emoji: "🎯", tone: "destination", label: "Destination", popup: order.dropoffAddress },
  ];
  if (driver && ["assigned", "accepted", "arriving_pickup", "picked_up", "in_transit"].includes(order.status)) {
    markers.push({ id: "driver", lat: driver.lat, lng: driver.lng, emoji: "🛵", tone: "driver", label: driver.name, popup: `${driver.name} — en route` });
  }

  const route: [number, number][] =
    driver && ["assigned", "accepted", "arriving_pickup"].includes(order.status)
      ? [
          [driver.lat, driver.lng],
          [order.pickupLat, order.pickupLng],
          [order.dropoffLat, order.dropoffLng],
        ]
      : [
          [order.pickupLat, order.pickupLng],
          [order.dropoffLat, order.dropoffLng],
        ];

  async function cancelOrder() {
    setBusy(true);
    try {
      await api(`/api/orders/${orderId}/cancel`, {});
      toast("Course annulée", "info");
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setBusy(false);
    }
  }

  async function submitRating(stars: number) {
    setRating(stars);
    try {
      await api(`/api/orders/${orderId}/rate`, { rating: stars });
      toast("Merci pour votre note !", "success");
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    }
  }

  return (
    <div className="animate-fade-up space-y-4">
      {/* Carte live */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative">
          <MapView className="h-72" markers={markers} route={route} zoom={14} />
          <div className="absolute left-3 top-3 rounded-2xl bg-white/95 px-3 py-2 shadow-lg">
            <p className="font-mono text-xs font-bold text-gozo-700">{order.reference}</p>
            <p className={`text-sm font-bold ${status?.color.split(" ")[1] ?? "text-slate-600"}`}>
              {status?.icon} {status?.short}
            </p>
          </div>
          <div className="absolute right-3 top-3 flex gap-2">
            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-gozo-700 shadow">
              🛰️ GPS live
              <span className="ml-0.5 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <SectionTitle>Progression de la livraison</SectionTitle>
        <div className="space-y-0">
          {TRACKING_STEPS.map((stepKey, i) => {
            const meta = ORDER_STATUSES[stepKey as keyof typeof ORDER_STATUSES];
            const done = currentStep > i;
            const active = currentStep === i;
            return (
              <div key={stepKey} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-gozo-700 text-white ring-4 ring-gozo-100"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? "✓" : meta.icon}
                  </div>
                  {i < TRACKING_STEPS.length - 1 && (
                    <div className={`my-1 w-0.5 flex-1 rounded ${done ? "bg-emerald-400" : "bg-slate-200"}`} style={{ minHeight: 18 }} />
                  )}
                </div>
                <div className={`pb-4 ${active ? "" : done ? "opacity-70" : "opacity-40"}`}>
                  <p className="text-sm font-bold text-gozo-900">{meta.label}</p>
                  <p className="text-xs text-slate-400">
                    {active ? "En cours…" : done ? "Terminé" : "À venir"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {order.status === "cancelled" && (
          <div className="mt-2 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">
            ❌ Cette course a été annulée.
          </div>
        )}
      </Card>

      {/* Livreur */}
      {driver && order.status !== "delivered" && order.status !== "cancelled" && (
        <Card>
          <SectionTitle>Votre livreur</SectionTitle>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gozo-100 text-2xl">🛵</div>
            <div className="flex-1">
              <p className="font-extrabold text-gozo-900">{driver.name}</p>
              <p className="text-xs text-slate-500">
                {driver.vehicle} · {driver.plate} · ⭐ {driver.rating.toFixed(1)}
              </p>
            </div>
            <a
              href={`tel:${driver.phone}`}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition active:scale-95"
              aria-label="Appeler le livreur"
            >
              📞
            </a>
          </div>
        </Card>
      )}

      {/* Détails */}
      <Card>
        <SectionTitle>Détails de la course</SectionTitle>
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Départ</dt>
            <dd className="text-right font-semibold text-gozo-800">{order.pickupAddress}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Destination</dt>
            <dd className="text-right font-semibold text-gozo-800">{order.dropoffAddress}</dd>
          </div>
          {order.recipientName && order.recipientName !== "—" && (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Destinataire</dt>
              <dd className="text-right font-semibold text-gozo-800">
                {order.recipientName}
                {order.recipientPhone && (
                  <a href={`tel:${order.recipientPhone}`} className="ml-2 text-emerald-600 underline">
                    {order.recipientPhone}
                  </a>
                )}
              </dd>
            </div>
          )}
          {order.packageDescription && (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Colis</dt>
              <dd className="text-right font-semibold text-gozo-800">{order.packageDescription}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Distance / durée</dt>
            <dd className="text-right font-semibold text-gozo-800">
              {order.distanceKm} km · ~{order.durationMin} min
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Paiement</dt>
            <dd className="text-right font-semibold text-gozo-800">
              {payment?.icon} {payment?.label} · {formatFcfa(order.totalFcfa)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Créée le</dt>
            <dd className="text-right font-semibold text-gozo-800">{formatDateTime(order.createdAt)}</dd>
          </div>
        </dl>
      </Card>

      {/* Preuves de livraison */}
      {order.status === "delivered" && (
        <Card>
          <SectionTitle>Preuve de livraison</SectionTitle>
          {order.photoData && (
            <img src={order.photoData} alt="Photo de confirmation" className="mb-3 w-full rounded-2xl border border-slate-200" />
          )}
          {order.signatureData && (
            <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-2">
              <p className="mb-1 px-1 text-xs font-bold text-slate-400">Signature du client</p>
              <img src={order.signatureData} alt="Signature" className="w-full" />
            </div>
          )}
          {!order.photoData && !order.signatureData && (
            <p className="text-sm text-slate-400">Aucune preuve enregistrée pour cette livraison.</p>
          )}
          {!order.rating ? (
            <div className="mt-3">
              <p className="mb-2 text-sm font-semibold text-gozo-800">Notez votre livreur</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => submitRating(n)}
                    className="text-3xl transition active:scale-90"
                    aria-label={`${n} étoiles`}
                  >
                    {n <= rating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-emerald-600">Noté {"⭐".repeat(order.rating)}</p>
          )}
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {["pending", "assigned", "accepted", "arriving_pickup"].includes(order.status) && (
          <Button variant="danger" className="flex-1" onClick={cancelOrder} disabled={busy}>
            Annuler la course
          </Button>
        )}
        {["delivered", "cancelled"].includes(order.status) && (
          <Button className="flex-1" size="lg" variant="gold" onClick={onNewOrder}>
            Nouvelle commande
          </Button>
        )}
        <Button variant="ghost" onClick={onBack}>
          Retour
        </Button>
      </div>
    </div>
  );
}
