import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Building2,
  Users,
  Settings as SettingsIcon,
  AlertTriangle,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getDashboardData, getAlertsForUser, type AlertFilters } from "@/lib/dashboard-data";
import { VillasTab } from "./_components/villas-tab";
import { EquipeTab } from "./_components/equipe-tab";
import { CompteTab } from "./_components/compte-tab";
import { AlertesTab } from "./_components/alertes-tab";

/**
 * Dashboard utilisateur — 4 onglets : Villas / Alertes / Équipe / Compte.
 *
 * Server component : charge les données depuis Supabase, puis hydrate les onglets.
 *
 * URL params supportés :
 *   - ?tab=villas|alertes|equipe|compte
 *   - ?urgency=HIGH|MEDIUM|LOW|ALL    (filtre Alertes)
 *   - ?category=MENAGE|...|ALL         (filtre Alertes)
 *   - ?villa=<id>|ALL                  (filtre Alertes)
 *   - ?range=7d|30d|90d|all            (filtre Alertes)
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    urgency?: string;
    category?: string;
    villa?: string;
    range?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await getDashboardData(session.user.id);
  const params = await searchParams;
  const validTabs = ["villas", "alertes", "equipe", "compte"];
  const initialTab =
    params.tab && validTabs.includes(params.tab) ? params.tab : "villas";

  const planSlug = data.subscription?.plan.slug ?? null;

  // Charge les alertes uniquement quand on est sur l'onglet Alertes (économie de query)
  const alertsFilters: AlertFilters = {
    urgency: parseEnum(params.urgency, ["HIGH", "MEDIUM", "LOW", "ALL"]),
    category: parseEnum(params.category, [
      "MENAGE",
      "PISCINE",
      "JARDIN",
      "MAINTENANCE",
      "ACCUEIL",
      "AUTRE",
      "ALL",
    ]),
    villaId: params.villa,
    range: parseEnum(params.range, ["7d", "30d", "90d", "all"]) ?? "30d",
  };
  const alerts =
    initialTab === "alertes"
      ? await getAlertsForUser(session.user.id, alertsFilters)
      : [];

  return (
    <AppShell
      activePath="/dashboard"
      user={{
        name: data.user.name ?? data.user.email ?? "Utilisateur",
        email: data.user.email,
      }}
    >
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <div className="text-eyebrow mb-2">Mon compte</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
            Bonjour{" "}
            <em className="text-aubergine-medium">
              {data.user.name?.split(" ")[0] ?? "à vous"}
            </em>
          </h1>
          <p className="mt-2 text-base text-ink-soft">
            hostelyo veille sur vos villas. Vous recevrez une alerte WhatsApp uniquement
            quand votre intervention sera nécessaire.
          </p>
        </header>

        <Tabs defaultValue={initialTab}>
          <TabsList className="w-full">
            <TabsTrigger value="villas" className="flex-1">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              Villas
            </TabsTrigger>
            <TabsTrigger value="alertes" className="flex-1">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              Alertes
            </TabsTrigger>
            <TabsTrigger value="equipe" className="flex-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              Équipe
            </TabsTrigger>
            <TabsTrigger value="compte" className="flex-1">
              <SettingsIcon className="h-3.5 w-3.5" aria-hidden />
              Compte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="villas">
            <VillasTab villas={data.villas} />
          </TabsContent>

          <TabsContent value="alertes">
            <AlertesTab
              alerts={alerts}
              villas={data.villas}
              filters={{
                urgency: params.urgency,
                category: params.category,
                villa: params.villa,
                range: params.range,
              }}
            />
          </TabsContent>

          <TabsContent value="equipe">
            <EquipeTab
              intervenants={data.intervenants}
              uncoveredCategories={data.uncoveredCategories}
              planSlug={planSlug}
            />
          </TabsContent>

          <TabsContent value="compte">
            <CompteTab
              user={data.user}
              whatsapp={data.whatsapp}
              subscription={data.subscription}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

/** Helper : ne retourne la valeur que si elle est dans la liste autorisée. */
function parseEnum<T extends string>(value: string | undefined, allowed: T[]): T | undefined {
  if (!value) return undefined;
  return (allowed as string[]).includes(value) ? (value as T) : undefined;
}
