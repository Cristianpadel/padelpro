const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMassiveData() {
  console.log('=== CREATING MASSIVE CLASS DATA ===');
  
  try {
    // Clean all data first
    await prisma.booking.deleteMany();
    await prisma.timeSlot.deleteMany();
    await prisma.instructor.deleteMany();
    await prisma.court.deleteMany();
    await prisma.user.deleteMany();
    await prisma.club.deleteMany();
    
    console.log('✓ Cleaned all data');
    
    // Create club
    const club = await prisma.club.create({
      data: {
        id: 'club-1',
        name: 'Padel Pro Club',
        address: 'Calle Principal 123, Madrid'
      }
    });
    console.log('✓ Created club');
    
    // Create 6 courts
    const courts = [];
    for (let i = 1; i <= 6; i++) {
      const court = await prisma.court.create({
        data: {
          clubId: club.id,
          number: i,
          name: `Pista ${i}`
        }
      });
      courts.push(court);
    }
    console.log('✓ Created 6 courts');
    
    // Create multiple instructors
    const instructors = [];
    const instructorData = [
      { name: 'Carlos Martínez', email: 'carlos@club.com' },
      { name: 'Ana García', email: 'ana@club.com' },
      { name: 'Miguel López', email: 'miguel@club.com' },
      { name: 'Sofia Rodríguez', email: 'sofia@club.com' },
      { name: 'Juan Pérez', email: 'juan@club.com' },
      { name: 'Laura Fernández', email: 'laura@club.com' }
    ];
    
    for (const data of instructorData) {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name
        }
      });
      
      const instructor = await prisma.instructor.create({
        data: {
          userId: user.id,
          clubId: club.id,
          name: data.name,
          profilePictureUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=0ea5e9&color=fff`,
          hourlyRate: 20 + Math.random() * 20,
          specialties: 'Clases de pádel para todos los niveles',
          experience: '2-5 años'
        }
      });
      instructors.push(instructor);
    }
    console.log('✓ Created 6 instructors');
    
    // Create massive amount of slots for today and tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let totalSlots = 0;
    
    for (let day = 0; day < 2; day++) { // 2 days
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      
      console.log(`Creating slots for ${currentDate.toISOString().split('T')[0]}...`);
      
      // Create slots every 30 minutes from 7:00 AM to 11:00 PM (16 hours = 32 slots per court)
      for (let hour = 7; hour < 23; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startTime = new Date(currentDate);
          startTime.setHours(hour, minute, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + 30);
          
          // Create slots for each court
          for (const court of courts) {
            // Half the slots have instructors, half don't
            const instructor = totalSlots % 2 === 0 ? instructors[totalSlots % instructors.length] : null;
            
            await prisma.timeSlot.create({
              data: {
                clubId: club.id,
                courtId: court.id,
                instructorId: instructor?.id || null,
                start: startTime,
                end: endTime,
                maxPlayers: 4,
                totalPrice: instructor ? 25 + Math.random() * 15 : 15 + Math.random() * 10,
                level: ['principiante', 'intermedio', 'avanzado', 'abierto'][Math.floor(Math.random() * 4)],
                category: ['mixto', 'masculino', 'femenino'][Math.floor(Math.random() * 3)]
              }
            });
            totalSlots++;
          }
        }
      }
      
      console.log(`  ✓ Created ${32 * courts.length} slots for day ${day + 1}`);
    }
    
    console.log('\\n=== SUMMARY ===');
    console.log('Club: 1');
    console.log('Courts:', courts.length);
    console.log('Instructors:', instructors.length);
    console.log('Total slots:', totalSlots);
    console.log('Slots per day per court: 32');
    console.log('Total slots per day:', 32 * courts.length);
    
    // Test query for today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const todayCount = await prisma.timeSlot.count({
      where: {
        clubId: club.id,
        start: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    console.log('\\nSlots for today:', todayCount);
    console.log('\\n✅ Database populated with massive data!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createMassiveData().finally(() => prisma.$disconnect());
