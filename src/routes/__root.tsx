import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";

function NotFoundComponent() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <h1 className="font-display text-6xl">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">This page wandered off.</p>
        <a href="/" className="inline-block mt-6 bg-espresso text-ivory px-6 py-3 text-xs uppercase tracking-[0.2em]">Return Home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-3xl mb-3">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6">Please try again in a moment.</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="bg-espresso text-ivory px-6 py-3 text-xs uppercase tracking-[0.2em]">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Harshita Collection — Elegance in Every Thread" },
      { name: "description", content: "Premium Indian boutique — suits, kurtis, sarees, dupattas, and more. Complimentary shipping across India." },
      { property: "og:title", content: "Harshita Collection — Elegance in Every Thread" },
      { property: "og:description", content: "Premium Indian boutique with hand-curated suits, kurtis, sarees and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      return () => subscription.unsubscribe();
    });
  }, [router, queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <Outlet />
      <Footer />
      <WhatsAppFab />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
