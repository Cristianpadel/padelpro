// check-db-simple.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...');
    
    const clubs = await prisma.club.count();
    const courts = await prisma.court.count();
    const instructors = await prisma.instructor.count();
    const users = await prisma.user.count();
    const timeSlots = await prisma.timeSlot.count();
    const bookings = await prisma.booking.count();
    
    console.log('📊 Database Summary:');
    console.log(`  Clubs: ${clubs}`);
    console.log(`  Courts: ${courts}`);
    console.log(`  Instructors: ${instructors}`);
    console.log(`  Users: ${users}`);
    console.log(`  TimeSlots: ${timeSlots}`);
    console.log(`  Bookings: ${bookings}`);
    
    if (clubs === 0) {
      console.log('\n🏗️ Creating basic data...');
      
      // Create club
      const club = await prisma.club.create({
        data: {
          id: 'club-1',
          name: 'Padel Club Central',
          address: 'Calle Principal 123',
          phone: '+34 123 456 789',
          email: 'info@padelcentral.com',
          pricePerHour: 35.0
        }
      });
      console.log('✅ Club created:', club.name);
      
      // Create court
      const court = await prisma.court.create({
        data: {
          id: 'court-1',
          clubId: 'club-1',
          name: 'Pista 1',
          number: 1
        }
      });
      console.log('✅ Court created:', court.name);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          id: 'cmfwmut4v0001tgs0en3il18d',
          email: 'alex@test.com',
          name: 'Alex García',
          clubId: 'club-1',
          level: 'intermedio'
        }
      });
      console.log('✅ User created:', user.name);
      
      // Create instructor
      const instructor = await prisma.instructor.create({
        data: {
          id: 'instructor-1',
          userId: user.id,
          clubId: 'club-1',
          hourlyRate: 25.0
        }
      });
      console.log('✅ Instructor created for user:', user.name);
      
      console.log('\n✅ Basic data created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();