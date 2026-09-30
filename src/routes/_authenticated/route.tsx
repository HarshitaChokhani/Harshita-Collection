import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { waitForReadySession } from "@/lib/auth-session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    let ready: Awaited<ReturnType<typeof waitForReadySession>> = null;
    try {
      ready = await waitForReadySession();
    } catch {
      // Transient network hiccup — retry once before deciding.
      try { ready = await waitForReadySession(10, 300); } catch { ready = null; }
    }
    if (!ready) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: ready.user };
  },
  component: () => <Outlet />,
});
