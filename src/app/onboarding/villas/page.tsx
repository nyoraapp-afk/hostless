"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Trash2, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import {
  loadOnboarding,
  saveOnboarding,
  MOCK_DETECTED_VILLAS,
  type DetectedVilla,
} from "@/lib/onboarding-state";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";

/**
 * Page p4 — Recap des villas détectées.
 *
 * Comportements clés :
 *   - UNDO 5s sur suppression (toast avec action "Annuler" — Pattern 4 en mode léger)
 *   - Ajout manuel d'une villa
 *   - Compteur dynamique "X villa(s) à monitorer"
 *   - Bloque le passage à l'étape suivante si 0 villa active
 *
 * Phase 1.A++ — données mock (3 villas du proto). Quand la DB est branchée, on
 * remplacera par un fetch des villas détectées par le scan Gmail réel.
 */
export default function VillasPage() {
  const router = useRouter();
  const [villas, setVillas] = React.useState<DetectedVilla[]>([]);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newAirbnbId, setNewAirbnbId] = React.useState("");

  // Initial load — priorité : DB > sessionStorage > mock
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/onboarding/state");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data.villas && data.villas.length > 0) {
            const dbVillas: DetectedVilla[] = data.villas.map((v: { id: string; name: string; airbnbId: string | null }) => ({
              id: v.id,
              name: v.name,
              airbnbId: v.airbnbId ?? undefined,
            }));
            setVillas(dbVillas);
            saveOnboarding({ villas: dbVillas });
            return;
          }
        }
      } catch {
        // Si l'API plante, on tombe sur sessionStorage / mock
      }

      // Fallback : sessionStorage si présent, sinon mock
      const saved = loadOnboarding();
      if (saved.villas.length > 0) {
        setVillas(saved.villas);
      } else {
        setVillas(MOCK_DETECTED_VILLAS);
        saveOnboarding({ villas: MOCK_DETECTED_VILLAS });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = villas.filter((v) => !v.removed).length;

  function persist(next: DetectedVilla[]) {
    setVillas(next);
    saveOnboarding({ villas: next });
  }

  function handleRemove(id: string) {
    const villa = villas.find((v) => v.id === id);
    if (!villa) return;
    persist(villas.map((v) => (v.id === id ? { ...v, removed: true } : v)));
    toast(
      `Villa "${villa.name}" retirée`,
      {
        description: "Vous pouvez annuler dans les 5 secondes.",
        duration: 5000,
        action: {
          label: "Annuler",
          onClick: () => {
            persist(
              villas.map((v) => (v.id === id ? { ...v, removed: false } : v))
            );
            toast.success(`"${villa.name}" restaurée`);
          },
        },
      }
    );
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const next: DetectedVilla[] = [
      ...villas,
      {
        id: `manual-${Date.now()}`,
        name: newName.trim(),
        airbnbId: newAirbnbId.trim() || undefined,
      },
    ];
    persist(next);
    setNewName("");
    setNewAirbnbId("");
    setShowAddForm(false);
    toast.success(`Villa "${newName}" ajoutée`);
  }

  function handleContinue() {
    if (activeCount === 0) {
      toast.error("Vous devez garder au moins une villa pour continuer");
      return;
    }
    router.push("/onboarding/whatsapp");
  }

  return (
    <>
      <OnboardingStepper current={2} total={6} label="Recap des villas détectées" />

      <div className="mx-auto w-full max-w-xl px-6 py-8 sm:py-10">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
          Voici ce qu'on a <em className="text-aubergine-medium">détecté</em>
        </h1>
        <p className="mt-3 text-base text-ink-soft">
          Vérifiez que la liste est correcte. Vous pourrez toujours ajouter ou retirer
          des villas plus tard depuis votre tableau de bord.
        </p>

        <div className="mt-7 space-y-3">
          {villas.length === 0 && (
            <Card padding="md" variant="muted">
              <p className="text-sm text-ink-soft">Chargement…</p>
            </Card>
          )}

          {villas.map((villa) => (
            <VillaRow
              key={villa.id}
              villa={villa}
              onRemove={() => handleRemove(villa.id)}
              onUndo={() =>
                persist(
                  villas.map((v) =>
                    v.id === villa.id ? { ...v, removed: false } : v
                  )
                )
              }
            />
          ))}
        </div>

        {!showAddForm ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => setShowAddForm(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />}
          >
            Ajouter une villa manuellement
          </Button>
        ) : (
          <Card padding="md" className="mt-4 bg-cream-warm/30">
            <form onSubmit={handleAdd} className="space-y-3">
              <Field
                label="Nom de la villa"
                htmlFor="new-villa-name"
                required
                hint="Comme elle apparaît dans Airbnb (ex : Villa Sunset)."
              >
                <Input
                  id="new-villa-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Villa Sunset"
                  autoFocus
                />
              </Field>
              <Field
                label="ID Airbnb"
                htmlFor="new-villa-airbnb"
                hint="Optionnel — si vous le connaissez (numéro à 6-12 chiffres dans l'URL Airbnb)."
              >
                <Input
                  id="new-villa-airbnb"
                  value={newAirbnbId}
                  onChange={(e) => setNewAirbnbId(e.target.value)}
                  placeholder="12345678"
                />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Ajouter
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewName("");
                    setNewAirbnbId("");
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={activeCount === 0}
          >
            Continuer
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <p className="text-xs text-ink-muted">
            <strong className="text-aubergine">{activeCount}</strong>{" "}
            villa{activeCount > 1 ? "s" : ""} à monitorer
          </p>
        </div>
      </div>

      <Toaster />
    </>
  );
}

function VillaRow({
  villa,
  onRemove,
  onUndo,
}: {
  villa: DetectedVilla;
  onRemove: () => void;
  onUndo: () => void;
}) {
  if (villa.removed) {
    return (
      <Card padding="sm" className="opacity-60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 line-through text-ink-muted">
            <Building2 className="h-4 w-4" aria-hidden />
            <span className="text-sm">{villa.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}
          >
            Restaurer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-aubergine-50 text-aubergine">
            <Building2 className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink truncate">{villa.name}</div>
            {villa.airbnbId && (
              <div className="font-mono text-xs text-ink-muted">
                Airbnb · {villa.airbnbId}
              </div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`Retirer ${villa.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </Card>
  );
}
