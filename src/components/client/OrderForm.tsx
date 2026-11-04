"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useApi } from "@/hooks/usePolling";
import { useToast } from "@/components/Toast";
import { Button, Card, Input, SectionTitle, Spinner } from "@/components/ui";
import PlacePicker, { type Place } from "@/components/client/PlacePicker";
import { PAYMENT_METHODS, PACKAGE_TYPES, formatFcfa } from "@/lib/constants";
import type { PaymentMethodId, PackageTypeId } from "@/lib/constants";
import type { Quote } from "@/lib/pricing";
import { GAGNOA } from "@/lib/geo";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type PlaceSuggestion = { id: number; name: string; type: string; lat: number; lng: number };

/** Champ de recherche de lieu (quartiers de Gagnoa) */
function PlaceSearch({
  label,
  placeholder,
  value,
  onChange,
  onPick,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onPick: (s: PlaceSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const api = useApi();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value || value.length < 1) {
      setSuggestions([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await api<{ places: PlaceSuggestion[] }>(`/api/quartiers?q=${encodeURIComponent(value)}`, undefined, "GET");
        setSuggestions(res.places ?? []);
        setOpen(true);
      } catch {
        /* silencieux */
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => value && setOpen(true)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onPick(s);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-2.5 text-left last:border-0 hover:bg-gozo-50"
            >
              <span className="text-lg">{s.type === "lieu" ? "🏛️" : s.type === "village" ? "🌾" : "📍"}</span>
              <span>
                <span className="block text-sm font-semibold text-gozo-800">{s.name}</span>
                <span className="block text-xs text-slate-400 capitalize">{s.type}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type OrderFormProps = {
  user: { id: number; phone: string; name: string };
  onOrderCreated: (orderId: number) => void;
};

/** Formulaire de commande en 2 étapes : trajet → tarif & paiement. */
export default function OrderForm({ user, onOrderCreated }: OrderFormProps) {
  const toast = useToast();
  const api = useApi();

  const [step, setStep] = useState<"trajet" | "tarif">("trajet");
  const [pickerOpen, setPickerOpen] = useState<"pickup" | "dropoff" | null>(null);

  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [pickup, setPickup] = useState<Place | null>(null);
  const [dropoff, setDropoff] = useState<Place | null>(null);

  const [packageType, setPackageType] = useState<PackageTypeId>("colis");
  const [packageDescription, setPackageDescription] = useState("");
  const [recipientMode, setRecipientMode] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("cash");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);

  const route = useMemo(() => {
    if (!pickup || !dropoff) return [];
    return [
      [pickup.lat, pickup.lng] as [number, number],
      [dropoff.lat, dropoff.lng] as [number, number],
    ];
  }, [pickup, dropoff]);

  const markers = useMemo(() => {
    const m: { id: string; lat: number; lng: number; emoji: string; tone: "pickup" | "destination"; label: string }[] = [];
    if (pickup) m.push({ id: "pickup", ...pickup, emoji: "📦", tone: "pickup", label: "Départ" });
    if (dropoff) m.push({ id: "dropoff", ...dropoff, emoji: "🎯", tone: "destination", label: "Destination" });
    return m;
  }, [pickup, dropoff]);

  async function requestQuote() {
    if (!pickup || !dropoff) {
      toast("Sélectionnez le point de départ et la destination", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ quote: Quote }>("/api/quote", {
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
      });
      setQuote(res.quote);
      setStep("tarif");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur de calcul", "error");
    } finally {
      setLoading(false);
    }
  }

  async function confirmOrder() {
    if (!pickup || !dropoff) return;
    if (recipientMode && !recipientPhone.trim()) {
      toast("Indiquez le numéro du destinataire", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ order: { id: number } }>("/api/orders", {
        pickupAddress: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        pickupQuartier: pickup.quartier,
        dropoffAddress: dropoff.address,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        dropoffQuartier: dropoff.quartier,
        packageType,
        packageDescription,
        recipientName: recipientMode ? recipientName : "",
        recipientPhone: recipientMode ? recipientPhone : "",
        notes,
        paymentMethod,
      });
      toast("Course créée ! Recherche d'un livreur…", "success");
      onOrderCreated(res.order.id);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setLoading(false);
    }
  }

  function placeSummary(p: Place | null): string {
    if (!p) return "Non défini";
    return p.address || `GPS ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`;
  }

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {(["trajet", "tarif"] as const).map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step === s ? "bg-gozo-700 text-white" : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {step === s ? i + 1 : "✓"}
            </div>
            <span className={`text-sm font-semibold ${step === s ? "text-gozo-800" : "text-slate-400"}`}>
              {s === "trajet" ? "Trajet" : "Tarif & paiement"}
            </span>
            {i === 0 && <div className="h-0.5 flex-1 rounded bg-slate-200" />}
          </div>
        ))}
      </div>

      {step === "trajet" && (
        <div className="animate-fade-up space-y-4">
          <Card className="space-y-4">
            <SectionTitle>Où allons-nous ?</SectionTitle>

            {/* Départ */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-gozo-900">A</span>
                <span className="text-sm font-bold text-gozo-800">Point de départ</span>
              </div>
              <PlaceSearch
                label="Rechercher un quartier"
                placeholder="Ex : Dioulabougou, Commerce…"
                value={pickupQuery}
                onChange={(v) => {
                  setPickupQuery(v);
                  setPickup(null);
                }}
                onPick={(s) => {
                  setPickupQuery(s.name);
                  setPickup({ lat: s.lat, lng: s.lng, address: s.name, quartier: s.name });
                }}
              />
              <div className="mt-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPickerOpen("pickup")}
                  className="flex-1"
                >
                  📍 Choisir sur la carte
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    navigator.geolocation?.getCurrentPosition(
                      (pos) => {
                        setPickupQuery("Ma position");
                        setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: "Ma position GPS", quartier: "" });
                      },
                      () => toast("Géolocalisation indisponible, utilisez la carte", "error"),
                    );
                  }}
                >
                  🧭 Me géolocaliser
                </Button>
              </div>
              {pickup && (
                <p className="mt-2 truncate rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gozo-700 shadow-sm">
                  ✓ {placeSummary(pickup)}
                </p>
              )}
            </div>

            {/* Destination */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">B</span>
                <span className="text-sm font-bold text-gozo-800">Destination</span>
              </div>
              <PlaceSearch
                label="Rechercher un quartier"
                placeholder="Ex : Résidentiel 1, Zapata…"
                value={dropoffQuery}
                onChange={(v) => {
                  setDropoffQuery(v);
                  setDropoff(null);
                }}
                onPick={(s) => {
                  setDropoffQuery(s.name);
                  setDropoff({ lat: s.lat, lng: s.lng, address: s.name, quartier: s.name });
                }}
              />
              <div className="mt-2">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setPickerOpen("dropoff")}>
                  📍 Choisir sur la carte
                </Button>
              </div>
              {dropoff && (
                <p className="mt-2 truncate rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gozo-700 shadow-sm">
                  ✓ {placeSummary(dropoff)}
                </p>
              )}
            </div>

            {/* Aperçu carte */}
            {(pickup || dropoff) && (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <MapView className="h-44" markers={markers} route={route} center={[GAGNOA.lat, GAGNOA.lng]} zoom={14} />
              </div>
            )}
          </Card>

          {/* Type de colis */}
          <Card>
            <SectionTitle>Que livrons-nous ?</SectionTitle>
            <div className="grid grid-cols-5 gap-2">
              {PACKAGE_TYPES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPackageType(p.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition ${
                    packageType === p.id ? "border-gozo-600 bg-gozo-50" : "border-slate-100 bg-white"
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-[10px] font-semibold leading-tight text-gozo-800">{p.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Input
                label="Description du colis (optionnel)"
                placeholder="Ex : 2 cartons, 5 kg"
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
              />
            </div>
          </Card>

          {/* Destinataire */}
          <Card>
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-sm font-bold text-gozo-800">Le destinataire est une autre personne</span>
              <span className="relative inline-flex">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={recipientMode}
                  onChange={(e) => setRecipientMode(e.target.checked)}
                />
                <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-gozo-600" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>
            {recipientMode && (
              <div className="mt-3 space-y-3">
                <Input
                  label="Nom du destinataire"
                  placeholder="Ex : Awa Koné"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
                <Input
                  label="Téléphone du destinataire"
                  type="tel"
                  placeholder="07 07 07 07 07"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>
            )}
          </Card>

          <Button className="w-full" size="lg" onClick={requestQuote} disabled={loading || !pickup || !dropoff}>
            {loading ? <Spinner /> : "Voir le tarif →"}
          </Button>
        </div>
      )}

      {step === "tarif" && quote && (
        <div className="animate-fade-up space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-br from-gozo-700 to-gozo-900 px-5 py-4 text-white">
              <p className="text-sm text-gozo-100">Tarif estimé</p>
              <p className="text-4xl font-black">{formatFcfa(quote.total)}</p>
              <p className="mt-1 text-sm text-gozo-100">
                {quote.distanceKm} km · environ {quote.durationMin} min
              </p>
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              <div className="flex justify-between px-5 py-3">
                <span className="text-slate-500">Tarif de base ({quote.baseFare} FCFA)</span>
                <span className="font-semibold">{formatFcfa(quote.baseFare)}</span>
              </div>
              {quote.extraFare > 0 && (
                <div className="flex justify-between px-5 py-3">
                  <span className="text-slate-500">
                    Distance supplémentaire ({quote.extraKm} km × 200 FCFA)
                  </span>
                  <span className="font-semibold">{formatFcfa(quote.extraFare)}</span>
                </div>
              )}
              {quote.nightSurcharge > 0 && (
                <div className="flex justify-between px-5 py-3 text-amber-600">
                  <span>🌙 Majoration nuit</span>
                  <span className="font-semibold">{formatFcfa(quote.nightSurcharge)}</span>
                </div>
              )}
              <div className="flex justify-between bg-gozo-50 px-5 py-3 font-bold">
                <span>Total à payer</span>
                <span className="text-gozo-800">{formatFcfa(quote.total)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>Mode de paiement</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethodId)}
                  className={`flex items-center gap-2 rounded-2xl border-2 p-3 text-left transition ${
                    paymentMethod === m.id ? "border-gozo-600 bg-gozo-50" : "border-slate-100 bg-white"
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-xs font-bold leading-tight text-gozo-800">{m.short}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <Input
              label="Instructions pour le livreur (optionnel)"
              placeholder="Ex : Appeler à l'arrivée, sonner 2 fois…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Card>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setStep("trajet")}>
              ← Modifier
            </Button>
            <Button variant="gold" className="flex-[2]" size="lg" onClick={confirmOrder} disabled={loading}>
              {loading ? <Spinner /> : `Confirmer · ${formatFcfa(quote.total)}`}
            </Button>
          </div>
        </div>
      )}

      {pickerOpen && (
        <PlacePicker
          title={pickerOpen === "pickup" ? "Point de départ" : "Destination"}
          initial={pickerOpen === "pickup" ? pickup : dropoff}
          onClose={() => setPickerOpen(null)}
          onConfirm={(place) => {
            if (pickerOpen === "pickup") {
              setPickup(place);
              setPickupQuery(place.address);
            } else {
              setDropoff(place);
              setDropoffQuery(place.address);
            }
            setPickerOpen(null);
          }}
        />
      )}
    </div>
  );
}
