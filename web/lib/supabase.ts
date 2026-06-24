const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function getSupabaseConfig() {
  return {
    enabled: Boolean(supabaseUrl && supabaseAnonKey),
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}

