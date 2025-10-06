const Database = require('better-sqlite3');

try {
  const db = new Database('prisma/prisma/dev.db');
  
  // Crear usuarios de prueba
  const insertStmt = db.prepare(`
    INSERT INTO User (
      id, email, name, level, genderCategory, role, preference, visibility, 
      credit, createdAt, updatedAt, blockedCredit, loyaltyPoints, 
      blockedLoyaltyPoints, pendingBonusPoints
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?)
  `);
  
  try {
    // Usuario 1: Mujer, nivel inicial-medio
    insertStmt.run(
      'user-1', 'maria@example.com', 'María García', 'inicial-medio', 'chica', 
      'PLAYER', 'NORMAL', 'PUBLIC', 0, 0, 0, 0, 0
    );
    console.log('✅ Usuario María creado');
  } catch (e) {
    console.log('Usuario María ya existe');
  }
  
  try {
    // Usuario 2: Hombre, nivel avanzado
    insertStmt.run(
      'user-2', 'carlos@example.com', 'Carlos López', 'avanzado', 'chico', 
      'PLAYER', 'NORMAL', 'PUBLIC', 0, 0, 0, 0, 0
    );
    console.log('✅ Usuario Carlos creado');
  } catch (e) {
    console.log('Usuario Carlos ya existe');
  }
  
  try {
    // Usuario 3: Admin
    insertStmt.run(
      'admin-1', 'admin@example.com', 'Admin User', 'intermedio', 'chica', 
      'ADMIN', 'NORMAL', 'PUBLIC', 0, 0, 0, 0, 0
    );
    console.log('✅ Usuario Admin creado');
  } catch (e) {
    console.log('Usuario Admin ya existe');
  }
  
  // Verificar usuarios creados
  console.log('\nUsuarios en la base de datos:');
  const users = db.prepare('SELECT email, name, level, genderCategory, role FROM User').all();
  users.forEach(user => {
    console.log(`- ${user.email}: ${user.name}, nivel: ${user.level}, género: ${user.genderCategory}, rol: ${user.role}`);
  });
  
  db.close();
  console.log('\n✅ Base de datos preparada para pruebas');
} catch (error) {
  console.error('Error:', error.message);
}