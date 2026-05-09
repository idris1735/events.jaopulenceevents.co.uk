"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminHref = "/admin" | "/admin/events" | "/admin/orders" | "/admin/tickets" | "/admin/checkin" | "/admin/staff";

interface AdminNavLinkProps {
  href: AdminHref;
  label: string;
}

export function AdminNavLink({ href, label }: AdminNavLinkProps) {
  const pathname = usePathname();
  // Mark active for exact match on /admin, prefix match for all others
  const isActive = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`admin-tab${isActive ? " admin-tab--active" : ""}`}
    >
      {label}
    </Link>
  );
}
