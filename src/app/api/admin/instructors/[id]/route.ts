import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log('🔍 Fetching instructor by ID:', id);

    // Use raw SQL to get instructor by ID
    const instructors = await prisma.$queryRaw`
      SELECT * FROM Instructor WHERE id = ${id}
    `;

    if (instructors.length === 0) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    const instructor = instructors[0];
    console.log('✅ Found instructor:', instructor);
    
    return NextResponse.json(instructor);
  } catch (error) {
    console.error('❌ Error fetching instructor:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch instructor', details: error.message },
      { status: 500 }
    );
  }
}