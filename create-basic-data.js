const Database = require('better-sqlite3');

try {
  const db = new Database('prisma/prisma/dev.db');
  
  // Ver la estructura real de la tabla Court
  console.log('Estructura de la tabla Court:');
  const courtSchema = db.prepare("PRAGMA table_info(Court)").all();
  courtSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} (nullable: ${col.notnull === 0})`);
  });
  
  // Crear club directamente con SQLite
  console.log('\nCreando datos básicos con SQLite...');
  
  try {
    db.exec(`
      INSERT OR IGNORE INTO Club (id, name, address, phone, email, createdAt, updatedAt)
      VALUES ('club-1', 'Padel Estrella', 'Calle Principal 123', '+34 123 456 789', 'info@padelestrella.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    console.log('✅ Club creado');
  } catch (e) {
    console.log('Club ya existe:', e.message);
  }
  
  // Crear courts con los campos que existen realmente
  try {
    db.exec(`
      INSERT OR IGNORE INTO Court (id, clubId, number, createdAt, updatedAt)
      VALUES 
        ('court-1', 'club-1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('court-2', 'club-1', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('court-3', 'club-1', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    console.log('✅ Courts creadas');
  } catch (e) {
    console.log('Error creando courts:', e.message);
  }
  
  // Crear instructor
  try {
    db.exec(`
      INSERT OR IGNORE INTO Instructor (id, userId, name, specialties, experience, hourlyRate, clubId, isActive, createdAt, updatedAt)
      VALUES ('instructor-1', 'admin-1', 'Carlos Santana', 'Técnica, Táctica', '5 años', 45.0, 'club-1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    console.log('✅ Instructor creado');
  } catch (e) {
    console.log('Error creando instructor:', e.message);
  }
  
  // Verificar datos creados
  console.log('\nVerificando datos creados:');
  const clubs = db.prepare('SELECT id, name FROM Club').all();
  const courts = db.prepare('SELECT id, number FROM Court').all();
  const instructors = db.prepare('SELECT id, name FROM Instructor').all();
  
  console.log(`Clubs: ${clubs.length}`);
  clubs.forEach(club => console.log(`- ${club.id}: ${club.name}`));
  
  console.log(`Courts: ${courts.length}`);
  courts.forEach(court => console.log(`- ${court.id}: Pista ${court.number}`));
  
  console.log(`Instructors: ${instructors.length}`);
  instructors.forEach(instructor => console.log(`- ${instructor.id}: ${instructor.name}`));
  
  db.close();
  console.log('\n✅ Datos básicos creados correctamente');
} catch (error) {
  console.error('Error:', error.message);
}