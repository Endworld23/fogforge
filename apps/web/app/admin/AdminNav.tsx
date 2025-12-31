"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, UploadCloud, LayoutDashboard } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/import/providers", label: "Import Providers", icon: UploadCloud },
  { href: "/admin/leads", label: "Leads Inbox", icon: Inbox },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Button
            key={item.href}
            asChild
            size="sm"
            variant={isActive ? "default" : "outline"}
            className={cn(isActive ? "" : "text-muted-foreground")}
          >
            <Link href={item.href} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
