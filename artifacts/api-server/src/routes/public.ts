import { Router, type IRouter, type Request, type Response } from "express";
import { isIP } from "net";
import dns from "dns/promises";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

// ─── Shrinkme key storage (admin-configurable) ────────────────────────────────
const SHRINKME_FILE = path.join("/tmp", "shrinkme-key.txt");

export function readShrinkmeKey(): string | null {
  try {
    if (!fs.existsSync(SHRINKME_FILE)) return null;
    const key = fs.readFileSync(SHRINKME_FILE, "utf-8").trim();
    return key || null;
  } catch { return null; }
}

// GET /api/admin/shrinkme — returns whether a key is saved (not the key itself)
router.get("/admin/shrinkme", (_req, res) => {
  const key = readShrinkmeKey();
  res.json({ configured: !!key, hint: key ? `${key.slice(0, 4)}${"•".repeat(Math.max(0, key.length - 4))}` : null });
});

// POST /api/admin/shrinkme — save key
router.post("/admin/shrinkme", (req, res) => {
  const { key } = req.body as { key?: string };
  if (!key || !key.trim()) { res.status(400).json({ error: "key is required" }); return; }
  fs.writeFileSync(SHRINKME_FILE, key.trim());
  res.json({ ok: true });
});

// DELETE /api/admin/shrinkme — clear key
router.delete("/admin/shrinkme", (_req, res) => {
  try { fs.unlinkSync(SHRINKME_FILE); } catch { /* ok */ }
  res.json({ ok: true });
});

const PROXY_PATH = "/api/public/stream";

// ─── SSRF protection ─────────────────────────────────────────────────────────
// Reject hostnames/IPs that map to loopback, private, link-local or
// cloud-metadata ranges.
const BLOCKED_HOSTS = /^(localhost|metadata\.google\.internal|169\.254\.\d+\.\d+)$/i;
const PRIVATE_CIDRS = [
  // IPv4
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^192\.0\.[02]\./,
  // IPv6 loopback and link-local
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd[0-9a-f]{2}:/i,
];

function isPrivateIP(ip: string): boolean {
  return PRIVATE_CIDRS.some((re) => re.test(ip));
}

async function assertSafeUrl(u: URL): Promise<void> {
  if (BLOCKED_HOSTS.test(u.hostname)) {
    throw new Error("blocked host");
  }
  if (isIP(u.hostname)) {
    if (isPrivateIP(u.hostname)) throw new Error("private IP");
    return; // literal IP that's public — allow
  }
  // Resolve and check all returned addresses
  let addrs: string[] = [];
  try {
    const v4 = await dns.resolve4(u.hostname).catch(() => [] as string[]);
    const v6 = await dns.resolve6(u.hostname).catch(() => [] as string[]);
    addrs = [...v4, ...v6];
  } catch {
    throw new Error("dns resolution failed");
  }
  if (addrs.length === 0) throw new Error("no DNS records");
  for (const addr of addrs) {
    if (isPrivateIP(addr)) throw new Error("private IP");
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function rewritePlaylist(text: string, baseUrl: string): string {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return text;
  }
  return text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Rewrite URI="..." attributes (EXT-X-KEY, EXT-X-MAP, etc.)
      let out = line.replace(/URI="([^"]+)"/g, (_m: string, uri: string) => {
        try {
          const abs = new URL(uri, base).toString();
          return `URI="${PROXY_PATH}?u=${encodeURIComponent(abs)}"`;
        } catch {
          return `URI="${uri}"`;
        }
      });

      // Strip CODECS attribute from EXT-X-STREAM-INF
      if (trimmed.startsWith("#EXT-X-STREAM-INF")) {
        out = out.replace(/,?CODECS="[^"]*"/g, "");
      }

      if (trimmed.startsWith("#")) return out;

      // Plain URL line (segment or sub-playlist)
      try {
        const abs = new URL(trimmed, base).toString();
        return `${PROXY_PATH}?u=${encodeURIComponent(abs)}`;
      } catch {
        return line;
      }
    })
    .join("\n");
}

async function proxyStream(req: Request, res: Response): Promise<void> {
  const target = req.query.u as string | undefined;
  if (!target) {
    res.status(400).send("missing u");
    return;
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    res.status(400).send("bad url");
    return;
  }

  if (!/^https?:$/.test(targetUrl.protocol)) {
    res.status(400).send("bad protocol");
    return;
  }

  // SSRF guard: reject private/loopback destinations
  try {
    await assertSafeUrl(targetUrl);
  } catch (err) {
    res.status(403).send(`forbidden: ${(err as Error).message}`);
    return;
  }

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    Referer: `${targetUrl.protocol}//${targetUrl.host}/`,
  };

  if (req.headers.range) {
    headers.Range = req.headers.range;
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    const ct = upstream.headers.get("content-type") ?? "";
    const isPlaylist =
      /mpegurl/i.test(ct) ||
      targetUrl.pathname.endsWith(".m3u8") ||
      targetUrl.pathname.endsWith(".m3u");

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "*");
    res.set("Access-Control-Expose-Headers", "*");

    if (isPlaylist) {
      const text = await upstream.text();
      const rewritten = rewritePlaylist(text, upstream.url || targetUrl.toString());
      res.set("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
      res.set("Cache-Control", "no-store");
      res.status(upstream.status).send(rewritten);
      return;
    }

    // Pass through binary content
    const passThrough = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
    ];
    for (const h of passThrough) {
      const v = upstream.headers.get(h);
      if (v) res.set(h, v);
    }
    if (!res.getHeader("content-type")) {
      res.set("Content-Type", "application/octet-stream");
    }
    res.status(upstream.status);

    if (upstream.body) {
      const reader = upstream.body.getReader();
      const stream = res;
      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) { stream.end(); return; }
        stream.write(Buffer.from(value));
        return pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(502).send("upstream error");
    }
  }
}

// Stream proxy
router.get("/public/stream", proxyStream);
router.head("/public/stream", proxyStream);
router.options("/public/stream", (_req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  res.set("Access-Control-Allow-Headers", "*");
  res.set("Access-Control-Max-Age", "86400");
  res.status(204).end();
});

// URL shortener via shrinkme.io
router.get("/public/shorten", async (req, res) => {
  const url = req.query.url as string | undefined;
  if (!url) {
    res.status(400).json({ error: "missing url" });
    return;
  }

  // Prefer key saved by admin panel, fall back to env var
  const apiToken = readShrinkmeKey() || process.env.SHRINKME_API_TOKEN;
  if (!apiToken) {
    // No token configured — return the original URL unchanged
    res.json({ short: url });
    return;
  }

  try {
    const apiUrl = `https://shrinkme.io/api?api=${encodeURIComponent(apiToken)}&url=${encodeURIComponent(url)}&format=json`;
    const r = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    const data = (await r.json()) as { status: string; shortenedUrl?: string };
    if (data.status === "success" && data.shortenedUrl) {
      res.json({ short: data.shortenedUrl });
    } else {
      res.json({ short: url });
    }
  } catch {
    res.json({ short: url });
  }
});

// M3U playlist from DB channels
router.get("/public/playlist", async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      res.status(500).send("supabase not configured");
      return;
    }

    const r = await fetch(
      `${supabaseUrl}/rest/v1/channels?select=name,stream_url,logo,category&active=eq.true&order=sort_order`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );
    const channels = (await r.json()) as Array<{
      name: string;
      stream_url: string;
      logo: string | null;
      category: string;
    }>;

    const lines = ["#EXTM3U"];
    for (const ch of channels) {
      lines.push(
        `#EXTINF:-1 tvg-logo="${ch.logo ?? ""}" group-title="${ch.category}",${ch.name}`,
      );
      lines.push(ch.stream_url);
    }

    res.set("Content-Type", "application/x-mpegurl");
    res.set("Cache-Control", "public, max-age=300");
    res.send(lines.join("\n"));
  } catch {
    res.status(500).send("error");
  }
});

export default router;
