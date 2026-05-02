import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listAirbnbEmailsSince } from "@/lib/gmail";
import { aggregateDetectedListings } from "@/lib/airbnb-extract";

/**
 * POST /api/onboarding/scan
 *
 * Lance le scan réel de la boîte Gmail de l'utilisateur :
 *   1. Récupère les emails Airbnb des 90 derniers jours via gmail.ts
 *   2. Extrait les listing IDs uniques + noms (best-effort)
 *   3. Upsert les Villa correspondantes en DB
 *   4. Met à jour lastSyncAt sur l'EmailAccount pour que le cron prenne le relais
 *
 * Retourne la liste des villas détectées (créées + déjà en DB).
 *
 * Idempotent : peut être ré-appelé sans dupliquer (upsert sur airbnbId+userId).
 */

export const maxDuration = 60; // Vercel : autoriser jusqu'à 60s pour le scan

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Vérifie que l'EmailAccount existe pour ce user (créé par events.signIn dans auth.ts)
    const emailAccount = await prisma.emailAccount.findFirst({
      where: { userId, provider: "GMAIL" },
    });
    if (!emailAccount) {
      return NextResponse.json(
        {
          error: "Aucun compte Gmail connecté",
          hint: "Reconnectez-vous via Google pour autoriser l'accès à votre boîte mail.",
        },
        { status: 400 }
      );
    }

    // 2. Scan Gmail (90 derniers jours par défaut)
    const emails = await listAirbnbEmailsSince(userId, null);

    // 3. Extraction des listings uniques
    const detected = aggregateDetectedListings(emails);

    // 4. Find or create chaque Villa en DB
    // (pas de upsert direct car pas de @@unique([userId, airbnbId]) sur Villa)
    const villas = await Promise.all(
      detected.map(async (l) => {
        const existing = await prisma.villa.findFirst({
          where: { userId, airbnbId: l.airbnbId, deletedAt: null },
          select: { id: true, name: true, airbnbId: true, status: true },
        });
        if (existing) {
          // Si la villa existait déjà, on la réactive et on ne touche pas au nom
          // (l'utilisateur a peut-être renommé)
          if (existing.status !== "ACTIVE") {
            return prisma.villa.update({
              where: { id: existing.id },
              data: { status: "ACTIVE" },
              select: { id: true, name: true, airbnbId: true, status: true },
            });
          }
          return existing;
        }
        return prisma.villa.create({
          data: {
            userId,
            airbnbId: l.airbnbId,
            name: l.name,
            status: "ACTIVE",
          },
          select: { id: true, name: true, airbnbId: true, status: true },
        });
      })
    );

    // 5. Met à jour lastSyncAt pour que le cron Inngest reprenne à partir de maintenant
    await prisma.emailAccount.update({
      where: { id: emailAccount.id },
      data: {
        lastSyncAt: new Date(),
        status: "CONNECTED",
      },
    });

    // 6. Audit log
    await prisma.auditLog
      .create({
        data: {
          userId,
          action: "ONBOARDING_SCAN_COMPLETED",
          target: `user:${userId}`,
          after: {
            emailsScanned: emails.length,
            villasDetected: villas.length,
          },
        },
      })
      .catch(() => {
        // L'audit log n'est pas critique, on continue si ça échoue
      });

    return NextResponse.json({
      ok: true,
      emailsScanned: emails.length,
      villas,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[onboarding/scan] failed:", err);

    // Cas particulier : refresh_token Google invalide → l'utilisateur doit se reconnecter
    if (message.includes("refresh_token") || message.includes("invalid_grant")) {
      return NextResponse.json(
        {
          error: "Connexion Google expirée",
          hint: "Déconnectez-vous puis reconnectez-vous via Google pour réautoriser l'accès Gmail.",
          code: "REAUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: message, hint: "Réessayez dans quelques secondes." },
      { status: 500 }
    );
  }
}
