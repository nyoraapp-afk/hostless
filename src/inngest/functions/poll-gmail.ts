import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { listAirbnbEmailsSince } from "@/lib/gmail";
import { extractListingsFromEmail } from "@/lib/airbnb-extract";

/**
 * Cron : émet un événement gmail/poll.requested pour chaque user
 * dont l'EmailAccount est CONNECTED.
 *
 * Fréquence : toutes les minutes (Inngest minimum cron).
 */
export const pollGmailFanOut = inngest.createFunction(
  {
    id: "poll-gmail-fan-out",
    name: "Cron · poll Gmail (fan out aux users)",
    triggers: [{ cron: "* * * * *" }], // toutes les minutes
  },
  async ({ step }) => {
    const accounts = await step.run("list-active-accounts", async () =>
      prisma.emailAccount.findMany({
        where: {
          provider: "GMAIL",
          status: { in: ["CONNECTED", "PENDING_INITIAL"] },
        },
        select: { id: true, userId: true },
      })
    );

    if (accounts.length === 0) return { fanned: 0 };

    await step.sendEvent(
      "fan-out-poll-events",
      accounts.map((a) => ({
        name: "gmail/poll.requested",
        data: { userId: a.userId, emailAccountId: a.id },
      }))
    );

    return { fanned: accounts.length };
  }
);

/**
 * Poll Gmail pour un user spécifique.
 *
 * Comportement :
 *   - List emails Airbnb depuis lastSyncAt
 *   - Pour chaque email, extrait les listing IDs Airbnb (via airbnb-extract)
 *   - Si la villa correspondante existe → INSERT Message dessus
 *   - Si la villa n'existe pas encore → CRÉE la villa automatiquement, puis INSERT Message
 *     (= détection continue de nouvelles villas après l'inscription initiale)
 *   - Émet "message/created" pour déclencher la classification IA
 *   - Update lastSyncAt
 */
export const pollGmailForUser = inngest.createFunction(
  {
    id: "poll-gmail-for-user",
    name: "Poll Gmail pour un user (fetch + insert messages + auto-create villas)",
    triggers: [{ event: "gmail/poll.requested" }],
    concurrency: { key: "event.data.userId", limit: 1 },
  },
  async ({ event, step }) => {
    const { userId, emailAccountId } = event.data as {
      userId: string;
      emailAccountId: string;
    };

    const account = await step.run("get-account", async () =>
      prisma.emailAccount.findUnique({ where: { id: emailAccountId } })
    );
    if (!account) return { reason: "account-not-found" };

    const messages = await step.run("fetch-airbnb-messages", async () => {
      try {
        // step.run sérialise account → lastSyncAt devient string. Reconvertit en Date.
        const since = account.lastSyncAt ? new Date(account.lastSyncAt) : null;
        return await listAirbnbEmailsSince(userId, since);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await prisma.emailAccount.update({
          where: { id: emailAccountId },
          data: { status: "ERROR", lastError: msg },
        });
        throw err;
      }
    });

    if (messages.length === 0) {
      await step.run("update-last-sync", async () =>
        prisma.emailAccount.update({
          where: { id: emailAccountId },
          data: { lastSyncAt: new Date(), status: "CONNECTED", lastError: null },
        })
      );
      return { fetched: 0 };
    }

    type CreatedMsg = { id: string; villaId: string };
    type CreatedVilla = { id: string; airbnbId: string; name: string };

    const result = await step.run("insert-messages-and-villas", async () => {
      // Cache local : airbnbId → villaId, pour éviter de re-fetch ou re-créer pendant cette session
      const villasByAirbnbId = new Map<string, string>();
      const newVillas: CreatedVilla[] = [];
      const created: CreatedMsg[] = [];

      // Pré-charge toutes les villas existantes de l'user (avec airbnbId)
      const existingVillas = await prisma.villa.findMany({
        where: { userId, deletedAt: null, airbnbId: { not: null } },
        select: { id: true, airbnbId: true },
      });
      for (const v of existingVillas) {
        if (v.airbnbId) villasByAirbnbId.set(v.airbnbId, v.id);
      }

      for (const m of messages) {
        // Extrait les listings Airbnb mentionnés dans cet email
        const listings = extractListingsFromEmail(m);
        if (listings.length === 0) continue; // email sans URL airbnb.com/rooms/X — on ignore

        // On prend le premier listing détecté comme "la villa concernée par ce message"
        // (les emails Airbnb concernent généralement 1 seule annonce à la fois)
        const listing = listings[0];

        // Trouve ou crée la villa
        let villaId = villasByAirbnbId.get(listing.airbnbId);
        if (!villaId) {
          // Détection automatique d'une nouvelle villa
          const newVilla = await prisma.villa.create({
            data: {
              userId,
              airbnbId: listing.airbnbId,
              name: listing.name,
              status: "ACTIVE",
            },
            select: { id: true, airbnbId: true, name: true },
          });
          villaId = newVilla.id;
          villasByAirbnbId.set(listing.airbnbId, newVilla.id);
          newVillas.push({
            id: newVilla.id,
            airbnbId: newVilla.airbnbId!,
            name: newVilla.name,
          });
        }

        // Évite les doublons (même thread + même date d'arrivée pour la même villa)
        const existing = await prisma.message.findFirst({
          where: {
            villaId,
            airbnbThreadId: m.threadId,
            receivedAt: m.receivedAt,
          },
          select: { id: true },
        });
        if (existing) continue;

        const msg = await prisma.message.create({
          data: {
            villaId,
            airbnbThreadId: m.threadId,
            fromName: m.fromName,
            fromAddress: m.fromAddress,
            body: m.body,
            receivedAt: m.receivedAt,
          },
        });
        created.push({ id: msg.id, villaId });
      }

      return { inserted: created, newVillas };
    });

    // Émet message/created pour chaque nouveau Message → déclenche classify-message → Claude IA
    if (result.inserted.length > 0) {
      await step.sendEvent(
        "emit-message-created",
        result.inserted.map((m) => ({
          name: "message/created",
          data: { messageId: m.id, villaId: m.villaId, userId },
        }))
      );
    }

    // Audit log si nouvelles villas auto-détectées
    if (result.newVillas.length > 0) {
      await step.run("audit-new-villas", async () =>
        prisma.auditLog
          .create({
            data: {
              userId,
              action: "VILLA_AUTO_DETECTED",
              target: `user:${userId}`,
              after: {
                count: result.newVillas.length,
                villas: result.newVillas,
              },
            },
          })
          .catch(() => null)
      );
    }

    await step.run("update-last-sync", async () =>
      prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: { lastSyncAt: new Date(), status: "CONNECTED", lastError: null },
      })
    );

    return {
      fetched: messages.length,
      inserted: result.inserted.length,
      newVillasAutoDetected: result.newVillas.length,
    };
  }
);
