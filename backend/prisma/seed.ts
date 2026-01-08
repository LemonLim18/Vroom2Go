import { PrismaClient, UserRole, ServiceCategory, CarType, BookingStatus, DayOfWeek } from '@prisma/client';
// Note: If top-level exports fail, Prisma 5 sometimes requires $Enums.
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 starting seeding process...');

  try {
    // 1. Clear existing data in reverse order of dependencies
    console.log('🧹 Clearing existing data...');
    const deleteOrder = [
      prisma.notification.deleteMany(),
      prisma.comment.deleteMany(),
      prisma.postLike.deleteMany(),
      prisma.forumPost.deleteMany(),
      prisma.disputeMessage.deleteMany(),
      prisma.dispute.deleteMany(),
      prisma.message.deleteMany(),
      prisma.conversation.deleteMany(),
      prisma.review.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.invoiceItem.deleteMany(),
      prisma.invoice.deleteMany(),
      prisma.jobUpdate.deleteMany(),
      prisma.booking.deleteMany(),
      prisma.quoteItem.deleteMany(),
      prisma.quote.deleteMany(),
      prisma.vehicle.deleteMany(),
      prisma.shopService.deleteMany(),
      prisma.servicePricing.deleteMany(),
      prisma.shopHour.deleteMany(),
      prisma.shopCertification.deleteMany(),
      prisma.shop.deleteMany(),
      prisma.service.deleteMany(),
      prisma.user.deleteMany()
    ];

    for (const op of deleteOrder) {
      await op;
    }
    console.log('✅ Cleaned existing data');

    // 2. Hash default password
    const passwordHash = await bcrypt.hash('password123', 10);

    // 3. Create Services
    console.log('🛠️ Creating services...');
    const services = [
      {
        name: 'Full Synthetic Oil Change',
        category: ServiceCategory.MAINTENANCE,
        description: 'Includes filter replacement, fluid top-off, and tire pressure check.',
        durationEst: 45,
        warranty: '3 months / 3,000 miles',
        includes: ['Oil filter', 'Up to 5 quarts synthetic oil', 'Tire pressure check', 'Fluid top-off']
      },
      {
        name: 'Brake Pad Replacement (Front)',
        category: ServiceCategory.REPAIR,
        description: 'Replacement of front brake pads and rotor inspection.',
        durationEst: 120,
        warranty: '12 months / 12,000 miles',
        includes: ['Front brake pads', 'Rotor inspection', 'Brake fluid check', 'Road test']
      },
      {
        name: 'Comprehensive Diagnostic',
        category: ServiceCategory.DIAGNOSTIC,
        description: 'Full system scan, engine health check, and suspension analysis.',
        durationEst: 60,
        includes: ['OBD-II scan', 'Engine health report', 'Suspension check', 'Battery test', 'Written report']
      }
    ];

    const createdServices = [];
    for (const s of services) {
      const service = await prisma.service.create({ data: s });
      createdServices.push(service);

      // Create base pricing mapping
      const pricingData = [
        { vehicleType: CarType.COMPACT, min: "50", max: "70" },
        { vehicleType: CarType.SEDAN, min: "60", max: "80" },
        { vehicleType: CarType.SUV, min: "80", max: "100" },
        { vehicleType: CarType.LUXURY, min: "120", max: "150" },
        { vehicleType: CarType.EV, min: "100", max: "130" },
      ];

      for (const p of pricingData) {
        await prisma.servicePricing.create({
          data: {
            serviceId: service.id,
            vehicleType: p.vehicleType,
            minPrice: p.min,
            maxPrice: p.max
          }
        });
      }
    }
    console.log(`✅ Created ${createdServices.length} services with pricing`);

    // 4. Create Users
    console.log('👤 Creating users...');
    const usersData = [
      { name: 'Alex Johnson', email: 'alex@example.com', role: UserRole.OWNER },
      { name: 'Mike Chen', email: 'mike@speedyfix.com', role: UserRole.SHOP },
      { name: 'Sarah Miller', email: 'sarah@prestige.com', role: UserRole.SHOP },
      { name: 'Platform Admin', email: 'admin@vroom2go.com', role: UserRole.ADMIN },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const user = await prisma.user.create({
        data: { ...u, passwordHash }
      });
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    // 5. Create Shops
    console.log('🏪 Creating shops...');
    const shopsData = [
      { userId: createdUsers[1].id, name: 'Speedy Fix Auto', rating: "4.8", reviewCount: 124, verified: true, address: '123 Main St, Springfield', laborRate: "85" },
      { userId: createdUsers[2].id, name: 'Prestige Motors', rating: "4.9", reviewCount: 89, verified: true, address: '450 Highland Ave, Springfield', laborRate: "120" },
    ];

    const createdShops = [];
    for (const s of shopsData) {
      const shop = await prisma.shop.create({ data: s });
      createdShops.push(shop);

      // Shop Services
      for (const service of createdServices) {
        await prisma.shopService.create({
          data: {
            shopId: shop.id,
            serviceId: service.id,
            customPrice: service.name.includes('Oil') ? "59.99" : "189.00"
          }
        });
      }

      // Shop Hours
      const weekdays: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
      for (const day of weekdays) {
        await prisma.shopHour.create({
          data: { shopId: shop.id, day, openTime: new Date(2024, 0, 1, 8, 0, 0), closeTime: new Date(2024, 0, 1, 18, 0, 0) }
        });
      }
    }
    console.log(`✅ Created ${createdShops.length} shops with services and hours`);

    // 6. Create Vehicle for Alex
    console.log('🚗 Creating vehicle...');
    const vehicle = await prisma.vehicle.create({
      data: {
        userId: createdUsers[0].id,
        make: 'Honda',
        model: 'Civic',
        year: 2018,
        type: CarType.SEDAN,
        color: 'Silver',
        mileage: 45000,
        isPrimary: true
      }
    });

    // 7. Create Booking
    console.log('📅 Creating booking...');
    await prisma.booking.create({
      data: {
        userId: createdUsers[0].id,
        shopId: createdShops[0].id,
        vehicleId: vehicle.id,
        serviceId: createdServices[0].id,
        scheduledDate: new Date(2024, 0, 25),
        scheduledTime: new Date(2024, 0, 25, 10, 0, 0),
        status: BookingStatus.CONFIRMED,
        estimatedTotal: "65.00",
        depositAmount: "13.00",
        depositPaid: true
      }
    });

    console.log('🏁 Seeding finished successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
