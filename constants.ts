import { CarType, ServiceCategory, Service, Shop, ForumPost, Booking, UserRole, Vehicle } from './types';

export const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Full Synthetic Oil Change',
    category: ServiceCategory.MAINTENANCE,
    description: 'Includes filter replacement, fluid top-off, and tire pressure check.',
    priceRange: {
      [CarType.COMPACT]: '$50 - $70',
      [CarType.SEDAN]: '$60 - $80',
      [CarType.SUV]: '$80 - $100',
      [CarType.LUXURY]: '$120 - $150',
      [CarType.EV]: 'N/A',
    },
    duration: '45 mins'
  },
  {
    id: 's2',
    name: 'Brake Pad Replacement (Front)',
    category: ServiceCategory.REPAIR,
    description: 'Replacement of front brake pads and rotor inspection.',
    priceRange: {
      [CarType.COMPACT]: '$150 - $200',
      [CarType.SEDAN]: '$180 - $240',
      [CarType.SUV]: '$220 - $280',
      [CarType.LUXURY]: '$300 - $450',
      [CarType.EV]: '$250 - $350',
    },
    duration: '2 hours'
  },
  {
    id: 's3',
    name: 'Comprehensive Diagnostic',
    category: ServiceCategory.DIAGNOSTIC,
    description: 'Full system scan, engine health check, and suspension analysis.',
    priceRange: {
      [CarType.COMPACT]: '$99 Flat',
      [CarType.SEDAN]: '$99 Flat',
      [CarType.SUV]: '$120 Flat',
      [CarType.LUXURY]: '$150 Flat',
      [CarType.EV]: '$150 Flat',
    },
    duration: '1 hour'
  }
];

export const MOCK_SHOPS: Shop[] = [
  {
    id: 'shop1',
    name: 'Speedy Fix Auto',
    rating: 4.8,
    reviewCount: 124,
    distance: '2.4 mi',
    address: '123 Main St, Springfield',
    verified: true,
    services: ['s1', 's2', 's3'],
    image: 'https://picsum.photos/400/300?random=1',
    description: 'Speedy Fix Auto has been serving the Springfield community for over 15 years. We specialize in quick turnarounds for routine maintenance and transparent pricing. Our ASE-certified technicians ensure your vehicle is in safe hands. Waiting area equipped with free Wi-Fi and coffee.',
    customPrices: {
      's1': '$59.99',
      's2': '$189.00',
      's3': '$89.00'
    },
    reviews: [
      {
        id: 'r1',
        author: 'John D.',
        rating: 5,
        date: '2023-10-15',
        comment: 'Fast service and they actually explained what was wrong instead of just charging me. Best oil change price in town!',
        serviceName: 'Full Synthetic Oil Change'
      },
      {
        id: 'r2',
        author: 'Sarah M.',
        rating: 4,
        date: '2023-09-22',
        comment: 'Good work on the brakes, but the waiting room was a bit crowded. Price was exactly as quoted though.',
        serviceName: 'Brake Pad Replacement'
      }
    ]
  },
  {
    id: 'shop2',
    name: 'Prestige Motors',
    rating: 4.9,
    reviewCount: 89,
    distance: '5.1 mi',
    address: '450 Highland Ave, Springfield',
    verified: true,
    services: ['s1', 's2', 's3'],
    image: 'https://picsum.photos/400/300?random=2',
    description: 'Specializing in luxury and import vehicles, Prestige Motors offers dealership-quality service at independent shop prices. We use OEM parts and state-of-the-art diagnostic equipment. Complimentary car wash with every service.',
    customPrices: {
      's1': '$89.99',
      's2': '$249.00',
      's3': '$149.00'
    },
    reviews: [
      {
        id: 'r3',
        author: 'Michael B.',
        rating: 5,
        date: '2023-10-01',
        comment: 'They took great care of my BMW. The diagnostic was thorough and they found an issue the dealer missed.',
        serviceName: 'Comprehensive Diagnostic'
      },
      {
        id: 'r4',
        author: 'Emily R.',
        rating: 5,
        date: '2023-08-14',
        comment: 'Professional staff and pristine shop floor. Worth the extra drive.',
        serviceName: 'Full Synthetic Oil Change'
      }
    ]
  },
  {
    id: 'shop3',
    name: 'Budget Brakes & Tires',
    rating: 4.2,
    reviewCount: 210,
    distance: '1.2 mi',
    address: '88 Lowland Rd, Springfield',
    verified: false,
    services: ['s1', 's2'],
    image: 'https://picsum.photos/400/300?random=3',
    description: 'No frills, just honest mechanics getting the job done. We focus on brakes, tires, and basic maintenance to keep your car running without breaking the bank. Walk-ins welcome.',
    customPrices: {
      's1': '$45.00',
      's2': '$145.00'
    },
    reviews: [
      {
        id: 'r5',
        author: 'Dave L.',
        rating: 4,
        date: '2023-10-20',
        comment: 'Cheapest place around. Took a bit longer than expected, but saved me $50.',
        serviceName: 'Brake Pad Replacement'
      },
      {
        id: 'r6',
        author: 'Jenny P.',
        rating: 3,
        date: '2023-09-05',
        comment: 'Okay service. They forgot to reset my maintenance light, but fixed it when I went back.',
        serviceName: 'Full Synthetic Oil Change'
      }
    ]
  }
];

export const MOCK_POSTS: ForumPost[] = [
  {
    id: 'p1',
    author: 'CivicLover99',
    authorRole: UserRole.OWNER,
    title: 'Strange knocking sound when turning left?',
    content: 'I have a 2018 Honda Civic. Whenever I make a sharp left turn, I hear a rhythmic knocking sound from the front right wheel. CV joint?',
    likes: 12,
    comments: [
      {
        id: 'c1',
        author: 'MechanicMike',
        role: UserRole.OWNER,
        content: 'Definitely sounds like a CV axle. Check the boot for grease leaks.',
        date: '2 hours ago'
      },
      {
        id: 'c2',
        author: 'Speedy Fix Auto',
        role: UserRole.SHOP,
        shopId: 'shop1',
        content: 'Hi! We specialize in suspension work. If you bring it in, we can do a free visual inspection to confirm if it is the CV joint or a strut mount. We have openings today.',
        date: '1 hour ago'
      }
    ],
    tags: ['Honda', 'Suspension', 'Noise'],
    image: 'https://picsum.photos/600/400?random=10'
  },
  {
    id: 'p2',
    author: 'TeslaFan',
    authorRole: UserRole.OWNER,
    title: 'Range dropped significantly after update',
    content: 'Has anyone else noticed a 10% drop in range after the latest software update? Is this a known issue?',
    likes: 45,
    comments: [],
    tags: ['EV', 'Battery', 'Software']
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    serviceName: 'Full Synthetic Oil Change',
    shopName: 'Speedy Fix Auto',
    date: '2023-10-25 10:00 AM',
    status: 'Confirmed',
    price: '$65.00'
  },
  {
    id: 'b2',
    serviceName: 'Brake Inspection',
    shopName: 'Prestige Motors',
    date: '2023-10-10 02:00 PM',
    status: 'Completed',
    price: '$45.00'
  }
];

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    make: 'Honda',
    model: 'Civic',
    year: 2018,
    type: CarType.SEDAN,
    vin: '1HGFC2...0092',
    image: 'https://picsum.photos/300/200?random=20',
    licensePlate: 'ABC-1234'
  },
  {
    id: 'v2',
    make: 'Toyota',
    model: 'Rav4',
    year: 2021,
    type: CarType.SUV,
    vin: '2T3XF...9921',
    image: 'https://picsum.photos/300/200?random=21',
    licensePlate: 'XYZ-9876'
  }
];