"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/field";
import { PhoneInput } from "@/components/phone-input";
import { Input } from "@/components/ui/input";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import {
  loadOnboarding,
  saveOnboarding,
} from "@/lib/onboarding-state";
import { validatePhone, toE164 } from "@/lib/phone-formats";
import { Toaster, toast } from "@/components/ui/toaster";

/**
 * Page p5 — Numéro WhatsApp + OTP.
 *
 * Phase 1.A++ — OTP **mock** (n'importe quel code 6 chiffres sauf "000000" est accepté).
 * Phase 1.B — branchement Twilio Verify API (sendCode + checkCode).
 *
 * Adresse Pattern 10 (validation E.164 stricte + messages d'erreur précis).
 */
export default function WhatsAppPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"phone" | "otp" | "verified">("phone");
  const [country, setCountry] = React.useState("FR");
  const [local, setLocal] = React.useState("");
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState("");
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      // Priorité : DB si déjà vérifié > sessionStorage
      try {
        const res = await fetch("/api/onboarding/state");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data.whatsapp?.verified && data.whatsapp.e164) {
            // Décompose e164 en country + local (best-effort, FR par défaut)
            saveOnboarding({
              whatsappE164: data.whatsapp.e164,
              whatsappVerified: true,
            });
            setStep("verified");
            return;
          }
        }
      } catch {
        // continue avec sessionStorage
      }

      const saved = loadOnboarding();
      if (saved.whatsappCountry) setCountry(saved.whatsappCountry);
      if (saved.whatsappLocal) setLocal(saved.whatsappLocal);
      if (saved.whatsappVerified) setStep("verified");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const e164 = toE164(country, local);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const err = validatePhone(country, local);
    if (err) {
      setPhoneError(err);
      return;
    }
    setPhoneError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/whatsapp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ e164, channel: "whatsapp" }),
      });
      const json = await res.json();
      if (!res.ok) {
        const description =
          json.hint || json.error || "Vérifie le numéro et réessaie.";
        toast.error("Impossible d'envoyer le code", { description });
        return;
      }
      saveOnboarding({
        whatsappCountry: country,
        whatsappLocal: local,
        whatsappE164: e164,
      });
      toast.success(`Code envoyé sur votre WhatsApp`, {
        description: `Si vous ne le recevez pas, vérifiez que vous avez bien envoyé "join principal-western" à +1 415 523 8886 depuis votre WhatsApp.`,
        duration: 8000,
      });
      setStep("otp");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError("Le code doit contenir 6 chiffres.");
      return;
    }
    setOtpError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/whatsapp/check-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ e164, code: otp }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setOtpError(json.error || "Code incorrect ou expiré.");
        return;
      }
      saveOnboarding({ whatsappVerified: true });
      setStep("verified");
      toast.success("Numéro vérifié");
      setTimeout(() => router.push("/onboarding/forfait"), 600);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <OnboardingStepper current={3} total={6} label="Numéro WhatsApp d'alerte" />

      <div className="mx-auto w-full max-w-xl px-6 py-8 sm:py-10">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
          Où on vous envoie les <em className="text-aubergine-medium">alertes</em> ?
        </h1>
        <p className="mt-3 text-base text-ink-soft">
          Le numéro WhatsApp qui recevra les vraies urgences. Vous pourrez le
          modifier à tout moment depuis votre compte.
        </p>

        <Card padding="md" className="mt-7">
          {step === "phone" && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <Field
                label="Numéro WhatsApp"
                htmlFor="phone"
                required
                error={phoneError ?? undefined}
                hint="Choisissez votre pays puis saisissez le numéro local."
              >
                <PhoneInput
                  countryCode={country}
                  onCountryCodeChange={setCountry}
                  value={local}
                  onChange={setLocal}
                  hasError={!!phoneError}
                />
              </Field>
              <Button
                type="submit"
                size="lg"
                block
                isLoading={submitting}
                loadingText="Envoi du code…"
                rightIcon={<MessageCircle className="h-4 w-4" aria-hidden />}
              >
                Recevoir le code par WhatsApp
              </Button>
              <p className="text-center text-xs text-ink-muted">
                Phase 1.A — OTP mock. Twilio sera branché en Phase 1.B.
              </p>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-sm text-ink-soft">
                Code envoyé à{" "}
                <strong className="font-mono text-aubergine">{e164}</strong>.{" "}
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-aubergine underline underline-offset-4 hover:text-aubergine-medium"
                >
                  Modifier
                </button>
              </div>
              <Field
                label="Code de vérification"
                htmlFor="otp"
                required
                error={otpError ?? undefined}
                hint="6 chiffres reçus sur WhatsApp. Le code expire dans 5 minutes."
              >
                <Input
                  id="otp"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  hasError={!!otpError}
                  className="text-center font-mono text-lg tracking-widest"
                  autoFocus
                />
              </Field>
              <Button
                type="submit"
                size="lg"
                block
                isLoading={submitting}
                loadingText="Vérification…"
              >
                Vérifier
              </Button>
            </form>
          )}

          {step === "verified" && (
            <div className="flex items-center gap-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-ink">
                  Numéro vérifié
                </div>
                <div className="font-mono text-xs text-ink-muted">{e164}</div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push("/onboarding/forfait")}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden />}
              >
                Continuer
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Toaster />
    </>
  );
}
