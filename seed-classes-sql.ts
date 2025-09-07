import { PrismaClient } from '@prisma/client';
import { addDays, setHours, setMinutes, addMinutes, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function seedClassesWithSQL() {
  console.log('🎾 Seeding classes data with direct SQL...');

  try {
    // Primero verificar que las tablas básicas existen
    const clubs = await prisma.club.findMany();
    if (clubs.length === 0) {
      console.log('📍 Creating basic club...');
      await prisma.club.create({
        data: {
          id: 'club-1',
          name: 'Padel Estrella'
        }
      });
    }

    const courts = await prisma.court.findMany();
    if (courts.length === 0) {
      console.log('🏟️ Creating courts...');
      for (let i = 1; i <= 4; i++) {
        await prisma.court.create({
          data: {
            id: `court-${i}`,
            number: i,
            clubId: 'club-1'
          }
        });
      }
    }

    // Crear instructores usando SQL directo
    console.log('👨‍🏫 Creating instructors with SQL...');
    const instructorsData = [
      {
        id: 'inst-1',
        name: 'Carlos Santana',
        clubId: 'club-1',
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/1.jpg'
      },
      {
        id: 'inst-2',
        name: 'Ana García',
        clubId: 'club-1',
        profilePictureUrl: 'https://randomuser.me/api/portraits/women/2.jpg'
      },
      {
        id: 'inst-3',
        name: 'Miguel Rodriguez',
        clubId: 'club-1',
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/3.jpg'
      },
      {
        id: 'inst-4',
        name: 'Laura Martínez',
        clubId: 'club-1',
        profilePictureUrl: 'https://randomuser.me/api/portraits/women/4.jpg'
      }
    ];

    for (const instructor of instructorsData) {
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO Instructor (id, clubId, name, profilePictureUrl, createdAt, updatedAt)
        VALUES (${instructor.id}, ${instructor.clubId}, ${instructor.name}, ${instructor.profilePictureUrl}, datetime('now'), datetime('now'))
      `;
    }

    // Crear horarios de clases
    console.log('🕐 Creating time slots with SQL...');
    const today = startOfDay(new Date());
    let timeSlotCount = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = addDays(today, dayOffset);
      
      // Horarios: 8:00 AM a 10:00 PM, cada hora
      for (let hour = 8; hour <= 21; hour++) {
        const startTime = setHours(date, hour);
        const endTime = addMinutes(startTime, 60);
        
        // Usar instructor rotativo
        const instructorIndex = (hour - 8) % instructorsData.length;
        const instructor = instructorsData[instructorIndex];
        
        // Pista aleatoria
        const courtNumber = ((hour - 8) % 4) + 1;
        
        const levels = ['principiante', 'intermedio', 'avanzado', 'abierto'];
        const categories = ['abierta', 'masculina', 'femenina', 'mixta'];
        
        const level = levels[timeSlotCount % levels.length];
        const category = categories[timeSlotCount % categories.length];
        const totalPrice = 35.0 + (timeSlotCount % 3) * 5; // Precios variados
        
        const timeSlotId = `ts-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${hour}-${instructor.id}`;
        
        await prisma.$executeRaw`
          INSERT OR REPLACE INTO TimeSlot (
            id, clubId, courtId, instructorId, start, end, maxPlayers, totalPrice, level, category, createdAt, updatedAt
          ) VALUES (
            ${timeSlotId}, 
            ${instructor.clubId}, 
            ${'court-' + courtNumber}, 
            ${instructor.id}, 
            ${startTime.toISOString()}, 
            ${endTime.toISOString()}, 
            4, 
            ${totalPrice}, 
            ${level}, 
            ${category}, 
            datetime('now'), 
            datetime('now')
          )
        `;
        
        timeSlotCount++;
      }
    }

    console.log(`✅ Created ${timeSlotCount} time slots`);

    // Crear algunos usuarios de ejemplo si no existen
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('👥 Creating sample users...');
      const sampleUsers = [
        { id: 'user-1', email: 'juan@example.com', name: 'Juan Pérez' },
        { id: 'user-2', email: 'maria@example.com', name: 'María García' },
        { id: 'user-3', email: 'carlos@example.com', name: 'Carlos López' }
      ];

      for (const user of sampleUsers) {
        await prisma.user.create({ data: user });
      }
    }

    // Crear algunas reservas de ejemplo
    console.log('📝 Creating sample bookings with SQL...');
    const timeSlots = await prisma.$queryRaw`SELECT id FROM TimeSlot LIMIT 5`;
    const allUsers = await prisma.user.findMany();
    
    if (Array.isArray(timeSlots) && timeSlots.length > 0 && allUsers.length > 0) {
      for (let i = 0; i < Math.min(3, timeSlots.length); i++) {
        const timeSlot = timeSlots[i] as any;
        const user = allUsers[i % allUsers.length];
        const groupSize = Math.floor(Math.random() * 4) + 1;
        
        const bookingId = `booking-${user.id}-${timeSlot.id}`;
        
        await prisma.$executeRaw`
          INSERT OR REPLACE INTO Booking (id, userId, timeSlotId, groupSize, createdAt)
          VALUES (${bookingId}, ${user.id}, ${timeSlot.id}, ${groupSize}, datetime('now'))
        `;
      }
      console.log('✅ Created sample bookings');
    }

    console.log('🎉 Classes seeding completed successfully!');
    
    // Verificar datos creados
    const instructorCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Instructor`;
    const timeSlotCountResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM TimeSlot`;
    const bookingCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Booking`;
    
    console.log('📊 Summary:');
    console.log(`- Instructors: ${(instructorCount as any)[0].count}`);
    console.log(`- Time Slots: ${(timeSlotCountResult as any)[0].count}`);
    console.log(`- Bookings: ${(bookingCount as any)[0].count}`);
    
  } catch (error) {
    console.error('❌ Error seeding classes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedClassesWithSQL().catch((e) => {
  console.error(e);
  process.exit(1);
});
