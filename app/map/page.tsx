import { redirect } from "next/navigation";
import { Nav } from "@/components/shared/nav";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MapView } from "@/components/map/map-view";
import type { RestaurantStatus } from "@prisma/client";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priceRange?: string;
    restaurant?: string;
    groupId?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const groupId =
    typeof params.groupId === "string" && params.groupId.trim()
      ? params.groupId.trim()
      : null;

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: { select: { id: true, name: true } } },
  });
  const groupOptions = memberships
    .map((m) => m.group)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
      include: { group: { select: { id: true, name: true } } },
    });
    if (!membership) redirect("/groups");
  }

  const userRestaurants = await prisma.userRestaurant.findMany({
    where: {
      userId: user.id,
      isBlacklisted: false,
      ...(params.status ? { status: params.status as RestaurantStatus } : {}),
      ...(groupId
        ? {
            restaurant: {
              groupRestaurants: {
                some: { groupId },
              },
            },
          }
        : {}),
    },
    include: {
      restaurant: {
        include: {
          visits: {
            where: { userId: user.id },
            orderBy: { visitDate: "desc" },
            take: 1,
            include: { photos: true },
          },
          photos: { where: { userId: user.id } },
        },
      },
    },
  });

  let list = userRestaurants.map((ur) => ({
    ...ur.restaurant,
    status: ur.status,
    isBlacklisted: ur.isBlacklisted,
  }));
  if (params.priceRange) {
    list = list.filter((r) => r.priceRange === params.priceRange);
  }
  const restaurants = list;

  return (
    <div className="fixed inset-0 min-h-screen bg-background overflow-hidden">
      <main className="relative h-full w-full">
        <MapView
          restaurants={restaurants}
          highlightRestaurantId={params.restaurant ?? null}
          selectedGroupId={groupId}
          groupOptions={groupOptions}
        />
      </main>
      <Nav />
    </div>
  );
}
