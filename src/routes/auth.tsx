import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { checkAdmin } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { waitForReadySession } from "@/lib/auth-session";

const authSearchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({
    meta: [
      { title: "Sign In — Harshita Collection" },
      { name: "description", content: "Sign in or create an account to shop, save favourites, and track orders at Harshita Collection." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Tell us your name").max(80);

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const fetchAdmin = useServerFn(checkAdmin);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const finishSignIn = async () => {
    const ready = await waitForReadySession();
    if (!ready) {
      toast.error("Sign-in did not complete. Please try again.");
      return;
    }
    if (redirect && redirect !== "/account") {
      navigate({ to: redirect, replace: true });
      return;
    }
    try {
      const admin = await fetchAdmin();
      navigate({ to: admin.isAdmin ? "/admin" : "/account", replace: true });
    } catch {
      navigate({ to: "/account", replace: true });
    }
  };

  useEffect(() => {
    waitForReadySession(2, 100).then((ready) => {
      if (ready) void finishSignIn();
    });
  }, [redirect]);

  const onGoogle = async () => {
    setLoading(true);
    const postLoginPath = redirect ?? "/account";
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth?redirect=${encodeURIComponent(postLoginPath)}`,
    });
    if (result.error) {
      toast.error("Could not sign in with Google");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    await finishSignIn();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        emailSchema.parse(email);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your email for a reset link");
        setMode("signin");
      } else if (mode === "signup") {
        nameSchema.parse(name);
        emailSchema.parse(email);
        passwordSchema.parse(password);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created. Please verify your email to sign in.");
        setMode("signin");
      } else {
        emailSchema.parse(email);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        await finishSignIn();
      }
    } catch (err) {
      let msg = err instanceof z.ZodError ? err.issues[0]?.message : err instanceof Error ? err.message : "Something went wrong";
      if (typeof msg === "string" && /invalid login credentials/i.test(msg)) {
        msg = "Invalid email or password. If you signed up with Google, use the “Continue with Google” button above.";
      }
      toast.error(msg ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-12rem)] grid place-items-center px-4 py-16 bg-beige/20">
      <div className="w-full max-w-md bg-ivory border border-border p-8 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl">
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Welcome back"}
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">
            Harshita Collection
          </p>
        </div>

        {mode !== "forgot" && (
          <>
            <button
              onClick={onGoogle}
              disabled={loading}
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-border bg-ivory hover:bg-beige/40 transition py-3 text-sm disabled:opacity-50"
            >
              <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Full Name</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)} required maxLength={80}
                className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Email</label>
            <input
              type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255}
              className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-gold"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Password</label>
              <input
                type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72}
                className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </div>
          )}
          <button
            type="submit" disabled={loading}
            className="w-full bg-espresso text-ivory py-3 text-xs uppercase tracking-[0.25em] hover:bg-espresso/90 disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground space-y-2">
          {mode === "signin" && (
            <>
              <button onClick={() => setMode("forgot")} className="hover:text-gold">Forgot password?</button>
              <p>New here? <button onClick={() => setMode("signup")} className="text-espresso hover:text-gold">Create an account</button></p>
            </>
          )}
          {mode === "signup" && (
            <p>Already have an account? <button onClick={() => setMode("signin")} className="text-espresso hover:text-gold">Sign in</button></p>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("signin")} className="text-espresso hover:text-gold">Back to sign in</button>
          )}
        </div>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/" className="hover:text-gold">← Continue browsing</Link>
        </p>
      </div>
    </main>
  );
}
