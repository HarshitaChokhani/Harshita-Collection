import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Harshita Collection" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      z.string().min(8, "Use at least 8 characters").max(72).parse(password);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You are now signed in.");
      navigate({ to: "/account", replace: true });
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0]?.message : err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-12rem)] grid place-items-center px-4 py-16 bg-beige/20">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-ivory border border-border p-8 sm:p-10 space-y-5">
        <div className="text-center">
          <h1 className="font-display text-3xl">Set a new password</h1>
          <p className="text-xs text-muted-foreground mt-2">Choose a strong password you'll remember.</p>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">New password</label>
          <input
            type="password" autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72}
            className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-gold"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-espresso text-ivory py-3 text-xs uppercase tracking-[0.25em] disabled:opacity-50">
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
