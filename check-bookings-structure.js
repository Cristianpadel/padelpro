const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBookings() {
  try {
    console.log('📋 Reservas actuales:');
    const bookings = await prisma.booking.findMany();
    console.log(JSON.stringify(bookings, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();