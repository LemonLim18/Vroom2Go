import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Starting Messaging System Test...');

  // 1. Setup Users
  console.log('\n1️⃣  Setting up test users...');
  
  const setupUser = async (email: string, name: string, role: 'OWNER' | 'SHOP') => {
      return await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
              email,
              name,
              passwordHash: 'dummy',
              role
          }
      });
  };

  const userA = await setupUser('test_a@example.com', 'Test User A', 'OWNER');
  const userB = await setupUser('test_b@example.com', 'Test User B', 'SHOP');

  console.log(`   ✅ User A: ${userA.id} (${userA.name})`);
  console.log(`   ✅ User B: ${userB.id} (${userB.name})`);

  // 2. Create Conversation
  console.log('\n2️⃣  Creating/Finding Conversation...');
  // Ensure strict order for creating
  const [u1, u2] = [userA.id, userB.id].sort((a, b) => a - b);

  let conversation = await prisma.conversation.findFirst({
      where: {
          user1Id: u1,
          user2Id: u2
      }
  });

  if (!conversation) {
      console.log('   Creating new conversation...');
      conversation = await prisma.conversation.create({
          data: {
              user1: { connect: { id: u1 } },
              user2: { connect: { id: u2 } }
          }
      });
  } else {
      console.log('   Found existing conversation.');
  }
  console.log(`   ✅ Conversation ID: ${conversation.id}`);

  // 3. Send Message
  console.log('\n3️⃣  Sending Message from A to B...');
  const msgText = `Hello from automated test at ${new Date().toISOString()}`;
  
  const message = await prisma.message.create({
      data: {
          conversationId: conversation.id,
          senderId: userA.id,
          message: msgText
      }
  });
  console.log(`   ✅ Message Sent: "${message.message}" (ID: ${message.id})`);

  // 4. Update Conversation Timestamp
  await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() }
  });

  // 5. Verify Listing (Test fetching for User B)
  console.log('\n4️⃣  Verifying functionality: Listing Inbox for User B...');
  
  const inbox = await prisma.conversation.findMany({
      where: {
          OR: [{ user1Id: userB.id }, { user2Id: userB.id }]
      },
      include: {
          messages: {
              take: 1,
              orderBy: { createdAt: 'desc' }
          },
          user1: { select: { name: true } },
          user2: { select: { name: true } }
      }
  });

  const foundConv = inbox.find(c => c.id === conversation!.id);
  
  if (foundConv) {
      console.log(`   ✅ Conversation found in Inbox!`);
      console.log(`   Last Message: "${foundConv.messages[0]?.message}"`);
      console.log(`   Participants: ${foundConv.user1.name} & ${foundConv.user2.name}`);
  } else {
      console.error('   ❌ Conversation NOT found in Inbox!');
  }

  console.log('\n🎉 Test Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
