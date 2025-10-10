// prisma/seed.js
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: 'prisma/.env' })

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('demo12345', 10)

  // создаём пользователя только с обязательными полями
  const user = await prisma.user.upsert({
    where: { login: 'demo' }, // поле login должно быть уникальным в схеме
    update: {},
    create: {
      login: 'demo',
      password: passwordHash,
      // если хочешь — можно заполнить что-то из опциональных:
      // age: 22,
      // learningGoal: 'Improve exam score',
    },
  })

  // создаём предметы с минимальным набором полей
  // если в твоей схеме Subject требует ещё что-то обязательное (например, difficulty),
  // добавь это поле ниже (например, difficulty: 'MEDIUM' или 2 — в зависимости от типа).
  await prisma.subject.createMany({
    data: [
      { name: 'Math', userId: user.id },
      { name: 'Physics', userId: user.id },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seed completed for user:', user.login)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
