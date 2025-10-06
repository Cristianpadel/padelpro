const Database = require('better-sqlite3');

try {
  const db = new Database('prisma/prisma/dev.db');
  
  console.log('Booking table structure:');
  const schema = db.prepare('PRAGMA table_info(Booking)').all();
  schema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} (nullable: ${col.notnull === 0})`);
  });
  
  // Si el campo groupSize no existe, lo agregamos
  const hasGroupSize = schema.some(col => col.name === 'groupSize');
  
  if (!hasGroupSize) {
    console.log('\nAgregando campo groupSize...');
    db.exec('ALTER TABLE Booking ADD COLUMN groupSize INTEGER DEFAULT 1');
    console.log('✅ Campo groupSize agregado');
  } else {
    console.log('\n✅ Campo groupSize ya existe');
  }
  
  // Actualizar bookings existentes para que tengan groupSize
  db.exec('UPDATE Booking SET groupSize = 1 WHERE groupSize IS NULL');
  
  console.log('\nBookings actualizadas:');
  const bookings = db.prepare('SELECT * FROM Booking').all();
  bookings.forEach(booking => {
    console.log(`- ${booking.id}: userId=${booking.userId}, timeSlotId=${booking.timeSlotId}, groupSize=${booking.groupSize}`);
  });
  
  db.close();
  console.log('\n✅ Tabla Booking actualizada');
} catch (error) {
  console.error('Error:', error.message);
}