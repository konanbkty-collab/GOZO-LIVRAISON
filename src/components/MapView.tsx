"use client";

import { useEffect, useRef } from "react";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MarkerSpec = {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
  tone?: "driver" | "pickup" | "destination";
  label?: string;
  popup?: string;
};

export type MapViewProps = {
  center?: [number, number];
  zoom?: number;
  markers?: MarkerSpec[];
  route?: [number, number][];
  className?: string;
  fit?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
};

const TONE_STYLES: Record<string, string> = {
  driver: "bg-gozo-700 text-white ring-4 ring-gozo-200",
  pickup: "bg-gold-400 text-gozo-900 ring-4 ring-gold-200",
  destination: "bg-emerald-500 text-white ring-4 ring-emerald-200",
};

function makeIcon(spec: MarkerSpec): L.DivIcon {
  const tone = TONE_STYLES[spec.tone ?? "pickup"] ?? TONE_STYLES.pickup;
  const isDriver = spec.tone === "driver";
  const html = `
    <div class="relative flex h-10 w-10 items-center justify-center rounded-full shadow-lg ${tone}" style="font-size:18px;line-height:1">
      <span>${spec.emoji}</span>
      ${isDriver ? '<span class="marker-pulse pointer-events-none absolute inset-0 rounded-full" style="--pulse-color:#1b5aaf"></span>' : ""}
    </div>`;
  return L.divIcon({
    html,
    className: "gozo-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}

/** Ajuste automatiquement le cadre sur les marqueurs et le trajet. */
function FitBounds({ markers, route }: { markers: MarkerSpec[]; route?: [number, number][] }) {
  const map = useMap();
  const lastKey = useRef("");

  useEffect(() => {
    const points: [number, number][] = [
      ...markers.map((m) => [m.lat, m.lng] as [number, number]),
      ...(route ?? []),
    ];
    if (!points.length) return;
    const key = points.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join("|");
    if (key === lastKey.current) return;
    lastKey.current = key;

    const bounds = L.latLngBounds(points);
    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 15), { animate: true });
    } else {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16, animate: true });
    }
  }, [markers, route, map]);

  return null;
}

/** Gère les clics sur la carte (sélection d'un point). */
function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Carte OpenStreetMap (Leaflet) — utilisée par le client (suivi GPS),
 * le livreur (navigation) et l'admin (flotte).
 */
export default function MapView({
  center = [6.1319, -5.9506],
  zoom = 14,
  markers = [],
  route,
  className = "h-64 w-full",
  fit = true,
  onMapClick,
  interactive = true,
}: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`${className} z-0`}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {fit && <FitBounds markers={markers} route={route} />}
      {onMapClick && <MapClickHandler onClick={onMapClick} />}
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={makeIcon(m)}>
          {(m.popup || m.label) && (
            <Popup>
              <span className="font-semibold text-gozo-800">{m.popup ?? m.label}</span>
            </Popup>
          )}
        </Marker>
      ))}
      {route && route.length > 1 && (
        <Polyline
          positions={route}
          pathOptions={{ color: "#14448c", weight: 4, opacity: 0.85, dashArray: "1 10", lineCap: "round" }}
        />
      )}
    </MapContainer>
  );
}
