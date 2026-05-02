"use client";

import * as React from "react";
import { clearOnboarding } from "@/lib/onboarding-state";

/**
 * Petit composant client qui vide le sessionStorage d'onboarding
 * une fois que la page success est rendue. Aucun rendu visible.
 */
export function ClearOnboardingEffect() {
  React.useEffect(() => {
    clearOnboarding();
  }, []);
  return null;
}
