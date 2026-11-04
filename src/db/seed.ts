import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { quartiers, drivers, pricingConfig, users } from "./schema";
import { GAGNOA, GAGNOA_QUARTIERS } from "@/lib/geo";
import { getAdminPhones, normalizePhone } from "@/lib/phone";
import { DEMO_MODE } from "@/lib/constants";

/* Livreurs de démonstration (créés uniquement si NEXT_PUBLIC_GOZO_DEMO=true) */
const DEMO_DRIVERS = [
  { name: "Konan Yao", phone: "0757315268", vehicle: "Moto Yamaha", plate: "GN-4521-A", lat: 6.1335, lng: -5.9495, status: "online" },
  { name: "Traoré Ibrahim", phone: "0564661109", vehicle: "Moto Bajaj", plate: "GN-7832-B", lat: 6.1268, lng: -5.9565, status: "online" },
  { name: "Kouamé Serge", phone: "0102030405", vehicle: "Moto TVS", plate: "GN-1290-C", lat: 6.1392, lng: -5.9438, status: "online" },
  { name: "Diomandé Salif", phone: "0506070809", vehicle: "Moto Honda", plate: "GN-3344-D", lat: 6.1188, lng: -5.9522, status: "inactive" },
  { name: "Bamba Karim", phone: "0708091011", vehicle: "Moto Suzuki", plate: "GN-5566-E", lat: 6.1422, lng: -5.9622, status: "online" },
];

/**
 * Initialise la base si elle est vide (appelé par GET /api/health) :
 * - quartiers & lieux de Gagnoa avec coordonnées GPS
 * - grille tarifaire par défaut (500 FCFA / 4 km + 200 FCFA/km)
 * - comptes administrateurs (GOZO_ADMIN_PHONES)
 * - flotte de livreurs de démonstration (mode démo seulement)
 */
export async function ensureSeed(): Promise<void> {
  // Quartiers
  const qCount = await db.select().from(quartiers).limit(1);
  if (qCount.length === 0) {
    await db.insert(quartiers).values(GAGNOA_QUARTIERS);
  }

  // Config tarifaire
  const cCount = await db.select().from(pricingConfig).limit(1);
  if (cCount.length === 0) {
    await db.insert(pricingConfig).values({
      baseFare: 500,
      baseKm: 4,
      perKm: 200,
      nightSurcharge: 200,
      nightStartHour: 22,
      nightEndHour: 6,
      rainSurcharge: 100,
      commissionPercent: 15,
      minimumFare: 500,
    });
  }

  // Administrateurs : un compte par numéro autorisé
  for (const adminPhone of getAdminPhones()) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.phone, adminPhone), eq(users.role, "admin")))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({ phone: adminPhone, name: "Administrateur GOZO", role: "admin" });
    }
  }

  // Livreurs de démonstration — jamais en production
  if (DEMO_MODE) {
    const dCount = await db.select({ id: drivers.id }).from(drivers).limit(1);
    if (dCount.length === 0) {
      await db.insert(drivers).values(
        DEMO_DRIVERS.map((d) => ({
          name: d.name,
          phone: normalizePhone(d.phone),
          vehicle: d.vehicle,
          plate: d.plate,
          status: d.status,
          lat: d.lat,
          lng: d.lng,
        })),
      );
    }
  }
}

export const DEMO_DRIVER_PHONES = DEMO_DRIVERS.map((d) => normalizePhone(d.phone));
export const GAGNOA_CENTER = GAGNOA;
