
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting Slot Alignment Fix...');
    
    // Fetch all unbooked slots
    const slots = await prisma.timeSlot.findMany({
      where: { isBooked: false }
    });

    console.log(`Found ${slots.length} unbooked slots.`);

    const toDeleteIds: number[] = [];

    for (const slot of slots) {
        // startTime is stored as 1970-01-01 THH:MM:00.000Z
        const d = new Date(slot.startTime);
        // We check UTC Minutes because the Backend Logic stores it as UTC date
        // If minutes are not 0, it's an off-hour slot (e.g. 1:30, 4:30)
        if (d.getUTCMinutes() !== 0) {
            toDeleteIds.push(slot.id);
        }
    }

    if (toDeleteIds.length === 0) {
        console.log('No misaligned slots found.');
        return;
    }

    console.log(`Identified ${toDeleteIds.length} misaligned (non-hourly) slots. Deleting...`);

    const result = await prisma.timeSlot.deleteMany({
        where: { id: { in: toDeleteIds } }
    });

    console.log(`Deleted ${result.count} slots.`);
    
  } catch (error) {
    console.error('Slot Fix Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
