import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminProfileRecord } from "@/lib/types";

export interface AdminSession {
  userId: string;
  email: string;
  profile: AdminProfileRecord | null;
}

export interface ActiveAdminSession {
  userId: string;
  email: string;
  profile: AdminProfileRecord;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id, supabase_user_id, display_name, role")
    .eq("supabase_user_id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: (profile as AdminProfileRecord | null) ?? null
  };
}

export async function requireAdminSession(ownerOnly = false): Promise<ActiveAdminSession> {
  const session = await getAdminSession();
  if (!session?.profile) {
    redirect("/auth/sign-in");
  }

  if (ownerOnly && session.profile.role !== "owner") {
    redirect("/admin");
  }

  return {
    userId: session.userId,
    email: session.email,
    profile: session.profile
  };
}
