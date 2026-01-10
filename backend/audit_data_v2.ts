
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Auditing Database for Mike Chen / Speedy Fix Auto...');

  const user = await prisma.user.findFirst({
    where: { email: 'mike@speedyfix.com' },
    include: { shop: true, conversations1: true, conversations2: true }
  });

  if (!user) {
    console.log('❌ User mike@speedyfix.com NOT FOUND');
    return;
  }

  console.log(`✅ User Found: ${user.name} (ID: ${user.id})`);

  if (!user.shop) {
    console.log('❌ User has NO shop profile associated.');
  } else {
    console.log(`✅ User has Shop: ${user.shop.name} (ID: ${user.shop.id}, UserId: ${user.shop.userId})`);
  }

  const shop = await prisma.shop.findFirst({
    where: { name: 'Speedy Fix Auto' }
  });

  if (!shop) {
    console.log('❌ Shop "Speedy Fix Auto" NOT FOUND in Shop table');
  } else {
    console.log(`✅ Shop Found: ${shop.name} (ID: ${shop.id}, UserId: ${shop.userId})`);
  }

  // Check conversations
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { user1Id: user.id },
        { user2Id: user.id }
      ]
    },
    include: { messages: true }
  });

  console.log(`\n💬 Conversations for Mike (Total: ${conversations.length}):`);
  conversations.forEach(c => {
    console.log(`- Conv ID: ${c.id}, Participants: ${c.user1Id} & ${c.user2Id}, Messages: ${c.messages.length}`);
  });

}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
