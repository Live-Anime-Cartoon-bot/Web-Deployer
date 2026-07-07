import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, Bell, Wifi, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { fetchChannels, type Channel } from "@/lib/m3u";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type RailPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
  categories: { slug: string; name: string } | null;
};

const RAILS: { title: string; slug: string; variant: "poster" | "wide" }[] = [
  { title: "New Shows", slug: "new-shows", variant: "wide" },
  { title: "Top Action Movies", slug: "top-action-movies", variant: "poster" },
  { title: "Latest Movies", slug: "latest-movies", variant: "poster" },
  { title: "Latest Web Series", slug: "latest-web-series", variant: "poster" },
];

export function HomePage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const { data: posts = [] } = useQuery({
    queryKey: ["home-posts"],
    queryFn: async (): Promise<RailPost[]> => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,slug,excerpt,cover_image,published_at,created_at,categories(slug,name)")
        .eq("published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []) as unknown as RailPost[];
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    fetchChannels().then(setChannels);
  }, []);

  const trendingPost = posts[0];
  const trendingChannel =
    channels.find((c) => /little singham|chhota bheem/i.test(c.name)) ?? channels[0];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 pt-3">
        <TopBar />

        {trendingPost ? (
          <TrendingHeroPost post={trendingPost} />
        ) : trendingChannel ? (
          <TrendingHero channel={trendingChannel} />
        ) : null}

        <LiveButton count={channels.length} />

        {RAILS.map((r) => {
          const items = posts.filter((p) => p.categories?.slug === r.slug);
          return <PostRail key={r.slug} title={r.title} items={items} variant={r.variant} />;
        })}

        {/* All posts fallback if no rail categories */}
        {RAILS.every((r) => posts.filter((p) => p.categories?.slug === r.slug).length === 0) &&
          posts.length > 0 && (
            <PostRail title="All Content" items={posts.slice(0, 20)} variant="poster" />
          )}
      </div>
    </AppShell>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between pb-3">
      <Link to="/" className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2">
        <span className="grid h-6 w-6 place-items-center rounded-full gradient-brand">
          <Play className="h-3 w-3 fill-current text-primary-foreground" />
        </span>
        <span className="text-sm font-bold">Anime Cartoon</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          to="/search"
          search={{ q: "" }}
          aria-label="Search"
          className="grid h-10 w-10 place-items-center rounded-full bg-surface text-muted-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" />
        </Link>
        <button className="relative grid h-10 w-10 place-items-center rounded-full bg-surface">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-live" />
        </button>
        <Link
          to="/auth"
          className="grid h-10 w-10 place-items-center rounded-full bg-surface text-sm font-bold"
        >
          S
        </Link>
      </div>
    </div>
  );
}

function TrendingHeroPost({ post }: { post: RailPost }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
      {post.cover_image && (
        <img
          src={post.cover_image}
          alt={post.title}
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
      )}
      <div className="relative px-5 py-8">
        {post.categories?.name && (
          <span className="inline-block rounded-full gradient-brand px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
            {post.categories.name}
          </span>
        )}
        <h2 className="mt-3 text-2xl font-extrabold leading-tight">{post.title}</h2>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        )}
        <Link
          to="/posts/$slug"
          params={{ slug: post.slug }}
          className="mt-5 inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          <Play className="h-3.5 w-3.5 fill-current" /> Watch Now
        </Link>
      </div>
    </section>
  );
}

function TrendingHero({ channel }: { channel: Channel }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
      {channel.logo && (
        <img
          src={channel.logo}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-10 blur-2xl"
        />
      )}
      <div className="relative px-5 py-8">
        <span className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
          <Wifi className="h-3 w-3" /> Live Now
        </span>
        <h2 className="mt-3 text-2xl font-extrabold leading-tight">{channel.name}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Free 24/7 live stream</p>
        <Link
          to="/watch/$id"
          params={{ id: channel.id }}
          className="mt-5 inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          <Play className="h-3.5 w-3.5 fill-current" /> Watch Live
        </Link>
      </div>
    </section>
  );
}

function LiveButton({ count }: { count: number }) {
  return (
    <Link
      to="/live"
      className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:bg-surface-2"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full gradient-brand shadow-glow">
        <Wifi className="h-5 w-5 text-primary-foreground" />
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <span className="live-dot" /> Live TV
        </div>
        <div className="text-xs text-muted-foreground">{count} channels available</div>
      </div>
      <span className="text-sm font-semibold text-accent">Watch →</span>
    </Link>
  );
}

function PostRail({
  title,
  items,
  variant,
}: {
  title: string;
  items: RailPost[];
  variant: "poster" | "wide";
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-7">
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4">
        {items.slice(0, 12).map((post) =>
          variant === "wide" ? (
            <WideCardPost key={post.id} post={post} />
          ) : (
            <PosterCardPost key={post.id} post={post} />
          ),
        )}
      </div>
    </section>
  );
}

function PosterCardPost({ post }: { post: RailPost }) {
  return (
    <Link to="/posts/$slug" params={{ slug: post.slug }} className="w-28 shrink-0 sm:w-32">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface shadow-card">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-2xl font-bold text-muted-foreground">
            {post.title[0]}
          </div>
        )}
        <span className="absolute right-1.5 top-1.5 rounded bg-background/70 px-1.5 py-0.5 text-[10px] font-bold backdrop-blur">
          HD
        </span>
      </div>
      <div className="mt-1.5 line-clamp-1 text-xs font-medium">{post.title}</div>
    </Link>
  );
}

function WideCardPost({ post }: { post: RailPost }) {
  return (
    <Link to="/posts/$slug" params={{ slug: post.slug }} className="w-44 shrink-0 sm:w-52">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface shadow-card">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-2xl font-bold text-muted-foreground">
            {post.title[0]}
          </div>
        )}
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/60 backdrop-blur">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </span>
      </div>
      <div className="mt-1.5 line-clamp-1 text-xs font-semibold">{post.title}</div>
      {post.categories?.name && (
        <div className="text-[10px] uppercase text-muted-foreground">{post.categories.name}</div>
      )}
    </Link>
  );
}
