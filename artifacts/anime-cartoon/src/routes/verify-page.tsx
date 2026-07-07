import { useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { completeVerification, startVerification } from "@/lib/verify";
import { ShieldCheck } from "lucide-react";

type VerifySearch = { token?: string; returnTo?: string };

export function VerifyPage() {
  const { token, returnTo } = useSearch({ from: "/verify" }) as VerifySearch;
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "redirecting" | "verifying" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      setStatus("verifying");
      const dest = completeVerification(token);
      if (dest) {
        window.location.replace(dest);
      } else {
        setStatus("error");
        setMessage("This verification link is invalid or expired. Please request a fresh link.");
      }
    }
  }, [token, navigate]);

  async function onUnlock() {
    setStatus("redirecting");
    try {
      await startVerification(returnTo || "/live");
    } catch (e) {
      setStatus("error");
      setMessage((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-6 text-center shadow-glow">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand/20 text-brand">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold">Verify to Continue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          To support the server, please complete a quick verification. It only takes a few seconds
          and unlocks streaming for 12 hours.
        </p>

        {status === "verifying" && (
          <p className="mt-6 text-sm text-accent">Verifying token…</p>
        )}

        {status === "error" && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-live">{message}</p>
            <button
              onClick={onUnlock}
              className="w-full rounded-xl gradient-brand px-4 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-glow"
            >
              Try again
            </button>
          </div>
        )}

        {!token && status === "idle" && (
          <button
            onClick={onUnlock}
            className="mt-6 w-full rounded-xl gradient-brand px-4 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-glow"
          >
            Verify Now
          </button>
        )}

        {status === "redirecting" && (
          <p className="mt-6 text-sm text-muted-foreground">Opening verification link…</p>
        )}

        <ol className="mt-6 space-y-2 text-left text-xs text-muted-foreground">
          <li>1. Tap "Verify Now" — opens shrinkme.io in a new tab/window.</li>
          <li>2. Wait a few seconds and tap "Get Link" / "Continue".</li>
          <li>3. You'll return here automatically and streaming will unlock.</li>
        </ol>
      </div>
    </div>
  );
}
