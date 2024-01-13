const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const allSessions = await prisma.session.deleteMany();
  console.log(allSessions);
}

main()