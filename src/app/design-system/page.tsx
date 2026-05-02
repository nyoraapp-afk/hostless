"use client";

import * as React from "react";
import {
  Building2,
  AlertTriangle,
  Settings as SettingsIcon,
  Trash2,
  Plus,
  Send,
  Sparkles,
  Inbox,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Toaster, toast } from "@/components/ui/toaster";

import { LockedFeature } from "@/components/patterns/locked-feature";
import { StateBadge } from "@/components/patterns/state-badge";
import { ConfirmAction } from "@/components/patterns/confirm-action";
import { DataState } from "@/components/patterns/data-state";

import { formatPrice } from "@/lib/utils";

export default function DesignSystemDemo() {
  const [phoneCountry, setPhoneCountry] = React.useState("FR");
  const [phone, setPhone] = React.useState("");
  const [dataDemoStatus, setDataDemoStatus] = React.useState<
    "loading" | "error" | "empty" | "success"
  >("success");

  // Date d'effet simulée : prochaine facturation Stripe (15 jours)
  const nextBilling = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d;
  }, []);

  return (
    <>
      <AppShell
        activePath="/dashboard"
        user={{ name: "Ahmed Demo", email: "demo@hostelyo.com" }}
      >
        <div className="mx-auto max-w-5xl space-y-12">
          {/* === HERO === */}
          <header>
            <div className="text-eyebrow mb-3">Design system · Phase 0</div>
            <h1 className="text-h1 text-aubergine sm:text-display">
              Le langage <em className="text-aubergine-medium">visuel</em> de
              hostelyo<span className="text-powder">.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-ink-soft sm:text-lg">
              Tokens unifiés, composants accessibles, et 4 patterns qui adressent
              les frictions UX repérées dans les prototypes : feature lock,
              décalage temporel, confirmation contextualisée, états de données.
            </p>
          </header>

          {/* === Pattern 1 — LockedFeature === */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Pattern 1"
              title="Feature lock visuellement non ambigu"
              description="Quand une fonctionnalité dépend du plan, on ne se contente pas d'une opacité. Cadenas, badge plan, message contextualisé, CTA avec prix réel."
            />
            <LockedFeature
              isLocked
              requiredPlan="SERENITE"
              reason="Le dispatch automatique vers vos intervenants — ménage, piscine, jardin, maintenance — est inclus dans Sérénité. Vos urgences partent à la bonne personne sans réveiller votre nuit."
              onUpsellClick={() =>
                toast.success("Modale d'upgrade Sérénité ouverte (mock)")
              }
            />
          </section>

          {/* === Pattern 2 — StateBadge === */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Pattern 2"
              title="Décalage entre action et état affiché"
              description="Tout changement différé (Stripe webhook, OTP, prochaine facture) est explicitement étiqueté avec sa date d'effet. L'utilisateur sait exactement quand."
            />
            <Card padding="md">
              <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:gap-3">
                <BadgeRow label="Confirmé">
                  <StateBadge state="actual" />
                </BadgeRow>
                <BadgeRow label="En cours côté serveur">
                  <StateBadge state="pending" />
                </BadgeRow>
                <BadgeRow label="Programmé (changement Sérénité)">
                  <StateBadge state="scheduled" effectiveAt={nextBilling} />
                </BadgeRow>
                <BadgeRow label="Échec (carte refusée)">
                  <StateBadge
                    state="failed"
                    errorMessage="Carte refusée"
                    tooltip="Stripe a refusé le paiement le 24 avril. Mettez à jour votre moyen de paiement."
                  />
                </BadgeRow>
              </div>
            </Card>
          </section>

          {/* === Pattern 4 — ConfirmAction === */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Pattern 4"
              title="Confirmation contextualisée"
              description="3 niveaux de friction selon la gravité. Recap d'impact obligatoire pour warning + destructive. Saisie d'un mot magique pour les actions irréversibles."
            />
            <Card padding="md">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {/* Info */}
                <ConfirmAction
                  level="info"
                  title="Désactiver les notifications du week-end ?"
                  description="Vous ne recevrez plus d'alertes WhatsApp les samedis et dimanches. Les urgences critiques resteront actives."
                  onConfirm={async () => {
                    await new Promise((r) => setTimeout(r, 600));
                    toast.success("Notifications du week-end désactivées");
                  }}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Action info
                    </Button>
                  }
                />

                {/* Warning */}
                <ConfirmAction
                  level="warning"
                  title="Passer du forfait Essentiel à Sérénité ?"
                  description="Le dispatch automatique vers vos intervenants sera activé. Vos paramètres actuels sont conservés."
                  effectiveAt={nextBilling}
                  impacts={[
                    {
                      label: "Forfait",
                      before: "Essentiel",
                      after: "Sérénité",
                    },
                    {
                      label: "Tarif mensuel",
                      before: formatPrice(89),
                      after: formatPrice(129),
                      variant: "cost-up",
                    },
                    {
                      label: "Équipe (dispatch)",
                      after: "Activée",
                      variant: "info",
                    },
                  ]}
                  onConfirm={async () => {
                    await new Promise((r) => setTimeout(r, 800));
                    toast.success("Changement programmé pour le prochain renouvellement");
                  }}
                  trigger={
                    <Button variant="primary" size="sm">
                      Action warning (changement plan)
                    </Button>
                  }
                />

                {/* Destructive */}
                <ConfirmAction
                  level="destructive"
                  title="Supprimer Villa Sunset ?"
                  description="Cette villa ne sera plus monitorée et ne déclenchera plus d'alertes. Les données historiques sont conservées 90 jours pour vos exports comptables."
                  impacts={[
                    {
                      label: "Alertes historiques",
                      after: "12 conservées (90 j)",
                      variant: "info",
                    },
                    {
                      label: "Réservations en cours",
                      after: "3 actives (perdues)",
                      variant: "loss",
                    },
                    {
                      label: "Tarif mensuel",
                      before: formatPrice(129),
                      after: formatPrice(0) + " (3 villas restantes)",
                      variant: "cost-down",
                    },
                  ]}
                  onConfirm={async () => {
                    await new Promise((r) => setTimeout(r, 900));
                    toast.success("Villa Sunset supprimée");
                  }}
                  trigger={
                    <Button
                      variant="destructive"
                      size="sm"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                    >
                      Action destructive (suppr. villa)
                    </Button>
                  }
                />
              </div>
            </Card>
          </section>

          {/* === Pattern 6 — DataState === */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Pattern 6"
              title="États de données explicites"
              description="Loading (skeleton), error (contextualisée + retry), empty (avec CTA), success. Aucune zone data-driven ne s'affiche sans passer par là."
            />
            <Card padding="md">
              <div className="mb-4 flex flex-wrap gap-2">
                {(["loading", "error", "empty", "success"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={dataDemoStatus === s ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setDataDemoStatus(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
              <div className="rounded-md border border-dashed border-border bg-cream-warm/30 p-6">
                <DataState
                  status={dataDemoStatus}
                  errorType="network"
                  onRetry={() => {
                    setDataDemoStatus("loading");
                    setTimeout(() => setDataDemoStatus("success"), 1200);
                  }}
                  emptyIcon={<Inbox className="h-5 w-5" aria-hidden />}
                  emptyTitle="Aucune alerte aujourd'hui"
                  emptyDescription="Tout va bien. hostelyo veille — vous serez prévenu uniquement si quelque chose nécessite votre intervention."
                  emptyAction={
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden />}
                    >
                      Configurer un test
                    </Button>
                  }
                >
                  {/* success state */}
                  <ul className="space-y-3">
                    {[
                      {
                        title: "Check-in Villa Sunset · 14h30",
                        urgency: "MEDIUM" as const,
                        ago: "il y a 12 min",
                      },
                      {
                        title: "Wifi en panne — Villa Pamplemousses",
                        urgency: "HIGH" as const,
                        ago: "il y a 47 min",
                      },
                      {
                        title: "Demande information piscine — Villa Tamarin",
                        urgency: "LOW" as const,
                        ago: "il y a 2 h",
                      },
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-sm bg-surface px-4 py-3 border border-border"
                      >
                        <div>
                          <div className="text-sm font-medium text-ink">
                            {item.title}
                          </div>
                          <div className="font-mono text-xs text-ink-muted">
                            {item.ago}
                          </div>
                        </div>
                        <Badge
                          variant={
                            item.urgency === "HIGH"
                              ? "error"
                              : item.urgency === "MEDIUM"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {item.urgency}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </DataState>
              </div>
            </Card>
          </section>

          {/* === Buttons & Form primitives === */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Primitives"
              title="Boutons et formulaires"
              description="6 variantes de boutons, inputs avec états d'erreur, PhoneInput multi-pays, tabs."
            />
            <Card padding="md">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button
                    variant="destructive"
                    leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                  >
                    Destructive
                  </Button>
                  <Button
                    variant="primary"
                    isLoading
                    loadingText="Envoi en cours"
                  >
                    Loading
                  </Button>
                  <Button variant="primary" disabled>
                    Disabled
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Email"
                    htmlFor="demo-email"
                    required
                    hint="Nous n'enverrons jamais de spam. Promis."
                  >
                    <Input
                      type="email"
                      placeholder="vous@exemple.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field
                    label="Email (avec erreur)"
                    htmlFor="demo-email-err"
                    error="Format invalide. Exemple : prenom@domaine.fr"
                  >
                    <Input
                      type="email"
                      defaultValue="pas-un-email"
                      hasError
                    />
                  </Field>
                </div>

                <Field
                  label="Numéro WhatsApp d'alerte"
                  htmlFor="demo-phone"
                  required
                  hint="Le numéro qui recevra les alertes urgentes 24/7."
                >
                  <PhoneInput
                    countryCode={phoneCountry}
                    onCountryCodeChange={setPhoneCountry}
                    value={phone}
                    onChange={setPhone}
                  />
                </Field>
              </div>
            </Card>
          </section>

          {/* === Tabs demo === */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Primitives"
              title="Tabs"
              description="Construits sur Radix : navigation clavier complète, aria-selected, focus visible."
            />
            <Card padding="md">
              <Tabs defaultValue="villas">
                <TabsList>
                  <TabsTrigger value="villas">
                    <Building2 className="h-3.5 w-3.5" aria-hidden />
                    Villas
                  </TabsTrigger>
                  <TabsTrigger value="alertes">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    Alertes
                  </TabsTrigger>
                  <TabsTrigger value="parametres">
                    <SettingsIcon className="h-3.5 w-3.5" aria-hidden />
                    Paramètres
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="villas">
                  <p className="text-sm text-ink-soft">
                    Liste de vos villas connectées. La gestion fine arrive en
                    Phase 3.
                  </p>
                </TabsContent>
                <TabsContent value="alertes">
                  <p className="text-sm text-ink-soft">
                    Historique des alertes envoyées sur WhatsApp. Filtrable par
                    date, urgence, catégorie.
                  </p>
                </TabsContent>
                <TabsContent value="parametres">
                  <p className="text-sm text-ink-soft">
                    Forfait, équipe, numéro WhatsApp, résiliation.
                  </p>
                </TabsContent>
              </Tabs>
            </Card>
          </section>

          {/* === Card variants === */}
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Primitives"
              title="Cards"
              description="Variantes default, featured, muted. La card featured = aubergine en gradient pour les KPIs hero."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Card par défaut</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-serif text-aubergine">
                    1 247
                  </div>
                  <CardDescription className="mt-1">
                    Messages classés cette semaine
                  </CardDescription>
                </CardContent>
              </Card>
              <Card variant="featured">
                <CardHeader className="border-b-on-aubergine/15">
                  <CardTitle className="text-on-aubergine">
                    Card featured
                  </CardTitle>
                  <Sparkles
                    className="h-4 w-4 text-powder"
                    aria-hidden
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-serif text-on-aubergine">
                    98 %
                  </div>
                  <p className="mt-1 text-sm text-on-aubergine-soft">
                    Précision de classification IA
                  </p>
                </CardContent>
              </Card>
              <Card variant="muted">
                <CardHeader>
                  <CardTitle>Card muted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-serif text-ink-soft">3</div>
                  <CardDescription className="mt-1">
                    Villas en cours de configuration
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* === Footer === */}
          <footer className="border-t border-border pt-8 pb-4">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Logo size="sm" />
              <p className="text-xs text-ink-muted">
                Phase 0 du plan — design system + composants pattern. Dev preview.
              </p>
            </div>
          </footer>
        </div>
      </AppShell>
      <Toaster />
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <div className="text-eyebrow mb-2">{eyebrow}</div>
      <h2 className="font-serif text-2xl font-medium text-ink sm:text-3xl">
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-ink-soft sm:text-base max-w-3xl">
        {description}
      </p>
    </header>
  );
}

function BadgeRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-xs font-medium text-ink-muted sm:w-56">
        {label}
      </span>
      {children}
    </div>
  );
}
