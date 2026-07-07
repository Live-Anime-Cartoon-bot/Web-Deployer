import {
  createRouter,
  createRootRouteWithContext,
  createRoute,
  Outlet,
  Link,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

import { HomePage } from "@/routes/home";
import { LivePage } from "@/routes/live";
import { WatchPage } from "@/routes/watch";
import { SearchPage } from "@/routes/search";
import { AuthPage } from "@/routes/auth-page";
import { VerifyPage } from "@/routes/verify-page";
import { PostPage } from "@/routes/post";
import { PageView } from "@/routes/page-view";
import { AdminPage } from "@/routes/admin";

/* ─── Root route ─────────────────────────────────────────────── */
const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  ),
});

/* ─── Routes ─────────────────────────────────────────────────── */
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/live",
  component: LivePage,
});

const watchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watch/$id",
  component: WatchPage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: SearchPage,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthPage,
});

const verifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify",
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
    returnTo: typeof search.returnTo === "string" ? search.returnTo : undefined,
  }),
  component: VerifyPage,
});

const postRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/posts/$slug",
  component: PostPage,
});

const pageViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pages/$slug",
  component: PageView,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

/* ─── Router ─────────────────────────────────────────────────── */
const routeTree = rootRoute.addChildren([
  indexRoute,
  liveRoute,
  watchRoute,
  searchRoute,
  authRoute,
  verifyRoute,
  postRoute,
  pageViewRoute,
  adminRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined!,
  },
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
