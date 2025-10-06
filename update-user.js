const Database = require('better-sqlite3');

try {
  const db = new Database('prisma/prisma/dev.db');
  
  // Actualizar usuario admin con datos de género y nivel
  const stmt = db.prepare(`
    UPDATE User 
    SET genderCategory = ?, level = ? 
    WHERE email = ?
  `);
  
  const result = stmt.run('chica', 'inicial-medio', 'admin@example.com');
  console.log('Usuario admin actualizado:', result.changes, 'filas modificadas');
  
  // Crear un segundo usuario con datos diferentes
  const insertStmt = db.prepare(`
    INSERT INTO User (id, email, name, level, genderCategory, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  try {
    const result2 = insertStmt.run('test-user-1', 'maria@example.com', 'María', 'avanzado', 'chica', 'user');
    console.log('Usuario María creado:', result2.changes, 'filas insertadas');
  } catch (e) {
    console.log('Usuario María ya existe o error:', e.message);
  }
  
  // Verificar usuarios
  const users = db.prepare('SELECT email, name, level, genderCategory FROM User').all();
  console.log('Usuarios en la base de datos:');
  users.forEach(user => {
    console.log(`- ${user.email}: ${user.name}, nivel: ${user.level}, género: ${user.genderCategory}`);
  });
  
  db.close();
  console.log('Base de datos actualizada correctamente');
} catch (error) {
  console.error('Error:', error.message);
}