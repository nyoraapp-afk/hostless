import Twilio from "twilio";

/**
 * Client Twilio singleton — server-only.
 *
 * Phase 1.B+ : utilis\u00e9 pour Verify (OTP) via WhatsApp ou SMS.
 * Phase 2 : sera aussi utilis\u00e9 pour envoyer les vraies alertes WhatsApp aux intervenants.
 *
 * En sandbox WhatsApp Twilio :
 *   - Les destinataires DOIVENT d'abord s'opt-in en envoyant le code "join principal-western"
 *     (ou code propre \u00e0 votre sandbox) au num\u00e9ro +14155238886 depuis leur WhatsApp.
 *   - Sans cet opt-in, l'envoi r\u00e9ussit en API mais le message n'arrive jamais.
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid || !authToken) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN manquants");
  }
  console.warn("[twilio] credentials manquantes — appels Twilio vont \u00e9chouer");
}

export const twilio = Twilio(
  accountSid ?? "AC_placeholder",
  authToken ?? "placeholder"
);

export const TWILIO_VERIFY_SERVICE_SID = verifyServiceSid ?? "";
export const TWILIO_WHATSAPP_FROM =
  process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

/**
 * Envoie un OTP via Twilio Verify.
 * @param to E.164 (ex: "+33612345678")
 * @param channel "whatsapp" | "sms" — d\u00e9faut whatsapp (notre canal principal)
 */
export async function sendVerifyOtp(
  to: string,
  channel: "whatsapp" | "sms" = "whatsapp"
) {
  if (!verifyServiceSid) {
    throw new Error("TWILIO_VERIFY_SERVICE_SID manquant en .env.local");
  }
  return twilio.verify.v2
    .services(verifyServiceSid)
    .verifications.create({ to, channel });
}

/**
 * V\u00e9rifie un code OTP re\u00e7u par l'utilisateur.
 * @returns { valid: boolean, status: "approved" | "pending" | "canceled" | other }
 */
export async function checkVerifyOtp(to: string, code: string) {
  if (!verifyServiceSid) {
    throw new Error("TWILIO_VERIFY_SERVICE_SID manquant en .env.local");
  }
  const check = await twilio.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({ to, code });
  return {
    valid: check.status === "approved",
    status: check.status,
  };
}
