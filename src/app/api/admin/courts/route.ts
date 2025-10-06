import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');

    // Construir el filtro basado en clubId
    const where = clubId ? { clubId } : {};

    const courts = await prisma.court.findMany({
      where,
      orderBy: {
        number: 'asc'
      }
    });

    return NextResponse.json(courts);
  } catch (error) {
    console.error('Error fetching courts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clubId, number, name, capacity = 4, isActive = true } = body;

    if (!clubId || !number || !name) {
      return NextResponse.json(
        { error: 'Club ID, number and name are required' },
        { status: 400 }
      );
    }

    const court = await prisma.court.create({
      data: {
        clubId,
        number: parseInt(number),
        name,
        capacity: parseInt(capacity),
        isActive
      }
    });

    return NextResponse.json(court);
  } catch (error) {
    console.error('Error creating court:', error);
    return NextResponse.json(
      { error: 'Failed to create court' },
      { status: 500 }
    );
  }
}