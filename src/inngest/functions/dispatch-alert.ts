import { inngest } from "../client";
import { dispatchAlert } from "@/lib/dispatch";

/**
 * Envoie l'alerte WhatsApp via Twilio dès qu'un message HIGH est classifié.
 *
 * Concurrency limit : 10 envois en parallèle global (évite saturation Twilio).
 */
export const dispatchAlertOnRequest = inngest.createFunction(
  {
    id: "dispatch-alert-on-request",
    name: "Dispatch alert WhatsApp via Twilio",
    triggers: [{ event: "alert/dispatch.requested" }],
    concurrency: { limit: 10 },
    retries: 2,
  },
  async ({ event, step }) => {
    const { messageId } = event.data as { messageId: string };
    const result = await step.run("send-whatsapp", async () => dispatchAlert(messageId));
    return result;
  }
);
