const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleTest() {
  try {
    console.log('🧪 Simple test with existing data...');
    
    // Verificar si hay datos existentes
    const existingUsers = await prisma.$queryRaw`SELECT COUNT(*) as count FROM User`;
    const existingTimeSlots = await prisma.$queryRaw`SELECT COUNT(*) as count FROM TimeSlot`;
    
    console.log(`👥 Existing users: ${existingUsers[0].count}`);
    console.log(`🕐 Existing timeSlots: ${existingTimeSlots[0].count}`);
    
    if (existingUsers[0].count === 0) {
      console.log('❌ No users found. Let me create basic test data via API calls...');
      
      // Crear datos básicos usando el endpoint de reservas
      console.log('🔧 Creating test booking via API...');
      
      try {
        const response = await fetch('http://localhost:9002/api/classes/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'test-user-' + Date.now(),
            timeSlotId: 'test-slot-' + Date.now(),
            groupSize: 2
          })
        });
        
        const result = await response.json();
        console.log('API response:', result);
        
      } catch (apiError) {
        console.log('API error (expected):', apiError.message);
      }
    } else {
      console.log('✅ Found existing data, proceeding with tests...');
      
      // Obtener usuarios existentes
      const users = await prisma.$queryRaw`SELECT id, name FROM User LIMIT 3`;
      console.log('\n👤 Users:');
      users.forEach(user => {
        console.log(`   - ${user.id}: ${user.name}`);
      });
      
      // Obtener clases existentes
      const timeSlots = await prisma.$queryRaw`SELECT id, start, maxPlayers FROM TimeSlot LIMIT 3`;
      console.log('\n🕐 TimeSlots:');
      timeSlots.forEach(slot => {
        console.log(`   - ${slot.id}: ${slot.start} (max: ${slot.maxPlayers})`);
      });
      
      if (users.length > 0 && timeSlots.length > 0) {
        const user = users[0];
        const slot = timeSlots[0];
        
        console.log(`\n🎯 Testing booking: ${user.name} in slot ${slot.id.substring(0, 12)}...`);
        
        // Crear reserva de prueba directamente en base de datos
        try {
          const bookingId = `test-booking-${Date.now()}`;
          await prisma.$executeRaw`
            INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
            VALUES (${bookingId}, ${user.id}, ${slot.id}, 2, 'CONFIRMED', datetime('now'), datetime('now'))
          `;
          
          console.log('✅ Created test booking:', bookingId);
          
          // Verificar la reserva
          const booking = await prisma.$queryRaw`
            SELECT b.*, u.name as userName, ts.start as slotStart
            FROM Booking b
            LEFT JOIN User u ON b.userId = u.id
            LEFT JOIN TimeSlot ts ON b.timeSlotId = ts.id
            WHERE b.id = ${bookingId}
          `;
          
          if (booking.length > 0) {
            const b = booking[0];
            console.log(`📝 Booking details: ${b.userName} booked ${b.groupSize} spots for ${b.slotStart}`);
          }
          
        } catch (error) {
          console.log('❌ Booking creation error:', error.message);
        }
      }
    }
    
    // Test admin endpoint
    console.log('\n🔗 Testing admin bookings endpoint...');
    try {
      const response = await fetch('http://localhost:9002/api/admin/bookings');
      const adminBookings = await response.json();
      console.log(`📊 Admin endpoint returned ${adminBookings.length} bookings`);
      
      if (adminBookings.length > 0) {
        console.log('✅ Admin endpoint working correctly!');
        adminBookings.slice(0, 2).forEach((booking, index) => {
          console.log(`   ${index + 1}. User: ${booking.user?.name || 'Unknown'}, Group size: ${booking.groupSize || 'N/A'}`);
        });
      } else {
        console.log('ℹ️ No bookings meet the admin criteria (complete classes only)');
      }
      
    } catch (fetchError) {
      console.log('❌ Admin endpoint error:', fetchError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleTest();