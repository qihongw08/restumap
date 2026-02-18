import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: { avatar_url?: string; picture?: string } | null;
};

/**
 * Create or update our User row from Supabase auth user.
 * Preserves existing username; sets email and avatarUrl from provider.
 */
export async function syncUserFromAuth(authUser: AuthUser) {
  const email = authUser.email ?? null;
  const avatarUrl =
    authUser.user_metadata?.avatar_url ??
    authUser.user_metadata?.picture ??
    null;

  await prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email,
      avatarUrl,
      username: null,
    },
    update: {
      email: email ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
    },
  });
}

/**
 * Returns the DB user if they have a username set.
 */
export async function getDbUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, avatarUrl: true },
  });
}
