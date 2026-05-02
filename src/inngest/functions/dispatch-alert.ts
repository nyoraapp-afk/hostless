import { inngest } from "../client";
import { dispatchAlert } from "@/lib/dispatch";

/**
 * Envoie l'alerte WhatsApp via Twilio dès qu'un message HIGH est classifié.
 *
 * Concurrency limit : 5 envois en parallèle global (limite plan Inngest Free).
 * À remonter à 10 quand on passe sur un plan payant — voir guidelines Twilio.
 */
export const dispatchAlertOnRequest = inngest.createFunction(
  {
    id: "dispatch-alert-on-request",
    name: "Dispatch alert WhatsApp via Twilio",
    triggers: [{ event: "alert/dispatch.requested" }],
    concurrency: { limit: 5 },
    retries: 2,
  },
  async ({ event, step }) => {
    const { messageId } = event.data as { messageId: string };
    const result = await step.run("send-whatsapp", async () => dispatchAlert(messageId));
    return result;
  }
);
