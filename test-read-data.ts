import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando datos con Prisma...')
  
  try {
    // Intentar leer datos existentes
    const clubs = await prisma.club.findMany({
      include: {
        Court: true
      }
    })
    
    console.log(`✅ Encontrados ${clubs.length} clubs:`)
    clubs.forEach(club => {
      console.log(`  - ${club.name}: ${club.Court.length} pistas`)
      console.log(`    📍 ${club.address}`)
      if (club.email) console.log(`    📧 ${club.email}`)
    })
    
    console.log('\n🎉 ¡Prisma puede leer los datos correctamente!')
    
  } catch (error) {
    console.error('❌ Error leyendo datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()