const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateCompleteData() {
  console.log('=== CREATING COMPLETE CLASS SYSTEM DATA ===');
  
  try {
    // Clean existing data
    await prisma.booking.deleteMany();
    await prisma.timeSlot.deleteMany();
    await prisma.instructor.deleteMany();
    await prisma.court.deleteMany();
    await prisma.club.deleteMany();
    
    console.log('✓ Cleaned existing data');
    
    // Create club
    const club = await prisma.club.create({
      data: {
        id: 'club-1',
        name: 'Padel Pro Club',
        address: 'Calle Principal 123, Madrid'
      }
    });
    console.log('✓ Created club:', club.name);
    
    // Create courts
    const courts = [];
    for (let i = 1; i <= 4; i++) {
      const court = await prisma.court.create({
        data: {
          clubId: club.id,
          number: i,
          name: `Pista ${i}`
        }
      });
      courts.push(court);
    }
    console.log('✓ Created courts:', courts.length);
    
    // Create instructors
    const instructors = [];
    const instructorNames = [
      'Carlos Martínez',
      'Ana García',  
      'Miguel López',
      'Sofia Rodríguez'
    ];
    
    for (const name of instructorNames) {
      // First create a user for the instructor
      const user = await prisma.user.create({
        data: {
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@padelproclub.com`,
          name: name
        }
      });
      
      const instructor = await prisma.instructor.create({
        data: {
          userId: user.id,
          clubId: club.id,
          name: name,
          profilePictureUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff`,
          hourlyRate: 25.0 + Math.random() * 15,
          specialties: 'Clases de pádel para todos los niveles',
          experience: '2-5 años'
        }
      });
      instructors.push(instructor);
    }
    console.log('✓ Created instructors:', instructors.length);
    
    // Create time slots for multiple days
    const timeSlots = [];
    const daysToGenerate = 7; // Generate for next 7 days
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of today
    
    for (let day = 0; day < daysToGenerate; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      console.log(`Creating slots for ${currentDate.toISOString().split('T')[0]}...`);
      
      // Generate slots from 7:00 AM to 11:00 PM (16 hours × 2 = 32 slots per court)
      for (let hour = 7; hour < 23; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startTime = new Date(currentDate);
          startTime.setHours(hour, minute, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + 30);
          
          // Create slots for each court with different instructors
          for (const court of courts) {
            // Some slots with instructors, some without
            const useInstructor = Math.random() > 0.3; // 70% chance of having instructor
            const instructor = useInstructor ? instructors[Math.floor(Math.random() * instructors.length)] : null;
            
            const slot = await prisma.timeSlot.create({
              data: {
                clubId: club.id,
                courtId: court.id,
                instructorId: instructor?.id || null,
                start: startTime,
                end: endTime,
                maxPlayers: 4,
                totalPrice: instructor ? 25.0 + Math.random() * 15 : 15.0 + Math.random() * 10,
                level: ['principiante', 'intermedio', 'avanzado', 'abierto'][Math.floor(Math.random() * 4)],
                category: ['mixto', 'masculino', 'femenino'][Math.floor(Math.random() * 3)]
              }
            });
            timeSlots.push(slot);
          }
        }
      }
      
      console.log(`  ✓ Created ${32 * courts.length} slots for day ${day + 1}`);
    }
    
    console.log('\\n=== SUMMARY ===');
    console.log('Club:', 1);
    console.log('Courts:', courts.length);
    console.log('Instructors:', instructors.length);
    console.log('Time slots:', timeSlots.length);
    console.log('Days generated:', daysToGenerate);
    console.log('Slots per day per court:', 32);
    console.log('Total slots per day:', 32 * courts.length);
    
    // Test query for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const todaySlots = await prisma.timeSlot.count({
      where: {
        clubId: club.id,
        start: {
          gte: BigInt(today.getTime()),
          lt: BigInt(tomorrow.getTime())
        }
      }
    });
    
    console.log('\\nSlots for today:', todaySlots);
    console.log('\\n✅ Database populated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generateCompleteData().finally(() => prisma.$disconnect());
