"use client";

import * as React from "react";
import { Building2, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { ConfirmAction } from "@/components/patterns/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { Toaster, toast } from "@/components/ui/toaster";
import { softDeleteVilla, addVilla } from "@/app/dashboard/_actions/villa";
import type { DashboardData } from "@/lib/dashboard-data";

/**
 * Onglet Villas du dashboard.
 *
 * - Liste les villas actives + leur compteur d'alertes/réservations
 * - Bouton "Ajouter une villa" → modale form
 * - Suppression via ConfirmAction destructive (Pattern 4) avec recap d'impact
 */
export function VillasTab({ villas }: { villas: DashboardData["villas"] }) {
  const [showAdd, setShowAdd] = React.useState(false);

  if (villas.length === 0 && !showAdd) {
    return (
      <>
        <EmptyState
          icon={<Building2 className="h-5 w-5" aria-hidden />}
          title="Aucune villa monitorée pour l'instant"
          description="Ajoutez votre première villa pour qu'hostelyo commence à veiller sur vos messages Airbnb."
          action={
            <Button onClick={() => setShowAdd(true)} leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />}>
              Ajouter ma première villa
            </Button>
          }
        />
        <Toaster />
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          <strong className="text-aubergine">{villas.length}</strong> villa
          {villas.length > 1 ? "s" : ""} monitorée{villas.length > 1 ? "s" : ""} 24h/24
        </p>
        {!showAdd && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAdd(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />}
          >
            Ajouter
          </Button>
        )}
      </div>

      {villas.map((v) => (
        <VillaRow key={v.id} villa={v} otherCount={villas.length - 1} />
      ))}

      {showAdd && <AddVillaForm onClose={() => setShowAdd(false)} />}

      <Toaster />
    </div>
  );
}

function VillaRow({
  villa,
  otherCount,
}: {
  villa: DashboardData["villas"][number];
  otherCount: number;
}) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const alertsCount = villa._count?.alerts ?? 0;
  const reservationsCount = villa._count?.reservations ?? 0;

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-aubergine-50 text-aubergine">
            <Building2 className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink truncate">{villa.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              {villa.airbnbId && (
                <span className="inline-flex items-center gap-1 font-mono">
                  Airbnb · {villa.airbnbId}
                  <a
                    href={`https://www.airbnb.com/rooms/${villa.airbnbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-muted hover:text-aubergine"
                    aria-label="Voir sur Airbnb"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </span>
              )}
              {(villa.city || villa.country) && (
                <span>
                  {[villa.city, villa.country].filter(Boolean).join(", ")}
                </span>
              )}
              <Badge variant="success" size="sm">
                {villa.status}
              </Badge>
            </div>
            {(alertsCount > 0 || reservationsCount > 0) && (
              <div className="mt-2 flex gap-3 text-xs text-ink-muted">
                {alertsCount > 0 && (
                  <span>
                    {alertsCount} alerte{alertsCount > 1 ? "s" : ""} envoyée{alertsCount > 1 ? "s" : ""}
                  </span>
                )}
                {reservationsCount > 0 && (
                  <span>
                    {reservationsCount} réservation{reservationsCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <ConfirmAction
          level="destructive"
          title={`Supprimer ${villa.name} ?`}
          description="Cette villa ne sera plus monitorée et ne déclenchera plus d'alertes. Les données historiques (alertes, réservations) sont conservées mais inaccessibles depuis le dashboard."
          impacts={[
            {
              label: "Alertes historiques",
              after: `${alertsCount} conservées`,
              variant: "info",
            },
            {
              label: "Monitoring",
              before: "Actif 24h/24",
              after: "Désactivé",
              variant: "loss",
            },
            {
              label: "Villas restantes",
              after: `${otherCount} villa${otherCount > 1 ? "s" : ""}`,
              variant: "info",
            },
          ]}
          confirmLabel="Supprimer définitivement"
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              await softDeleteVilla({ villaId: villa.id });
              toast.success(`${villa.name} supprimée`);
            } catch (e) {
              toast.error("Suppression impossible", {
                description: e instanceof Error ? e.message : String(e),
              });
            } finally {
              setIsDeleting(false);
            }
          }}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              isLoading={isDeleting}
              aria-label={`Supprimer ${villa.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          }
        />
      </div>
    </Card>
  );
}

function AddVillaForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = React.useState("");
  const [airbnbId, setAirbnbId] = React.useState("");
  const [errorName, setErrorName] = React.useState<string | null>(null);
  const [errorAirbnb, setErrorAirbnb] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!name.trim()) {
      setErrorName("Donnez un nom à la villa.");
      valid = false;
    }
    if (airbnbId.trim() && !/^\d{6,12}$/.test(airbnbId.trim())) {
      setErrorAirbnb("L'ID Airbnb doit contenir 6 à 12 chiffres uniquement.");
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    try {
      await addVilla({ name: name.trim(), airbnbId: airbnbId.trim() || undefined });
      toast.success(`${name} ajoutée`);
      setName("");
      setAirbnbId("");
      onClose();
    } catch (err) {
      toast.error("Impossible d'ajouter la villa", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card padding="md" className="bg-cream-warm/30">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm font-medium text-aubergine">Ajouter une villa</div>
        <Field
          label="Nom"
          htmlFor="add-villa-name"
          required
          hint="Comme elle apparaît dans Airbnb."
          error={errorName ?? undefined}
        >
          <Input
            id="add-villa-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errorName) setErrorName(null);
            }}
            placeholder="Villa Sunset"
            hasError={!!errorName}
            autoFocus
          />
        </Field>
        <Field
          label="ID Airbnb"
          htmlFor="add-villa-airbnb"
          hint="Optionnel · 6 à 12 chiffres (numéro dans l'URL Airbnb)."
          error={errorAirbnb ?? undefined}
        >
          <Input
            id="add-villa-airbnb"
            inputMode="numeric"
            value={airbnbId}
            onChange={(e) => {
              setAirbnbId(e.target.value.replace(/\D/g, ""));
              if (errorAirbnb) setErrorAirbnb(null);
            }}
            placeholder="12345678"
            hasError={!!errorAirbnb}
          />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" size="sm" isLoading={submitting} loadingText="Ajout…">
            Ajouter
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}
