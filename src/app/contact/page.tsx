import type { Metadata } from "next";
import { Mail, MessageCircle, Clock } from "lucide-react";
import { StaticPageShell } from "@/components/static-page-shell";
import { Card } from "@/components/ui/card";
import { ContactForm } from "./_components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Une question, un souci, une suggestion ? Écrivez-nous, nous répondons sous 24h ouvrées.",
};

export default function ContactPage() {
  return (
    <StaticPageShell
      eyebrow="Contact"
      title={
        <>
          Une <em className="text-aubergine-medium">question</em> ?
        </>
      }
    >
      <p>
        Que vous utilisiez déjà hostelyo ou que vous hésitiez à essayer, écrivez-nous
        — nous répondons sous 24h ouvrées en français ou en anglais.
      </p>

      <div className="mt-8 grid gap-3 not-prose sm:grid-cols-3">
        <ContactCard
          icon={<Mail className="h-4 w-4" aria-hidden />}
          title="Email"
          description={
            <a
              href="mailto:support@hostelyo.com"
              className="text-aubergine font-mono text-sm hover:underline"
            >
              support@hostelyo.com
            </a>
          }
        />
        <ContactCard
          icon={<MessageCircle className="h-4 w-4" aria-hidden />}
          title="Pour quoi"
          description={
            <span className="text-xs text-ink-soft">
              Bug, suggestion, configuration, facturation, presse…
            </span>
          }
        />
        <ContactCard
          icon={<Clock className="h-4 w-4" aria-hidden />}
          title="Délai"
          description={
            <span className="text-xs text-ink-soft">
              24h ouvrées max · Lun-Ven, 9h-18h heure de Maurice (UTC+4)
            </span>
          }
        />
      </div>

      <h2>Ou utilisez le formulaire</h2>
      <p>
        Si vous préférez, écrivez-nous directement ici — votre message arrive sur la même
        adresse <code>support@hostelyo.com</code> que par email.
      </p>

      <div className="mt-6 not-prose">
        <ContactForm />
      </div>

      <p className="mt-10 text-xs text-ink-muted">
        Pour les questions de confidentialité ou suppression de compte, écrivez à{" "}
        <a href="mailto:privacy@hostelyo.com">privacy@hostelyo.com</a>.
      </p>
    </StaticPageShell>
  );
}

function ContactCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <Card padding="md" variant="muted">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-aubergine text-on-aubergine">
          {icon}
        </div>
        <span className="text-eyebrow">{title}</span>
      </div>
      <div>{description}</div>
    </Card>
  );
}
