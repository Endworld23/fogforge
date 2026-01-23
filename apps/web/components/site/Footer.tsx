import Link from "next/link";
import { Separator } from "../ui/separator";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Fogforge</p>
            <p className="text-sm text-muted-foreground">
              Local directory for grease trap cleaning pros.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" href="/grease-trap-cleaning">
              Category
            </Link>
            <Link className="hover:text-foreground" href="/get-started?mode=list">
              List or claim your business
            </Link>
            <Link className="hover:text-foreground" href="/login">
              Admin / Login
            </Link>
            <Link className="hover:text-foreground" href="#">
              Privacy
            </Link>
            <Link className="hover:text-foreground" href="#">
              Terms
            </Link>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-xs text-muted-foreground">
          © 2025 Fogforge. All listings are provided by local businesses.
        </p>
      </div>
    </footer>
  );
}
