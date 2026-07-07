---
name: Anime Cartoon app architecture
description: Architecture decisions for the Anime Cartoon streaming app built from a Lovable zip.
---

## Stack

- Frontend: `artifacts/anime-cartoon/` — React + Vite, TanStack Router v1 (manual route tree, NOT file-based), @tanstack/react-query, @supabase/supabase-js, hls.js, dompurify
- Backend API: `artifacts/api-server/` — Express, routes mounted in `src/routes/public.ts` (/api/public/stream, /api/public/shorten, /api/public/playlist)
- Database/Auth: Supabase (user's existing project — do NOT migrate to Replit DB)

## Key decisions

- `mpegts.js` was blocked by Replit package firewall — HLS.js only used for playback; raw TS streams without mpegts fallback.
- TanStack Router v1 manual tree: `createRootRouteWithContext<{ queryClient: QueryClient }>()`. Use `useParams({ from: "/watch/$id" })` pattern. Link to="/search" requires `search={{ q: "" }}`.
- `SHRINKME_API_TOKEN` env secret needed for URL shortener; gracefully degrades to unshortened URL if absent.

**Why:** Original app used TanStack Start (SSR/Bun) which doesn't run on Replit — stripped to pure CSR.

## Security fixes applied

- SSRF protection in stream proxy: DNS-resolves hostname, blocks private/loopback CIDRs.
- Open redirect in verify flow: `sanitizeReturnTo()` validates same-origin relative paths only; shortener response validated against allowlist of shortener domains.
- XSS: all DB HTML rendered via `SafeHtml` component (DOMPurify).
- Shrinkme token removed from code — must be set via `SHRINKME_API_TOKEN` secret.
