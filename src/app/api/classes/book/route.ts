// API corregida para la estructura real de la BD
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('🔍 POST /api/classes/book - Starting...');
    
    const body = await request.json();
    console.log('📝 Body received:', body);
    
    const { userId, timeSlotId, groupSize = 1 } = body;

    if (!userId || !timeSlotId) {
      return NextResponse.json({ error: 'Missing userId or timeSlotId' }, { status: 400 });
    }

    // Usar SQL directo para evitar problemas de schema
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Verificar que el timeSlot existe usando SQL directo
      const timeSlotExists = await prisma.$queryRaw`
        SELECT id FROM TimeSlot WHERE id = ${timeSlotId}
      `;

      if (!timeSlotExists || (timeSlotExists as any[]).length === 0) {
        return NextResponse.json({ error: 'TimeSlot not found' }, { status: 404 });
      }

      // Verificar que el usuario existe
      const userExists = await prisma.$queryRaw`
        SELECT id FROM User WHERE id = ${userId}
      `;

      if (!userExists || (userExists as any[]).length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Verificar si ya existe una reserva
      const existingBooking = await prisma.$queryRaw`
        SELECT id FROM Booking 
        WHERE userId = ${userId} 
        AND timeSlotId = ${timeSlotId} 
        AND groupSize = ${groupSize}
        AND status IN ('PENDING', 'CONFIRMED')
      `;

      if (existingBooking && (existingBooking as any[]).length > 0) {
        return NextResponse.json({ error: 'Ya tienes una reserva para esta modalidad' }, { status: 400 });
      }

      // Crear la reserva usando SQL directo
      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.$executeRaw`
        INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
        VALUES (${bookingId}, ${userId}, ${timeSlotId}, ${groupSize}, 'PENDING', datetime('now'), datetime('now'))
      `;

      console.log('✅ Booking created successfully:', bookingId);

      return NextResponse.json({
        success: true,
        bookingId,
        message: 'Reserva creada exitosamente'
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}