import {
  pgTable,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Utilisateurs (clients, livreurs, admins) — authentification par OTP */
/* ------------------------------------------------------------------ */
export const users = pgTable(
  "users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    phone: text("phone").notNull(),
    name: text("name").notNull().default(""),
    role: text("role").notNull().default("client"), // client | driver | admin
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_phone_role_key").on(t.phone, t.role)],
);

/* ------------------------------------------------------------------ */
/* Sessions (cookie httpOnly)                                          */
/* ------------------------------------------------------------------ */
export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  driverId: integer("driver_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Codes OTP (validation par téléphone)                                */
/* ------------------------------------------------------------------ */
export const otpCodes = pgTable("otp_codes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  role: text("role").notNull().default("client"),
  consumed: boolean("consumed").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Livreurs à moto                                                     */
/* ------------------------------------------------------------------ */
export const drivers = pgTable("drivers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  vehicle: text("vehicle").notNull().default("Moto"),
  plate: text("plate").notNull().default(""),
  status: text("status").notNull().default("inactive"), // inactive | online | busy
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  heading: doublePrecision("heading").notNull().default(0),
  rating: doublePrecision("rating").notNull().default(5),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  totalEarnings: integer("total_earnings").notNull().default(0), // FCFA
  lastLocationAt: timestamp("last_location_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Quartiers & lieux de Gagnoa (géolocalisation GPS)                   */
/* ------------------------------------------------------------------ */
export const quartiers = pgTable("quartiers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  type: text("type").notNull().default("quartier"), // quartier | village | lieu
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  description: text("description").notNull().default(""),
});

/* ------------------------------------------------------------------ */
/* Configuration tarifaire (grille éditable par l'admin)               */
/* ------------------------------------------------------------------ */
export const pricingConfig = pgTable("pricing_config", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  baseFare: integer("base_fare").notNull().default(500), // FCFA
  baseKm: doublePrecision("base_km").notNull().default(4),
  perKm: integer("per_km").notNull().default(200), // FCFA / km au-delà de baseKm
  nightSurcharge: integer("night_surcharge").notNull().default(0), // FCFA
  nightStartHour: integer("night_start_hour").notNull().default(22),
  nightEndHour: integer("night_end_hour").notNull().default(6),
  rainSurcharge: integer("rain_surcharge").notNull().default(0), // FCFA
  commissionPercent: doublePrecision("commission_percent").notNull().default(15),
  minimumFare: integer("minimum_fare").notNull().default(500),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Commandes de livraison                                              */
/* ------------------------------------------------------------------ */
export const orders = pgTable(
  "orders",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    reference: text("reference").notNull(),

    // Client
    clientId: integer("client_id").references(() => users.id, { onDelete: "set null" }),
    clientName: text("client_name").notNull().default(""),
    clientPhone: text("client_phone").notNull(),

    // Destinataire (si différent du client)
    recipientName: text("recipient_name").notNull().default(""),
    recipientPhone: text("recipient_phone").notNull().default(""),

    // Point de départ
    pickupAddress: text("pickup_address").notNull().default(""),
    pickupLat: doublePrecision("pickup_lat").notNull(),
    pickupLng: doublePrecision("pickup_lng").notNull(),
    pickupQuartier: text("pickup_quartier").notNull().default(""),

    // Destination
    dropoffAddress: text("dropoff_address").notNull().default(""),
    dropoffLat: doublePrecision("dropoff_lat").notNull(),
    dropoffLng: doublePrecision("dropoff_lng").notNull(),
    dropoffQuartier: text("dropoff_quartier").notNull().default(""),

    // Trajet
    distanceKm: doublePrecision("distance_km").notNull().default(0),
    durationMin: integer("duration_min").notNull().default(0),

    // Tarification
    fareFcfa: integer("fare_fcfa").notNull().default(0),
    surchargeFcfa: integer("surcharge_fcfa").notNull().default(0),
    totalFcfa: integer("total_fcfa").notNull().default(0),
    commissionFcfa: integer("commission_fcfa").notNull().default(0),
    driverEarningsFcfa: integer("driver_earnings_fcfa").notNull().default(0),

    // Paiement
    paymentMethod: text("payment_method").notNull().default("cash"), // cash | orange | mtn | moov | wave | card
    paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid

    // Statut
    status: text("status").notNull().default("pending"),
    // pending | assigned | accepted | arriving_pickup | picked_up | in_transit | delivered | cancelled

    driverId: integer("driver_id").references(() => drivers.id, { onDelete: "set null" }),

    // Colis
    packageType: text("package_type").notNull().default("colis"), // colis | commande | restaurant | pharmacie | courses
    packageDescription: text("package_description").notNull().default(""),
    notes: text("notes").notNull().default(""),

    // Preuves de livraison
    signatureData: text("signature_data").notNull().default(""), // dataURL PNG
    photoData: text("photo_data").notNull().default(""), // dataURL JPEG
    rating: integer("rating"),

    // Horodatages
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("orders_reference_key").on(t.reference),
    index("orders_status_idx").on(t.status),
    index("orders_driver_idx").on(t.driverId),
    index("orders_client_idx").on(t.clientId),
  ],
);

/* ------------------------------------------------------------------ */
/* Historique des statuts (timeline client)                            */
/* ------------------------------------------------------------------ */
export const orderEvents = pgTable("order_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  message: text("message").notNull().default(""),
  actorRole: text("actor_role").notNull().default("system"),
  actorName: text("actor_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Paiements & commissions                                             */
/* ------------------------------------------------------------------ */
export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  reference: text("reference").notNull(),
  amountFcfa: integer("amount_fcfa").notNull(), // total encaissé
  commissionFcfa: integer("commission_fcfa").notNull().default(0),
  driverEarningsFcfa: integer("driver_earnings_fcfa").notNull().default(0),
  method: text("method").notNull().default("cash"),
  status: text("status").notNull().default("pending"), // pending | paid
  driverName: text("driver_name").notNull().default(""),
  clientPhone: text("client_phone").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Quartier = typeof quartiers.$inferSelect;
export type PricingConfig = typeof pricingConfig.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Payment = typeof payments.$inferSelect;
