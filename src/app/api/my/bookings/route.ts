import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    console.log('📋 GET /api/my/bookings - Starting...');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('🆔 userId solicitado:', userId);

    if (!userId) {
      return NextResponse.json(
        { message: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Usar SQL directo para obtener las reservas del usuario
    const bookings = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.userId,
        b.timeSlotId,
        b.groupSize,
        b.status,
        b.createdAt,
        b.updatedAt,
        ts.id as timeSlot_id,
        ts.clubId as timeSlot_clubId,
        ts.courtId as timeSlot_courtId,
        ts.instructorId as timeSlot_instructorId,
        ts.date as timeSlot_date,
        ts.startTime as timeSlot_startTime,
        ts.endTime as timeSlot_endTime,
        ts.maxParticipants as timeSlot_maxParticipants,
        ts.price as timeSlot_price,
        ts.level as timeSlot_level,
        ts.classType as timeSlot_classType,
        ts.description as timeSlot_description,
        u.name as instructor_name,
        u.profilePictureUrl as instructor_profilePictureUrl,
        c.name as court_name
      FROM Booking b
      LEFT JOIN TimeSlot ts ON b.timeSlotId = ts.id
      LEFT JOIN Instructor i ON ts.instructorId = i.id
      LEFT JOIN User u ON i.userId = u.id
      LEFT JOIN Court c ON ts.courtId = c.id
      WHERE b.userId = ${userId}
      ORDER BY b.createdAt DESC
    ` as any[];

    console.log('📊 Reservas encontradas:', bookings.length);

    // Formatear las reservas al formato que espera el frontend
    const formattedBookings = bookings.map(booking => {
      console.log('📋 Processing booking:', booking.id, 'for timeSlot:', booking.timeSlot_id);
      
      // Crear fechas completas combinando date + time
      const dateStr = booking.timeSlot_date instanceof Date 
        ? booking.timeSlot_date.toISOString().split('T')[0]
        : booking.timeSlot_date;
      const startDateTime = `${dateStr}T${booking.timeSlot_startTime}:00`;
      const endDateTime = `${dateStr}T${booking.timeSlot_endTime}:00`;
      
      return {
        id: booking.id,
        userId: booking.userId,
        timeSlotId: booking.timeSlotId,
        groupSize: Number(booking.groupSize),
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        timeSlot: {
          id: booking.timeSlot_id,
          clubId: booking.timeSlot_clubId,
          courtId: booking.timeSlot_courtId,
          instructorId: booking.timeSlot_instructorId,
          date: booking.timeSlot_date,
          startTime: booking.timeSlot_startTime,
          endTime: booking.timeSlot_endTime,
          // ✅ Agregar start y end que espera el frontend
          start: startDateTime,
          end: endDateTime,
          maxParticipants: Number(booking.timeSlot_maxParticipants),
          maxPlayers: Number(booking.timeSlot_maxParticipants), // Alias para compatibilidad
          price: Number(booking.timeSlot_price),
          totalPrice: Number(booking.timeSlot_price), // Alias para compatibilidad
          level: booking.timeSlot_level,
          classType: booking.timeSlot_classType,
          description: booking.timeSlot_description,
          instructor: booking.instructor_name ? {
            name: booking.instructor_name,
            profilePictureUrl: booking.instructor_profilePictureUrl
          } : { name: 'Instructor no asignado' },
          court: booking.court_name ? {
            name: booking.court_name,
            number: booking.court_name.replace(/[^0-9]/g, '') || '1'
          } : { name: 'Cancha no asignada', number: '1' }
        }
      };
    });

    console.log('✅ Returning formatted bookings:', formattedBookings.length);

    return NextResponse.json(formattedBookings);

  } catch (error) {
    console.error('❌ Error al obtener reservas:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
