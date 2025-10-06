const { PrismaClient } = require('@prisma/client');

async function updateBookingSchema() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Actualizando esquema de Booking...');
    
    // Primero, eliminar la restricción única actual y añadir las nuevas columnas
    await prisma.$executeRaw`
      CREATE TABLE BookingNew (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        timeSlotId TEXT NOT NULL,
        groupSize INTEGER DEFAULT 1,
        status TEXT DEFAULT 'PENDING',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES User(id),
        FOREIGN KEY (timeSlotId) REFERENCES TimeSlot(id),
        UNIQUE(userId, timeSlotId, groupSize)
      )
    `;
    
    // Migrar datos existentes
    await prisma.$executeRaw`
      INSERT INTO BookingNew (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      SELECT 
        id, 
        userId, 
        timeSlotId, 
        COALESCE(groupSize, 1) as groupSize,
        'CONFIRMED' as status,
        createdAt,
        COALESCE(updatedAt, createdAt) as updatedAt
      FROM Booking
    `;
    
    // Eliminar tabla antigua y renombrar
    await prisma.$executeRaw`DROP TABLE Booking`;
    await prisma.$executeRaw`ALTER TABLE BookingNew RENAME TO Booking`;
    
    console.log('✅ Esquema actualizado exitosamente');
    
    // Verificar
    const bookings = await prisma.booking.findMany({
      take: 3,
      include: {
        user: {
          select: { name: true }
        }
      }
    });
    
    console.log('📋 Bookings migrados:', bookings.length);
    bookings.forEach(booking => {
      console.log(`- ${booking.user.name}: grupo ${booking.groupSize}, status ${booking.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBookingSchema();