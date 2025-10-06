const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDateFiltering() {
  try {
    // Test different date filtering approaches
    const dateString = '2025-10-03';
    
    console.log('Testing date filtering approaches for:', dateString, '\n');
    
    // Approach 1: Current implementation (local timezone)
    const startOfDay1 = new Date(`${dateString}T00:00:00`);
    const endOfDay1 = new Date(`${dateString}T23:59:59`);
    console.log('Approach 1 (Local timezone):');
    console.log('  Start:', startOfDay1.toISOString());
    console.log('  End:', endOfDay1.toISOString());
    
    const count1 = await prisma.timeSlot.count({
      where: {
        start: { gte: startOfDay1, lte: endOfDay1 }
      }
    });
    console.log('  Results:', count1, '\n');
    
    // Approach 2: Using UTC explicitly
    const startOfDay2 = new Date(`${dateString}T00:00:00Z`);
    const endOfDay2 = new Date(`${dateString}T23:59:59Z`);
    console.log('Approach 2 (UTC):');
    console.log('  Start:', startOfDay2.toISOString());
    console.log('  End:', endOfDay2.toISOString());
    
    const count2 = await prisma.timeSlot.count({
      where: {
        start: { gte: startOfDay2, lte: endOfDay2 }
      }
    });
    console.log('  Results:', count2, '\n');
    
    // Approach 3: SQL LIKE
    const count3 = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM TimeSlot 
      WHERE start LIKE ${dateString + '%'}
    `;
    console.log('Approach 3 (SQL LIKE):');
    console.log('  Results:', count3[0].count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDateFiltering();
