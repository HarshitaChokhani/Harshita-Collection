import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type ReadySession = { session: Session; user: User };

const OAUTH_TOKEN_KEYS = [
  "access_token",
  "refresh_token",
  "expires_at",
  "expires_in",
  "provider_token",
  "provider_refresh_token",
  "token_type",
  "type",
];

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function absorbOAuthTokensFromUrl() {
  if (typeof window === "undefined") return;

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const search = window.location.search.startsWith("?") ? window.location.search.slice(1) : "";
  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(search);
  const source = hashParams.get("access_token") ? hashParams : searchParams;
  const access_token = source.get("access_token");
  const refresh_token = source.get("refresh_token");

  if (!access_token || !refresh_token) return;

  await supabase.auth.setSession({ access_token, refresh_token });

  const cleanUrl = new URL(window.location.href);
  cleanUrl.hash = "";
  OAUTH_TOKEN_KEYS.forEach((key) => cleanUrl.searchParams.delete(key));
  window.history.replaceState(null, "", `${cleanUrl.pathname}${cleanUrl.search}`);
}

export async function waitForReadySession(attempts = 24, intervalMs = 200): Promise<ReadySession | null> {
  if (typeof window === "undefined") return null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await absorbOAuthTokensFromUrl();

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (session) {
      const { data: userData, error } = await supabase.auth.getUser();
      if (!error && userData.user) return { session, user: userData.user };
    }

    if (attempt < attempts - 1) await delay(intervalMs);
  }

  return null;
}