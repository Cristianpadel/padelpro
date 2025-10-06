import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 TIMESLOTS API - FIXED DATE FILTERING - v3.0');
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const date = searchParams.get('date');
    const instructorId = searchParams.get('instructorId');

    console.log('🔍 API Request params:', { clubId, date, instructorId });

    // Build SQL query with proper date filtering
    let query = `SELECT * FROM TimeSlot WHERE 1=1`;
    const params: any[] = [];
    
    if (clubId) {
      query += ` AND clubId = ?`;
      params.push(clubId);
    }
    
    if (date) {
      // Use LIKE for date filtering to avoid timezone issues
      query += ` AND start LIKE ?`;
      params.push(`${date}%`);
    }
    
    if (instructorId) {
      query += ` AND instructorId = ?`;
      params.push(instructorId);
    }
    
    query += ` ORDER BY start ASC`;

    console.log('📝 SQL Query:', query);
    console.log('📝 Params:', params);

    // Execute raw SQL query
    const timeSlots = await prisma.$queryRawUnsafe(query, ...params) as any[];

    console.log(`📊 Found ${timeSlots.length} time slots with SQL query`);

    // Format slots - since we're using raw SQL, need to ensure proper types
    const formattedSlots = await Promise.all(timeSlots.map(async (slot: any) => {
      // Calcular el total de jugadores reservados contando reservas
      const bookingSum = await prisma.$queryRaw`
        SELECT COUNT(*) as totalPlayers
        FROM Booking 
        WHERE timeSlotId = ${slot.id} 
        AND status IN ('PENDING', 'CONFIRMED')
      ` as any[];
      
      const bookedPlayers = Number(bookingSum[0]?.totalPlayers || 0);
      
      // Get instructor info if exists
      let instructorName = 'Instructor Genérico';
      let instructorProfilePicture = null;
      
      if (slot.instructorId) {
        try {
          const instructor = await prisma.instructor.findUnique({
            where: { id: slot.instructorId },
            include: { user: true }
          });
          if (instructor && instructor.user) {
            instructorName = instructor.user.name;
            instructorProfilePicture = instructor.user.profilePictureUrl;
          }
        } catch (error) {
          console.warn('Error fetching instructor:', error);
        }
      }
      
      // Convert string dates from SQLite to proper Date objects
      const startDate = typeof slot.start === 'string' ? new Date(slot.start) : slot.start;
      const endDate = typeof slot.end === 'string' ? new Date(slot.end) : slot.end;
      
      return {
        id: slot.id,
        clubId: slot.clubId || '',
        courtId: slot.courtId,
        instructorId: slot.instructorId,
        start: startDate,
        end: endDate,
        maxPlayers: Number(slot.maxPlayers || 4),
        totalPrice: Number(slot.totalPrice || 0),
        level: slot.level || 'abierto',
        category: slot.category || 'general',
        createdAt: typeof slot.createdAt === 'string' ? new Date(slot.createdAt) : slot.createdAt,
        updatedAt: typeof slot.updatedAt === 'string' ? new Date(slot.updatedAt) : slot.updatedAt,
        instructorName: instructorName,
        instructorProfilePicture: instructorProfilePicture,
        courtNumber: 1,
        bookedPlayers: bookedPlayers,
        description: ''
      };
    }));

    const rawTimeSlots = formattedSlots;

    console.log('✅ Returning formatted slots:', rawTimeSlots.length);
    if (rawTimeSlots.length > 0) {
      console.log('📝 First slot example:', JSON.stringify(rawTimeSlots[0], null, 2));
    }

    return NextResponse.json(rawTimeSlots);
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
