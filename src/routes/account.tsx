import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — Harshita Collection" }] }),
  component: () => (
    <main className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="font-display text-4xl mb-4">Account</h1>
      <p className="text-muted-foreground mb-8">Sign in and account features arrive in the next phase.</p>
      <Link to="/" className="inline-block bg-espresso text-ivory px-8 py-3 text-xs uppercase tracking-[0.25em]">Back to Shopping</Link>
    </main>
  ),
});
