import Link from "next/link";
import { AlertTriangle, MessageCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { DISPATCH_CATEGORIES } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import type { AlertWithContext, DashboardData } from "@/lib/dashboard-data";

/**
 * Onglet Alertes du dashboard.
 *
 * Affiche l'historique des alertes envoyées (jusqu'à 100), avec filtres via URL searchParams :
 *   - ?urgency=HIGH|MEDIUM|LOW|ALL
 *   - ?category=MENAGE|PISCINE|...|ALL
 *   - ?villa=<id>|ALL
 *   - ?range=7d|30d|90d|all
 *
 * Server component — pas d'interactivité côté client (les filtres rechargent la page).
 */
export function AlertesTab({
  alerts,
  villas,
  filters,
}: {
  alerts: AlertWithContext[];
  villas: DashboardData["villas"];
  filters: {
    urgency?: string;
    category?: string;
    villa?: string;
    range?: string;
  };
}) {
  if (alerts.length === 0) {
    return <EmptyAlertsView hasAnyVilla={villas.length > 0} />;
  }

  return (
    <div className="space-y-4">
      <FiltersBar villas={villas} filters={filters} alertCount={alerts.length} />
      <ul className="space-y-3">
        {alerts.map((alert) => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
      </ul>
      {alerts.length === 100 && (
        <p className="text-center text-xs text-ink-muted py-2">
          Affichage limité aux 100 dernières alertes. Affinez les filtres pour voir
          plus loin.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Empty state (premier passage, aucune alerte encore générée)
// ─────────────────────────────────────────────────────────────────

function EmptyAlertsView({ hasAnyVilla }: { hasAnyVilla: boolean }) {
  if (!hasAnyVilla) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
        title="Aucune alerte pour l'instant"
        description="Configurez d'abord vos villas pour qu'hostelyo commence à veiller dessus. Les alertes apparaîtront ici dès qu'une urgence est détectée."
        action={
          <Button asChild size="sm">
            <Link href="/dashboard?tab=villas">Configurer mes villas</Link>
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
      title="Tout est calme"
      description="Aucune alerte n'a été déclenchée. C'est bon signe — hostelyo filtre les messages routiniers et ne vous dérange que pour les vraies urgences. Les alertes envoyées apparaîtront ici."
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Bar de filtres (links URL — server-side)
// ─────────────────────────────────────────────────────────────────

function FiltersBar({
  villas,
  filters,
  alertCount,
}: {
  villas: DashboardData["villas"];
  filters: { urgency?: string; category?: string; villa?: string; range?: string };
  alertCount: number;
}) {
  const range = filters.range ?? "30d";
  const rangeLabel: Record<string, string> = {
    "7d": "7 jours",
    "30d": "30 jours",
    "90d": "90 jours",
    all: "Tout",
  };

  return (
    <Card padding="md" className="bg-cream-warm/30">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-medium text-aubergine">
          {alertCount} alerte{alertCount > 1 ? "s" : ""} sur {rangeLabel[range]}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-ink-soft">
          <FilterGroup label="Période" current={range} paramName="range">
            <FilterLink paramName="range" value="7d" current={range} label="7j" />
            <FilterLink paramName="range" value="30d" current={range} label="30j" />
            <FilterLink paramName="range" value="90d" current={range} label="90j" />
            <FilterLink paramName="range" value="all" current={range} label="Tout" />
          </FilterGroup>

          <FilterGroup label="Urgence" current={filters.urgency ?? "ALL"} paramName="urgency">
            <FilterLink paramName="urgency" value="ALL" current={filters.urgency ?? "ALL"} label="Tout" />
            <FilterLink paramName="urgency" value="HIGH" current={filters.urgency ?? "ALL"} label="Haute" />
            <FilterLink paramName="urgency" value="MEDIUM" current={filters.urgency ?? "ALL"} label="Moyenne" />
            <FilterLink paramName="urgency" value="LOW" current={filters.urgency ?? "ALL"} label="Faible" />
          </FilterGroup>
        </div>
      </div>

      {villas.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <span className="text-eyebrow">Villa</span>
          <FilterLink paramName="villa" value="ALL" current={filters.villa ?? "ALL"} label="Toutes" />
          {villas.map((v) => (
            <FilterLink
              key={v.id}
              paramName="villa"
              value={v.id}
              current={filters.villa ?? "ALL"}
              label={v.name}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  current: string;
  paramName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <span className="text-eyebrow mr-1">{label}</span>
      <div className="inline-flex items-center gap-0.5 rounded-pill border border-border bg-surface p-0.5">
        {children}
      </div>
    </div>
  );
}

function FilterLink({
  paramName,
  value,
  current,
  label,
}: {
  paramName: string;
  value: string;
  current: string;
  label: string;
}) {
  const isActive = current === value;
  // Toujours conserver tab=alertes dans l'URL
  const search = new URLSearchParams({ tab: "alertes" });
  if (paramName !== "tab") search.set(paramName, value);
  const href = `/dashboard?${search.toString()}`;
  return (
    <Link
      href={href}
      className={
        "px-2.5 py-1 rounded-pill text-xs font-medium transition-colors " +
        (isActive
          ? "bg-aubergine text-on-aubergine"
          : "text-ink-soft hover:bg-cream-warm hover:text-ink")
      }
    >
      {label}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────
// Une ligne d'alerte
// ─────────────────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: AlertWithContext }) {
  const message = alert.message;
  const urgency = message?.urgency;
  const category = message?.category;
  const categoryLabel = category
    ? DISPATCH_CATEGORIES.find((c) => c.id === category)?.label ?? category
    : null;

  const status = alert.status;
  const statusMeta = STATUS_META[status];

  return (
    <Card padding="md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md " +
              (urgency === "HIGH"
                ? "bg-error/10 text-error"
                : urgency === "MEDIUM"
                ? "bg-gold-soft text-[#7A6432]"
                : "bg-cream-warm text-ink-soft")
            }
            aria-hidden
          >
            {urgency === "HIGH" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              <span className="text-sm font-medium text-ink">{alert.villa.name}</span>
              {urgency && (
                <Badge
                  size="sm"
                  variant={
                    urgency === "HIGH"
                      ? "error"
                      : urgency === "MEDIUM"
                      ? "warning"
                      : "neutral"
                  }
                >
                  {urgency === "HIGH"
                    ? "Urgence"
                    : urgency === "MEDIUM"
                    ? "Moyenne"
                    : "Faible"}
                </Badge>
              )}
              {categoryLabel && (
                <Badge size="sm" variant="default">
                  {categoryLabel}
                </Badge>
              )}
            </div>

            {message?.summary && (
              <p className="text-sm text-ink-soft leading-relaxed line-clamp-2">
                {message.summary}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              <span className="font-mono">
                {formatRelativeTime(alert.createdAt)}
              </span>
              <span>·</span>
              <span>
                Envoyé à <code className="font-mono">{alert.sentTo}</code>
              </span>
              {message?.fromName && (
                <>
                  <span>·</span>
                  <span>de {message.fromName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <Badge size="sm" variant={statusMeta.variant}>
            <statusMeta.icon className="h-3 w-3" aria-hidden />
            {statusMeta.label}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

const STATUS_META: Record<
  AlertWithContext["status"],
  {
    label: string;
    variant: "default" | "success" | "warning" | "error" | "neutral";
    icon: typeof CheckCircle2;
  }
> = {
  QUEUED: { label: "En file", variant: "neutral", icon: Clock },
  SENT: { label: "Envoyée", variant: "success", icon: CheckCircle2 },
  DELIVERED: { label: "Reçue", variant: "success", icon: CheckCircle2 },
  READ: { label: "Lue", variant: "success", icon: CheckCircle2 },
  ACKED: { label: "Confirmée", variant: "success", icon: CheckCircle2 },
  FAILED: { label: "Échec", variant: "error", icon: XCircle },
};
