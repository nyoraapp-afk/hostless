import type { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

/**
 * Augmentation des types Auth.js pour inclure id + role sur session.user.
 * Ça enlève le besoin de @ts-expect-error dans les callbacks.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}
