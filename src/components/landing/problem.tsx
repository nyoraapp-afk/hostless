import { Utensils, Moon, Plane, Forward } from "lucide-react";

/**
 * Section "Le problème" — 4 scènes du burn-out hôte Airbnb.
 * Port de v34 p1 #scene (lignes 693-733).
 */
export function Problem() {
  return (
    <section className="bg-cream px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="text-eyebrow mb-3">Le problème</div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
          Votre téléphone <em className="text-aubergine-medium">ne vous quitte plus</em>
        </h2>

        <div className="mt-10 flex flex-col gap-5">
          <Scene
            icon={<Utensils className="h-4 w-4" aria-hidden />}
            time="Au dîner avec vos enfants"
            text="Vous checkez Airbnb sous la table, au cas où un client aurait un souci."
          />
          <Scene
            icon={<Moon className="h-4 w-4" aria-hidden />}
            time="2h du matin"
            text="Vous vous réveillez inquiète d'avoir raté un message urgent."
          />
          <Scene
            icon={<Plane className="h-4 w-4" aria-hidden />}
            time="En vacances"
            text="Vous n'arrivez pas à décrocher, votre téléphone reste ouvert sur Airbnb."
          />
          <Scene
            icon={<Forward className="h-4 w-4" aria-hidden />}
            time="À chaque problème"
            text="Vous forwardez manuellement le message à votre femme de ménage, votre plombier, votre pisciniste…"
          />
        </div>
      </div>
    </section>
  );
}

function Scene({
  icon,
  time,
  text,
}: {
  icon: React.ReactNode;
  time: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-md border border-border bg-surface p-5">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-aubergine-50 text-aubergine">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-aubergine">{time}</div>
        <p className="mt-1 text-sm text-ink-soft leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
