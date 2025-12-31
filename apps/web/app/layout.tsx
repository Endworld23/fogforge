import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import "../styles/globals.css";

export const metadata = {
  title: "Fogforge Directory",
  description: "Local provider directory for grease trap cleaning.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
              <Link className="text-lg font-semibold" href="/">
                Fogforge
              </Link>
              <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link className="hover:text-foreground" href="/grease-trap-cleaning">
                  Grease Trap Cleaning
                </Link>
              </nav>
            </div>
            <Button asChild>
              <Link href="/login">List your business</Link>
            </Button>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
