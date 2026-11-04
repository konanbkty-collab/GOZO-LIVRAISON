/* Constantes métier GOZO LIVRAISON */

/**
 * Mode démonstration (NEXT_PUBLIC_GOZO_DEMO=true) : codes OTP affichés à
 * l'écran, livreurs fictifs et raccourcis de connexion. Jamais en production.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_GOZO_DEMO === "true";

export const PAYMENT_METHODS = [
  { id: "cash", label: "Espèces à la livraison", short: "Espèces", icon: "💵", color: "bg-emerald-100 text-emerald-700" },
  { id: "orange", label: "Orange Money", short: "Orange Money", icon: "🟠", color: "bg-orange-100 text-orange-700" },
  { id: "mtn", label: "MTN Mobile Money", short: "MTN MoMo", icon: "🟡", color: "bg-yellow-100 text-yellow-700" },
  { id: "moov", label: "Moov Money", short: "Moov Money", icon: "🔵", color: "bg-sky-100 text-sky-700" },
  { id: "wave", label: "Wave", short: "Wave", icon: "🌊", color: "bg-cyan-100 text-cyan-700" },
  { id: "card", label: "Carte bancaire", short: "Carte", icon: "💳", color: "bg-indigo-100 text-indigo-700" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const PACKAGE_TYPES = [
  { id: "colis", label: "Colis", icon: "📦" },
  { id: "commande", label: "Commande boutique", icon: "🛍️" },
  { id: "restaurant", label: "Restaurant", icon: "🍔" },
  { id: "pharmacie", label: "Pharmacie", icon: "💊" },
  { id: "courses", label: "Courses", icon: "🛒" },
] as const;

export type PackageTypeId = (typeof PACKAGE_TYPES)[number]["id"];

export const ORDER_STATUSES = {
  pending: { label: "En attente d'un livreur", short: "En attente", icon: "⏳", color: "bg-amber-100 text-amber-700", step: 0 },
  assigned: { label: "Livreur en chemin vers vous", short: "Livreur en route", icon: "🛵", color: "bg-sky-100 text-sky-700", step: 1 },
  accepted: { label: "Course acceptée", short: "Acceptée", icon: "✅", color: "bg-sky-100 text-sky-700", step: 1 },
  arriving_pickup: { label: "Livreur arrivé au point de retrait", short: "Arrivé au retrait", icon: "📍", color: "bg-sky-100 text-sky-700", step: 1 },
  picked_up: { label: "Colis récupéré", short: "Colis récupéré", icon: "📦", color: "bg-violet-100 text-violet-700", step: 2 },
  in_transit: { label: "En cours de livraison", short: "En livraison", icon: "🚚", color: "bg-indigo-100 text-indigo-700", step: 3 },
  delivered: { label: "Livré", short: "Livré", icon: "🎉", color: "bg-emerald-100 text-emerald-700", step: 4 },
  cancelled: { label: "Annulée", short: "Annulée", icon: "❌", color: "bg-rose-100 text-rose-700", step: -1 },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

export const DRIVER_STATUSES = {
  inactive: { label: "Inactif", icon: "⚪", color: "bg-slate-200 text-slate-600" },
  online: { label: "En ligne", icon: "🟢", color: "bg-emerald-100 text-emerald-700" },
  busy: { label: "En course", icon: "🛵", color: "bg-sky-100 text-sky-700" },
} as const;

export type DriverStatus = keyof typeof DRIVER_STATUSES;

/** Progression client (4 étapes) */
export const TRACKING_STEPS = ["assigned", "picked_up", "in_transit", "delivered"] as const;

export const GOZO_PHONES = ["05 64 66 11 09", "07 57 31 52 68"];

/** Formatte un montant en FCFA : 1250 -> "1 250 FCFA" */
export function formatFcfa(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR").replace(/\u202f/g, " ")} FCFA`;
}

/** Formatte une date courte */
export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/** Formatte une heure */
export function formatTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Formatte date + heure */
export function formatDateTime(iso: string | Date | null | undefined): string {
  return `${formatDate(iso)} à ${formatTime(iso)}`;
}

/** Numéro de téléphone au format international +225... */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("225") && digits.length >= 13) {
    return `+225 ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)} ${digits.slice(11, 13)}`.trim();
  }
  return phone;
}
