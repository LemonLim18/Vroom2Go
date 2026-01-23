
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting Quote Sync...');
    // Find all bookings that came from a quote
    const bookings = await prisma.booking.findMany({
      where: { quoteId: { not: null } },
      select: { quoteId: true }
    });
    
    const quoteIds = bookings.map(b => b.quoteId).filter(id => id !== null) as number[];
    
    if (quoteIds.length === 0) {
        console.log('No bookings from quotes found.');
        return;
    }

    console.log(`Found ${quoteIds.length} bookings from quotes. Updating statuses...`);

    // Update all linked quotes to ACCEPTED
    const result = await prisma.quote.updateMany({
      where: { 
        id: { in: quoteIds },
        status: { not: 'ACCEPTED' } // Only update if not already accepted
      },
      data: { status: 'ACCEPTED' }
    });

    console.log(`Updated ${result.count} quotes to ACCEPTED.`);
  } catch (error) {
    console.error('Fix Script Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
