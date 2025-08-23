// Simple JS seed to avoid extra tool deps
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const club = await prisma.club.upsert({
    where: { id: 'seed-club-1' },
    update: {},
    create: { id: 'seed-club-1', name: 'Club Central' },
  })

  const courts = await Promise.all(
    [1, 2, 3, 4].map((number) =>
      prisma.court.upsert({
        where: { clubId_number: { clubId: club.id, number } },
        update: {},
        create: { clubId: club.id, number },
      })
    )
  )

  const [ana, bruno, carla, diego] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ana@example.com' },
      update: {},
      create: { email: 'ana@example.com', name: 'Ana' },
    }),
    prisma.user.upsert({
      where: { email: 'bruno@example.com' },
      update: {},
      create: { email: 'bruno@example.com', name: 'Bruno' },
    }),
    prisma.user.upsert({
      where: { email: 'carla@example.com' },
      update: {},
      create: { email: 'carla@example.com', name: 'Carla' },
    }),
    prisma.user.upsert({
      where: { email: 'diego@example.com' },
      update: {},
      create: { email: 'diego@example.com', name: 'Diego' },
    }),
  ])

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0, 0)
  const end = new Date(start.getTime() + 90 * 60 * 1000)

  // Placeholder fixed slot (public)
  await prisma.match.create({
    data: {
      clubId: club.id,
      type: 'PLACEHOLDER',
      privacy: 'PUBLIC',
      start,
      end,
    },
  })

  // Private fixed match for tomorrow on court 1
  await prisma.match.create({
    data: {
      clubId: club.id,
      courtId: courts[0].id,
      organizerId: ana.id,
      type: 'FIXED',
      privacy: 'PRIVATE',
      start: new Date(start.getTime() + 24 * 60 * 60 * 1000),
      end: new Date(end.getTime() + 24 * 60 * 60 * 1000),
      players: {
        create: [
          { userId: ana.id, isOrganizer: true },
          { userId: bruno.id },
          { userId: carla.id },
          { userId: diego.id },
        ],
      },
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
