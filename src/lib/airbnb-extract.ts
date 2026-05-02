/**
 * Extraction des listings Airbnb depuis les emails de notification.
 *
 * Stratégie pragmatique pour le MVP :
 *   - Listing ID via regex sur les URLs `airbnb.tld/rooms/XXXXX` (fiable ~99%)
 *   - Nom de la villa : extraction best-effort depuis le subject (patterns FR + EN)
 *   - Fallback : "Villa #<id>" si aucun nom détectable — l'utilisateur peut renommer
 *     dans /onboarding/villas ou plus tard depuis le dashboard.
 */

export type DetectedListing = {
  airbnbId: string;
  name: string;
};

/**
 * Type minimal accepté par les helpers d'extraction.
 * Compatible avec ParsedAirbnbEmail mais aussi avec les versions sérialisées
 * (Inngest step.run sérialise les Date en string — on n'utilise pas la date ici).
 */
export type EmailForExtraction = {
  subject: string | null;
  body: string;
};

/**
 * Extrait tous les listing IDs Airbnb uniques présents dans un email.
 * Cherche dans le body les URLs de la forme `airbnb.com/rooms/<id>` ou variantes
 * locales (.fr, .co.uk, .de, .es, etc.).
 */
export function extractListingIds(body: string): string[] {
  const pattern = /airbnb\.(?:com|fr|co\.uk|de|es|it|nl|pt|com\.br|com\.au)\/rooms\/(\d{5,12})/gi;
  const ids = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    ids.add(match[1]);
  }
  return Array.from(ids);
}

/**
 * Tente d'extraire un nom de villa depuis un sujet d'email Airbnb.
 * Couvre les patterns FR + EN les plus courants. Retourne null si aucun match.
 */
export function extractVillaNameFromSubject(subject: string | null): string | null {
  if (!subject) return null;

  // Nettoyage initial : virer les préfixes Airbnb classiques
  let s = subject
    .replace(/^(Re:|Fwd?:|Tr:|TR:)\s*/i, "")
    .replace(/^\[Airbnb\]\s*/i, "")
    .replace(/^Airbnb:\s*/i, "")
    .trim();

  // Patterns du plus spécifique au plus générique
  const patterns: RegExp[] = [
    // "X souhaite réserver [NOM]" / "X wants to book [NOM]"
    /(?:souhaite r[eé]server|wants to book|booked|a r[eé]serv[eé])\s+(.+?)\s*$/i,
    // "Réservation pour [NOM]" / "Reservation for [NOM]"
    /(?:r[eé]servation|reservation|booking|s[eé]jour)\s+(?:pour|for|at|de|chez|à)\s+(.+?)\s*$/i,
    // "Message de X concernant [NOM]" / "Message from X about [NOM]"
    /(?:concernant|about|au sujet de|regarding|sur)\s+(.+?)\s*$/i,
    // "Annonce/Listing: [NOM]"
    /(?:annonce|listing)\s*[:—–-]\s*(.+?)\s*$/i,
    // ": [NOM]" en fin de subject (cas générique)
    /[:—–-]\s*([^:—–-]+?)\s*$/,
    // [NOM] entre guillemets
    /[«""'](.+?)[»""']/,
  ];

  for (const p of patterns) {
    const m = s.match(p);
    if (m && m[1]) {
      const name = cleanCandidateName(m[1]);
      if (name && isValidVillaName(name)) return name;
    }
  }

  return null;
}

/**
 * Construit la liste finale des listings détectés depuis un email.
 * - 1 entrée par listing ID unique trouvé
 * - Le nom est extrait du subject (best-effort) ou tombe sur "Villa #<id>"
 */
export function extractListingsFromEmail(
  email: EmailForExtraction
): DetectedListing[] {
  const ids = extractListingIds(email.body);
  if (ids.length === 0) return [];

  const fallbackName = extractVillaNameFromSubject(email.subject);

  return ids.map((airbnbId) => ({
    airbnbId,
    name: fallbackName || `Villa #${airbnbId}`,
  }));
}

/**
 * Agrège plusieurs emails pour produire la liste finale dédupliquée des villas
 * détectées chez un utilisateur.
 *
 * Si le même listing apparaît dans plusieurs emails avec des noms différents,
 * on garde le premier nom non-fallback rencontré (= le plus probable d'être
 * réel, vu que les emails de réservation sont les plus structurés).
 */
export function aggregateDetectedListings(
  emails: EmailForExtraction[]
): DetectedListing[] {
  const byId = new Map<string, string>();

  for (const email of emails) {
    const listings = extractListingsFromEmail(email);
    for (const l of listings) {
      const existing = byId.get(l.airbnbId);
      // Si pas encore vu, on prend ce nom
      if (!existing) {
        byId.set(l.airbnbId, l.name);
        continue;
      }
      // Si le nom existant est un fallback "Villa #X" et qu'on a un vrai nom, on remplace
      if (existing.startsWith("Villa #") && !l.name.startsWith("Villa #")) {
        byId.set(l.airbnbId, l.name);
      }
    }
  }

  return Array.from(byId.entries()).map(([airbnbId, name]) => ({
    airbnbId,
    name,
  }));
}

// ─────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────

function cleanCandidateName(raw: string): string {
  return raw
    .replace(/[.,;!?]+\s*$/, "") // ponctuation finale
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Filtre les noms qui sont probablement de faux positifs :
 *  - Trop courts ou trop longs
 *  - Contiennent des chiffres dominants (probable prix ou date)
 *  - Mots typiques de subject sans nom de villa réel
 */
function isValidVillaName(name: string): boolean {
  if (name.length < 3 || name.length > 80) return false;

  // Trop de chiffres = probable date / prix / numéro
  const digitRatio = (name.match(/\d/g)?.length ?? 0) / name.length;
  if (digitRatio > 0.4) return false;

  // Mots-blocklist (cas où le pattern a matché du flou)
  const blocklist = [
    /^(votre|your|notre|our|new|nouveau|nouvelle)$/i,
    /^(message|email|notification|alerte|alert)$/i,
    /^(airbnb|paiement|payment|facture|invoice)$/i,
  ];
  for (const b of blocklist) {
    if (b.test(name)) return false;
  }

  return true;
}
