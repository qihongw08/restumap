import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { RestaurantStatus } from '@prisma/client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const userRestaurant = await prisma.userRestaurant.findUnique({
      where: { userId_restaurantId: { userId: user.id, restaurantId: id } },
      include: {
        restaurant: {
          include: {
            visits: {
              where: { userId: user.id },
              orderBy: { visitDate: 'desc' },
              include: { photos: true },
            },
            photos: { where: { userId: user.id } },
          },
        },
      },
    });

    if (userRestaurant) {
      const { restaurant } = userRestaurant;
      const data = {
        ...restaurant,
        status: userRestaurant.status,
        isBlacklisted: userRestaurant.isBlacklisted,
        blacklistReason: userRestaurant.blacklistReason,
        blacklistedAt: userRestaurant.blacklistedAt,
        sourceUrl: userRestaurant.sourceUrl,
        sourcePlatform: userRestaurant.sourcePlatform,
        rawCaption: userRestaurant.rawCaption,
        savedAt: userRestaurant.savedAt,
      };
      return NextResponse.json({ data });
    }

    const inGroup = await prisma.groupRestaurant.findFirst({
      where: {
        restaurantId: id,
        group: { members: { some: { userId: user.id } } },
      },
    });
    if (!inGroup) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const adderLink = await prisma.userRestaurant.findUnique({
      where: {
        userId_restaurantId: {
          userId: inGroup.addedById,
          restaurantId: id,
        },
      },
      select: { sourceUrl: true, sourcePlatform: true, rawCaption: true },
    });

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        visits: {
          where: { userId: user.id },
          orderBy: { visitDate: 'desc' },
          include: { photos: true },
        },
        photos: { where: { userId: user.id } },
      },
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const data = {
      ...restaurant,
      status: 'WANT_TO_GO' as RestaurantStatus,
      isBlacklisted: false,
      blacklistReason: null,
      blacklistedAt: null,
      sourceUrl: adderLink?.sourceUrl ?? null,
      sourcePlatform: adderLink?.sourcePlatform ?? null,
      rawCaption: adderLink?.rawCaption ?? null,
      savedAt: null,
    };
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Get restaurant error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();

    const link = await prisma.userRestaurant.findUnique({
      where: { userId_restaurantId: { userId: user.id, restaurantId: id } },
    });
    if (!link) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const [restaurant, userRestaurant] = await prisma.$transaction([
      prisma.restaurant.update({
        where: { id },
        data: {
          ...(body.name != null && { name: body.name }),
          ...(body.address !== undefined && { address: body.address }),
          ...(body.formattedAddress !== undefined && {
            formattedAddress: body.formattedAddress,
          }),
          ...(body.latitude !== undefined && { latitude: body.latitude }),
          ...(body.longitude !== undefined && { longitude: body.longitude }),
          ...(body.cuisineTypes !== undefined && { cuisineTypes: body.cuisineTypes }),
          ...(body.popularDishes !== undefined && {
            popularDishes: body.popularDishes,
          }),
          ...(body.priceRange !== undefined && { priceRange: body.priceRange }),
          ...(body.ambianceTags !== undefined && { ambianceTags: body.ambianceTags }),
        },
      }),
      prisma.userRestaurant.update({
        where: { userId_restaurantId: { userId: user.id, restaurantId: id } },
        data: {
          ...(body.status != null && { status: body.status as RestaurantStatus }),
          ...(body.sourceUrl !== undefined && { sourceUrl: body.sourceUrl }),
          ...(body.sourcePlatform !== undefined && { sourcePlatform: body.sourcePlatform }),
          ...(body.rawCaption !== undefined && { rawCaption: body.rawCaption }),
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        ...restaurant,
        status: userRestaurant.status,
        isBlacklisted: userRestaurant.isBlacklisted,
        blacklistReason: userRestaurant.blacklistReason,
        blacklistedAt: userRestaurant.blacklistedAt,
        sourceUrl: userRestaurant.sourceUrl,
        sourcePlatform: userRestaurant.sourcePlatform,
        rawCaption: userRestaurant.rawCaption,
      },
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const link = await prisma.userRestaurant.findUnique({
      where: { userId_restaurantId: { userId: user.id, restaurantId: id } },
    });
    if (!link) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    await prisma.userRestaurant.delete({
      where: { userId_restaurantId: { userId: user.id, restaurantId: id } },
    });
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    return NextResponse.json(
      { error: 'Failed to delete restaurant' },
      { status: 500 }
    );
  }
}
