"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Badge } from "@/components/ui/badge";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import { LockedFeature } from "@/components/patterns/locked-feature";
import { loadOnboarding, saveOnboarding } from "@/lib/onboarding-state";
import { DISPATCH_CATEGORIES, type DispatchCategory } from "@/lib/types";
import { validatePhone, toE164 } from "@/lib/phone-formats";
import { cn } from "@/lib/utils";

/**
 * Page p6b — Configuration équipe.
 *
 * Comportement (Pattern 1) :
 *   - Si l'utilisateur a choisi Essentiel, on affiche LockedFeature avec upsell
 *     plutôt qu'un formulaire désactivé "fantôme". Cf. v34 ligne 3290 (le bug
 *     d'opacité 0.45 ambigu dans le proto).
 *   - Si Sérénité, on configure 6 catégories d'intervenants (1 par catégorie).
 *   - Au moins 1 catégorie est requise pour continuer.
 */
export default function EquipePage() {
  const router = useRouter();
  const [plan, setPlan] = React.useState<"ESSENTIEL" | "SERENITE" | null>(null);
  const [team, setTeam] = React.useState<
    Partial<Record<DispatchCategory, { name: string; e164: string }>>
  >({});

  React.useEffect(() => {
    const saved = loadOnboarding();
    if (!saved.plan) {
      router.push("/onboarding/forfait");
      return;
    }
    setPlan(saved.plan);
    setTeam(saved.team || {});
  }, [router]);

  if (plan === null) {
    return null;
  }

  if (plan === "ESSENTIEL") {
    return (
      <>
        <OnboardingStepper current={5} total={6} label="Équipe (Sérénité uniquement)" />
        <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:py-10">
          <LockedFeature
            isLocked
            requiredPlan="SERENITE"
            reason="Le dispatch automatique vers vos intervenants — ménage, piscine, jardin, maintenance, accueil — est inclus dans Sérénité. C'est précisément ce qui transforme une alerte 'à gérer' en alerte 'déjà prise en charge'."
            onUpsellClick={() => {
              saveOnboarding({ plan: "SERENITE" });
              router.push("/onboarding/forfait");
            }}
          />
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/onboarding/recap")}
              leftIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden />}
            >
              Continuer en Essentiel sans équipe
            </Button>
          </div>
        </div>
      </>
    );
  }

  // SERENITE — formulaire 6 catégories
  const configuredCount = Object.keys(team).length;
  const minRequired = 1;

  function setMember(
    cat: DispatchCategory,
    field: "name" | "e164",
    value: string
  ) {
    setTeam((prev) => ({
      ...prev,
      [cat]: {
        name: prev[cat]?.name || "",
        e164: prev[cat]?.e164 || "",
        [field]: value,
      },
    }));
  }

  function removeMember(cat: DispatchCategory) {
    setTeam((prev) => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });
  }

  function handleContinue() {
    // Persiste seulement les catégories complètes (nom + numéro valide)
    const valid: typeof team = {};
    for (const cat of DISPATCH_CATEGORIES) {
      const m = team[cat.id];
      if (m && m.name.trim() && m.e164.trim()) {
        valid[cat.id] = { name: m.name.trim(), e164: m.e164.trim() };
      }
    }
    saveOnboarding({ team: valid });
    router.push("/onboarding/recap");
  }

  return (
    <>
      <OnboardingStepper current={5} total={6} label="Configuration équipe" />

      <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:py-10">
        <Badge variant="premium" size="md" className="mb-3">
          <Sparkles className="h-3 w-3" aria-hidden />
          Sérénité
        </Badge>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
          Qui prévenir <em className="text-aubergine-medium">pour quoi</em> ?
        </h1>
        <p className="mt-3 text-base text-ink-soft">
          Pour chaque type de problème, indique qui doit recevoir l'alerte sur
          WhatsApp. Vous pouvez laisser des catégories vides — dans ce cas, hostelyo
          vous alertera directement.
        </p>

        <div className="mt-7 space-y-3">
          {DISPATCH_CATEGORIES.map((cat) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              member={team[cat.id]}
              onChange={(field, value) => setMember(cat.id, field, value)}
              onRemove={() => removeMember(cat.id)}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={configuredCount < minRequired}
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
          >
            Continuer
          </Button>
          <p className="text-xs text-ink-muted">
            <strong className="text-aubergine">{configuredCount}</strong>{" "}
            sur 6 catégories configurées
            {configuredCount < minRequired && " · minimum 1 requise"}
          </p>
          <button
            type="button"
            onClick={() => router.push("/onboarding/forfait")}
            className="mt-2 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-aubergine"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden />
            Revenir au choix de forfait
          </button>
        </div>
      </div>
    </>
  );
}

function CategoryRow({
  cat,
  member,
  onChange,
  onRemove,
}: {
  cat: { id: DispatchCategory; label: string; hint: string };
  member?: { name: string; e164: string };
  onChange: (field: "name" | "e164", value: string) => void;
  onRemove: () => void;
}) {
  const [country, setCountry] = React.useState("FR");
  const [local, setLocal] = React.useState("");
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const isExpanded = !!member && (member.name || member.e164);

  React.useEffect(() => {
    if (member?.e164) {
      // re-decompose e164 to country + local for re-edit (best-effort)
      // For simplicity, just reflect the raw e164 in `local`
      setLocal(member.e164.replace(/^\+\d{1,3}/, ""));
    }
  }, [member?.e164]);

  function commitPhone(newLocal: string, newCountry?: string) {
    setLocal(newLocal);
    const c = newCountry ?? country;
    if (!newLocal) {
      setPhoneError(null);
      onChange("e164", "");
      return;
    }
    const err = validatePhone(c, newLocal);
    setPhoneError(err);
    if (!err) {
      onChange("e164", toE164(c, newLocal));
    } else {
      onChange("e164", "");
    }
  }

  return (
    <Card padding="md" className={cn(isExpanded && "border-aubergine-soft")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-ink">{cat.label}</div>
          <div className="text-xs text-ink-muted mt-0.5">{cat.hint}</div>
        </div>
        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Retirer l'intervenant ${cat.label}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field
          label="Nom"
          htmlFor={`cat-${cat.id}-name`}
          hint="Comme vous l'appelez dans votre équipe."
        >
          <Input
            id={`cat-${cat.id}-name`}
            value={member?.name ?? ""}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder={`Marie · ${cat.label}`}
          />
        </Field>
        <Field
          label="Numéro WhatsApp"
          htmlFor={`cat-${cat.id}-phone`}
          error={phoneError ?? undefined}
        >
          <PhoneInput
            countryCode={country}
            onCountryCodeChange={(c) => {
              setCountry(c);
              commitPhone(local, c);
            }}
            value={local}
            onChange={(v) => commitPhone(v)}
            hasError={!!phoneError}
          />
        </Field>
      </div>
    </Card>
  );
}
