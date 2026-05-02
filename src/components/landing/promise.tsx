import { Check, Sparkles } from "lucide-react";

/**
 * Section "La promesse" — encart aubergine avec les 4 promesses clés.
 * Port de v34 p1 #promise-box (lignes 736-756).
 */
export function Promise() {
  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl rounded-2xl bg-aubergine px-7 py-10 text-on-aubergine sm:px-10 sm:py-12">
        <h2 className="font-serif text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
          hostelyo veille jour et nuit.
          <br />
          <em className="text-powder">Mais vous, vous vivez.</em>
        </h2>

        <ul className="mt-7 flex flex-col gap-4">
          <Point>
            Votre téléphone ne sonne <strong>que pour ce qui mérite votre attention</strong>
          </Point>
          <Point>
            Vos <strong>automatismes Airbnb</strong> (FAQ, check-in, WiFi) restent actifs — hostelyo
            ne vous dérange pas pour ça
          </Point>
          <Point>
            Fini les <strong>dimanches soirs angoissés</strong> et les notifications pour rien
          </Point>
          <li className="flex items-start gap-3 border-t border-on-aubergine/15 pt-5 mt-2">
            <Sparkles
              className="h-4 w-4 flex-shrink-0 text-powder mt-0.5"
              aria-hidden
            />
            <span className="text-sm leading-relaxed text-on-aubergine-soft">
              Avec Sérénité, <strong className="text-on-aubergine">votre équipe est prévenue
              directement</strong> : femme de ménage, plombier, pisciniste… vous ne forwardez plus
              rien
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check
        className="h-4 w-4 flex-shrink-0 text-success mt-0.5"
        strokeWidth={2.5}
        aria-hidden
      />
      <span className="text-sm leading-relaxed text-on-aubergine-soft">
        {children}
      </span>
    </li>
  );
}
