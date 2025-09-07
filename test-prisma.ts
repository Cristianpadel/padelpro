import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('Available methods:', Object.getOwnPropertyNames(prisma));
console.log('Prisma models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));

prisma.$disconnect();
