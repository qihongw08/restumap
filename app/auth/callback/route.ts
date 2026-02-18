import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserFromAuth } from "@/lib/sync-user";
import { prisma } from "@/lib/prisma";

/**
 * OAuth callback (e.g. Google). Exchanges code for session, syncs User row, redirects.
 * If user has no username, redirects to /profile/set-username first.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (!next.startsWith("/") || next.includes("//")) {
    next = "/";
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl =
    forwardedHost != null ? `${forwardedProto}://${forwardedHost}` : origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        await syncUserFromAuth({
          id: authUser.id,
          email: authUser.email ?? null,
          user_metadata: authUser.user_metadata ?? null,
        });
        const dbUser = await prisma.user.findUnique({
          where: { id: authUser.id },
          select: { username: true },
        });
        if (!dbUser?.username) {
          const setUsernameUrl = `/profile/set-username?next=${encodeURIComponent(next)}`;
          return NextResponse.redirect(`${baseUrl}${setUsernameUrl}`);
        }
      }
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
}
