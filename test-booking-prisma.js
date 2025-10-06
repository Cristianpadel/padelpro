// Test directo con SQL para verificar qué está fallando
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBookingWithSQL() {
  try {
    console.log('🔍 Testeando booking con Prisma...');
    
    // Verificar que el timeSlot existe
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: 'slot-2025-09-14-court-1-09:00' }
    });
    
    if (!timeSlot) {
      console.log('❌ TimeSlot no encontrado');
      return;
    }
    
    console.log('✅ TimeSlot encontrado:', timeSlot.id);
    
    // Verificar usuario
    const user = await prisma.user.findUnique({
      where: { id: 'user-5' }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:', user.name);
    
    // Intentar crear booking
    console.log('🔧 Creando booking...');
    const booking = await prisma.booking.create({
      data: {
        userId: 'user-5',
        timeSlotId: 'slot-2025-09-14-court-1-09:00',
        groupSize: 2
      }
    });
    
    console.log('✅ Booking creado exitosamente:', booking);
    
  } catch (error) {
    console.error('❌ Error detallado:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingWithSQL();