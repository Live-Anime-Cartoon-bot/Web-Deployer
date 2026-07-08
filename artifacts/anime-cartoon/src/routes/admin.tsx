import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Shield, LogOut, LayoutDashboard, FileText, FolderTree, Tags as TagsIcon,
  File, Tv, Tv2, MessageSquare, Plus, Trash2, Save, Loader2, Eye, EyeOff, Check, X,
  Phone, KeyRound, AlertCircle, Link2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useRoles, slugify } from "@/lib/auth-hooks";

type Section = "dashboard" | "posts" | "categories" | "tags" | "livetv" | "pages" | "comments" | "jiotv" | "shrinkme";

export function AdminPage() {
  const navigate = useNavigate();
  const { session, loading: sLoading } = useSession();
  const { roles, loading: rLoading, isAdmin, isEditor } = useRoles(session?.user.id);
  const [section, setSection] = useState<Section>("dashboard");

  useEffect(() => {
    if (!sLoading && !session) navigate({ to: "/auth" });
  }, [sLoading, session, navigate]);

  if (sLoading || rLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  if (!isEditor) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <Shield className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Not authorised</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.user.email} has no admin role.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Roles: {roles.join(", ") || "none"}</p>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
            className="mt-4 rounded-full bg-surface px-4 py-2 text-xs font-medium hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const navItems: { id: Section; label: string; icon: React.ReactNode; group?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "posts", label: "Posts", icon: <FileText className="h-4 w-4" />, group: "Content" },
    { id: "categories", label: "Categories", icon: <FolderTree className="h-4 w-4" />, group: "Content" },
    { id: "tags", label: "Tags", icon: <TagsIcon className="h-4 w-4" />, group: "Content" },
    { id: "livetv", label: "Live TV", icon: <Tv className="h-4 w-4" />, group: "Channels" },
    { id: "jiotv", label: "JioTV Login", icon: <Tv2 className="h-4 w-4" />, group: "Channels" },
    { id: "shrinkme", label: "Shrinkme Key", icon: <Link2 className="h-4 w-4" />, group: "Settings" },
    { id: "pages", label: "Pages", icon: <File className="h-4 w-4" /> },
    { id: "comments", label: "Comments", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  const groups: string[] = [];
  navItems.forEach((n) => { if (n.group && !groups.includes(n.group)) groups.push(n.group); });

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <Dashboard />;
      case "posts": return <PostsSection isAdmin={isAdmin} />;
      case "categories": return <CategoriesSection />;
      case "tags": return <TagsSection />;
      case "livetv": return <LiveTVSection />;
      case "pages": return <PagesSection />;
      case "comments": return <CommentsSection />;
      case "jiotv": return <JioTVAdminSection />;
      case "shrinkme": return <ShrinkmeSection />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl gradient-brand shadow-glow">
              <Shield className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-bold">Admin</span>
          </div>
          <p className="mt-1 truncate text-[10px] text-muted-foreground">{session.user.email}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {navItems
            .filter((n) => !n.group)
            .map((n) => (
              <NavBtn key={n.id} item={n} active={section === n.id} onClick={() => setSection(n.id)} />
            ))}

          {groups.map((g) => (
            <div key={g} className="mt-4">
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {g}
              </p>
              {navItems
                .filter((n) => n.group === g)
                .map((n) => (
                  <NavBtn key={n.id} item={n} active={section === n.id} onClick={() => setSection(n.id)} />
                ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
            <Eye className="h-3.5 w-3.5" /> View Site
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <span className="grid h-8 w-8 place-items-center rounded-xl gradient-brand shadow-glow">
            <Shield className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-bold">Admin</span>
          <div className="ml-auto flex gap-2">
            <Link to="/" className="rounded-full bg-surface px-3 py-1.5 text-xs">Site</Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
              className="rounded-full bg-surface px-3 py-1.5 text-xs"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-border px-4 py-2 lg:hidden">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                section === n.id
                  ? "gradient-brand text-primary-foreground shadow-glow"
                  : "bg-surface text-muted-foreground"
              }`}
            >
              {n.icon} {n.label}
            </button>
          ))}
        </div>

        <div className="p-4 lg:p-6">{renderSection()}</div>
      </div>
    </div>
  );
}

function NavBtn({ item, active, onClick }: { item: { label: string; icon: React.ReactNode }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
        active ? "gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {item.icon} {item.label}
    </button>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────── */
function Dashboard() {
  const [stats, setStats] = useState({ posts: 0, channels: 0, comments: 0, categories: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("channels").select("id", { count: "exact", head: true }),
      supabase.from("comments").select("id", { count: "exact", head: true }).eq("approved", false),
      supabase.from("categories").select("id", { count: "exact", head: true }),
    ]).then(([p, ch, co, ca]) => {
      setStats({
        posts: p.count ?? 0,
        channels: ch.count ?? 0,
        comments: co.count ?? 0,
        categories: ca.count ?? 0,
      });
    });
  }, []);

  const cards = [
    { label: "Total Posts", value: stats.posts, color: "text-brand" },
    { label: "Live Channels", value: stats.channels, color: "text-accent" },
    { label: "Pending Comments", value: stats.comments, color: "text-live" },
    { label: "Categories", value: stats.categories, color: "text-foreground" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className={`text-3xl font-extrabold ${c.color}`}>{c.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Posts ──────────────────────────────────────────────────── */
type PostRow = {
  id: string; title: string; slug: string; published: boolean;
  created_at: string; categories: { name: string } | null;
};

function PostsSection({ isAdmin }: { isAdmin: boolean }) {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [editing, setEditing] = useState<Partial<PostRow> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    supabase
      .from("posts")
      .select("id,title,slug,published,created_at,categories(name)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setPosts((data ?? []) as unknown as PostRow[]));

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    if (editing.id) {
      await supabase.from("posts").update({ title: editing.title, slug: editing.slug, published: editing.published }).eq("id", editing.id);
    } else {
      await supabase.from("posts").insert({ title: editing.title!, slug: editing.slug!, published: editing.published ?? false });
    }
    setSaving(false);
    setEditing(null);
    load();
  }

  if (editing !== null) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="grid h-8 w-8 place-items-center rounded-full bg-surface"><X className="h-4 w-4" /></button>
          <h2 className="text-xl font-bold">{editing.id ? "Edit Post" : "New Post"}</h2>
        </div>
        <div className="mt-4 space-y-4 max-w-2xl">
          <Field label="Title">
            <input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
          </Field>
          <Field label="Slug">
            <input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.published ?? false} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
            Published
          </label>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold flex-1">Posts</h2>
        <button onClick={() => setEditing({})} className="flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow">
          <Plus className="h-3.5 w-3.5" /> New Post
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-card">
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{p.title}</div>
              <div className="text-[11px] text-muted-foreground">{p.slug}</div>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.published ? "bg-emerald-500/20 text-emerald-400" : "bg-surface-2 text-muted-foreground"}`}>
              {p.published ? "live" : "draft"}
            </span>
            <button onClick={() => setEditing(p)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 hover:text-foreground">
              <Eye className="h-3.5 w-3.5" />
            </button>
            {isAdmin && (
              <button onClick={async () => { if (confirm("Delete post?")) { await supabase.from("posts").delete().eq("id", p.id); load(); } }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-destructive/20 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {posts.length === 0 && <div className="rounded-3xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">No posts yet.</div>}
      </div>
    </div>
  );
}

/* ─── Categories ─────────────────────────────────────────────── */
type CatRow = { id: string; name: string; slug: string; created_at: string };

function CategoriesSection() {
  const [cats, setCats] = useState<CatRow[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => supabase.from("categories").select("*").order("name").then(({ data }) => setCats((data ?? []) as CatRow[]));
  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name.trim()) });
    setName("");
    setSaving(false);
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Categories</h2>
      <div className="mt-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name"
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
        <button onClick={add} disabled={saving || !name.trim()} className="flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow disabled:opacity-60">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {cats.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-[11px] text-muted-foreground">{c.slug}</div>
            </div>
            <button onClick={async () => { if (confirm("Delete?")) { await supabase.from("categories").delete().eq("id", c.id); load(); } }}
              className="grid h-7 w-7 place-items-center rounded-full bg-destructive/20 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tags ───────────────────────────────────────────────────── */
type TagRow = { id: string; name: string; slug: string };

function TagsSection() {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [name, setName] = useState("");

  const load = () => supabase.from("tags").select("*").order("name").then(({ data }) => setTags((data ?? []) as TagRow[]));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold">Tags</h2>
      <div className="mt-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tag name"
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
        <button
          onClick={async () => { if (!name.trim()) return; await supabase.from("tags").insert({ name: name.trim(), slug: slugify(name.trim()) }); setName(""); load(); }}
          disabled={!name.trim()}
          className="flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow disabled:opacity-60">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <div key={t.id} className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs">
            {t.name}
            <button onClick={async () => { if (confirm("Delete?")) { await supabase.from("tags").delete().eq("id", t.id); load(); } }}
              className="ml-1 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Live TV ────────────────────────────────────────────────── */
type ChannelRow = { id: string; name: string; slug: string; stream_url: string; category: string; active: boolean; logo: string | null };

function LiveTVSection() {
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [form, setForm] = useState({ name: "", stream_url: "", category: "Cartoon", logo: "" });
  const [saving, setSaving] = useState(false);

  const load = () => supabase.from("channels").select("*").order("sort_order").then(({ data }) => setChannels((data ?? []) as ChannelRow[]));
  useEffect(() => { load(); }, []);

  async function addChannel() {
    if (!form.name.trim() || !form.stream_url.trim()) return;
    setSaving(true);
    await supabase.from("channels").insert({
      name: form.name.trim(),
      slug: slugify(form.name.trim()),
      stream_url: form.stream_url.trim(),
      category: form.category,
      logo: form.logo.trim() || null,
      active: true,
    });
    setForm({ name: "", stream_url: "", category: "Cartoon", logo: "" });
    setSaving(false);
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Live TV Channels</h2>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add Channel</h3>
        <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" /></Field>
        <Field label="Stream URL (M3U8)"><input value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" /></Field>
        <Field label="Logo URL (optional)"><input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" /></Field>
        <Field label="Category">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand">
            {["Cartoon", "Anime", "Kids", "Live TV"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <button onClick={addChannel} disabled={saving || !form.name.trim() || !form.stream_url.trim()}
          className="flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Channel
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {channels.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-background shrink-0">
              {c.logo ? <img src={c.logo} alt={c.name} className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> :
                <div className="grid h-full w-full place-items-center text-xs font-bold text-muted-foreground">{c.name[0]}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{c.name}</div>
              <div className="text-[11px] text-muted-foreground">{c.category}</div>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${c.active ? "bg-emerald-500/20 text-emerald-400" : "bg-surface-2 text-muted-foreground"}`}>
              {c.active ? "active" : "off"}
            </span>
            <button onClick={async () => { if (confirm("Delete channel?")) { await supabase.from("channels").delete().eq("id", c.id); load(); } }}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-destructive/20 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {channels.length === 0 && <div className="rounded-3xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">No channels yet.</div>}
      </div>
    </div>
  );
}

/* ─── Pages ──────────────────────────────────────────────────── */
type PageRow = { id: string; title: string; slug: string; published: boolean };

function PagesSection() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [form, setForm] = useState({ title: "", slug: "", html: "" });
  const [saving, setSaving] = useState(false);

  const load = () => supabase.from("pages").select("id,title,slug,published").order("created_at", { ascending: false }).then(({ data }) => setPages((data ?? []) as PageRow[]));
  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.title.trim()) return;
    setSaving(true);
    await supabase.from("pages").insert({ title: form.title.trim(), slug: form.slug || slugify(form.title.trim()), html: form.html, published: true });
    setForm({ title: "", slug: "", html: "" });
    setSaving(false);
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Pages</h2>
      <div className="mt-4 space-y-3 rounded-2xl border border-border bg-surface p-4">
        <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" /></Field>
        <Field label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" /></Field>
        <Field label="HTML Content"><textarea value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} rows={5}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand resize-none" /></Field>
        <button onClick={add} disabled={saving || !form.title.trim()}
          className="flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Page
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {pages.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{p.title}</div>
              <div className="text-[11px] text-muted-foreground">/pages/{p.slug}</div>
            </div>
            <Link to="/pages/$slug" params={{ slug: p.slug }} className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-muted-foreground hover:text-foreground">
              <Eye className="h-3.5 w-3.5" />
            </Link>
            <button onClick={async () => { if (confirm("Delete page?")) { await supabase.from("pages").delete().eq("id", p.id); load(); } }}
              className="grid h-7 w-7 place-items-center rounded-full bg-destructive/20 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Comments ───────────────────────────────────────────────── */
type CommentRow = { id: string; author_name: string; body: string; created_at: string; approved: boolean; post_id: string };

function CommentsSection() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [posts, setPosts] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("comments").select("*").eq("approved", tab === "approved").order("created_at", { ascending: false }).limit(50);
    const rows = (data ?? []) as CommentRow[];
    setComments(rows);
    const ids = [...new Set(rows.map((r) => r.post_id))];
    if (ids.length) {
      const { data: postData } = await supabase.from("posts").select("id,title").in("id", ids);
      const map: Record<string, string> = {};
      (postData ?? []).forEach((p: { id: string; title: string }) => { map[p.id] = p.title; });
      setPosts(map);
    }
  };

  useEffect(() => { load(); }, [tab]);

  return (
    <div>
      <h2 className="text-2xl font-bold">Comments</h2>
      <div className="mt-4 flex gap-2">
        {(["pending", "approved"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${tab === t ? "gradient-brand text-primary-foreground shadow-glow" : "bg-surface text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {comments.length === 0 && <div className="rounded-3xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">No {tab} comments.</div>}
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold">{c.author_name} <span className="text-xs text-muted-foreground">on "{posts[c.post_id] ?? "post"}"</span></div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
                <div className="mt-1 text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-1">
                {!c.approved && (
                  <button onClick={async () => { await supabase.from("comments").update({ approved: true }).eq("id", c.id); load(); }}
                    className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {c.approved && (
                  <button onClick={async () => { await supabase.from("comments").update({ approved: false }).eq("id", c.id); load(); }}
                    className="grid h-8 w-8 place-items-center rounded-full bg-yellow-500/20 text-yellow-400">
                    <EyeOff className="h-4 w-4" />
                  </button>
                )}
                <button onClick={async () => { if (confirm("Delete comment?")) { await supabase.from("comments").delete().eq("id", c.id); load(); } }}
                  className="grid h-8 w-8 place-items-center rounded-full bg-destructive/20 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/* ─── Shrinkme API Key Section ───────────────────────────────── */
function ShrinkmeSection() {
  const [configured, setConfigured] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/shrinkme")
      .then((r) => r.json())
      .then((d: { configured: boolean; hint: string | null }) => {
        setConfigured(d.configured);
        setHint(d.hint);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    if (!key.trim()) { setError("Enter the API key"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const r = await fetch("/api/admin/shrinkme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (d.ok) {
        setConfigured(true);
        setHint(`${key.trim().slice(0, 4)}${"•".repeat(Math.max(0, key.trim().length - 4))}`);
        setKey(""); setSuccess("API key saved successfully.");
      } else setError(d.error ?? "Failed to save");
    } catch { setError("Network error"); }
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Remove the Shrinkme API key?")) return;
    setSaving(true);
    await fetch("/api/admin/shrinkme", { method: "DELETE" });
    setConfigured(false); setHint(null); setKey(""); setSuccess("Key removed."); setSaving(false);
  }

  return (
    <div className="max-w-md">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand shadow-glow">
          <Link2 className="h-5 w-5 text-white" />
        </span>
        <div>
          <h2 className="text-xl font-bold">Shrinkme API Key</h2>
          <p className="text-xs text-muted-foreground">
            Used to shorten verify links. Works without it — links just won't be shortened.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          {configured && hint && (
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-3">
              <Check className="h-4 w-4 shrink-0 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-300">Key configured</p>
                <p className="font-mono text-xs text-muted-foreground">{hint}</p>
              </div>
            </div>
          )}

          <Field label="API Key">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
              <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={configured ? "Enter new key to replace…" : "Paste your Shrinkme API key"}
                className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground placeholder:font-sans"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <p className="text-[11px] text-muted-foreground">
            Get your key at{" "}
            <a
              href="https://shrinkme.io/member/tools/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline-offset-2 hover:underline"
            >
              shrinkme.io → API
            </a>
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs text-green-400">
              <Check className="h-4 w-4 shrink-0" /> {success}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !key.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-brand py-2.5 text-sm font-bold text-white shadow-glow disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Key
            </button>
            {configured && (
              <button
                onClick={remove}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── JioTV Admin Section ────────────────────────────────────── */
function JioTVAdminSection() {
  const [status, setStatus] = useState<"checking" | "logged-in" | "step1" | "step2">("checking");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/jiotv/status")
      .then((r) => r.json())
      .then((d: { loggedIn: boolean }) => setStatus(d.loggedIn ? "logged-in" : "step1"))
      .catch(() => setStatus("step1"));
  }, []);

  async function sendOtp() {
    if (!/^\d{10}$/.test(mobile)) { setError("Enter a valid 10-digit mobile number"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const r = await fetch("/api/jiotv/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (d.ok) { setStatus("step2"); setSuccess("OTP sent to +91 " + mobile); }
      else setError(d.error ?? "Failed to send OTP");
    } catch { setError("Network error"); }
    setLoading(false);
  }

  async function verifyOtp() {
    if (!/^\d{4,6}$/.test(otp)) { setError("Enter the OTP received"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const r = await fetch("/api/jiotv/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (d.ok) { setStatus("logged-in"); setSuccess("JioTV logged in! All users can now watch JioTV."); setOtp(""); }
      else setError(d.error ?? "OTP verification failed");
    } catch { setError("Network error"); }
    setLoading(false);
  }

  async function logout() {
    if (!confirm("This will disable JioTV for all users. Continue?")) return;
    setLoading(true);
    await fetch("/api/jiotv/logout", { method: "POST" });
    setStatus("step1"); setMobile(""); setOtp(""); setSuccess(""); setLoading(false);
  }

  return (
    <div className="max-w-md">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand shadow-glow">
          <Tv2 className="h-5 w-5 text-white" />
        </span>
        <div>
          <h2 className="text-xl font-bold">JioTV Login</h2>
          <p className="text-xs text-muted-foreground">
            Login once — all visitors can watch JioTV without signing in.
          </p>
        </div>
      </div>

      {status === "checking" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
        </div>
      )}

      {status === "logged-in" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
            <Check className="h-5 w-5 shrink-0 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-300">JioTV is Active</p>
              <p className="text-xs text-muted-foreground">
                All users can browse and watch JioTV channels.
              </p>
            </div>
          </div>
          {success && <p className="text-xs text-green-400">{success}</p>}
          <button
            onClick={logout}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs font-medium text-muted-foreground hover:text-destructive"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            Sign out of JioTV
          </button>
        </div>
      )}

      {(status === "step1" || status === "step2") && (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs text-muted-foreground">
            Enter your Jio mobile number to receive an OTP and activate JioTV for all users.
          </p>

          {/* Mobile */}
          <Field label="Jio Mobile Number">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
              <span className="text-sm text-muted-foreground">+91</span>
              <span className="h-4 w-px bg-border" />
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                disabled={status === "step2"}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
              />
            </div>
          </Field>

          {status === "step1" && (
            <button
              onClick={sendOtp}
              disabled={loading || mobile.length < 10}
              className="w-full rounded-xl gradient-brand py-2.5 text-sm font-bold text-white shadow-glow disabled:opacity-60"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Send OTP"}
            </button>
          )}

          {status === "step2" && (
            <>
              <Field label="Enter OTP">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                  <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="OTP received on +91 mobile"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </Field>

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 4}
                className="w-full rounded-xl gradient-brand py-2.5 text-sm font-bold text-white shadow-glow disabled:opacity-60"
              >
                {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Verify & Activate JioTV"}
              </button>

              <button
                onClick={() => { setStatus("step1"); setOtp(""); setError(""); setSuccess(""); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                ← Change number
              </button>
            </>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs text-green-400">
              <Check className="h-4 w-4 shrink-0" /> {success}
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
