"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/usePolling";
import { useToast } from "@/components/Toast";
import { Button, Card, Input, Spinner } from "@/components/ui";
import { LogoCompact } from "@/components/Logo";
import { prettyPhone } from "@/lib/phone";

type OtpLoginProps = {
  role: "client" | "driver" | "admin";
  title?: string;
  subtitle?: string;
  redirectTo?: string;
  demoPhones?: { name: string; phone: string }[];
  onLoggedIn?: () => void | Promise<void>;
};

type Step = "phone" | "code" | "name";

/**
 * Connexion rapide par téléphone (OTP).
 * Aucune passerelle SMS n'étant configurée dans cet environnement, le code
 * de test est affiché directement dans l'interface.
 */
export default function OtpLogin({ role, title, subtitle, redirectTo = "/app", demoPhones, onLoggedIn }: OtpLoginProps) {
  const router = useRouter();
  const toast = useToast();
  const api = useApi();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    if (phone.replace(/\D/g, "").length < 9) {
      toast("Saisissez un numéro valide (ex : 07 07 07 07 07)", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ demoCode?: string }>("/api/auth/otp", { phone, role });
      setDemoCode(res.demoCode ?? null);
      setStep("code");
      toast(res.demoCode ? "Mode démonstration : utilisez le code affiché à l'écran" : "Code de vérification envoyé par SMS", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (code.trim().length !== 6) {
      toast("Le code contient 6 chiffres", "error");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/verify", { phone, code, role, name: step === "name" ? name : undefined });
      toast("Connexion réussie !", "success");
      await onLoggedIn?.();
      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Code incorrect", "error");
    } finally {
      setLoading(false);
    }
  }

  function submitName() {
    if (!name.trim()) {
      toast("Indiquez votre nom", "error");
      return;
    }
    verifyCode();
  }

  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden p-0">
      <div className="bg-gradient-to-br from-gozo-800 to-gozo-950 px-6 pb-8 pt-6 text-center">
        <LogoCompact className="mx-auto mb-4 h-10" />
        <h1 className="text-xl font-extrabold text-white">{title ?? "Connexion / Inscription"}</h1>
        <p className="mt-1 text-sm text-gozo-100">
          {subtitle ?? "Entrez votre numéro de téléphone pour recevoir un code de vérification"}
        </p>
      </div>

      <div className="space-y-4 p-6">
        {step === "phone" && (
          <div className="animate-fade-up space-y-4">
            <Input
              label="Numéro de téléphone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="07 07 07 07 07"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && requestCode()}
              hint="Format ivoirien : 01 / 05 / 07 / 25 / 27"
            />
            <Button className="w-full" size="lg" onClick={requestCode} disabled={loading}>
              {loading ? <Spinner /> : "Recevoir mon code"}
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="animate-fade-up space-y-4">
            <div className="rounded-2xl bg-gozo-50 p-3 text-center">
              <p className="text-sm text-gozo-700">
                Code envoyé au <strong>{prettyPhone(phone)}</strong>
              </p>
              <button className="mt-1 text-xs font-semibold text-gozo-500 hover:underline" onClick={() => setStep("phone")}>
                Modifier le numéro
              </button>
            </div>

            {demoCode && (
              <div className="rounded-2xl border-2 border-dashed border-gold-400 bg-gold-50 p-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">Mode démonstration — aucun SMS envoyé</p>
                <p className="mt-1 text-2xl font-black tracking-[0.4em] text-gozo-800">{demoCode}</p>
              </div>
            )}

            <Input
              label="Code de vérification (6 chiffres)"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && verifyCode()}
              className="text-center text-xl tracking-[0.5em]"
            />
            <Button className="w-full" size="lg" onClick={verifyCode} disabled={loading}>
              {loading ? <Spinner /> : "Valider"}
            </Button>
          </div>
        )}

        {step === "name" && (
          <div className="animate-fade-up space-y-4">
            <Input
              label="Votre nom"
              placeholder="Ex : Konan Yao"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitName()}
            />
            <Button className="w-full" size="lg" onClick={submitName} disabled={loading}>
              {loading ? <Spinner /> : "Terminer l'inscription"}
            </Button>
          </div>
        )}

        {demoPhones && step === "phone" && (
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Numéros de démonstration</p>
            <div className="space-y-1.5">
              {demoPhones.map((d) => (
                <button
                  key={d.phone}
                  onClick={() => setPhone(d.phone)}
                  className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:bg-gozo-50"
                >
                  <span className="font-semibold text-gozo-800">{d.name}</span>
                  <span className="font-mono text-xs text-slate-500">{prettyPhone(d.phone)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          En continuant, vous acceptez les conditions d'utilisation de GOZO LIVRAISON.
        </p>
      </div>
    </Card>
  );
}
