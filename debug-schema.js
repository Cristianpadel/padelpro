const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking current Prisma model structure...');
  
  // Intentar ver qué campos están disponibles
  console.log('\n--- Club model fields ---');
  try {
    const club = await prisma.club.findFirst();
    console.log('Club query executed successfully');
    console.log('Sample club:', club);
  } catch (error) {
    console.log('Error with Club model:', error.message);
  }

  console.log('\n--- Court model fields ---');
  try {
    const court = await prisma.court.findFirst();
    console.log('Court query executed successfully');
    console.log('Sample court:', court);
  } catch (error) {
    console.log('Error with Court model:', error.message);
  }

  console.log('\n--- User model fields ---');
  try {
    const user = await prisma.user.findFirst();
    console.log('User query executed successfully');
    console.log('Sample user:', user);
  } catch (error) {
    console.log('Error with User model:', error.message);
  }

  // Test creating a club with basic fields
  console.log('\n--- Testing basic Club creation ---');
  try {
    const testClub = await prisma.club.create({
      data: {
        name: 'Test Club',
        address: 'Test Address',
        phone: '123456789',
        email: 'test@test.com'
      }
    });
    console.log('✅ Club created successfully:', testClub);
    
    // Clean up
    await prisma.club.delete({ where: { id: testClub.id } });
    console.log('✅ Test club deleted');
  } catch (error) {
    console.log('❌ Error creating basic club:', error.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());