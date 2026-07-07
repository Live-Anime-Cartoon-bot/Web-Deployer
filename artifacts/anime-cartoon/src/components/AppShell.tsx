import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Tv, Search, Tv2 } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const state = useRouterState();
  const pathname = state.location.pathname;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Page content */}
      <main className="pb-28">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-xl px-1 pb-safe pt-2">
        <NavTab to="/" label="Home" icon={<Home className="h-5 w-5" />} active={pathname === "/"} />
        <NavTab to="/jiotv" label="JioTV" icon={<Tv2 className="h-5 w-5" />} active={pathname === "/jiotv"} highlight />
        <NavTab to="/live" label="Live" icon={<Tv className="h-5 w-5" />} active={pathname === "/live"} />
        <NavTab to="/search" search={{ q: "" }} label="Search" icon={<Search className="h-5 w-5" />} active={pathname === "/search"} />
      </nav>
    </div>
  );
}

function NavTab({
  to,
  label,
  icon,
  active,
  highlight,
  search,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  highlight?: boolean;
  search?: { q: string };
}) {
  const baseClass = `flex flex-col items-center gap-0.5 px-4 py-1 transition`;
  const colorClass = active
    ? "text-foreground"
    : highlight
    ? "text-brand hover:text-foreground"
    : "text-muted-foreground hover:text-foreground";

  return (
    <Link
      to={to}
      {...(search ? { search } : {})}
      className={`${baseClass} ${colorClass}`}
    >
      {highlight && !active ? (
        <span className="relative">
          {icon}
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-live" />
        </span>
      ) : icon}
      <span className="text-[10px] font-medium uppercase tracking-widest">{label}</span>
      {active && <span className="h-0.5 w-4 rounded-full gradient-brand" />}
    </Link>
  );
}
