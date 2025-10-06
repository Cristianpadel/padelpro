const { PrismaClient } = require('@prisma/client');

async function testDirectSQL() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Probando creación directa con SQL...');
    
    const clubId = "cmfpu6vzq0002tgwk1tntqzsx";
    const instructorId = "cmfpu6w0l000btgwkhqsb3rqd";
    const start = new Date("2024-01-18T07:00:00.000Z");
    const end = new Date("2024-01-18T08:30:00.000Z");
    
    // Crear usando SQL directo
    const result = await prisma.$executeRaw`
      INSERT INTO TimeSlot (id, clubId, instructorId, start, end, maxPlayers, totalPrice, level, category, createdAt, updatedAt)
      VALUES (
        lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('AB89',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
        ${clubId},
        ${instructorId},
        ${start.toISOString()},
        ${end.toISOString()},
        4,
        25.0,
        'ABIERTO',
        'ABIERTO',
        datetime('now'),
        datetime('now')
      )
    `;
    
    console.log('✅ TimeSlot creado con SQL directo:', result);
    
    // Verificar que se creó
    const timeSlots = await prisma.timeSlot.findMany({
      where: { clubId: clubId },
      include: {
        club: true,
        instructor: {
          include: { user: true }
        }
      }
    });
    
    console.log('🎯 TimeSlots encontrados:', timeSlots.length);
    timeSlots.forEach(slot => {
      console.log(`  - ${slot.instructor.user.name}: ${new Date(slot.start).toLocaleTimeString()} - ${new Date(slot.end).toLocaleTimeString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectSQL();