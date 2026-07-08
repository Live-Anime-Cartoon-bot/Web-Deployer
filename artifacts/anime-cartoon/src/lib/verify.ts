import { apiUrl } from "@/lib/api-base";

const STORAGE_KEY = "ac_token";
const PENDING_KEY = "ac_pending";
const VALIDITY_MS = 12 * 60 * 60 * 1000; // 12 hours

interface StoredToken {
  token: string;
  expiresAt: number;
}

interface Pending {
  token: string;
  returnTo: string;
  createdAt: number;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Validates that returnTo is a safe same-origin relative path. */
function sanitizeReturnTo(input: string | undefined): string {
  if (!input) return "/";
  try {
    // If it parses as an absolute URL, reject it (must be same-origin).
    // Relative paths starting with "/" are safe; anything else gets reset.
    const u = new URL(input, window.location.origin);
    if (u.origin !== window.location.origin) return "/";
    // Return just the pathname + search (never host/protocol)
    return u.pathname + (u.search ? u.search : "");
  } catch {
    return "/";
  }
}

/** Validates that a shortened URL comes from a known shortener domain. */
function validateShortUrl(short: string, original: string): string {
  const ALLOWED_SHORTENER_HOSTS = ["shrinkme.io", "shrinke.me"];
  try {
    const u = new URL(short);
    if (!ALLOWED_SHORTENER_HOSTS.includes(u.hostname)) return original;
    if (!/^https?:$/.test(u.protocol)) return original;
    return short;
  } catch {
    return original;
  }
}

export function hasValidToken(): boolean {
  const stored = readJson<StoredToken>(STORAGE_KEY);
  if (!stored) return false;
  return stored.expiresAt > Date.now();
}

export function tokenExpiresAt(): number | null {
  const stored = readJson<StoredToken>(STORAGE_KEY);
  return stored?.expiresAt ?? null;
}

function randomToken(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function startVerification(returnTo: string): Promise<void> {
  const safeReturnTo = sanitizeReturnTo(returnTo);
  const token = randomToken();
  const pending: Pending = { token, returnTo: safeReturnTo, createdAt: Date.now() };
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));

  const origin = window.location.origin;
  // Build the destination as a same-origin /verify path
  const destination = `${origin}/verify?token=${token}`;

  let shortUrl = destination;
  try {
    const res = await fetch(`${apiUrl("/api/public/shorten")}?url=${encodeURIComponent(destination)}`);
    const data = (await res.json()) as { short?: string };
    if (data.short) {
      shortUrl = validateShortUrl(data.short, destination);
    }
  } catch {
    // fall back to direct destination
  }
  window.location.href = shortUrl;
}

export function completeVerification(token: string): string | null {
  const pending = readJson<Pending>(PENDING_KEY);
  if (!pending || pending.token !== token) return null;
  // Pending token is short-lived (10 minutes max)
  if (Date.now() - pending.createdAt > 10 * 60 * 1000) return null;
  const stored: StoredToken = {
    token,
    expiresAt: Date.now() + VALIDITY_MS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  localStorage.removeItem(PENDING_KEY);
  // Always return a safe relative path
  return sanitizeReturnTo(pending.returnTo);
}

export function clearVerification(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PENDING_KEY);
}
