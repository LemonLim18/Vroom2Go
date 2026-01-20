
export enum UserRole {
  DRIVER = 'DRIVER',
  SHOP = 'SHOP',
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN'
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
  DROP_OFF = 'DROP_OFF',
  TOWING = 'TOWING',
  MOBILE = 'MOBILE'
}

export enum QuoteStatus {
  PENDING = 'PENDING',
  QUOTED = 'QUOTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum JobStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  WAITING_PARTS = 'Waiting Parts',
  COMPLETED = 'Completed',
  DISPUTED = 'Disputed'
}

export enum EscrowStatus {
  PENDING = 'Pending',
  HELD = 'Held',
  RELEASED = 'Released',
  DISPUTED = 'Disputed',
  REFUNDED = 'Refunded'
}

// User profile
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  // Shop-specific fields
  businessName?: string;
  businessAddress?: string;
  licenseNumber?: string;
  verified?: boolean;
}

export interface Vehicle {
  id: string;
  userId?: string;
  make: string;
  model: string;
  year: number;
  type: CarType;
  vin: string;
  image: string; // Legacy
  imageUrl?: string;
  licensePlate?: string;
  trim?: string;
  color?: string;
  mileage?: number;
}

// Tiered pricing with min/max ranges
export interface TierPrice {
  min: number;
  max: number;
}

export interface ServiceTierPricing {
  [CarType.COMPACT]: TierPrice;
  [CarType.SEDAN]: TierPrice;
  [CarType.SUV]: TierPrice;
  [CarType.LUXURY]: TierPrice;
  [CarType.EV]: TierPrice;
}

// Legacy string-based pricing (for backward compatibility)
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
  priceRange: ServiceTierPrice;
  tierPricing?: ServiceTierPricing;
  duration: string;
  warranty?: string;
  includes?: string[];
  excludes?: string[];
}

// Line item for quotes and invoices
export interface LineItem {
  id: string;
  description: string;
  partSku?: string;
  partName?: string;
  partCost: number;
  laborHours: number;
  laborRate: number;
  quantity: number;
  subtotal: number;
}

// Quote from shop
export interface Quote {
  id: string;
  shopId: string;
  shopName: string;
  userId: string;
  vehicleId: string;
  serviceId?: string;
  lineItems: LineItem[];
  partsCostTotal: number;
  laborCostTotal: number;
  shopFees: number;
  taxes: number;
  estimatedTotal: number;
  estimatedRange: { min: number; max: number };
  confidence: number; // 0-1 scale
  guaranteed: boolean;
  guaranteeValidDays?: number;
  status: QuoteStatus;
  notes?: string;
  createdAt: string;
  expiresAt?: string;
}

// Final invoice after job completion
export interface Invoice {
  id: string;
  bookingId: string;
  quoteId: string;
  lineItems: LineItem[];
  partsCostTotal: number;
  laborCostTotal: number;
  shopFees: number;
  taxes: number;
  finalTotal: number;
  variance: number; // % difference from quote
  evidencePhotos: string[];
  notes?: string;
  approvedByOwner: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  author: string;
  authorId?: string;
  rating: number;
  date: string;
  comment: string;
  serviceName?: string;
  bookingId?: string;
  photos?: string[];
}

export interface Shop {
  id: string | number; // Allow number from backend
  userId?: string | number;
  name: string;
  rating: number;
  reviewCount: number;
  distance?: string;
  address: string;
  phone?: string;
  email?: string;
  verified: boolean;
  verifiedAt?: string;
  services?: string[];
  image?: string; // Legacy
  imageUrl?: string; // Match backend
  description?: string;
  reviews?: Review[];
  customPrices?: Record<string, string>;
  laborRate?: number;
  partsMarkup?: number;
  depositPercent?: number;
  warrantyDays?: number;
  availability?: ShopAvailability;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopAvailability {
  [day: string]: { open: string; close: string; available: boolean }[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Comment {
  id: string;
  author: string;
  authorId?: string;
  role: UserRole;
  content: string;
  date: string;
  shopId?: string;
  likes?: number;
}

export interface ForumPost {
  id: string | number;
  author: string;
  authorId?: string;
  authorRole: UserRole;
  title: string;
  content: string;
  likes: number;
  comments: Comment[];
  tags: string[];
  image?: string;
  images?: string[];
  video?: string;
  isAiAnswered?: boolean;
  vehicle?: { make: string; model: string; year: number };
  createdAt?: string;
  updatedAt?: string;
  isEdited?: boolean;
  viewCount?: number;
}

// Enhanced Booking with escrow and job lifecycle
export interface Booking {
  id: string;
  userId: string;
  shopId: string;
  shopName: string;
  quoteId?: string;
  vehicleId?: string;
  serviceName: string;
  serviceId?: string;
  date: string;
  scheduledAt: string;
  estimatedCompletion?: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'In Progress' | 'Cancelled';
  jobStatus: JobStatus;
  price: string;
  estimatedTotal: number;
  depositAmount: number;
  depositPaid: boolean;
  escrowStatus: EscrowStatus;
  finalInvoiceId?: string;
  vehicle?: string;
  method?: BookingMethod;
  notes?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

// Quote request from owner
export interface QuoteRequest {
  id: string;
  userId: string;
  vehicleId: string;
  vehicleInfo?: { make: string; model: string; year: number }; // Resolved vehicle info
  description: string;
  symptoms: string[];
  photos: string[];
  video?: string;
  voiceNote?: string;
  targetShopIds?: string[];
  broadcast: boolean;
  radius?: number;
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  quotes: string[]; // Quote IDs
  createdAt: string;
}


// Dispute for mediation
export interface Dispute {
  id: string;
  bookingId: string;
  invoiceId?: string;
  userId: string;
  shopId: string;
  reason: string;
  description: string;
  evidencePhotos: string[];
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: 'quote' | 'booking' | 'job_update' | 'invoice' | 'dispute' | 'message';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

// Diagnostic package
export interface DiagnosticPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  includes: string[];
}
