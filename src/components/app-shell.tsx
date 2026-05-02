"use client";

import * as React from "react";
import {
  Menu,
  Bell,
  Home,
  Building2,
  AlertTriangle,
  Users,
  Settings as SettingsIcon,
  LifeBuoy,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

/**
 * AppShell — layout responsive officiel de hostelyo.
 *
 * Pattern 8 (responsive complet) :
 *   - <md (640px)  : bottom nav fixe + topbar mobile
 *   - md ≤ x < lg  : drawer latéral (toggle hamburger)
 *   - ≥ lg (1024)  : sidebar persistante
 *
 * Pattern 9 (a11y) :
 *   - <nav role="navigation" aria-label="...">
 *   - aria-current="page" sur l'item actif
 *   - focus-visible géré par les classes globales
 */

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

const DEFAULT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Aperçu", icon: Home },
  { href: "/dashboard/villas", label: "Mes villas", icon: Building2 },
  { href: "/dashboard/alertes", label: "Alertes", icon: AlertTriangle },
  { href: "/dashboard/equipe", label: "Équipe", icon: Users },
  { href: "/dashboard/parametres", label: "Paramètres", icon: SettingsIcon },
];

type AppShellProps = {
  children: React.ReactNode;
  nav?: NavItem[];
  /** Path actif (matché contre `item.href` en startsWith). */
  activePath?: string;
  /** Affichage utilisateur connecté (en bas du sidebar). */
  user?: { name: string; email: string };
};

export function AppShell({
  children,
  nav = DEFAULT_NAV,
  activePath = "/dashboard",
  user,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Close drawer on Escape (Pattern 9)
  React.useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen bg-cream">
      {/* === SIDEBAR (lg+) — persistante === */}
      <SidebarNav
        nav={nav}
        activePath={activePath}
        user={user}
        className="hidden lg:flex"
      />

      {/* === DRAWER (md ≤ x < lg) — slide-in toggle === */}
      {drawerOpen && (
        <>
          <button
            className="fixed inset-0 z-40 bg-aubergine-deep/60 backdrop-blur-sm md:block lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-label="Fermer le menu"
          />
          <SidebarNav
            nav={nav}
            activePath={activePath}
            user={user}
            onItemClick={() => setDrawerOpen(false)}
            className="fixed inset-y-0 left-0 z-50 flex md:flex lg:hidden animate-in slide-in-from-left duration-200"
          />
        </>
      )}

      {/* === MAIN CONTENT === */}
      <main className="flex flex-1 flex-col min-w-0">
        {/* Topbar mobile/tablet */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-cream/90 px-4 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-sm text-ink-soft hover:bg-cream-warm hidden md:flex"
            aria-label="Ouvrir le menu"
            aria-expanded={drawerOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo size="md" />
          <div className="ml-auto flex items-center gap-1">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-sm text-ink-soft hover:bg-cream-warm"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page content avec padding bottom pour le bottom nav mobile */}
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-24 md:pb-6">
          {children}
        </div>

        {/* Bottom nav mobile (<md) */}
        <BottomNav
          nav={nav.slice(0, 5)}
          activePath={activePath}
          className="md:hidden"
        />
      </main>
    </div>
  );
}

// ============================================================================
// Sidebar (utilisé pour desktop ET drawer mobile)
// ============================================================================

function SidebarNav({
  nav,
  activePath,
  user,
  onItemClick,
  className,
}: {
  nav: NavItem[];
  activePath: string;
  user?: { name: string; email: string };
  onItemClick?: () => void;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "w-64 flex-col bg-aubergine text-on-aubergine",
        "px-4 py-6",
        className
      )}
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="mb-8 flex items-center justify-between px-2">
        <Logo size="md" variant="on-aubergine" />
        {onItemClick && (
          <button
            onClick={onItemClick}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-on-aubergine-soft hover:bg-aubergine-medium lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <ul className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const isActive =
            activePath === item.href ||
            (item.href !== "/dashboard" && activePath.startsWith(item.href));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={onItemClick}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                  "min-h-[44px]", // touch target Pattern 8
                  isActive
                    ? "bg-on-aubergine/10 text-on-aubergine"
                    : "text-on-aubergine-soft hover:bg-on-aubergine/5 hover:text-on-aubergine"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-pill bg-powder px-1.5 text-[10px] font-semibold text-aubergine-deep">
                    {item.badge}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-4">
        <a
          href="/aide"
          onClick={onItemClick}
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-on-aubergine-soft transition-colors hover:bg-on-aubergine/5 hover:text-on-aubergine min-h-[44px]"
        >
          <LifeBuoy className="h-4 w-4 flex-shrink-0" aria-hidden />
          Aide & support
        </a>
        {user && (
          <div className="mt-4 flex items-center gap-3 border-t border-border-dark pt-4">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-powder text-aubergine-deep text-sm font-semibold"
              aria-hidden
            >
              {user.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-on-aubergine">
                {user.name}
              </div>
              <div className="truncate text-xs text-on-aubergine-muted">
                {user.email}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ============================================================================
// BottomNav (mobile <md uniquement)
// ============================================================================

function BottomNav({
  nav,
  activePath,
  className,
}: {
  nav: NavItem[];
  activePath: string;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-cream/95 backdrop-blur-md",
        "pb-[max(env(safe-area-inset-bottom),0.5rem)]",
        className
      )}
      role="navigation"
      aria-label="Navigation principale"
    >
      <ul className="flex items-stretch">
        {nav.map((item) => {
          const isActive =
            activePath === item.href ||
            (item.href !== "/dashboard" && activePath.startsWith(item.href));
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <a
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 pt-2 pb-1.5 min-h-[56px]",
                  "text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-aubergine"
                    : "text-ink-muted hover:text-ink-soft"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" aria-hidden />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -right-2 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-pill bg-powder px-1 text-[9px] font-semibold text-aubergine-deep">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="truncate w-full text-center">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
