const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBasicSlots() {
  try {
    console.log('=== CREATING BASIC TIME SLOTS ===');
    
    // Get existing data
    const club = await prisma.club.findFirst();
    const courts = await prisma.court.findMany();
    const instructors = await prisma.instructor.findMany();
    
    console.log('Club:', club?.name);
    console.log('Courts:', courts.length);
    console.log('Instructors:', instructors.length);
    
    if (!club) {
      console.log('❌ No club found');
      return;
    }
    
    // Create slots for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let slotsCreated = 0;
    
    // Create slots every 30 minutes from 8 AM to 10 PM (14 hours = 28 slots)
    for (let hour = 8; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = new Date(today);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);
        
        // Create 1 slot per court (or without court if none)
        const courtCount = Math.max(1, courts.length);
        for (let i = 0; i < courtCount; i++) {
          const court = courts[i] || null;
          const instructor = instructors[slotsCreated % instructors.length] || null;
          
          try {
            await prisma.timeSlot.create({
              data: {
                clubId: club.id,
                courtId: court?.id || null,
                instructorId: instructor?.id || null,
                start: startTime,
                end: endTime,
                maxPlayers: 4,
                totalPrice: 20 + Math.random() * 20,
                level: ['principiante', 'intermedio', 'avanzado', 'abierto'][Math.floor(Math.random() * 4)],
                category: ['mixto', 'masculino', 'femenino'][Math.floor(Math.random() * 3)]
              }
            });
            slotsCreated++;
          } catch (error) {
            console.log('Error creating slot:', error.message);
            // Try with minimal data
            await prisma.timeSlot.create({
              data: {
                clubId: club.id,
                start: startTime,
                end: endTime,
                maxPlayers: 4
              }
            });
            slotsCreated++;
          }
        }
      }
    }
    
    console.log(`✓ Created ${slotsCreated} time slots for today`);
    
    // Verify
    const count = await prisma.timeSlot.count({
      where: { clubId: club.id }
    });
    console.log(`Total slots in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createBasicSlots().finally(() => prisma.$disconnect());
