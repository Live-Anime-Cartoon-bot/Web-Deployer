import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SafeHtml } from "@/components/SafeHtml";
import { supabase } from "@/integrations/supabase/client";

type Page = { title: string; html: string };

export function PageView() {
  const { slug } = useParams({ from: "/pages/$slug" });
  const [page, setPage] = useState<Page | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase
      .from("pages")
      .select("title,html")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setPage(data as Page);
      });
  }, [slug]);

  if (notFound) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Page not found</h1>
          <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">
            ← Back home
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!page) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
          Loading…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <article className="mx-auto max-w-3xl px-4 pt-6 pb-10">
        <h1 className="text-3xl font-bold">{page.title}</h1>
        <SafeHtml html={page.html} className="prose prose-invert mt-6 max-w-none" />
      </article>
    </AppShell>
  );
}
