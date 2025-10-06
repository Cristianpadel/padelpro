import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');

    // Construir el filtro basado en clubId
    const where = clubId ? { clubId } : {};

    // Por ahora, vamos a usar los TimeSlots que podrían representar matches
    // En el futuro se puede crear una tabla separada para matches
    const matches = await prisma.timeSlot.findMany({
      where: {
        ...where,
        category: 'match' // Filtrar solo los que son partidas
      },
      include: {
        court: true,
        instructor: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        start: 'desc'
      }
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clubId, courtId, date, time, level, maxPlayers = 4, price = 0 } = body;

    if (!clubId || !date || !time || !level) {
      return NextResponse.json(
        { error: 'Club ID, date, time and level are required' },
        { status: 400 }
      );
    }

    // Crear un TimeSlot con categoría "match"
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + 90 * 60000); // 90 minutos después

    const match = await prisma.timeSlot.create({
      data: {
        clubId,
        courtId: courtId || null,
        start: startDateTime,
        end: endDateTime,
        maxPlayers: parseInt(maxPlayers),
        totalPrice: parseFloat(price),
        level,
        category: 'match'
      }
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}