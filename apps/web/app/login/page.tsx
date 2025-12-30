"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "../../lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserEmail(user?.email ?? null);
    };

    fetchUser();
  }, []);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    router.replace("/admin");
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    if (!data.session) {
      setStatusMessage("Check your email to confirm your account.");
      return;
    }

    router.replace("/admin");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Fogforge Admin</h1>
          <p className="text-sm text-slate-400">Sign in or create an account.</p>
        </header>

        <form className="space-y-4" onSubmit={handleSignIn}>
          {currentUserEmail ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Signed in as: {currentUserEmail}
              <div className="mt-2">
                <a
                  className="text-emerald-100 underline underline-offset-4"
                  href="/admin/import/providers"
                >
                  Go to provider import
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Not signed in.</p>
          )}

          <label className="block text-sm">
            <span className="text-slate-300">Email</span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-100"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-300">Password</span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-100"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {statusMessage ? (
            <p className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
              {statusMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            <button
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isLoading}
            >
              Sign in
            </button>
            <button
              className="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={isLoading}
              onClick={handleSignUp}
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
