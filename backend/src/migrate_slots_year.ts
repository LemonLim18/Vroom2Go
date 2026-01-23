
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting Slot Year Migration (1970 -> 2000)...');
    
    // Fetch all slots with startTime before Year 2000 (e.g. 1970)
    const slots = await prisma.timeSlot.findMany({
      where: {
        startTime: {
          lt: new Date('1999-12-31T23:59:59.999Z')
        }
      }
    });

    console.log(`Found ${slots.length} legacy slots (1970 base).`);

    if (slots.length === 0) return;

    let updatedCount = 0;

    for (const slot of slots) {
        // Create new dates with Year 2000
        const start = new Date(slot.startTime);
        start.setUTCFullYear(2000); // Shift to 2000
        
        let end = null;
        if (slot.endTime) {
            const e = new Date(slot.endTime);
            e.setUTCFullYear(2000);
            end = e;
        }

        // Update
        // Note: Check for collision? If 2000 slot exists, we might crash on Unique constraint.
        // If collision, we might prefer the 2000 one (new) and delete 1970 one?
        // Or if Booked, we keep Booked one.
        // For now, try update. If fail, log.
        try {
            await prisma.timeSlot.update({
                where: { id: slot.id },
                data: { 
                    startTime: start,
                    endTime: end || undefined
                }
            });
            updatedCount++;
        } catch (e) {
            console.warn(`Failed to migrate slot ${slot.id} (Collision?):`, e);
            // If collision, likely we have a duplicate. Safe to delete the 1970 one if NOT booked.
            if (!slot.isBooked) {
                await prisma.timeSlot.delete({ where: { id: slot.id } });
                console.log(`Deleted colliding unbooked slot ${slot.id}`);
            }
        }
    }

    console.log(`Successfully migrated ${updatedCount} slots.`);
    
  } catch (error) {
    console.error('Migration Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
