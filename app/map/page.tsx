import { redirect } from "next/navigation";
import { Nav } from "@/components/shared/nav";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MapView } from "@/components/map/map-view";
import type { RestaurantStatus } from "@prisma/client";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priceRange?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const userRestaurants = await prisma.userRestaurant.findMany({
    where: {
      userId: user.id,
      isBlacklisted: false,
      ...(params.status ? { status: params.status as RestaurantStatus } : {}),
    },
    include: {
      restaurant: {
        include: {
          visits: {
            where: { userId: user.id },
            orderBy: { visitDate: "desc" },
            take: 1,
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
        <MapView restaurants={restaurants} />
      </main>
      <Nav />
    </div>
  );
}
