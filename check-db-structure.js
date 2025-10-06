// Verificar estructura real de la BD
const Database = require('better-sqlite3');
const db = new Database('prisma/prisma/dev.db');

console.log('🔍 Verificando estructura de la BD...');

// Verificar tabla TimeSlot
console.log('\n📋 Estructura de TimeSlot:');
const timeSlotInfo = db.prepare("PRAGMA table_info(TimeSlot)").all();
timeSlotInfo.forEach(col => {
  console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
});

// Verificar tabla Booking
console.log('\n📋 Estructura de Booking:');
const bookingInfo = db.prepare("PRAGMA table_info(Booking)").all();
bookingInfo.forEach(col => {
  console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
});

// Verificar algunos datos
console.log('\n📊 Datos de TimeSlot (sample):');
const timeSlots = db.prepare("SELECT * FROM TimeSlot LIMIT 3").all();
timeSlots.forEach(slot => {
  console.log('  Slot:', Object.keys(slot));
});

db.close();