import { createBrowserClient } from "@supabase/ssr";

// Sanitize fetch: strip any non-Latin-1 character from header values.
// The sb_publishable_ Supabase key format can cause browsers to throw
// "String contains non ISO-8859-1 code point" when older SDK internals
// decode the key and place binary bytes into request headers.
function safeFetch(url: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  if (init.headers) {
    const src =
      init.headers instanceof Headers
        ? Object.fromEntries((init.headers as Headers).entries())
        : (init.headers as Record<string, string>);
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(src)) {
      clean[k] = String(v).replace(/[^\x00-\xFF]/g, "");
    }
    init = { ...init, headers: clean };
  }
  return fetch(url as string, init);
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: safeFetch as unknown as typeof fetch } }
  );
}
