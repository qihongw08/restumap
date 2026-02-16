import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  calculatePFRatio,
  isValidFullnessOrTaste,
  isValidPrice,
} from '@/lib/utils';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();

    const {
      restaurantId,
      visitDate,
      fullnessScore,
      tasteScore,
      pricePaid,
      serviceRating,
      ambianceRating,
      notes,
    } = body;

    if (
      !restaurantId ||
      !visitDate ||
      !isValidFullnessOrTaste(fullnessScore) ||
      !isValidFullnessOrTaste(tasteScore) ||
      !isValidPrice(Number(pricePaid))
    ) {
      return NextResponse.json(
        {
          error:
            'Missing or invalid: restaurantId, visitDate, fullnessScore (1-10), tasteScore (1-10), pricePaid (>0)',
        },
        { status: 400 }
      );
    }

    const pfRatio = calculatePFRatio(
      Number(fullnessScore),
      Number(tasteScore),
      Number(pricePaid)
    );

    const link = await prisma.userRestaurant.findUnique({
      where: { userId_restaurantId: { userId: user.id, restaurantId } },
    });
    if (!link) {
      return NextResponse.json(
        { error: 'Restaurant not in your list' },
        { status: 404 }
      );
    }

    const [visit] = await prisma.$transaction([
      prisma.visit.create({
        data: {
          userId: user.id,
          restaurantId,
          visitDate: new Date(visitDate),
          fullnessScore: Number(fullnessScore),
          tasteScore: Number(tasteScore),
          pricePaid: Number(pricePaid),
          pfRatio,
          serviceRating: serviceRating != null ? Number(serviceRating) : null,
          ambianceRating: ambianceRating != null ? Number(ambianceRating) : null,
          notes: notes ?? null,
        },
      }),
      prisma.userRestaurant.update({
        where: { userId_restaurantId: { userId: user.id, restaurantId } },
        data: { status: 'VISITED' },
      }),
    ]);

    return NextResponse.json({ data: visit }, { status: 201 });
  } catch (error) {
    console.error('Create visit error:', error);
    return NextResponse.json(
      { error: 'Failed to create visit' },
      { status: 500 }
    );
  }
}
