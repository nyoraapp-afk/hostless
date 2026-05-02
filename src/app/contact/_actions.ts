"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ContactInput = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email("Adresse email invalide"),
  subject: z.string().min(3).max(200),
  message: z.string().min(10, "Détaillez un peu votre demande (10 caractères minimum)").max(5000),
  topic: z.enum(["bug", "feature", "billing", "config", "other"]),
});

/**
 * Envoie un email de contact à support@hostelyo.com.
 *
 * Anti-spam : pas de captcha pour le MVP (volume bas attendu). Si on a des spammers
 * plus tard, on ajoute Cloudflare Turnstile (gratuit) ou hCaptcha.
 */
export async function sendContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  topic: "bug" | "feature" | "billing" | "config" | "other";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = ContactInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join(" — "),
    };
  }

  const { name, email, subject, message, topic } = parsed.data;

  // Si l'utilisateur est connecté, on enrichit le message avec son ID
  const session = await auth();
  const userId = session?.user?.id;

  const topicLabels: Record<typeof topic, string> = {
    bug: "Bug technique",
    feature: "Suggestion",
    billing: "Facturation",
    config: "Configuration",
    other: "Autre",
  };

  const html = `<p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
<p><strong>Catégorie :</strong> ${topicLabels[topic]}</p>
<p><strong>De :</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
${userId ? `<p><strong>User ID :</strong> <code>${escapeHtml(userId)}</code></p>` : "<p><em>Utilisateur non authentifié</em></p>"}
<hr>
<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`;

  const result = await sendEmail({
    to: "support@hostelyo.com",
    subject: `[hostelyo ${topicLabels[topic]}] ${subject}`,
    html,
    replyTo: email,
  });

  if ("error" in result && result.error) {
    return { ok: false, error: "Envoi impossible — réessayez ou écrivez directement à support@hostelyo.com." };
  }

  // Log dans AuditLog si user authentifié (utile pour suivi support)
  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CONTACT_FORM_SUBMITTED",
        target: "support",
        after: { topic, subject },
      },
    });
  }

  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
