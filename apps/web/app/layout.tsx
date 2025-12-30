import type { ReactNode } from "react";
import "../styles/globals.css";

export const metadata = {
  title: "Fogforge Directory",
  description: "Local provider directory for grease trap cleaning.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
