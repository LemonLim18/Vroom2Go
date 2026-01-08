
export enum UserRole {
  OWNER = 'OWNER',
  SHOP = 'SHOP',
  ADMIN = 'ADMIN'
}

export enum CarType {
  COMPACT = 'Compact',
  SEDAN = 'Sedan',
  SUV = 'SUV',
  LUXURY = 'Luxury',
  EV = 'Electric'
}

export enum ServiceCategory {
  MAINTENANCE = 'Maintenance',
  REPAIR = 'Repair',
  DIAGNOSTIC = 'Diagnostic'
}

export enum BookingMethod {
  DROP_OFF = 'DROP_OFF', // Owner drives to shop
  TOWING = 'TOWING',     // Shop tows car from owner
  MOBILE = 'MOBILE'      // Mechanic visits owner
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  type: CarType;
  vin: string;
  image: string;
  licensePlate?: string;
}

export interface ServiceTierPrice {
  [CarType.COMPACT]: string;
  [CarType.SEDAN]: string;
  [CarType.SUV]: string;
  [CarType.LUXURY]: string;
  [CarType.EV]: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  priceRange: ServiceTierPrice; // e.g. "$90-$120"
  duration: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  serviceName?: string;
}

export interface Shop {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  distance: string;
  address: string;
  verified: boolean;
  services: string[]; // Service IDs
  image: string;
  description: string;
  reviews: Review[];
  customPrices: Record<string, string>; // serviceId -> price string
}

export interface Comment {
  id: string;
  author: string;
  role: UserRole;
  content: string;
  date: string;
  shopId?: string; // If the author is a shop, link to their profile
}

export interface ForumPost {
  id: string;
  author: string;
  authorRole: UserRole;
  title: string;
  content: string;
  likes: number;
  comments: Comment[];
  tags: string[];
  image?: string;
  isAiAnswered?: boolean;
}

export interface Booking {
  id: string;
  serviceName: string;
  shopName: string;
  date: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'In Progress';
  price: string;
  vehicle?: string;
  method?: BookingMethod;
}
