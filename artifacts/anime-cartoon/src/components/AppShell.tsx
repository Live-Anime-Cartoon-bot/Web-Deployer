import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Tv, Search } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const state = useRouterState();
  const pathname = state.location.pathname;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Page content */}
      <main className="pb-24">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-xl px-2 pb-safe pt-2">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 px-5 py-1 transition ${
            pathname === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium uppercase tracking-widest">Home</span>
          {pathname === "/" && <span className="h-0.5 w-4 rounded-full gradient-brand" />}
        </Link>

        <Link
          to="/live"
          className={`flex flex-col items-center gap-0.5 px-5 py-1 transition ${
            pathname === "/live" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tv className="h-5 w-5" />
          <span className="text-[10px] font-medium uppercase tracking-widest">Live</span>
          {pathname === "/live" && <span className="h-0.5 w-4 rounded-full gradient-brand" />}
        </Link>

        <Link
          to="/search"
          search={{ q: "" }}
          className={`flex flex-col items-center gap-0.5 px-5 py-1 transition ${
            pathname === "/search"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium uppercase tracking-widest">Search</span>
          {pathname === "/search" && <span className="h-0.5 w-4 rounded-full gradient-brand" />}
        </Link>
      </nav>
    </div>
  );
}
