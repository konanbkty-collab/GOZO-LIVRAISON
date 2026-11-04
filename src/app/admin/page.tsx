"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePolling } from "@/hooks/usePolling";
import { Card, SectionTitle, StatusPill } from "@/components/ui";
import { formatFcfa, formatTime } from "@/lib/constants";
import type { MarkerSpec } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type Stats = {
  total: number;
  active: number;
  deliveredToday: number;
  cancelledToday: number;
  revenueToday: number;
  commissionToday: number;
  driversOnline: number;
  driversBusy: number;
  pending: number;
};

type Driver = {
  id: number;
  name: string;
  status: string;
  lat: number;
  lng: number;
  vehicle: string;
};

type Order = {
  id: number;
  reference: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  totalFcfa: number;
  createdAt: string;
  clientName: string;
};

export default function AdminDashboard() {
  const { data: statsData } = usePolling<{ stats: Stats }>(
    async () => {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!res.ok) return { stats: null as unknown as Stats };
      return res.json();
    },
    8_000,
  );

  const { data: driversData } = usePolling<{ drivers: Driver[] }>(
    async () => {
      const res = await fetch("/api/drivers", { cache: "no-store" });
      if (!res.ok) return { drivers: [] };
      return res.json();
    },
    8_000,
  );

  const { data: ordersData } = usePolling<{ orders: Order[] }>(
    async () => {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) return { orders: [] };
      return res.json();
    },
    8_000,
  );

  const stats = statsData?.stats;
  const drivers = driversData?.drivers ?? [];
  const orders = ordersData?.orders ?? [];

  const markers: MarkerSpec[] = drivers
    .filter((d) => d.status !== "inactive")
    .map((d) => ({
      id: `d-${d.id}`,
      lat: d.lat,
      lng: d.lng,
      emoji: "🛵",
      tone: "driver" as const,
      label: d.name,
      popup: `${d.name} — ${d.vehicle}`,
    }));

  const cards = [
    { label: "Courses en cours", value: stats?.active ?? 0, icon: "🛵", tone: "bg-sky-50 text-sky-700" },
    { label: "En attente d'attribution", value: stats?.pending ?? 0, icon: "⏳", tone: "bg-amber-50 text-amber-700" },
    { label: "Livrées aujourd'hui", value: stats?.deliveredToday ?? 0, icon: "✅", tone: "bg-emerald-50 text-emerald-700" },
    { label: "Annulées aujourd'hui", value: stats?.cancelledToday ?? 0, icon: "❌", tone: "bg-rose-50 text-rose-700" },
    { label: "CA du jour", value: formatFcfa(stats?.revenueToday ?? 0), icon: "💰", tone: "bg-gold-50 text-gold-700" },
    { label: "Commissions du jour", value: formatFcfa(stats?.commissionToday ?? 0), icon: "🏦", tone: "bg-gozo-50 text-gozo-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gozo-900">Tableau de bord</h1>
        <p className="text-sm text-slate-500">Vue d'ensemble de l'activité GOZO LIVRAISON à Gagnoa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl p-4 ${c.tone}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{c.icon}</span>
            </div>
            <p className="mt-2 text-xl font-black">{c.value}</p>
            <p className="text-xs font-semibold opacity-70">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Flotte */}
        <Card className="lg:col-span-2">
          <SectionTitle
            right={
              <span className="flex gap-2 text-xs font-bold">
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">🟢 {stats?.driversOnline ?? 0} en ligne</span>
                <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">🛵 {stats?.driversBusy ?? 0} en course</span>
              </span>
            }
          >
            Flotte en direct
          </SectionTitle>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <MapView className="h-72" markers={markers} zoom={14} fit />
          </div>
        </Card>

        {/* Courses récentes */}
        <Card className="lg:col-span-3">
          <SectionTitle right={<Link href="/admin/commandes" className="text-sm font-bold text-gozo-600 hover:underline">Tout voir →</Link>}>
            Courses récentes
          </SectionTitle>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Aucune course enregistrée pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-3">Réf.</th>
                    <th className="pb-2 pr-3">Trajet</th>
                    <th className="pb-2 pr-3">Statut</th>
                    <th className="pb-2 pr-3">Tarif</th>
                    <th className="pb-2">Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((o) => (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-3 font-mono text-xs font-bold text-gozo-600">{o.reference}</td>
                      <td className="max-w-[180px] truncate py-2.5 pr-3 font-medium text-gozo-800">
                        {o.pickupAddress} → {o.dropoffAddress}
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="py-2.5 pr-3 font-bold text-gozo-800">{formatFcfa(o.totalFcfa)}</td>
                      <td className="py-2.5 text-xs text-slate-400">{formatTime(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
