import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  pollGmailFanOut,
  pollGmailForUser,
  classifyMessageOnCreate,
  dispatchAlertOnRequest,
} from "@/inngest";

/**
 * Endpoint Inngest — découvert par le serveur Inngest local (`inngest-cli dev`)
 * en dev, et par Inngest Cloud en prod.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    pollGmailFanOut,
    pollGmailForUser,
    classifyMessageOnCreate,
    dispatchAlertOnRequest,
  ],
});
