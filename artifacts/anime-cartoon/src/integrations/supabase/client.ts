import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || "";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("[Supabase] Missing env vars VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
}

export const supabase = createClient<Database>(
  SUPABASE_URL || "https://placeholder.invalid",
  SUPABASE_PUBLISHABLE_KEY || "placeholder",
  {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
