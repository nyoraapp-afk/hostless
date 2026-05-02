"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Plus, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { Toaster, toast } from "@/components/ui/toaster";
import { bulkCreateVillas } from "../_actions";

/**
 * Onboarding forwarding · étape 2 — saisie manuelle des villas.
 *
 * Différence avec OAuth Gmail : pas de scan auto, on demande à l'utilisateur
 * de lister ses villas manuellement (nom + ID Airbnb optionnel).
 *
 * L'ID Airbnb permet à hostelyo d'associer correctement les emails reçus à la
 * bonne villa. Sans ID, on ne peut pas dispatch correctement (mais l'email
 * arrivera quand même comme "orphelin" dans la table Message).
 */
type VillaInput = {
  id: string; // local key
  name: string;
  airbnbId: string;
  errorName?: string;
  errorAirbnb?: string;
};

function newVilla(): VillaInput {
  return { id: Math.random().toString(36).slice(2, 9), name: "", airbnbId: "" };
}

export default function ForwardingVillasPage() {
  const router = useRouter();
  const [villas, setVillas] = React.useState<VillaInput[]>([newVilla()]);
  const [submitting, setSubmitting] = React.useState(false);

  function update(id: string, patch: Partial<VillaInput>) {
    setVillas((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...patch, errorName: undefined, errorAirbnb: undefined } : v))
    );
  }

  function add() {
    setVillas((prev) => [...prev, newVilla()]);
  }

  function remove(id: string) {
    setVillas((prev) => (prev.length > 1 ? prev.filter((v) => v.id !== id) : prev));
  }

  function validate(): boolean {
    let valid = true;
    setVillas((prev) =>
      prev.map((v) => {
        let errorName: string | undefined;
        let errorAirbnb: string | undefined;
        if (!v.name.trim()) {
          errorName = "Donnez un nom à la villa.";
          valid = false;
        }
        if (v.airbnbId.trim() && !/^\d{6,12}$/.test(v.airbnbId.trim())) {
          errorAirbnb = "L'ID Airbnb doit contenir 6 à 12 chiffres uniquement.";
          valid = false;
        }
        return { ...v, errorName, errorAirbnb };
      })
    );
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await bulkCreateVillas({
        villas: villas.map((v) => ({
          name: v.name.trim(),
          airbnbId: v.airbnbId.trim() || undefined,
        })),
      });
      toast.success(
        `${result.created} villa${result.created > 1 ? "s" : ""} ajoutée${result.created > 1 ? "s" : ""}`
      );
      router.push("/onboarding/forwarding/wait");
    } catch (err) {
      toast.error("Impossible d'ajouter les villas", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-6 py-10 sm:py-14">
      <div className="text-eyebrow mb-3">Étape 2 sur 3 · Vos villas</div>
      <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
        Listez vos <em className="text-aubergine-medium">villas</em>
      </h1>
      <p className="mt-3 text-base text-ink-soft">
        Donnez-nous le nom et l'ID Airbnb de chaque villa que vous gérez. L'ID Airbnb
        sert à associer les messages entrants à la bonne villa pour le dispatch.
      </p>

      <Card padding="md" variant="muted" className="mt-5">
        <p className="text-xs text-ink-soft leading-relaxed">
          <strong className="text-aubergine">Comment trouver l'ID Airbnb ?</strong>{" "}
          Ouvrez votre annonce Airbnb dans un navigateur. L'URL ressemble à{" "}
          <code className="font-mono text-[11px]">airbnb.com/rooms/12345678</code>.
          Le numéro à la fin (6 à 12 chiffres) est l'ID Airbnb. C'est optionnel mais
          recommandé pour que hostelyo route les bonnes alertes.
        </p>
      </Card>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {villas.map((v, idx) => (
          <Card key={v.id} padding="md">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-aubergine">
                <Building2 className="h-4 w-4" aria-hidden />
                Villa {idx + 1}
              </div>
              {villas.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(v.id)}
                  aria-label={`Retirer villa ${idx + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Nom"
                htmlFor={`name-${v.id}`}
                required
                error={v.errorName}
              >
                <Input
                  id={`name-${v.id}`}
                  value={v.name}
                  onChange={(e) => update(v.id, { name: e.target.value })}
                  placeholder="Villa Sunset"
                  hasError={!!v.errorName}
                />
              </Field>
              <Field
                label="ID Airbnb"
                htmlFor={`airbnb-${v.id}`}
                hint="Optionnel · 6-12 chiffres."
                error={v.errorAirbnb}
              >
                <Input
                  id={`airbnb-${v.id}`}
                  inputMode="numeric"
                  value={v.airbnbId}
                  onChange={(e) =>
                    update(v.id, { airbnbId: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="12345678"
                  hasError={!!v.errorAirbnb}
                />
              </Field>
            </div>
          </Card>
        ))}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={add}
          leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />}
        >
          Ajouter une villa
        </Button>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center pt-6 border-t border-border mt-8">
          <Button asChild variant="ghost" size="sm" disabled={submitting}>
            <Link href="/onboarding/forwarding">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Retour
            </Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            isLoading={submitting}
            loadingText="Enregistrement…"
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
          >
            Continuer
          </Button>
        </div>
      </form>

      <Toaster />
    </div>
  );
}
