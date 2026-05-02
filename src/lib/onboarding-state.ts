"use client";

import type { PlanSlug, DispatchCategory } from "./types";

/**
 * État partagé du flow d'onboarding (étapes p4 → p7 du proto).
 * Persisté en sessionStorage pendant la navigation entre étapes.
 *
 * Quand la DB Supabase sera branchée, on remplacera par des appels
 * server actions qui persistent en `User`/`Villa`/`Subscription` etc.
 */

export type DetectedVilla = {
  id: string;
  name: string;
  airbnbId?: string;
  removed?: boolean; // soft-delete + UNDO 5s
};

export type TeamMember = {
  name: string;
  e164: string;
};

export type OnboardingState = {
  villas: DetectedVilla[];
  whatsappCountry: string;
  whatsappLocal: string;
  whatsappE164: string;
  whatsappVerified: boolean;
  plan: PlanSlug | null;
  team: Partial<Record<DispatchCategory, TeamMember>>;
  /**
   * Nombre d'emails Airbnb trouvés lors du dernier scan Gmail.
   * - `null` : pas encore scanné (1er passage avant /onboarding/scan)
   * - `0`    : aucune notif Airbnb dans la boîte → mauvais Gmail probablement.
   *            L'ajout manuel est BLOQUÉ (on ne pourrait pas capter ses emails).
   * - `> 0`  : la boîte reçoit bien les notifs. Si villas extractibles vides,
   *            l'ajout manuel reste autorisé.
   */
  emailsScanned: number | null;
};

const KEY = "hostelyo-onboarding";

const DEFAULT: OnboardingState = {
  villas: [],
  whatsappCountry: "FR",
  whatsappLocal: "",
  whatsappE164: "",
  whatsappVerified: false,
  plan: null,
  team: {},
  emailsScanned: null,
};

export function loadOnboarding(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function saveOnboarding(patch: Partial<OnboardingState>): OnboardingState {
  const current = loadOnboarding();
  const next = { ...current, ...patch };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function clearOnboarding() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(KEY);
  }
}

