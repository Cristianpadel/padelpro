// src/app/api/classes/[timeSlotId]/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Patrón recomendado de Next.js para reutilizar conexión Prisma
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ timeSlotId: string }> }
) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 [' + startTime + '] Iniciando GET bookings...');
    const { timeSlotId } = await params;
    console.log('📋 [' + (Date.now() - startTime) + 'ms] timeSlotId recibido:', timeSlotId);

    if (!timeSlotId) {
      console.log('❌ timeSlotId está vacío');
      return NextResponse.json({ error: 'timeSlotId requerido' }, { status: 400 });
    }

    // Reutilizar prisma global en lugar de crear instancia nueva cada vez
    console.log('📋 [' + (Date.now() - startTime) + 'ms] Conectando a base de datos...');
    console.log('📋 [' + (Date.now() - startTime) + 'ms] Obteniendo reservas para:', timeSlotId);

    // Usar query SQL directa CON groupSize (columna agregada)
    console.log('🔍 [' + (Date.now() - startTime) + 'ms] Ejecutando query SQL...');
    const bookings = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.userId,
        b.timeSlotId,
        b.groupSize,
        b.status,
        b.createdAt,
        b.updatedAt,
        u.name as userName,
        u.level as userLevel,
        u.profilePictureUrl as userProfilePicture
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      WHERE b.timeSlotId = ${timeSlotId}
      AND b.status IN ('PENDING', 'CONFIRMED')
      ORDER BY 
        CASE b.status 
          WHEN 'CONFIRMED' THEN 1 
          WHEN 'PENDING' THEN 2 
          ELSE 3 
        END,
        b.createdAt ASC
    ` as any[];

    console.log('📋 [' + (Date.now() - startTime) + 'ms] Reservas encontradas:', bookings.length);
    console.log('📋 Reservas raw (sin serializar por BigInt):', bookings.length > 0 ? 'Datos encontrados' : 'Sin datos');

    // Convertir al formato que espera el frontend
    const formattedBookings = bookings.map(booking => {
      console.log('📋 Processing booking:', booking.id, 'for user:', booking.userId, 'status:', booking.status, 'profilePic:', booking.userProfilePicture);
      
      // Usar el nombre real del usuario si está disponible, sino generar uno
      const displayName = booking.userName || 
                         (booking.userId === 'user-1' ? 'Alex García' : 
                          booking.userId === 'user-current' ? 'Usuario Actual' :
                          `Usuario ${booking.userId.slice(-4)}`);
      
      // Usar la foto de perfil real del usuario, o generar un avatar si no tiene
      const profilePicture = booking.userProfilePicture || 
                            `https://avatar.vercel.sh/${displayName.replace(/\s+/g, '')}.png?size=60`;
      
      return {
        userId: booking.userId,
        groupSize: Number(booking.groupSize) || 1, // Asegurar que sea número
        status: booking.status,
        name: displayName,
        profilePictureUrl: profilePicture,
        userLevel: booking.userLevel,
        userGender: 'masculino', // Valor por defecto hasta que se agregue gender al modelo
        createdAt: booking.createdAt
      };
    });

    console.log('📋 Bookings formateados:', formattedBookings.length);

    // Convertir cualquier BigInt a string antes de serializar
    const serializedBookings = JSON.parse(JSON.stringify(formattedBookings, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    console.log('✅ [' + (Date.now() - startTime) + 'ms] Retornando', serializedBookings.length, 'bookings');
    return NextResponse.json(serializedBookings);

  } catch (error) {
    console.error('❌ Error obteniendo reservas:', error);
    console.error('❌ Error stack:', error);
    return NextResponse.json({ 
      error: 'Error obteniendo reservas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
  // No desconectar prisma en API routes - Next.js maneja las conexiones
}