import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { sendVerifyOtp } from "@/lib/twilio";

/**
 * POST /api/whatsapp/send-otp
 *
 * Envoie un code OTP via Twilio Verify (canal WhatsApp par défaut, SMS en fallback).
 *
 * Body : { e164: string, channel?: "whatsapp" | "sms" }
 *
 * Pré-requis sandbox WhatsApp Twilio :
 *   le destinataire doit avoir envoyé "join principal-western" à +14155238886 depuis son WhatsApp.
 */

const BodySchema = z.object({
  e164: z.string().regex(/^\+\d{8,15}$/, "Format E.164 invalide"),
  channel: z.enum(["whatsapp", "sms"]).optional().default("whatsapp"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Body invalide", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { e164, channel } = parsed.data;

  try {
    const verification = await sendVerifyOtp(e164, channel);
    return NextResponse.json({
      ok: true,
      sid: verification.sid,
      status: verification.status,
      channel: verification.channel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Twilio inconnue";
    console.error("[whatsapp/send-otp] failed:", err);
    return NextResponse.json(
      { error: message, hint: hintFromTwilioError(message) },
      { status: 500 }
    );
  }
}

/**
 * Traduit les erreurs Twilio courantes en messages utilisateur (Pattern 10).
 */
function hintFromTwilioError(message: string): string | null {
  if (message.includes("not a valid phone number")) {
    return "Le format du numéro est invalide. Vérifiez que vous avez bien sélectionné le bon pays.";
  }
  if (message.includes("Channel WHATSAPP not enabled")) {
    return "Le canal WhatsApp n'est pas activé sur votre service Twilio Verify. Activez-le dans la console Twilio.";
  }
  if (message.includes("Max send attempts")) {
    return "Trop d'envois en peu de temps. Patientez quelques minutes avant de réessayer.";
  }
  if (message.includes("not opted")) {
    return "En sandbox WhatsApp, votre numéro doit d'abord envoyer 'join principal-western' à +14155238886.";
  }
  return null;
}
