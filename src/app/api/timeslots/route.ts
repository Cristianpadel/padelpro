import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const date = searchParams.get('date');
    const instructorId = searchParams.get('instructorId');

    console.log('🔍 API Request params:', { clubId, date, instructorId });

    // Usar SQL directo que funcione con nuestro nuevo schema
    let query = `
      SELECT 
        ts.id,
        ts.clubId,
        ts.courtId,
        ts.instructorId,
        ts.date,
        ts.startTime,
        ts.endTime,
        ts.maxParticipants,
        ts.price,
        ts.level,
        ts.classType,
        ts.description,
        ts.createdAt,
        ts.updatedAt,
        u.name as instructorName,
        u.profilePictureUrl as instructorProfilePicture,
        c.name as courtName,
        COUNT(CASE WHEN b.status IN ('PENDING', 'CONFIRMED') THEN b.id END) as bookedPlayers
      FROM TimeSlot ts
      LEFT JOIN Instructor i ON ts.instructorId = i.id
      LEFT JOIN User u ON i.userId = u.id
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
      conditions.push('ts.date = ?');
      params.push(date);
    }
    
    if (instructorId) {
      conditions.push('ts.instructorId = ?');
      params.push(instructorId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY ts.id ORDER BY ts.startTime ASC';

    console.log('📝 Final query:', query);
    console.log('📋 Query params:', params);

    // Ejecutar query con Prisma
    const rawTimeSlots = await prisma.$queryRawUnsafe(query, ...params) as any[];

    console.log(`📊 Found ${rawTimeSlots.length} raw time slots`);

    // Convertir al formato esperado por la API
    const formattedSlots = rawTimeSlots.map(slot => ({
      id: slot.id,
      clubId: slot.clubId || '',
      courtId: slot.courtId,
      instructorId: slot.instructorId,
      start: `${slot.date}T${slot.startTime}:00Z`,
      end: `${slot.date}T${slot.endTime}:00Z`,
      maxPlayers: Number(slot.maxParticipants || 4),
      totalPrice: Number(slot.price || 0),
      level: slot.level || 'abierto',
      category: slot.classType || 'general',
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
      instructorName: slot.instructorName || 'Instructor',
      instructorProfilePicture: slot.instructorProfilePicture,
      courtNumber: slot.courtName ? parseInt(slot.courtName.replace(/\D/g, '')) || 1 : 1,
      bookedPlayers: Number(slot.bookedPlayers || 0),
      description: slot.description || ''
    }));

    console.log('✅ Returning formatted slots:', formattedSlots.length);
    if (formattedSlots.length > 0) {
      console.log('📝 First slot example:', JSON.stringify(formattedSlots[0], null, 2));
    }

    return NextResponse.json(formattedSlots);
  } catch (error) {
    console.error('❌ Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slots', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
