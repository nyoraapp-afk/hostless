"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  MessageCircle,
  Sparkles,
  Users,
  Lock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import {
  loadOnboarding,
  type OnboardingState,
} from "@/lib/onboarding-state";
import {
  PLAN_LABELS,
  PLAN_PRICES,
  DISPATCH_CATEGORIES,
} from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Toaster, toast } from "@/components/ui/toaster";

/**
 * Page p7 — Recap final avant paiement.
 *
 * Pattern 4 : avant de déclencher l'engagement (paiement Stripe), on montre
 * tout ce qui sera créé/débité, et le bouton final fait office de confirmation
 * explicite (la friction Stripe Checkout suffit comme confirmation).
 *
 * Pattern 2 : le total mensuel est explicitement étiqueté avec la date du
 * premier prélèvement (immédiat, à l'achèvement de la souscription Stripe).
 */
export default function RecapPage() {
  const router = useRouter();
  const [state, setState] = React.useState<OnboardingState | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const saved = loadOnboarding();
    setState(saved);
  }, []);

  if (!state) return null;

  const villas = state.villas.filter((v) => !v.removed);
  const villaCount = villas.length;
  const plan = state.plan;
  const total = plan ? PLAN_PRICES[plan] * villaCount : 0;

  // Garde-fou : si données manquantes, retour au début
  if (villaCount === 0) {
    router.push("/onboarding/villas");
    return null;
  }
  if (!plan) {
    router.push("/onboarding/forfait");
    return null;
  }

  async function handlePayment() {
    setSubmitting(true);
    try {
      // 1) Persiste l'onboarding en DB (villas, WhatsApp, équipe)
      const saveRes = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villas: villas.map((v) => ({
            airbnbId: v.airbnbId ?? null,
            name: v.name,
          })),
          whatsappE164: state!.whatsappE164,
          whatsappVerified: state!.whatsappVerified,
          plan,
          team: Object.fromEntries(
            Object.entries(state!.team)
              .filter(([, m]) =>
                Boolean(
                  m &&
                    m.name?.trim() &&
                    m.e164?.trim() &&
                    /^\+\d{8,15}$/.test(m.e164.trim())
                )
              )
              .map(([cat, m]) => [
                cat,
                { name: m!.name.trim(), phoneE164: m!.e164.trim() },
              ])
          ),
        }),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) {
        // Surface les détails Zod si présents pour comprendre quel champ pose problème
        const detail =
          (Array.isArray(saveJson.issues) &&
            saveJson.issues
              .map((i: { path: (string | number)[]; message: string }) =>
                `${i.path.join(".")} : ${i.message}`
              )
              .join(" — ")) ||
          saveJson.error ||
          "Erreur lors de la sauvegarde de vos données";
        console.error("[recap] save failed:", saveJson);
        throw new Error(detail);
      }

      // 2) Crée la session Stripe Checkout
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, quantity: villaCount }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Erreur de création de la session Stripe");
      }
      window.location.href = json.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Impossible d'ouvrir Stripe", { description: msg });
      setSubmitting(false);
    }
  }

  return (
    <>
      <OnboardingStepper current={6} total={6} label="Récapitulatif final" />

      <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:py-10">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
          Tout est <em className="text-aubergine-medium">prêt</em>
        </h1>
        <p className="mt-3 text-base text-ink-soft">
          Vérifiez votre récapitulatif. Au paiement, Stripe vous demandera votre carte —
          aucun débit avant votre confirmation.
        </p>

        <div className="mt-7 space-y-3">
          {/* Villas */}
          <RecapBlock
            icon={<Building2 className="h-4 w-4" aria-hidden />}
            title="Villas à monitorer"
            edit="/onboarding/villas"
          >
            <ul className="space-y-1.5">
              {villas.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink">{v.name}</span>
                  {v.airbnbId && (
                    <span className="font-mono text-xs text-ink-muted">
                      {v.airbnbId}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </RecapBlock>

          {/* WhatsApp */}
          <RecapBlock
            icon={<MessageCircle className="h-4 w-4" aria-hidden />}
            title="Numéro d'alerte"
            edit="/onboarding/whatsapp"
          >
            <div className="font-mono text-sm text-ink">
              {state.whatsappE164 || "—"}
            </div>
            {state.whatsappVerified && (
              <Badge variant="success" size="sm" className="mt-2">
                <Shield className="h-3 w-3" aria-hidden />
                Vérifié
              </Badge>
            )}
          </RecapBlock>

          {/* Forfait */}
          <RecapBlock
            icon={
              plan === "SERENITE" ? (
                <Sparkles className="h-4 w-4" aria-hidden />
              ) : (
                <Building2 className="h-4 w-4" aria-hidden />
              )
            }
            title="Forfait"
            edit="/onboarding/forfait"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-lg font-medium text-aubergine">
                {PLAN_LABELS[plan]}
              </span>
              {plan === "SERENITE" && (
                <Badge variant="premium" size="sm">
                  Recommandé
                </Badge>
              )}
            </div>
            <div className="mt-1 font-mono text-sm text-ink-muted">
              {formatPrice(PLAN_PRICES[plan])} / villa / mois
            </div>
          </RecapBlock>

          {/* Équipe (Sérénité uniquement) */}
          {plan === "SERENITE" && (
            <RecapBlock
              icon={<Users className="h-4 w-4" aria-hidden />}
              title="Équipe"
              edit="/onboarding/equipe"
            >
              {Object.keys(state.team).length === 0 ? (
                <div className="text-sm text-ink-muted italic">
                  Aucune catégorie configurée
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {DISPATCH_CATEGORIES.map((cat) => {
                    const m = state.team[cat.id];
                    if (!m) return null;
                    return (
                      <li
                        key={cat.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-ink-soft">{cat.label}</span>
                        <span className="text-ink truncate">
                          {m.name}{" "}
                          <span className="font-mono text-xs text-ink-muted">
                            · {m.e164}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </RecapBlock>
          )}
        </div>

        {/* Total */}
        <Card padding="md" variant="featured" className="mt-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-eyebrow text-on-aubergine-soft">
                Total mensuel
              </div>
              <div className="mt-1 font-serif text-3xl font-medium text-on-aubergine">
                {formatPrice(total)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-on-aubergine-soft">
                {villaCount} villa{villaCount > 1 ? "s" : ""} ·{" "}
                {PLAN_LABELS[plan]}
              </div>
              <div className="text-xs text-on-aubergine-muted">
                Premier prélèvement à la confirmation
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={handlePayment}
            isLoading={submitting}
            loadingText="Ouverture de Stripe…"
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
          >
            Procéder au paiement
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Lock className="h-3 w-3" aria-hidden />
            Paiement sécurisé Stripe · Annulable à tout moment
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-2 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-aubergine"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden />
            Revenir en arrière
          </button>
        </div>
      </div>

      <Toaster />
    </>
  );
}

function RecapBlock({
  icon,
  title,
  edit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  edit?: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-aubergine-50 text-aubergine">
            {icon}
          </div>
          <h3 className="text-sm font-medium text-ink">{title}</h3>
        </div>
        {edit && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-ink-muted hover:text-aubergine"
          >
            <a href={edit}>Modifier</a>
          </Button>
        )}
      </div>
      <div>{children}</div>
    </Card>
  );
}
