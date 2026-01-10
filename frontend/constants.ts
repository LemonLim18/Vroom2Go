import { 
  CarType, 
  ServiceCategory, 
  Service, 
  Shop, 
  ForumPost, 
  Booking, 
  UserRole, 
  Vehicle,
  User,
  Quote,
  QuoteStatus,
  Invoice,
  DiagnosticPackage,
  QuoteRequest,
  JobStatus,
  EscrowStatus,
  LineItem
} from './types';

// ==================== SERVICES ====================
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
    tierPricing: {
      [CarType.COMPACT]: { min: 50, max: 70 },
      [CarType.SEDAN]: { min: 60, max: 80 },
      [CarType.SUV]: { min: 80, max: 100 },
      [CarType.LUXURY]: { min: 120, max: 150 },
      [CarType.EV]: { min: 0, max: 0 },
    },
    duration: '45 mins',
    warranty: '3 months / 3,000 miles',
    includes: ['Oil filter', 'Up to 5 quarts synthetic oil', 'Tire pressure check', 'Fluid top-off'],
    excludes: ['Specialty oils', 'Additional quarts over 5']
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
    tierPricing: {
      [CarType.COMPACT]: { min: 150, max: 200 },
      [CarType.SEDAN]: { min: 180, max: 240 },
      [CarType.SUV]: { min: 220, max: 280 },
      [CarType.LUXURY]: { min: 300, max: 450 },
      [CarType.EV]: { min: 250, max: 350 },
    },
    duration: '2 hours',
    warranty: '12 months / 12,000 miles',
    includes: ['Front brake pads', 'Rotor inspection', 'Brake fluid check', 'Road test'],
    excludes: ['Rotor replacement', 'Rear brakes', 'Brake fluid flush']
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
    tierPricing: {
      [CarType.COMPACT]: { min: 99, max: 99 },
      [CarType.SEDAN]: { min: 99, max: 99 },
      [CarType.SUV]: { min: 120, max: 120 },
      [CarType.LUXURY]: { min: 150, max: 150 },
      [CarType.EV]: { min: 150, max: 150 },
    },
    duration: '1 hour',
    includes: ['OBD-II scan', 'Engine health report', 'Suspension check', 'Battery test', 'Written report'],
    excludes: ['Repairs', 'Part costs']
  },
  {
    id: 's4',
    name: 'Tire Rotation & Balance',
    category: ServiceCategory.MAINTENANCE,
    description: 'Rotate all four tires and balance for even wear.',
    priceRange: {
      [CarType.COMPACT]: '$40 - $60',
      [CarType.SEDAN]: '$45 - $65',
      [CarType.SUV]: '$55 - $75',
      [CarType.LUXURY]: '$70 - $90',
      [CarType.EV]: '$60 - $80',
    },
    tierPricing: {
      [CarType.COMPACT]: { min: 40, max: 60 },
      [CarType.SEDAN]: { min: 45, max: 65 },
      [CarType.SUV]: { min: 55, max: 75 },
      [CarType.LUXURY]: { min: 70, max: 90 },
      [CarType.EV]: { min: 60, max: 80 },
    },
    duration: '30 mins',
    warranty: '30 days',
    includes: ['Tire rotation', 'Wheel balancing', 'Tread depth check'],
    excludes: ['Tire replacement', 'Alignment']
  },
  {
    id: 's5',
    name: 'AC System Recharge',
    category: ServiceCategory.REPAIR,
    description: 'Evacuate and recharge AC refrigerant for optimal cooling.',
    priceRange: {
      [CarType.COMPACT]: '$120 - $180',
      [CarType.SEDAN]: '$140 - $200',
      [CarType.SUV]: '$160 - $220',
      [CarType.LUXURY]: '$200 - $280',
      [CarType.EV]: '$180 - $260',
    },
    tierPricing: {
      [CarType.COMPACT]: { min: 120, max: 180 },
      [CarType.SEDAN]: { min: 140, max: 200 },
      [CarType.SUV]: { min: 160, max: 220 },
      [CarType.LUXURY]: { min: 200, max: 280 },
      [CarType.EV]: { min: 180, max: 260 },
    },
    duration: '1.5 hours',
    warranty: '6 months',
    includes: ['Refrigerant evacuation', 'Leak test', 'Refrigerant recharge', 'System test'],
    excludes: ['Compressor repair', 'Evaporator replacement']
  }
];

// ==================== DIAGNOSTIC PACKAGES ====================
export const MOCK_DIAGNOSTIC_PACKAGES: DiagnosticPackage[] = [
  {
    id: 'diag1',
    name: 'Basic Check-Up',
    description: 'Quick visual inspection and code scan for common issues.',
    price: 49,
    duration: '30 mins',
    includes: ['OBD-II code scan', 'Visual inspection', 'Verbal report']
  },
  {
    id: 'diag2',
    name: 'Full Diagnostic',
    description: 'Comprehensive analysis of all major systems.',
    price: 99,
    duration: '1 hour',
    includes: ['OBD-II scan', 'Engine analysis', 'Brake inspection', 'Suspension check', 'Written report']
  },
  {
    id: 'diag3',
    name: 'Pre-Purchase Inspection',
    description: 'Complete vehicle assessment before buying a used car.',
    price: 149,
    duration: '2 hours',
    includes: ['Full diagnostic', 'Road test', 'Undercarriage inspection', 'History review', 'Detailed report with photos']
  },
  {
    id: 'diag4',
    name: 'Performance Analysis',
    description: 'For enthusiasts wanting to optimize their vehicle.',
    price: 199,
    duration: '2.5 hours',
    includes: ['Dyno test', 'Compression test', 'Fuel system analysis', 'Tune recommendations']
  }
];

// ==================== SHOPS ====================
export const MOCK_SHOPS: Shop[] = [
  {
    id: 'shop1',
    name: 'Speedy Fix Auto',
    rating: 4.8,
    reviewCount: 124,
    distance: '2.4 mi',
    address: '123 Main St, Springfield',
    phone: '(555) 123-4567',
    email: 'service@speedyfixauto.com',
    verified: true,
    verifiedAt: '2022-03-15',
    services: ['s1', 's2', 's3', 's4', 's5'],
    image: 'https://picsum.photos/400/300?random=1',
    description: 'Speedy Fix Auto has been serving the Springfield community for over 15 years. We specialize in quick turnarounds for routine maintenance and transparent pricing. Our ASE-certified technicians ensure your vehicle is in safe hands. Waiting area equipped with free Wi-Fi and coffee.',
    customPrices: {
      's1': '$59.99',
      's2': '$189.00',
      's3': '$89.00',
      's4': '$49.99',
      's5': '$149.00'
    },
    laborRate: 85,
    partsMarkup: 15,
    depositPercent: 20,
    warrantyDays: 90,
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
      },
      {
        id: 'r7',
        author: 'Alex T.',
        rating: 5,
        date: '2023-11-01',
        comment: 'They found an issue during my diagnostic that saved me from a breakdown. Honest and transparent!',
        serviceName: 'Comprehensive Diagnostic'
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
    phone: '(555) 987-6543',
    email: 'info@prestigemotors.com',
    verified: true,
    verifiedAt: '2021-08-20',
    services: ['s1', 's2', 's3', 's4', 's5'],
    image: 'https://picsum.photos/400/300?random=2',
    description: 'Specializing in luxury and import vehicles, Prestige Motors offers dealership-quality service at independent shop prices. We use OEM parts and state-of-the-art diagnostic equipment. Complimentary car wash with every service.',
    customPrices: {
      's1': '$89.99',
      's2': '$249.00',
      's3': '$149.00',
      's4': '$69.99',
      's5': '$199.00'
    },
    laborRate: 120,
    partsMarkup: 20,
    depositPercent: 25,
    warrantyDays: 180,
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
    phone: '(555) 456-7890',
    verified: false,
    services: ['s1', 's2', 's4'],
    image: 'https://picsum.photos/400/300?random=3',
    description: 'No frills, just honest mechanics getting the job done. We focus on brakes, tires, and basic maintenance to keep your car running without breaking the bank. Walk-ins welcome.',
    customPrices: {
      's1': '$45.00',
      's2': '$145.00',
      's4': '$35.00'
    },
    laborRate: 65,
    partsMarkup: 10,
    depositPercent: 15,
    warrantyDays: 60,
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
  },
  {
    id: 'shop4',
    name: 'EV Specialists',
    rating: 4.7,
    reviewCount: 45,
    distance: '8.3 mi',
    address: '200 Tech Park Dr, Springfield',
    phone: '(555) 321-9876',
    email: 'hello@evspecialists.com',
    verified: true,
    verifiedAt: '2023-01-10',
    services: ['s3', 's4'],
    image: 'https://picsum.photos/400/300?random=4',
    description: 'The regions only certified EV and hybrid service center. Factory-trained technicians for Tesla, Rivian, and all major EV brands.',
    customPrices: {
      's3': '$175.00',
      's4': '$75.00'
    },
    laborRate: 150,
    partsMarkup: 25,
    depositPercent: 30,
    warrantyDays: 365,
    reviews: [
      {
        id: 'r8',
        author: 'Teresa K.',
        rating: 5,
        date: '2023-11-15',
        comment: 'Finally found a shop that understands EVs! They updated my battery management system perfectly.',
        serviceName: 'Comprehensive Diagnostic'
      }
    ]
  }
];

// ==================== USERS ====================
export const MOCK_USERS: User[] = [
  {
    id: 'user1',
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '(555) 111-2222',
    role: UserRole.DRIVER,
    avatar: 'https://i.pravatar.cc/150?u=user1',
    createdAt: '2023-01-15T10:30:00Z'
  },
  {
    id: 'user2',
    name: 'Mike Chen',
    email: 'mike@speedyfixauto.com',
    phone: '(555) 123-4567',
    role: UserRole.SHOP,
    avatar: 'https://i.pravatar.cc/150?u=user2',
    createdAt: '2022-03-01T08:00:00Z',
    businessName: 'Speedy Fix Auto',
    businessAddress: '123 Main St, Springfield',
    licenseNumber: 'AUTO-2022-1234',
    verified: true
  },
  {
    id: 'admin1',
    name: 'Platform Admin',
    email: 'admin@vroom2go.com',
    phone: '(555) 000-0000',
    role: UserRole.ADMIN,
    createdAt: '2021-01-01T00:00:00Z'
  }
];

// ==================== VEHICLES ====================
export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    userId: 'user1',
    make: 'Honda',
    model: 'Civic',
    year: 2018,
    type: CarType.SEDAN,
    vin: '1HGFC2F59JA000092',
    image: 'https://picsum.photos/300/200?random=20',
    licensePlate: 'ABC-1234',
    trim: 'EX',
    color: 'Silver',
    mileage: 45000
  },
  {
    id: 'v2',
    userId: 'user1',
    make: 'Toyota',
    model: 'Rav4',
    year: 2021,
    type: CarType.SUV,
    vin: '2T3XF4DV1MW099921',
    image: 'https://picsum.photos/300/200?random=21',
    licensePlate: 'XYZ-9876',
    trim: 'XLE Premium',
    color: 'Blue',
    mileage: 22000
  },
  {
    id: 'v3',
    userId: 'user1',
    make: 'BMW',
    model: '3 Series',
    year: 2020,
    type: CarType.LUXURY,
    vin: 'WBA5R1C52LA123456',
    image: 'https://picsum.photos/300/200?random=22',
    licensePlate: 'LUX-4321',
    trim: '330i',
    color: 'Black',
    mileage: 35000
  }
];

// ==================== QUOTES ====================
export const MOCK_QUOTES: Quote[] = [
  {
    id: 'q1',
    shopId: 'shop1',
    shopName: 'Speedy Fix Auto',
    userId: 'user1',
    vehicleId: 'v1',
    serviceId: 's2',
    lineItems: [
      {
        id: 'li1',
        description: 'Front Brake Pads (Set)',
        partSku: 'BRK-FP-2018CIV',
        partName: 'OEM Front Brake Pads',
        partCost: 75,
        laborHours: 1.5,
        laborRate: 85,
        quantity: 1,
        subtotal: 202.5
      },
      {
        id: 'li2',
        description: 'Rotor Inspection & Measurement',
        partCost: 0,
        laborHours: 0.25,
        laborRate: 85,
        quantity: 1,
        subtotal: 21.25
      }
    ],
    partsCostTotal: 75,
    laborCostTotal: 148.75,
    shopFees: 15,
    taxes: 19.10,
    estimatedTotal: 257.85,
    estimatedRange: { min: 240, max: 280 },
    confidence: 0.85,
    guaranteed: true,
    guaranteeValidDays: 7,
    status: QuoteStatus.SUBMITTED,
    notes: 'Rotors look good, no machining needed. Can complete today if approved.',
    createdAt: '2024-01-05T14:30:00Z',
    expiresAt: '2024-01-12T14:30:00Z'
  },
  {
    id: 'q2',
    shopId: 'shop2',
    shopName: 'Prestige Motors',
    userId: 'user1',
    vehicleId: 'v1',
    serviceId: 's2',
    lineItems: [
      {
        id: 'li3',
        description: 'Premium Ceramic Brake Pads (Set)',
        partSku: 'BRK-CER-PREM',
        partName: 'Ceramic Front Brake Pads',
        partCost: 120,
        laborHours: 1.5,
        laborRate: 120,
        quantity: 1,
        subtotal: 300
      },
      {
        id: 'li4',
        description: 'Brake Fluid Top-off',
        partCost: 15,
        laborHours: 0.1,
        laborRate: 120,
        quantity: 1,
        subtotal: 27
      }
    ],
    partsCostTotal: 135,
    laborCostTotal: 192,
    shopFees: 25,
    taxes: 28.16,
    estimatedTotal: 380.16,
    estimatedRange: { min: 350, max: 420 },
    confidence: 0.90,
    guaranteed: true,
    guaranteeValidDays: 14,
    status: QuoteStatus.SUBMITTED,
    notes: 'Using premium ceramic pads for longer life. Includes complimentary car wash.',
    createdAt: '2024-01-05T15:00:00Z',
    expiresAt: '2024-01-19T15:00:00Z'
  },
  {
    id: 'q3',
    shopId: 'shop3',
    shopName: 'Budget Brakes & Tires',
    userId: 'user1',
    vehicleId: 'v1',
    serviceId: 's2',
    lineItems: [
      {
        id: 'li5',
        description: 'Economy Brake Pads (Set)',
        partSku: 'BRK-ECO-001',
        partCost: 45,
        laborHours: 1.5,
        laborRate: 65,
        quantity: 1,
        subtotal: 142.5
      }
    ],
    partsCostTotal: 45,
    laborCostTotal: 97.5,
    shopFees: 10,
    taxes: 12.20,
    estimatedTotal: 164.70,
    estimatedRange: { min: 145, max: 180 },
    confidence: 0.75,
    guaranteed: false,
    status: QuoteStatus.SUBMITTED,
    notes: 'Best price in town! May need additional work if rotors are worn.',
    createdAt: '2024-01-05T16:00:00Z'
  }
];

// ==================== INVOICES ====================
export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    bookingId: 'b2',
    quoteId: 'q1',
    lineItems: [
      {
        id: 'li-inv1',
        description: 'Front Brake Pads (Set)',
        partSku: 'BRK-FP-2018CIV',
        partName: 'OEM Front Brake Pads',
        partCost: 75,
        laborHours: 1.5,
        laborRate: 85,
        quantity: 1,
        subtotal: 202.5
      },
      {
        id: 'li-inv2',
        description: 'Rotor Inspection & Measurement',
        partCost: 0,
        laborHours: 0.25,
        laborRate: 85,
        quantity: 1,
        subtotal: 21.25
      }
    ],
    partsCostTotal: 75,
    laborCostTotal: 148.75,
    shopFees: 15,
    taxes: 19.10,
    finalTotal: 257.85,
    variance: 0,
    evidencePhotos: [
      'https://picsum.photos/400/300?random=50',
      'https://picsum.photos/400/300?random=51',
      'https://picsum.photos/400/300?random=52'
    ],
    notes: 'Job completed as quoted. Old brake pads were worn to 2mm.',
    approvedByOwner: true,
    createdAt: '2024-01-06T16:30:00Z'
  }
];

// ==================== QUOTE REQUESTS ====================
export const MOCK_QUOTE_REQUESTS: QuoteRequest[] = [
  {
    id: 'qr1',
    userId: 'user1',
    vehicleId: 'v1',
    vehicleInfo: { make: 'Honda', model: 'Civic', year: 2023 },
    description: 'Hearing a squealing noise from front brakes when stopping. Gets louder when applying brakes firmly.',
    symptoms: ['Squealing noise', 'Noise when braking', 'Gets worse over time'],
    photos: [
      'https://picsum.photos/400/300?random=60',
      'https://picsum.photos/400/300?random=61'
    ],
    broadcast: true,
    radius: 10,
    status: 'OPEN',
    quotes: ['q1', 'q2', 'q3'],
    createdAt: '2024-01-05T10:00:00Z'
  },
  {
    id: 'qr2',
    userId: 'user2',
    vehicleId: 'v2',
    vehicleInfo: { make: 'Toyota', model: 'RAV4', year: 2022 },
    description: 'Check engine light came on, car seems to be running rough. Need diagnostic.',
    symptoms: ['Check engine light', 'Rough idle', 'Poor acceleration'],
    photos: [
      'https://picsum.photos/400/300?random=62'
    ],
    broadcast: false,
    targetShopIds: ['shop1'],
    status: 'OPEN',
    quotes: [],
    createdAt: '2024-01-06T14:30:00Z'
  }
];


// ==================== FORUM POSTS ====================
export const MOCK_POSTS: ForumPost[] = [
  {
    id: 'p1',
    author: 'CivicLover99',
    authorId: 'user1',
    authorRole: UserRole.DRIVER,
    title: 'Strange knocking sound when turning left?',
    content: 'I have a 2018 Honda Civic. Whenever I make a sharp left turn, I hear a rhythmic knocking sound from the front right wheel. CV joint?',
    likes: 12,
    comments: [
      {
        id: 'c1',
        author: 'MechanicMike',
        role: UserRole.DRIVER,
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
    image: 'https://picsum.photos/600/400?random=10',
    vehicle: { make: 'Honda', model: 'Civic', year: 2018 },
    createdAt: '2024-01-05T09:00:00Z'
  },
  {
    id: 'p2',
    author: 'TeslaFan',
    authorRole: UserRole.DRIVER,
    title: 'Range dropped significantly after update',
    content: 'Has anyone else noticed a 10% drop in range after the latest software update? Is this a known issue?',
    likes: 45,
    comments: [],
    tags: ['EV', 'Battery', 'Software', 'Tesla'],
    vehicle: { make: 'Tesla', model: 'Model 3', year: 2022 },
    createdAt: '2024-01-04T15:30:00Z'
  },
  {
    id: 'p3',
    author: 'DIYer_Dan',
    authorRole: UserRole.DRIVER,
    title: 'Cost of brake pad replacement - am I being overcharged?',
    content: 'Got quotes ranging from $150 to $400 for front brake pads on my 2021 RAV4. Why such a huge difference? What should I expect to pay?',
    likes: 28,
    comments: [
      {
        id: 'c3',
        author: 'Prestige Motors',
        role: UserRole.SHOP,
        shopId: 'shop2',
        content: 'Great question! Price varies based on parts quality (economy vs OEM vs ceramic), shop labor rates, and whats included. Higher quotes often include better warranty and premium parts. Always ask for an itemized breakdown!',
        date: '3 hours ago'
      }
    ],
    tags: ['Brakes', 'Pricing', 'Toyota', 'SUV'],
    vehicle: { make: 'Toyota', model: 'RAV4', year: 2021 },
    createdAt: '2024-01-03T11:00:00Z'
  }
];

// ==================== BOOKINGS ====================
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    userId: 'user1',
    shopId: 'shop1',
    shopName: 'Speedy Fix Auto',
    quoteId: 'q1',
    vehicleId: 'v1',
    serviceName: 'Full Synthetic Oil Change',
    serviceId: 's1',
    date: '2024-01-25 10:00 AM',
    scheduledAt: '2024-01-25T10:00:00Z',
    estimatedCompletion: '2024-01-25T11:00:00Z',
    status: 'Confirmed',
    jobStatus: JobStatus.SCHEDULED,
    price: '$65.00',
    estimatedTotal: 65,
    depositAmount: 13,
    depositPaid: true,
    escrowStatus: EscrowStatus.HELD,
    vehicle: '2018 Honda Civic',
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z'
  },
  {
    id: 'b2',
    userId: 'user1',
    shopId: 'shop2',
    shopName: 'Prestige Motors',
    vehicleId: 'v3',
    serviceName: 'Brake Pad Replacement',
    serviceId: 's2',
    date: '2024-01-10 02:00 PM',
    scheduledAt: '2024-01-10T14:00:00Z',
    status: 'Completed',
    jobStatus: JobStatus.COMPLETED,
    price: '$257.85',
    estimatedTotal: 257.85,
    depositAmount: 51.57,
    depositPaid: true,
    escrowStatus: EscrowStatus.RELEASED,
    finalInvoiceId: 'inv1',
    vehicle: '2020 BMW 3 Series',
    createdAt: '2024-01-05T16:00:00Z',
    updatedAt: '2024-01-10T17:00:00Z'
  },
  {
    id: 'b3',
    userId: 'user1',
    shopId: 'shop1',
    shopName: 'Speedy Fix Auto',
    vehicleId: 'v2',
    serviceName: 'Comprehensive Diagnostic',
    serviceId: 's3',
    date: '2024-01-28 09:00 AM',
    scheduledAt: '2024-01-28T09:00:00Z',
    estimatedCompletion: '2024-01-28T10:30:00Z',
    status: 'Pending',
    jobStatus: JobStatus.SCHEDULED,
    price: '$89.00',
    estimatedTotal: 89,
    depositAmount: 17.80,
    depositPaid: false,
    escrowStatus: EscrowStatus.PENDING,
    vehicle: '2021 Toyota Rav4',
    notes: 'Check engine light came on. Requesting full diagnostic.',
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z'
  }
];

// ==================== HELPER FUNCTIONS ====================
export const getShopById = (id: string): Shop | undefined => 
  MOCK_SHOPS.find(shop => shop.id === id);

export const getServiceById = (id: string): Service | undefined => 
  MOCK_SERVICES.find(service => service.id === id);

export const getVehicleById = (id: string): Vehicle | undefined => 
  MOCK_VEHICLES.find(vehicle => vehicle.id === id);

export const getQuotesByUserId = (userId: string): Quote[] => 
  MOCK_QUOTES.filter(quote => quote.userId === userId);

export const getBookingsByUserId = (userId: string): Booking[] => 
  MOCK_BOOKINGS.filter(booking => booking.userId === userId);

export const calculateQuoteTotal = (lineItems: LineItem[], shopFees: number, taxRate: number = 0.08): { subtotal: number; taxes: number; total: number } => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0) + shopFees;
  const taxes = subtotal * taxRate;
  return { subtotal, taxes, total: subtotal + taxes };
};