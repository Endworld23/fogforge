"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ClipboardCheck, FileCheck, Inbox, LayoutDashboard, UploadCloud, Users } from "lucide-react";

const navGroups = [
  {
    label: "Manage",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Providers", href: "/admin/providers", icon: Users },
      { label: "Leads", href: "/admin/leads", icon: Inbox },
      { label: "Onboarding", href: "/admin/onboarding", icon: ClipboardCheck },
      { label: "Claims", href: "/admin/claims", icon: FileCheck },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Import Providers", href: "/admin/import/providers", icon: UploadCloud },
      { label: "Activity", href: "/admin/activity", icon: Activity },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</p>
      <nav className="mt-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
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
                  <Icon
                    className={`mr-2 h-4 w-4 ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
