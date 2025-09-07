import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const timeSlotId = searchParams.get('timeSlotId');

    let query = `
      SELECT 
        b.*,
        u.name as userName,
        u.email as userEmail,
        ts.start as classStart,
        ts.end as classEnd,
        i.name as instructorName
      FROM Booking b
      JOIN User u ON b.userId = u.id
      JOIN TimeSlot ts ON b.timeSlotId = ts.id
      LEFT JOIN Instructor i ON ts.instructorId = i.id
    `;

    const conditions = [];
    const params = [];

    if (userId) {
      conditions.push('b.userId = ?');
      params.push(userId);
    }

    if (timeSlotId) {
      conditions.push('b.timeSlotId = ?');
      params.push(timeSlotId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ts.start ASC';

    const bookings = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, timeSlotId, groupSize = 1 } = body;

    if (!userId || !timeSlotId) {
      return NextResponse.json(
        { error: 'userId and timeSlotId are required' },
        { status: 400 }
      );
    }

    // Verificar que el time slot existe y tiene espacio
    const timeSlot = await prisma.$queryRaw`
      SELECT 
        ts.*,
        COUNT(b.id) as bookedPlayers
      FROM TimeSlot ts
      LEFT JOIN Booking b ON ts.id = b.timeSlotId
      WHERE ts.id = ${timeSlotId}
      GROUP BY ts.id
    ` as any[];

    if (timeSlot.length === 0) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }

    const slot = timeSlot[0];
    if (slot.bookedPlayers + groupSize > slot.maxPlayers) {
      return NextResponse.json(
        { error: 'Not enough space in this class' },
        { status: 400 }
      );
    }

    // Crear la reserva
    const bookingId = `booking-${Date.now()}-${userId}`;
    await prisma.$executeRaw`
      INSERT INTO Booking (id, userId, timeSlotId, groupSize, createdAt)
      VALUES (${bookingId}, ${userId}, ${timeSlotId}, ${groupSize}, datetime('now'))
    `;

    return NextResponse.json({ 
      success: true, 
      bookingId,
      message: 'Booking created successfully' 
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
