
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DEBUG DB DUMP ---');
  
  // 1. Check all Users
  const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, name: true }
  });
  console.log('USERS:', JSON.stringify(users, null, 2));

  // 2. Check all QuoteRequests
  const requests = await prisma.quoteRequest.findMany({
      include: { user: { select: { email: true } } }
  });
  console.log('QUOTE REQUESTS:', JSON.stringify(requests, null, 2));

  // 3. Check Shops
  const shops = await prisma.shop.findMany({
      select: { id: true, userId: true, name: true }
  });
  console.log('SHOPS:', JSON.stringify(shops, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
