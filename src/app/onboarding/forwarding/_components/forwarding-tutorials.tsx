"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

/**
 * 3 tutoriels pas-à-pas pour configurer le forwarding selon le provider.
 *
 * Note : on ne demande pas un forward total de la boîte (illégal et flippant).
 * On demande un FILTRE/RÈGLE qui forward uniquement les emails de
 * `*@airbnb.com` vers l'alias hostelyo. Beaucoup plus propre.
 */
export function ForwardingTutorials({ alias }: { alias: string }) {
  return (
    <Tabs defaultValue="gmail" className="mt-4">
      <TabsList className="w-full">
        <TabsTrigger value="gmail" className="flex-1">
          Gmail
        </TabsTrigger>
        <TabsTrigger value="outlook" className="flex-1">
          Outlook
        </TabsTrigger>
        <TabsTrigger value="icloud" className="flex-1">
          iCloud
        </TabsTrigger>
        <TabsTrigger value="other" className="flex-1">
          Autre
        </TabsTrigger>
      </TabsList>

      <TabsContent value="gmail">
        <GmailTutorial alias={alias} />
      </TabsContent>
      <TabsContent value="outlook">
        <OutlookTutorial alias={alias} />
      </TabsContent>
      <TabsContent value="icloud">
        <ICloudTutorial alias={alias} />
      </TabsContent>
      <TabsContent value="other">
        <OtherTutorial alias={alias} />
      </TabsContent>
    </Tabs>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tutoriels par provider
// ─────────────────────────────────────────────────────────────────

function GmailTutorial({ alias }: { alias: string }) {
  return (
    <Card padding="md" className="space-y-4">
      <Step
        n={1}
        title="Ouvrir les paramètres de transfert Gmail"
        description={
          <>
            Allez sur{" "}
            <a
              href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
              target="_blank"
              rel="noopener"
              className="text-aubergine underline hover:text-aubergine-medium inline-flex items-center gap-1"
            >
              mail.google.com/mail/u/0/#settings/fwdandpop
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            (page <strong>Transfert et POP/IMAP</strong>).
          </>
        }
      />
      <Step
        n={2}
        title='Cliquez sur "Ajouter une adresse de transfert"'
        description={
          <>
            Collez exactement <CodeBox text={alias} /> et confirmez.
          </>
        }
      />
      <Step
        n={3}
        title="Validez le code de confirmation"
        description={
          <>
            Gmail vous enverra un <strong>code de vérification</strong> sur cette adresse.
            On le recevra sur le dashboard hostelyo — vous reviendrez ici pour coller
            le code dans Gmail.
            <br />
            <span className="text-ink-muted text-xs">
              (Cette étape n'apparaîtra qu'une seule fois.)
            </span>
          </>
        }
      />
      <Step
        n={4}
        title="Créez un FILTRE pour ne transférer que les emails Airbnb"
        description={
          <>
            Toujours dans Gmail, allez dans{" "}
            <a
              href="https://mail.google.com/mail/u/0/#settings/filters"
              target="_blank"
              rel="noopener"
              className="text-aubergine underline hover:text-aubergine-medium inline-flex items-center gap-1"
            >
              Filtres et adresses bloquées
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            → <strong>Créer un filtre</strong>. Dans le champ <strong>De</strong>, mettez :{" "}
            <CodeBox text="*@airbnb.com" /> puis cliquez{" "}
            <strong>Créer le filtre</strong>. Cochez{" "}
            <strong>Transférer à : {alias}</strong> puis{" "}
            <strong>Créer le filtre</strong>.
          </>
        }
      />
      <SuccessNote alias={alias} />
    </Card>
  );
}

function OutlookTutorial({ alias }: { alias: string }) {
  return (
    <Card padding="md" className="space-y-4">
      <Step
        n={1}
        title="Ouvrir les règles Outlook"
        description={
          <>
            Allez sur{" "}
            <a
              href="https://outlook.live.com/mail/0/options/mail/rules"
              target="_blank"
              rel="noopener"
              className="text-aubergine underline hover:text-aubergine-medium inline-flex items-center gap-1"
            >
              Outlook · Règles
              <ExternalLink className="h-3 w-3" />
            </a>
            .
          </>
        }
      />
      <Step
        n={2}
        title='Cliquez "Ajouter une nouvelle règle"'
        description={
          <>
            Nom de la règle : <CodeBox text="Transfert hostelyo" />
          </>
        }
      />
      <Step
        n={3}
        title="Condition : Expéditeur contient"
        description={
          <>
            Choisissez "Ajouter une condition" → <strong>Adresse de l'expéditeur inclut</strong>{" "}
            → tapez : <CodeBox text="airbnb.com" />
          </>
        }
      />
      <Step
        n={4}
        title="Action : Transférer à"
        description={
          <>
            Choisissez "Ajouter une action" → <strong>Transférer à</strong> →{" "}
            <CodeBox text={alias} /> → <strong>Enregistrer</strong>.
          </>
        }
      />
      <SuccessNote alias={alias} />
    </Card>
  );
}

function ICloudTutorial({ alias }: { alias: string }) {
  return (
    <Card padding="md" className="space-y-4">
      <Step
        n={1}
        title="Ouvrir iCloud Mail"
        description={
          <>
            Connectez-vous sur{" "}
            <a
              href="https://www.icloud.com/mail"
              target="_blank"
              rel="noopener"
              className="text-aubergine underline hover:text-aubergine-medium inline-flex items-center gap-1"
            >
              icloud.com/mail
              <ExternalLink className="h-3 w-3" />
            </a>
            .
          </>
        }
      />
      <Step
        n={2}
        title="Aller dans les Préférences (icône engrenage en haut)"
        description="Cliquez sur l'engrenage en haut à droite → Préférences → onglet Règles."
      />
      <Step
        n={3}
        title='Cliquez "Ajouter une règle"'
        description={
          <>
            Si <strong>De → contient</strong> :{" "}
            <CodeBox text="airbnb.com" />
            <br />
            Alors <strong>Transférer à → autre adresse</strong> :{" "}
            <CodeBox text={alias} />
            <br />
            Cochez "Et marquer comme lu" si vous voulez. <strong>Enregistrer</strong>.
          </>
        }
      />
      <SuccessNote alias={alias} />
    </Card>
  );
}

function OtherTutorial({ alias }: { alias: string }) {
  return (
    <Card padding="md" className="space-y-4">
      <p className="text-sm text-ink-soft">
        La plupart des fournisseurs (Yahoo, Free, Orange, Proton, etc.) permettent de
        créer une <strong>règle de transfert</strong> dans leurs paramètres :
      </p>
      <ul className="list-disc ml-5 text-sm text-ink-soft space-y-1.5">
        <li>
          Identifiez les emails dont l'expéditeur contient <CodeBox text="airbnb.com" />
        </li>
        <li>
          Transférez-les vers <CodeBox text={alias} />
        </li>
      </ul>
      <p className="text-xs text-ink-muted">
        Si vous galérez, écrivez-nous à{" "}
        <a
          href="mailto:support@hostelyo.com"
          className="text-aubergine underline hover:text-aubergine-medium"
        >
          support@hostelyo.com
        </a>{" "}
        avec le nom de votre provider, on vous fait un tutoriel sur mesure.
      </p>
      <SuccessNote alias={alias} />
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// Atomes
// ─────────────────────────────────────────────────────────────────

function Step({
  n,
  title,
  description,
}: {
  n: number;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-aubergine text-on-aubergine text-xs font-semibold">
        {n}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="font-medium text-sm text-ink">{title}</div>
        <div className="mt-1 text-sm text-ink-soft leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

function CodeBox({ text }: { text: string }) {
  return (
    <code className="inline-block rounded bg-cream-warm border border-border px-1.5 py-0.5 font-mono text-xs text-aubergine break-all">
      {text}
    </code>
  );
}

function SuccessNote({ alias }: { alias: string }) {
  return (
    <div className="rounded-sm border border-success/30 bg-success/5 p-3 text-xs text-ink-soft">
      <strong className="text-success">Une fois fait :</strong> envoyez-vous un email
      depuis Airbnb (ou attendez le prochain message naturel). hostelyo le recevra à
      l'adresse <CodeBox text={alias} />, le classera, et déclenchera une alerte
      WhatsApp si c'est urgent.
    </div>
  );
}
