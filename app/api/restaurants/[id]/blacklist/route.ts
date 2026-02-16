import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = (body.reason as string) ?? null;

    const link = await prisma.userRestaurant.findUnique({
      where: { userId_restaurantId: { userId: user.id, restaurantId: id } },
    });
    if (!link) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const userRestaurant = await prisma.userRestaurant.update({
      where: { userId_restaurantId: { userId: user.id, restaurantId: id } },
      data: {
        isBlacklisted: true,
        blacklistReason: reason,
        blacklistedAt: new Date(),
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
    console.error('Blacklist restaurant error:', error);
    return NextResponse.json(
      { error: 'Failed to blacklist restaurant' },
      { status: 500 }
    );
  }
}
