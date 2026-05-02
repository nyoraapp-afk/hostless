import "server-only";
import { Resend } from "resend";

/**
 * Helper d'envoi d'emails transactionnels via Resend.
 *
 * Phase 6 : welcome email post-paiement.
 * Phase 9 : alertes admin (OAuth expiré, paiement refusé, etc.).
 *
 * Tous les emails partent de `hello@hostelyo.com` (domaine vérifié dans Resend).
 * Si la clé n'est pas configurée (dev/staging), on log et on ne lance pas d'erreur.
 */

const apiKey = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "hostelyo <hello@hostelyo.com>";

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  /** Reply-To custom (utile pour support@). */
  replyTo?: string;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY manquant — email non envoyé:", input.subject);
    return { skipped: true as const };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });
    return { id: result.data?.id, error: result.error?.message };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Resend inconnue";
    console.error("[email] envoi échoué:", message);
    return { skipped: false as const, error: message };
  }
}

// =============================================================================
// Templates
// =============================================================================

/**
 * Email de bienvenue post-paiement Stripe.
 *
 * Branded sur le brand book : aubergine, crème, Lora display, point poudre.
 * Pas d'emoji (règle stricte du brand). Email responsive (table-based pour
 * compatibilité Outlook).
 */
export async function sendWelcomeEmail(input: {
  to: string;
  firstName?: string | null;
  planLabel: string;
  villaCount: number;
  whatsappE164?: string | null;
}) {
  const { to, firstName, planLabel, villaCount, whatsappE164 } = input;
  const greeting = firstName ? `Bonjour ${firstName}` : "Bonjour";

  const subject = `Bienvenue chez hostelyo — votre forfait ${planLabel} est actif`;
  const html = welcomeEmailHtml({
    greeting,
    planLabel,
    villaCount,
    whatsappE164,
  });

  return sendEmail({
    to,
    subject,
    html,
    replyTo: "support@hostelyo.com",
  });
}

function welcomeEmailHtml(input: {
  greeting: string;
  planLabel: string;
  villaCount: number;
  whatsappE164?: string | null;
}): string {
  const { greeting, planLabel, villaCount, whatsappE164 } = input;
  const dashboardUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? "https://hostelyo.com") + "/dashboard";

  // Couleurs en dur dans le HTML — les emails ne supportent pas les CSS variables
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bienvenue chez hostelyo</title>
</head>
<body style="margin:0;padding:0;background:#FAF3EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2E1A2E;line-height:1.5;">

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FAF3EE;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(46,26,46,0.06);">

        <!-- Hero aubergine -->
        <tr>
          <td style="background:#3D1F3D;padding:40px 32px;text-align:center;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:500;color:#FAF3EE;letter-spacing:-0.02em;">
              hostelyo<span style="color:#E8B8A8;">.</span>
            </p>
            <h1 style="margin:24px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#FAF3EE;line-height:1.3;letter-spacing:-0.02em;">
              Bienvenue, <em style="color:#E8B8A8;font-weight:400;">${escapeHtml(greeting.replace("Bonjour ", "").trim() || "à vous")}</em>
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#2E1A2E;">
              ${escapeHtml(greeting)},
            </p>
            <p style="margin:0 0 16px;font-size:16px;color:#5C4859;line-height:1.6;">
              Votre paiement est confirmé et votre forfait <strong style="color:#3D1F3D;">${escapeHtml(planLabel)}</strong>
              est désormais actif. À partir de maintenant, hostelyo veille sur
              <strong style="color:#3D1F3D;">${villaCount} villa${villaCount > 1 ? "s" : ""}</strong>
              24h/24, et vous ne recevrez d'alerte WhatsApp que pour les vraies urgences.
            </p>

            <!-- Recap card -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;background:#F5ECE4;border-radius:8px;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#8B7585;">
                    Votre configuration
                  </p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:14px;color:#2E1A2E;">
                    <tr>
                      <td style="padding:6px 0;color:#5C4859;">Forfait</td>
                      <td style="padding:6px 0;text-align:right;font-weight:500;">${escapeHtml(planLabel)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#5C4859;">Villas suivies</td>
                      <td style="padding:6px 0;text-align:right;font-weight:500;">${villaCount}</td>
                    </tr>
                    ${
                      whatsappE164
                        ? `<tr>
                            <td style="padding:6px 0;color:#5C4859;">Numéro d'alerte WhatsApp</td>
                            <td style="padding:6px 0;text-align:right;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:12px;font-weight:500;">${escapeHtml(whatsappE164)}</td>
                          </tr>`
                        : ""
                    }
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA dashboard -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
              <tr>
                <td align="center">
                  <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#3D1F3D;color:#FAF3EE;padding:14px 28px;border-radius:8px;font-weight:500;text-decoration:none;font-size:15px;">
                    Accéder à mon dashboard
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:14px;color:#5C4859;line-height:1.6;">
              <strong style="color:#3D1F3D;">Et maintenant ?</strong><br>
              hostelyo veille sur la boîte Gmail que vous avez connectée et analyse en continu
              les notifications Airbnb qu'elle reçoit. La première alerte arrivera sur votre
              WhatsApp dès qu'une vraie urgence sera détectée. Si vous n'en recevez pas dans
              les premiers jours, c'est tout à fait normal — c'est même le but :
              <em style="color:#5A3856;">moins d'alertes, plus pertinentes</em>.
            </p>

            <!-- Bloc instructions Gmail / forwarding -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0 0;background:#FAF3EE;border:1px solid #E8B8A8;border-radius:8px;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#3D1F3D;">
                    Une dernière vérification
                  </p>
                  <p style="margin:0 0 12px;font-size:14px;color:#2E1A2E;line-height:1.6;">
                    hostelyo lit la boîte Gmail que vous venez de connecter. Pour que la
                    veille fonctionne, vos notifications Airbnb doivent bien arriver dans
                    <em style="color:#5A3856;">cette même boîte</em>.
                  </p>
                  <p style="margin:0 0 8px;font-size:14px;color:#2E1A2E;line-height:1.6;">
                    Si ce n'est pas déjà le cas, deux options&nbsp;:
                  </p>
                  <ol style="margin:0 0 0 18px;padding:0;font-size:14px;color:#2E1A2E;line-height:1.7;">
                    <li style="margin-bottom:8px;">
                      Modifiez l'email de votre compte Airbnb&nbsp;:
                      <a href="https://www.airbnb.fr/account-settings/personal-info" style="color:#3D1F3D;text-decoration:underline;">Compte&nbsp;&rsaquo;&nbsp;Informations personnelles</a>
                      &rsaquo; Email, et indiquez le Gmail que vous venez de connecter.
                    </li>
                    <li>
                      Ou activez un transfert automatique depuis votre boîte actuelle vers ce
                      Gmail (paramètres de votre messagerie source).
                    </li>
                  </ol>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:14px;color:#5C4859;line-height:1.6;">
              Une question, un souci ? Répondez simplement à cet email,
              <a href="mailto:support@hostelyo.com" style="color:#3D1F3D;text-decoration:underline;">support@hostelyo.com</a>
              vous répondra sous 24h.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;background:#F5ECE4;text-align:center;font-size:12px;color:#8B7585;">
            <p style="margin:0 0 8px;">
              hostelyo<span style="color:#E8B8A8;">.</span>
              · veille sur vos villas pour que vous puissiez vivre la vôtre
            </p>
            <p style="margin:0;">
              <a href="${escapeHtml((process.env.NEXT_PUBLIC_APP_URL ?? "https://hostelyo.com") + "/aide")}" style="color:#5C4859;text-decoration:underline;">Aide</a>
              ·
              <a href="${escapeHtml((process.env.NEXT_PUBLIC_APP_URL ?? "https://hostelyo.com") + "/privacy")}" style="color:#5C4859;text-decoration:underline;">Confidentialité</a>
              ·
              <a href="${escapeHtml((process.env.NEXT_PUBLIC_APP_URL ?? "https://hostelyo.com") + "/legal")}" style="color:#5C4859;text-decoration:underline;">Mentions légales</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
