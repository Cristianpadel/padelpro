// src/app/api/admin/generate-class-proposals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { addHours, addMinutes, startOfDay, endOfDay, format, isAfter, isBefore } from 'date-fns';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando generación de clases...');
    const { date, clubId } = await request.json();
    console.log('📥 Datos recibidos:', { date, clubId });
    
    if (!date || !clubId) {
      console.log('❌ Faltan datos requeridos');
      return NextResponse.json({ error: 'Fecha y clubId son requeridos' }, { status: 400 });
    }

    const targetDate = new Date(date);
    const startTime = addHours(startOfDay(targetDate), 8); // Empieza a las 8:00 AM
    const endTime = addHours(startOfDay(targetDate), 22); // Termina a las 10:00 PM
    console.log('⏰ Horario:', { startTime, endTime });

    // Obtener todos los instructores activos del club
    console.log('🔍 Buscando instructores para club:', clubId);
    const instructors = await prisma.instructor.findMany({
      where: {
        clubId: clubId,
        isActive: true
      },
      include: {
        user: true
      }
    });
    console.log(`👨‍🏫 Instructores encontrados: ${instructors.length}`);

    if (instructors.length === 0) {
      console.log('❌ No hay instructores disponibles');
      return NextResponse.json({ error: 'No hay instructores disponibles para este club' }, { status: 400 });
    }

    // Obtener canchas disponibles
    console.log('🏟️ Buscando canchas para club:', clubId);
    const courts = await prisma.court.findMany({
      where: {
        clubId: clubId,
        isActive: true
      }
    });
    console.log(`🎾 Canchas encontradas: ${courts.length}`);

    if (courts.length === 0) {
      console.log('❌ No hay canchas disponibles');
      return NextResponse.json({ error: 'No hay canchas disponibles para este club' }, { status: 400 });
    }

    const createdSlots = [];
    const slotDuration = 90; // 90 minutos por clase
    const intervalMinutes = 30; // Cada 30 minutos

    console.log('⚡ Iniciando generación de slots...');
    // Generar slots cada 30 minutos para cada instructor
    for (const instructor of instructors) {
      console.log(`👨‍🏫 Procesando instructor: ${instructor.user.name}`);
      let currentTime = new Date(startTime);
      let slotsForInstructor = 0;
      
      while (isBefore(currentTime, endTime)) {
        const slotEnd = addMinutes(currentTime, slotDuration);
        
        // Verificar que el slot no se pase del horario de cierre
        if (isAfter(slotEnd, endTime)) {
          console.log(`⏰ Slot terminaría después del horario: ${format(slotEnd, 'HH:mm')}`);
          break;
        }

        // Verificar si ya existe un slot para este instructor en este horario
        console.log(`🔍 Verificando slot existente: ${format(currentTime, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`);
        const existingSlot = await prisma.timeSlot.findFirst({
          where: {
            instructorId: instructor.id,
            start: currentTime,
            end: slotEnd
          }
        });

        if (!existingSlot) {
          console.log(`✨ Creando nuevo slot: ${format(currentTime, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`);
          
          // Generar ID único para el TimeSlot
          const timeSlotId = `ts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Crear el slot usando SQL directo para evitar problemas con el cliente de Prisma
          await prisma.$executeRaw`
            INSERT INTO TimeSlot (id, clubId, instructorId, start, end, maxPlayers, totalPrice, level, category, createdAt, updatedAt)
            VALUES (
              ${timeSlotId},
              ${clubId},
              ${instructor.id},
              ${currentTime.toISOString()},
              ${slotEnd.toISOString()},
              4,
              25.0,
              'ABIERTO',
              'ABIERTO',
              datetime('now'),
              datetime('now')
            )
          `;

          console.log(`✅ TimeSlot creado: ${timeSlotId}`);

          createdSlots.push({
            id: timeSlotId,
            instructor: instructor.user.name,
            start: format(currentTime, 'HH:mm'),
            end: format(slotEnd, 'HH:mm'),
            date: format(targetDate, 'yyyy-MM-dd')
          });
          slotsForInstructor++;
        } else {
          console.log(`⚠️ Slot ya existe para este horario`);
        }

        // Avanzar al siguiente slot (cada 30 minutos)
        currentTime = addMinutes(currentTime, intervalMinutes);
      }
      console.log(`✅ Instructor ${instructor.user.name}: ${slotsForInstructor} slots creados`);
    }

    console.log(`🎉 Proceso completado: ${createdSlots.length} slots creados`);
    return NextResponse.json({
      message: `Se crearon ${createdSlots.length} propuestas de clases`,
      slots: createdSlots
    });

  } catch (error) {
    console.error('💥 Error generando propuestas de clases:', error);
    console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Error interno del servidor al generar propuestas de clases',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Endpoint para generar automáticamente para los próximos días
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Iniciando generación automática de múltiples días...');
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId') || 'club-1';
    const days = parseInt(searchParams.get('days') || '7'); // Por defecto 7 días

    console.log('📥 Parámetros:', { clubId, days });

    const createdSlots = [];
    let totalSlotsCreated = 0;
    
    // Obtener instructores y canchas una sola vez
    const instructors = await prisma.instructor.findMany({
      where: {
        clubId: clubId,
        isActive: true
      },
      include: {
        user: true
      }
    });

    if (instructors.length === 0) {
      return NextResponse.json({ error: 'No hay instructores disponibles para este club' }, { status: 400 });
    }

    const courts = await prisma.court.findMany({
      where: {
        clubId: clubId,
        isActive: true
      }
    });

    if (courts.length === 0) {
      return NextResponse.json({ error: 'No hay canchas disponibles para este club' }, { status: 400 });
    }

    console.log(`👨‍🏫 Instructores: ${instructors.length}, 🎾 Canchas: ${courts.length}`);
    
    // Generar para los próximos X días
    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      targetDate.setHours(0, 0, 0, 0);
      
      console.log(`📅 Día ${dayOffset + 1}/${days}: ${format(targetDate, 'yyyy-MM-dd')}`);
      
      const startTime = addHours(startOfDay(targetDate), 9); // 9:00 AM
      const endTime = addHours(startOfDay(targetDate), 21); // 21:00 (9:00 PM)
      
      const slotDuration = 90; // 90 minutos
      const intervalMinutes = 30; // Cada 30 minutos

      // Generar slots para cada instructor
      for (const instructor of instructors) {
        let currentTime = new Date(startTime);
        
        while (isBefore(currentTime, endTime)) {
          const slotEnd = addMinutes(currentTime, slotDuration);
          
          if (isAfter(slotEnd, endTime)) {
            break;
          }

          // Verificar si ya existe
          const existingSlot = await prisma.timeSlot.findFirst({
            where: {
              instructorId: instructor.id,
              start: currentTime,
              end: slotEnd
            }
          });

          if (!existingSlot) {
            const timeSlotId = `ts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await prisma.$executeRaw`
              INSERT INTO TimeSlot (id, clubId, instructorId, start, end, maxPlayers, totalPrice, level, category, createdAt, updatedAt)
              VALUES (
                ${timeSlotId},
                ${clubId},
                ${instructor.id},
                ${currentTime.toISOString()},
                ${slotEnd.toISOString()},
                4,
                25.0,
                'ABIERTO',
                'ABIERTO',
                datetime('now'),
                datetime('now')
              )
            `;

            totalSlotsCreated++;
            createdSlots.push({
              id: timeSlotId,
              date: format(targetDate, 'yyyy-MM-dd'),
              start: format(currentTime, 'HH:mm'),
              end: format(slotEnd, 'HH:mm')
            });
          }

          currentTime = addMinutes(currentTime, intervalMinutes);
        }
      }
    }

    console.log(`🎉 Proceso completado: ${totalSlotsCreated} slots creados en ${days} días`);
    
    return NextResponse.json({
      message: `Proceso completado para ${days} días`,
      totalSlots: totalSlotsCreated,
      slots: createdSlots
    });

  } catch (error) {
    console.error('💥 Error en generación automática:', error);
    console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}