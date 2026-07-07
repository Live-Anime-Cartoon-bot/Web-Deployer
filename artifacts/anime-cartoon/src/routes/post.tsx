import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Play, Download, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SafeHtml } from "@/components/SafeHtml";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-hooks";

type Post = {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  excerpt: string | null;
  html: string | null;
  published_at: string | null;
  categories: { slug: string; name: string } | null;
};

type Episode = {
  id: string;
  season_number: number;
  episode_number: number;
  title: string | null;
  watch_url: string | null;
  download_url: string | null;
};

type Comment = {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export function PostPage() {
  const { slug } = useParams({ from: "/posts/$slug" });
  const { session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [selectedEp, setSelectedEp] = useState<Episode | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase
      .from("posts")
      .select("id,title,slug,cover_image,excerpt,html,published_at,categories(slug,name)")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setNotFound(true); return; }
        setPost(data as unknown as Post);

        // Load episodes
        supabase
          .from("episodes")
          .select("*")
          .eq("post_id", (data as { id: string }).id)
          .order("season_number")
          .order("episode_number")
          .then(({ data: eps }) => {
            const epList = (eps ?? []) as Episode[];
            setEpisodes(epList);
            if (epList.length > 0) setSelectedEp(epList[0]);
          });

        // Load approved comments
        supabase
          .from("comments")
          .select("id,author_name,body,created_at")
          .eq("post_id", (data as { id: string }).id)
          .eq("approved", true)
          .order("created_at")
          .then(({ data: coms }) => setComments((coms ?? []) as Comment[]));
      });
  }, [slug]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !post) return;
    setPosting(true);
    const name = session.user.email?.split("@")[0] ?? "user";
    const { error } = await supabase.from("comments").insert({
      post_id: post.id,
      user_id: session.user.id,
      author_name: name,
      body: body.trim(),
    });
    if (error) {
      setMsg("Failed to post. Try again.");
    } else {
      setMsg("Comment submitted for review.");
      setBody("");
    }
    setPosting(false);
  }

  if (notFound) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Post not found</h1>
          <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">
            ← Back home
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
          Loading…
        </div>
      </AppShell>
    );
  }

  const seasons = [...new Set(episodes.map((e) => e.season_number))].sort((a, b) => a - b);

  return (
    <AppShell>
      <article className="mx-auto max-w-3xl px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          {post.categories?.name && (
            <span className="rounded-full gradient-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
              {post.categories.name}
            </span>
          )}
        </div>

        {/* Cover */}
        {post.cover_image && (
          <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl bg-surface shadow-card">
            <img
              src={post.cover_image}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <h1 className="mt-4 text-2xl font-extrabold leading-tight">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}
        {post.published_at && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {new Date(post.published_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        {/* Episodes */}
        {episodes.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-base font-bold">Episodes</h2>

            {/* Season tabs */}
            {seasons.length > 1 && (
              <div className="scrollbar-hide -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
                {seasons.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      const ep = episodes.find((e) => e.season_number === s);
                      if (ep) setSelectedEp(ep);
                    }}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ${
                      selectedEp?.season_number === s
                        ? "gradient-brand text-primary-foreground shadow-glow"
                        : "bg-surface text-muted-foreground"
                    }`}
                  >
                    Season {s}
                  </button>
                ))}
              </div>
            )}

            {/* Episode list for selected season */}
            <div className="space-y-2">
              {episodes
                .filter((ep) => !seasons.length || !selectedEp || ep.season_number === selectedEp.season_number)
                .map((ep) => (
                  <div
                    key={ep.id}
                    className={`rounded-xl border bg-surface p-3 ${
                      selectedEp?.id === ep.id ? "border-brand shadow-glow" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedEp(ep)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className="shrink-0 text-xs font-bold text-muted-foreground">
                          {ep.episode_number < 10 ? `0${ep.episode_number}` : ep.episode_number}
                        </span>
                        <span className="line-clamp-1 text-sm font-medium">
                          {ep.title || `Episode ${ep.episode_number}`}
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">
                        {ep.watch_url && (
                          <a
                            href={ep.watch_url}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-8 w-8 place-items-center rounded-full gradient-brand text-primary-foreground shadow-glow"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                          </a>
                        )}
                        {ep.download_url && (
                          <a
                            href={ep.download_url}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/20 text-emerald-400"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* HTML body */}
        {post.html && (
          <SafeHtml html={post.html} className="prose prose-invert mt-8 max-w-none" />
        )}

        {/* Comments */}
        <section className="mt-12 border-t border-border pt-6 pb-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-5 w-5" /> Comments ({comments.length})
          </h2>

          {session ? (
            <form onSubmit={submitComment} className="mt-4 space-y-2">
              <textarea
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your thoughts…"
                className="h-24 w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:border-brand resize-none"
              />
              <div className="flex items-center gap-3">
                <button
                  disabled={posting || !body.trim()}
                  className="rounded-full gradient-brand px-5 py-2 text-xs font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
                >
                  {posting ? "Posting…" : "Post comment"}
                </button>
                {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
              </div>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link to="/auth" className="text-accent hover:underline">
                Sign in
              </Link>{" "}
              to comment.
            </p>
          )}

          <ul className="mt-6 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="text-sm font-semibold">{c.author_name}</div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </li>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground">Be the first to comment.</p>
            )}
          </ul>
        </section>
      </article>
    </AppShell>
  );
}
