import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import {
  parseInboundEmail,
  findUserByInboundAlias,
  verifyResendSignature,
  getInboundDomain,
} from "@/lib/inbound-email";

/**
 * POST /api/inbound
 *
 * Webhook Resend Inbound — appelé à chaque email reçu sur `*@in.hostelyo.com`.
 *
 * Pipeline :
 *   1. Vérifie la signature Resend (svix) — sinon 401
 *   2. Parse le payload (sender, recipient alias, body, etc.)
 *   3. Identifie le User via l'alias destinataire — sinon 404 silencieux
 *   4. Filtre : seuls les emails Airbnb sont gardés (anti-spam, anti-fuite)
 *   5. Crée un Message en DB (idempotent par resendMessageId)
 *   6. Émet event Inngest "email/inbound.received" → classify + dispatch
 *   7. Retourne 200 ack à Resend
 *
 * Note : on retourne 200 même quand on ignore (user inconnu, pas Airbnb)
 * pour ne pas que Resend retry indéfiniment.
 */

const AIRBNB_FROM_PATTERNS = [
  "airbnb.com",
  "airbnb.fr",
  "airbnb.co.uk",
  "airbnb.it",
  "airbnb.de",
  "airbnb.es",
];

export async function POST(req: Request) {
  // 1) Lecture du raw body (nécessaire pour vérification de signature)
  const rawBody = await req.text();

  const sigHeader = req.headers.get("svix-signature");
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;

  // 2) Vérif de signature (sauf en dev local sans secret configuré — on log un warning)
  if (secret) {
    const valid = verifyResendSignature(rawBody, sigHeader, secret, svixId, svixTimestamp);
    if (!valid) {
      console.warn("[inbound] signature invalide", { svixId, sigHeader });
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[inbound] RESEND_INBOUND_WEBHOOK_SECRET manquant en prod");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  } else {
    console.warn("[inbound] DEV mode : pas de signature check (secret manquant)");
  }

  // 3) Parse le payload
  const parsed = parseInboundEmail(rawBody, getInboundDomain());
  if (!parsed) {
    return NextResponse.json({ ok: true, ignored: "payload invalide ou body vide" });
  }

  // 4) Filtre : on ne traite QUE les emails venant d'Airbnb (sécurité + utilité)
  const isAirbnb = AIRBNB_FROM_PATTERNS.some((d) =>
    parsed.fromAddress.endsWith(`@${d}`) || parsed.fromAddress.includes(`.${d}`)
  );
  if (!isAirbnb) {
    return NextResponse.json({
      ok: true,
      ignored: "expéditeur non-Airbnb",
      from: parsed.fromAddress,
    });
  }

  // 5) Identifie le User propriétaire de l'alias
  const user = await findUserByInboundAlias(parsed.recipientAlias);
  if (!user) {
    console.warn(`[inbound] alias inconnu : ${parsed.recipientAlias}`);
    return NextResponse.json({ ok: true, ignored: "alias inconnu" });
  }

  // 6) Trouve la villa correspondante via airbnbId présent dans le sujet ou body
  const villas = await prisma.villa.findMany({
    where: { userId: user.id, status: "ACTIVE", deletedAt: null },
    select: { id: true, airbnbId: true, name: true },
  });
  const matchedVilla = villas.find(
    (v) =>
      v.airbnbId &&
      (parsed.subject?.includes(v.airbnbId) || parsed.body.includes(v.airbnbId))
  );

  if (!matchedVilla) {
    // Pas de match airbnbId → on stocke quand même le message orphelin pour audit/log
    // mais on ne déclenche pas de classification
    console.warn(
      `[inbound] aucune villa matchée pour user ${user.id}, alias ${parsed.recipientAlias}`
    );
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "INBOUND_EMAIL_NO_VILLA_MATCH",
        target: `email:${parsed.resendMessageId}`,
        after: {
          from: parsed.fromAddress,
          subject: parsed.subject,
          alias: parsed.recipientAlias,
        },
      },
    });
    return NextResponse.json({ ok: true, ignored: "no villa match" });
  }

  // 7) Idempotence : skip si message déjà inséré (par Resend message_id)
  const existing = await prisma.message.findFirst({
    where: { villaId: matchedVilla.id, airbnbThreadId: parsed.resendMessageId },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // 8) Crée le Message
  const message = await prisma.message.create({
    data: {
      villaId: matchedVilla.id,
      airbnbThreadId: parsed.resendMessageId,
      fromName: parsed.fromName,
      fromAddress: parsed.fromAddress,
      body: parsed.body,
      receivedAt: parsed.receivedAt,
    },
  });

  // 9) Émet l'event Inngest pour déclencher la classification + dispatch
  // (réutilise la même chaîne que le path OAuth via "message/created")
  await inngest.send({
    name: "message/created",
    data: { messageId: message.id, villaId: matchedVilla.id, userId: user.id },
  });

  return NextResponse.json({
    ok: true,
    messageId: message.id,
    villa: matchedVilla.name,
  });
}
