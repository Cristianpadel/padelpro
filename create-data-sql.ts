import Database from 'better-sqlite3';
import path from 'path';

// Crear conexión a la base de datos SQLite
const dbPath = path.join(process.cwd(), 'prisma', 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('🗄️ Creando datos con SQL directo...');

try {
  // Crear tablas si no existen
  db.exec(`
    CREATE TABLE IF NOT EXISTS Club (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT
    );
    
    CREATE TABLE IF NOT EXISTS Court (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      clubId TEXT NOT NULL,
      FOREIGN KEY (clubId) REFERENCES Club(id)
    );
  `);

  // Limpiar datos existentes
  db.exec('DELETE FROM Court; DELETE FROM Club;');

  // Insertar clubs
  const insertClub = db.prepare('INSERT INTO Club (id, name, address, email) VALUES (?, ?, ?, ?)');
  
  const clubs = [
    ['club-1', 'Padel Estrella', 'Calle del Deporte 123, Madrid', 'info@padelestrella.com'],
    ['club-2', 'Padel Club Mallorca', 'Avenida Marina 45, Palma', 'contacto@padelclubmallorca.es'],
    ['club-3', 'Club de Prueba', 'Calle Test 1, Barcelona', 'test@clubprueba.com']
  ];

  for (const club of clubs) {
    insertClub.run(...club);
  }

  console.log('✅ Clubs insertados:', clubs.length);

  // Insertar courts
  const insertCourt = db.prepare('INSERT INTO Court (id, name, clubId) VALUES (?, ?, ?)');
  
  const courts = [
    // Padel Estrella
    ['court-1-1', 'Pista 1', 'club-1'],
    ['court-1-2', 'Pista 2', 'club-1'],
    ['court-1-3', 'Pista 3', 'club-1'],
    ['court-1-4', 'Pista 4', 'club-1'],
    // Padel Club Mallorca  
    ['court-2-1', 'Pista 1', 'club-2'],
    ['court-2-2', 'Pista 2', 'club-2'],
    ['court-2-3', 'Pista 3', 'club-2'],
    ['court-2-4', 'Pista 4', 'club-2'],
    ['court-2-5', 'Pista 5', 'club-2'],
    ['court-2-6', 'Pista 6', 'club-2'],
    // Club de Prueba
    ['court-3-1', 'Pista Test 1', 'club-3'],
    ['court-3-2', 'Pista Test 2', 'club-3']
  ];

  for (const court of courts) {
    insertCourt.run(...court);
  }

  console.log('✅ Courts insertadas:', courts.length);

  // Verificar datos
  const allClubs = db.prepare('SELECT * FROM Club').all();
  const allCourts = db.prepare('SELECT * FROM Court').all();
  
  console.log('\n📊 Resumen de datos:');
  console.log(`- Clubs: ${allClubs.length}`);
  console.log(`- Courts: ${allCourts.length}`);
  
  console.log('\n🏢 Clubs creados:');
  allClubs.forEach(club => {
    const clubCourts = db.prepare('SELECT COUNT(*) as count FROM Court WHERE clubId = ?').get(club.id);
    console.log(`  - ${club.name} (${clubCourts.count} pistas)`);
  });

  console.log('\n🎉 ¡Datos creados exitosamente con SQL directo!');

} catch (error) {
  console.error('❌ Error:', error);
} finally {
  db.close();
}