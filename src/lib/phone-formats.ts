/**
 * Liste des pays supportés pour la saisie de numéros WhatsApp.
 * Préservée du prototype v34 (PHONE_FORMATS), source de vérité unique.
 *
 * `format` = mask de display (ex : "X XX XX XX XX")
 * `e164Length` = longueur attendue après nettoyage (sans le préfixe pays)
 *
 * Note brand : pas de drapeau emoji (règle "aucun emoji dans l'UI"). Le
 * sélecteur de pays affiche seulement le code, l'indicatif et le nom.
 */
export type PhoneCountry = {
  code: string;
  name: string;
  dialCode: string;
  format: string;
  e164Length: number | [number, number]; // single or [min, max]
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "FR", name: "France", dialCode: "+33", format: "X XX XX XX XX", e164Length: 9 },
  { code: "BE", name: "Belgique", dialCode: "+32", format: "XXX XX XX XX", e164Length: 9 },
  { code: "CH", name: "Suisse", dialCode: "+41", format: "XX XXX XX XX", e164Length: 9 },
  { code: "LU", name: "Luxembourg", dialCode: "+352", format: "XXX XXX XXX", e164Length: 9 },
  { code: "MU", name: "Maurice", dialCode: "+230", format: "XXXX XXXX", e164Length: 8 },
  { code: "RE", name: "La Réunion", dialCode: "+262", format: "X XX XX XX XX", e164Length: 9 },
  { code: "MC", name: "Monaco", dialCode: "+377", format: "XX XX XX XX", e164Length: 8 },
  { code: "ES", name: "Espagne", dialCode: "+34", format: "XXX XX XX XX", e164Length: 9 },
  { code: "PT", name: "Portugal", dialCode: "+351", format: "XXX XXX XXX", e164Length: 9 },
  { code: "IT", name: "Italie", dialCode: "+39", format: "XXX XXX XXXX", e164Length: 10 },
  { code: "DE", name: "Allemagne", dialCode: "+49", format: "XXX XXXXXXXX", e164Length: [10, 11] },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44", format: "XXXX XXX XXX", e164Length: 10 },
  { code: "MA", name: "Maroc", dialCode: "+212", format: "X XX XX XX XX", e164Length: 9 },
  { code: "TN", name: "Tunisie", dialCode: "+216", format: "XX XXX XXX", e164Length: 8 },
  { code: "DZ", name: "Algérie", dialCode: "+213", format: "X XX XX XX XX", e164Length: 9 },
  { code: "SN", name: "Sénégal", dialCode: "+221", format: "XX XXX XX XX", e164Length: 9 },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", format: "XX XX XX XX XX", e164Length: 10 },
  { code: "CA", name: "Canada", dialCode: "+1", format: "(XXX) XXX-XXXX", e164Length: 10 },
  { code: "US", name: "États-Unis", dialCode: "+1", format: "(XXX) XXX-XXXX", e164Length: 10 },
  { code: "NL", name: "Pays-Bas", dialCode: "+31", format: "X XXXXXXXX", e164Length: 9 },
];

/**
 * Pays placés en haut du sélecteur (marché principal hostelyo : francophone + DOM/TOM).
 */
export const PRIORITY_COUNTRIES: PhoneCountry["code"][] = [
  "FR",
  "BE",
  "CH",
  "LU",
  "MU",
  "RE",
];

export function findCountry(code: string): PhoneCountry | undefined {
  return PHONE_COUNTRIES.find((c) => c.code === code);
}

/**
 * Vérifie qu'un numéro local (sans +indicatif) a la bonne longueur pour le pays.
 * Renvoie un message d'erreur en français si invalide, sinon null (Pattern 10 — copywriting précis).
 */
export function validatePhone(
  countryCode: string,
  localNumber: string
): string | null {
  const country = findCountry(countryCode);
  if (!country) return "Pays inconnu";

  const digits = localNumber.replace(/\D/g, "");
  const len = country.e164Length;
  const expected = Array.isArray(len) ? `${len[0]}-${len[1]}` : String(len);

  if (!digits) return "Entrez votre numéro de téléphone";
  if (Array.isArray(len)) {
    if (digits.length < len[0] || digits.length > len[1]) {
      return `Le numéro doit contenir ${expected} chiffres en ${country.name}`;
    }
  } else {
    if (digits.length !== len) {
      return `Le numéro doit contenir ${expected} chiffres en ${country.name}`;
    }
  }
  return null;
}

/**
 * Construit le numéro E.164 complet à partir du code pays et du numéro local.
 * Ex: ('FR', '0612345678') → '+33612345678'
 */
export function toE164(countryCode: string, localNumber: string): string {
  const country = findCountry(countryCode);
  if (!country) return localNumber;
  let digits = localNumber.replace(/\D/g, "");
  // strip leading 0 (commun en FR/BE/CH...)
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `${country.dialCode}${digits}`;
}
