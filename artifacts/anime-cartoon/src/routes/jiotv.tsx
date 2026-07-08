import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Tv2, Search, Play, Loader2, AlertCircle, Settings,
} from "lucide-react";
import { HlsPlayer } from "@/components/HlsPlayer";
import { AppShell } from "@/components/AppShell";
import { apiUrl } from "@/lib/api-base";

// ─── Types ────────────────────────────────────────────────────────────────────
interface JioChannel {
  channel_id: string;
  channel_name: string;
  channelCategoryId: string;
  channelLanguageId: string;
  logoUrl: string;
}

type PageState = "loading" | "no-creds" | "channels" | "watch";

const CATEGORIES: Record<string, string> = {
  Entertainment: "Entertainment",
  Kids: "Kids",
  Cartoon: "Cartoon",
  Movies: "Movies",
  News: "News",
  Sports: "Sports",
  Music: "Music",
  Devotional: "Devotional",
  Lifestyle: "Lifestyle",
  Infotainment: "Infotainment",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export function JioTVPage() {
  const [state, setState] = useState<PageState>("loading");
  const [watchId, setWatchId] = useState<string | null>(null);
  const [watchName, setWatchName] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/jiotv/status"))
      .then((r) => r.json())
      .then((d: { loggedIn: boolean }) => setState(d.loggedIn ? "channels" : "no-creds"))
      .catch(() => setState("no-creds"));
  }, []);

  if (state === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "no-creds") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-xs text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gradient-brand shadow-glow">
            <Tv2 className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-lg font-bold">JioTV Not Configured</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            JioTV login needs to be set up once by the admin. Visit the admin panel to configure it.
          </p>
          <Link
            to="/admin"
            className="mt-5 inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            <Settings className="h-4 w-4" /> Open Admin Panel
          </Link>
          <div className="mt-4">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state === "watch" && watchId) {
    return (
      <JioTVWatch
        channelId={watchId}
        channelName={watchName}
        onBack={() => setState("channels")}
      />
    );
  }

  return (
    <JioTVChannels
      onWatch={(id, name) => {
        setWatchId(id);
        setWatchName(name);
        setState("watch");
      }}
    />
  );
}

// ─── Channels grid ────────────────────────────────────────────────────────────
function JioTVChannels({
  onWatch,
}: {
  onWatch: (id: string, name: string) => void;
}) {
  const [channels, setChannels] = useState<JioChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  useEffect(() => {
    fetch(apiUrl("/api/jiotv/channels"))
      .then((r) => r.json())
      .then((d: { channels?: JioChannel[]; error?: string }) => {
        if (d.error) setError(d.error);
        else setChannels(d.channels ?? []);
        setLoading(false);
      })
      .catch(() => { setError("Network error"); setLoading(false); });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => set.add(c.channelCategoryId));
    return ["All", ...set];
  }, [channels]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return channels.filter((c) => {
      if (cat !== "All" && c.channelCategoryId !== cat) return false;
      if (q && !c.channel_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [channels, query, cat]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-brand" />
          <p className="text-sm text-muted-foreground">Loading JioTV channels…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-1 items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl gradient-brand shadow-glow">
              <Tv2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">JioTV</h1>
              <p className="text-[11px] text-muted-foreground">{channels.length} channels</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-live">
            <span className="live-dot" /> LIVE
          </span>
        </div>

        {/* Search */}
        <div className="mt-3 flex items-center gap-2 rounded-full bg-surface px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Category filter */}
        <div className="scrollbar-hide -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                cat === c
                  ? "gradient-brand text-primary-foreground shadow-glow"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {CATEGORIES[c] ?? c}
            </button>
          ))}
        </div>

        <div className="mt-4 mb-2 flex items-center gap-2 text-sm">
          <span className="live-dot" />
          <span className="font-semibold">Live Now</span>
          <span className="text-muted-foreground">({filtered.length})</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((ch) => (
            <button
              key={ch.channel_id}
              onClick={() => onWatch(ch.channel_id, ch.channel_name)}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3 transition hover:border-brand hover:bg-surface-2"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-background ring-2 ring-border group-hover:ring-brand">
                {ch.logoUrl ? (
                  <img
                    src={ch.logoUrl}
                    alt={ch.channel_name}
                    loading="lazy"
                    className="h-full w-full object-contain p-1"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-lg font-bold text-muted-foreground">
                    {ch.channel_name[0]}
                  </div>
                )}
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-sm bg-live px-1 py-px text-[8px] font-bold uppercase text-live-foreground">
                  Live
                </span>
              </div>
              <div className="line-clamp-2 text-center text-[11px] font-medium">
                {ch.channel_name}
              </div>
              <div className="text-[9px] text-muted-foreground">
                {CATEGORIES[ch.channelCategoryId] ?? ch.channelCategoryId}
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            No channels match your search.
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Watch ────────────────────────────────────────────────────────────────────
function JioTVWatch({
  channelId,
  channelName,
  onBack,
}: {
  channelId: string;
  channelName: string;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface hover:bg-surface-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="live-dot shrink-0" />
          <h1 className="truncate text-sm font-semibold">{channelName}</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full gradient-brand px-3 py-1">
          <Play className="h-3 w-3 fill-current text-white" />
          <span className="text-xs font-bold uppercase text-white">JioTV</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 pt-3">
        <HlsPlayer src={apiUrl(`/api/jiotv/live/${encodeURIComponent(channelId)}`)} />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Streaming via JioTV · {channelName}
        </p>
      </div>
    </div>
  );
}
