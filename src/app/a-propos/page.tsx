import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { StaticPageShell } from "@/components/static-page-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "hostelyo est né d'une frustration concrète : ne plus pouvoir décrocher de son téléphone par peur de rater un message Airbnb urgent.",
};

export default function AProposPage() {
  return (
    <StaticPageShell
      eyebrow="À propos"
      title={
        <>
          Pour celles et ceux qui font de l'Airbnb leur{" "}
          <em className="text-aubergine-medium">métier</em>
        </>
      }
    >
      <p>
        hostelyo est né d'une frustration simple : <strong>les conciergeries et hôtes
        Airbnb professionnels ne peuvent plus décrocher</strong>. Pas par choix, par peur
        — peur de rater un check-in qui foire à 23h, une fuite d'eau, un voyageur enfermé
        dehors. Le coût mental est immense : insomnie, vie sociale impossible, vacances
        gâchées.
      </p>

      <p>
        On a regardé les solutions existantes. Aucune ne nous satisfaisait :
      </p>
      <ul>
        <li>Les outils de gestion locative font tout sauf l'essentiel : <em>filtrer le bruit</em></li>
        <li>Les bots de réponse automatique cassent la relation humaine</li>
        <li>Les apps de notification pure ne distinguent pas l'urgent du routinier</li>
      </ul>

      <p>
        On a donc construit l'outil qu'on aurait voulu nous-mêmes : <strong>une IA qui
        lit chaque message Airbnb 24h/24 et n'alerte que sur les vraies urgences</strong>,
        sur WhatsApp, là où vous êtes déjà. En option Sérénité, elle dispatche
        automatiquement vers la bonne personne — votre femme de ménage, votre plombier,
        votre pisciniste — sans réveiller votre nuit.
      </p>

      <h2>Notre conviction</h2>
      <p>
        Le métier d'hôte Airbnb professionnel mérite un outil qui respecte deux choses :
      </p>
      <ul>
        <li>
          <strong>Votre temps.</strong> Vous ne voulez pas une notification de plus —
          vous voulez moins, mais juste les bonnes.
        </li>
        <li>
          <strong>Votre relation aux voyageurs.</strong> Les automatismes Airbnb que vous
          avez configurés sont précieux. hostelyo ne s'y substitue pas, il prend le
          relais uniquement quand votre intervention humaine est nécessaire.
        </li>
      </ul>

      <h2>Ce qu'on n'est pas</h2>
      <ul>
        <li>Un PMS / channel manager qui complique votre stack</li>
        <li>Un bot qui réponde à votre place avec des messages génériques</li>
        <li>Une plateforme pour gérer toute votre activité — vous gardez Airbnb, on
          veille juste pour vous</li>
      </ul>

      <h2>L'équipe</h2>
      <p>
        hostelyo est porté par une équipe basée à Maurice, avec une volonté forte de
        servir un marché francophone d'abord (France métropolitaine, DOM-TOM, Belgique,
        Suisse, Maurice, Afrique francophone), puis l'international.
      </p>
      <p>
        Nous croyons aux outils <em>calmes</em> : pas d'emojis criards, pas de couleurs
        saturées, pas de gamification. Une interface raffinée comme un cahier de notes,
        une voix posée comme une amie pro.
      </p>

      <h2>Notre engagement</h2>
      <p>
        <strong>Aucun accès en écriture à votre boîte mail.</strong> Lecture seule, scope
        Gmail readonly. Vous pouvez révoquer l'accès à tout moment depuis votre compte
        Google.
      </p>
      <p>
        <strong>Aucune donnée vendue à des tiers.</strong> Nos seuls sous-traitants sont
        ceux nécessaires au service (Stripe, Twilio, Anthropic, Resend, Supabase) — tous
        certifiés RGPD. Voir{" "}
        <Link href="/privacy">notre politique de confidentialité</Link> pour le détail.
      </p>
      <p>
        <strong>Pas d'engagement.</strong> Vous résiliez en deux clics depuis votre
        dashboard. Vos données sont conservées 90 jours pour exports comptables, puis
        supprimées.
      </p>

      <h2>Le futur</h2>
      <p>
        On vient de lancer la beta. La feuille de route 2026 :
      </p>
      <ul>
        <li>Support multi-langues (anglais d'abord, puis espagnol, italien)</li>
        <li>Connexion alternative par transfert email (Outlook, iCloud, Yahoo, Proton)</li>
        <li>Suggestions de réponses pré-rédigées par l'IA pour les messages routiniers
          que vous voulez quand même valider</li>
        <li>Intégration calendrier (Google, Apple) pour ne pas vous alerter pendant
          vos rendez-vous</li>
        <li>App mobile native (iOS + Android)</li>
      </ul>

      <p>
        Vous avez une suggestion ? Une critique ? Écrivez-nous à{" "}
        <a href="mailto:hello@hostelyo.com">hello@hostelyo.com</a> — on lit tout, on
        répond toujours.
      </p>

      <div className="mt-12 not-prose flex flex-col items-center gap-3 border-t border-border pt-8">
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <Heart className="h-4 w-4 text-powder" aria-hidden />
          Construit avec soin pour des professionnelles exigeantes
        </div>
        <Button asChild size="lg" className="mt-3">
          <Link href="/login">
            Essayer hostelyo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </StaticPageShell>
  );
}
