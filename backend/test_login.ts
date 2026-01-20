import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'sarah@prestige.com';
  const password = 'password123';
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log(`USER NOT FOUND: ${email}`);
    process.exit(1);
  }
  
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  console.log(`Login test for ${email}: ${isMatch ? 'SUCCESS' : 'FAILURE (Password mismatch)'}`);
  
  await prisma.$disconnect();
}

main();
