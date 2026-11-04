import { db } from "@/db";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { drivers, orderEvents, orders, payments, pricingConfig } from "@/db/schema";
import { haversineKm } from "./geo";
import { computeQuote, orderReference } from "./pricing";
import { ORDER_STATUSES, type OrderStatus } from "./constants";

/* ------------------------------------------------------------------ */
/* Logique métier des commandes de livraison                           */
/* ------------------------------------------------------------------ */

export async function getPricingConfig() {
  const rows = await db.select().from(pricingConfig).limit(1);
  if (rows.length) return rows[0];
  const created = await db
    .insert(pricingConfig)
    .values({
      baseFare: 500,
      baseKm: 4,
      perKm: 200,
      nightSurcharge: 200,
      nightStartHour: 22,
      nightEndHour: 6,
      rainSurcharge: 100,
      commissionPercent: 15,
      minimumFare: 500,
    })
    .returning();
  return created[0];
}

export async function addOrderEvent(
  orderId: number,
  status: string,
  message: string,
  actorRole = "system",
  actorName = "",
) {
  await db.insert(orderEvents).values({ orderId, status, message, actorRole, actorName });
}

export type CreateOrderInput = {
  clientId: number | null;
  clientName: string;
  clientPhone: string;
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  pickupQuartier: string;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffQuartier: string;
  packageType: string;
  packageDescription: string;
  notes: string;
  paymentMethod: string;
  rain: boolean;
};

/** Crée une commande, calcule le tarif et déclenche l'attribution auto. */
export async function createOrder(input: CreateOrderInput) {
  const cfg = await getPricingConfig();
  const quote = computeQuote(
    { pickupLat: input.pickupLat, pickupLng: input.pickupLng, dropoffLat: input.dropoffLat, dropoffLng: input.dropoffLng, rain: input.rain },
    cfg,
  );

  const inserted = await db
    .insert(orders)
    .values({
      reference: "TMP",
      clientId: input.clientId,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      recipientName: input.recipientName || input.clientName,
      recipientPhone: input.recipientPhone || input.clientPhone,
      pickupAddress: input.pickupAddress,
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      pickupQuartier: input.pickupQuartier,
      dropoffAddress: input.dropoffAddress,
      dropoffLat: input.dropoffLat,
      dropoffLng: input.dropoffLng,
      dropoffQuartier: input.dropoffQuartier,
      distanceKm: quote.distanceKm,
      durationMin: quote.durationMin,
      fareFcfa: quote.fare,
      surchargeFcfa: quote.nightSurcharge + quote.rainSurcharge,
      totalFcfa: quote.total,
      commissionFcfa: quote.commission,
      driverEarningsFcfa: quote.driverEarnings,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      packageType: input.packageType,
      packageDescription: input.packageDescription,
      notes: input.notes,
    })
    .returning();

  const order = inserted[0];
  await db.update(orders).set({ reference: orderReference(order.id) }).where(eq(orders.id, order.id));

  await addOrderEvent(order.id, "pending", "Commande créée, recherche d'un livreur à moto…", "system", "");
  await autoAssign(order.id);

  return { ...order, reference: orderReference(order.id) };
}

/** Attribution automatique : le livreur en ligne le plus proche du départ. */
export async function autoAssign(orderId: number, excludeDriverId?: number): Promise<number | null> {
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!orderRows.length) return null;
  const order = orderRows[0];
  if (order.status === "delivered" || order.status === "cancelled") return null;

  const conditions = [eq(drivers.status, "online")];
  if (excludeDriverId) conditions.push(ne(drivers.id, excludeDriverId));

  const available = await db.select().from(drivers).where(and(...conditions));

  // Distance au point de départ + bonus : le livreur déjà le plus proche gagne
  const withDistance = available
    .map((d) => ({ driver: d, distance: haversineKm(d.lat, d.lng, order.pickupLat, order.pickupLng) }))
    .sort((a, b) => a.distance - b.distance);

  if (!withDistance.length) {
    if (order.driverId) {
      await db.update(drivers).set({ status: "online", updatedAt: new Date() }).where(eq(drivers.id, order.driverId));
    }
    if (order.status !== "pending" || order.driverId !== null) {
      await db.update(orders).set({ status: "pending", driverId: null, updatedAt: new Date() }).where(eq(orders.id, orderId));
      await addOrderEvent(orderId, "pending", "Aucun livreur disponible, course en attente d'attribution", "system", "");
    }
    return null;
  }

  const best = withDistance[0];
  await assignDriver(orderId, best.driver.id);
  return best.driver.id;
}

/** Attribue une course à un livreur précis (manuel ou auto). */
export async function assignDriver(orderId: number, driverId: number) {
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const driverRows = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);
  if (!orderRows.length || !driverRows.length) return;
  const order = orderRows[0];
  const driver = driverRows[0];

  if (order.driverId && order.driverId !== driver.id) {
    await db.update(drivers).set({ status: "online", updatedAt: new Date() }).where(eq(drivers.id, order.driverId));
  }

  await db
    .update(orders)
    .set({ driverId: driver.id, status: "assigned", assignedAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  if (driver.status !== "busy") {
    await db.update(drivers).set({ status: "busy", updatedAt: new Date() }).where(eq(drivers.id, driver.id));
  }

  const distance = haversineKm(driver.lat, driver.lng, order.pickupLat, order.pickupLng);
  await addOrderEvent(
    orderId,
    "assigned",
    `Course proposée à ${driver.name} (à ${distance.toFixed(1)} km du départ)`,
    "system",
    driver.name,
  );
}

/** Refus du livreur : on tente le livreur suivant. */
export async function refuseOrder(orderId: number, driverId: number) {
  await addOrderEvent(orderId, "pending", "Livreur a refusé la course", "driver", "");
  await db.update(drivers).set({ status: "online", updatedAt: new Date() }).where(eq(drivers.id, driverId));
  const next = await autoAssign(orderId, driverId);
  // Si aucun autre livreur n'est disponible, la course reste en attente.
  if (!next) {
    await db.update(orders).set({ driverId: null, status: "pending", updatedAt: new Date() }).where(eq(orders.id, orderId));
  }
  return next;
}

/** Met à jour le statut d'une commande (par le livreur, client ou admin). */
export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
  opts: { signatureData?: string; photoData?: string; actorRole?: string; actorName?: string } = {},
) {
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!orderRows.length) throw new Error("Commande introuvable");
  const order = orderRows[0];

  const now = new Date();
  const patch: Record<string, unknown> = { status, updatedAt: now };

  if (status === "accepted") patch.acceptedAt = now;
  if (status === "picked_up") patch.pickedUpAt = now;
  if (status === "delivered") {
    patch.deliveredAt = now;
    patch.paymentStatus = "paid";
  }
  if (status === "cancelled") patch.cancelledAt = now;
  if (opts.signatureData) patch.signatureData = opts.signatureData;
  if (opts.photoData) patch.photoData = opts.photoData;

  await db.update(orders).set(patch).where(eq(orders.id, orderId));

  // Effets de bord
  if (status === "delivered" && order.driverId) {
    const driverRow = (await db.select().from(drivers).where(eq(drivers.id, order.driverId)).limit(1))[0];
    await db
      .update(drivers)
      .set({
        totalDeliveries: driverRow.totalDeliveries + 1,
        totalEarnings: driverRow.totalEarnings + order.driverEarningsFcfa,
        status: "online",
        updatedAt: now,
      })
      .where(eq(drivers.id, order.driverId));

    // paiement
    await db.insert(payments).values({
      orderId: order.id,
      reference: order.reference,
      amountFcfa: order.totalFcfa,
      commissionFcfa: order.commissionFcfa,
      driverEarningsFcfa: order.driverEarningsFcfa,
      method: order.paymentMethod,
      status: "paid",
      driverName: driverRow.name,
      clientPhone: order.clientPhone,
      paidAt: now,
    });
  }

  if (status === "cancelled" && order.driverId) {
    await db.update(drivers).set({ status: "online", updatedAt: now }).where(eq(drivers.id, order.driverId));
  }

  const label = ORDER_STATUSES[status]?.label ?? status;
  await addOrderEvent(orderId, status, `Statut mis à jour : ${label}`, opts.actorRole ?? "system", opts.actorName ?? "");
}

/** Vérifie qu'un livreur a bien une course active. */
export async function getActiveOrderForDriver(driverId: number) {
  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.driverId, driverId),
        inArray(orders.status, ["assigned", "accepted", "arriving_pickup", "picked_up", "in_transit"]),
      ),
    )
    .orderBy(desc(orders.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Statistiques pour le tableau de bord admin. */
export async function getAdminStats() {
  const all = await db.select().from(orders);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const active = all.filter((o) => ["pending", "assigned", "accepted", "arriving_pickup", "picked_up", "in_transit"].includes(o.status));
  const deliveredToday = all.filter((o) => o.status === "delivered" && o.deliveredAt && new Date(o.deliveredAt) >= startOfDay);
  const cancelledToday = all.filter((o) => o.status === "cancelled" && o.createdAt >= startOfDay);
  const revenueToday = deliveredToday.reduce((s, o) => s + o.totalFcfa, 0);
  const commissionToday = deliveredToday.reduce((s, o) => s + o.commissionFcfa, 0);

  const driversOnline = await db.select().from(drivers).where(eq(drivers.status, "online"));
  const driversBusy = await db.select().from(drivers).where(eq(drivers.status, "busy"));

  return {
    total: all.length,
    active: active.length,
    deliveredToday: deliveredToday.length,
    cancelledToday: cancelledToday.length,
    revenueToday,
    commissionToday,
    driversOnline: driversOnline.length,
    driversBusy: driversBusy.length,
    pending: all.filter((o) => o.status === "pending").length,
  };
}
