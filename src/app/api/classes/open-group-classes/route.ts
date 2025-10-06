// src/app/api/classes/open-group-classes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, format } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId') || 'club-1';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const targetDate = new Date(date);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Obtener clases abiertas usando SQL directo para evitar problemas del cliente
    const openClasses = await prisma.$queryRaw`
      SELECT 
        ts.id,
        ts.start,
        ts.end,
        ts.level,
        ts.category,
        ts.maxPlayers,
        ts.totalPrice,
        u.name as instructorName,
        u.profilePictureUrl as instructorPicture,
        COUNT(b.id) as currentBookings
      FROM TimeSlot ts
      JOIN Instructor i ON ts.instructorId = i.id
      JOIN User u ON i.userId = u.id
      LEFT JOIN Booking b ON ts.id = b.timeSlotId AND b.status IN ('PENDING', 'CONFIRMED')
      WHERE ts.clubId = ${clubId}
        AND ts.start >= ${dayStart.toISOString()}
        AND ts.start <= ${dayEnd.toISOString()}
        AND ts.courtId IS NULL
        AND ts.level = 'ABIERTO'
        AND ts.category = 'ABIERTO'
      GROUP BY ts.id, ts.start, ts.end, ts.level, ts.category, ts.maxPlayers, ts.totalPrice, u.name, u.profilePictureUrl
      ORDER BY ts.start ASC
    `;

    const formattedClasses = openClasses.map(slot => {
      const startDate = new Date(slot.start);
      const endDate = new Date(slot.end);
      const currentBookings = Number(slot.currentBookings) || 0;
      
      return {
        id: slot.id,
        instructor: {
          name: slot.instructorName,
          profilePicture: slot.instructorPicture
        },
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        date: format(startDate, 'yyyy-MM-dd'),
        level: slot.level,
        category: slot.category,
        maxPlayers: slot.maxPlayers,
        currentPlayers: currentBookings,
        availableSpots: slot.maxPlayers - currentBookings,
        pricePerPlayer: slot.totalPrice,
        isAvailable: currentBookings < slot.maxPlayers,
        players: [] // Por ahora vacío, se puede obtener en otra consulta si se necesita
      };
    });

    return NextResponse.json({
      date: date,
      clubId: clubId,
      totalOpenClasses: formattedClasses.length,
      classes: formattedClasses
    });

  } catch (error) {
    console.error('Error obteniendo clases abiertas:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// Endpoint para obtener estadísticas de clases abiertas
export async function POST(request: NextRequest) {
  try {
    const { clubId, startDate, endDate } = await request.json();
    
    if (!clubId || !startDate || !endDate) {
      return NextResponse.json({ 
        error: 'clubId, startDate y endDate son requeridos' 
      }, { status: 400 });
    }

    // Estadísticas de clases abiertas
    const stats = await prisma.timeSlot.groupBy({
      by: ['instructorId'],
      where: {
        clubId: clubId,
        start: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        courtId: null, // Solo clases abiertas
        level: 'ABIERTO',
        category: 'ABIERTO'
      },
      _count: {
        id: true
      },
      _avg: {
        totalPrice: true
      }
    });

    // Obtener información de instructores
    const instructorStats = await Promise.all(
      stats.map(async (stat) => {
        const instructor = await prisma.instructor.findUnique({
          where: { id: stat.instructorId },
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        });

        // Contar reservas totales para este instructor
        const totalBookings = await prisma.booking.count({
          where: {
            timeSlot: {
              instructorId: stat.instructorId,
              start: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            },
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          }
        });

        return {
          instructorId: stat.instructorId,
          instructorName: instructor?.user.name || 'Desconocido',
          openClassesCreated: stat._count.id,
          averagePrice: stat._avg.totalPrice,
          totalBookings: totalBookings
        };
      })
    );

    return NextResponse.json({
      period: { startDate, endDate },
      clubId: clubId,
      summary: {
        totalInstructors: instructorStats.length,
        totalOpenClasses: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        totalBookings: instructorStats.reduce((sum, stat) => sum + stat.totalBookings, 0)
      },
      instructorStats: instructorStats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}