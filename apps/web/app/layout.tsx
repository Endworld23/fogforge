import type { ReactNode } from "react";
import Footer from "../components/site/Footer";
import Header from "../components/site/Header";
import "../styles/globals.css";

export const metadata = {
  title: "Fogforge Directory",
  description: "Local provider directory for grease trap cleaning.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
