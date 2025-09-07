import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const date = searchParams.get('date');
    const instructorId = searchParams.get('instructorId');

    let query = `
      SELECT 
        ts.*,
        i.name as instructorName,
        i.profilePictureUrl as instructorProfilePicture,
        c.number as courtNumber,
        COUNT(b.id) as bookedPlayers
      FROM TimeSlot ts
      LEFT JOIN Instructor i ON ts.instructorId = i.id
      LEFT JOIN Court c ON ts.courtId = c.id
      LEFT JOIN Booking b ON ts.id = b.timeSlotId
    `;

    const conditions = [];
    const params = [];

    if (clubId) {
      conditions.push('ts.clubId = ?');
      params.push(clubId);
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      conditions.push('ts.start >= ? AND ts.start <= ?');
      params.push(startOfDay.toISOString(), endOfDay.toISOString());
    }

    if (instructorId) {
      conditions.push('ts.instructorId = ?');
      params.push(instructorId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY ts.id ORDER BY ts.start ASC';

    // Usar queryRaw con parámetros
    const timeSlots = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
