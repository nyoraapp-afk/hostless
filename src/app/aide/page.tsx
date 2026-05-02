import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageShell } from "@/components/static-page-shell";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Aide & support",
  description: "Questions fréquentes et contact support hostelyo.",
};

export default function AidePage() {
  return (
    <StaticPageShell
      eyebrow="Centre d'aide"
      title={
        <>
          On vous <em className="text-aubergine-medium">répond</em>
        </>
      }
    >
      <p>
        Vous trouverez ici les réponses aux questions les plus fréquentes.
        Si vous ne trouvez pas votre réponse, contactez-nous directement.
      </p>

      <div className="mt-8 rounded-md border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 mt-0.5 flex-shrink-0 text-aubergine" aria-hidden />
          <div>
            <h3 className="font-serif text-base font-medium text-aubergine">Contact direct</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Écrivez-nous à{" "}
              <a href="mailto:support@hostelyo.com">support@hostelyo.com</a>.
              Nous répondons sous 24h en semaine.
            </p>
          </div>
        </div>
      </div>

      <h2>Comment fonctionne hostelyo ?</h2>
      <p>
        Une fois connecté avec votre compte Google, hostelyo lit en continu votre
        boîte mail Airbnb (lecture seule). Une IA analyse chaque message reçu et
        décide si une intervention est nécessaire :
      </p>
      <ul>
        <li>
          <strong>Pas urgent</strong> (FAQ classique, confirmation de réservation) →
          on ne vous dérange pas. Airbnb répond automatiquement avec vos messages
          pré-configurés.
        </li>
        <li>
          <strong>Urgent</strong> (panne, plainte, sécurité) → vous recevez immédiatement
          une alerte WhatsApp avec le résumé du problème.
        </li>
        <li>
          <strong>Avec Sérénité</strong> → l'alerte part en plus directement à votre
          intervenant (ménage, piscine, plombier…) selon la catégorie du problème.
          Vous restez en copie.
        </li>
      </ul>

      <h2>Pourquoi connecter Google ?</h2>
      <p>
        Airbnb envoie tous les messages de vos voyageurs à votre boîte mail. Pour les
        lire en continu, hostelyo a besoin d'accéder à cette boîte. Nous demandons
        uniquement le scope <strong>gmail.readonly</strong> — nous ne pouvons pas
        envoyer d'emails ni modifier votre boîte. Vous pouvez révoquer cet accès à
        tout moment depuis votre compte Google.
      </p>

      <h2>Différence Essentiel vs Sérénité ?</h2>
      <p>
        <strong>Essentiel (89€/villa/mois)</strong> — vous recevez une alerte WhatsApp
        à chaque urgence détectée. C'est vous qui appelez ensuite votre équipe.
      </p>
      <p>
        <strong>Sérénité (129€/villa/mois)</strong> — hostelyo prévient directement
        l'intervenant compétent (ménage, piscine, jardin, maintenance, accueil) selon
        la catégorie du problème. Vous restez en copie de chaque envoi.
      </p>

      <h2>Comment ajouter ou retirer une villa ?</h2>
      <p>
        Depuis votre dashboard, onglet <strong>Villas</strong>, bouton <strong>Ajouter</strong>.
        Pour retirer, cliquez l'icône corbeille à côté de la villa. Une confirmation
        avec le récapitulatif d'impact (alertes historiques, monitoring) vous est
        demandée avant suppression.
      </p>

      <h2>Comment changer mon numéro WhatsApp ?</h2>
      <p>
        Onglet <strong>Compte</strong> du dashboard, section "Numéro d'alerte WhatsApp",
        bouton <strong>Modifier</strong>. Un code de vérification vous sera envoyé sur
        le nouveau numéro pour confirmation.
      </p>

      <h2>Comment résilier mon abonnement ?</h2>
      <p>
        Onglet <strong>Compte</strong>, section "Zone sensible", bouton <strong>Résilier</strong>.
        Votre service reste actif jusqu'à la fin de la période en cours (date affichée
        explicitement). Aucun prélèvement supplémentaire après cette date.
      </p>

      <h2>Je ne reçois plus mes alertes</h2>
      <p>
        Trois choses à vérifier dans cet ordre :
      </p>
      <ul>
        <li>
          Votre statut dans Twilio sandbox WhatsApp est encore actif (renvoyer{" "}
          <code>join principal-western</code> au <strong>+1 415 523 8886</strong> si
          besoin).
        </li>
        <li>
          Votre numéro WhatsApp dans le dashboard est <strong>vérifié</strong> (badge vert).
        </li>
        <li>
          Votre connexion Google est encore active — si vous voyez un badge "OAuth
          expiré" sur votre compte, reconnectez-vous via le bouton{" "}
          <Link href="/login">Se connecter</Link>.
        </li>
      </ul>

      <p className="mt-8 text-ink-muted text-xs">
        Une question qui n'est pas listée ?{" "}
        <a href="mailto:support@hostelyo.com">Écrivez-nous</a>.
      </p>

      <div className="mt-10 flex justify-center">
        <Button asChild>
          <Link href="/dashboard">Retour au dashboard</Link>
        </Button>
      </div>
    </StaticPageShell>
  );
}
