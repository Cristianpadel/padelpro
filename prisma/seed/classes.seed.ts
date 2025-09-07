import { PrismaClient } from '@prisma/client';
import { addDays, setHours, setMinutes, addMinutes, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

export async function seedClasses() {
  console.log('🎾 Seeding classes data...');

  try {
    // Primero, vamos a obtener los clubes existentes
    const clubs = await prisma.club.findMany();
    if (clubs.length === 0) {
      console.log('⚠️ No clubs found. Please seed clubs first.');
      return;
    }

    // Obtener las pistas existentes
    const courts = await prisma.court.findMany();
    if (courts.length === 0) {
      console.log('⚠️ No courts found. Please seed courts first.');
      return;
    }

    // Crear instructores de ejemplo
    const instructorsData = [
      {
        id: 'inst-1',
        name: 'Carlos Santana',
        clubId: clubs[0].id,
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/1.jpg'
      },
      {
        id: 'inst-2',
        name: 'Ana García',
        clubId: clubs[0].id,
        profilePictureUrl: 'https://randomuser.me/api/portraits/women/2.jpg'
      },
      {
        id: 'inst-3',
        name: 'Miguel Rodriguez',
        clubId: clubs[0].id,
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/3.jpg'
      },
      {
        id: 'inst-4',
        name: 'Laura Martínez',
        clubId: clubs[0].id,
        profilePictureUrl: 'https://randomuser.me/api/portraits/women/4.jpg'
      }
    ];

    // Crear instructores en la base de datos
    console.log('👨‍🏫 Creating instructors...');
    for (const instructorData of instructorsData) {
      await prisma.instructor.upsert({
        where: { id: instructorData.id },
        update: instructorData,
        create: instructorData
      });
    }

    const instructors = await prisma.instructor.findMany();
    console.log(`✅ Created ${instructors.length} instructors`);

    // Crear horarios de clases para los próximos 7 días
    console.log('🕐 Creating time slots...');
    const timeSlots: any[] = [];
    const today = startOfDay(new Date());

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = addDays(today, dayOffset);
      
      // Horarios disponibles: 8:00 AM a 10:00 PM
      for (let hour = 8; hour <= 21; hour++) {
        // Crear slots cada 30 minutos
        for (let minuteOffset = 0; minuteOffset < 60; minuteOffset += 30) {
          const startTime = setMinutes(setHours(date, hour), minuteOffset);
          const endTime = addMinutes(startTime, 60); // Clases de 1 hora
          
          // Asignar instructor aleatoriamente
          const instructor = instructors[Math.floor(Math.random() * instructors.length)];
          const court = courts[Math.floor(Math.random() * courts.length)];
          
          // Calcular precio base (precio pista + tarifa instructor)
          const baseCourtPrice = 20; // Precio base pista por hora
          const totalPrice = baseCourtPrice + instructor.defaultRatePerHour;
          
          // Determinar nivel y categoría
          const levels = ['principiante', 'intermedio', 'avanzado', 'abierto'];
          const categories = ['abierta', 'masculina', 'femenina', 'mixta'];
          
          const level = levels[Math.floor(Math.random() * levels.length)];
          const category = categories[Math.floor(Math.random() * categories.length)];
          
          timeSlots.push({
            clubId: clubs[0].id,
            courtId: court.id,
            instructorId: instructor.id,
            start: startTime,
            end: endTime,
            maxPlayers: 4,
            totalPrice,
            level,
            category
          });
        }
      }
    }

    // Insertar time slots en lotes para mejor rendimiento
    console.log(`📅 Inserting ${timeSlots.length} time slots...`);
    const batchSize = 100;
    for (let i = 0; i < timeSlots.length; i += batchSize) {
      const batch = timeSlots.slice(i, i + batchSize);
      await prisma.timeSlot.createMany({
        data: batch,
        skipDuplicates: true
      });
    }

    // Crear algunas reservas de ejemplo
    console.log('📝 Creating sample bookings...');
    const users = await prisma.user.findMany();
    const createdTimeSlots = await prisma.timeSlot.findMany({
      take: 20 // Solo los primeros 20 para crear reservas
    });

    if (users.length > 0 && createdTimeSlots.length > 0) {
      const sampleBookings: any[] = [];
      
      // Crear 10 reservas de ejemplo
      for (let i = 0; i < Math.min(10, createdTimeSlots.length, users.length); i++) {
        const timeSlot = createdTimeSlots[i];
        const user = users[i % users.length];
        const groupSize = Math.floor(Math.random() * 4) + 1; // 1-4 personas
        
        sampleBookings.push({
          userId: user.id,
          timeSlotId: timeSlot.id,
          groupSize
        });
      }

      for (const booking of sampleBookings) {
        await prisma.booking.upsert({
          where: {
            userId_timeSlotId: {
              userId: booking.userId,
              timeSlotId: booking.timeSlotId
            }
          },
          update: booking,
          create: booking
        });
      }

      console.log(`✅ Created ${sampleBookings.length} sample bookings`);
    }

    console.log('🎉 Classes seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding classes:', error);
    throw error;
  }
}

export async function cleanClasses() {
  console.log('🧹 Cleaning classes data...');
  
  try {
    await prisma.booking.deleteMany();
    await prisma.timeSlot.deleteMany();
    await prisma.instructor.deleteMany();
    
    console.log('✅ Classes data cleaned successfully!');
  } catch (error) {
    console.error('❌ Error cleaning classes data:', error);
    throw error;
  }
}
