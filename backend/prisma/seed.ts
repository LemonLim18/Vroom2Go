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
      prisma.diagnosticPackage.deleteMany(),
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
        includes: ['Oil filter', 'Up to 5 quarts synthetic oil', 'Tire pressure check', 'Fluid top-off'],
        tierPricing: {
            [CarType.COMPACT]: { min: "50", max: "70" },
            [CarType.SEDAN]: { min: "60", max: "80" },
            [CarType.SUV]: { min: "80", max: "100" },
            [CarType.LUXURY]: { min: "120", max: "150" },
            [CarType.EV]: { min: "60", max: "80" },
        }
      },
      {
        name: 'Brake Pad Replacement (Front)',
        category: ServiceCategory.REPAIR,
        description: 'Replacement of front brake pads and rotor inspection.',
        durationEst: 120,
        warranty: '12 months / 12,000 miles',
        includes: ['Front brake pads', 'Rotor inspection', 'Brake fluid check', 'Road test'],
        tierPricing: {
            [CarType.COMPACT]: { min: "150", max: "200" },
            [CarType.SEDAN]: { min: "180", max: "240" },
            [CarType.SUV]: { min: "220", max: "280" },
            [CarType.LUXURY]: { min: "300", max: "450" },
            [CarType.EV]: { min: "250", max: "350" },
        }
      },
      {
        name: 'Comprehensive Diagnostic',
        category: ServiceCategory.DIAGNOSTIC,
        description: 'Full system scan, engine health check, and suspension analysis.',
        durationEst: 60,
        includes: ['OBD-II scan', 'Engine health report', 'Suspension check', 'Battery test', 'Written report'],
        tierPricing: {
            [CarType.COMPACT]: { min: "99", max: "99" },
            [CarType.SEDAN]: { min: "99", max: "99" },
            [CarType.SUV]: { min: "120", max: "120" },
            [CarType.LUXURY]: { min: "150", max: "150" },
            [CarType.EV]: { min: "150", max: "150" },
        }
      },
      {
        name: 'Tire Rotation & Balance',
        category: ServiceCategory.MAINTENANCE,
        description: 'Rotate all four tires and balance for even wear.',
        durationEst: 30,
        warranty: '30 days',
        includes: ['Tire rotation', 'Wheel balancing', 'Tread depth check'],
        tierPricing: {
            [CarType.COMPACT]: { min: "40", max: "60" },
            [CarType.SEDAN]: { min: "45", max: "65" },
            [CarType.SUV]: { min: "55", max: "75" },
            [CarType.LUXURY]: { min: "70", max: "90" },
            [CarType.EV]: { min: "60", max: "80" },
        }
      },
      {
        name: 'AC System Recharge',
        category: ServiceCategory.REPAIR,
        description: 'Evacuate and recharge AC refrigerant for optimal cooling.',
        durationEst: 90,
        warranty: '6 months',
        includes: ['Refrigerant evacuation', 'Leak test', 'Refrigerant recharge', 'System test'],
        tierPricing: {
            [CarType.COMPACT]: { min: "120", max: "180" },
            [CarType.SEDAN]: { min: "140", max: "200" },
            [CarType.SUV]: { min: "160", max: "220" },
            [CarType.LUXURY]: { min: "200", max: "280" },
            [CarType.EV]: { min: "180", max: "260" },
        }
      }
    ];

    const createdServices = [];
    for (const s of services) {
      const { tierPricing, ...serviceData } = s;
      const service = await prisma.service.create({ data: serviceData });
      createdServices.push(service);

      // Create pricing mapping
      for (const [type, range] of Object.entries(tierPricing)) {
        await prisma.servicePricing.create({
          data: {
            serviceId: service.id,
            vehicleType: type as CarType,
            minPrice: range.min,
            maxPrice: range.max
          }
        });
      }
    }
    console.log(`✅ Created ${createdServices.length} services with specific pricing`);

    // 4. Create Users
    console.log('👤 Creating users...');
    const usersData = [
      { name: 'Alex Johnson', email: 'alex@example.com', role: UserRole.OWNER },
      { name: 'Mike Chen', email: 'mike@speedyfix.com', role: UserRole.SHOP },
      { name: 'Sarah Miller', email: 'sarah@prestige.com', role: UserRole.SHOP },
      { name: 'Platform Admin', email: 'admin@vroom2go.com', role: UserRole.ADMIN },
      { name: 'Default User', email: 'limmiinning@gmail.com', role: UserRole.OWNER },
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
      { userId: createdUsers[1].id, name: 'Speedy Fix Auto', rating: 0, reviewCount: 0, verified: true, address: '123 Main St, Springfield', laborRate: "85" },
      { userId: createdUsers[2].id, name: 'Prestige Motors', rating: 0, reviewCount: 0, verified: true, address: '450 Highland Ave, Springfield', laborRate: "120" },
    ];

    const createdShops = [];
    for (const s of shopsData) {
      const shop = await prisma.shop.create({ data: s });
      createdShops.push(shop);

      // Shop Services
      for (const service of createdServices) {
        let price = "149.00";
        // Assign realistic base prices for the shops
        if (service.name.includes('Oil')) price = "59.99";
        else if (service.name.includes('Brake')) price = "189.00";
        else if (service.name.includes('Tire')) price = "49.99";
        else if (service.name.includes('AC')) price = "149.99";
        else if (service.name.includes('Diagnostic')) price = "89.00";

        await prisma.shopService.create({
          data: {
            shopId: shop.id,
            serviceId: service.id,
            customPrice: price,
            isAvailable: true
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

    // 8. Create Reviews
    console.log('⭐ Creating reviews...');
    await prisma.review.create({
      data: {
        shopId: createdShops[0].id,
        userId: createdUsers[0].id, // Alex
        rating: 5,
        comment: "Excellent service! They finished the oil change faster than expected.",
        createdAt: new Date()
      }
    });
    
    await prisma.review.create({
      data: {
        shopId: createdShops[0].id,
        userId: createdUsers[4].id, // Default User
        rating: 4,
        comment: "Good work but a bit pricey.",
        createdAt: new Date(Date.now() - 86400000 * 5) // 5 days ago
      }
    });
    console.log('✅ Created reviews');
    
    // 9. Create Forum Posts
    console.log('💬 Creating forum posts...');
    const forumPosts = [
        {
            userId: createdUsers[0].id, // Alex
            title: 'Best tires for rainy weather?',
            content: 'I live in an area with heavy raid. Any recommendations for tires that have good grip? Considering Michelin or Bridgestone.',
            tags: ['Tires', 'Advice'],
            category: 'QUESTION' as any,
            viewCount: 45,
            likeCount: 2,
            commentCount: 1,
            images: [],
            video: null,
            isEdited: false
        },
        {
            userId: createdUsers[1].id, // Mike (Shop)
            title: 'Maintenance Tip: Check your oil regularly',
            content: 'Regular oil checks can extend your engine life significantly. We recommend checking every 1,000 miles or before long trips.',
            tags: ['Maintenance', 'OilChange', 'Tips'],
            category: 'TIP' as any,
            viewCount: 120,
            likeCount: 15,
            commentCount: 0,
            images: ["https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80"],
            video: null,
            isEdited: false
        }
    ];

    for (const p of forumPosts) {
        await prisma.forumPost.create({ data: p });
    }
    console.log(`✅ Created ${forumPosts.length} forum posts`);

    // 10. Create Diagnostic Packages
    console.log('🔍 Creating diagnostic packages...');
    const diagnosticPackages = [
      {
        name: 'Basic Check-Up',
        description: 'Quick visual inspection and code scan for common issues.',
        price: "49.00",
        duration: '30 mins',
        includes: ['OBD-II code scan', 'Visual inspection', 'Verbal report']
      },
      {
        name: 'Full Diagnostic',
        description: 'Comprehensive analysis of all major systems.',
        price: "99.00",
        duration: '1 hour',
        includes: ['OBD-II scan', 'Engine analysis', 'Brake inspection', 'Suspension check', 'Written report']
      },
      {
        name: 'Pre-Purchase Inspection',
        description: 'Complete vehicle assessment before buying a used car.',
        price: "149.00",
        duration: '2 hours',
        includes: ['Full diagnostic', 'Road test', 'Undercarriage inspection', 'History review', 'Detailed report with photos']
      },
      {
        name: 'Performance Analysis',
        description: 'For enthusiasts wanting to optimize their vehicle.',
        price: "199.00",
        duration: '2.5 hours',
        includes: ['Dyno test', 'Compression test', 'Fuel system analysis', 'Tune recommendations']
      }
    ];

    for (const pkg of diagnosticPackages) {
      await prisma.diagnosticPackage.create({ data: pkg });
    }
    console.log(`✅ Created ${diagnosticPackages.length} diagnostic packages`);

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
