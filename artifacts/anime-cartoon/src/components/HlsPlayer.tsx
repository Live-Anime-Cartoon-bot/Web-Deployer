import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { proxiedStreamUrl } from "@/lib/stream-url";

interface Props {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

const UNAVAILABLE_MESSAGE = "Stream unavailable. Please try another channel.";
const RETRYING_MESSAGE = "Stream reconnecting…";

export function HlsPlayer({ src, poster, autoPlay = true, className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);

    const proxied = proxiedStreamUrl(src);
    let hls: Hls | null = null;
    let cancelled = false;
    let recoveryAttempts = 0;
    const recoveryTimers: number[] = [];

    const scheduleRecovery = (fn: () => void) => {
      if (recoveryAttempts >= 8) {
        setError(UNAVAILABLE_MESSAGE);
        return;
      }
      recoveryAttempts += 1;
      setError(RETRYING_MESSAGE);
      const timer = window.setTimeout(() => {
        if (!cancelled) fn();
      }, 700 * recoveryAttempts);
      recoveryTimers.push(timer);
    };

    function initHls() {
      if (!video) return;
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hls.loadSource(proxied);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          recoveryAttempts = 0;
          setError(null);
          if (autoPlay && !cancelled) {
            video.play().catch(() => {});
          }
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            scheduleRecovery(() => {
              hls?.destroy();
              hls = null;
              initHls();
            });
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS (Safari)
        video.src = proxied;
        if (autoPlay) video.play().catch(() => {});
      } else {
        setError("Your browser does not support HLS streams.");
      }
    }

    initHls();

    return () => {
      cancelled = true;
      recoveryTimers.forEach(clearTimeout);
      hls?.destroy();
    };
  }, [src, autoPlay, retryNonce]);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-black ${className ?? ""}`}>
      <video
        ref={videoRef}
        poster={poster}
        controls
        playsInline
        className="aspect-video w-full"
      />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 p-6 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          {error === UNAVAILABLE_MESSAGE && (
            <button
              onClick={() => setRetryNonce((n) => n + 1)}
              className="rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
