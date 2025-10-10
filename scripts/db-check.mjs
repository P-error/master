import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = await prisma.$queryRaw`SELECT NOW()`;
  console.log('DB time:', now);

  // Потрогать реальные таблицы (подставьте ваши реальные имена)
  const subjects = await prisma.subject.findMany({ take: 5 });
  console.log('Subjects sample:', subjects);

  const users = await prisma.user.findMany({ take: 1 });
  console.log('Users sample:', users);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
