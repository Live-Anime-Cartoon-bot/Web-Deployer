export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string;
  group: string;
}

const PLAYLIST_URL =
  "https://raw.githubusercontent.com/Live-Anime-Cartoon-bot/Gh/refs/heads/main/M3u";

const FALLBACK_PLAYLIST_URL = "https://iptv-org.github.io/iptv/categories/kids.m3u";

const PINNED_CHANNELS: Channel[] = [
  {
    id: "pogo",
    name: "POGO",
    logo: "https://static.wikia.nocookie.net/robotwars/images/1/1f/PogoTV.png/revision/latest?cb=20210927185053",
    url: "https://line.sweetv.xyz/play/live.php?mac=00:1A:79:00:03:B2&stream=156128&extension=m3u8&play_token=9sBGXoBcMI",
    category: "Cartoon",
    group: "Cartoon",
  },
  {
    id: "minimax",
    name: "Minimax",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/e9/Minimax_%282021%29.webp",
    url: "https://vodzong.mjunoon.tv:8087/streamtest/157-1M/chunks.m3u8",
    category: "Cartoon",
    group: "Cartoon",
  },
];

const TRUSTED_FALLBACK_NAMES = [
  "3ABN Kids Network",
  "90's Kids",
  "90s Kids TV 2",
  "13 Kids",
  "ABC Kids",
  "Akili Kids!",
  "Duck TV",
  "Happy Kids",
  "Kartoon Channel!",
  "Kidoodle TV",
  "KidsFlix",
  "PBS Kids",
  "Ryan and Friends",
  "Toon Goggles",
];

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function categoryOf(name: string): string {
  const n = name.toLowerCase();
  if (/(nick jr|kids nursery|chuchu|jugnu|disney junior)/.test(n)) return "Kids";
  if (/(cartoon network|pogo|sonic|disney|nick|hungama|discovery)/.test(n)) return "Cartoon";
  if (/(doraemon|shinchan|oggy|crayon|anime|naruto|one piece)/.test(n)) return "Anime";
  if (
    /(little singham|chhota bheem|krishna|motu|gattu|chacha|kid krrish|vir |kicko|mighty raju|super bheem|roll no 21|tom and jerry|mickey)/.test(
      n,
    )
  )
    return "Cartoon";
  return "Live TV";
}

function channelKey(channel: Pick<Channel, "id" | "name">): string {
  return slug(channel.id || channel.name);
}

function withPinnedChannels(channels: Channel[]): Channel[] {
  const pinnedKeys = new Set(PINNED_CHANNELS.map(channelKey));
  const pinnedNames = new Set(PINNED_CHANNELS.map((c) => c.name.toLowerCase()));
  const rest = channels.filter(
    (c) => !pinnedKeys.has(channelKey(c)) && !pinnedNames.has(c.name.toLowerCase()),
  );
  return [...PINNED_CHANNELS, ...rest];
}

async function fetchWithTimeout(url: string, timeoutMs = 8_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function parseM3U(text: string): Channel[] {
  const lines = text.split(/\r?\n/);
  const channels: Channel[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("#EXTINF")) continue;
    const logo = line.match(/tvg-logo="([^"]*)"/)?.[1] ?? "";
    const group = line.match(/group-title="([^"]*)"/)?.[1] ?? "";
    const name = line.split(",").slice(1).join(",").trim();
    const url = (lines[i + 1] ?? "").trim();
    if (!url || url.startsWith("#")) continue;
    let id = slug(name) || `ch-${channels.length}`;
    let n = 1;
    while (seen.has(id)) id = `${slug(name)}-${n++}`;
    seen.add(id);
    channels.push({
      id,
      name,
      logo,
      url,
      group,
      category: group || categoryOf(name),
    });
  }
  return channels;
}

let _cachedChannels: Channel[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function fetchChannels(): Promise<Channel[]> {
  if (_cachedChannels && Date.now() - _cacheTime < CACHE_TTL) {
    return _cachedChannels;
  }

  let channels: Channel[] = [];

  // Try main playlist
  try {
    const res = await fetchWithTimeout(PLAYLIST_URL);
    if (res.ok) {
      const text = await res.text();
      channels = parseM3U(text);
    }
  } catch {
    // fall through to fallback
  }

  // Try fallback if main was empty/failed
  if (channels.length === 0) {
    try {
      const res = await fetchWithTimeout(FALLBACK_PLAYLIST_URL);
      if (res.ok) {
        const text = await res.text();
        const all = parseM3U(text);
        channels = all.filter((c) =>
          TRUSTED_FALLBACK_NAMES.some((n) => c.name.toLowerCase().includes(n.toLowerCase())),
        );
        if (channels.length === 0) channels = all.slice(0, 20);
      }
    } catch {
      channels = [];
    }
  }

  const result = withPinnedChannels(channels);
  _cachedChannels = result;
  _cacheTime = Date.now();
  return result;
}
