var _a;
import { PrismaClient } from '@prisma/client';
const globalForPrisma = global;
export const prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : new PrismaClient();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;