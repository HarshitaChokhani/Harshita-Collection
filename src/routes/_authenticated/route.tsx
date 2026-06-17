import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { waitForReadySession } from "@/lib/auth-session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const ready = await waitForReadySession();
    if (!ready) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: ready.user };
  },
  component: () => <Outlet />,
});
