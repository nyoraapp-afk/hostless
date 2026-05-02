"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAliasSlug, getInboundDomain } from "@/lib/inbound-email";

/**
 * Server actions de l'option 2 d'inscription (forwarding email).
 */

/**
 * Crée (ou retourne s'il existe déjà) un alias inbound pour le user connecté.
 *
 * Utilisé sur /onboarding/forwarding pour afficher l'adresse à configurer côté Airbnb/Gmail.
 *
 * Idempotent : appelé plusieurs fois retourne toujours le même alias pour ce user.
 *
 * @returns l'alias complet (ex : "jadeapavou-x7k2@in.hostelyo.com")
 */
export async function ensureInboundAlias(): Promise<{
  alias: string;
  fullAddress: string;
  domain: string;
}> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new Error("Non authentifié");
  }
  const userId = session.user.id;

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { inboundAlias: true, email: true, name: true },
  });

  const domain = getInboundDomain();

  if (existing?.inboundAlias) {
    return {
      alias: existing.inboundAlias,
      fullAddress: `${existing.inboundAlias}@${domain}`,
      domain,
    };
  }

  // Génère un slug unique. On essaie jusqu'à 5 fois en cas de collision unique constraint.
  let slug = "";
  let attempt = 0;
  while (attempt < 5) {
    slug = generateAliasSlug(existing?.name ?? existing?.email ?? "host");
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { inboundAlias: slug },
      });
      break;
    } catch (err) {
      // P2002 = unique constraint violation Prisma → on retente avec un autre slug
      const code = (err as { code?: string }).code;
      if (code !== "P2002") throw err;
      attempt++;
      slug = "";
    }
  }

  if (!slug) {
    throw new Error("Impossible de générer un alias unique après 5 essais");
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: "INBOUND_ALIAS_CREATED",
      target: `user:${userId}`,
      after: { alias: slug, domain },
    },
  });

  revalidatePath("/onboarding/forwarding");
  return {
    alias: slug,
    fullAddress: `${slug}@${domain}`,
    domain,
  };
}

/**
 * Crée des villas en lot pour l'inscription forwarding (saisie manuelle, pas de scan auto).
 *
 * @param input.villas Liste des villas avec nom + airbnbId optionnel
 */
export async function bulkCreateVillas(input: {
  villas: { name: string; airbnbId?: string }[];
}): Promise<{ ok: true; created: number }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  const userId = session.user.id;

  // Filtre les entrées vides
  const valid = input.villas.filter((v) => v.name.trim().length > 0);
  if (valid.length === 0) {
    throw new Error("Au moins une villa avec un nom est requise.");
  }

  // Validation airbnbId si fourni
  for (const v of valid) {
    const id = v.airbnbId?.trim();
    if (id && !/^\d{6,12}$/.test(id)) {
      throw new Error(
        `L'ID Airbnb "${id}" est invalide (6 à 12 chiffres uniquement).`
      );
    }
  }

  await prisma.$transaction(
    valid.map((v) =>
      prisma.villa.create({
        data: {
          userId,
          name: v.name.trim(),
          airbnbId: v.airbnbId?.trim() || null,
          status: "ACTIVE",
        },
      })
    )
  );

  await prisma.auditLog.create({
    data: {
      userId,
      action: "VILLAS_BULK_CREATED_FORWARDING",
      target: `user:${userId}`,
      after: { count: valid.length },
    },
  });

  revalidatePath("/dashboard");
  return { ok: true, created: valid.length };
}
