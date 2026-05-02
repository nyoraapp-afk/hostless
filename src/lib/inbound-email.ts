import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Parser Resend Inbound webhook + helpers pour l'option 2 d'inscription (forwarding).
 *
 * Resend Inbound envoie un POST JSON quand un email arrive sur un alias
 * configuré (`*@in.hostelyo.com`). On parse, on identifie le user via l'alias
 * destinataire, on persiste le Message en DB.
 *
 * Doc Resend : https://resend.com/docs/dashboard/webhooks/event-types
 */

// ─────────────────────────────────────────────────────────────────
// Types & schemas
// ─────────────────────────────────────────────────────────────────

const InboundEmailPayloadSchema = z.object({
  type: z.literal("inbound.email.delivered"),
  created_at: z.string(),
  data: z.object({
    /** Identifiant unique Resend du message (header Message-ID). */
    message_id: z.string(),
    /** Adresse email de l'expéditeur. */
    from: z.string(),
    /** Nom de l'expéditeur (extrait du header From). */
    from_name: z.string().nullable().optional(),
    /** Liste des destinataires (notre alias dedans). */
    to: z.array(z.string()),
    /** Sujet du message. */
    subject: z.string().nullable().optional(),
    /** Corps texte (préféré) si dispo. */
    text: z.string().nullable().optional(),
    /** Corps HTML si pas de text. */
    html: z.string().nullable().optional(),
  }),
});

export type ParsedInboundEmail = {
  resendMessageId: string;
  recipientAlias: string;
  fromAddress: string;
  fromName: string | null;
  subject: string | null;
  body: string;
  receivedAt: Date;
};

// ─────────────────────────────────────────────────────────────────
// Signature verification
// ─────────────────────────────────────────────────────────────────

/**
 * Vérifie la signature Resend d'un webhook (HMAC SHA-256 du body avec le secret).
 *
 * Resend signe avec le header `svix-signature` (Resend utilise Svix sous le capot).
 * Format : `v1,<base64hmac>` — possiblement plusieurs séparés par des espaces.
 */
export function verifyResendSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  svixId: string | null,
  svixTimestamp: string | null
): boolean {
  if (!signatureHeader || !svixId || !svixTimestamp) return false;

  // Tolérance de 5 min sur le timestamp pour éviter les replays
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(svixTimestamp, 10);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > 5 * 60) return false;

  // Décode le secret (peut être base64 préfixé "whsec_")
  const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(cleanSecret, "base64");

  // Payload signé : `<svix-id>.<svix-timestamp>.<rawBody>`
  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expectedSig = createHmac("sha256", secretBytes)
    .update(signedPayload)
    .digest("base64");

  // Le header peut contenir plusieurs signatures `v1,sig v1,sig2`
  const sigs = signatureHeader.split(" ").map((s) => s.split(",")[1]?.trim()).filter(Boolean);

  for (const sig of sigs) {
    try {
      const sigBuf = Buffer.from(sig, "base64");
      const expBuf = Buffer.from(expectedSig, "base64");
      if (sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)) {
        return true;
      }
    } catch {
      // Continue avec la suivante
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────────────────────────

/**
 * Parse un payload Resend Inbound webhook validé. Retourne null si payload invalide.
 *
 * @param rawBody Le body brut (string JSON) du webhook.
 * @param expectedDomain Le domaine attendu pour le destinataire (ex: "in.hostelyo.com").
 *                       Si fourni, on filtre les recipients pour ne garder que ceux du domaine.
 */
export function parseInboundEmail(
  rawBody: string,
  expectedDomain?: string
): ParsedInboundEmail | null {
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return null;
  }

  const parsed = InboundEmailPayloadSchema.safeParse(json);
  if (!parsed.success) return null;

  const { data } = parsed.data;

  // Trouve le destinataire qui correspond à notre domaine
  const recipientAlias = expectedDomain
    ? data.to.find((r) => r.toLowerCase().endsWith(`@${expectedDomain.toLowerCase()}`))
    : data.to[0];
  if (!recipientAlias) return null;

  // Extrait le corps texte (préféré) ou strip HTML en fallback
  const body = data.text?.trim() || (data.html ? stripHtml(data.html) : "");
  if (!body) return null;

  return {
    resendMessageId: data.message_id,
    recipientAlias: recipientAlias.toLowerCase(),
    fromAddress: data.from.toLowerCase(),
    fromName: data.from_name ?? null,
    subject: data.subject ?? null,
    body,
    receivedAt: new Date(parsed.data.created_at),
  };
}

// ─────────────────────────────────────────────────────────────────
// Identification user via alias
// ─────────────────────────────────────────────────────────────────

/**
 * Trouve le User correspondant à un alias inbound (ex: "jadeapavou-x7k2@in.hostelyo.com").
 * Retourne null si aucun match — l'email sera ignoré (pas de fuite de données).
 */
export async function findUserByInboundAlias(alias: string) {
  return prisma.user.findUnique({
    where: { inboundAlias: alias.toLowerCase() },
    select: { id: true, email: true, locale: true },
  });
}

// ─────────────────────────────────────────────────────────────────
// Génération d'alias
// ─────────────────────────────────────────────────────────────────

/**
 * Génère un alias unique à partir d'un email + un suffixe aléatoire pour éviter les collisions.
 * Ex: "jade.lapavou@gmail.com" → "jadelapavou-x7k2"
 *
 * Le domaine est ajouté côté appelant (typiquement `in.hostelyo.com`).
 */
export function generateAliasSlug(emailOrName: string): string {
  // Garde lettres + chiffres, retire tout le reste
  const base = emailOrName
    .split("@")[0]
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // retire accents
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 18);

  // Suffixe aléatoire 4 chars (62^4 = ~14M combinaisons → collision improbable)
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return base ? `${base}-${suffix}` : `host-${suffix}`;
}

/**
 * Le domaine de réception inbound, configurable via env.
 * En prod : `in.hostelyo.com`. En dev local : valeur de fallback pour les tests.
 */
export function getInboundDomain(): string {
  return process.env.INBOUND_EMAIL_DOMAIN ?? "in.hostelyo.com";
}

// ─────────────────────────────────────────────────────────────────
// HTML stripping (réutilisé de gmail.ts avec améliorations)
// ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
