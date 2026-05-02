/**
 * Seed initial pour la base hostelyo.
 *
 * Crée les 2 plans (Essentiel, Sérénité) avec leurs Stripe price IDs.
 * Ces enregistrements sont la source de vérité unique pour les prix
 * (Pattern 10 — pas de prix hardcodé côté JS).
 *
 * Usage : `npm run db:seed` (depuis ta machine, pas le sandbox).
 */

import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Seeding plans…");

  const plans: Prisma.PlanCreateInput[] = [
    {
      slug: "ESSENTIEL",
      label: "Essentiel",
      priceMonthly: 4900, // 49.00€ en centimes
      stripePriceId: process.env.STRIPE_PRICE_ID_ESSENTIEL,
      features: {
        items: [
          "Analyse 24h/24 des messages Airbnb",
          "Alertes WhatsApp pour vraies urgences",
          "Filtrage intelligent (faux positifs réduits)",
          "Sans engagement, résiliable à tout moment",
        ],
      },
    },
    {
      slug: "SERENITE",
      label: "Sérénité",
      priceMonthly: 9900, // 99.00€ en centimes
      stripePriceId: process.env.STRIPE_PRICE_ID_SERENITE,
      features: {
        items: [
          "Tout ce que contient Essentiel",
          "Dispatch automatique vers vos intervenants",
          "Configuration 6 catégories (ménage, piscine, jardin…)",
          "Exceptions par villa possibles",
          "Vous restez en copie de chaque alerte",
        ],
        recommended: true,
      },
    },
  ];

  for (const plan of plans) {
    const upserted = await prisma.plan.upsert({
      where: { slug: plan.slug! },
      update: {
        label: plan.label,
        priceMonthly: plan.priceMonthly,
        stripePriceId: plan.stripePriceId,
        features: plan.features ?? {},
      },
      create: plan,
    });
    console.log(
      `  ✓ Plan ${upserted.slug} (${upserted.priceMonthly / 100}€/mois) — Stripe price : ${upserted.stripePriceId ?? "—"}`
    );
  }

  const planCount = await prisma.plan.count();
  console.log(`→ ${planCount} plan(s) en base. Seed terminé.`);
}

main()
  .catch((e) => {
    console.error("✗ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
