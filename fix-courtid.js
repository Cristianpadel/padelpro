const { PrismaClient } = require('@prisma/client');

async function fixCourtId() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Recreando tabla TimeSlot con courtId nullable...');
    
    // Crear nueva tabla con courtId nullable
    await prisma.$executeRaw`
      CREATE TABLE "TimeSlot_new" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clubId" TEXT NOT NULL,
        "courtId" TEXT,
        "instructorId" TEXT NOT NULL,
        "start" DATETIME NOT NULL,
        "end" DATETIME NOT NULL,
        "maxPlayers" INTEGER NOT NULL DEFAULT 4,
        "totalPrice" REAL NOT NULL,
        "level" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `;
    
    // Copiar datos si existen
    const existingTimeSlots = await prisma.$queryRaw`SELECT COUNT(*) as count FROM TimeSlot`;
    console.log('TimeSlots existentes:', existingTimeSlots);
    
    if (existingTimeSlots[0].count > 0) {
      await prisma.$executeRaw`INSERT INTO "TimeSlot_new" SELECT * FROM "TimeSlot"`;
    }
    
    // Eliminar tabla vieja
    await prisma.$executeRaw`DROP TABLE "TimeSlot"`;
    
    // Renombrar nueva tabla
    await prisma.$executeRaw`ALTER TABLE "TimeSlot_new" RENAME TO "TimeSlot"`;
    
    console.log('✅ Tabla TimeSlot recreada con courtId nullable');
    
    // Verificar nueva estructura
    const info = await prisma.$queryRaw`PRAGMA table_info(TimeSlot)`;
    const courtIdField = info.find(field => field.name === 'courtId');
    console.log('courtId field:', courtIdField);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCourtId();