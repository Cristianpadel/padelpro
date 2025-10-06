const Database = require('better-sqlite3');

try {
  const db = new Database('prisma/prisma/dev.db');
  
  // Ver TimeSlots disponibles
  console.log('TimeSlots disponibles:');
  const timeSlots = db.prepare('SELECT id, start, end, level, category FROM TimeSlot LIMIT 5').all();
  timeSlots.forEach(slot => {
    console.log(`- ${slot.id}: ${slot.start} - ${slot.end}, nivel: ${slot.level}, categoría: ${slot.category}`);
  });
  
  if (timeSlots.length > 0) {
    // Crear reservas de prueba
    const insertBookingStmt = db.prepare(`
      INSERT INTO Booking (id, userId, timeSlotId, status, createdAt, updatedAt)
      VALUES (?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    try {
      // Reserva 1: María en el primer slot
      insertBookingStmt.run('booking-1', 'user-1', timeSlots[0].id);
      console.log('\n✅ Reserva de María creada');
    } catch (e) {
      console.log('Reserva de María ya existe');
    }
    
    if (timeSlots.length > 1) {
      try {
        // Reserva 2: Carlos en el segundo slot
        insertBookingStmt.run('booking-2', 'user-2', timeSlots[1].id);
        console.log('✅ Reserva de Carlos creada');
      } catch (e) {
        console.log('Reserva de Carlos ya existe');
      }
    }
    
    // Verificar reservas creadas
    console.log('\nReservas creadas:');
    const bookings = db.prepare(`
      SELECT b.id, u.name, u.genderCategory, u.level, t.start, t.category as timeSlotCategory
      FROM Booking b
      JOIN User u ON b.userId = u.id
      JOIN TimeSlot t ON b.timeSlotId = t.id
    `).all();
    
    bookings.forEach(booking => {
      console.log(`- ${booking.name} (${booking.genderCategory}, ${booking.level}) reservó para ${booking.start}`);
    });
  } else {
    console.log('No hay TimeSlots disponibles para crear reservas');
  }
  
  db.close();
  console.log('\n✅ Reservas de prueba creadas');
} catch (error) {
  console.error('Error:', error.message);
}