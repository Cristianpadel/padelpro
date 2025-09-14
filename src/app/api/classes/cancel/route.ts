// src/app/api/classes/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, userId, timeSlotId } = body;

    console.log('🗑️ Solicitud de cancelación:', { bookingId, userId, timeSlotId });

    // Verificar que tenemos los datos necesarios
    if (!userId || !timeSlotId) {
      return NextResponse.json({ 
        error: 'Faltan datos requeridos: userId y timeSlotId' 
      }, { status: 400 });
    }

    // Buscar la reserva del usuario para esta clase
    const booking = await prisma.booking.findFirst({
      where: {
        userId: userId,
        timeSlotId: timeSlotId,
      }
    });

    if (!booking) {
      return NextResponse.json({ 
        error: 'No se encontró la reserva para cancelar' 
      }, { status: 404 });
    }

    console.log('📍 Reserva encontrada:', booking.id);

    // Eliminar la reserva
    await prisma.booking.delete({
      where: {
        id: booking.id
      }
    });

    console.log('✅ Reserva cancelada exitosamente');

    return NextResponse.json({ 
      success: true,
      message: 'Reserva cancelada exitosamente',
      cancelledBookingId: booking.id
    });

  } catch (error) {
    console.error('❌ Error cancelando reserva:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor al cancelar la reserva' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}