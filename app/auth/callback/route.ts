import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback (e.g. Google). Exchanges code for session and redirects.
 * Security: only redirect to relative paths to avoid open redirects.
 * Add this URL to Supabase Dashboard → Auth → URL Configuration → Redirect URLs.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (!next.startsWith("/") || next.includes("//")) {
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProto =
        request.headers.get("x-forwarded-proto") ?? "https";
      const baseUrl =
        forwardedHost != null ? `${forwardedProto}://${forwardedHost}` : origin;
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl =
    forwardedHost != null ? `${forwardedProto}://${forwardedHost}` : origin;
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
}
