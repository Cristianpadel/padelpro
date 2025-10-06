// Check if Alex García user ID matches between mock and real DB
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserIds() {
  try {
    // Get Alex from real database
    const alexInDb = await prisma.user.findFirst({
      where: { email: 'alex.garcia@email.com' }
    });

    if (!alexInDb) {
      console.log('❌ Alex García not found in real database');
      return;
    }

    console.log('\n📊 Alex García in real database:');
    console.log('   ID:', alexInDb.id);
    console.log('   Email:', alexInDb.email);
    console.log('   Name:', alexInDb.name);

    // The mock system uses this ID: 'user-1'
    console.log('\n📊 Alex García in mock system:');
    console.log('   ID: user-1');
    console.log('   Email: alex.garcia@email.com');
    
    console.log('\n⚠️  MISMATCH DETECTED!');
    console.log('   Real DB ID:', alexInDb.id);
    console.log('   Mock ID: user-1');
    console.log('\n💡 Solution: The login system needs to use the REAL database user ID');
    console.log('   when making API calls to /api/classes/book');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserIds();
