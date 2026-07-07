/**
 * JioTV routes — ported from the PHP TS-JioTV project.
 * Credentials are stored server-side in /tmp/jiotv-creds.json (single-user).
 */
import { Router, type IRouter, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router: IRouter = Router();

// ─── Credential storage ───────────────────────────────────────────────────────
const CREDS_FILE = path.join("/tmp", "jiotv-creds.json");

interface JioCreds {
  ssoToken: string;
  authToken: string;
  refreshToken: string;
  deviceId: string;
  sessionAttributes: {
    user: { subscriberId: string; unique: string };
  };
  savedAt: number;
}

function readCreds(): JioCreds | null {
  try {
    if (!fs.existsSync(CREDS_FILE)) return null;
    return JSON.parse(fs.readFileSync(CREDS_FILE, "utf-8")) as JioCreds;
  } catch {
    return null;
  }
}

function writeCreds(data: object): void {
  fs.writeFileSync(CREDS_FILE, JSON.stringify({ ...data, savedAt: Date.now() }));
}

function clearCreds(): void {
  try { fs.unlinkSync(CREDS_FILE); } catch { /* ok */ }
}

// ─── JioTV headers ───────────────────────────────────────────────────────────
const JIO_UA = "plaYtv/7.1.3 (Linux;Android 14) ExoPlayerLib/2.11.7";
const OKH_UA = "okhttp/4.12.13";

function jioPlaybackHeaders(creds: JioCreds, channelId: string): Record<string, string> {
  const crm = creds.sessionAttributes.user.subscriberId;
  const uid = creds.sessionAttributes.user.unique;
  return {
    "Host": "jiotvapi.media.jio.com",
    "Content-Type": "application/x-www-form-urlencoded",
    "appkey": "NzNiMDhlzQyNjJm",
    "channel_id": channelId,
    "userid": crm,
    "crmid": crm,
    "deviceId": creds.deviceId,
    "devicetype": "phone",
    "isott": "true",
    "languageId": "6",
    "lbcookie": "1",
    "os": "android",
    "dm": "Xiaomi 22101316UP",
    "osversion": "14",
    "srno": "250918144000",
    "accesstoken": creds.authToken,
    "subscriberid": crm,
    "uniqueId": uid,
    "usergroup": "tvYR7NSNn7rymo3F",
    "User-Agent": OKH_UA,
    "versionCode": "452",
  };
}

function jioSegmentHeaders(creds: JioCreds): Record<string, string> {
  const crm = creds.sessionAttributes.user.subscriberId;
  const uid = creds.sessionAttributes.user.unique;
  return {
    "accesstoken": creds.authToken,
    "appkey": "NzNiMDhlYcQyNjJm",
    "channel_id": "144",
    "crmid": crm,
    "deviceId": creds.deviceId,
    "devicetype": "phone",
    "isott": "true",
    "languageId": "6",
    "lbcookie": "1",
    "os": "android",
    "osVersion": "14",
    "srno": "250918144000",
    "ssotoken": creds.ssoToken,
    "subscriberId": crm,
    "uniqueId": uid,
    "User-Agent": JIO_UA,
    "usergroup": "tvYR7NSNn7rymo3F",
    "versionCode": "452",
    "Origin": "https://www.jiocinema.com",
    "Referer": "https://www.jiocinema.com/",
  };
}

// ─── Token refresh ────────────────────────────────────────────────────────────
async function refreshToken(creds: JioCreds): Promise<JioCreds | null> {
  try {
    const res = await fetch(
      "https://auth.media.jio.com/tokenservice/apis/v1/refreshtoken?langId=6",
      {
        method: "POST",
        headers: {
          "accesstoken": creds.authToken,
          "uniqueId": creds.sessionAttributes.user.unique,
          "devicetype": "phone",
          "versionCode": "331",
          "os": "android",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appName: "RJIL_JioTV",
          deviceId: creds.deviceId,
          refreshToken: creds.refreshToken,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const data = (await res.json()) as { authToken?: string };
    if (data.authToken) {
      const updated = { ...creds, authToken: data.authToken, savedAt: Date.now() };
      writeCreds(updated);
      return updated as JioCreds;
    }
  } catch { /* ignore */ }
  return null;
}

async function getValidCreds(): Promise<JioCreds | null> {
  let creds = readCreds();
  if (!creds) return null;
  // Refresh token if older than ~1.5 hours
  if (Date.now() - creds.savedAt > 5400_000) {
    creds = await refreshToken(creds) ?? creds;
  }
  return creds;
}

// ─── Channel list ─────────────────────────────────────────────────────────────
const CHANNEL_CACHE: { data: unknown[]; ts: number } = { data: [], ts: 0 };
const CHANNEL_TTL = 10 * 60 * 1000;

async function fetchChannels(creds: JioCreds): Promise<unknown[]> {
  if (CHANNEL_CACHE.data.length && Date.now() - CHANNEL_CACHE.ts < CHANNEL_TTL) {
    return CHANNEL_CACHE.data;
  }
  const crm = creds.sessionAttributes.user.subscriberId;
  const uid = creds.sessionAttributes.user.unique;
  const res = await fetch("https://jiotvapi.media.jio.com/apis/v1.3/getchannel", {
    headers: {
      "accesstoken": creds.authToken,
      "appkey": "NzNiMDhlYcQyNjJm",
      "crmid": crm,
      "deviceId": creds.deviceId,
      "devicetype": "phone",
      "isott": "true",
      "os": "android",
      "osVersion": "14",
      "srno": "250918144000",
      "ssotoken": creds.ssoToken,
      "subscriberId": crm,
      "uniqueId": uid,
      "User-Agent": JIO_UA,
      "usergroup": "tvYR7NSNn7rymo3F",
      "versionCode": "452",
    },
    signal: AbortSignal.timeout(12_000),
  });
  const json = (await res.json()) as { result?: unknown[] } | unknown[];
  const channels = Array.isArray(json) ? json : ((json as { result?: unknown[] }).result ?? []);
  CHANNEL_CACHE.data = channels;
  CHANNEL_CACHE.ts = Date.now();
  return channels;
}

// ─── Playlist rewriter for JioTV HLS ─────────────────────────────────────────
const JIOTV_PROXY = "/api/jiotv/seg";

function rewriteJioPlaylist(text: string, baseUrl: string, ck: string): string {
  let base: URL;
  try { base = new URL(baseUrl); } catch { return text; }

  return text.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Rewrite URI="..." attributes
    let out = line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
      try {
        const abs = new URL(uri, base).toString();
        return `URI="${JIOTV_PROXY}?ck=${encodeURIComponent(ck)}&u=${encodeURIComponent(abs)}"`;
      } catch { return `URI="${uri}"`; }
    });

    // Strip CODECS from EXT-X-STREAM-INF
    if (trimmed.startsWith("#EXT-X-STREAM-INF")) {
      out = out.replace(/,?CODECS="[^"]*"/g, "");
    }

    if (trimmed.startsWith("#")) return out;

    try {
      const abs = new URL(trimmed, base).toString();
      return `${JIOTV_PROXY}?ck=${encodeURIComponent(ck)}&u=${encodeURIComponent(abs)}`;
    } catch { return line; }
  }).join("\n");
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Status — is anyone logged in?
router.get("/jiotv/status", (_req, res) => {
  const creds = readCreds();
  res.json({ loggedIn: !!creds });
});

// Send OTP
router.post("/jiotv/otp/send", async (req, res) => {
  const { mobile } = req.body as { mobile?: string };
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    res.status(400).json({ error: "Provide a valid 10-digit mobile number" });
    return;
  }
  try {
    const r = await fetch("https://jiotvapi.media.jio.com/userservice/apis/v1/loginotp/send", {
      method: "POST",
      headers: {
        "appname": "RJIL_JioTV",
        "os": "android",
        "devicetype": "phone",
        "content-type": "application/json",
        "user-agent": "okhttp/3.14.9",
      },
      body: JSON.stringify({ number: Buffer.from("+91" + mobile).toString("base64") }),
      signal: AbortSignal.timeout(10_000),
    });
    if (r.status === 204) {
      res.json({ ok: true, message: "OTP sent successfully" });
    } else {
      const data = (await r.json().catch(() => ({}))) as { message?: string };
      res.status(400).json({ error: data.message ?? `JioTV error (${r.status})` });
    }
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// Verify OTP
router.post("/jiotv/otp/verify", async (req, res) => {
  const { mobile, otp } = req.body as { mobile?: string; otp?: string };
  if (!mobile || !otp) {
    res.status(400).json({ error: "mobile and otp are required" });
    return;
  }
  try {
    const androidId = crypto.createHash("sha1")
      .update(Date.now() + Math.random().toString())
      .digest("hex")
      .slice(0, 16);

    const r = await fetch("https://jiotvapi.media.jio.com/userservice/apis/v1/loginotp/verify", {
      method: "POST",
      headers: {
        "appname": "RJIL_JioTV",
        "os": "android",
        "devicetype": "phone",
        "content-type": "application/json",
        "user-agent": "okhttp/3.14.9",
      },
      body: JSON.stringify({
        number: Buffer.from("+91" + mobile).toString("base64"),
        otp,
        deviceInfo: {
          consumptionDeviceName: "RMX1945",
          info: {
            type: "android",
            platform: { name: "RMX1945" },
            androidId,
          },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await r.json()) as Record<string, unknown>;
    if (data.ssoToken) {
      writeCreds(data);
      CHANNEL_CACHE.data = []; // clear cache
      res.json({ ok: true });
    } else {
      const msg =
        (data as { message?: string }).message ??
        ((data as { errors?: Array<{ message?: string }> }).errors?.[0]?.message) ??
        `JioTV error (${r.status})`;
      res.status(400).json({ error: msg });
    }
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// Logout
router.post("/jiotv/logout", (_req, res) => {
  clearCreds();
  CHANNEL_CACHE.data = [];
  res.json({ ok: true });
});

// Channel list
router.get("/jiotv/channels", async (_req, res) => {
  const creds = await getValidCreds();
  if (!creds) { res.status(401).json({ error: "not_logged_in" }); return; }
  try {
    const channels = await fetchChannels(creds);
    res.json({ channels });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// Live HLS playlist for a JioTV channel
router.get("/jiotv/live/:id", async (req, res) => {
  const { id } = req.params;
  let creds = await getValidCreds();
  if (!creds) { res.status(401).json({ error: "not_logged_in" }); return; }

  async function tryFetchStream(c: JioCreds): Promise<{ url: string; ck: string } | null> {
    const body = new URLSearchParams({ stream_type: "Seek", channel_id: id }).toString();
    const r = await fetch(
      "https://jiotvapi.media.jio.com/playback/apis/v1/geturl?langId=6",
      {
        method: "POST",
        headers: jioPlaybackHeaders(c, id),
        body,
        signal: AbortSignal.timeout(12_000),
      },
    );
    const data = (await r.json()) as { code?: number; result?: string };
    if (data.code !== 200 || !data.result) return null;
    // Extract cookie portion from query string
    const [, query = ""] = data.result.split("?");
    const ck = Buffer.from(query).toString("hex");
    return { url: data.result, ck };
  }

  let streamData = await tryFetchStream(creds);
  if (!streamData) {
    // Try refreshing token once
    const refreshed = await refreshToken(creds);
    if (refreshed) {
      creds = refreshed;
      streamData = await tryFetchStream(creds);
    }
  }

  if (!streamData) {
    res.status(502).json({ error: "Could not get stream URL from JioTV" });
    return;
  }

  try {
    const upstream = await fetch(streamData.url, {
      headers: { "User-Agent": JIO_UA },
      signal: AbortSignal.timeout(12_000),
    });
    const text = await upstream.text();
    const rewritten = rewriteJioPlaylist(text, upstream.url || streamData.url, streamData.ck);
    res.set("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    res.set("Cache-Control", "no-store");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(rewritten);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// Segment / sub-playlist proxy for JioTV (with cookie reattachment)
router.get("/jiotv/seg", async (req, res) => {
  const { u, ck } = req.query as { u?: string; ck?: string };
  if (!u) { res.status(400).send("missing u"); return; }

  let targetUrl: URL;
  try { targetUrl = new URL(u); } catch { res.status(400).send("bad url"); return; }

  let cookie = "";
  if (ck) {
    try { cookie = Buffer.from(ck, "hex").toString("utf-8"); } catch { /* ignore */ }
  }

  const headers: Record<string, string> = {
    "User-Agent": JIO_UA,
    "Origin": "https://www.jiocinema.com",
    "Referer": "https://www.jiocinema.com/",
  };
  if (cookie) headers["Cookie"] = cookie;
  if (req.headers.range) headers["Range"] = req.headers.range;

  try {
    const upstream = await fetch(targetUrl.toString(), {
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

    if (isPlaylist) {
      const text = await upstream.text();
      const rewritten = rewriteJioPlaylist(text, upstream.url || targetUrl.toString(), ck ?? "");
      res.set("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
      res.set("Cache-Control", "no-store");
      res.status(upstream.status).send(rewritten);
      return;
    }

    for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "cache-control"]) {
      const v = upstream.headers.get(h);
      if (v) res.set(h, v);
    }
    if (!res.getHeader("content-type")) res.set("Content-Type", "application/octet-stream");
    res.status(upstream.status);

    if (upstream.body) {
      const reader = upstream.body.getReader();
      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        res.write(Buffer.from(value));
        return pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch {
    if (!res.headersSent) res.status(502).send("upstream error");
  }
});

export default router;
