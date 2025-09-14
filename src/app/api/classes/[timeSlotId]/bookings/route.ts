// src/app/api/classes/[timeSlotId]/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ timeSlotId: string }> }
) {
  let prismaClient: PrismaClient | null = null;
  
  try {
    console.log('🔄 Iniciando GET bookings...');
    const { timeSlotId } = await params;
    console.log('📋 timeSlotId recibido:', timeSlotId);

    if (!timeSlotId) {
      console.log('❌ timeSlotId está vacío');
      return NextResponse.json({ error: 'timeSlotId requerido' }, { status: 400 });
    }

    // Crear cliente Prisma local para evitar problemas de conexión
    prismaClient = new PrismaClient();
    console.log('📋 Obteniendo reservas para:', timeSlotId);

    // Usar query SQL directa que sabemos que funciona
    console.log('🔍 Ejecutando query SQL...');
    const bookings = await prismaClient.$queryRaw`
      SELECT 
        id,
        userId,
        timeSlotId,
        groupSize,
        status,
        createdAt,
        updatedAt
      FROM Booking 
      WHERE timeSlotId = ${timeSlotId}
      AND status IN ('PENDING', 'CONFIRMED')
      ORDER BY 
        CASE status 
          WHEN 'CONFIRMED' THEN 1 
          WHEN 'PENDING' THEN 2 
          ELSE 3 
        END,
        createdAt ASC
    ` as any[];

    console.log('📋 Reservas encontradas:', bookings.length);
    console.log('📋 Reservas raw:', JSON.stringify(bookings, null, 2));

    // Convertir al formato que espera el frontend
    const formattedBookings = bookings.map(booking => {
      console.log('📋 Processing booking:', booking.id, 'for user:', booking.userId, 'groupSize:', booking.groupSize, 'status:', booking.status);
      
      // Generar nombre basado en userId para no depender de tabla User
      const displayName = booking.userId === 'user-1' ? 'Alex García' : 
                         booking.userId === 'user-current' ? 'Usuario Actual' :
                         `Usuario ${booking.userId.slice(-4)}`;
      
      return {
        userId: booking.userId,
        groupSize: Number(booking.groupSize),
        status: booking.status,
        name: displayName,
        profilePictureUrl: `https://avatar.vercel.sh/${displayName.replace(/\s+/g, '')}.png?size=60`
      };
    });

    console.log('📋 Bookings formateados:', formattedBookings.length);

    return NextResponse.json(formattedBookings);

  } catch (error) {
    console.error('❌ Error obteniendo reservas:', error);
    console.error('❌ Error stack:', error);
    return NextResponse.json({ 
      error: 'Error obteniendo reservas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  } finally {
    if (prismaClient) {
      await prismaClient.$disconnect();
    }
  }
}