import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { RestaurantDetail } from "@/components/restaurants/restaurant-detail";

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
          },
          photos: { where: { userId: user.id } },
        },
      },
    },
  });

  if (!userRestaurant) notFound();

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
