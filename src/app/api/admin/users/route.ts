import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');

    // Construir el filtro basado en clubId
    const where = clubId ? { clubId } : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role = 'PLAYER', level = 'principiante', clubId } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Si no se proporciona clubId, usar el primer club disponible
    let finalClubId = clubId;
    if (!finalClubId) {
      const firstClub = await prisma.club.findFirst();
      if (!firstClub) {
        return NextResponse.json(
          { error: 'No clubs available. Please create a club first.' },
          { status: 400 }
        );
      }
      finalClubId = firstClub.id;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        level,
        clubId: finalClubId
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Manejar errores específicos
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}