import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Tv2, Phone, KeyRound, LogOut, Search, Play, Loader2, AlertCircle } from "lucide-react";
import { HlsPlayer } from "@/components/HlsPlayer";
import { AppShell } from "@/components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────
interface JioChannel {
  channel_id: string;
  channel_name: string;
  channelCategoryId: string;
  channelLanguageId: string;
  logoUrl: string;
  isCatchupAvailable?: string;
}

type Step = "checking" | "login-phone" | "login-otp" | "channels" | "watch";

const CATEGORIES: Record<string, string> = {
  "Entertainment": "Entertainment",
  "Kids": "Kids",
  "Cartoon": "Cartoon",
  "Movies": "Movies",
  "News": "News",
  "Sports": "Sports",
  "Music": "Music",
  "Devotional": "Devotional",
  "Lifestyle": "Lifestyle",
  "Infotainment": "Infotainment",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export function JioTVPage() {
  const [step, setStep] = useState<Step>("checking");
  const [watchId, setWatchId] = useState<string | null>(null);
  const [watchName, setWatchName] = useState("");

  useEffect(() => {
    fetch("/api/jiotv/status")
      .then((r) => r.json())
      .then((d: { loggedIn: boolean }) => {
        setStep(d.loggedIn ? "channels" : "login-phone");
      })
      .catch(() => setStep("login-phone"));
  }, []);

  function onWatch(id: string, name: string) {
    setWatchId(id);
    setWatchName(name);
    setStep("watch");
  }

  function onLogout() {
    fetch("/api/jiotv/logout", { method: "POST" });
    setStep("login-phone");
  }

  if (step === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (step === "watch" && watchId) {
    return (
      <JioTVWatch
        channelId={watchId}
        channelName={watchName}
        onBack={() => setStep("channels")}
      />
    );
  }

  if (step === "login-phone" || step === "login-otp") {
    return (
      <JioTVLogin
        step={step}
        onSuccess={() => setStep("channels")}
        onOtpSent={() => setStep("login-otp")}
      />
    );
  }

  return (
    <JioTVChannels
      onWatch={onWatch}
      onLogout={onLogout}
    />
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function JioTVLogin({
  step,
  onSuccess,
  onOtpSent,
}: {
  step: "login-phone" | "login-otp";
  onSuccess: () => void;
  onOtpSent: () => void;
}) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    if (!/^\d{10}$/.test(mobile)) { setError("Enter a valid 10-digit mobile number"); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/jiotv/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (d.ok) { onOtpSent(); }
      else setError(d.error ?? "Failed to send OTP");
    } catch { setError("Network error"); }
    setLoading(false);
  }

  async function verifyOtp() {
    if (!/^\d{4,6}$/.test(otp)) { setError("Enter the OTP received"); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/jiotv/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (d.ok) { onSuccess(); }
      else setError(d.error ?? "OTP verification failed");
    } catch { setError("Network error"); }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-brand shadow-glow">
            <Tv2 className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">JioTV</h1>
            <p className="text-xs text-muted-foreground">Sign in with your Jio number</p>
          </div>
        </div>

        {step === "login-phone" ? (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mobile Number
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-3">
                <span className="shrink-0 text-sm text-muted-foreground">+91</span>
                <span className="h-4 w-px shrink-0 bg-border" />
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit number"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </label>

            {error && <ErrorBox msg={error} />}

            <button
              onClick={sendOtp}
              disabled={loading || mobile.length < 10}
              className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-white shadow-glow disabled:opacity-60"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              OTP sent to <span className="font-semibold text-foreground">+91 {mobile}</span>
            </p>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enter OTP
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-3">
                <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter OTP"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </label>

            {error && <ErrorBox msg={error} />}

            <button
              onClick={verifyOtp}
              disabled={loading || otp.length < 4}
              className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-white shadow-glow disabled:opacity-60"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Verify & Watch"}
            </button>

            <button
              onClick={() => { setOtp(""); setError(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              ← Change number
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to App
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Channels ─────────────────────────────────────────────────────────────────
function JioTVChannels({
  onWatch,
  onLogout,
}: {
  onWatch: (id: string, name: string) => void;
  onLogout: () => void;
}) {
  const [channels, setChannels] = useState<JioChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  useEffect(() => {
    fetch("/api/jiotv/channels")
      .then((r) => r.json())
      .then((d: { channels?: JioChannel[]; error?: string }) => {
        if (d.error === "not_logged_in") { setError("not_logged_in"); }
        else { setChannels(d.channels ?? []); }
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
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={onLogout}
            className="mt-4 rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-glow"
          >
            Re-login
          </button>
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
          <button
            onClick={() => { if (confirm("Sign out of JioTV?")) onLogout(); }}
            aria-label="Sign out"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
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

        {/* Live badge */}
        <div className="mt-4 mb-2 flex items-center gap-2 text-sm">
          <span className="live-dot" />
          <span className="font-semibold">Live Now</span>
          <span className="text-muted-foreground">({filtered.length})</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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

        {filtered.length === 0 && !loading && (
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
  const streamUrl = `/api/jiotv/live/${encodeURIComponent(channelId)}`;

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
        <HlsPlayer src={streamUrl} />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Streaming via JioTV · {channelName}
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-destructive/15 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {msg}
    </div>
  );
}
