import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';
import type { RestaurantStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const excludeBlacklisted = searchParams.get('excludeBlacklisted') !== 'false';

    const userRestaurants = await prisma.userRestaurant.findMany({
      where: {
        userId: user.id,
        ...(status ? { status: status as RestaurantStatus } : {}),
        ...(excludeBlacklisted ? { isBlacklisted: false } : {}),
      },
      orderBy: { savedAt: 'desc' },
      include: {
        restaurant: {
          include: {
            visits: {
              where: { userId: user.id },
              orderBy: { visitDate: 'desc' },
              take: 5,
              include: { photos: true },
            },
          },
        },
      },
    });

    const data = userRestaurants.map((ur) => ({
      ...ur.restaurant,
      status: ur.status,
      isBlacklisted: ur.isBlacklisted,
      blacklistReason: ur.blacklistReason,
      blacklistedAt: ur.blacklistedAt,
      sourceUrl: ur.sourceUrl,
      sourcePlatform: ur.sourcePlatform,
      rawCaption: ur.rawCaption,
    }));

    return NextResponse.json({ data } satisfies ApiResponse<typeof data>);
  } catch (error) {
    console.error('Get restaurants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const status = (body.status as RestaurantStatus) ?? 'WANT_TO_GO';

    const restaurant = await prisma.restaurant.create({
      data: {
        name: body.name,
        address: body.address ?? null,
        formattedAddress: body.formattedAddress ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        cuisineTypes: body.cuisineTypes ?? [],
        popularDishes: body.popularDishes ?? [],
        priceRange: body.priceRange ?? null,
        ambianceTags: body.ambianceTags ?? [],
      },
    });

    const userRestaurant = await prisma.userRestaurant.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        status,
        sourceUrl: body.sourceUrl ?? null,
        sourcePlatform: body.sourcePlatform ?? null,
        rawCaption: body.rawCaption ?? null,
      },
    });

    const withVisits = await prisma.restaurant.findUnique({
      where: { id: restaurant.id },
      include: { visits: { orderBy: { visitDate: 'desc' }, take: 5 } },
    });

    return NextResponse.json(
      {
        data: {
          ...withVisits!,
          status: userRestaurant.status,
          isBlacklisted: false,
          blacklistReason: null,
          blacklistedAt: null,
          sourceUrl: userRestaurant.sourceUrl,
          sourcePlatform: userRestaurant.sourcePlatform,
          rawCaption: userRestaurant.rawCaption,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create restaurant error:', error);
    return NextResponse.json(
      { error: 'Failed to create restaurant' },
      { status: 500 }
    );
  }
}
