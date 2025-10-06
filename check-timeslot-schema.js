const Database = require('better-sqlite3');

try {
  const db = new Database('prisma/prisma/dev.db');
  
  console.log('TimeSlot table structure:');
  const schema = db.prepare('PRAGMA table_info(TimeSlot)').all();
  schema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} (nullable: ${col.notnull === 0})`);
  });
  
  console.log('\nSample TimeSlot data:');
  const slots = db.prepare('SELECT * FROM TimeSlot LIMIT 2').all();
  slots.forEach(slot => {
    console.log('Slot:', JSON.stringify(slot, null, 2));
  });
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}