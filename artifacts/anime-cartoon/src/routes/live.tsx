import { Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Search, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fetchChannels, type Channel } from "@/lib/m3u";

export function LivePage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");

  useEffect(() => {
    fetchChannels().then(setChannels);
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => set.add(c.category));
    return ["All", ...set];
  }, [channels]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return channels.filter((c) => {
      if (cat !== "All" && c.category !== cat) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [channels, query, cat]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold leading-tight">Live TV</h1>
            <p className="text-xs text-muted-foreground">{channels.length} channels</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-live">
            <span className="live-dot" /> LIVE
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-surface px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="scrollbar-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                cat === c
                  ? "gradient-brand text-primary-foreground shadow-glow"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <a
          href="https://t.me/+wcZ4ZbYzPM9hZGM1"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:bg-surface-2"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-primary-foreground">
            <Send className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Join AnimeCartoon on Telegram</div>
            <div className="text-xs text-muted-foreground">Updates · new channels · support</div>
          </div>
          <span className="text-sm font-semibold text-accent">Join →</span>
        </a>

        <div className="mt-6 mb-3 flex items-center gap-2 text-sm">
          <span className="live-dot" />
          <span className="font-semibold">Live Now</span>
          <span className="text-muted-foreground">({filtered.length})</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((ch) => (
            <ChannelTile key={ch.id} ch={ch} />
          ))}
        </div>

        {filtered.length === 0 && channels.length > 0 && (
          <div className="mt-12 text-center text-sm text-muted-foreground">
            No channels match your search.
          </div>
        )}

        {channels.length === 0 && (
          <div className="mt-12 text-center text-sm text-muted-foreground">
            Loading channels…
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ChannelTile({ ch }: { ch: Channel }) {
  return (
    <Link
      to="/watch/$id"
      params={{ id: ch.id }}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3 transition hover:border-brand hover:bg-surface-2"
    >
      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-background ring-2 ring-border group-hover:ring-brand">
        {ch.logo ? (
          <img
            src={ch.logo}
            alt={ch.name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-lg font-bold text-muted-foreground">
            {ch.name[0]}
          </div>
        )}
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-sm bg-live px-1 py-px text-[8px] font-bold uppercase text-live-foreground">
          Live
        </span>
      </div>
      <div className="line-clamp-2 text-center text-[11px] font-medium uppercase tracking-wide">
        {ch.name}
      </div>
    </Link>
  );
}
