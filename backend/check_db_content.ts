import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const services = await prisma.service.findMany({
      include: { pricing: true }
    });
    console.log(`Found ${services.length} services:`);
    services.forEach(s => {
      console.log(`- ${s.name} (Category: ${s.category}, Pricing Count: ${s.pricing.length})`);
    });
    
    if (services.length === 0) {
      console.log("⚠️ No services found in DB!");
    }

    const shops = await prisma.shop.findMany({ include: { services: true } });
    console.log(`Found ${shops.length} shops.`);
    shops.forEach(s => {
        console.log(`- ${s.name} has ${s.services.length} services linked.`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
