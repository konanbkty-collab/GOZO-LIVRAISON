import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Statuts autorisés pour le livreur. */
const DRIVER_TRANSITIONS: OrderStatus[] = ["accepted", "arriving_pickup", "picked_up", "in_transit", "delivered"];

/** Mise à jour du statut par le livreur (avec signature / photo optionnelles). */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!isFinite(orderId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  const order = rows[0];

  // Seul le livreur assigné (ou l'admin) peut faire avancer le statut
  const isDriver = session.role === "driver" && order.driverId === session.driverId;
  const isAdmin = session.role === "admin";
  if (!isDriver && !isAdmin) {
    return NextResponse.json({ error: "Seul le livreur assigné peut mettre à jour le statut" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const status = String(body.status ?? "") as OrderStatus;

    if (isDriver && !DRIVER_TRANSITIONS.includes(status)) {
      return NextResponse.json({ error: "Transition de statut non autorisée" }, { status: 400 });
    }
    if (order.status === "delivered" || order.status === "cancelled") {
      return NextResponse.json({ error: "Cette course est déjà terminée" }, { status: 400 });
    }

    // Limiter la taille des preuves (dataURL)
    const signatureData = typeof body.signatureData === "string" ? body.signatureData.slice(0, 400_000) : undefined;
    const photoData = typeof body.photoData === "string" ? body.photoData.slice(0, 2_000_000) : undefined;

    await updateOrderStatus(orderId, status, {
      signatureData,
      photoData,
      actorRole: session.role,
      actorName: session.name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 500 });
  }
}
