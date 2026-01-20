import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- USERS IN DB ---');
  users.forEach(u => console.log(`USER: ${u.email} (Role: ${u.role}, ID: ${u.id})`));
  
  const shops = await prisma.shop.findMany();
  console.log('--- SHOPS IN DB ---');
  shops.forEach(s => console.log(`SHOP: ${s.name} (Owner ID: ${s.userId}, ID: ${s.id})`));
  
  await prisma.$disconnect();
}

main();
