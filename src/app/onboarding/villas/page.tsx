"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Trash2,
  RotateCcw,
  ArrowRight,
  Mail,
  Forward,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import {
  loadOnboarding,
  saveOnboarding,
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
  const [emailsScanned, setEmailsScanned] = React.useState<number | null>(null);

  // Initial load — priorité : DB > sessionStorage > vide (plus de mock)
  // Si 0 villa détectée par le scan Gmail, on affiche un écran d'aide à l'utilisateur
  // au lieu de lui montrer des fausses villas qu'il devra supprimer.
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      // Toujours lire emailsScanned depuis sessionStorage (sauvegardé par /onboarding/scan)
      const saved = loadOnboarding();
      if (!cancelled) setEmailsScanned(saved.emailsScanned);

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
            setLoaded(true);
            return;
          }
        }
      } catch {
        // Si l'API plante, on tombe sur sessionStorage
      }

      // Fallback : sessionStorage si présent
      if (saved.villas.length > 0) {
        setVillas(saved.villas);
      }
      // Sinon → liste vide, on affichera l'écran "0 villa détectée"
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Si emailsScanned === 0, l'ajout manuel est bloqué (la boîte ne reçoit
  // pas les notifs Airbnb — pas la peine d'ajouter une villa qui ne sera
  // jamais alertée).
  const isManualAddBlocked = emailsScanned === 0;

  // État du re-scan (utilisé après configuration d'un transfert)
  const [rescanning, setRescanning] = React.useState(false);

  async function handleRescan() {
    setRescanning(true);
    try {
      const res = await fetch("/api/onboarding/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors du scan", {
          description: data.hint,
        });
        return;
      }
      // Met à jour l'état local + sessionStorage
      setEmailsScanned(data.emailsScanned);
      saveOnboarding({ emailsScanned: data.emailsScanned });

      if (data.villas && data.villas.length > 0) {
        const dbVillas: DetectedVilla[] = data.villas.map(
          (v: { id: string; name: string; airbnbId: string | null }) => ({
            id: v.id,
            name: v.name,
            airbnbId: v.airbnbId ?? undefined,
          })
        );
        setVillas(dbVillas);
        saveOnboarding({ villas: dbVillas });
        toast.success(
          `${dbVillas.length} villa${dbVillas.length > 1 ? "s" : ""} détectée${dbVillas.length > 1 ? "s" : ""} !`
        );
      } else if (data.emailsScanned === 0) {
        toast.error("Toujours aucun email Airbnb détecté", {
          description:
            "Le transfert peut prendre quelques minutes pour être actif. Réessayez dans 5 minutes ou envoyez-vous un email Airbnb manuel pour valider.",
        });
      } else {
        toast.info(
          `${data.emailsScanned} email${data.emailsScanned > 1 ? "s" : ""} Airbnb détecté${data.emailsScanned > 1 ? "s" : ""}, mais aucune villa identifiable. Ajoutez-les manuellement.`
        );
      }
    } catch {
      toast.error("Erreur réseau", {
        description: "Vérifiez votre connexion et réessayez.",
      });
    } finally {
      setRescanning(false);
    }
  }

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
    const trimmedName = newName.trim();
    const trimmedId = newAirbnbId.trim();

    if (!trimmedName) {
      toast.error("Le nom de la villa est obligatoire");
      return;
    }

    // Validation format ID Airbnb (si fourni)
    if (trimmedId && !/^\d{6,12}$/.test(trimmedId)) {
      toast.error(
        "L'ID Airbnb doit être un nombre de 6 à 12 chiffres (visible dans l'URL airbnb.com/rooms/XXXXX)"
      );
      return;
    }

    // Détecte les doublons par ID Airbnb
    if (
      trimmedId &&
      villas.some((v) => v.airbnbId === trimmedId && !v.removed)
    ) {
      toast.error("Cette villa est déjà dans votre liste");
      return;
    }

    const next: DetectedVilla[] = [
      ...villas,
      {
        id: `manual-${Date.now()}`,
        name: trimmedName,
        airbnbId: trimmedId || undefined,
      },
    ];
    persist(next);
    setNewName("");
    setNewAirbnbId("");
    setShowAddForm(false);
    toast.success(`Villa "${trimmedName}" ajoutée`);
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
          {/* Loading initial */}
          {!loaded && (
            <Card padding="md" variant="muted">
              <p className="text-sm text-ink-soft">Chargement…</p>
            </Card>
          )}

          {/* État : 0 villa détectée — message contextualisé selon emailsScanned */}
          {loaded && villas.length === 0 && (
            <Card
              padding="md"
              className={
                isManualAddBlocked
                  ? "border-error/30 bg-error/5"
                  : "border-warning/30 bg-warning/5"
              }
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={
                    "h-5 w-5 mt-0.5 flex-shrink-0 " +
                    (isManualAddBlocked ? "text-error" : "text-warning")
                  }
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  {isManualAddBlocked ? (
                    <>
                      <p className="text-sm font-medium text-aubergine">
                        Cette boîte Gmail ne reçoit pas vos notifications Airbnb
                      </p>
                      <p className="mt-1 text-sm text-ink-soft leading-relaxed">
                        Aucune notification Airbnb détectée sur les 90 derniers
                        jours dans cette boîte. Sans ces emails, hostelyo ne
                        pourra rien surveiller. Vous devez soit reconnecter avec
                        le bon compte Gmail, soit configurer un transfert depuis
                        votre boîte source &mdash; l'ajout manuel ne suffira
                        pas.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-aubergine">
                        Aucune villa Airbnb identifiée automatiquement
                      </p>
                      <p className="mt-1 text-sm text-ink-soft leading-relaxed">
                        Vos {emailsScanned} email
                        {emailsScanned && emailsScanned > 1 ? "s" : ""} Airbnb
                        détecté
                        {emailsScanned && emailsScanned > 1 ? "s" : ""} dans
                        cette boîte n'ont pas permis d'extraire de villa
                        automatiquement (format inhabituel). Vous pouvez les
                        ajouter manuellement ci-dessous.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Liste des villas détectées */}
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

        {/* Si 0 villa : options de résolution. L'ajout manuel est BLOQUÉ
            quand emailsScanned === 0 (la boîte ne reçoit rien — pas la peine
            d'ajouter une villa qui ne sera jamais alertée). */}
        {loaded && villas.length === 0 && !showAddForm && (
          <div
            className={
              "mt-5 grid gap-3 " +
              (isManualAddBlocked ? "sm:grid-cols-2" : "sm:grid-cols-3")
            }
          >
            <button
              type="button"
              onClick={() => signOut({ redirectTo: "/login" })}
              className="text-left rounded-md border border-border bg-cream-warm/30 p-4 transition-colors hover:border-aubergine-soft hover:bg-cream-warm/60"
            >
              <Mail className="h-4 w-4 text-aubergine-medium" aria-hidden />
              <p className="mt-2 text-sm font-medium text-aubergine">
                Mauvais Gmail
              </p>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                Vos notifs Airbnb arrivent dans une autre boîte. Reconnectez-vous
                avec le bon compte.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                toast.info("Configurer un transfert", {
                  description:
                    "1. Ouvrez votre boîte source (Outlook, iCloud, Yahoo…) → Paramètres → Transfert. 2. Ajoutez votre Gmail connecté ici comme destination. 3. Vérifiez que votre annonce Airbnb est ACTIVE (sinon aucune notif n'arrivera). 4. Pour valider rapidement : transférez-vous manuellement un email Airbnb récent depuis votre boîte source. 5. Cliquez 'Relancer le scan Gmail' ci-dessous.",
                  duration: 12000,
                })
              }
              className="text-left rounded-md border border-border bg-cream-warm/30 p-4 transition-colors hover:border-aubergine-soft hover:bg-cream-warm/60"
            >
              <Forward className="h-4 w-4 text-aubergine-medium" aria-hidden />
              <p className="mt-2 text-sm font-medium text-aubergine">
                Configurer un transfert
              </p>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                Vos notifs Airbnb arrivent ailleurs ? Transférez-les vers ce
                Gmail depuis votre boîte source.
              </p>
            </button>

            {/* L'option "Ajouter manuellement" n'est visible que si emailsScanned > 0
                (la boîte est la bonne, mais on n'a pas pu extraire de villa) */}
            {!isManualAddBlocked && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="text-left rounded-md border border-border bg-cream-warm/30 p-4 transition-colors hover:border-aubergine-soft hover:bg-cream-warm/60"
              >
                <Plus className="h-4 w-4 text-aubergine-medium" aria-hidden />
                <p className="mt-2 text-sm font-medium text-aubergine">
                  Ajouter manuellement
                </p>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                  Renseignez vous-même votre annonce Airbnb. La détection se
                  fera quand le 1er email arrivera.
                </p>
              </button>
            )}
          </div>
        )}

        {/* Bouton "Relancer le scan" — visible quand 0 villa et pas en formulaire d'ajout.
            Permet à l'utilisateur de re-vérifier après avoir configuré un transfert
            ou changé son setup. */}
        {loaded && villas.length === 0 && !showAddForm && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleRescan}
              disabled={rescanning}
              leftIcon={
                <RefreshCw
                  className={
                    "h-4 w-4 " + (rescanning ? "animate-spin" : "")
                  }
                  aria-hidden
                />
              }
            >
              {rescanning ? "Scan en cours…" : "Relancer le scan Gmail"}
            </Button>
            {isManualAddBlocked && (
              <p className="text-xs text-ink-muted text-center max-w-md leading-relaxed">
                Une fois votre transfert configuré ou votre Gmail Airbnb
                connecté, cliquez ici pour relancer la détection. La 1ère notif
                qui arrive validera votre configuration.
              </p>
            )}
          </div>
        )}

        {!showAddForm ? (
          villas.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => setShowAddForm(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />}
            >
              Ajouter une villa manuellement
            </Button>
          ) : null
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
          {activeCount > 0 ? (
            <p className="text-xs text-ink-muted">
              <strong className="text-aubergine">{activeCount}</strong>{" "}
              villa{activeCount > 1 ? "s" : ""} à monitorer
            </p>
          ) : (
            loaded && (
              <div className="flex items-start gap-2 max-w-sm text-center">
                <AlertTriangle
                  className="h-4 w-4 mt-0.5 flex-shrink-0 text-error"
                  aria-hidden
                />
                <p className="text-sm text-error font-medium text-left">
                  Au moins une villa est requise pour continuer.
                  <span className="block font-normal text-ink-soft mt-1">
                    Sélectionnez une des 3 options ci-dessus pour ajouter votre
                    première villa.
                  </span>
                </p>
              </div>
            )
          )}
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
