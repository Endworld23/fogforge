import { redirect } from "next/navigation";
import { getUserContext } from "../../lib/auth/getUserContext";

export const dynamic = "force-dynamic";

export default async function PostLoginPage() {
  const { user, isAdmin, providerUser } = await getUserContext();

  if (!user) {
    redirect("/login");
  }

  if (isAdmin) {
    redirect("/admin");
  }

  if (providerUser) {
    redirect("/dashboard");
  }

  redirect("/onboarding/status");
}
