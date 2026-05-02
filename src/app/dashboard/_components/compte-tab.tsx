"use client";

import * as React from "react";
import {
  Sparkles,
  Check,
  MessageCircle,
  CreditCard,
  ShieldOff,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/field";
import { PhoneInput } from "@/components/phone-input";
import { Badge } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/patterns/confirm-action";
import { StateBadge } from "@/components/patterns/state-badge";
import { Toaster, toast } from "@/components/ui/toaster";
import {
  startChangeWhatsApp,
  cancelSubscription,
  uncancelSubscription,
  changeSubscriptionPlan,
} from "@/app/dashboard/_actions/compte";
import { validatePhone, toE164, findCountry } from "@/lib/phone-formats";
import { PLAN_LABELS, PLAN_PRICES, type PlanSlug } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import type { DashboardData } from "@/lib/dashboard-data";

/**
 * Onglet Compte du dashboard.
 *   - Email Google de connexion
 *   - Forfait actuel + StateBadge si résiliation programmée
 *   - Numéro WhatsApp d'alerte (modifiable)
 *   - Résiliation (ConfirmAction destructive avec date d'effet explicite)
 */
export function CompteTab({
  user,
  whatsapp,
  subscription,
}: {
  user: DashboardData["user"];
  whatsapp: DashboardData["whatsapp"];
  subscription: DashboardData["subscription"];
}) {
  const planSlug = subscription?.plan.slug ?? null;
  const planLabel = planSlug ? PLAN_LABELS[planSlug] : "—";
  const priceMonthly = subscription?.plan.priceMonthly ?? 0;

  const isCancelScheduled = subscription?.cancelAt !== null && subscription?.cancelAt !== undefined;

  return (
    <div className="space-y-3">
      {/* Identité */}
      <Card padding="md">
        <div className="text-eyebrow mb-3">Compte</div>
        <div className="flex items-center gap-3">
          <Mail
            className="h-4 w-4 flex-shrink-0 text-aubergine-medium"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm text-ink truncate">{user.email}</div>
            <div className="text-xs text-ink-muted mt-0.5">
              Connecté avec Google · membre depuis {formatDate(user.createdAt)}
            </div>
          </div>
        </div>
      </Card>

      {/* Forfait */}
      <Card padding="md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-aubergine text-on-aubergine">
              {planSlug === "SERENITE" ? (
                <Sparkles className="h-4 w-4" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
            </div>
            <div>
              <div className="text-eyebrow">Forfait actuel</div>
              <div className="font-serif text-lg font-medium text-aubergine mt-0.5">
                {planLabel}
              </div>
              <div className="font-mono text-xs text-ink-muted mt-0.5">
                {formatPrice(priceMonthly / 100)} / villa / mois
              </div>
              {subscription?.currentPeriodEnd && (
                <div className="text-xs text-ink-muted mt-2">
                  Prochain renouvellement le{" "}
                  <strong className="text-ink-soft">
                    {formatDate(subscription.currentPeriodEnd)}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {isCancelScheduled && subscription?.cancelAt && (
            <StateBadge
              state="scheduled"
              effectiveAt={subscription.cancelAt}
              tooltip="Votre souscription sera désactivée à cette date. Le service reste actif jusque-là."
            />
          )}
          {!isCancelScheduled && subscription && (
            <Badge variant="success" size="sm">
              <Check className="h-3 w-3" aria-hidden />
              Actif
            </Badge>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
          {/* Changement de forfait — ouvre la modale pédagogique */}
          {planSlug && (
            <ChangePlanButton
              currentPlan={planSlug}
              villaCount={1 /* TODO : passer le compteur réel */}
              currentPeriodEnd={subscription?.currentPeriodEnd ?? null}
            />
          )}
          <Button asChild variant="ghost" size="sm">
            <a href="https://billing.stripe.com/p/login/test_xxx" target="_blank" rel="noopener noreferrer">
              <CreditCard className="h-3.5 w-3.5" aria-hidden />
              Gérer le paiement
            </a>
          </Button>
        </div>
      </Card>

      {/* WhatsApp */}
      <WhatsAppCard whatsapp={whatsapp} />

      {/* Résiliation */}
      {subscription && (
        <Card padding="md" className="border-error/20">
          <div className="text-eyebrow mb-3 text-error">Zone sensible</div>

          {isCancelScheduled ? (
            <CancelScheduledRow
              cancelAt={subscription.cancelAt!}
            />
          ) : (
            <CancelSubscriptionRow
              currentPeriodEnd={subscription.currentPeriodEnd}
              planLabel={planLabel}
              villaCount={1 /* TODO : lire depuis villas count */}
            />
          )}
        </Card>
      )}

      <Toaster />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// WhatsApp card
// ─────────────────────────────────────────────────────────────────

function WhatsAppCard({ whatsapp }: { whatsapp: DashboardData["whatsapp"] }) {
  const [editing, setEditing] = React.useState(false);
  const [country, setCountry] = React.useState("FR");
  const [local, setLocal] = React.useState("");
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleStartChange(e: React.FormEvent) {
    e.preventDefault();
    const err = validatePhone(country, local);
    if (err) {
      setPhoneError(err);
      return;
    }
    setPhoneError(null);
    setSubmitting(true);
    try {
      const e164 = toE164(country, local);
      // Envoie l'OTP via Twilio
      const otpRes = await fetch("/api/whatsapp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ e164, channel: "whatsapp" }),
      });
      const otpJson = await otpRes.json();
      if (!otpRes.ok) {
        toast.error("Envoi du code impossible", {
          description: otpJson.hint || otpJson.error,
        });
        return;
      }
      // Marque comme PENDING_VERIFICATION en DB
      await startChangeWhatsApp({ e164 });
      toast.success(
        "Code envoyé sur le nouveau numéro. Une page de vérification arrive bientôt — pour l'instant, contactez-nous si le code n'arrive pas.",
        { duration: 8000 }
      );
      setEditing(false);
      setLocal("");
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-aubergine-50 text-aubergine">
            <MessageCircle className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-eyebrow">Numéro d'alerte WhatsApp</div>
            <div className="font-mono text-sm text-ink mt-0.5">
              {whatsapp?.e164 ?? "Non configuré"}
            </div>
            {whatsapp?.status === "VERIFIED" && (
              <Badge variant="success" size="sm" className="mt-2">
                <Check className="h-3 w-3" aria-hidden />
                Vérifié
              </Badge>
            )}
            {whatsapp?.status === "PENDING_VERIFICATION" && (
              <StateBadge state="pending" tooltip="OTP envoyé, en attente de validation." className="mt-2" />
            )}
          </div>
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Modifier
          </Button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleStartChange} className="mt-4 space-y-3 border-t border-border pt-4">
          <Field
            label="Nouveau numéro"
            htmlFor="new-wa"
            required
            error={phoneError ?? undefined}
            hint="Vous recevrez un code par WhatsApp pour confirmer."
          >
            <PhoneInput
              countryCode={country}
              onCountryCodeChange={setCountry}
              value={local}
              onChange={setLocal}
              hasError={!!phoneError}
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm" isLoading={submitting} loadingText="Envoi…">
              Envoyer le code
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={submitting}
              onClick={() => {
                setEditing(false);
                setLocal("");
                setPhoneError(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// Résiliation
// ─────────────────────────────────────────────────────────────────

function CancelSubscriptionRow({
  currentPeriodEnd,
  planLabel,
  villaCount,
}: {
  currentPeriodEnd: Date | null;
  planLabel: string;
  villaCount: number;
}) {
  const endDate = currentPeriodEnd ? formatDate(currentPeriodEnd) : "fin de la période";

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-error/10 text-error">
          <ShieldOff className="h-4 w-4" aria-hidden />
        </div>
        <div className="text-sm">
          <div className="font-medium text-ink">Résilier l'abonnement</div>
          <p className="mt-1 text-ink-soft">
            Votre service reste actif jusqu'au <strong>{endDate}</strong>. Aucun
            prélèvement supplémentaire après cette date.
          </p>
        </div>
      </div>

      <ConfirmAction
        level="destructive"
        title={`Résilier ${planLabel} ?`}
        description="Votre souscription sera résiliée à la fin de la période en cours. Le service hostelyo reste actif jusque-là, puis vos villas ne seront plus monitorées."
        impacts={[
          {
            label: "Forfait",
            before: planLabel,
            after: "Désactivé après " + endDate,
            variant: "loss",
          },
          {
            label: "Villas monitorées",
            after: `${villaCount} villa${villaCount > 1 ? "s" : ""} cesseront d'être surveillées le ${endDate}`,
            variant: "loss",
          },
        ]}
        effectiveAt={currentPeriodEnd ?? undefined}
        confirmWord="RESILIER"
        confirmLabel="Résilier"
        onConfirm={async () => {
          try {
            await cancelSubscription();
            toast.success("Résiliation programmée");
          } catch (err) {
            toast.error("Erreur", {
              description: err instanceof Error ? err.message : String(err),
            });
          }
        }}
        trigger={
          <Button variant="destructive" size="sm">
            Résilier
          </Button>
        }
      />
    </div>
  );
}

function CancelScheduledRow({ cancelAt }: { cancelAt: Date }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-gold-soft/60 text-[#7A6432]">
          <ShieldOff className="h-4 w-4" aria-hidden />
        </div>
        <div className="text-sm">
          <div className="font-medium text-ink">Résiliation programmée</div>
          <p className="mt-1 text-ink-soft">
            Votre souscription sera résiliée le{" "}
            <strong className="text-aubergine">{formatDate(cancelAt)}</strong>.
            Vous pouvez encore changer d'avis jusque-là.
          </p>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          try {
            await uncancelSubscription();
            toast.success("Résiliation annulée — votre souscription continue");
          } catch (err) {
            toast.error("Erreur", {
              description: err instanceof Error ? err.message : String(err),
            });
          }
        }}
      >
        Annuler la résiliation
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ChangePlanButton — Pattern 4 (modale pédagogique avant changement)
// ─────────────────────────────────────────────────────────────────

function ChangePlanButton({
  currentPlan,
  villaCount,
  currentPeriodEnd,
}: {
  currentPlan: PlanSlug;
  villaCount: number;
  currentPeriodEnd: Date | null;
}) {
  const targetPlan: PlanSlug = currentPlan === "ESSENTIEL" ? "SERENITE" : "ESSENTIEL";
  const isUpgrade = currentPlan === "ESSENTIEL"; // → SERENITE = upgrade

  const currentPrice = PLAN_PRICES[currentPlan] * villaCount;
  const targetPrice = PLAN_PRICES[targetPlan] * villaCount;
  const priceDiff = targetPrice - currentPrice;

  const dateEffet = isUpgrade ? new Date() : currentPeriodEnd ?? undefined;

  // Description et impacts adaptés au sens du changement (pédagogie §6 du récap UX)
  const description = isUpgrade
    ? `Vos alertes seront automatiquement transmises au bon intervenant selon la catégorie du problème. Vous restez en copie de chaque envoi. Le changement est immédiat — Stripe crédite au prorata la différence avec votre cycle en cours.`
    : `Les alertes ne seront plus transmises automatiquement à votre équipe — vous recevrez chaque alerte WhatsApp et contacterez vous-même vos intervenants. Le changement prendra effet le ${currentPeriodEnd ? formatDate(currentPeriodEnd) : "prochain renouvellement"}, vous gardez Sérénité jusque-là.`;

  const impacts = [
    {
      label: "Forfait",
      before: PLAN_LABELS[currentPlan],
      after: PLAN_LABELS[targetPlan],
      variant: "info" as const,
    },
    {
      label: "Tarif mensuel",
      before: formatPrice(currentPrice),
      after: formatPrice(targetPrice),
      variant: (priceDiff > 0 ? "cost-up" : "cost-down") as "cost-up" | "cost-down",
    },
    {
      label: "Dispatch automatique vers équipe",
      after: targetPlan === "SERENITE" ? "Activé" : "Désactivé",
      variant: targetPlan === "SERENITE" ? ("info" as const) : ("loss" as const),
    },
  ];

  return (
    <ConfirmAction
      level="warning"
      title={`${isUpgrade ? "Passer à" : "Repasser à"} ${PLAN_LABELS[targetPlan]} ?`}
      description={description}
      impacts={impacts}
      effectiveAt={dateEffet}
      confirmLabel={isUpgrade ? "Passer à Sérénité" : "Confirmer le changement"}
      onConfirm={async () => {
        try {
          await changeSubscriptionPlan({ targetPlan });
          toast.success(
            isUpgrade
              ? "Sérénité activé — vos prochaines alertes partiront aussi à votre équipe"
              : `Changement programmé pour le ${currentPeriodEnd ? formatDate(currentPeriodEnd) : "prochain renouvellement"}`
          );
        } catch (err) {
          toast.error("Changement de forfait impossible", {
            description: err instanceof Error ? err.message : String(err),
          });
        }
      }}
      trigger={
        <Button variant="secondary" size="sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {isUpgrade
            ? `Passer à ${PLAN_LABELS[targetPlan]}`
            : `Repasser à ${PLAN_LABELS[targetPlan]}`}
        </Button>
      }
    />
  );
}

// Unused import suppression
void findCountry;
