/**
 * Types métier partagés. Source de vérité pour les noms et énumérations.
 * Aligné sur le schéma Prisma cible (cf. plan).
 */

export type PlanSlug = "ESSENTIEL" | "SERENITE";

export const PLAN_LABELS: Record<PlanSlug, string> = {
  ESSENTIEL: "Essentiel",
  SERENITE: "Sérénité",
};

export const PLAN_PRICES: Record<PlanSlug, number> = {
  ESSENTIEL: 89,
  SERENITE: 129,
};

export type DispatchCategory =
  | "MENAGE"
  | "PISCINE"
  | "JARDIN"
  | "MAINTENANCE"
  | "ACCUEIL"
  | "AUTRE";

export const DISPATCH_CATEGORIES: {
  id: DispatchCategory;
  label: string;
  hint: string;
}[] = [
  { id: "MENAGE", label: "Ménage", hint: "Femme de ménage, linge, propreté" },
  { id: "PISCINE", label: "Piscine", hint: "Filtration, eau, équipements piscine" },
  { id: "JARDIN", label: "Jardin", hint: "Espaces verts, arrosage, élagage" },
  { id: "MAINTENANCE", label: "Maintenance", hint: "Plomberie, électricité, dépannage" },
  { id: "ACCUEIL", label: "Accueil", hint: "Check-in, remise des clés, présence sur place" },
  { id: "AUTRE", label: "Autre", hint: "Tout ce qui ne rentre pas dans les autres" },
];

/**
 * État explicite à 4 valeurs — Pattern 2 (décalage action ↔ affichage).
 * Tout champ qui peut être en attente d'une confirmation backend doit utiliser ce type.
 */
export type ResourceState = "actual" | "pending" | "scheduled" | "failed";

export type Urgency = "HIGH" | "MEDIUM" | "LOW";

export type AlertChannel = "WHATSAPP" | "SMS" | "EMAIL";

export type UserRole = "OWNER" | "ADMIN" | "SUPPORT" | "READONLY";

/**
 * Représente un changement différé (changement de plan, ajout de villa, etc.)
 * — Pattern 2 dans le plan.
 */
export type PendingChange<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  scheduledFor: Date | string;
  appliedAt: Date | string | null;
  status: ResourceState;
};
