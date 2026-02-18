import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true, avatarUrl: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    data: {
      username: dbUser.username,
      avatarUrl: dbUser.avatarUrl,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const username =
    typeof body.username === "string"
      ? body.username.trim().slice(0, 50)
      : null;
  if (!username || username.length < 2) {
    return NextResponse.json(
      { error: "Username must be at least 2 characters" },
      { status: 400 },
    );
  }
  const existing = await prisma.user.findFirst({
    where: { username, id: { not: user.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Username is already taken" },
      { status: 400 },
    );
  }
  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      username,
      email: user.email ?? null,
    },
    update: { username },
  });
  return NextResponse.json({ data: { username } });
}
