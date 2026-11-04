"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

/** Enregistre le service worker de la PWA (cache shell, pas de données privées). */
export function PwaServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.warn("GOZO PWA : enregistrement hors ligne impossible", error);
    });
  }, []);

  return null;
}

/**
 * Bouton d'installation GOZO sur Android / ordinateur et guide d'installation
 * manuelle pour iPhone. L'installation reste facultative.
 */
export function InstallAppCard({ className = "" }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const mobile = ios || /Android|Mobile/i.test(ua) || window.matchMedia("(max-width: 767px)").matches;
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsIos(ios);
    setIsMobile(mobile);
    setInstalled(standalone);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const visible = !installed && !dismissed && (isMobile || !!promptEvent);
  if (!visible) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      if (choice.outcome === "accepted") setInstalled(true);
      return;
    }
    // Safari sur iOS n'expose pas beforeinstallprompt : on guide l'utilisateur.
    setHelpOpen(true);
  }

  return (
    <>
      <div className={`flex items-center gap-3 rounded-2xl border border-gold-300 bg-gold-50 px-3 py-2.5 ${className}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-400 text-lg">📲</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-gozo-900">GOZO sur votre écran d’accueil</p>
          <p className="text-[11px] leading-tight text-gozo-700">Accès rapide, comme une application mobile.</p>
        </div>
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-xl bg-gozo-700 px-3 py-2 text-xs font-bold text-white shadow-sm active:scale-95"
        >
          Installer
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Masquer"
          className="shrink-0 px-1 text-lg leading-none text-gozo-500"
        >
          ×
        </button>
      </div>

      {helpOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-gozo-950/60 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gozo-900">Installer GOZO LIVRAISON</h2>
              <button onClick={() => setHelpOpen(false)} className="rounded-full px-2 py-1 text-xl text-slate-400" aria-label="Fermer">×</button>
            </div>
            {isIos ? (
              <ol className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-3"><span className="font-black text-gozo-700">1.</span><span>Ouvrez cette page dans <strong>Safari</strong>.</span></li>
                <li className="flex gap-3"><span className="font-black text-gozo-700">2.</span><span>Appuyez sur <strong>Partager</strong> <span aria-label="Partager">⬆️</span> en bas de l’écran.</span></li>
                <li className="flex gap-3"><span className="font-black text-gozo-700">3.</span><span>Choisissez <strong>Ajouter à l’écran d’accueil</strong>, puis <strong>Ajouter</strong>.</span></li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-3"><span className="font-black text-gozo-700">1.</span><span>Dans Chrome, appuyez sur le menu <strong>⋮</strong> en haut à droite.</span></li>
                <li className="flex gap-3"><span className="font-black text-gozo-700">2.</span><span>Choisissez <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</span></li>
                <li className="flex gap-3"><span className="font-black text-gozo-700">3.</span><span>Confirmez. L’icône GOZO sera ajoutée à votre téléphone.</span></li>
              </ol>
            )}
            <button
              onClick={() => setHelpOpen(false)}
              className="mt-5 w-full rounded-2xl bg-gozo-700 px-4 py-3 text-sm font-bold text-white"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
