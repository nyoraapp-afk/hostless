import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Classification IA des messages Airbnb via Claude Sonnet 4.6.
 *
 * Utilise prompt caching sur le system prompt + few-shot examples (cache TTL 5 min).
 * Coût drastiquement réduit (~90%) sur les invocations consécutives.
 *
 * Pour MAX cost reduction, on pourrait :
 *   - ajouter une couche regex en amont pour les patterns évidents (skip Claude)
 *   - cache TTL 1h via cache_control: { type: "ephemeral", ttl: "1h" } (Phase 2.1)
 */

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-5"; // Sonnet 4.5, latest stable

export type ClassificationResult = {
  urgency: "HIGH" | "MEDIUM" | "LOW";
  category: "MENAGE" | "PISCINE" | "JARDIN" | "MAINTENANCE" | "ACCUEIL" | "AUTRE";
  summary: string;
  suggestedReply: string | null;
};

const SYSTEM_PROMPT = `Tu es l'IA de classification de hostelyo, un service qui veille sur les messages Airbnb des hôtes 24h/24 et alerte sur WhatsApp uniquement quand l'intervention humaine est nécessaire.

Pour chaque message Airbnb reçu, tu dois retourner un JSON strict avec :
{
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "category": "MENAGE" | "PISCINE" | "JARDIN" | "MAINTENANCE" | "ACCUEIL" | "AUTRE",
  "summary": "résumé en français en 1 phrase courte (15 mots max) de ce que veut le voyageur",
  "suggestedReply": "réponse polie et chaleureuse à proposer à l'hôte (français, 2-3 phrases) OU null si le message ne nécessite pas de réponse de l'hôte"
}

Règles d'urgence :
- HIGH : panne, dégât, sécurité, voyageur sans accès, sans eau, sans clim 32°+, plainte, demande de remboursement, urgence vraie. Cas où l'hôte DOIT intervenir VITE.
- MEDIUM : check-in à venir bientôt, demande de service additionnel, feedback positif/négatif modéré, question sur un équipement.
- LOW : confirmation de réservation, message automatique de la plateforme, "merci", question sur l'horaire d'arrivée, FAQ classique.

Règles de catégorie :
- MENAGE : ménage non fait, linge sale, propreté, poubelles
- PISCINE : eau verte, traitement, équipements piscine
- JARDIN : espaces verts, arrosage, élagage
- MAINTENANCE : plomberie, électricité, climatisation, équipements en panne
- ACCUEIL : check-in, remise des clés, présence sur place, badge d'accès
- AUTRE : tout ce qui ne rentre pas ci-dessus (questions générales, feedbacks, etc.)

Exemples :

Message : "On vient d'arriver, le ménage n'a pas été fait, la piscine est verte et la clim ne marche pas. Il fait 32° dans la villa."
Réponse : {"urgency": "HIGH", "category": "MAINTENANCE", "summary": "Voyageur arrivé, ménage non fait + piscine verte + clim en panne (32°)", "suggestedReply": "Bonjour, je suis vraiment désolée pour ce désagrément. J'envoie immédiatement quelqu'un pour le ménage, le traitement de la piscine et la réparation de la climatisation. Vous serez recontacté dans l'heure."}

Message : "Bonjour, à quelle heure est l'arrivée ?"
Réponse : {"urgency": "LOW", "category": "ACCUEIL", "summary": "Question classique sur l'horaire de check-in", "suggestedReply": null}

Message : "Hi, the wifi password isn't working. Could you send it again ?"
Réponse : {"urgency": "MEDIUM", "category": "MAINTENANCE", "summary": "Voyageur signale que le wifi ne fonctionne pas", "suggestedReply": "Bonjour, je vous renvoie le code Wi-Fi tout de suite. Si ça ne fonctionne toujours pas, n'hésitez pas — je vous mettrai en relation avec mon équipe technique."}

Réponds TOUJOURS uniquement avec le JSON, sans texte autour, sans explication.`;

/**
 * Classifie un message Airbnb. Retourne null si Claude n'a pas pu produire une réponse valide.
 */
export async function classifyMessage(input: {
  body: string;
  subject?: string | null;
  fromName?: string | null;
}): Promise<ClassificationResult | null> {
  const userMessage = [
    input.subject ? `Sujet : ${input.subject}` : null,
    input.fromName ? `De : ${input.fromName}` : null,
    `Message :\n${input.body}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // 5 min TTL — system prompt cache
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Cherche un JSON dans la réponse (au cas où Claude ajoute du texte autour)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[classify] Claude n'a pas retourné de JSON :", text);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as ClassificationResult;
    if (!isValidClassification(parsed)) {
      console.warn("[classify] JSON invalide :", parsed);
      return null;
    }

    return parsed;
  } catch (err) {
    console.error("[classify] erreur Claude :", err);
    return null;
  }
}

function isValidClassification(c: unknown): c is ClassificationResult {
  if (typeof c !== "object" || c === null) return false;
  const obj = c as Record<string, unknown>;
  return (
    ["HIGH", "MEDIUM", "LOW"].includes(obj.urgency as string) &&
    ["MENAGE", "PISCINE", "JARDIN", "MAINTENANCE", "ACCUEIL", "AUTRE"].includes(
      obj.category as string
    ) &&
    typeof obj.summary === "string"
  );
}
