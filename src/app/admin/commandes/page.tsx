"use client";

import { useState } from "react";
import { usePolling, useApi } from "@/hooks/usePolling";
import { useToast } from "@/components/Toast";
import { Button, Card, EmptyState, SectionTitle, Spinner, StatusPill } from "@/components/ui";
import { formatFcfa, formatDateTime, ORDER_STATUSES } from "@/lib/constants";
import { prettyPhone } from "@/lib/phone";

type Order = {
  id: number;
  reference: string;
  status: string;
  clientName: string;
  clientPhone: string;
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number;
  totalFcfa: number;
  paymentMethod: string;
  packageType: string;
  packageDescription: string;
  driverId: number | null;
  createdAt: string;
};

type Driver = { id: number; name: string; status: string; phone: string };

const FILTERS = [
  { id: "all", label: "Toutes" },
  { id: "active", label: "En cours" },
  { id: "pending", label: "En attente" },
  { id: "delivered", label: "Terminées" },
  { id: "cancelled", label: "Annulées" },
];

export default function AdminOrdersPage() {
  const toast = useToast();
  const api = useApi();
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data, refresh } = usePolling<{ orders: Order[]; drivers: Driver[] }>(
    async () => {
      const [ordersRes, driversRes] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/drivers", { cache: "no-store" }),
      ]);
      return {
        orders: ordersRes.ok ? (await ordersRes.json()).orders : [],
        drivers: driversRes.ok ? (await driversRes.json()).drivers : [],
      };
    },
    6_000,
  );

  const orders = data?.orders ?? [];
  const drivers = data?.drivers ?? [];

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "active") return ["assigned", "accepted", "arriving_pickup", "picked_up", "in_transit"].includes(o.status);
    if (filter === "pending") return o.status === "pending";
    return o.status === filter;
  });

  async function assign(orderId: number, driverId: number | null) {
    setBusyId(orderId);
    try {
      if (driverId === null) {
        await api(`/api/orders/${orderId}/assign`, { auto: true });
        toast("Attribution automatique au livreur le plus proche", "success");
      } else {
        await api(`/api/orders/${orderId}/assign`, { driverId });
        toast("Course attribuée manuellement", "success");
      }
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(orderId: number) {
    setBusyId(orderId);
    try {
      await api(`/api/orders/${orderId}/cancel`, {});
      toast("Course annulée", "info");
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setBusyId(null);
    }
  }

  const activeDrivers = drivers.filter((d) => d.status !== "inactive");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gozo-900">Commandes</h1>
        <p className="text-sm text-slate-500">Gérez toutes les livraisons : attribution, suivi et annulation</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              filter === f.id ? "bg-gozo-700 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {f.label}
            {f.id !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                {orders.filter((o) => {
                  if (f.id === "active") return ["assigned", "accepted", "arriving_pickup", "picked_up", "in_transit"].includes(o.status);
                  return o.status === f.id;
                }).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📦" title="Aucune course" hint="Les nouvelles commandes apparaîtront ici." />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Card key={o.id} className={o.status === "pending" ? "border-amber-300 bg-amber-50/40" : ""}>
              <button className="w-full text-left" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-gozo-600">{o.reference}</span>
                  <StatusPill status={o.status} />
                </div>
                <div className="mt-1.5 font-semibold text-gozo-800">
                  {o.pickupAddress} → {o.dropoffAddress}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>👤 {o.clientName} · {prettyPhone(o.clientPhone)}</span>
                  <span>📏 {o.distanceKm} km</span>
                  <span className="font-bold text-gozo-700">{formatFcfa(o.totalFcfa)}</span>
                  <span>{formatDateTime(o.createdAt)}</span>
                </div>
              </button>

              {expanded === o.id && (
                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-400">Client</p>
                      <p className="font-semibold text-gozo-800">
                        {o.clientName} · <a className="text-emerald-600 underline" href={`tel:${o.clientPhone}`}>{prettyPhone(o.clientPhone)}</a>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Destinataire</p>
                      <p className="font-semibold text-gozo-800">
                        {o.recipientName} · <a className="text-emerald-600 underline" href={`tel:${o.recipientPhone}`}>{prettyPhone(o.recipientPhone)}</a>
                      </p>
                    </div>
                    {o.packageDescription && (
                      <div>
                        <p className="text-xs text-slate-400">Colis</p>
                        <p className="font-semibold text-gozo-800">{o.packageDescription}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-400">Paiement</p>
                      <p className="font-semibold text-gozo-800 capitalize">{o.paymentMethod}</p>
                    </div>
                  </div>

                  {!["delivered", "cancelled"].includes(o.status) && (
                    <div className="rounded-2xl bg-gozo-50 p-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gozo-600">Attribution du livreur</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="gold" onClick={() => assign(o.id, null)} disabled={busyId === o.id}>
                          🎯 Auto (plus proche)
                        </Button>
                        {activeDrivers.map((d) => (
                          <Button
                            key={d.id}
                            size="sm"
                            variant={o.driverId === d.id ? "primary" : "ghost"}
                            onClick={() => assign(o.id, d.id)}
                            disabled={busyId === o.id}
                          >
                            {o.driverId === d.id ? "✓ " : ""}🛵 {d.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {["pending", "assigned", "accepted", "arriving_pickup"].includes(o.status) && (
                    <Button size="sm" variant="danger" onClick={() => cancel(o.id)} disabled={busyId === o.id}>
                      Annuler la course
                    </Button>
                  )}

                  {busyId === o.id && <Spinner className="text-gozo-600" />}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
