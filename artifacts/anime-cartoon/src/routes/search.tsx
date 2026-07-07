import { Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

type SearchPost = {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  categories: { slug: string; name: string } | null;
};

export function SearchPage() {
  const { q = "" } = useSearch({ from: "/search" });
  const navigate = useNavigate({ from: "/search" });
  const [input, setInput] = useState(q);

  const { data: posts = [], isFetching } = useQuery({
    queryKey: ["search-posts", q],
    queryFn: async (): Promise<SearchPost[]> => {
      const term = (q as string).trim().slice(0, 100);
      if (!term) return [];
      const pattern = `%${term.replace(/[%_]/g, "\\$&")}%`;
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,slug,cover_image,categories(slug,name)")
        .eq("published", true)
        .or(`title.ilike.${pattern},slug.ilike.${pattern}`)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as SearchPost[];
    },
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      navigate({ search: { q: input.trim() } });
    }, 300);
    return () => clearTimeout(t);
  }, [input, navigate]);

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
          <div className="flex flex-1 items-center gap-2 rounded-full bg-surface px-4 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search movies, anime, series…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {input && (
              <button onClick={() => setInput("")}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {!q && (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            Start typing to search…
          </div>
        )}

        {q && isFetching && (
          <div className="mt-8 text-center text-sm text-muted-foreground">Searching…</div>
        )}

        {q && !isFetching && posts.length === 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            No results for "{q}"
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                to="/posts/$slug"
                params={{ slug: post.slug }}
                className="group"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface shadow-card">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-3xl font-bold text-muted-foreground">
                      {post.title[0]}
                    </div>
                  )}
                </div>
                <div className="mt-2 line-clamp-2 text-xs font-medium">{post.title}</div>
                {post.categories?.name && (
                  <div className="mt-0.5 text-[10px] uppercase text-muted-foreground">
                    {post.categories.name}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
