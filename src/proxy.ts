import { auth } from "@/auth";

/**
 * Proxy Auth.js (Next.js 16) — applique le callback `authorized` du authConfig
 * sur toutes les routes matchées. Empêche l'accès non authentifié à
 * /dashboard et /onboarding (sauf l'étape OAuth elle-même).
 *
 * En Next.js 16 le fichier middleware.ts a été renommé proxy.ts.
 */
export default auth;

export const config = {
  matcher: [
    // Toutes les routes sauf : api/auth, api/inngest, api/stripe/webhook,
    // api/inbound, _next, fichiers statiques.
    // Les webhooks et l'endpoint Inngest doivent être accessibles sans
    // session — leur authentification est gérée par signature côté handler.
    "/((?!api/auth|api/inngest|api/stripe/webhook|api/inbound|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)",
  ],
};
