import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing with manual ID...')
  
  try {
    // Intentar con ID manual como está pidiendo
    const club = await prisma.club.create({
      data: {
        id: 'club-test-manual-001',
        name: 'Test Club Manual ID',
        address: 'Test Address Manual',
        email: 'manual@test.com'
      }
    })
    
    console.log('✅ Club created with manual ID:', club)
    
    const court = await prisma.court.create({
      data: {
        id: 'court-test-001',
        name: 'Pista Manual 1',
        clubId: club.id
      }
    })
    
    console.log('✅ Court created:', court)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()