const Database = require('better-sqlite3');

try {
  const db = new Database('prisma/prisma/dev.db');
  
  // Verificar si existen clubs, courts e instructors
  const clubs = db.prepare('SELECT id, name FROM Club').all();
  const courts = db.prepare('SELECT id, number FROM Court').all();
  const instructors = db.prepare('SELECT id, name FROM Instructor').all();
  
  console.log('Clubs:', clubs.length);
  console.log('Courts:', courts.length);
  console.log('Instructors:', instructors.length);
  
  if (clubs.length > 0 && courts.length > 0 && instructors.length > 0) {
    // Crear TimeSlots de prueba
    const insertTimeSlotStmt = db.prepare(`
      INSERT INTO TimeSlot (
        id, clubId, courtId, instructorId, start, end, 
        maxPlayers, totalPrice, level, category, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Formatear fechas para SQLite
    const formatDateTime = (date, hour) => {
      const d = new Date(date);
      d.setHours(hour, 0, 0, 0);
      return d.toISOString();
    };
    
    try {
      // TimeSlot 1: Mañana a las 9:00-10:30
      insertTimeSlotStmt.run(
        'slot-test-1', clubs[0].id, courts[0].id, instructors[0].id,
        formatDateTime(tomorrow, 9), formatDateTime(tomorrow, 10.5),
        4, 30.0, 'inicial-medio', 'mixto'
      );
      console.log('✅ TimeSlot 1 creado (9:00-10:30, inicial-medio, mixto)');
    } catch (e) {
      console.log('TimeSlot 1 ya existe');
    }
    
    try {
      // TimeSlot 2: Mañana a las 11:00-12:30
      insertTimeSlotStmt.run(
        'slot-test-2', clubs[0].id, courts[0].id, instructors[0].id,
        formatDateTime(tomorrow, 11), formatDateTime(tomorrow, 12.5),
        4, 35.0, 'avanzado', 'chico'
      );
      console.log('✅ TimeSlot 2 creado (11:00-12:30, avanzado, chico)');
    } catch (e) {
      console.log('TimeSlot 2 ya existe');
    }
    
    try {
      // TimeSlot 3: Mañana a las 16:00-17:30
      insertTimeSlotStmt.run(
        'slot-test-3', clubs[0].id, courts[0].id, instructors[0].id,
        formatDateTime(tomorrow, 16), formatDateTime(tomorrow, 17.5),
        4, 40.0, 'intermedio', 'chica'
      );
      console.log('✅ TimeSlot 3 creado (16:00-17:30, intermedio, chica)');
    } catch (e) {
      console.log('TimeSlot 3 ya existe');
    }
    
    // Verificar TimeSlots creados
    console.log('\nTimeSlots disponibles:');
    const timeSlots = db.prepare('SELECT id, start, end, level, category FROM TimeSlot').all();
    timeSlots.forEach(slot => {
      const start = new Date(slot.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const end = new Date(slot.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      console.log(`- ${slot.id}: ${start}-${end}, nivel: ${slot.level}, categoría: ${slot.category}`);
    });
    
  } else {
    console.log('⚠️ Faltan datos básicos (clubs, courts, instructors) para crear TimeSlots');
  }
  
  db.close();
  console.log('\n✅ TimeSlots de prueba preparados');
} catch (error) {
  console.error('Error:', error.message);
}