import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Charge toutes les données nécessaires pour le dashboard utilisateur.
 *
 * Utilisé par /dashboard et ses 4 onglets (Villas, Alertes, Équipe, Compte).
 *
 * Une seule fonction = un seul round-trip global, et garantie que tous les onglets
 * voient la même version cohérente des données (vs. fetch indépendants par tab).
 */

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(userId: string) {
  const [user, villas, intervenants, dispatchRules, whatsapp, subscription, allPlans] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          locale: true,
          role: true,
          stripeCustomerId: true,
          createdAt: true,
        },
      }),
      prisma.villa.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          airbnbId: true,
          city: true,
          country: true,
          status: true,
          createdAt: true,
          _count: { select: { alerts: true, reservations: true } },
        },
      }),
      prisma.intervenant.findMany({
        where: { userId },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          phoneE164: true,
          notes: true,
          createdAt: true,
        },
      }),
      prisma.dispatchRule.findMany({
        where: { userId },
        select: {
          id: true,
          category: true,
          intervenantId: true,
        },
      }),
      prisma.whatsAppNumber.findFirst({
        where: { userId, status: { not: "EXPIRED" } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          e164: true,
          status: true,
          verifiedAt: true,
        },
      }),
      prisma.subscription.findUnique({
        where: { userId },
        include: {
          plan: { select: { slug: true, label: true, priceMonthly: true } },
        },
      }),
      prisma.plan.findMany({
        orderBy: { priceMonthly: "asc" },
        select: {
          id: true,
          slug: true,
          label: true,
          priceMonthly: true,
          stripePriceId: true,
        },
      }),
    ]);

  // Construit un map intervenantId → DispatchCategory pour affichage rapide
  const rulesByIntervenantId = new Map<string, string[]>();
  for (const rule of dispatchRules) {
    const list = rulesByIntervenantId.get(rule.intervenantId) ?? [];
    list.push(rule.category);
    rulesByIntervenantId.set(rule.intervenantId, list);
  }

  // Catégories non couvertes (utile pour Pattern 9 §9 du récap UX)
  const allCategories = ["MENAGE", "PISCINE", "JARDIN", "MAINTENANCE", "ACCUEIL", "AUTRE"] as const;
  const coveredCategories = new Set(dispatchRules.map((r) => r.category));
  const uncoveredCategories = allCategories.filter((c) => !coveredCategories.has(c));

  return {
    user,
    villas,
    intervenants: intervenants.map((i) => ({
      ...i,
      categories: rulesByIntervenantId.get(i.id) ?? [],
    })),
    dispatchRules,
    uncoveredCategories,
    whatsapp,
    subscription,
    plans: allPlans,
  };
}

// =============================================================================
// Alertes — chargement séparé (Phase 4 dashboard)
// =============================================================================

export type AlertFilters = {
  urgency?: "HIGH" | "MEDIUM" | "LOW" | "ALL";
  category?:
    | "MENAGE"
    | "PISCINE"
    | "JARDIN"
    | "MAINTENANCE"
    | "ACCUEIL"
    | "AUTRE"
    | "ALL";
  villaId?: string | "ALL";
  /** "7d" / "30d" / "90d" — fenêtre temporelle. Défaut "30d". */
  range?: "7d" | "30d" | "90d" | "all";
};

export type AlertWithContext = Awaited<ReturnType<typeof getAlertsForUser>>[number];

/**
 * Charge les alertes du user avec filtres optionnels.
 *
 * Joins :
 *   - Message (pour avoir summary, urgency, category, suggestedReply)
 *   - Villa (pour le nom)
 *
 * Limit dur à 100 pour ne pas saturer l'UI sans pagination (suffisant pour MVP).
 */
export async function getAlertsForUser(userId: string, filters: AlertFilters = {}) {
  const range = filters.range ?? "30d";
  const since = (() => {
    if (range === "all") return undefined;
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  })();

  const alerts = await prisma.alert.findMany({
    where: {
      villa: { userId },
      ...(since ? { createdAt: { gte: since } } : {}),
      ...(filters.villaId && filters.villaId !== "ALL"
        ? { villaId: filters.villaId }
        : {}),
      message: {
        ...(filters.urgency && filters.urgency !== "ALL"
          ? { urgency: filters.urgency }
          : {}),
        ...(filters.category && filters.category !== "ALL"
          ? { category: filters.category }
          : {}),
      },
    },
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      villa: { select: { id: true, name: true } },
      message: {
        select: {
          id: true,
          urgency: true,
          category: true,
          summary: true,
          fromName: true,
          receivedAt: true,
        },
      },
    },
  });

  return alerts;
}

