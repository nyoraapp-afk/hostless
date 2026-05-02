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

/**
 * Mock data utilisée par le scan tant que Gmail API + DB ne sont pas branchés.
 * Reproduit les 3 villas du proto v34 (ligne 3450-ish).
 */
export const MOCK_DETECTED_VILLAS: DetectedVilla[] = [
  { id: "mock-1", name: "Villa Sunset", airbnbId: "12345678" },
  { id: "mock-2", name: "Villa Pamplemousses", airbnbId: "87654321" },
  { id: "mock-3", name: "Villa Tamarin", airbnbId: "11223344" },
];
