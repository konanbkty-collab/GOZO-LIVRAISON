"use client";

import { useEffect, useState } from "react";
import { usePolling, useApi } from "@/hooks/usePolling";
import { useToast } from "@/components/Toast";
import { Button, Card, Input, SectionTitle, Spinner } from "@/components/ui";
import { formatFcfa } from "@/lib/constants";

type Pricing = {
  baseFare: number;
  baseKm: number;
  perKm: number;
  nightSurcharge: number;
  nightStartHour: number;
  nightEndHour: number;
  rainSurcharge: number;
  commissionPercent: number;
  minimumFare: number;
};

export default function AdminPricingPage() {
  const toast = useToast();
  const api = useApi();
  const [form, setForm] = useState<Pricing | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, refresh } = usePolling<{ config: Pricing }>(
    async () => {
      const res = await fetch("/api/admin/pricing", { cache: "no-store" });
      if (!res.ok) return { config: null as unknown as Pricing };
      return res.json();
    },
    30_000,
  );

  useEffect(() => {
    if (data?.config && !form) setForm(data.config);
  }, [data, form]);

  function set<K extends keyof Pricing>(key: K, value: Pricing[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function save() {
    if (!form) return;
    setBusy(true);
    try {
      await api("/api/admin/pricing", form, "PATCH");
      toast("Grille tarifaire mise à jour", "success");
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setBusy(false);
    }
  }

  // Exemples de tarifs calculés avec la grille courante
  const examples = [3, 4, 6, 8, 12].map((km) => {
    const extra = Math.max(0, km - (form?.baseKm ?? 4));
    return { km, total: (form?.baseFare ?? 500) + Math.round(extra * (form?.perKm ?? 200)) };
  });

  if (!form) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-gozo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gozo-900">Grille tarifaire</h1>
        <p className="text-sm text-slate-500">
          Règle actuelle : {formatFcfa(form.baseFare)} pour les {form.baseKm} premiers km, puis {formatFcfa(form.perKm)} / km
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle>Tarif de base</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Tarif de base (FCFA)"
              type="number"
              value={form.baseFare}
              onChange={(e) => set("baseFare", Number(e.target.value))}
            />
            <Input
              label="Distance incluse (km)"
              type="number"
              step="0.5"
              value={form.baseKm}
              onChange={(e) => set("baseKm", Number(e.target.value))}
            />
            <Input
              label="Prix par km supplémentaire (FCFA)"
              type="number"
              value={form.perKm}
              onChange={(e) => set("perKm", Number(e.target.value))}
            />
            <Input
              label="Tarif minimum (FCFA)"
              type="number"
              value={form.minimumFare}
              onChange={(e) => set("minimumFare", Number(e.target.value))}
            />
          </div>
        </Card>

        <Card>
          <SectionTitle>Majorations</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Majoration nuit (FCFA)"
              type="number"
              value={form.nightSurcharge}
              onChange={(e) => set("nightSurcharge", Number(e.target.value))}
            />
            <Input
              label="Majoration intempéries (FCFA)"
              type="number"
              value={form.rainSurcharge}
              onChange={(e) => set("rainSurcharge", Number(e.target.value))}
            />
            <Input
              label="Heure début nuit (0-23)"
              type="number"
              min={0}
              max={23}
              value={form.nightStartHour}
              onChange={(e) => set("nightStartHour", Number(e.target.value))}
            />
            <Input
              label="Heure fin nuit (0-23)"
              type="number"
              min={0}
              max={23}
              value={form.nightEndHour}
              onChange={(e) => set("nightEndHour", Number(e.target.value))}
            />
          </div>
        </Card>

        <Card>
          <SectionTitle>Commission GOZO</SectionTitle>
          <div className="max-w-xs">
            <Input
              label="Commission prélevée (%)"
              type="number"
              step="1"
              min={0}
              max={50}
              value={form.commissionPercent}
              onChange={(e) => set("commissionPercent", Number(e.target.value))}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Pour une course à {formatFcfa(1000)} : commission {formatFcfa(Math.round((1000 * form.commissionPercent) / 100))}, revenu livreur{" "}
            {formatFcfa(1000 - Math.round((1000 * form.commissionPercent) / 100))}.
          </p>
        </Card>

        <Card>
          <SectionTitle>Aperçu des tarifs</SectionTitle>
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gozo-50 text-left text-xs uppercase tracking-wide text-gozo-600">
                  <th className="px-4 py-2">Distance</th>
                  <th className="px-4 py-2">Tarif client</th>
                  <th className="px-4 py-2">Commission</th>
                  <th className="px-4 py-2">Revenu livreur</th>
                </tr>
              </thead>
              <tbody>
                {examples.map((e) => {
                  const commission = Math.round((e.total * form.commissionPercent) / 100);
                  return (
                    <tr key={e.km} className="border-t border-slate-50">
                      <td className="px-4 py-2 font-semibold text-gozo-800">{e.km} km</td>
                      <td className="px-4 py-2 font-bold">{formatFcfa(e.total)}</td>
                      <td className="px-4 py-2 text-rose-500">{formatFcfa(commission)}</td>
                      <td className="px-4 py-2 text-emerald-600">{formatFcfa(e.total - commission)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Calculé avec le coefficient routier GOZO (distance réelle ≈ distance à vol d'oiseau × 1,3).
          </p>
        </Card>
      </div>

      <Button variant="gold" size="lg" onClick={save} disabled={busy}>
        {busy ? <Spinner /> : "Enregistrer la grille tarifaire"}
      </Button>
    </div>
  );
}
