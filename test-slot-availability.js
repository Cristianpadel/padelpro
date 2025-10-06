const Database = require('better-sqlite3');

try {
  const db = new Database('prisma/prisma/dev.db');
  
  console.log('🧪 Testing slot availability check...');
  
  // Verificar que el slot existe
  const slot = db.prepare('SELECT * FROM TimeSlot WHERE id = ?').get('slot-today-3');
  console.log('📋 Slot found:', slot);
  
  if (slot) {
    // Contar reservas existentes
    const bookings = db.prepare("SELECT * FROM Booking WHERE timeSlotId = ? AND status = 'CONFIRMED'").all('slot-today-3');
    console.log('📊 Existing bookings:', bookings.length);
    console.log('📋 Booking details:', bookings);
    
    const availableSpots = slot.maxPlayers - bookings.length;
    console.log(`📈 Available spots: ${availableSpots} (max: ${slot.maxPlayers}, booked: ${bookings.length})`);
    
    if (availableSpots >= 2) {
      console.log('✅ Enough space available for booking');
      
      // Try to create booking manually
      const bookingId = `booking-test-${Date.now()}`;
      
      try {
        db.prepare(`
          INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 'CONFIRMED', datetime('now'), datetime('now'))
        `).run(bookingId, 'user-1', 'slot-today-3', 2);
        
        console.log('✅ Manual booking created successfully:', bookingId);
        
        // Verify it was created
        const newBooking = db.prepare('SELECT * FROM Booking WHERE id = ?').get(bookingId);
        console.log('📋 Created booking:', newBooking);
        
      } catch (insertError) {
        console.log('❌ Manual booking failed:', insertError.message);
      }
      
    } else {
      console.log('❌ Not enough space');
    }
  } else {
    console.log('❌ Slot not found');
  }
  
  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
}