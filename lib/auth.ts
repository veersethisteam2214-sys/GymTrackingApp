import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/env";

export async function requireAllowedUser() {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return { supabase: null, user: null, setupMissing: true as const };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isEmailAllowed(user.email)) {
    await supabase.auth.signOut();
    redirect("/access-denied");
  }

  return { supabase, user, setupMissing: false as const };
}
