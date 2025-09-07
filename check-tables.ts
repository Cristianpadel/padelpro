import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🔍 Checking what tables exist in the database...');
    
    // Verificar tablas SQLite
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;
    
    console.log('📋 Tables found:', tables);
    
    // Verificar esquema de User table como referencia
    const userSchema = await prisma.$queryRaw`
      PRAGMA table_info(User)
    `;
    
    console.log('👤 User table schema:', userSchema);
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
