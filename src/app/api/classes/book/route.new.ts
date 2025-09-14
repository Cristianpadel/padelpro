// src/app/api/classes/book/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para verificar y confirmar modalidad completa
async function checkAndConfirmModalidad(timeSlotId: string, groupSize: number, prisma: PrismaClient) {
  try {
    // Contar cuántos usuarios están inscritos en esta modalidad
    const inscriptions = await prisma.booking.count({
      where: {
        timeSlotId: timeSlotId,
        groupSize: groupSize,
        status: 'PENDING'
      }
    });
    
    console.log(`📊 Modalidad ${groupSize}p tiene ${inscriptions} inscripciones`);
    
    // Si se completó la modalidad, confirmar estas reservas y cancelar las otras
    if (inscriptions >= groupSize) {
      console.log(`🎉 ¡Modalidad ${groupSize}p completada! Confirmando reservas...`);
      
      // Confirmar las reservas de esta modalidad
      await prisma.booking.updateMany({
        where: {
          timeSlotId: timeSlotId,
          groupSize: groupSize,
          status: 'PENDING'
        },
        data: {
          status: 'CONFIRMED'
        }
      });
      
      // Obtener los usuarios confirmados
      const confirmedUsers = await prisma.booking.findMany({
        where: {
          timeSlotId: timeSlotId,
          groupSize: groupSize,
          status: 'CONFIRMED'
        },
        select: {
          userId: true
        }
      });
      
      // Cancelar las otras inscripciones de estos usuarios en la misma clase
      for (const user of confirmedUsers) {
        await prisma.booking.updateMany({
          where: {
            timeSlotId: timeSlotId,
            userId: user.userId,
            groupSize: { not: groupSize },
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED'
          }
        });
      }
      
      console.log(`✅ Confirmadas ${groupSize} reservas y canceladas las otras modalidades`);
    }
    
  } catch (error) {
    console.error('❌ Error en checkAndConfirmModalidad:', error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId, timeSlotId, groupSize = 1 } = await request.json();

    console.log('📝 Booking request:', { userId, timeSlotId, groupSize });

    if (!userId || !timeSlotId) {
      return NextResponse.json(
        { error: 'userId y timeSlotId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el slot existe
    const timeSlot = await prisma.timeSlot.findUnique({
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

    if (!timeSlot) {
      return NextResponse.json(
        { error: 'Slot de tiempo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya tiene una reserva para esta modalidad específica
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: userId,
        timeSlotId: timeSlotId,
        groupSize: groupSize,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: `Ya tienes una reserva ${existingBooking.status === 'PENDING' ? 'pendiente' : 'confirmada'} para esta modalidad (${groupSize}p)` },
        { status: 400 }
      );
    }

    // Crear la nueva reserva
    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        timeSlotId: timeSlotId,
        groupSize: groupSize,
        status: 'PENDING'
      }
    });

    console.log('✅ Booking created successfully:', booking.id);

    // Verificar si esta modalidad se completó y confirmar automáticamente
    await checkAndConfirmModalidad(timeSlotId, groupSize, prisma);

    // Obtener información actualizada del slot
    const updatedSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        instructor: true,
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Reserva creada exitosamente',
      booking: booking,
      updatedSlot: updatedSlot
    });

  } catch (error) {
    console.error('❌ Error creating booking:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}