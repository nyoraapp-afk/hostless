import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { listAirbnbEmailsSince } from "@/lib/gmail";

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
 * - List emails Airbnb depuis lastSyncAt
 * - Pour chaque, on retrouve la villa par airbnbId (présent dans le sujet/body)
 * - Insert Message en DB
 * - Émet "message/created" pour déclencher la classification
 * - Update lastSyncAt
 */
export const pollGmailForUser = inngest.createFunction(
  {
    id: "poll-gmail-for-user",
    name: "Poll Gmail pour un user (fetch + insert messages)",
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

    const villas = await step.run("list-villas", async () =>
      prisma.villa.findMany({
        where: { userId, status: "ACTIVE", deletedAt: null },
        select: { id: true, airbnbId: true, name: true },
      })
    );
    if (villas.length === 0) return { reason: "no-villas" };

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
    const inserted: CreatedMsg[] = await step.run("insert-messages", async () => {
      const created: CreatedMsg[] = [];
      for (const m of messages) {
        const villa = villas.find(
          (v) =>
            v.airbnbId &&
            (m.subject?.includes(v.airbnbId) || m.body.includes(v.airbnbId))
        );
        if (!villa) continue;

        const existing = await prisma.message.findFirst({
          where: { villaId: villa.id, airbnbThreadId: m.threadId, receivedAt: m.receivedAt },
          select: { id: true },
        });
        if (existing) continue;

        const msg = await prisma.message.create({
          data: {
            villaId: villa.id,
            airbnbThreadId: m.threadId,
            fromName: m.fromName,
            fromAddress: m.fromAddress,
            body: m.body,
            receivedAt: m.receivedAt,
          },
        });
        created.push({ id: msg.id, villaId: villa.id });
      }
      return created;
    });

    if (inserted.length > 0) {
      await step.sendEvent(
        "emit-message-created",
        inserted.map((m) => ({
          name: "message/created",
          data: { messageId: m.id, villaId: m.villaId, userId },
        }))
      );
    }

    await step.run("update-last-sync", async () =>
      prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: { lastSyncAt: new Date(), status: "CONNECTED", lastError: null },
      })
    );

    return { fetched: messages.length, inserted: inserted.length };
  }
);
