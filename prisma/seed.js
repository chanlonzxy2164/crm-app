const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.create({
    data: { name: '株式会社テスト' }
  });

  const passwordHash = await bcrypt.hash('test1234', 10);
  
  await prisma.user.create({
    data: {
      name: 'テスト管理者',
      email: 'admin@test.com',
      password: passwordHash,
      role: 'ADMIN',
      companyId: company.id
    }
  });

  console.log('Seed data setup complete. Log in with admin@test.com / test1234');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
