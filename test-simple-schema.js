const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  console.log('Testing simple Prisma...');
  
  try {
    // Create test club with minimal data
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        address: 'Test Address',
        email: 'test@test.com'
      }
    });
    
    console.log('✅ Club created:', club);
    
    // Create a court
    const court = await prisma.court.create({
      data: {
        name: 'Pista 1',
        clubId: club.id
      }
    });
    
    console.log('✅ Court created:', court);
    
    // Query everything
    const allClubs = await prisma.club.findMany({
      include: {
        courts: true
      }
    });
    
    console.log('✅ All clubs:', JSON.stringify(allClubs, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());