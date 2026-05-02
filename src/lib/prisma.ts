import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client.
 *
 * En dev, Next.js hot-reloads les modules — sans ce pattern, on créerait
 * un nouveau client à chaque rechargement et on saturerait les connexions
 * Postgres en quelques secondes.
 *
 * En prod, le module est chargé une seule fois.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
