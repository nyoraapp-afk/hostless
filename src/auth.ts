import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Configuration Auth.js v5 (NextAuth beta).
 *
 * Phase 1.B — sessions persistées en DB via PrismaAdapter.
 *   - User créé automatiquement à la 1re connexion Google
 *   - Account stocke le refresh_token Google (réutilisé par le cron Gmail en Phase 2)
 *   - Session persistée en `Session` (vs JWT en cookie)
 *
 * Scopes Google demandés :
 *   - `openid email profile` — identité de base
 *   - `gmail.readonly` — pour scanner les emails Airbnb
 */

const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: GMAIL_SCOPES,
          access_type: "offline", // pour obtenir un refresh_token réutilisable
          prompt: "consent", // force l'écran consent → garantit qu'on reçoit un refresh_token
        },
      },
      // PrismaAdapter mappe automatiquement le profil Google vers User (id, email, name, image).
      // On force la locale FR par défaut pour les nouveaux utilisateurs.
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          locale: profile.locale === "en" ? "en" : "fr",
          role: "OWNER" as const,
        };
      },
    }),
  ],

  // Session strategy "database" → utilise la table Session via PrismaAdapter.
  session: { strategy: "database" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    /**
     * Expose userId au client via session.user.id.
     * Avec PrismaAdapter, `user` contient l'enregistrement DB complet.
     */
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },

    /**
     * Garde toutes les routes /dashboard et /onboarding derrière l'auth.
     */
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
      return !isProtected || !!auth;
    },
  },

  events: {
    /**
     * À chaque connexion Google, on s'assure qu'un EmailAccount existe pour cet user.
     * C'est ce qui dit au cron Inngest "ce user a une boîte Gmail à poller".
     */
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.id && user?.email) {
        await prisma.emailAccount.upsert({
          where: { userId_email: { userId: user.id, email: user.email } },
          create: {
            userId: user.id,
            provider: "GMAIL",
            email: user.email,
            status: "PENDING_INITIAL",
          },
          update: {}, // ne touche pas aux champs existants (lastSyncAt, etc.)
        });
      }
    },
  },

  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
