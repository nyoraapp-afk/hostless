import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { checkVerifyOtp } from "@/lib/twilio";

/**
 * POST /api/whatsapp/check-otp
 *
 * Vérifie un code OTP saisi par l'utilisateur. Retourne valid: true si Twilio confirme.
 *
 * Body : { e164: string, code: string }
 */

const BodySchema = z.object({
  e164: z.string().regex(/^\+\d{8,15}$/, "Format E.164 invalide"),
  code: z.string().regex(/^\d{4,8}$/, "Le code doit contenir 4 à 8 chiffres"),
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

  const { e164, code } = parsed.data;

  try {
    const result = await checkVerifyOtp(e164, code);

    if (!result.valid) {
      return NextResponse.json(
        {
          ok: false,
          status: result.status,
          error: "Code incorrect ou expiré. Vérifie le dernier code reçu sur WhatsApp.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Twilio inconnue";
    console.error("[whatsapp/check-otp] failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
