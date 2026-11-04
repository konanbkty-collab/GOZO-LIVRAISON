"use client";

import Image from "next/image";
import Link from "next/link";
import { Logo, LogoCompact, LogoIcon } from "@/components/Logo";
import { InstallAppCard } from "@/components/PwaSupport";
import { Button } from "@/components/ui";
import { GOZO_PHONES, PACKAGE_TYPES } from "@/lib/constants";

const CATEGORIES = [
  { icon: "📦", label: "Colis", detail: "Envoi et réception" },
  { icon: "🛍️", label: "Boutiques", detail: "Vos achats livrés" },
  { icon: "🍔", label: "Restaurants", detail: "Repas à domicile" },
  { icon: "💊", label: "Pharmacies", detail: "Courses santé" },
  { icon: "🛒", label: "Petites courses", detail: "On s’en occupe" },
];

const STEPS = [
  { number: "01", icon: "📱", title: "Vous commandez", text: "Choisissez votre départ et votre destination, puis découvrez le tarif avant de confirmer." },
  { number: "02", icon: "🛵", title: "GOZO récupère", text: "Un livreur à moto disponible prend en charge votre colis ou votre commande." },
  { number: "03", icon: "📍", title: "GOZO livre", text: "Suivez le trajet du livreur en direct jusqu’à la remise au destinataire." },
];

const FAQ = [
  { q: "Comment fonctionne une livraison ?", a: "Saisissez le point de départ et l’adresse d’arrivée. Le prix estimé apparaît avant votre confirmation, puis vous pouvez suivre le livreur sur la carte." },
  { q: "Combien coûte une course ?", a: "500 FCFA pour les 4 premiers kilomètres, puis 200 FCFA par kilomètre supplémentaire. Le tarif est affiché avant validation." },
  { q: "Quels paiements sont acceptés ?", a: "L’application propose les espèces à la livraison, Orange Money, MTN MoMo, Moov Money, Wave et la carte bancaire. Les paiements électroniques doivent être activés avec leurs opérateurs avant l’exploitation réelle." },
  { q: "Où livrez-vous ?", a: "GOZO dessert les quartiers de Gagnoa et leurs environs. La disponibilité dépend des livreurs connectés." },
];

function toWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("225") ? digits : `225${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent("Bonjour GOZO LIVRAISON, je souhaite commander une livraison à Gagnoa.")}`;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gozo-950">
      {/* Barre de navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/" aria-label="GOZO LIVRAISON, accueil" className="shrink-0">
            <LogoCompact className="h-10 w-[155px] sm:h-11 sm:w-[172px]" />
          </Link>
          <div className="hidden items-center gap-7 text-sm font-bold text-gozo-800 md:flex">
            <a href="#services" className="transition hover:text-gozo-500">Nos services</a>
            <a href="#fonctionnement" className="transition hover:text-gozo-500">Comment ça marche</a>
            <a href="#contact" className="transition hover:text-gozo-500">Contact</a>
          </div>
          <Link href="/app" className="shrink-0">
            <Button variant="gold" size="sm" className="!rounded-xl !px-4 sm:!px-5">Commander <span aria-hidden="true">→</span></Button>
          </Link>
        </nav>
      </header>

      <main>
        {/* Affiche GOZO inspirée de Gagnoa — visuel plein écran, marque et offre */}
        <section className="overflow-hidden bg-gozo-950 text-white">
          <div className="relative mx-auto min-h-[470px] max-w-[1600px] sm:min-h-[560px] lg:min-h-[650px]">
            <Image
              src="/images/gozo-gagnoa-ville-courier.jpg"
              alt="Visuel d’ambiance GOZO : coursier à moto devant un bâtiment aux couleurs bleu et jaune de Gagnoa"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[42%_center] sm:object-center"
            />
            {/* Contraste discret pour conserver la photo tout en rendant la bannière lisible */}
            <div className="absolute inset-0 bg-gradient-to-t from-gozo-950/85 via-gozo-950/10 to-gozo-950/15" />
            <div className="absolute inset-0 bg-gradient-to-r from-gozo-950/30 via-transparent to-gozo-950/10" />

            <div className="absolute left-4 top-4 z-10 rounded-full border border-white/40 bg-gozo-950/75 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur sm:left-7 sm:top-7 sm:px-5 sm:text-xs">
              📍 Gagnoa · Côte d’Ivoire
            </div>

            {/* Le badge reprend la composition emblématique de l’affiche : logo en médaillon */}
            <div className="absolute right-3 top-16 z-10 flex h-32 w-32 items-center justify-center rounded-full border-[5px] border-gold-400 bg-white p-2 shadow-2xl sm:right-8 sm:top-12 sm:h-52 sm:w-52 sm:border-[7px] sm:p-3 lg:right-12 lg:top-1/2 lg:h-[290px] lg:w-[290px] lg:-translate-y-1/2">
              <div className="flex w-full flex-col items-center justify-center">
                <Logo className="h-auto w-full" />
                <p className="-mt-1 text-center text-[6px] font-black uppercase tracking-wide text-gozo-800 sm:text-[10px] lg:text-xs">Gagnoa, vos colis arrivent.</p>
              </div>
            </div>

            {/* Bandeau de tarif et commande façon affiche */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-6 lg:p-8">
              <div className="flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-xl rounded-2xl rounded-br-[2.5rem] border-l-[6px] border-gold-400 bg-gozo-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm sm:px-6 sm:py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-300 sm:text-xs">Livraison à Gagnoa à partir de</p>
                  <p className="mt-0.5 text-2xl font-black leading-tight text-white sm:text-4xl">500 FCFA</p>
                  <p className="text-xs font-extrabold text-gold-300 sm:text-sm">+ 200 FCFA / km supplémentaire</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href="/app">
                    <Button variant="gold" size="lg" className="!rounded-xl !px-4 !py-3 text-xs sm:!px-6 sm:text-sm">
                      🛵 Commander
                    </Button>
                  </Link>
                  <a href={toWhatsApp(GOZO_PHONES[0])} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="lg" className="!rounded-xl !border-white/50 !bg-gozo-950/70 !px-4 !py-3 text-xs !text-white hover:!bg-gozo-900 sm:!px-6 sm:text-sm">
                      WhatsApp ↗
                    </Button>
                  </a>
                </div>
              </div>
              <p className="mt-2 max-w-4xl text-[8px] font-medium text-white/80 sm:text-[10px]">
                Visuel d’ambiance réalisé pour GOZO à partir de l’affiche de référence.
              </p>
            </div>
          </div>

          {/* Les actions directes restent faciles à toucher sur téléphone */}
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-center text-sm font-semibold text-gozo-100 sm:text-left">Vous commandez. GOZO récupère. GOZO LIVRAISON livre.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {GOZO_PHONES.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-white/20">
                  📞 {phone}
                </a>
              ))}
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
            <InstallAppCard className="mx-auto max-w-xl" />
          </div>
        </section>

        {/* Bandeau tarif jaune signature de l’affiche */}
        <div className="bg-gold-400 px-4 py-3 text-center shadow-inner">
          <p className="text-sm font-black uppercase tracking-wide text-gozo-950 sm:text-lg">
            Livraison à Gagnoa à partir de 500 FCFA <span className="px-1 text-gozo-700">·</span> + 200 FCFA / km
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gozo-800 sm:text-xs">Prix calculé selon la distance et affiché avant confirmation</p>
        </div>

        {/* Les cinq types de livraisons de l’affiche */}
        <section id="services" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gozo-500">Toujours à votre service</p>
            <h2 className="mt-2 text-2xl font-black text-gozo-900 sm:text-3xl">Qu’est-ce qu’on vous livre ?</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((item) => (
              <div key={item.label} className="group rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-gold-300 hover:shadow-lg sm:p-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-400 bg-gold-50 text-3xl transition group-hover:bg-gold-400">{item.icon}</div>
                <h3 className="mt-3 text-sm font-black uppercase text-gozo-900">{item.label}</h3>
                <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Fonctionnement */}
        <section id="fonctionnement" className="bg-gozo-50 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-gozo-500">Simple · rapide · local</p>
                <h2 className="mt-2 text-2xl font-black text-gozo-900 sm:text-3xl">Vous commandez, on s’occupe du reste.</h2>
              </div>
              <Link href="/app" className="text-sm font-extrabold text-gozo-700 hover:underline">Faire une commande →</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <article key={step.number} className="relative overflow-hidden rounded-3xl border border-white bg-white p-5 shadow-sm sm:p-6">
                  <span className="absolute right-4 top-1 text-6xl font-black text-gozo-50">{step.number}</span>
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-3xl">{step.icon}</span>
                  <h3 className="relative mt-4 text-lg font-black text-gozo-900">{step.title}</h3>
                  <p className="relative mt-1 text-sm leading-relaxed text-slate-500">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Trois espaces de l’application */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-gozo-500">Tout GOZO dans votre téléphone</p>
              <h2 className="mt-2 text-2xl font-black text-gozo-900 sm:text-3xl">Une application, trois espaces.</h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
                Le client commande et suit son colis. Le livreur gère sa course et sa navigation.
                L’équipe GOZO pilote les livraisons depuis le tableau d’administration.
              </p>
              <div className="mt-5 rounded-3xl bg-gozo-900 p-5 text-white sm:p-6">
                <div className="flex items-center gap-4">
                  <LogoIcon className="h-16 w-20 shrink-0" />
                  <div>
                    <p className="text-lg font-black">Vos colis arrivent.</p>
                    <p className="mt-1 text-sm text-gozo-100">Avec GOZO LIVRAISON, Gagnoa est à portée de main.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {PACKAGE_TYPES.map((pkg) => (
                    <span key={pkg.id} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">{pkg.icon} {pkg.label}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <InterfaceCard href="/app" icon="📱" title="Client" text="Commander, choisir le paiement et suivre le livreur." action="Commander" />
              <InterfaceCard href="/livreur" icon="🛵" title="Livreur" text="Recevoir une course, naviguer et confirmer la remise." action="Espace livreur" />
              <InterfaceCard href="/admin" icon="📊" title="Administration" text="Gérer les courses, l’équipe, les tarifs et les paiements." action="Tableau de bord" />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-xs font-black uppercase tracking-[0.24em] text-gozo-500">Besoin d’information ?</p>
            <h2 className="mb-7 mt-2 text-center text-2xl font-black text-gozo-900">Questions fréquentes</h2>
            <div className="space-y-3">
              {FAQ.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-gozo-900">
                    <span><span className="mr-2 text-gold-500">●</span>{item.q}</span>
                    <span className="text-xl text-gozo-500 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 pl-5 text-sm leading-relaxed text-slate-500">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact WhatsApp */}
        <section id="contact" className="bg-gozo-900 px-4 py-12 text-center text-white sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gold-300">Gagnoa · nous sommes là</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Appelez GOZO LIVRAISON !</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gozo-100 sm:text-base">
              Enregistrez nos numéros et commandez un colis, un repas ou vos petites courses directement par téléphone ou WhatsApp.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {GOZO_PHONES.map((phone) => (
                <div key={phone} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 sm:min-w-64">
                  <p className="text-lg font-black">{phone}</p>
                  <div className="flex gap-2">
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/20">☎ Appeler</a>
                    <a href={toWhatsApp(phone)} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-400">WhatsApp ↗</a>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/app" className="mt-6 inline-block">
              <Button variant="gold" size="lg">Commander en ligne →</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gozo-950 px-4 py-7 text-center text-xs text-gozo-200">
        <LogoCompact className="mx-auto mb-3 h-10 w-[160px]" />
        <p>GOZO LIVRAISON · Gagnoa, région du Gôh · Côte d’Ivoire</p>
        <p className="mt-1">500 FCFA les 4 premiers kilomètres · + 200 FCFA par kilomètre supplémentaire</p>
        <div className="mt-4 flex justify-center gap-5 font-bold">
          <Link href="/app" className="hover:text-white">Client</Link>
          <Link href="/livreur" className="hover:text-white">Livreur</Link>
          <Link href="/admin" className="hover:text-white">Administration</Link>
        </div>
      </footer>
    </div>
  );
}

function InterfaceCard({ href, icon, title, text, action }: { href: string; icon: string; title: string; text: string; action: string }) {
  return (
    <Link href={href} className="group block">
      <article className="flex h-full flex-col rounded-3xl border-2 border-slate-100 bg-white p-5 shadow-sm transition group-hover:-translate-y-1 group-hover:border-gold-300 group-hover:shadow-lg sm:p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gozo-50 text-2xl">{icon}</span>
        <h3 className="mt-3 font-black text-gozo-900">{title}</h3>
        <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{text}</p>
        <p className="mt-4 text-sm font-extrabold text-gozo-600">{action} <span className="transition group-hover:translate-x-1">→</span></p>
      </article>
    </Link>
  );
}
