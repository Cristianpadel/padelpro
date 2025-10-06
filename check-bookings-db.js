const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBookings() {
  try {
    console.log('🔍 Checking bookings in database...');
    
    // Verificar todas las reservas
    const allBookings = await prisma.$queryRaw`
      SELECT 
        b.id as booking_id,
        b.userId,
        b.timeSlotId,
        b.status,
        b.createdAt as booking_created,
        u.name as user_name,
        u.email as user_email,
        ts.start as timeslot_start,
        ts.end as timeslot_end,
        ts.level as timeslot_level,
        ts.category as timeslot_category,
        i.name as instructor_name,
        c.number as court_number
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      LEFT JOIN TimeSlot ts ON b.timeSlotId = ts.id
      LEFT JOIN Instructor i ON ts.instructorId = i.id
      LEFT JOIN Court c ON ts.courtId = c.id
      ORDER BY b.createdAt DESC
      LIMIT 20
    `;

    console.log(`📊 Total bookings found: ${allBookings.length}`);
    
    if (allBookings.length > 0) {
      console.log('\n📋 Recent bookings:');
      allBookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. Booking ID: ${booking.booking_id}`);
        console.log(`   User: ${booking.user_name} (${booking.user_email})`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   TimeSlot: ${booking.timeSlotId}`);
        console.log(`   Time: ${booking.timeslot_start} - ${booking.timeslot_end}`);
        console.log(`   Instructor: ${booking.instructor_name}`);
        console.log(`   Court: ${booking.court_number}`);
        console.log(`   Level: ${booking.timeslot_level}`);
        console.log(`   Category: ${booking.timeslot_category}`);
        console.log(`   Created: ${booking.booking_created}`);
      });
    } else {
      console.log('❌ No bookings found in database');
    }

    // Verificar usuarios
    const users = await prisma.$queryRaw`
      SELECT id, name, email FROM User
    `;
    console.log(`\n👥 Users in database: ${users.length}`);
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }

    // Verificar timeSlots disponibles
    const timeSlots = await prisma.$queryRaw`
      SELECT id, start, end, level, category, instructorId, courtId
      FROM TimeSlot
      ORDER BY start DESC
      LIMIT 10
    `;
    console.log(`\n🕐 TimeSlots in database: ${timeSlots.length}`);
    if (timeSlots.length > 0) {
      timeSlots.forEach(slot => {
        console.log(`   - ${slot.id}: ${slot.start} - ${slot.end} (${slot.level}/${slot.category})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking bookings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();