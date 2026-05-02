"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Server actions liées aux villas.
 *
 * Chacune :
 *   - vérifie l'auth
 *   - vérifie l'ownership de la villa
 *   - log dans AuditLog
 *   - revalide le cache /dashboard
 */

const SoftDeleteVillaInput = z.object({
  villaId: z.string().min(1),
});

export async function softDeleteVilla(input: { villaId: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const { villaId } = SoftDeleteVillaInput.parse(input);

  const villa = await prisma.villa.findFirst({
    where: { id: villaId, userId: session.user.id, deletedAt: null },
  });
  if (!villa) throw new Error("Villa introuvable ou déjà supprimée");

  await prisma.$transaction([
    prisma.villa.update({
      where: { id: villaId },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "VILLA_SOFT_DELETED",
        target: `villa:${villaId}`,
        before: { name: villa.name, status: villa.status },
      },
    }),
  ]);

  revalidatePath("/dashboard");
  return { ok: true };
}

const AddVillaInput = z.object({
  name: z.string().min(1).max(120),
  airbnbId: z.string().regex(/^\d{6,12}$/, "L'ID Airbnb doit contenir 6 à 12 chiffres").optional().or(z.literal("")),
});

export async function addVilla(input: { name: string; airbnbId?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const parsed = AddVillaInput.parse(input);
  const airbnbId = parsed.airbnbId?.trim() || null;

  // Empêche les doublons par airbnbId
  if (airbnbId) {
    const existing = await prisma.villa.findFirst({
      where: { userId: session.user.id, airbnbId, deletedAt: null },
    });
    if (existing) {
      throw new Error(`Une villa avec l'ID Airbnb ${airbnbId} existe déjà.`);
    }
  }

  const villa = await prisma.villa.create({
    data: {
      userId: session.user.id,
      name: parsed.name.trim(),
      airbnbId,
      status: "ACTIVE",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "VILLA_ADDED_MANUALLY",
      target: `villa:${villa.id}`,
      after: { name: villa.name, airbnbId },
    },
  });

  revalidatePath("/dashboard");
  return { ok: true, villa };
}

export async function restoreVilla(input: { villaId: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const { villaId } = SoftDeleteVillaInput.parse(input);

  const villa = await prisma.villa.findFirst({
    where: { id: villaId, userId: session.user.id, status: "ARCHIVED" },
  });
  if (!villa) throw new Error("Villa introuvable ou non archivée");

  await prisma.$transaction([
    prisma.villa.update({
      where: { id: villaId },
      data: { deletedAt: null, status: "ACTIVE" },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "VILLA_RESTORED",
        target: `villa:${villaId}`,
      },
    }),
  ]);

  revalidatePath("/dashboard");
  return { ok: true };
}
