import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { classifyMessage } from "@/lib/classify";

/**
 * Classifie un message Airbnb via Claude Sonnet dès qu'il est créé.
 *
 * Si urgency = HIGH → émet "alert/dispatch.requested" pour déclencher l'envoi WhatsApp.
 */
export const classifyMessageOnCreate = inngest.createFunction(
  {
    id: "classify-message-on-create",
    name: "Classify message · Claude Sonnet",
    triggers: [{ event: "message/created" }],
    concurrency: { limit: 5 },
    retries: 2,
  },
  async ({ event, step }) => {
    const { messageId, villaId, userId } = event.data as {
      messageId: string;
      villaId: string;
      userId: string;
    };

    const message = await step.run("get-message", async () =>
      prisma.message.findUnique({ where: { id: messageId } })
    );
    if (!message) return { reason: "message-not-found" };

    const result = await step.run("call-claude", async () =>
      classifyMessage({
        body: message.body,
        subject: message.fromName,
        fromName: message.fromName,
      })
    );

    if (!result) {
      await step.run("mark-failed", async () =>
        prisma.message.update({
          where: { id: messageId },
          data: { classifiedAt: new Date() },
        })
      );
      return { reason: "claude-no-result" };
    }

    await step.run("save-classification", async () =>
      prisma.message.update({
        where: { id: messageId },
        data: {
          classifiedAt: new Date(),
          urgency: result.urgency,
          category: result.category,
          summary: result.summary,
          suggestedReply: result.suggestedReply,
        },
      })
    );

    if (result.urgency === "HIGH") {
      await step.sendEvent("emit-dispatch-requested", {
        name: "alert/dispatch.requested",
        data: { messageId, villaId, userId },
      });
    }

    return {
      classified: true,
      urgency: result.urgency,
      category: result.category,
      shouldDispatch: result.urgency === "HIGH",
    };
  }
);
