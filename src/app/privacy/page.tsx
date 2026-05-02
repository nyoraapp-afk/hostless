import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageShell } from "@/components/static-page-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment hostelyo traite vos données personnelles.",
};

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Vos données"
      title={
        <>
          Politique de <em className="text-aubergine-medium">confidentialité</em>
        </>
      }
      lastUpdate="26 avril 2026"
    >
      <div className="rounded-md border border-gold/30 bg-gold-soft/30 p-4 text-xs text-[#7A6432]">
        <strong>Document à valider par un juriste avant ouverture publique.</strong>{" "}
        Le contenu ci-dessous est conforme aux principes du RGPD mais doit être
        adapté à votre statut juridique et à votre localisation.
      </div>

      <h2>Notre engagement</h2>
      <p>
        hostelyo prend la protection de vos données personnelles très au sérieux.
        Cette politique explique <strong>quelles données nous collectons, pourquoi,
        comment elles sont stockées</strong>, et <strong>comment vous pouvez les
        gérer ou les supprimer</strong> à tout moment.
      </p>

      <h2>Quelles données collectons-nous ?</h2>
      <h3>Données fournies par vous</h3>
      <ul>
        <li>
          <strong>Email Google</strong> — pour vous identifier et vous envoyer la
          facture.
        </li>
        <li>
          <strong>Nom (depuis Google)</strong> — pour personnaliser votre dashboard.
        </li>
        <li>
          <strong>Numéro WhatsApp</strong> — pour vous envoyer les alertes urgentes.
        </li>
        <li>
          <strong>Nom + numéro WhatsApp de vos intervenants</strong> (Sérénité) — pour
          dispatcher les alertes au bon contact.
        </li>
        <li>
          <strong>Identifiants Airbnb de vos villas</strong> — pour identifier les
          messages associés.
        </li>
        <li>
          <strong>Données de paiement</strong> — gérées par <a href="https://stripe.com">Stripe</a>,
          jamais stockées chez nous. Nous conservons uniquement un identifiant client
          Stripe (pas votre numéro de carte).
        </li>
      </ul>

      <h3>Données accédées via OAuth Google</h3>
      <ul>
        <li>
          <strong>Vos emails Airbnb</strong> — uniquement les emails dont l'expéditeur
          est <code>airbnb.com</code>. Scope demandé : <code>gmail.readonly</code> (lecture
          seule, jamais d'envoi ni de modification de votre boîte).
        </li>
      </ul>

      <h3>Données générées automatiquement</h3>
      <ul>
        <li>
          <strong>Logs d'audit</strong> de vos actions sur le service (création/suppression
          de villa, changement de forfait, etc.) pour traçabilité et résolution
          d'incidents.
        </li>
        <li>
          <strong>Historique des alertes envoyées</strong> (date, canal, statut de
          livraison).
        </li>
      </ul>

      <h2>Pourquoi traitons-nous ces données ?</h2>
      <ul>
        <li>
          <strong>Fournir le service</strong> : monitoring 24/7 de vos messages Airbnb,
          envoi d'alertes WhatsApp, dispatch vers vos intervenants.
        </li>
        <li>
          <strong>Facturation</strong> : gestion de votre abonnement via Stripe.
        </li>
        <li>
          <strong>Support client</strong> : résolution de vos demandes par email.
        </li>
        <li>
          <strong>Améliorer le service</strong> : statistiques anonymisées sur la
          précision de la classification IA.
        </li>
      </ul>

      <h2>Où sont stockées vos données ?</h2>
      <p>
        Vos données sont hébergées sur <strong>Supabase</strong> (PostgreSQL),
        région <strong>Irlande (Union Européenne)</strong>. Ce choix garantit la
        conformité RGPD et la résidence des données en zone européenne.
      </p>
      <p>
        Les paiements transitent par <strong>Stripe</strong>, certifié PCI-DSS. Les
        alertes WhatsApp sont envoyées via <strong>Twilio</strong> (États-Unis).
      </p>

      <h2>Combien de temps les conservons-nous ?</h2>
      <ul>
        <li>
          <strong>Données de compte</strong> : tant que votre abonnement est actif,
          puis 30 jours après résiliation pour que vous puissiez réactiver votre
          compte. Suppression définitive ensuite.
        </li>
        <li>
          <strong>Historique des alertes</strong> : 90 jours pour permettre votre
          export comptable, puis suppression.
        </li>
        <li>
          <strong>Logs d'audit</strong> : 1 an, pour les obligations légales et la
          résolution d'incidents.
        </li>
        <li>
          <strong>Factures</strong> : 10 ans (obligation légale comptable).
        </li>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez à tout moment du droit de :
      </p>
      <ul>
        <li>
          <strong>Accéder</strong> à vos données (export complet sur demande)
        </li>
        <li>
          <strong>Rectifier</strong> les informations inexactes
        </li>
        <li>
          <strong>Supprimer</strong> votre compte et toutes vos données associées
        </li>
        <li>
          <strong>Limiter ou opposer</strong> le traitement
        </li>
        <li>
          <strong>Portabilité</strong> : récupérer vos données dans un format
          réutilisable
        </li>
        <li>
          <strong>Révoquer l'accès Google</strong> à tout moment depuis{" "}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener">
            myaccount.google.com/permissions
          </a>
        </li>
      </ul>
      <p>
        Pour exercer un de ces droits, écrivez-nous à{" "}
        <a href="mailto:privacy@hostelyo.com">privacy@hostelyo.com</a>. Nous répondons
        sous 30 jours maximum.
      </p>

      <h2>Cookies</h2>
      <p>
        hostelyo utilise uniquement des <strong>cookies essentiels</strong> au
        fonctionnement du service (session d'authentification). Aucun cookie de
        tracking, de publicité ou d'analyse tiers n'est posé sans votre consentement
        explicite.
      </p>

      <h2>Sécurité</h2>
      <p>
        Toutes les communications avec hostelyo sont chiffrées en HTTPS (TLS 1.3).
        Les mots de passe DB sont stockés hachés. Les tokens OAuth Google sont
        chiffrés au repos. L'accès aux données est restreint aux seuls employés
        habilités, avec journalisation des accès.
      </p>

      <h2>Sous-traitants</h2>
      <p>
        Nous faisons appel aux sous-traitants suivants, tous certifiés et conformes
        RGPD :
      </p>
      <ul>
        <li><strong>Vercel</strong> — hébergement applicatif</li>
        <li><strong>Supabase</strong> — base de données et authentification</li>
        <li><strong>Stripe</strong> — paiement</li>
        <li><strong>Twilio</strong> — envoi WhatsApp / SMS</li>
        <li><strong>Anthropic</strong> — classification IA des messages (les messages sont envoyés à l'API Claude pour analyse, sans entraînement du modèle)</li>
        <li><strong>Resend</strong> — envoi d'emails transactionnels</li>
        <li><strong>Google</strong> — OAuth + accès Gmail readonly</li>
      </ul>

      <h2>Modifications</h2>
      <p>
        Cette politique peut être mise à jour. Toute modification importante vous
        sera notifiée par email avant prise d'effet.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question relative à vos données, écrivez-nous à{" "}
        <a href="mailto:privacy@hostelyo.com">privacy@hostelyo.com</a>.
      </p>

      <p className="mt-8 text-ink-muted text-xs">
        Voir aussi : <Link href="/legal">Mentions légales</Link> · <Link href="/aide">Aide</Link>
      </p>
    </StaticPageShell>
  );
}
