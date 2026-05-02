import type { Metadata } from "next";
import { StaticPageShell } from "@/components/static-page-shell";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de hostelyo.",
};

export default function LegalPage() {
  return (
    <StaticPageShell
      eyebrow="Informations légales"
      title={
        <>
          Mentions <em className="text-aubergine-medium">légales</em>
        </>
      }
      lastUpdate="26 avril 2026"
    >
      <div className="rounded-md border border-gold/30 bg-gold-soft/30 p-4 text-xs text-[#7A6432]">
        <strong>Document à compléter avant ouverture publique.</strong> Les sections
        ci-dessous sont des modèles à valider par un juriste, en fonction de votre
        statut juridique définitif et de votre pays d'opération (France, Maurice,
        autre).
      </div>

      <h2>1. Éditeur du site</h2>
      <p>
        <strong>hostelyo</strong>
        <br />
        Édité par : [Nom de la société ou nom du fondateur]
        <br />
        Statut : [SAS / SARL / Auto-entrepreneur / Autre]
        <br />
        Capital social : [si applicable]
        <br />
        Siège social : [adresse complète]
        <br />
        SIREN / RCS : [numéro]
        <br />
        Numéro de TVA : [si applicable]
        <br />
        Directeur de la publication : [Nom du fondateur]
        <br />
        Contact : <a href="mailto:contact@hostelyo.com">contact@hostelyo.com</a>
      </p>

      <h2>2. Hébergement</h2>
      <p>
        Le site hostelyo est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon
        Ave #4133, Walnut, CA 91789, États-Unis. <a href="https://vercel.com">vercel.com</a>
      </p>
      <p>
        Les données utilisateur sont stockées sur <strong>Supabase</strong> (Postgres),
        région Irlande (UE). <a href="https://supabase.com">supabase.com</a>
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L'ensemble du contenu de ce site (textes, graphismes, logo, icônes, sons,
        logiciels) est la propriété exclusive de hostelyo ou de ses partenaires.
        Toute reproduction, diffusion ou utilisation, totale ou partielle, sans
        autorisation préalable est strictement interdite.
      </p>

      <h2>4. Conditions d'utilisation</h2>
      <p>
        L'utilisation du service hostelyo implique l'acceptation pleine et entière
        des conditions générales d'utilisation, consultables sur ce site. Ces
        conditions peuvent être modifiées à tout moment. Les utilisateurs sont donc
        invités à les consulter régulièrement.
      </p>

      <h2>5. Responsabilité</h2>
      <p>
        hostelyo met en œuvre tous les moyens pour assurer la fiabilité et la
        disponibilité de son service, sans toutefois pouvoir garantir une
        disponibilité 100%. Le service est fourni "tel quel". hostelyo ne saurait
        être tenu responsable des conséquences d'un message Airbnb non reçu, mal
        classé ou non transmis dans les délais — la responsabilité finale de la
        gestion de votre activité Airbnb relève de vous-même.
      </p>

      <h2>6. Médiateur de la consommation</h2>
      <p>
        Conformément à l'article L612-1 du Code de la consommation, vous pouvez
        recourir gratuitement à un médiateur de la consommation en vue de la
        résolution amiable d'un litige avec hostelyo.
      </p>
      <p>
        Médiateur : [à compléter selon le pays d'opération]
      </p>

      <h2>7. Droit applicable</h2>
      <p>
        Le présent site et l'utilisation du service hostelyo sont régis par le droit
        [français / mauricien / autre]. Tout litige sera de la compétence exclusive
        des tribunaux de [ville à compléter].
      </p>
    </StaticPageShell>
  );
}
