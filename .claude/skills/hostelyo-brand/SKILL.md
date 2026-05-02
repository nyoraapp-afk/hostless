---
name: hostelyo-brand
description: Brand book v4.0.0 du SaaS hostelyo. (domaine hostelyo.com). À charger systématiquement avant toute écriture ou modification d'UI dans ce projet — composants React, pages Next.js, Tailwind classes, copy, emails, marketing, landing, dashboard, onboarding, login, button, card, modal, form, toast, badge, icon. Encode la palette canonique (aubergine/crème/poudre/or/encre), la typographie (Lora/Inter/JetBrains Mono), la voix produit (vouvoiement strict, pas d'emoji), les règles de logo (point poudre), et les anti-patterns à bannir. Garantit que toute production UI respecte le brand premium et raffiné de hostelyo.
---

# hostelyo. — Brand Book v4.0.0 (skill projet)

Ce skill est la source de vérité brand pour le projet `hostless-app` (le dossier code conserve son nom historique ; la marque produit est **hostelyo.**, domaine `hostelyo.com`). Cible : conciergeries, gestionnaires multi-villas, hôtes Airbnb pros. Ton produit : raffiné, posé, premium, jamais "tech bro".

Le brand book complet est versionné dans `Hostless/hostless-brand-assets/02_design_tokens/tokens.json` (côté parent du projet). Ce SKILL.md est le condensé applicable directement à toute génération de code.

---

## 1. Palette canonique (couleurs CSS variables)

| Rôle | Hex | Variable Tailwind 4 (@theme) | Usage |
|---|---|---|---|
| Aubergine (primaire) | `#3D1F3D` | `--color-aubergine` | 80% des fonds sombres, 100% des CTA principaux |
| Aubergine medium | `#5A3D5A` | `--color-aubergine-medium` | Accents typo italique dans titres, hover states |
| Crème (fond clair) | `#FAF3EE` | `--color-cream` | Fond clair par défaut — JAMAIS `#FFFFFF` pur |
| Poudré (accent rose) | `#E8B8A8` | `--color-powder` | Le **point** du logo, accents émotionnels, tags doux |
| Or (premium) | `#C9A870` | `--color-gold` | Parcimonieux : badges premium, séparateurs, médailles |
| Encre (texte principal) | `#2E1A2E` | `--color-ink` | Texte body sur fond crème |
| Success | `#6B8E5A` | `--color-success` | États positifs, confirmations |
| Warning | `#C9A870` | `--color-warning` | Identique à l'or — alertes douces |
| Error | `#A65D6E` | `--color-error` | Erreurs — jamais rouge vif `#FF0000` |

**Règle d'or** : le blanc pur `#FFFFFF` est **interdit** sur fond clair. Toujours `--color-cream` (`#FAF3EE`). Le noir pur `#000000` est interdit aussi — toujours `--color-ink` (`#2E1A2E`).

---

## 2. Typographie

| Famille | Rôle | Usage |
|---|---|---|
| **Lora** (serif) | Display, h1, h2, italique d'accent | Hero, titres de section, mots `<em>` dans les titres |
| **Inter** (sans-serif) | Body, UI | Paragraphes, labels, boutons, tout le reste |
| **JetBrains Mono** | Monospace | IDs, code, données techniques (price IDs Stripe, UUIDs, etc.) |

Les 3 fonts sont déjà chargées dans `src/app/layout.tsx` via `next/font/google`. Référence-les via les variables CSS `var(--font-lora)`, `var(--font-inter)`, `var(--font-jetbrains-mono)`.

**Italique** : tous les `<em>` dans des titres (display/h1/h2) doivent être en couleur `--color-aubergine-medium` ou `--color-powder` — jamais en italique gris ou en couleur principale identique au reste du titre. C'est l'accent émotionnel signature de hostelyo.

---

## 3. Logo "hostelyo." — règle absolue

Le logo est composé du mot `hostelyo` suivi d'un **point**. Le point est **toujours** en couleur `--color-powder` (`#E8B8A8`), peu importe le contexte. Sur fond aubergine, sur fond crème, sur fond image — le point reste poudre.

Composant canonique : `src/components/logo.tsx`. **Ne jamais réimplémenter le logo en dur** dans une autre page — toujours importer ce composant. Si le composant porte encore une mention historique `hostless`, le mettre à jour vers `hostelyo` au passage (nom de marque actuel).

---

## 4. Règles strictes (zero tolerance)

1. **AUCUN EMOJI dans l'UI utilisateur.** Pas dans les boutons, pas dans les titres, pas dans les toasts permanents, pas dans les emails. Les icônes viennent **exclusivement** de `lucide-react`. Une seule exception tolérée : un toast d'exception ponctuel pendant un debug — jamais en prod stable.

2. **VOUVOIEMENT obligatoire.** Toute la copy adresse l'utilisatrice/utilisateur en `vous`. Jamais `tu`, `t'`, `tes`, `ton`, `ta`, `toi`. Cas concrets : "Vous avez 3 villas connectées", "Confirmez votre numéro", "Vos alertes". Test rapide grep pour attraper les régressions :
   ```
   \b(tu |t'|tes |ton |ta |toi)\b
   ```

3. **Point poudre du logo** : jamais aubergine, jamais blanc, toujours `#E8B8A8`.

4. **Pas de blanc pur** sur fond clair. Toujours `--color-cream`.

5. **Pas de purple gradient** ni "AI generic gradient". Le brand est un dégradé subtil aubergine vers aubergine-medium au maximum, ou des aplats.

6. **Cookie banner** : informatif sur essentiels uniquement. Pas de granular opt-in (le produit ne tracke pas).

7. **Dates** : format français long sur l'UI utilisateur (`14 mars 2026` via `formatDate` dans `src/lib/utils.ts`), JetBrains Mono pour les timestamps techniques en logs.

8. **Nom de marque** : toujours `hostelyo.` (avec point). Le code historique peut encore contenir des mentions `hostless` — quand tu en croises une dans une chaîne visible par l'utilisateur (copy, email, meta tags, og:title, alt text), la corriger vers `hostelyo`. Les noms de dossiers/packages techniques (`hostless-app`, etc.) ne sont pas concernés.

---

## 5. Composants & patterns existants à réutiliser

Avant de créer un nouveau composant, vérifier ces emplacements :

- `src/components/ui/` — primitives shadcn-style : `Button`, `Card`, `Dialog`, `Tabs`, `Input`, `Label`, `Skeleton`, `Tooltip`, `Toaster`, `Badge`. **Toujours réutiliser** plutôt que recréer.
- `src/components/patterns/` — 4 patterns UX maison :
  - `locked-feature.tsx` (Pattern 1, fonctionnalité verrouillée)
  - `state-badge.tsx` (Pattern 2, états actual/pending/scheduled/failed)
  - `confirm-action.tsx` (Pattern 4, info/warning/destructive)
  - `data-state.tsx` (Pattern 6, loading/empty/error/success)
- `src/components/logo.tsx` — logo officiel
- `src/components/empty-state.tsx`, `field.tsx`, `phone-input.tsx`, `static-page-shell.tsx`, `cookie-banner.tsx`, `app-shell.tsx`
- `src/components/landing/` — Hero, Problem, Promise, Pricing, Footer (modèles à imiter pour de nouvelles pages publiques)

Si une nouvelle UI ressemble à 70%+ à un composant existant, **étendre** plutôt que dupliquer.

---

## 6. Checklist de validation (avant de proposer du code UI)

Coche mentalement chaque point avant de présenter un composant ou une page :

- [ ] Aucun emoji dans le rendu (icônes Lucide uniquement)
- [ ] Vouvoiement appliqué sur toute la copy (`vous`, jamais `tu`)
- [ ] Couleurs via les variables CSS du `@theme` Tailwind 4 (pas de hex en dur si une variable existe)
- [ ] Fond clair = `--color-cream`, jamais `#fff` ni `bg-white`
- [ ] Texte body = `--color-ink`, jamais `#000` ni `text-black`
- [ ] CTA primaire = aubergine, hover = aubergine-medium
- [ ] Si logo affiché : composant `<Logo />` importé, point en poudre, mot = `hostelyo`
- [ ] Italique d'accent dans titres = `aubergine-medium` ou `powder`
- [ ] Composant primitif réutilisé depuis `ui/` ou `patterns/` quand applicable
- [ ] Format de date = français long (jamais `MM/DD/YYYY`)
- [ ] Responsive : sidebar lg / drawer md / bottom-nav sm via `app-shell.tsx`
- [ ] Aucune mention résiduelle `hostless` dans la copy visible à l'utilisateur

---

## 7. Anti-patterns (à bannir)

| Anti-pattern | Pourquoi | Correction |
|---|---|---|
| `bg-white text-black` | Blanc/noir purs interdits | `bg-[--color-cream] text-[--color-ink]` |
| Emoji dans label de bouton | Brand premium, pas de friture visuelle | Icône Lucide à gauche du texte |
| `Tu peux gérer tes villas` | Tutoiement banni | `Vous gérez vos villas` |
| Point logo en aubergine | Brand brisé | Point en `--color-powder` |
| Logo écrit `hostless.` dans une page nouvelle | Ancienne marque | `hostelyo.` |
| Gradient violet/rose AI-style | Convergence générique | Aplat aubergine ou dégradé subtil aubergine→aubergine-medium |
| Inter pour un h1 hero | Inter c'est le body, pas le display | Lora pour les titres ≥ h2 |
| Couleur error rouge vif `#ef4444` | Trop agressif | `--color-error` (`#A65D6E`, rouge poudré) |
| Ré-implémenter Button local | Duplication | Importer depuis `src/components/ui/button.tsx` |
| Date `2026-05-02` dans l'UI utilisateur | Format technique | `formatDate(date)` → `2 mai 2026` |

---

## 8. Stack & contraintes techniques (rappel)

- **Next.js 16.2.4** (App Router, `proxy.ts` pas `middleware.ts`, `searchParams` async)
- **React 19.2.4**
- **Tailwind 4** avec `@theme` (pas de `tailwind.config.ts`, tout est en CSS dans `src/app/globals.css`)
- **Composants client** : annoter `"use client"` en haut. Composants serveur par défaut.
- **Server actions** : `"use server"` dans la fonction OU au top du fichier
- **Auth** : Auth.js v5, session via `auth()` côté serveur, `useSession()` côté client
- **DB** : Prisma 6 via singleton `src/lib/prisma.ts`
- **Toasts** : `sonner` via `<Toaster />` global, `toast.success/error/info` dans les actions
- **Forms** : `react-hook-form` + `zod` + `@hookform/resolvers`
- **Icônes** : `lucide-react` uniquement
- **Animations** : `tw-animate-css` (déjà chargé) ou `class-variance-authority` pour les variants

---

## 9. Voix produit

- Concise, posée, jamais excitée. Pas de `!` à répétition. Pas de "Yay !", "Génial !", "Boom".
- Pédagogique sans être condescendante. L'utilisatrice est une pro de l'hôtellerie, pas une débutante tech.
- Direct sur la valeur : "Vous recevez une alerte WhatsApp uniquement quand c'est une vraie urgence."
- Italique pour l'émotion clé : `<em>vraies</em> urgences`, `<em>sans</em> engagement`.
- Quand un état est négatif (erreur paiement, pipeline KO), reste calme et propose une action concrète. Jamais "Oups !", "Erreur fatale", "Désolé".

---

## 10. Quand le brand laisse une marge

Pour tout ce qui n'est pas explicitement encadré ici (composition spatiale, micro-interactions, motion, atmosphère), le skill `frontend-design` (générique) prend le relais — mais **toujours** en respectant les contraintes ci-dessus comme garde-fous.
