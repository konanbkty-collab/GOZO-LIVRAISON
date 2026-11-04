"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { usePolling, useApi } from "@/hooks/usePolling";
import { useToast } from "@/components/Toast";
import OtpLogin from "@/components/client/OtpLogin";
import SignaturePad from "@/components/SignaturePad";
import { Button, Card, SectionTitle, Spinner, StatusPill } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { InstallAppCard } from "@/components/PwaSupport";
import { DEMO_MODE, GOZO_PHONES, formatFcfa } from "@/lib/constants";
import { prettyPhone } from "@/lib/phone";
import type { MarkerSpec } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

/* Numéros des livreurs de démonstration (flotte GOZO) */
const DEMO_DRIVERS = [
  { name: "Konan Yao", phone: "0757315268" },
  { name: "Traoré Ibrahim", phone: "0564661109" },
  { name: "Kouamé Serge", phone: "0102030405" },
];

type Order = {
  id: number;
  reference: string;
  status: string;
  clientName: string;
  clientPhone: string;
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  totalFcfa: number;
  driverEarningsFcfa: number;
  paymentMethod: string;
  packageType: string;
  packageDescription: string;
  notes: string;
  createdAt: string;
};

type MeData = {
  session: { userId: number; phone: string; name: string; role: string } | null;
  driver: {
    id: number;
    name: string;
    phone: string;
    vehicle: string;
    plate: string;
    status: string;
    lat: number;
    lng: number;
    rating: number;
    totalDeliveries: number;
    totalEarnings: number;
  } | null;
};

const ACTIVE_STATUSES = ["assigned", "accepted", "arriving_pickup", "picked_up", "in_transit"];

export default function DriverAppPage() {
  const toast = useToast();
  const api = useApi();
  const [tab, setTab] = useState<"courses" | "gains" | "moi">("courses");
  const [deliveryModal, setDeliveryModal] = useState(false);

  const { data, loading, refresh } = usePolling<MeData>(
    async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) return { session: null, driver: null };
      return res.json();
    },
    10_000,
  );

  const session = data?.session;
  const driver = data?.driver;

  const { data: ordersData, refresh: refreshOrders } = usePolling<{ orders: Order[] }>(
    async () => {
      if (!session || session.role !== "driver") return { orders: [] };
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) return { orders: [] };
      return res.json();
    },
    5_000,
    !!session && session.role === "driver",
  );

  const orders = ordersData?.orders ?? [];
  const activeOrder = orders.find((o) => ACTIVE_STATUSES.includes(o.status)) ?? null;
  const offer = orders.find((o) => o.status === "assigned") ?? null;
  const notifiedOffer = useRef<number | null>(null);

  useEffect(() => {
    if (!offer || notifiedOffer.current === offer.id) return;
    notifiedOffer.current = offer.id;
    toast(`Nouvelle course ${offer.reference} à proximité`, "info");
    if ("vibrate" in navigator) navigator.vibrate([220, 100, 220]);
    if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
      new Notification("Nouvelle course GOZO", {
        body: `${offer.pickupAddress} → ${offer.dropoffAddress}`,
        icon: "/icons/gozo-192.png",
        tag: `gozo-order-${offer.id}`,
      });
    }
  }, [offer?.id, toast]);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-gozo-600" />
      </div>
    );
  }

  if (!session || session.role !== "driver") {
    return (
      <div className="mx-auto max-w-md pt-8">
        <div className="mb-6 text-center">
          <Logo className="mx-auto mb-3 h-14" />
          <h1 className="text-xl font-extrabold text-gozo-900">Espace Livreur GOZO</h1>
          <p className="mt-1 text-sm text-slate-500">
            Recevez les courses à proximité, naviguez vers vos clients et encaissez vos gains.
          </p>
        </div>
        <div className="mb-4">
          <InstallAppCard />
        </div>
        <OtpLogin
          role="driver"
          title="Connexion livreur"
          subtitle="Entrez le numéro enregistré par votre administrateur"
          redirectTo="/livreur"
          demoPhones={DEMO_MODE ? DEMO_DRIVERS : undefined}
          onLoggedIn={refresh}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pb-6">
      {/* En-tête livreur */}
      <header className="sticky top-0 z-40 bg-gozo-800 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gozo-200">Livreur GOZO</p>
            <p className="font-extrabold text-white">{driver?.name ?? session.phone}</p>
          </div>
          <OnlineToggle driver={driver ?? null} onChanged={refresh} />
        </div>
      </header>
      <div className="px-4 pt-3">
        <InstallAppCard />
      </div>

      {/* Onglets */}
      <nav className="sticky top-[57px] z-30 flex border-b border-slate-200 bg-white">
        {(
          [
            ["courses", "🛵", "Courses"],
            ["gains", "💰", "Gains"],
            ["moi", "👤", "Moi"],
          ] as const
        ).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition ${
              tab === key ? "text-gozo-700" : "text-slate-400"
            }`}
          >
            <span className="text-xl">{icon}</span>
            {label}
            {tab === key && <span className="h-1 w-8 rounded-full bg-gold-400" />}
          </button>
        ))}
      </nav>

      <main className="px-4 pt-4">
        {tab === "courses" && (
          <CoursesPanel
            driver={driver ?? null}
            activeOrder={activeOrder}
            offer={offer}
            onChanged={() => {
              refresh();
              refreshOrders();
            }}
            onDeliverClick={() => setDeliveryModal(true)}
          />
        )}
        {tab === "gains" && <GainsPanel driver={driver ?? null} orders={orders} />}
        {tab === "moi" && <ProfilePanel driver={driver ?? null} session={session} onLogout={refresh} />}
      </main>

      {/* Modale preuve de livraison */}
      {deliveryModal && activeOrder && (
        <DeliveryProofModal
          order={activeOrder}
          onClose={() => setDeliveryModal(false)}
          onDone={() => {
            setDeliveryModal(false);
            refresh();
            refreshOrders();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bascule en ligne / hors ligne                                       */
/* ------------------------------------------------------------------ */
function OnlineToggle({
  driver,
  onChanged,
}: {
  driver: MeData["driver"];
  onChanged: () => void;
}) {
  const api = useApi();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const online = driver?.status !== "inactive";

  async function toggle() {
    setBusy(true);
    try {
      await api("/api/drivers/status", { status: online ? "inactive" : "online" });
      toast(online ? "Vous êtes hors ligne" : "Vous êtes en ligne — bonnes courses !", "success");
      onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
        online ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-300"
      }`}
    >
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${online ? "animate-pulse bg-emerald-400" : "bg-slate-400"}`} />
      {online ? "En ligne" : "Hors ligne"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Onglet Courses : proposition + course active                        */
/* ------------------------------------------------------------------ */
function CoursesPanel({
  driver,
  activeOrder,
  offer,
  onChanged,
  onDeliverClick,
}: {
  driver: MeData["driver"];
  activeOrder: Order | null;
  offer: Order | null;
  onChanged: () => void;
  onDeliverClick: () => void;
}) {
  return (
    <div className="animate-fade-up space-y-4">
      {!driver || driver.status === "inactive" ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-bold text-amber-700">⏸️ Vous êtes hors ligne</p>
          <p className="mt-1 text-sm text-amber-600">
            Passez en ligne pour recevoir les courses à proximité de votre position.
          </p>
        </Card>
      ) : offer ? (
        <OfferCard order={offer} onChanged={onChanged} />
      ) : activeOrder ? (
        <ActiveOrderCard driver={driver} order={activeOrder} onChanged={onChanged} onDeliverClick={onDeliverClick} />
      ) : (
        <Card className="text-center">
          <span className="text-5xl">🛵</span>
          <p className="mt-2 font-bold text-gozo-800">En attente de courses…</p>
          <p className="mt-1 text-sm text-slate-500">
            Les nouvelles commandes à Gagnoa vous seront proposées automatiquement.
          </p>
          <NotificationPermissionButton />
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Autorisation des alertes navigateur                                  */
/* ------------------------------------------------------------------ */
function NotificationPermissionButton() {
  const [permission, setPermission] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  async function enable() {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setBusy(true);
    try {
      setPermission(await Notification.requestPermission());
    } finally {
      setBusy(false);
    }
  }

  if (permission === "granted" || permission === "unsupported") return null;

  return (
    <button
      type="button"
      onClick={enable}
      disabled={busy || permission === "denied"}
      className="mt-3 rounded-xl bg-gozo-50 px-3 py-2 text-xs font-bold text-gozo-700 disabled:opacity-50"
    >
      {busy ? "Activation…" : permission === "denied" ? "🔕 Alertes bloquées — réglages du navigateur" : "🔔 Activer les alertes de nouvelles courses"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Proposition de course (accepter / refuser)                          */
/* ------------------------------------------------------------------ */
function OfferCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const api = useApi();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function respond(accept: boolean) {
    setBusy(true);
    try {
      await api(`/api/orders/${order.id}/accept`, { accept });
      if (accept) {
        toast("Course acceptée ! Roulez vers le point de retrait.", "success");
      } else {
        toast("Course refusée", "info");
      }
      onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="animate-slide-in border-2 border-gold-400">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-black text-gozo-900">NOUVELLE COURSE</span>
        <span className="font-mono text-xs font-bold text-slate-400">{order.reference}</span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm">📦</span>
          <div>
            <p className="text-xs text-slate-400">Retrait</p>
            <p className="font-bold text-gozo-800">{order.pickupAddress}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm">🎯</span>
          <div>
            <p className="text-xs text-slate-400">Livraison</p>
            <p className="font-bold text-gozo-800">{order.dropoffAddress}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm">👤</span>
          <div>
            <p className="text-xs text-slate-400">Contact</p>
            <p className="font-bold text-gozo-800">
              {order.clientName} ·{" "}
              <a href={`tel:${order.clientPhone}`} className="text-emerald-600 underline">
                {prettyPhone(order.clientPhone)}
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-gozo-50 p-3 text-center">
        <div>
          <p className="text-xs text-slate-400">Distance</p>
          <p className="font-extrabold text-gozo-800">{order.distanceKm} km</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Tarif</p>
          <p className="font-extrabold text-gozo-800">{formatFcfa(order.totalFcfa)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Votre gain</p>
          <p className="font-extrabold text-emerald-600">{formatFcfa(order.driverEarningsFcfa)}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={() => respond(false)} disabled={busy}>
          Refuser
        </Button>
        <Button variant="success" className="flex-[2]" size="lg" onClick={() => respond(true)} disabled={busy}>
          {busy ? <Spinner /> : "J'accepte 🛵"}
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Course active : navigation GPS + statuts                            */
/* ------------------------------------------------------------------ */
function ActiveOrderCard({
  driver,
  order,
  onChanged,
  onDeliverClick,
}: {
  driver: NonNullable<MeData["driver"]>;
  order: Order;
  onChanged: () => void;
  onDeliverClick: () => void;
}) {
  const api = useApi();
  const toast = useToast();

  // Position issue du GPS réel du téléphone, publiée au serveur pendant la course.
  const [pos, setPos] = useState({ lat: driver.lat, lng: driver.lng });
  const [gpsStatus, setGpsStatus] = useState<"requesting" | "active" | "denied" | "unavailable" | "unsupported">("requesting");
  const lastLocationAt = useRef(0);

  const target =
    ["assigned", "accepted", "arriving_pickup"].includes(order.status)
      ? { lat: order.pickupLat, lng: order.pickupLng }
      : { lat: order.dropoffLat, lng: order.dropoffLng };

  const postLocation = useCallback(
    async (lat: number, lng: number, heading = 0) => {
      try {
        await fetch("/api/drivers/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, heading }),
        });
      } catch {
        /* La prochaine position GPS réessaiera si le réseau revient. */
      }
    },
    [],
  );

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("unsupported");
      return;
    }

    setGpsStatus("requesting");
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const heading = position.coords.heading ?? 0;
        setPos({ lat, lng });
        setGpsStatus("active");

        const now = Date.now();
        if (now - lastLocationAt.current >= 2500) {
          lastLocationAt.current = now;
          void postLocation(lat, lng, heading);
        }
      },
      (error) => {
        setGpsStatus(error.code === 1 ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [postLocation, order.id]);

  const markers: MarkerSpec[] = [
    { id: "driver", lat: pos.lat, lng: pos.lng, emoji: "🛵", tone: "driver", label: "Ma position" },
    { id: "pickup", lat: order.pickupLat, lng: order.pickupLng, emoji: "📦", tone: "pickup", label: "Retrait", popup: order.pickupAddress },
    { id: "dropoff", lat: order.dropoffLat, lng: order.dropoffLng, emoji: "🎯", tone: "destination", label: "Livraison", popup: order.dropoffAddress },
  ];

  const route: [number, number][] = [
    [pos.lat, pos.lng],
    [target.lat, target.lng],
  ];

  async function setStatus(status: string) {
    try {
      await api(`/api/orders/${order.id}/status`, { status });
      toast("Statut mis à jour", "success");
      onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    }
  }

  const navTarget = order.status === "picked_up" || order.status === "in_transit" ? order : null;
  const gmapsHref = `https://www.google.com/maps/dir/?api=1&destination=${navTarget ? navTarget.dropoffLat : order.pickupLat},${navTarget ? navTarget.dropoffLng : order.pickupLng}`;
  const wazeHref = `https://waze.com/ul?ll=${navTarget ? navTarget.dropoffLat : order.pickupLat},${navTarget ? navTarget.dropoffLng : order.pickupLng}&navigate=yes`;

  return (
    <div className="animate-fade-up space-y-4">
      {/* Carte navigation */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        <MapView className="h-64" markers={markers} route={route} zoom={15} fit={false} center={[pos.lat, pos.lng]} />
        <div className="flex items-center justify-between bg-gozo-800 px-4 py-2 text-xs text-white">
          <span className="font-mono font-bold">{order.reference}</span>
          <span>
            🛰️ {gpsStatus === "active" ? "GPS du téléphone actif" : gpsStatus === "requesting" ? "Recherche GPS…" : "GPS à autoriser"} · {formatFcfa(order.totalFcfa)}
          </span>
        </div>
      </div>
      {gpsStatus !== "active" && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          {gpsStatus === "denied"
            ? "La localisation est refusée. Autorisez-la dans les réglages du navigateur pour partager votre position avec le client."
            : gpsStatus === "unsupported"
              ? "Ce navigateur ne prend pas en charge la géolocalisation. Ouvrez GOZO dans Chrome ou Safari sur un site sécurisé (HTTPS)."
              : gpsStatus === "unavailable"
                ? "Position GPS indisponible. Vérifiez que la localisation du téléphone est activée et que GOZO est autorisé à y accéder."
                : "Autorisez la localisation du téléphone lorsque le navigateur le demande. Gardez GOZO ouvert pendant la course."}
        </p>
      )}

      {/* Boutons navigation */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href={gmapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gozo-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          🗺️ Google Maps
        </a>
        <a
          href={wazeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gozo-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          🧭 Waze
        </a>
      </div>

      {/* Étapes */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle>Étapes de la course</SectionTitle>
          <StatusPill status={order.status} />
        </div>

        <div className="space-y-3">
          <StepRow icon="📦" title="Retrait" address={order.pickupAddress} active={["assigned", "accepted", "arriving_pickup"].includes(order.status)} done={["picked_up", "in_transit", "delivered"].includes(order.status)} />
          <StepRow icon="🎯" title="Livraison" address={order.dropoffAddress} active={["picked_up", "in_transit"].includes(order.status)} done={order.status === "delivered"} />
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Client</span>
            <span className="font-semibold text-gozo-800">
              {order.clientName}{" "}
              <a href={`tel:${order.clientPhone}`} className="text-emerald-600 underline">
                {prettyPhone(order.clientPhone)}
              </a>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Destinataire</span>
            <span className="font-semibold text-gozo-800">
              {order.recipientName}{" "}
              <a href={`tel:${order.recipientPhone}`} className="text-emerald-600 underline">
                {prettyPhone(order.recipientPhone)}
              </a>
            </span>
          </div>
          {order.packageDescription && (
            <div className="flex justify-between">
              <span className="text-slate-400">Colis</span>
              <span className="font-semibold text-gozo-800">{order.packageDescription}</span>
            </div>
          )}
          {order.notes && (
            <div className="rounded-xl bg-amber-50 p-2 text-xs text-amber-700">📝 {order.notes}</div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-2">
            <span className="text-slate-400">Tarif à encaisser</span>
            <span className="text-lg font-black text-emerald-600">{formatFcfa(order.totalFcfa)}</span>
          </div>
        </div>
      </Card>

      {/* Actions de statut */}
      <Card className="space-y-3">
        {order.status === "assigned" && (
          <Button variant="success" className="w-full" size="lg" onClick={() => setStatus("accepted")}>
            ✅ J'accepte la course
          </Button>
        )}
        {order.status === "accepted" && (
          <Button className="w-full" size="lg" onClick={() => setStatus("arriving_pickup")}>
            📍 Je suis arrivé au point de retrait
          </Button>
        )}
        {order.status === "arriving_pickup" && (
          <Button className="w-full" size="lg" onClick={() => setStatus("picked_up")}>
            📦 Colis récupéré
          </Button>
        )}
        {order.status === "picked_up" && (
          <Button className="w-full" size="lg" onClick={() => setStatus("in_transit")}>
            🚚 En route vers la destination
          </Button>
        )}
        {order.status === "in_transit" && (
          <Button variant="gold" className="w-full" size="lg" onClick={onDeliverClick}>
            🎉 Confirmer la livraison
          </Button>
        )}
      </Card>
    </div>
  );
}

function StepRow({
  icon,
  title,
  address,
  active,
  done,
}: {
  icon: string;
  title: string;
  address: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className={`flex gap-3 rounded-2xl p-3 ${active ? "bg-gozo-50 ring-2 ring-gozo-200" : "bg-slate-50"}`}>
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-xs font-bold uppercase text-slate-400">{title}</p>
        <p className="font-semibold text-gozo-800">{address}</p>
      </div>
      {done && <span className="self-center text-emerald-500">✓</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modale preuve de livraison (signature + photo)                      */
/* ------------------------------------------------------------------ */
function DeliveryProofModal({
  order,
  onClose,
  onDone,
}: {
  order: Order;
  onClose: () => void;
  onDone: () => void;
}) {
  const api = useApi();
  const toast = useToast();
  const [signature, setSignature] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelivered() {
    if (!signature && !photo) {
      toast("Faites signer le client ou prenez une photo de confirmation", "error");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/orders/${order.id}/status`, {
        status: "delivered",
        signatureData: signature ?? undefined,
        photoData: photo ?? undefined,
      });
      toast("Livraison confirmée ! Paiement encaissé 💰", "success");
      onDone();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setBusy(false);
    }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-gozo-950/60 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 safe-bottom">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gozo-900">Confirmation de livraison</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">✕</button>
        </div>

        <p className="mb-3 text-sm text-slate-500">
          Faites signer le client sur l'écran ou prenez une photo du colis remis ({order.reference}).
        </p>

        <SignaturePad value={signature ?? undefined} onChange={setSignature} className="mb-4" />

        <div>
          <p className="mb-1.5 text-sm font-semibold text-gozo-800">Photo de confirmation (optionnel)</p>
          {photo ? (
            <div className="relative">
              <img src={photo} alt="Colis" className="w-full rounded-2xl border border-slate-200" />
              <button
                onClick={() => setPhoto(null)}
                className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-rose-500 shadow"
              >
                Retirer
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-6 text-sm font-semibold text-slate-500">
              📷 Prendre / choisir une photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            </label>
          )}
        </div>

        <Button variant="gold" className="mt-5 w-full" size="lg" onClick={confirmDelivered} disabled={busy}>
          {busy ? <Spinner /> : `Valider la livraison · ${formatFcfa(order.totalFcfa)} encaissés`}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Onglet Gains                                                        */
/* ------------------------------------------------------------------ */
function GainsPanel({ driver, orders }: { driver: MeData["driver"]; orders: Order[] }) {
  const delivered = orders.filter((o) => o.status === "delivered");
  const today = new Date().toDateString();
  const todayOrders = delivered.filter((o) => new Date(o.createdAt).toDateString() === today);
  const todayEarnings = todayOrders.reduce((s, o) => s + o.driverEarningsFcfa, 0);

  return (
    <div className="animate-fade-up space-y-4">
      <Card className="bg-gradient-to-br from-gozo-700 to-gozo-900 text-white">
        <p className="text-sm text-gozo-100">Gains totaux</p>
        <p className="text-4xl font-black">{formatFcfa(driver?.totalEarnings ?? 0)}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/10 p-2">
            <p className="text-lg font-bold">{driver?.totalDeliveries ?? 0}</p>
            <p className="text-[10px] text-gozo-100">Livraisons</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2">
            <p className="text-lg font-bold">{formatFcfa(todayEarnings)}</p>
            <p className="text-[10px] text-gozo-100">Aujourd'hui</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2">
            <p className="text-lg font-bold">⭐ {driver?.rating.toFixed(1) ?? "5.0"}</p>
            <p className="text-[10px] text-gozo-100">Note</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Dernières livraisons</SectionTitle>
        {delivered.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">Aucune livraison terminée pour le moment.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {delivered.slice(0, 12).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-semibold text-gozo-800">{o.dropoffAddress}</p>
                  <p className="text-xs text-slate-400">{o.reference}</p>
                </div>
                <span className="font-bold text-emerald-600">+{formatFcfa(o.driverEarningsFcfa)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Onglet Profil                                                       */
/* ------------------------------------------------------------------ */
function ProfilePanel({
  driver,
  session,
  onLogout,
}: {
  driver: MeData["driver"];
  session: { name: string; phone: string };
  onLogout: () => void;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/livreur");
    router.refresh();
  }

  return (
    <div className="animate-fade-up space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gozo-100 text-3xl">🛵</div>
          <div>
            <p className="text-lg font-extrabold text-gozo-900">{driver?.name ?? session.name}</p>
            <p className="text-sm text-slate-500">{prettyPhone(session.phone)}</p>
            {driver && (
              <p className="mt-0.5 text-xs text-slate-400">
                {driver.vehicle} · {driver.plate}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Contact GOZO</SectionTitle>
        <div className="space-y-2">
          {GOZO_PHONES.map((p) => (
            <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 font-semibold text-emerald-700">
              📞 {p}
            </a>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm text-slate-500">
          Position GPS transmise automatiquement toutes les 2,5 secondes pendant vos courses, pour que le client
          puisse vous suivre en direct sur la carte.
        </p>
      </Card>

      <button
        onClick={logout}
        className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-600"
      >
        Se déconnecter
      </button>
    </div>
  );
}

/* Petit wrapper pour éviter l'import direct en haut (cohérence SSR) */
function useRouterSafe() {
  const { useRouter } = require("next/navigation") as typeof import("next/navigation");
  return useRouter();
}
