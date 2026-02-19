import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { RestaurantDetail } from "@/components/restaurants/restaurant-detail";
import type { RestaurantStatus } from "@prisma/client";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const userRestaurant = await prisma.userRestaurant.findUnique({
    where: { userId_restaurantId: { userId: user.id, restaurantId: id } },
    include: {
      restaurant: {
        include: {
          visits: {
            where: { userId: user.id },
            orderBy: { visitDate: "desc" },
            include: { photos: true },
          },
          photos: { where: { userId: user.id } },
        },
      },
    },
  });

  if (userRestaurant) {
    const restaurant = {
      ...userRestaurant.restaurant,
      status: userRestaurant.status,
      isBlacklisted: userRestaurant.isBlacklisted,
      blacklistReason: userRestaurant.blacklistReason,
      blacklistedAt: userRestaurant.blacklistedAt,
      sourceUrl: userRestaurant.sourceUrl,
      sourcePlatform: userRestaurant.sourcePlatform,
      rawCaption: userRestaurant.rawCaption,
      savedAt: userRestaurant.savedAt,
    };
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-lg">
          <RestaurantDetail restaurant={restaurant} />
        </main>
      </div>
    );
  }

  const inGroup = await prisma.groupRestaurant.findFirst({
    where: {
      restaurantId: id,
      group: { members: { some: { userId: user.id } } },
    },
  });
  if (!inGroup) notFound();

  const adderLink = await prisma.userRestaurant.findUnique({
    where: {
      userId_restaurantId: {
        userId: inGroup.addedById,
        restaurantId: id,
      },
    },
    select: { sourceUrl: true, sourcePlatform: true, rawCaption: true },
  });

  const restaurantRow = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      visits: {
        where: { userId: user.id },
        orderBy: { visitDate: "desc" },
        include: { photos: true },
      },
      photos: { where: { userId: user.id } },
    },
  });
  if (!restaurantRow) notFound();

  const restaurant = {
    ...restaurantRow,
    status: "WANT_TO_GO" as RestaurantStatus,
    isBlacklisted: false,
    sourceUrl: adderLink?.sourceUrl ?? null,
    sourcePlatform: adderLink?.sourcePlatform ?? null,
    rawCaption: adderLink?.rawCaption ?? null,
    savedAt: undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg">
        <RestaurantDetail restaurant={restaurant} />
      </main>
    </div>
  );
}
