
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SIMPLE DB DUMP ---');
  
  const requests = await prisma.quoteRequest.findMany({
      select: { 
          id: true, 
          status: true, 
          user: { select: { id: true, email: true } } 
      }
  });

  console.log(`Found ${requests.length} requests:`);
  requests.forEach(r => console.log(`- ID: ${r.id}, Status: ${r.status}, User: ${r.user.email} (ID: ${r.user.id})`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
