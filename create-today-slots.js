const Database = require('better-sqlite3');

try {
  const db = new Database('prisma/prisma/dev.db');
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  console.log(`Creando TimeSlots para hoy: ${todayStr}`);
  
  // Crear TimeSlots para hoy con diferentes horarios
  const timeSlots = [
    {
      id: 'slot-today-1',
      start: new Date(`${todayStr}T10:00:00.000Z`),
      end: new Date(`${todayStr}T11:30:00.000Z`),
      level: 'inicial-medio',
      category: 'mixto'
    },
    {
      id: 'slot-today-2', 
      start: new Date(`${todayStr}T12:00:00.000Z`),
      end: new Date(`${todayStr}T13:30:00.000Z`),
      level: 'avanzado',
      category: 'chico'
    },
    {
      id: 'slot-today-3',
      start: new Date(`${todayStr}T18:00:00.000Z`),
      end: new Date(`${todayStr}T19:30:00.000Z`), 
      level: 'intermedio',
      category: 'chica'
    }
  ];
  
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO TimeSlot (
      id, clubId, courtId, instructorId, start, end,
      maxPlayers, totalPrice, level, category, createdAt, updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  
  timeSlots.forEach(slot => {
    try {
      insertStmt.run(
        slot.id, 'club-1', 'court-1', 'instructor-1',
        slot.start.toISOString(), slot.end.toISOString(),
        4, 35.0, slot.level, slot.category
      );
      const startTime = slot.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const endTime = slot.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      console.log(`✅ TimeSlot creado: ${startTime}-${endTime}, nivel: ${slot.level}, categoría: ${slot.category}`);
    } catch (e) {
      console.log(`TimeSlot ${slot.id} ya existe`);
    }
  });
  
  // Crear algunas reservas para probar las tarjetas dinámicas
  const insertBookingStmt = db.prepare(`
    INSERT OR IGNORE INTO Booking (id, userId, timeSlotId, status, createdAt, updatedAt)
    VALUES (?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  
  try {
    // María en el primer slot de hoy
    insertBookingStmt.run('booking-today-1', 'user-1', 'slot-today-1');
    console.log('✅ Reserva de María creada para hoy');
  } catch (e) {
    console.log('Reserva de María ya existe');
  }
  
  try {
    // Carlos en el segundo slot de hoy  
    insertBookingStmt.run('booking-today-2', 'user-2', 'slot-today-2');
    console.log('✅ Reserva de Carlos creada para hoy');
  } catch (e) {
    console.log('Reserva de Carlos ya existe');
  }
  
  // Verificar qué slots están disponibles para hoy
  console.log(`\nTimeSlots disponibles para ${todayStr}:`);
  const todaySlots = db.prepare(`
    SELECT ts.id, ts.start, ts.end, ts.level, ts.category,
           COUNT(b.id) as bookings_count,
           GROUP_CONCAT(u.name) as booked_users
    FROM TimeSlot ts
    LEFT JOIN Booking b ON ts.id = b.timeSlotId AND b.status = 'CONFIRMED'
    LEFT JOIN User u ON b.userId = u.id
    WHERE DATE(ts.start) = ?
    GROUP BY ts.id
    ORDER BY ts.start
  `).all(todayStr);
  
  todaySlots.forEach(slot => {
    const start = new Date(slot.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const end = new Date(slot.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const users = slot.booked_users || 'Sin reservas';
    console.log(`- ${start}-${end}: ${slot.level}, ${slot.category} | Reservas: ${slot.bookings_count} | Usuarios: ${users}`);
  });
  
  db.close();
  console.log('\n✅ TimeSlots para hoy creados correctamente');
} catch (error) {
  console.error('Error:', error.message);
}