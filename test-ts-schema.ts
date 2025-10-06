import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing TypeScript Prisma...')
  
  try {
    const club = await prisma.club.create({
      data: {
        name: 'Test Club TS',
        address: 'Test Address TS',
        email: 'test@test.ts'
      }
    })
    
    console.log('✅ Club created:', club)
    
    const court = await prisma.court.create({
      data: {
        name: 'Pista TS 1',
        clubId: club.id
      }
    })
    
    console.log('✅ Court created:', court)
    
    const allClubs = await prisma.club.findMany({
      include: {
        courts: true
      }
    })
    
    console.log('✅ All clubs with courts:')
    allClubs.forEach(club => {
      console.log(`- ${club.name} (${club.courts.length} courts)`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()