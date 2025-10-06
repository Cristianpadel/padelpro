import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/bookings - Starting...');
    
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    
    console.log('📝 ClubId filter:', clubId);

    // Usar SQL directo para evitar problemas con el schema de Prisma
    let bookings;
    
    if (clubId) {
      bookings = await prisma.$queryRaw`
        SELECT 
          b.id,
          b.userId,
          b.timeSlotId,
          b.groupSize,
          b.status,
          b.createdAt,
          b.updatedAt,
          u.name as userName,
          u.email as userEmail,
          u.profilePictureUrl as userProfilePicture,
          ts.start as timeSlotStart,
          ts.end as timeSlotEnd,
          ts.level as timeSlotLevel,
          ts.category as timeSlotCategory,
          ts.totalPrice as timeSlotTotalPrice,
          ts.maxPlayers as timeSlotMaxPlayers,
          iu.name as instructorName,
          iu.profilePictureUrl as instructorProfilePicture,
          c.number as courtNumber,
          (SELECT COUNT(*) FROM Booking b2 
           WHERE b2.timeSlotId = ts.id 
           AND b2.status = 'CONFIRMED') as totalPlayers
        FROM Booking b
        LEFT JOIN User u ON b.userId = u.id
        LEFT JOIN TimeSlot ts ON b.timeSlotId = ts.id
        LEFT JOIN Instructor i ON ts.instructorId = i.id
        LEFT JOIN User iu ON i.userId = iu.id
        LEFT JOIN Court c ON ts.courtId = c.id
        WHERE ts.clubId = ${clubId}
        AND b.status = 'CONFIRMED'
        ORDER BY ts.start DESC
      `;
    } else {
      bookings = await prisma.$queryRaw`
        SELECT 
          b.id,
          b.userId,
          b.timeSlotId,
          b.groupSize,
          b.status,
          b.createdAt,
          b.updatedAt,
          u.name as userName,
          u.email as userEmail,
          u.profilePictureUrl as userProfilePicture,
          ts.start as timeSlotStart,
          ts.end as timeSlotEnd,  
          ts.level as timeSlotLevel,
          ts.category as timeSlotCategory,
          ts.totalPrice as timeSlotTotalPrice,
          ts.maxPlayers as timeSlotMaxPlayers,
          iu.name as instructorName,
          iu.profilePictureUrl as instructorProfilePicture,
          c.number as courtNumber,
          (SELECT COUNT(*) FROM Booking b2 
           WHERE b2.timeSlotId = ts.id 
           AND b2.status = 'CONFIRMED') as totalPlayers
        FROM Booking b
        LEFT JOIN User u ON b.userId = u.id
        LEFT JOIN TimeSlot ts ON b.timeSlotId = ts.id
        LEFT JOIN Instructor i ON ts.instructorId = i.id
        LEFT JOIN User iu ON i.userId = iu.id
        LEFT JOIN Court c ON ts.courtId = c.id
        WHERE b.status = 'CONFIRMED'
        ORDER BY ts.start DESC
      `;
    }

    console.log(`📊 Found ${bookings.length} bookings`);

    // Formatear los datos para que sean compatibles con AdminBookingCard
    // Convertir BigInt a números regulares para evitar errores de serialización
    const formattedBookings = (bookings as any[]).map(booking => ({
      id: booking.id, // Keep as string (booking IDs are strings like "booking-1758638749118-2tqqwhc2j")
      userId: booking.userId, // Keep as string (user IDs are strings like "cmfwmut4v0001tgs0en3il18d")
      timeSlotId: booking.timeSlotId, // Keep as string (timeSlot IDs are strings)
      groupSize: Number(booking.groupSize),
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      user: {
        name: booking.userName,
        email: booking.userEmail,
        profilePictureUrl: booking.userProfilePicture
      },
      timeSlot: {
        id: booking.timeSlotId, // Keep as string
        start: booking.timeSlotStart,
        end: booking.timeSlotEnd,
        level: booking.timeSlotLevel,
        category: booking.timeSlotCategory,
        totalPrice: Number(booking.timeSlotTotalPrice),
        maxPlayers: Number(booking.timeSlotMaxPlayers),
        totalPlayers: Number(booking.totalPlayers),
        instructor: {
          name: booking.instructorName,
          profilePictureUrl: booking.instructorProfilePicture
        },
        court: {
          number: Number(booking.courtNumber)
        }
      }
    }));

    console.log('✅ Returning formatted bookings:', formattedBookings.length);
    
    // Serializar manualmente para evitar BigInt errors
    const jsonString = JSON.stringify(formattedBookings, (key, value) => {
      if (typeof value === 'bigint') {
        console.log(`Converting BigInt for key "${key}":`, value, '→', Number(value));
        return Number(value);
      }
      return value;
    });
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}