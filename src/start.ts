import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const optionalSupabaseAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (error) {
    console.warn("Auth session was unavailable for this request.", error);
    return next({ headers: {} });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [optionalSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
