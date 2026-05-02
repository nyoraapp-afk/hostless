import { Inngest } from "inngest";

/**
 * Inngest client + définitions d'événements.
 *
 * Inngest 4.x : on utilise les types TS directement (sans EventSchemas).
 * Si on veut de la validation runtime, on ajoutera Zod via Standard Schema.
 *
 * En dev local : `npx inngest-cli@latest dev` lance un serveur Inngest local
 * qui découvre nos fonctions via http://localhost:3030/api/inngest.
 */

export const inngest = new Inngest({
  id: "hostelyo-app",
});

/** Événements émis dans notre pipeline. Importés/typés à la main pour le moment. */
export type GmailPollRequested = {
  name: "gmail/poll.requested";
  data: { userId: string; emailAccountId: string };
};

export type MessageCreated = {
  name: "message/created";
  data: { messageId: string; villaId: string; userId: string };
};

export type AlertDispatchRequested = {
  name: "alert/dispatch.requested";
  data: { messageId: string; villaId: string; userId: string };
};
