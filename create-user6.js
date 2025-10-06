// Crear usuario user-6 para pruebas
const Database = require('better-sqlite3');
const db = new Database('prisma/prisma/dev.db');

try {
  console.log('🔧 Creando usuario user-6...');
  
  // Verificar si ya existe
  const existing = db.prepare("SELECT id FROM User WHERE id = 'user-6'").get();
  if (existing) {
    console.log('✅ Usuario user-6 ya existe');
  } else {
    // Crear usuario con estructura correcta
    db.prepare(`
      INSERT INTO User (id, email, name, level, role, preference, visibility, credits, createdAt, updatedAt)
      VALUES ('user-6', 'user6@test.com', 'Usuario 6', 'abierto', 'player', 'clases', 'public', 0, datetime('now'), datetime('now'))
    `).run();
    
    console.log('✅ Usuario user-6 creado exitosamente');
  }
  
} catch (error) {
  console.error('❌ Error:', error);
} finally {
  db.close();
}