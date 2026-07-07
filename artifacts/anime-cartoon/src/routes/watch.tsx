import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { HlsPlayer } from "@/components/HlsPlayer";
import { fetchChannels, type Channel } from "@/lib/m3u";
import { hasValidToken, startVerification, tokenExpiresAt } from "@/lib/verify";

export function WatchPage() {
  const { id } = useParams({ from: "/watch/$id" });
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    fetchChannels().then((ch) => {
      setChannels(ch);
      setLoading(false);
    });
    setUnlocked(hasValidToken());
    setExpiresAt(tokenExpiresAt());
  }, []);

  const channel = channels.find((c) => c.id === id);

  async function onUnlock() {
    setWorking(true);
    try {
      await startVerification(window.location.pathname);
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-xl font-semibold">Channel not found</h1>
        <Link to="/live" className="mt-4 inline-block text-accent underline">
          Back to Live TV
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/live"
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface hover:bg-surface-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="live-dot shrink-0" />
          <h1 className="truncate text-sm font-semibold uppercase tracking-wide">{channel.name}</h1>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold uppercase text-live">Live</span>
      </header>

      <div className="mx-auto max-w-5xl px-3 pt-3">
        {unlocked ? (
          <>
            <HlsPlayer src={channel.url} poster={channel.logo || undefined} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Access unlocked
              {expiresAt
                ? ` · expires ${new Date(expiresAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : ""}
            </p>
          </>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 text-center shadow-glow">
            {channel.logo && (
              <img
                src={channel.logo}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 blur-2xl"
              />
            )}
            <div className="relative">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand/20 text-brand">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold">Verify to Watch</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                To support the server, please complete a quick verification. It only takes a few
                seconds and unlocks streaming for 12 hours.
              </p>
              <button
                onClick={onUnlock}
                disabled={working}
                className="mt-6 w-full rounded-xl gradient-brand px-4 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-glow disabled:opacity-60"
              >
                {working ? "Opening…" : "Verify Now"}
              </button>
              <ol className="mt-6 space-y-2 text-left text-xs text-muted-foreground">
                <li>1. Tap "Verify Now" — opens shrinkme.io in a new tab/window.</li>
                <li>2. Wait a few seconds and tap "Get Link" / "Continue".</li>
                <li>3. You'll return here automatically and streaming will unlock.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Related channels */}
        {channels.length > 1 && (
          <section className="mt-8 pb-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              More Channels
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {channels
                .filter((c) => c.id !== channel.id)
                .slice(0, 12)
                .map((c) => (
                  <Link
                    key={c.id}
                    to="/watch/$id"
                    params={{ id: c.id }}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-2 text-center hover:bg-surface-2"
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-background">
                      {c.logo ? (
                        <img
                          src={c.logo}
                          alt={c.name}
                          className="h-full w-full object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs font-bold text-muted-foreground">
                          {c.name[0]}
                        </div>
                      )}
                    </div>
                    <span className="line-clamp-1 text-[9px] font-medium uppercase">{c.name}</span>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
