import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/onboarding/save
 *
 * Persiste l'\u00e9tat d'onboarding (collect\u00e9 en sessionStorage c\u00f4t\u00e9 client) en DB :
 *   - Villas (cr\u00e9\u00e9es ou mises \u00e0 jour)
 *   - WhatsAppNumber (status PENDING_VERIFICATION ou VERIFIED selon mock OTP)
 *   - Intervenants + DispatchRule si plan = SERENITE
 *
 * Appel\u00e9 typiquement juste avant l'\u00e9tape /onboarding/recap, ou en parall\u00e8le.
 *
 * S\u00e9curit\u00e9 :
 *   - Auth requise (session.user.id sert d'owner pour toutes les insertions)
 *   - Validation Zod stricte (Pattern 10)
 *   - Op\u00e9rations en transaction (atomicit\u00e9)
 */

const VillaInput = z.object({
  airbnbId: z.string().nullable().optional(),
  name: z.string().min(1).max(120),
});

const TeamMemberInput = z.object({
  name: z.string().min(1).max(80),
  phoneE164: z.string().regex(/^\+\d{8,15}$/, "Format E.164 invalide"),
});

const BodySchema = z.object({
  villas: z.array(VillaInput).max(50),
  whatsappE164: z.string().regex(/^\+\d{8,15}$/, "Format E.164 invalide"),
  whatsappVerified: z.boolean().optional().default(false),
  plan: z.enum(["ESSENTIEL", "SERENITE"]).nullable(),
  team: z
    .object({
      MENAGE: TeamMemberInput.optional(),
      PISCINE: TeamMemberInput.optional(),
      JARDIN: TeamMemberInput.optional(),
      MAINTENANCE: TeamMemberInput.optional(),
      ACCUEIL: TeamMemberInput.optional(),
      AUTRE: TeamMemberInput.optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifi\u00e9" }, { status: 401 });
  }
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Body invalide", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { villas, whatsappE164, whatsappVerified, plan } = parsed.data;
  const team = parsed.data.team ?? {};

  try {
    const result = await prisma.$transaction(
      async (tx) => {
      // 1) Upsert WhatsApp number
      await tx.whatsAppNumber.upsert({
        where: { userId_e164: { userId, e164: whatsappE164 } },
        update: {
          status: whatsappVerified ? "VERIFIED" : "PENDING_VERIFICATION",
          verifiedAt: whatsappVerified ? new Date() : null,
        },
        create: {
          userId,
          e164: whatsappE164,
          status: whatsappVerified ? "VERIFIED" : "PENDING_VERIFICATION",
          verifiedAt: whatsappVerified ? new Date() : null,
        },
      });

      // 2) Upsert villas (par couple userId + airbnbId si fourni, sinon cr\u00e9ation simple)
      const createdVillas = [];
      for (const v of villas) {
        if (v.airbnbId) {
          // Tenter de retrouver une villa existante par airbnbId (unique par user)
          const existing = await tx.villa.findFirst({
            where: { userId, airbnbId: v.airbnbId },
          });
          if (existing) {
            const updated = await tx.villa.update({
              where: { id: existing.id },
              data: { name: v.name, status: "ACTIVE", deletedAt: null },
            });
            createdVillas.push(updated);
          } else {
            const created = await tx.villa.create({
              data: { userId, airbnbId: v.airbnbId, name: v.name },
            });
            createdVillas.push(created);
          }
        } else {
          const created = await tx.villa.create({
            data: { userId, name: v.name },
          });
          createdVillas.push(created);
        }
      }

      // 3) Si Sérénité, créer/mettre \u00e0 jour les intervenants + dispatch rules
      const createdRules = [];
      type TeamMember = { name: string; phoneE164: string };
      const teamEntries = Object.entries(team) as [string, TeamMember][];
      if (plan === "SERENITE" && teamEntries.length > 0) {
        // Reset des r\u00e8gles existantes (l'onboarding est la source de v\u00e9rit\u00e9 pour la 1re config)
        await tx.dispatchRule.deleteMany({ where: { userId } });

        for (const [category, member] of teamEntries) {
          // Trouver ou créer l'intervenant par userId + phoneE164 (tout reste DANS la transaction)
          const existing = await tx.intervenant.findFirst({
            where: { userId, phoneE164: member.phoneE164 },
          });
          const intervenant = existing
            ? await tx.intervenant.update({
                where: { id: existing.id },
                data: { name: member.name },
              })
            : await tx.intervenant.create({
                data: { userId, name: member.name, phoneE164: member.phoneE164 },
              });

          const rule = await tx.dispatchRule.create({
            data: {
              userId,
              category: category as
                | "MENAGE"
                | "PISCINE"
                | "JARDIN"
                | "MAINTENANCE"
                | "ACCUEIL"
                | "AUTRE",
              intervenantId: intervenant.id,
            },
          });
          createdRules.push(rule);
        }
      }

      // 4) Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: "ONBOARDING_SAVED",
          target: `user:${userId}`,
          after: {
            villasCount: createdVillas.length,
            whatsappVerified,
            plan,
            teamCount: Object.keys(team).length,
          },
        },
      });

      return {
        villas: createdVillas.length,
        rules: createdRules.length,
      };
      },
      {
        // Latence Maurice ↔ Supabase Ireland peut être élevée, on laisse de la marge.
        maxWait: 10_000, // attente d'un slot dispo
        timeout: 30_000, // durée max de la transaction
      }
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[onboarding/save] failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
