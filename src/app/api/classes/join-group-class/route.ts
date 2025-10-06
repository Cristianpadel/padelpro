// src/app/api/classes/join-group-class/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { timeSlotId, userId } = await request.json();
    
    if (!timeSlotId || !userId) {
      return NextResponse.json({ error: 'timeSlotId y userId son requeridos' }, { status: 400 });
    }

    // Obtener el slot de clase
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          }
        },
        instructor: {
          include: {
            user: true
          }
        }
      }
    });

    if (!timeSlot) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }

    // Verificar si el usuario ya está inscrito
    const existingBooking = timeSlot.bookings.find(booking => booking.userId === userId);
    if (existingBooking) {
      return NextResponse.json({ error: 'Ya estás inscrito en esta clase' }, { status: 400 });
    }

    // Verificar si hay cupo disponible
    const currentBookings = timeSlot.bookings.length;
    if (currentBookings >= timeSlot.maxPlayers) {
      return NextResponse.json({ error: 'La clase está completa' }, { status: 400 });
    }

    // Crear la reserva
    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        timeSlotId: timeSlotId,
        status: 'CONFIRMED', // Confirmamos inmediatamente
        price: timeSlot.totalPrice,
        createdAt: new Date()
      }
    });

    // Verificar si la clase se completó después de esta reserva
    const updatedSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          }
        }
      }
    });

    let courtAssigned = null;

    // Si la clase se completó, asignar una cancha automáticamente
    if (updatedSlot.bookings.length >= timeSlot.maxPlayers) {
      // Buscar una cancha disponible en ese horario
      const availableCourt = await findAvailableCourt(
        timeSlot.clubId, 
        timeSlot.start, 
        timeSlot.end
      );

      if (availableCourt) {
        // Asignar la cancha al slot
        await prisma.timeSlot.update({
          where: { id: timeSlotId },
          data: {
            courtId: availableCourt.id
          }
        });

        courtAssigned = availableCourt;
      }
    }

    const response = {
      message: 'Te has unido a la clase exitosamente',
      booking: {
        id: booking.id,
        timeSlotId: timeSlotId,
        status: booking.status,
        price: booking.price
      },
      classInfo: {
        instructor: timeSlot.instructor.user.name,
        start: timeSlot.start,
        end: timeSlot.end,
        currentPlayers: updatedSlot.bookings.length,
        maxPlayers: timeSlot.maxPlayers,
        isComplete: updatedSlot.bookings.length >= timeSlot.maxPlayers,
        courtAssigned: courtAssigned
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al unirse a la clase:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// Función auxiliar para encontrar canchas disponibles
async function findAvailableCourt(clubId: string, startTime: Date, endTime: Date) {
  const courts = await prisma.court.findMany({
    where: {
      clubId: clubId,
      isActive: true
    }
  });

  for (const court of courts) {
    // Verificar si la cancha está ocupada en ese horario
    const conflictingSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: court.id,
        AND: [
          {
            start: {
              lt: endTime
            }
          },
          {
            end: {
              gt: startTime
            }
          }
        ]
      }
    });

    // Si no hay conflictos, la cancha está disponible
    if (conflictingSlots.length === 0) {
      return court;
    }
  }

  return null; // No hay canchas disponibles
}

// Endpoint para obtener el estado actual de una clase grupal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeSlotId = searchParams.get('timeSlotId');
    
    if (!timeSlotId) {
      return NextResponse.json({ error: 'timeSlotId es requerido' }, { status: 400 });
    }

    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          include: {
            user: {
              select: {
                name: true,
                profilePictureUrl: true
              }
            }
          }
        },
        instructor: {
          include: {
            user: {
              select: {
                name: true,
                profilePictureUrl: true
              }
            }
          }
        },
        court: true
      }
    });

    if (!timeSlot) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      id: timeSlot.id,
      instructor: {
        name: timeSlot.instructor.user.name,
        profilePicture: timeSlot.instructor.user.profilePictureUrl
      },
      start: timeSlot.start,
      end: timeSlot.end,
      level: timeSlot.level,
      category: timeSlot.category,
      maxPlayers: timeSlot.maxPlayers,
      currentPlayers: timeSlot.bookings.length,
      price: timeSlot.totalPrice,
      isComplete: timeSlot.bookings.length >= timeSlot.maxPlayers,
      court: timeSlot.court,
      players: timeSlot.bookings.map(booking => ({
        id: booking.userId,
        name: booking.user.name,
        profilePicture: booking.user.profilePictureUrl
      }))
    });

  } catch (error) {
    console.error('Error obteniendo estado de la clase:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}