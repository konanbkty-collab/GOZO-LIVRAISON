"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePolling, useApi } from "@/hooks/usePolling";
import { useToast } from "@/components/Toast";
import { Button, Card, Input, SectionTitle, Spinner } from "@/components/ui";
import { DRIVER_STATUSES, formatFcfa, formatDate } from "@/lib/constants";
import { prettyPhone } from "@/lib/phone";
import type { MarkerSpec } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type Driver = {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  status: string;
  lat: number;
  lng: number;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
};

export default function AdminDriversPage() {
  const toast = useToast();
  const api = useApi();
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data, refresh } = usePolling<{ drivers: Driver[] }>(
    async () => {
      const res = await fetch("/api/drivers", { cache: "no-store" });
      if (!res.ok) return { drivers: [] };
      return res.json();
    },
    8_000,
  );

  const drivers = data?.drivers ?? [];

  const markers: MarkerSpec[] = drivers
    .filter((d) => d.status !== "inactive")
    .map((d) => ({
      id: `d-${d.id}`,
      lat: d.lat,
      lng: d.lng,
      emoji: "🛵",
      tone: "driver" as const,
      label: d.name,
      popup: `${d.name} — ${d.status === "busy" ? "En course" : "En ligne"}`,
    }));

  async function toggleStatus(driver: Driver) {
    setBusyId(driver.id);
    try {
      const next = driver.status === "inactive" ? "online" : "inactive";
      await api(`/api/drivers/${driver.id}`, { status: next }, "PATCH");
      toast(`${driver.name} est maintenant ${next === "online" ? "actif" : "inactif"}`, "success");
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gozo-900">Flotte de livreurs</h1>
          <p className="text-sm text-slate-500">{drivers.length} livreurs · positions GPS en direct</p>
        </div>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Fermer" : "+ Ajouter un livreur"}
        </Button>
      </div>

      {/* Carte de la flotte */}
      <Card>
        <SectionTitle>Positions en direct</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <MapView className="h-72" markers={markers} zoom={14} fit />
        </div>
      </Card>

      {showForm && <AddDriverForm onDone={() => { setShowForm(false); refresh(); }} />}

      {/* Liste */}
      <div className="grid gap-3 lg:grid-cols-2">
        {drivers.map((d) => {
          const status = DRIVER_STATUSES[d.status as keyof typeof DRIVER_STATUSES];
          return (
            <Card key={d.id} className={d.status === "inactive" ? "opacity-60" : ""}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gozo-100 text-2xl">🛵</div>
                  <div>
                    <p className="font-extrabold text-gozo-900">{d.name}</p>
                    <p className="text-xs text-slate-500">
                      {prettyPhone(d.phone)} · {d.vehicle} {d.plate && `· ${d.plate}`}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status?.color ?? "bg-slate-100"}`}>
                  {status?.icon} {status?.label}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 rounded-2xl bg-slate-50 p-3 text-center">
                <div>
                  <p className="text-xs text-slate-400">Livraisons</p>
                  <p className="font-bold text-gozo-800">{d.totalDeliveries}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Gains</p>
                  <p className="text-sm font-bold text-gozo-800">{formatFcfa(d.totalEarnings)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Note</p>
                  <p className="font-bold text-gozo-800">⭐ {d.rating.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">GPS</p>
                  <p className="font-mono text-[10px] font-bold text-gozo-800">
                    {d.lat.toFixed(3)}, {d.lng.toFixed(3)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant={d.status === "inactive" ? "success" : "ghost"}
                  className="flex-1"
                  onClick={() => toggleStatus(d)}
                  disabled={busyId === d.id || d.status === "busy"}
                >
                  {busyId === d.id ? <Spinner /> : d.status === "inactive" ? "Activer" : "Désactiver"}
                </Button>
                {d.status === "busy" && (
                  <span className="self-center text-xs font-semibold text-sky-600">En course — non modifiable</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AddDriverForm({ onDone }: { onDone: () => void }) {
  const api = useApi();
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("Moto");
  const [plate, setPlate] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim() || !phone.trim()) {
      toast("Nom et téléphone requis", "error");
      return;
    }
    setBusy(true);
    try {
      await api("/api/drivers", { name, phone, vehicle, plate });
      toast("Livreur ajouté à la flotte", "success");
      onDone();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-gozo-300">
      <SectionTitle>Nouveau livreur</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Nom complet" placeholder="Ex : Kouassi Jean" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Téléphone (connexion OTP)" placeholder="07 07 07 07 07" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Véhicule" placeholder="Moto" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
        <Input label="Plaque (optionnel)" placeholder="GN-0000-A" value={plate} onChange={(e) => setPlate(e.target.value)} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Le livreur se connectera dans l'application livreur avec ce numéro (code de vérification).
      </p>
      <Button className="mt-3" variant="gold" onClick={submit} disabled={busy}>
        {busy ? <Spinner /> : "Ajouter à la flotte"}
      </Button>
    </Card>
  );
}
