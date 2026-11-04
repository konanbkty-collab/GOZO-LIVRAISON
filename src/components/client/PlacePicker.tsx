"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button, Input, Spinner } from "@/components/ui";
import type { MarkerSpec } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export type Place = {
  lat: number;
  lng: number;
  address: string;
  quartier: string;
};

type PlacePickerProps = {
  title: string;
  initial?: Place | null;
  onConfirm: (place: Place) => void;
  onClose: () => void;
};

/**
 * Sélection d'un point GPS sur la carte (modale plein écran).
 * Cliquer sur la carte place le marqueur ; l'adresse peut être précisée.
 */
export default function PlacePicker({ title, initial, onConfirm, onClose }: PlacePickerProps) {
  const [point, setPoint] = useState<Place | null>(initial ?? null);
  const [address, setAddress] = useState(initial?.address ?? "");
  const [locating, setLocating] = useState(false);

  function locateMe() {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: "Ma position GPS", quartier: "" });
        setLocating(false);
      },
      () => {
        setPoint({ lat: 6.1319, lng: -5.9506, address: "Centre-ville de Gagnoa", quartier: "Commerce" });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  const markers: MarkerSpec[] = point
    ? [
        {
          id: "picked",
          lat: point.lat,
          lng: point.lng,
          emoji: "📍",
          tone: "pickup",
          label: address || "Point sélectionné",
        },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-white">
      <div className="flex items-center gap-3 bg-gozo-800 px-4 py-3 text-white">
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10" aria-label="Fermer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-base font-extrabold">{title}</h2>
      </div>

      <div className="relative flex-1">
        <MapView
          className="absolute inset-0 h-full w-full"
          markers={markers}
          onMapClick={(lat, lng) => setPoint({ lat, lng, address: "", quartier: "" })}
          center={point ? [point.lat, point.lng] : [6.1319, -5.9506]}
          zoom={15}
          fit={false}
        />
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-gozo-800 shadow-lg">
          👆 Touchez la carte pour placer le point
        </div>
        <button
          onClick={locateMe}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-gozo-700 shadow-xl active:scale-95"
        >
          {locating ? <Spinner className="text-gozo-700" /> : "🧭"} Ma position
        </button>
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-white p-4 safe-bottom">
        {point ? (
          <p className="rounded-xl bg-gozo-50 px-3 py-2 text-xs font-mono text-gozo-700">
            GPS : {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </p>
        ) : (
          <p className="text-sm text-slate-400">Aucun point sélectionné</p>
        )}
        <Input
          label="Adresse / précision (optionnel)"
          placeholder="Ex : Rue du Commerce, près du marché"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Button
          className="w-full"
          size="lg"
          disabled={!point}
          onClick={() => point && onConfirm({ ...point, address: address || `Gagnoa (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})` })}
        >
          Confirmer ce point
        </Button>
      </div>
    </div>
  );
}
