
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        shop: { select: { name: true } },
        user: { select: { id: true, name: true } },
        quote: { select: { id: true, totalEstimate: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('--- BOOKINGS DUMP ---');
    console.log(JSON.stringify(bookings, null, 2));
    console.log('--- END DUMP ---');
  } catch (error) {
    console.error('Debug Script Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
