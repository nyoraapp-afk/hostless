import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/onboarding/state
 *
 * Retourne l'état actuel de l'onboarding du user, lu depuis la DB.
 * Utilisé par les pages /onboarding/* pour pré-remplir avec les vraies données
 * quand un user revient (au lieu de remontrer les villas mock).
 *
 * Si pas de villas en DB → la page affiche les villas mock (1er passage).
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const userId = session.user.id;

  const [villas, whatsapp, intervenants, dispatchRules, subscription] =
    await Promise.all([
      prisma.villa.findMany({
        where: { userId, deletedAt: null },
        select: { id: true, name: true, airbnbId: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.whatsAppNumber.findFirst({
        where: { userId, status: { in: ["VERIFIED", "PENDING_VERIFICATION"] } },
        orderBy: { createdAt: "desc" },
        select: { e164: true, status: true },
      }),
      prisma.intervenant.findMany({
        where: { userId },
        select: { id: true, name: true, phoneE164: true },
      }),
      prisma.dispatchRule.findMany({
        where: { userId },
        select: { category: true, intervenantId: true },
      }),
      prisma.subscription.findUnique({
        where: { userId },
        include: { plan: { select: { slug: true } } },
      }),
    ]);

  // Construit le map team : { MENAGE: { name, e164 }, ... }
  const intervenantById = new Map(intervenants.map((i) => [i.id, i]));
  const team: Record<string, { name: string; e164: string }> = {};
  for (const rule of dispatchRules) {
    const i = intervenantById.get(rule.intervenantId);
    if (i) {
      team[rule.category] = { name: i.name, e164: i.phoneE164 };
    }
  }

  return NextResponse.json({
    hasExistingData: villas.length > 0 || !!whatsapp || !!subscription,
    villas: villas.map((v) => ({
      id: v.id,
      name: v.name,
      airbnbId: v.airbnbId,
    })),
    whatsapp: whatsapp
      ? { e164: whatsapp.e164, verified: whatsapp.status === "VERIFIED" }
      : null,
    plan: subscription?.plan.slug ?? null,
    team,
  });
}
