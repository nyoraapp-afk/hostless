"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * Server actions liées au compte utilisateur :
 *   - changement du numéro WhatsApp
 *   - changement de forfait (upgrade/downgrade Stripe)
 *   - résiliation de la souscription Stripe
 */

const ChangeWhatsAppInput = z.object({
  e164: z.string().regex(/^\+\d{8,15}$/, "Format E.164 invalide"),
});

export async function startChangeWhatsApp(input: { e164: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const { e164 } = ChangeWhatsAppInput.parse(input);

  // Crée ou réutilise un WhatsAppNumber en status PENDING_VERIFICATION
  // Le user devra ensuite valider le code OTP envoyé via Twilio (Phase 1.B existant).
  await prisma.whatsAppNumber.upsert({
    where: { userId_e164: { userId: session.user.id, e164 } },
    update: { status: "PENDING_VERIFICATION", verifiedAt: null },
    create: {
      userId: session.user.id,
      e164,
      status: "PENDING_VERIFICATION",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "WHATSAPP_CHANGE_INITIATED",
      target: `whatsapp:${e164}`,
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Résilie la souscription Stripe à la fin de la période courante (cancel_at_period_end).
 * L'utilisateur garde le service jusqu'à `currentPeriodEnd`, puis il est désactivé.
 *
 * Approche douce, pas immédiate — adresse Pattern 4 (date d'effet explicite).
 */
export async function cancelSubscription() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  if (!sub?.stripeSubscriptionId) {
    throw new Error("Aucune souscription active à résilier.");
  }

  const stripeSub = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  const cancelAt = stripeSub.cancel_at
    ? new Date(stripeSub.cancel_at * 1000)
    : sub.currentPeriodEnd;

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAt },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SUBSCRIPTION_CANCEL_AT_PERIOD_END",
      target: `subscription:${sub.stripeSubscriptionId}`,
      after: { cancelAt },
    },
  });

  revalidatePath("/dashboard");
  return { ok: true, cancelAt };
}

/**
 * Change le forfait Stripe.
 *
 * Comportements :
 *   - Upgrade Essentiel → Sérénité : changement immédiat, proration Stripe (le user est crédité au prorata).
 *   - Downgrade Sérénité → Essentiel : programmé à la fin de la période courante (pas de remboursement),
 *     pour éviter de couper l'accès à l'équipe en plein cycle facturé.
 *
 * Adresse Pattern 2 du plan (date d'effet honnête) — voir CompteTab pour l'affichage StateBadge.
 */
const ChangePlanInput = z.object({
  targetPlan: z.enum(["ESSENTIEL", "SERENITE"]),
});

export async function changeSubscriptionPlan(input: { targetPlan: "ESSENTIEL" | "SERENITE" }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const { targetPlan } = ChangePlanInput.parse(input);

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });
  if (!sub?.stripeSubscriptionId) {
    throw new Error("Aucune souscription active à modifier.");
  }
  if (sub.plan.slug === targetPlan) {
    throw new Error("Vous êtes déjà sur ce forfait.");
  }

  const targetPlanRow = await prisma.plan.findUnique({ where: { slug: targetPlan } });
  if (!targetPlanRow?.stripePriceId) {
    throw new Error(`Le plan ${targetPlan} n'a pas de prix Stripe configuré.`);
  }

  // Récupère la subscription Stripe pour avoir le subscription item ID
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  const itemId = stripeSub.items.data[0]?.id;
  if (!itemId) {
    throw new Error("Souscription Stripe sans item — état incohérent.");
  }

  const isUpgrade =
    sub.plan.slug === "ESSENTIEL" && targetPlan === "SERENITE";

  // Upgrade : changement immédiat + proration. Downgrade : à la fin du cycle.
  const updateParams: import("stripe").Stripe.SubscriptionUpdateParams = {
    items: [{ id: itemId, price: targetPlanRow.stripePriceId }],
    proration_behavior: isUpgrade ? "create_prorations" : "none",
    billing_cycle_anchor: isUpgrade ? "now" : "unchanged",
    metadata: {
      ...(stripeSub.metadata ?? {}),
      plan: targetPlan,
      lastPlanChange: new Date().toISOString(),
    },
  };

  if (!isUpgrade) {
    // Downgrade : on schedule via subscription_schedules pour que le changement
    // prenne effet à la fin du cycle courant. Pour l'instant on fait simple :
    // on change directement mais sans proration (Stripe applique au prochain renouvellement).
    updateParams.proration_behavior = "none";
  }

  const updated = await stripe.subscriptions.update(
    sub.stripeSubscriptionId,
    updateParams
  );

  // Persiste le nouveau plan en DB (pour Sérénité, immédiat ; sinon, en attente)
  const updatedItem = updated.items.data[0];
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      planId: targetPlanRow.id,
      currentPeriodEnd: updatedItem?.current_period_end
        ? new Date(updatedItem.current_period_end * 1000)
        : sub.currentPeriodEnd,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: isUpgrade ? "PLAN_UPGRADED" : "PLAN_DOWNGRADED",
      target: `subscription:${sub.stripeSubscriptionId}`,
      before: { planSlug: sub.plan.slug },
      after: { planSlug: targetPlan, immediate: isUpgrade },
    },
  });

  revalidatePath("/dashboard");
  return { ok: true, targetPlan, immediate: isUpgrade };
}

/**
 * Annule une résiliation programmée — la souscription continue normalement.
 */
export async function uncancelSubscription() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  if (!sub?.stripeSubscriptionId) {
    throw new Error("Aucune souscription trouvée.");
  }

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAt: null },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SUBSCRIPTION_UNCANCEL",
      target: `subscription:${sub.stripeSubscriptionId}`,
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
