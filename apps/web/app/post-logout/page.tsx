"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "../../lib/supabase/browser";

export default function PostLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const supabase = createBrowserClient();
      await supabase.auth.signOut({ scope: "local" });
      router.replace("/");
      router.refresh();
    };
    run();
  }, [router]);

  return null;
}
