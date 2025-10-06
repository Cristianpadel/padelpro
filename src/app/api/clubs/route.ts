// src/app/api/clubs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener clubes reales de la base de datos
    const clubs = await prisma.club.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    // Mapear los datos de la BD al formato esperado por el frontend
    const formattedClubs = clubs.map(club => ({
      id: club.id,
      name: club.name,
      location: club.address,
      logoUrl: null,
      showClassesTabOnFrontend: true,
      showMatchesTabOnFrontend: true,
      isMatchDayEnabled: false,
      isMatchProEnabled: false,
      isStoreEnabled: false,
      cardShadowEffect: {
        enabled: true,
        color: '#3B82F6',
        intensity: 0.3,
      },
      // Información adicional del club
      email: club.email,
      phone: club.phone,
      website: club.website,
      description: club.description
    }));

    return NextResponse.json(formattedClubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clubs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}