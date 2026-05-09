import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await requireAdminSession(true);
  void session;

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const [profilesResult, usersResult] = await Promise.all([
    supabase.from("admin_profiles").select("id, supabase_user_id, display_name, role, created_at").order("created_at"),
    supabase.auth.admin.listUsers({ perPage: 200 })
  ]);

  const profiles = profilesResult.data ?? [];
  const users = usersResult.data?.users ?? [];

  type AuthUser = { id: string; email?: string; last_sign_in_at?: string };
  const emailMap = new Map((users as AuthUser[]).map((u) => [u.id, { email: u.email ?? "", lastSignIn: u.last_sign_in_at ?? null }]));

  const staff = profiles.map((p: { id: string; supabase_user_id: string; display_name: string; role: string; created_at: string }) => ({
    id: p.id,
    supabaseUserId: p.supabase_user_id,
    displayName: p.display_name,
    role: p.role,
    createdAt: p.created_at,
    email: emailMap.get(p.supabase_user_id)?.email ?? "",
    lastSignIn: emailMap.get(p.supabase_user_id)?.lastSignIn ?? null
  }));

  return NextResponse.json({ staff });
}

export async function POST(request: Request) {
  await requireAdminSession(true);

  const body = await request.json().catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();
  const displayName = (body?.displayName ?? "").trim();

  if (!email || !displayName) {
    return NextResponse.json({ error: "Email and display name are required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  const userId = inviteData.user.id;

  const { error: profileError } = await supabase.from("admin_profiles").insert({
    supabase_user_id: userId,
    display_name: displayName,
    role: "staff"
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId).catch(() => {});
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email, displayName });
}

export async function DELETE(request: Request) {
  await requireAdminSession(true);

  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json({ error: "profileId is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("supabase_user_id, role")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  if (profile.role === "owner") {
    return NextResponse.json({ error: "Cannot remove an owner account." }, { status: 403 });
  }

  const { error } = await supabase.from("admin_profiles").delete().eq("id", profileId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
