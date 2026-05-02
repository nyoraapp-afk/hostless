import "server-only";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

/**
 * Helper Gmail API.
 *
 * - Récupère le refresh_token Google stocké dans Account (PrismaAdapter Auth.js)
 * - Refresh le access_token automatiquement
 * - Liste les emails Airbnb depuis lastSyncAt (ou les 90 derniers jours au 1er run)
 * - Parse le sujet, le corps texte, l'expéditeur
 *
 * Ne stocke RIEN — c'est l'appelant (Inngest function poll-gmail) qui décide
 * quoi faire des messages retournés.
 */

const AIRBNB_FROM_PATTERNS = [
  "automated@airbnb.com",
  "noreply@airbnb.com",
  "express@airbnb.com",
  "@airbnb.com", // fallback
];

export type ParsedAirbnbEmail = {
  gmailId: string;
  threadId: string;
  receivedAt: Date;
  fromName: string | null;
  fromAddress: string | null;
  subject: string | null;
  body: string;
};

/**
 * Récupère un client Gmail authentifié pour un user donné.
 * Lance une erreur si le user n'a pas connecté Google ou si le refresh_token est invalide.
 */
export async function getGmailClientForUser(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account?.refresh_token) {
    throw new Error(
      `User ${userId} : aucun refresh_token Google (l'utilisateur doit se reconnecter).`
    );
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );

  oauth2.setCredentials({
    refresh_token: account.refresh_token,
    access_token: account.access_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Si access_token expiré, oauth2 va le refresh automatiquement.
  // On capture le nouveau token pour le persister en DB pour la prochaine run.
  oauth2.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.account
        .update({
          where: { id: account.id },
          data: {
            access_token: tokens.access_token,
            expires_at: tokens.expiry_date
              ? Math.floor(tokens.expiry_date / 1000)
              : null,
          },
        })
        .catch((e) => console.error("[gmail] failed to persist refreshed token:", e));
    }
  });

  return google.gmail({ version: "v1", auth: oauth2 });
}

/**
 * Liste les emails Airbnb reçus depuis `since` (ou 90 jours par défaut).
 * Limite à 50 par run pour éviter de saturer en cas de gros backlog.
 */
export async function listAirbnbEmailsSince(
  userId: string,
  since: Date | null
): Promise<ParsedAirbnbEmail[]> {
  const gmail = await getGmailClientForUser(userId);

  const sinceDate = since ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  // Gmail q syntax : after:YYYY/MM/DD est inclusif, on prend 1 jour avant pour pas rater
  const sinceQuery = `after:${formatGmailDate(new Date(sinceDate.getTime() - 24 * 60 * 60 * 1000))}`;
  const fromQuery = "(from:airbnb.com OR from:airbnb.fr OR from:airbnb.co.uk)";
  const q = `${fromQuery} ${sinceQuery}`;

  const { data: list } = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults: 50,
  });
  if (!list.messages || list.messages.length === 0) return [];

  // Pour chaque ID, fetch le message complet (avec full payload)
  const detailed = await Promise.all(
    list.messages.map(async (m) => {
      try {
        const { data: msg } = await gmail.users.messages.get({
          userId: "me",
          id: m.id!,
          format: "full",
        });
        return parseAirbnbEmail(msg);
      } catch (err) {
        console.warn(`[gmail] failed to fetch ${m.id}:`, err);
        return null;
      }
    })
  );

  // Filtre encore par expéditeur (au cas où le q catch trop large)
  return detailed.filter((m): m is ParsedAirbnbEmail => {
    if (!m) return false;
    const from = m.fromAddress?.toLowerCase() ?? "";
    return AIRBNB_FROM_PATTERNS.some((p) => from.includes(p));
  });
}

// ─────────────────────────────────────────────────────────────────
// Parsing helpers
// ─────────────────────────────────────────────────────────────────

function parseAirbnbEmail(
  msg: import("googleapis").gmail_v1.Schema$Message
): ParsedAirbnbEmail | null {
  if (!msg.id || !msg.threadId) return null;

  const headers = msg.payload?.headers ?? [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? null;

  const subject = getHeader("Subject");
  const fromRaw = getHeader("From");
  const dateRaw = getHeader("Date");

  const { name: fromName, address: fromAddress } = parseFromHeader(fromRaw);

  const body = extractBodyText(msg.payload);
  if (!body) return null;

  const receivedAt = dateRaw ? new Date(dateRaw) : new Date(parseInt(msg.internalDate ?? "0"));

  return {
    gmailId: msg.id,
    threadId: msg.threadId,
    receivedAt,
    fromName,
    fromAddress,
    subject,
    body,
  };
}

function parseFromHeader(raw: string | null) {
  if (!raw) return { name: null, address: null };
  // Formats possibles : "Name <email>", "email", "<email>"
  const match = raw.match(/^"?([^"<]+?)"?\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), address: match[2].trim() };
  if (raw.includes("@")) return { name: null, address: raw.trim() };
  return { name: raw.trim(), address: null };
}

function extractBodyText(
  payload: import("googleapis").gmail_v1.Schema$MessagePart | undefined
): string {
  if (!payload) return "";

  // Si le message est text/plain direct
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Si multipart, on cherche le text/plain en premier, sinon text/html nettoyé
  if (payload.parts) {
    const plain = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);

    const html = payload.parts.find((p) => p.mimeType === "text/html");
    if (html?.body?.data) return stripHtml(decodeBase64Url(html.body.data));

    // Multipart imbriqué — récursion sur les parts
    for (const part of payload.parts) {
      const inner = extractBodyText(part);
      if (inner) return inner;
    }
  }

  return "";
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function formatGmailDate(d: Date): string {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}
