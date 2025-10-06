// Verificar estructura de User
const Database = require('better-sqlite3');
const db = new Database('prisma/prisma/dev.db');

console.log('📋 Estructura de User:');
const userInfo = db.prepare("PRAGMA table_info(User)").all();
userInfo.forEach(col => {
  console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
});

// Ver un usuario existente para saber qué campos usar
console.log('\n📊 Usuario existente (sample):');
const sampleUser = db.prepare("SELECT * FROM User LIMIT 1").get();
console.log('Campos:', Object.keys(sampleUser || {}));

db.close();