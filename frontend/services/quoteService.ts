/**
 * Quote Service - Handles quote calculations, comparisons, and variance checks
 */

import { LineItem, Quote, Invoice, CarType, Service } from '../types';

// Tax rate (configurable)
const DEFAULT_TAX_RATE = 0.08; // 8%

// Tolerance for variance between quote and final invoice
const DEFAULT_VARIANCE_TOLERANCE = 0.15; // 15%

/**
 * Calculate line item subtotal
 */
export const calculateLineItemSubtotal = (item: Omit<LineItem, 'id' | 'subtotal'>): number => {
  const partsCost = item.partCost * item.quantity;
  const laborCost = item.laborHours * item.laborRate;
  return partsCost + laborCost;
};

/**
 * Calculate quote totals from line items
 */
export const calculateQuoteTotals = (
  lineItems: LineItem[],
  shopFees: number = 0,
  taxRate: number = DEFAULT_TAX_RATE
): {
  partsCostTotal: number;
  laborCostTotal: number;
  subtotal: number;
  taxes: number;
  estimatedTotal: number;
} => {
  const partsCostTotal = lineItems.reduce((sum, item) => sum + (item.partCost * item.quantity), 0);
  const laborCostTotal = lineItems.reduce((sum, item) => sum + (item.laborHours * item.laborRate), 0);
  const subtotal = partsCostTotal + laborCostTotal + shopFees;
  const taxes = subtotal * taxRate;
  const estimatedTotal = subtotal + taxes;

  return {
    partsCostTotal: Math.round(partsCostTotal * 100) / 100,
    laborCostTotal: Math.round(laborCostTotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    estimatedTotal: Math.round(estimatedTotal * 100) / 100,
  };
};

/**
 * Calculate variance between quote and final invoice
 * Returns percentage difference (positive = over quote, negative = under quote)
 */
export const calculateVariance = (quoteTotal: number, invoiceTotal: number): number => {
  if (quoteTotal === 0) return 0;
  const variance = ((invoiceTotal - quoteTotal) / quoteTotal) * 100;
  return Math.round(variance * 100) / 100;
};

/**
 * Check if variance exceeds tolerance threshold
 */
export const isVarianceOverTolerance = (
  variance: number,
  tolerance: number = DEFAULT_VARIANCE_TOLERANCE
): boolean => {
  return Math.abs(variance) > tolerance * 100;
};

/**
 * Calculate deposit amount based on shop's deposit percentage
 */
export const calculateDeposit = (estimatedTotal: number, depositPercent: number = 20): number => {
  const deposit = estimatedTotal * (depositPercent / 100);
  return Math.round(deposit * 100) / 100;
};

/**
 * Get estimated price range for a service and vehicle type
 */
export const getServicePriceRange = (
  service: Service,
  vehicleType: CarType
): { min: number; max: number } | null => {
  if (service.tierPricing?.[vehicleType]) {
    return service.tierPricing[vehicleType];
  }
  
  // Parse from string format (e.g., "$150 - $200")
  const priceString = service.priceRange[vehicleType];
  if (!priceString || priceString === 'N/A') {
    return null;
  }

  const match = priceString.match(/\$(\d+(?:\.\d{2})?)\s*-?\s*\$?(\d+(?:\.\d{2})?)?/);
  if (match) {
    const min = parseFloat(match[1]);
    const max = match[2] ? parseFloat(match[2]) : min;
    return { min, max };
  }

  // Handle flat rate (e.g., "$99 Flat")
  const flatMatch = priceString.match(/\$(\d+(?:\.\d{2})?)/);
  if (flatMatch) {
    const price = parseFloat(flatMatch[1]);
    return { min: price, max: price };
  }

  return null;
};

/**
 * Compare quotes and rank them
 */
export const compareQuotes = (quotes: Quote[]): Quote[] => {
  return [...quotes].sort((a, b) => {
    // Primary: Guaranteed quotes first
    if (a.guaranteed && !b.guaranteed) return -1;
    if (!a.guaranteed && b.guaranteed) return 1;
    
    // Secondary: Higher confidence
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }
    
    // Tertiary: Lower price
    return a.estimatedTotal - b.estimatedTotal;
  });
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format price range for display
 */
export const formatPriceRange = (min: number, max: number): string => {
  if (min === max) {
    return formatCurrency(min);
  }
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
};

/**
 * Generate confidence label
 */
export const getConfidenceLabel = (confidence: number): { label: string; color: string } => {
  if (confidence >= 0.9) {
    return { label: 'High Confidence', color: 'success' };
  } else if (confidence >= 0.7) {
    return { label: 'Good Confidence', color: 'info' };
  } else if (confidence >= 0.5) {
    return { label: 'Moderate Confidence', color: 'warning' };
  } else {
    return { label: 'Estimate Only', color: 'error' };
  }
};

/**
 * Create a new quote from line items
 */
export const createQuote = (params: {
  shopId: string;
  shopName: string;
  userId: string;
  vehicleId: string;
  serviceId?: string;
  lineItems: LineItem[];
  shopFees: number;
  confidence: number;
  guaranteed: boolean;
  guaranteeValidDays?: number;
  notes?: string;
}): Omit<Quote, 'id' | 'createdAt' | 'status'> => {
  const totals = calculateQuoteTotals(params.lineItems, params.shopFees);
  
  // Estimate range based on confidence
  const rangeMultiplier = 1 - params.confidence;
  const rangeMin = Math.round(totals.estimatedTotal * (1 - rangeMultiplier) * 100) / 100;
  const rangeMax = Math.round(totals.estimatedTotal * (1 + rangeMultiplier) * 100) / 100;

  return {
    shopId: params.shopId,
    shopName: params.shopName,
    userId: params.userId,
    vehicleId: params.vehicleId,
    serviceId: params.serviceId,
    lineItems: params.lineItems,
    partsCostTotal: totals.partsCostTotal,
    laborCostTotal: totals.laborCostTotal,
    shopFees: params.shopFees,
    taxes: totals.taxes,
    estimatedTotal: totals.estimatedTotal,
    estimatedRange: { min: rangeMin, max: rangeMax },
    confidence: params.confidence,
    guaranteed: params.guaranteed,
    guaranteeValidDays: params.guaranteeValidDays,
    notes: params.notes,
  };
};
