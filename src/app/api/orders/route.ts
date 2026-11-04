import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { and, desc, eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { GAGNOA } from "@/lib/geo";

export const dynamic = "force-dynamic";

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && isFinite(n) ? n : null;
}

/** Liste des commandes selon le rôle de la session. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (session.role === "client") {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.clientId, session.userId))
      .orderBy(desc(orders.createdAt));
    return NextResponse.json({ orders: rows });
  }

  if (session.role === "driver") {
    // Courses proposées (assignées non encore acceptées) + courses actives du livreur
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.driverId, session.driverId ?? -1))
      .orderBy(desc(orders.createdAt));
    const pending = await db
      .select()
      .from(orders)
      .where(and(eq(orders.status, "pending"), eq(orders.driverId, -1)))
      .orderBy(desc(orders.createdAt))
      .limit(0);
    return NextResponse.json({ orders: rows, pending });
  }

  // admin : tout
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(500);
  return NextResponse.json({ orders: rows });
}

/** Création d'une commande (client connecté). */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const body = await request.json();

    const pickupLat = num(body.pickupLat) ?? GAGNOA.lat;
    const pickupLng = num(body.pickupLng) ?? GAGNOA.lng;
    const dropoffLat = num(body.dropoffLat);
    const dropoffLng = num(body.dropoffLng);

    if (dropoffLat === null || dropoffLng === null) {
      return NextResponse.json({ error: "Veuillez sélectionner une destination sur la carte" }, { status: 400 });
    }
    if (!body.dropoffAddress) {
      return NextResponse.json({ error: "Veuillez saisir l'adresse de destination" }, { status: 400 });
    }

    const created = await createOrder({
      clientId: session.userId,
      clientName: session.name || "Client GOZO",
      clientPhone: session.phone,
      recipientName: String(body.recipientName ?? ""),
      recipientPhone: String(body.recipientPhone ?? ""),
      pickupAddress: String(body.pickupAddress ?? "Position GPS"),
      pickupLat,
      pickupLng,
      pickupQuartier: String(body.pickupQuartier ?? ""),
      dropoffAddress: String(body.dropoffAddress ?? ""),
      dropoffLat,
      dropoffLng,
      dropoffQuartier: String(body.dropoffQuartier ?? ""),
      packageType: String(body.packageType ?? "colis"),
      packageDescription: String(body.packageDescription ?? ""),
      notes: String(body.notes ?? ""),
      paymentMethod: String(body.paymentMethod ?? "cash"),
      rain: !!body.rain,
    });

    return NextResponse.json({ ok: true, order: created });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 500 });
  }
}
