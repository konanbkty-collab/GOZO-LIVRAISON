import type { PricingConfig } from "@/db/schema";
import { estimateDurationMin, roadDistanceKm } from "./geo";

/* ------------------------------------------------------------------ */
/* Moteur de tarification GOZO LIVRAISON                               */
/*                                                                     */
/* Règle : 500 FCFA pour les 4 premiers kilomètres, puis 200 FCFA      */
/* par kilomètre supplémentaire. Majorations (nuit, intempéries)       */
/* configurables par l'administrateur.                                 */
/* ------------------------------------------------------------------ */

export type QuoteInput = {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  rain?: boolean;
};

export type Quote = {
  distanceKm: number;
  durationMin: number;
  baseFare: number;
  extraKm: number;
  extraFare: number;
  fare: number;
  nightSurcharge: number;
  rainSurcharge: number;
  total: number;
  commission: number;
  driverEarnings: number;
  isNight: boolean;
};

/** Le tarif est-il majoré (nuit) selon la config ? */
export function isNightTime(cfg: Pick<PricingConfig, "nightStartHour" | "nightEndHour">, now = new Date()): boolean {
  const h = now.getHours();
  const { nightStartHour, nightEndHour } = cfg;
  if (nightStartHour === nightEndHour) return false;
  if (nightStartHour < nightEndHour) return h >= nightStartHour && h < nightEndHour;
  // plage chevauchant minuit (ex. 22h -> 6h)
  return h >= nightStartHour || h < nightEndHour;
}

/** Calcule un devis complet à partir des points GPS et de la config tarifaire. */
export function computeQuote(input: QuoteInput, cfg: PricingConfig, now = new Date()): Quote {
  const distanceKm = roadDistanceKm(input.pickupLat, input.pickupLng, input.dropoffLat, input.dropoffLng);
  const roundedKm = Math.round(distanceKm * 10) / 10;

  // 500 FCFA jusqu'à 4 km, puis 200 FCFA / km
  const extraKm = Math.max(0, roundedKm - cfg.baseKm);
  const extraFare = Math.round(extraKm * cfg.perKm);
  let fare = cfg.baseFare + extraFare;
  if (fare < cfg.minimumFare) fare = cfg.minimumFare;

  const nightSurcharge = isNightTime(cfg, now) ? cfg.nightSurcharge : 0;
  const rainSurcharge = input.rain ? cfg.rainSurcharge : 0;
  const surcharge = nightSurcharge + rainSurcharge;
  const total = fare + surcharge;

  const commission = Math.round((total * cfg.commissionPercent) / 100);

  return {
    distanceKm: roundedKm,
    durationMin: estimateDurationMin(distanceKm),
    baseFare: cfg.baseFare,
    extraKm: Math.round(extraKm * 10) / 10,
    extraFare,
    fare,
    nightSurcharge,
    rainSurcharge,
    total,
    commission,
    driverEarnings: total - commission,
    isNight: nightSurcharge > 0,
  };
}

/** Référence lisible d'une commande : GOZO-000123 */
export function orderReference(id: number): string {
  return `GOZO-${String(id).padStart(5, "0")}`;
}
