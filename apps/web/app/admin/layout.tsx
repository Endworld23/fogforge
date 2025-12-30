import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <h1>Admin</h1>
      {children}
    </section>
  );
}
