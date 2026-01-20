import { PrismaClient, ServiceCategory, CarType } from '@prisma/client';

const prisma = new PrismaClient();

const MOCK_SERVICES = [
  {
    name: 'Full Synthetic Oil Change',
    category: ServiceCategory.MAINTENANCE,
    description: 'Includes filter replacement, fluid top-off, and tire pressure check.',
    tierPricing: {
      [CarType.COMPACT]: { min: 50, max: 70 },
      [CarType.SEDAN]: { min: 60, max: 80 },
      [CarType.SUV]: { min: 80, max: 100 },
      [CarType.LUXURY]: { min: 120, max: 150 },
      [CarType.EV]: { min: 0, max: 0 },
    },
    duration: '45 mins',
    warranty: '3 months / 3,000 miles',
    includes: ['Oil filter', 'Up to 5 quarts synthetic oil', 'Tire pressure check', 'Fluid top-off']
  },
  {
    name: 'Brake Pad Replacement (Front)',
    category: ServiceCategory.REPAIR,
    description: 'Replacement of front brake pads and rotor inspection.',
    tierPricing: {
      [CarType.COMPACT]: { min: 150, max: 200 },
      [CarType.SEDAN]: { min: 180, max: 240 },
      [CarType.SUV]: { min: 220, max: 280 },
      [CarType.LUXURY]: { min: 300, max: 450 },
      [CarType.EV]: { min: 250, max: 350 },
    },
    duration: '120 mins',
    warranty: '12 months / 12,000 miles',
    includes: ['Front brake pads', 'Rotor inspection', 'Brake fluid check', 'Road test']
  },
  {
    name: 'Comprehensive Diagnostic',
    category: ServiceCategory.DIAGNOSTIC,
    description: 'Full system scan, engine health check, and suspension analysis.',
    tierPricing: {
      [CarType.COMPACT]: { min: 99, max: 99 },
      [CarType.SEDAN]: { min: 99, max: 99 },
      [CarType.SUV]: { min: 120, max: 120 },
      [CarType.LUXURY]: { min: 150, max: 150 },
      [CarType.EV]: { min: 150, max: 150 },
    },
    duration: '60 mins',
    includes: ['OBD-II scan', 'Engine health report', 'Suspension check', 'Battery test', 'Written report']
  },
  {
    name: 'Tire Rotation & Balance',
    category: ServiceCategory.MAINTENANCE,
    description: 'Rotate all four tires and balance for even wear.',
    tierPricing: {
      [CarType.COMPACT]: { min: 40, max: 60 },
      [CarType.SEDAN]: { min: 45, max: 65 },
      [CarType.SUV]: { min: 55, max: 75 },
      [CarType.LUXURY]: { min: 70, max: 90 },
      [CarType.EV]: { min: 60, max: 80 },
    },
    duration: '30 mins',
    warranty: '30 days',
    includes: ['Tire rotation', 'Wheel balancing', 'Tread depth check']
  },
  {
    name: 'AC System Recharge',
    category: ServiceCategory.REPAIR,
    description: 'Evacuate and recharge AC refrigerant for optimal cooling.',
    tierPricing: {
      [CarType.COMPACT]: { min: 120, max: 180 },
      [CarType.SEDAN]: { min: 140, max: 200 },
      [CarType.SUV]: { min: 160, max: 220 },
      [CarType.LUXURY]: { min: 200, max: 280 },
      [CarType.EV]: { min: 180, max: 260 },
    },
    duration: '90 mins',
    warranty: '6 months',
    includes: ['Refrigerant evacuation', 'Leak test', 'Refrigerant recharge', 'System test']
  }
];

async function main() {
  console.log('Starting service population...');

  // 1. Create/Update Services
  const createdServices = [];
  for (const s of MOCK_SERVICES) {
      // Check if service already exists by name
      const existing = await prisma.service.findFirst({
        where: { name: s.name }
      });

      let service;
      if (existing) {
        console.log(`Service already exists: ${s.name}`);
        service = existing;
      } else {
        console.log(`Creating service: ${s.name}`);
        service = await prisma.service.create({
          data: {
            name: s.name,
            description: s.description,
            category: s.category,
            durationEst: parseInt(s.duration) || 60,
            warranty: s.warranty,
            includes: s.includes,
            isActive: true
          }
        });
      }
      createdServices.push(service);

      // 2. Create/Update Pricing
      for (const [type, price] of Object.entries(s.tierPricing)) {
          const vehicleType = type as CarType;
          
          await prisma.servicePricing.upsert({
            where: {
                serviceId_vehicleType: {
                    serviceId: service.id,
                    vehicleType: vehicleType
                }
            },
            update: {
                minPrice: price.min,
                maxPrice: price.max
            },
            create: {
                serviceId: service.id,
                vehicleType: vehicleType,
                minPrice: price.min,
                maxPrice: price.max
            }
          });
      }
  }

  // 3. Link Services to All Existing Shops
  const shops = await prisma.shop.findMany();
  console.log(`Linking services to ${shops.length} shops...`);
  
  for (const shop of shops) {
      for (const service of createdServices) {
          const exists = await prisma.shopService.findUnique({
              where: {
                  shopId_serviceId: {
                      shopId: shop.id,
                      serviceId: service.id
                  }
              }
          });

          if (!exists) {
              await prisma.shopService.create({
                  data: {
                      shopId: shop.id,
                      serviceId: service.id,
                      isAvailable: true,
                      // Randomize custom price slightly or leave null to use base
                      customPrice: null 
                  }
              });
          }
      }
  }

  console.log('Service population completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
