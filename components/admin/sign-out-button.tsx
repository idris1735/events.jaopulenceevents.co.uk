"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase?.auth.signOut();
    window.location.assign("/auth/sign-in");
  }

  return (
    <button className="button-secondary" type="button" onClick={handleSignOut}>
      Sign out
    </button>
  );
}
