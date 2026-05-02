"use client";

import * as React from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { Card } from "@/components/ui/card";
import { Toaster, toast } from "@/components/ui/toaster";
import { sendContactMessage } from "../_actions";

const TOPICS = [
  { id: "bug", label: "Bug technique" },
  { id: "feature", label: "Suggestion produit" },
  { id: "billing", label: "Facturation" },
  { id: "config", label: "Configuration / aide" },
  { id: "other", label: "Autre" },
] as const;

type Topic = (typeof TOPICS)[number]["id"];

export function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [topic, setTopic] = React.useState<Topic>("config");
  const [errors, setErrors] = React.useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  function validate(): boolean {
    const e: Partial<Record<string, string>> = {};
    if (!name.trim()) e.name = "Votre nom svp.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Adresse email invalide.";
    }
    if (subject.trim().length < 3) e.subject = "Sujet trop court (3 caractères min).";
    if (message.trim().length < 10) e.message = "Détaillez un peu (10 caractères min).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        topic,
      });
      if (!result.ok) {
        toast.error("Envoi impossible", { description: result.error });
        return;
      }
      setSent(true);
      toast.success("Message envoyé");
    } catch (err) {
      toast.error("Envoi impossible", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card padding="md" className="border-success/30 bg-success/5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-success" aria-hidden />
          <div className="text-sm">
            <p className="font-medium text-aubergine">Message envoyé</p>
            <p className="mt-1 text-ink-soft">
              Nous l'avons reçu et vous répondrons sous 24h ouvrées à <strong>{email}</strong>.
              Pensez à vérifier vos spams si la réponse ne vous parvient pas.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSent(false);
                setName("");
                setEmail("");
                setSubject("");
                setMessage("");
                setTopic("config");
              }}
            >
              Envoyer un autre message
            </Button>
          </div>
        </div>
        <Toaster />
      </Card>
    );
  }

  return (
    <Card padding="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Votre nom" htmlFor="contact-name" required error={errors.name}>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Jeanne Dupont"
              hasError={!!errors.name}
              autoComplete="name"
            />
          </Field>
          <Field label="Votre email" htmlFor="contact-email" required error={errors.email}>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="vous@exemple.com"
              hasError={!!errors.email}
              autoComplete="email"
            />
          </Field>
        </div>

        <Field
          label="Catégorie"
          htmlFor="contact-topic"
          hint="Pour qu'on route votre message à la bonne personne."
        >
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value as Topic)}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-4 text-base text-ink hover:border-aubergine-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aubergine focus-visible:border-aubergine"
          >
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Sujet" htmlFor="contact-subject" required error={errors.subject}>
          <Input
            id="contact-subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
            }}
            placeholder="Court résumé en quelques mots"
            hasError={!!errors.subject}
          />
        </Field>

        <Field label="Votre message" htmlFor="contact-message" required error={errors.message}>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
            }}
            placeholder="Décrivez ce qui se passe, ce que vous attendiez, et tout ce qui peut aider à comprendre."
            rows={6}
            className={
              "flex w-full rounded-sm border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aubergine focus-visible:border-aubergine resize-y " +
              (errors.message ? "border-error border-2 bg-error/5" : "border-border hover:border-aubergine-soft")
            }
          />
        </Field>

        <Button
          type="submit"
          isLoading={submitting}
          loadingText="Envoi en cours…"
          leftIcon={<Send className="h-3.5 w-3.5" aria-hidden />}
        >
          Envoyer le message
        </Button>
      </form>
      <Toaster />
    </Card>
  );
}
