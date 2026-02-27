import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/shared/nav";
import { RestaurantList } from "@/components/restaurants/restaurant-list";
import { DashboardHeader } from "@/components/home/dashboard-header";
import { getCurrentUser } from "@/lib/auth";
import { getDbUser } from "@/lib/sync-user";
import { ImportButtons } from "@/components/home/import-buttons";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const dbUser = await getDbUser(user.id);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="h-32 w-full" />
      <main className="mx-auto max-w-lg px-6">
        <div className="mb-10 space-y-6">
          <DashboardHeader user={dbUser} isLoggedIn />

          <ImportButtons />
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black italic tracking-tight text-foreground">
              Saved Restaurants
            </h2>
            <Link
              href="/restaurants"
              className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
            >
              View all
            </Link>
          </div>
          <RestaurantList />
        </section>
      </main>
      <Nav />
    </div>
  );
}
