/**
 * Toutes les fonctions Inngest exposées via /api/inngest.
 *
 * Pipeline :
 *   1. cron toutes les minutes → fan out aux users connectés (pollGmailFanOut)
 *   2. par user, fetch Gmail + insert Message (pollGmailForUser)
 *   3. par message, classifier via Claude (classifyMessageOnCreate)
 *   4. si HIGH, dispatch WhatsApp via Twilio (dispatchAlertOnRequest)
 */
export { pollGmailFanOut, pollGmailForUser } from "./functions/poll-gmail";
export { classifyMessageOnCreate } from "./functions/classify-message";
export { dispatchAlertOnRequest } from "./functions/dispatch-alert";
