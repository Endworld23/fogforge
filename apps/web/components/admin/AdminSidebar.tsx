"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Providers", href: "/admin/providers" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Import Providers", href: "/admin/import/providers" },
  { label: "Onboarding", href: "/admin/onboarding" },
  { label: "Activity", href: "/admin/activity" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</p>
      <nav className="mt-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
