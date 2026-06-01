import { NextResponse } from "next/server";

import { safeSameOriginRedirectPath } from "@/lib/safe-redirect";
import { resolveAppOrigin } from "@/lib/site-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function callbackHeaderReader(request: Request, requestUrl: URL) {
  return {
    get(name: string) {
      const value = request.headers.get(name);
      if (value) return value;
      if (name.toLowerCase() === "host") return requestUrl.host;
      if (name.toLowerCase() === "x-forwarded-proto") return requestUrl.protocol.replace(":", "");
      return null;
    }
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appOrigin = resolveAppOrigin(callbackHeaderReader(request, requestUrl));
  const code = requestUrl.searchParams.get("code");
  const next = safeSameOriginRedirectPath(requestUrl.searchParams.get("next"), appOrigin);

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, appOrigin));
}
