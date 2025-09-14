// src/app/api/classes/book/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { timeSlotId, userId } = body;

    if (!timeSlotId || !userId) {
      return NextResponse.json(
        { message: 'timeSlotId y userId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el slot existe y tiene lugares disponibles
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        instructor: true,
        bookings: true
      }
    });

    if (!timeSlot) {
      return NextResponse.json(
        { message: 'El slot de tiempo no existe' },
        { status: 404 }
      );
    }

    // Verificar disponibilidad
    const currentBookings = timeSlot.bookings.length;
    if (currentBookings >= timeSlot.maxPlayers) {
      return NextResponse.json(
        { message: 'No hay lugares disponibles para esta clase' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya está inscrito
    const alreadyBooked = timeSlot.bookings.some(
      (booking: any) => booking.userId === userId
    );

    if (alreadyBooked) {
      return NextResponse.json(
        { message: 'Ya estás inscrito en esta clase' },
        { status: 400 }
      );
    }

    // Crear la reserva
    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        timeSlotId: timeSlotId,
        groupSize: 1
      }
    });

    // Obtener información actualizada del slot
    const updatedSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        instructor: true,
        bookings: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Reserva exitosa',
      booking: booking,
      availableSpots: updatedSlot ? updatedSlot.maxPlayers - updatedSlot.bookings.length : 0
    });

  } catch (error) {
    console.error('Error al procesar la inscripción:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
