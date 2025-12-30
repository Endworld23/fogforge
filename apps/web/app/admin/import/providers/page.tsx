import { isAdminServer } from "../../../../lib/auth/isAdminServer";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default async function AdminProviderImportPage() {
  const isAdmin = await isAdminServer();

  if (!isAdmin) {
    return (
      <main>
        <h2>Import Providers</h2>
        <p>Access denied.</p>
      </main>
    );
  }

  return (
    <main>
      <h2>Import Providers</h2>
      <ImportClient />
    </main>
  );
}
