export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

export function hasSupabaseEnv() {
  const env = getSupabaseEnv();
  return Boolean(env.url && env.serviceRoleKey);
}
