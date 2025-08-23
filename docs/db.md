Database setup (Prisma + SQLite)

Quick start

- Install deps: already in package.json (@prisma/client, prisma)
- Schema: prisma/schema.prisma
- Local DB: .env DATABASE_URL="file:./dev.db"
- Generate client: npm run prisma:generate
- Apply schema: npm run prisma:migrate

Using the client

- Import prisma from src/lib/db/client.ts
- Example:
  const club = await prisma.club.create({ data: { name: 'Mi Club' } })
