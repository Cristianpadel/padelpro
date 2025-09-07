import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createClassesTables() {
  console.log('🏗️ Creating classes tables manually...');

  try {
    // Crear tabla Instructor
    console.log('👨‍🏫 Creating Instructor table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Instructor" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clubId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "profilePictureUrl" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `;

    // Crear tabla TimeSlot
    console.log('🕐 Creating TimeSlot table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TimeSlot" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clubId" TEXT NOT NULL,
        "courtId" TEXT,
        "instructorId" TEXT,
        "start" DATETIME NOT NULL,
        "end" DATETIME NOT NULL,
        "maxPlayers" INTEGER NOT NULL,
        "totalPrice" REAL,
        "level" TEXT,
        "category" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `;

    // Crear tabla Booking
    console.log('📝 Creating Booking table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Booking" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "timeSlotId" TEXT NOT NULL,
        "groupSize" INTEGER NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `;

    // Crear índice único para Booking
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "Booking_userId_timeSlotId_key" ON "Booking"("userId", "timeSlotId")
    `;

    // Verificar que las tablas se crearon
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;
    
    console.log('✅ Tables now in database:', tables);
    
    console.log('🎉 Classes tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createClassesTables().catch((e) => {
  console.error(e);
  process.exit(1);
});
