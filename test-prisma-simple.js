const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  console.log('Testing Prisma client...');
  
  try {
    console.log('Schema info:');
    console.log('- Club fields:');
    
    // Create test club with minimal data
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        address: 'Test Address'
      }
    });
    
    console.log('✅ Club created:', club);
    
    // Clean up
    await prisma.club.delete({ where: { id: club.id } });
    console.log('✅ Club deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());