/**
 * Données géographiques de Gagnoa (Côte d'Ivoire) — quartiers, lieux et
 * coordonnées GPS utilisées pour la géolocalisation, le calcul des distances
 * et l'affichage cartographique.
 */

export const GAGNOA = {
  name: "Gagnoa",
  region: "Gôh-Djiboua",
  lat: 6.1319,
  lng: -5.9506,
};

export type QuartierSeed = {
  name: string;
  type: "quartier" | "village" | "lieu";
  lat: number;
  lng: number;
  description: string;
};

/**
 * Quartiers et points de repère de Gagnoa.
 * Les coordonnées sont des positions GPS approximatives au centre de chaque
 * quartier / lieu, suffisamment précises pour le calcul de distance et
 * l'affichage carte. La ville s'étend sur ~4 km autour du centre-ville.
 */
export const GAGNOA_QUARTIERS: QuartierSeed[] = [
  // ---- Centre-ville & commerces ----
  { name: "Commerce", type: "quartier", lat: 6.1322, lng: -5.951, description: "Centre-ville commerçant, marché central" },
  { name: "Marché Central", type: "lieu", lat: 6.1322, lng: -5.9518, description: "Grand marché de Gagnoa" },
  { name: "Quartier des Affaires", type: "quartier", lat: 6.1305, lng: -5.9485, description: "Business district, banques et administrations" },
  { name: "Préfecture de Gagnoa", type: "lieu", lat: 6.1328, lng: -5.9545, description: "Préfecture, services publics" },
  { name: "Cathédrale Sainte-Anne", type: "lieu", lat: 6.1308, lng: -5.9498, description: "Cathédrale de Gagnoa" },

  // ---- Quartiers résidentiels ----
  { name: "Dioulabougou", type: "quartier", lat: 6.1348, lng: -5.9428, description: "Quartier résidentiel à l'est" },
  { name: "Zapata", type: "quartier", lat: 6.1288, lng: -5.9622, description: "Quartier populaire à l'ouest" },
  { name: "Sokoura", type: "quartier", lat: 6.1352, lng: -5.9608, description: "Quartier au nord-ouest" },
  { name: "Dar es Salam", type: "quartier", lat: 6.1392, lng: -5.95, description: "Quartier au nord" },
  { name: "Odiennekourani", type: "quartier", lat: 6.1415, lng: -5.9562, description: "Quartier au nord-ouest" },
  { name: "Libreville", type: "quartier", lat: 6.13, lng: -5.941, description: "Quartier à l'est" },
  { name: "Cocoville", type: "quartier", lat: 6.1422, lng: -5.9425, description: "Quartier résidentiel au nord-est" },
  { name: "Barouhio", type: "quartier", lat: 6.1242, lng: -5.9372, description: "Quartier au sud-est" },
  { name: "Babré", type: "quartier", lat: 6.1188, lng: -5.9338, description: "Quartier au sud" },
  { name: "Garahio", type: "quartier", lat: 6.1158, lng: -5.9452, description: "Quartier au sud" },
  { name: "Afridoukou", type: "quartier", lat: 6.1212, lng: -5.9668, description: "Quartier à l'ouest" },
  { name: "Résidentiel 1", type: "quartier", lat: 6.1238, lng: -5.9568, description: "Zone résidentielle" },
  { name: "Résidentiel 3", type: "quartier", lat: 6.1182, lng: -5.9608, description: "Zone résidentielle" },
  { name: "Sogefiha", type: "quartier", lat: 6.1268, lng: -5.9458, description: "Quartier au centre-sud" },
  { name: "Baoulébougou", type: "quartier", lat: 6.1395, lng: -5.9558, description: "Quartier au nord-ouest" },
  { name: "Soleil", type: "quartier", lat: 6.1262, lng: -5.9552, description: "Quartier au centre" },
  { name: "Nayraiville", type: "quartier", lat: 6.1328, lng: -5.9658, description: "Quartier à l'ouest" },
  { name: "Saint-Georges", type: "quartier", lat: 6.1295, lng: -5.9455, description: "Quartier au centre-sud" },
  { name: "Cité Yacouba Sylla", type: "quartier", lat: 6.1252, lng: -5.9515, description: "Cité résidentielle" },
  { name: "Delboh", type: "quartier", lat: 6.1375, lng: -5.938, description: "Quartier au nord-est" },

  // ---- Infrastructures & services ----
  { name: "Gare Routière de Gagnoa", type: "lieu", lat: 6.1342, lng: -5.9438, description: "Gare routière" },
  { name: "Stade Victor Biaka Boda", type: "lieu", lat: 6.1258, lng: -5.9448, description: "Stade municipal" },
  { name: "Hôpital Régional de Gagnoa", type: "lieu", lat: 6.1282, lng: -5.9442, description: "Hôpital régional" },
  { name: "Université Jean Lorougnon Guédé", type: "lieu", lat: 6.1228, lng: -5.9582, description: "Campus universitaire" },
  { name: "Aéroport de Gagnoa", type: "lieu", lat: 6.1029, lng: -5.9868, description: "Aéroport civil de Gagnoa" },

  // ---- Villages périphériques ----
  { name: "Guessihio", type: "village", lat: 6.1125, lng: -5.969, description: "Village périphérique à l'ouest" },
  { name: "Logobia", type: "village", lat: 6.147, lng: -5.9385, description: "Village au nord-est" },
  { name: "Toutoubré", type: "village", lat: 6.1535, lng: -5.9495, description: "Village au nord" },
  { name: "Maguiahio", type: "village", lat: 6.1055, lng: -5.941, description: "Village au sud" },
];

/* ------------------------------------------------------------------ */
/* Calculs géographiques                                               */
/* ------------------------------------------------------------------ */

/** Distance à vol d'oiseau (km) entre deux points GPS (formule de Haversine). */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Distance routière estimée : distance à vol d'oiseau × coefficient de
 * détour (les rues de Gagnoa ne suivent pas des lignes droites).
 */
export const ROAD_FACTOR = 1.3;
export const AVG_SPEED_KMH = 24; // vitesse moyenne d'une moto en ville

export function roadDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  return haversineKm(lat1, lng1, lat2, lng2) * ROAD_FACTOR;
}

/** Durée estimée du trajet en minutes. */
export function estimateDurationMin(distanceKm: number): number {
  return Math.max(3, Math.round((distanceKm / AVG_SPEED_KMH) * 60));
}

/** Recherche textuelle simple dans une liste de lieux. */
export function searchPlaces<T extends { name: string; type: string }>(
  query: string,
  places: T[],
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return places.slice(0, 8);
  return places
    .filter((p) => p.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, 8);
}

/** Position GPS approximative par défaut (centre de Gagnoa). */
export function defaultPosition() {
  return { lat: GAGNOA.lat, lng: GAGNOA.lng };
}
