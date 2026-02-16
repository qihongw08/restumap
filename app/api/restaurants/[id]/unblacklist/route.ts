import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
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

    const userRestaurant = await prisma.userRestaurant.update({
      where: { userId_restaurantId: { userId: user.id, restaurantId: id } },
      data: {
        isBlacklisted: false,
        blacklistReason: null,
        blacklistedAt: null,
      },
    });

    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    return NextResponse.json({
      data: {
        ...restaurant!,
        status: userRestaurant.status,
        isBlacklisted: userRestaurant.isBlacklisted,
        blacklistReason: userRestaurant.blacklistReason,
        blacklistedAt: userRestaurant.blacklistedAt,
      },
    });
  } catch (error) {
    console.error('Unblacklist restaurant error:', error);
    return NextResponse.json(
      { error: 'Failed to restore restaurant' },
      { status: 500 }
    );
  }
}
