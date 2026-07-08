/**
 * API base URL for backend requests.
 *
 * - On Replit (or local dev): leave VITE_API_BASE_URL unset and the app uses
 *   relative `/api/...` paths, which are served by the same origin.
 * - On Vercel (or any external frontend host): set VITE_API_BASE_URL to the
 *   absolute backend URL (e.g. `https://your-api.replit.app`), otherwise the
 *   frontend will try to call Vercel's own `/api` routes and fail.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "";

export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  if (!base) return path;
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}
