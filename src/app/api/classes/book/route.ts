// API corregida para la estructura real de la BD
import { NextResponse } from 'next/server';

// 🎯 FUNCIÓN PARA AUTO-GENERAR NUEVA TARJETA ABIERTA
async function autoGenerateOpenSlot(originalTimeSlotId: string, prisma: any) {
  try {
    console.log('🔄 Auto-generando nueva tarjeta abierta para slot:', originalTimeSlotId);
    
    // Obtener información del slot original
    const originalSlot = await prisma.$queryRaw`
      SELECT * FROM TimeSlot WHERE id = ${originalTimeSlotId}
    `;

    if (!originalSlot || (originalSlot as any[]).length === 0) {
      console.log('❌ Slot original no encontrado');
      return;
    }

    const slot = (originalSlot as any[])[0];
    
    // Verificar si es la primera inscripción (esto determina si necesitamos crear nueva tarjeta)
    const bookingCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM Booking 
      WHERE timeSlotId = ${originalTimeSlotId} 
      AND status IN ('PENDING', 'CONFIRMED')
    `;

    const count = (bookingCount as any[])[0].count;
    console.log(`📊 Número de reservas para este slot: ${count}`);

    // Solo crear nueva tarjeta si es la primera inscripción
    if (count === 1) {
      console.log('🎯 Primera inscripción detectada, creando nueva tarjeta abierta...');
      
      // Crear nueva tarjeta con los mismos parámetros pero categoría y nivel "abierto"
      const newSlotId = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.$executeRaw`
        INSERT INTO TimeSlot (
          id, clubId, courtId, instructorId, start, end, 
          maxPlayers, totalPrice, level, category, createdAt, updatedAt
        )
        VALUES (
          ${newSlotId}, 
          ${slot.clubId}, 
          ${slot.courtId}, 
          ${slot.instructorId}, 
          ${slot.start}, 
          ${slot.end}, 
          ${slot.maxPlayers || 4}, 
          ${slot.totalPrice}, 
          'abierto', 
          'mixto', 
          datetime('now'), 
          datetime('now')
        )
      `;

      console.log('✅ Nueva tarjeta abierta creada:', newSlotId);
      console.log(`📅 Horario: ${slot.start} - ${slot.end}`);
      console.log(`👨‍🏫 Instructor: ${slot.instructorId}`);
      console.log(`🏟️ Cancha: ${slot.courtId}`);
    } else {
      console.log('ℹ️ No es la primera inscripción, no se crea nueva tarjeta');
    }

  } catch (error) {
    console.error('❌ Error auto-generando tarjeta:', error);
    // No fallar la reserva original por este error
    return;
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔍 POST /api/classes/book - Starting...');
    
    const body = await request.json();
    console.log('📝 Body received:', body);
    
    const { userId, timeSlotId, groupSize = 1 } = body;
    console.log('🔍 Extracted values:', { userId, timeSlotId, groupSize, typeOfGroupSize: typeof groupSize });

    if (!userId || !timeSlotId) {
      return NextResponse.json({ error: 'Missing userId or timeSlotId' }, { status: 400 });
    }

    // Usar SQL directo para evitar problemas de schema
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Verificar que el timeSlot existe usando SQL directo
      const timeSlotExists = await prisma.$queryRaw`
        SELECT id FROM TimeSlot WHERE id = ${timeSlotId}
      `;

      if (!timeSlotExists || (timeSlotExists as any[]).length === 0) {
        return NextResponse.json({ error: 'TimeSlot not found' }, { status: 404 });
      }

      // Verificar que el usuario existe
      const userExists = await prisma.$queryRaw`
        SELECT id FROM User WHERE id = ${userId}
      `;

      if (!userExists || (userExists as any[]).length === 0) {
        console.log('❌ Usuario no encontrado:', userId);
        return NextResponse.json({ error: `User not found: ${userId}` }, { status: 404 });
      }
      
      console.log('✅ Usuario encontrado:', userId);

      // Verificar si ya existe una reserva PARA ESTA MODALIDAD ESPECÍFICA
      const existingBookingForGroupSize = await prisma.$queryRaw`
        SELECT id FROM Booking 
        WHERE userId = ${userId} 
        AND timeSlotId = ${timeSlotId} 
        AND groupSize = ${Number(groupSize) || 1}
        AND status IN ('PENDING', 'CONFIRMED')
      `;

      if (existingBookingForGroupSize && (existingBookingForGroupSize as any[]).length > 0) {
        return NextResponse.json({ error: `Ya tienes una reserva para la modalidad de ${groupSize} jugador${groupSize > 1 ? 'es' : ''} en esta clase` }, { status: 400 });
      }

      // Verificar si la modalidad específica ya está completa
      const modalityBookings = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM Booking 
        WHERE timeSlotId = ${timeSlotId} 
        AND groupSize = ${Number(groupSize) || 1}
        AND status IN ('PENDING', 'CONFIRMED')
      `;

      const currentModalityBookings = Number((modalityBookings as any[])[0].count);
      const requiredBookingsForModality = Number(groupSize) || 1;

      console.log(`📊 Modalidad ${groupSize}: ${currentModalityBookings}/${requiredBookingsForModality} reservas`);

      if (currentModalityBookings >= requiredBookingsForModality) {
        return NextResponse.json({ 
          error: `La modalidad de ${groupSize} jugador${groupSize > 1 ? 'es' : ''} ya está completa (${currentModalityBookings}/${requiredBookingsForModality})` 
        }, { status: 400 });
      }

      // 💰 OBTENER PRECIO DEL TIMESLOT Y VERIFICAR SALDO
      const timeSlotInfo = await prisma.$queryRaw`
        SELECT totalPrice FROM TimeSlot WHERE id = ${timeSlotId}
      `;

      if (!timeSlotInfo || (timeSlotInfo as any[]).length === 0) {
        return NextResponse.json({ error: 'No se pudo obtener información del precio' }, { status: 500 });
      }

      const totalPrice = Number((timeSlotInfo as any[])[0].totalPrice) || 55;
      const pricePerPerson = totalPrice / (Number(groupSize) || 1);

      console.log(`💰 Precio total: €${totalPrice}, Precio por persona (${groupSize} jugadores): €${pricePerPerson.toFixed(2)}`);

      // Verificar saldo del usuario
      const userInfo = await prisma.$queryRaw`
        SELECT credits FROM User WHERE id = ${userId}
      `;

      const currentCredits = Number((userInfo as any[])[0].credits) || 0;
      console.log(`💳 Saldo actual del usuario: €${currentCredits.toFixed(2)}`);

      if (currentCredits < pricePerPerson) {
        console.log(`❌ Saldo insuficiente: necesita €${pricePerPerson.toFixed(2)}, tiene €${currentCredits.toFixed(2)}`);
        return NextResponse.json({ 
          error: `Saldo insuficiente`,
          details: `Necesitas €${pricePerPerson.toFixed(2)} pero solo tienes €${currentCredits.toFixed(2)}. Por favor, recarga tu saldo.`,
          required: pricePerPerson,
          current: currentCredits,
          missing: pricePerPerson - currentCredits
        }, { status: 400 });
      }

      // Descontar el saldo
      const newCredits = currentCredits - pricePerPerson;
      await prisma.$executeRaw`
        UPDATE User SET credits = ${newCredits}, updatedAt = datetime('now') WHERE id = ${userId}
      `;

      console.log(`✅ Saldo actualizado: €${currentCredits.toFixed(2)} → €${newCredits.toFixed(2)} (descuento: €${pricePerPerson.toFixed(2)})`);

      // Crear la reserva CON groupSize (la columna existe según el schema)
      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.$executeRaw`
        INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
        VALUES (${bookingId}, ${userId}, ${timeSlotId}, ${Number(groupSize) || 1}, 'CONFIRMED', datetime('now'), datetime('now'))
      `;

      console.log('✅ Booking created successfully:', bookingId);

      // 🎯 AUTO-GENERAR NUEVA TARJETA ABIERTA
      await autoGenerateOpenSlot(timeSlotId, prisma);

      return NextResponse.json({
        success: true,
        bookingId,
        message: 'Reserva creada exitosamente'
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}