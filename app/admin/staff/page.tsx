import type { Metadata } from "next";

import { InviteStaffForm } from "@/components/admin/invite-staff-form";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Staff · Admin" };

async function getStaff() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const [profilesResult, usersResult] = await Promise.all([
    supabase.from("admin_profiles").select("id, supabase_user_id, display_name, role, created_at").order("created_at"),
    supabase.auth.admin.listUsers({ perPage: 200 })
  ]);

  const profiles = profilesResult.data ?? [];
  const users = (usersResult.data?.users ?? []) as Array<{ id: string; email?: string; last_sign_in_at?: string }>;
  const emailMap = new Map(users.map((u) => [u.id, { email: u.email ?? "", lastSignIn: u.last_sign_in_at ?? null }]));

  return profiles.map((p: { id: string; supabase_user_id: string; display_name: string; role: string; created_at: string }) => ({
    id: p.id,
    supabaseUserId: p.supabase_user_id,
    displayName: p.display_name,
    role: p.role,
    createdAt: p.created_at,
    email: emailMap.get(p.supabase_user_id)?.email ?? "",
    lastSignIn: emailMap.get(p.supabase_user_id)?.lastSignIn ?? null
  }));
}

export default async function StaffPage() {
  const session = await requireAdminSession(true);
  void session;
  const staff = await getStaff();

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <p className="kicker" style={{ marginBottom: "0.3rem" }}>Team</p>
        <h1 className="section-title" style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
          Staff management
        </h1>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--faint)" }}>
          Invite team members and manage admin access. Owner-only.
        </p>
      </div>

      <InviteStaffForm initialStaff={staff} />
    </div>
  );
}
