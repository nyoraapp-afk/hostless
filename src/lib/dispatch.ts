import "server-only";
import { prisma } from "@/lib/prisma";
import { twilio, TWILIO_WHATSAPP_FROM } from "@/lib/twilio";
import type { DispatchCategory } from "@/lib/types";

/**
 * Logique de dispatch des alertes WhatsApp.
 *
 * Selon le plan de l'utilisateur :
 *   - ESSENTIEL : alerte → uniquement à l'hôte
 *   - SERENITE : alerte → intervenant correspondant à la catégorie (via VillaException > DispatchRule)
 *                + copie à l'hôte ("Récap envoyé à vous" du proto)
 *
 * Si SERENITE mais aucun intervenant n'est configuré pour la catégorie,
 * fallback à l'hôte directement.
 */

type DispatchInput = {
  userId: string;
  villaId: string;
  villaName: string;
  category: DispatchCategory;
  summary: string;
  guestName?: string | null;
};

type DispatchTarget = {
  e164: string;
  role: "host" | "intervenant";
  intervenantName?: string;
};

/**
 * Résout les destinataires d'une alerte selon le plan + les règles de dispatch.
 */
async function resolveTargets(input: DispatchInput): Promise<DispatchTarget[]> {
  // 1) Hôte WhatsApp
  const whatsapp = await prisma.whatsAppNumber.findFirst({
    where: { userId: input.userId, status: "VERIFIED" },
    orderBy: { verifiedAt: "desc" },
  });
  const hostTarget: DispatchTarget | null = whatsapp
    ? { e164: whatsapp.e164, role: "host" }
    : null;

  // 2) Plan de l'utilisateur
  const subscription = await prisma.subscription.findUnique({
    where: { userId: input.userId },
    include: { plan: true },
  });
  const planSlug = subscription?.plan.slug;

  // ESSENTIEL → hôte uniquement
  if (planSlug !== "SERENITE") {
    return hostTarget ? [hostTarget] : [];
  }

  // SERENITE → exception villa > règle globale > fallback hôte
  const exception = await prisma.villaException.findUnique({
    where: { villaId_category: { villaId: input.villaId, category: input.category } },
    include: { intervenant: true },
  });
  let intervenantTarget: DispatchTarget | null = null;
  if (exception?.intervenant) {
    intervenantTarget = {
      e164: exception.intervenant.phoneE164,
      role: "intervenant",
      intervenantName: exception.intervenant.name,
    };
  } else {
    const rule = await prisma.dispatchRule.findUnique({
      where: { userId_category: { userId: input.userId, category: input.category } },
      include: { intervenant: true },
    });
    if (rule?.intervenant) {
      intervenantTarget = {
        e164: rule.intervenant.phoneE164,
        role: "intervenant",
        intervenantName: rule.intervenant.name,
      };
    }
  }

  if (intervenantTarget && hostTarget) {
    // Sérénité standard : intervenant + hôte en copie
    return [intervenantTarget, hostTarget];
  }
  if (intervenantTarget) return [intervenantTarget];
  if (hostTarget) return [hostTarget];
  return [];
}

/**
 * Construit le message WhatsApp selon le rôle du destinataire.
 */
function formatMessage(input: DispatchInput, target: DispatchTarget): string {
  if (target.role === "intervenant") {
    return `Bonjour ${target.intervenantName ?? ""}.

Signalement à ${input.villaName}.

${input.summary}

Pouvez-vous intervenir dans les meilleurs délais ?

— hostelyo`;
  }
  // host
  return `*Alerte hostelyo · ${input.villaName}*

${input.summary}

Catégorie : ${input.category.toLowerCase()}
${input.guestName ? `\nVoyageur : ${input.guestName}` : ""}

Connectez-vous à votre dashboard pour plus de détails.`;
}

/**
 * Envoie l'alerte WhatsApp via Twilio + log dans la table Alert.
 *
 * Idempotence : on crée 1 row Alert par envoi (un message peut générer plusieurs Alert
 * si Sérénité = intervenant + hôte).
 */
export async function dispatchAlert(messageId: string): Promise<{ count: number }> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      villa: { select: { id: true, name: true, userId: true } },
    },
  });

  if (!message) throw new Error(`Message ${messageId} introuvable`);
  if (!message.urgency || !message.category) {
    console.warn(`[dispatch] message ${messageId} non classifié, skip`);
    return { count: 0 };
  }

  const input: DispatchInput = {
    userId: message.villa.userId,
    villaId: message.villa.id,
    villaName: message.villa.name,
    category: message.category,
    summary: message.summary ?? message.body.slice(0, 200),
    guestName: message.fromName,
  };

  const targets = await resolveTargets(input);
  if (targets.length === 0) {
    console.warn(`[dispatch] aucun destinataire pour message ${messageId}`);
    return { count: 0 };
  }

  let sent = 0;
  for (const target of targets) {
    const body = formatMessage(input, target);
    try {
      const twilioMsg = await twilio.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${target.e164}`,
        body,
      });
      await prisma.alert.create({
        data: {
          messageId: message.id,
          villaId: message.villa.id,
          channel: "WHATSAPP",
          sentTo: target.e164,
          status: "SENT",
          externalId: twilioMsg.sid,
          sentAt: new Date(),
        },
      });
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[dispatch] échec envoi à ${target.e164}:`, message);
      await prisma.alert.create({
        data: {
          messageId,
          villaId: input.villaId,
          channel: "WHATSAPP",
          sentTo: target.e164,
          status: "FAILED",
          errorMsg: message,
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: "ALERT_DISPATCHED",
      target: `message:${messageId}`,
      after: { sent, totalTargets: targets.length, urgency: message.urgency, category: input.category },
    },
  });

  return { count: sent };
}
