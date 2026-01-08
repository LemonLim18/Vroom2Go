/**
 * VIN Decoder Service
 * Mock implementation for VIN decoding functionality
 * In production, would call NHTSA or third-party VIN decoder API
 */

import { CarType, Vehicle } from '../types';

// VIN structure reference
// Position 1-3: World Manufacturer Identifier (WMI)
// Position 4-8: Vehicle Descriptor Section (VDS)
// Position 9: Check digit
// Position 10: Model year
// Position 11: Plant code
// Position 12-17: Serial number

// Manufacturer codes (simplified)
const MANUFACTURER_MAP: Record<string, { make: string; country: string }> = {
  '1HG': { make: 'Honda', country: 'USA' },
  'JHM': { make: 'Honda', country: 'Japan' },
  '2T3': { make: 'Toyota', country: 'Canada' },
  '5TD': { make: 'Toyota', country: 'USA' },
  'JTD': { make: 'Toyota', country: 'Japan' },
  'WBA': { make: 'BMW', country: 'Germany' },
  'WBS': { make: 'BMW M', country: 'Germany' },
  '5YJ': { make: 'Tesla', country: 'USA' },
  '1G1': { make: 'Chevrolet', country: 'USA' },
  '1FA': { make: 'Ford', country: 'USA' },
  '3FA': { make: 'Ford', country: 'Mexico' },
  'KND': { make: 'Kia', country: 'Korea' },
  '5NP': { make: 'Hyundai', country: 'USA' },
  'JN1': { make: 'Nissan', country: 'Japan' },
  '1N4': { make: 'Nissan', country: 'USA' },
  '4T1': { make: 'Toyota', country: 'USA' },
  'WDD': { make: 'Mercedes-Benz', country: 'Germany' },
  'WAU': { make: 'Audi', country: 'Germany' },
  '3VW': { make: 'Volkswagen', country: 'Mexico' },
  'JM1': { make: 'Mazda', country: 'Japan' },
};

// Model year codes (position 10)
const YEAR_CODES: Record<string, number> = {
  'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
  'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
  'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
  'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
  'Y': 2030,
};

// Common model codes by manufacturer (simplified)
const MODEL_MAP: Record<string, Record<string, { model: string; type: CarType }>> = {
  'Honda': {
    'FC2': { model: 'Civic', type: CarType.SEDAN },
    'FB2': { model: 'Civic', type: CarType.COMPACT },
    'RW1': { model: 'CR-V', type: CarType.SUV },
    'YH2': { model: 'Accord', type: CarType.SEDAN },
    'RLX': { model: 'RLX', type: CarType.LUXURY },
  },
  'Toyota': {
    'XF4': { model: 'RAV4', type: CarType.SUV },
    'BK1': { model: 'Corolla', type: CarType.SEDAN },
    'BF1': { model: 'Camry', type: CarType.SEDAN },
    'DZ4': { model: 'Highlander', type: CarType.SUV },
    'BU5': { model: 'Prius', type: CarType.SEDAN },
  },
  'BMW': {
    '5R1': { model: '3 Series', type: CarType.LUXURY },
    '3C3': { model: '5 Series', type: CarType.LUXURY },
    'JN1': { model: 'X3', type: CarType.SUV },
    'XR7': { model: 'X5', type: CarType.SUV },
  },
  'Tesla': {
    'YS3': { model: 'Model 3', type: CarType.EV },
    'YX3': { model: 'Model X', type: CarType.EV },
    'YY3': { model: 'Model Y', type: CarType.EV },
    'SA3': { model: 'Model S', type: CarType.EV },
  },
};

export interface VINDecodeResult {
  valid: boolean;
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  type?: CarType;
  trim?: string;
  country?: string;
  error?: string;
}

/**
 * Validate VIN format (basic validation)
 */
export const isValidVINFormat = (vin: string): boolean => {
  if (!vin || vin.length !== 17) return false;
  
  // VIN should not contain I, O, or Q
  const invalidChars = /[IOQ]/i;
  if (invalidChars.test(vin)) return false;
  
  // VIN should be alphanumeric
  const validFormat = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return validFormat.test(vin);
};

/**
 * Decode VIN to extract vehicle information
 * This is a mock implementation - production would use NHTSA API
 */
export const decodeVIN = (vin: string): VINDecodeResult => {
  const upperVIN = vin.toUpperCase().trim();
  
  if (!isValidVINFormat(upperVIN)) {
    return {
      valid: false,
      vin: upperVIN,
      error: 'Invalid VIN format. VIN must be 17 characters, alphanumeric, and cannot contain I, O, or Q.',
    };
  }

  try {
    // Extract WMI (first 3 characters)
    const wmi = upperVIN.substring(0, 3);
    const manufacturer = MANUFACTURER_MAP[wmi];
    
    if (!manufacturer) {
      // Fall back to partial match
      const partialWmi = upperVIN.substring(0, 2);
      const partialMatch = Object.entries(MANUFACTURER_MAP).find(([key]) => 
        key.startsWith(partialWmi)
      );
      
      if (!partialMatch) {
        return {
          valid: true,
          vin: upperVIN,
          error: 'Manufacturer not recognized. Please enter vehicle details manually.',
        };
      }
    }

    const make = manufacturer?.make || 'Unknown';
    const country = manufacturer?.country || 'Unknown';

    // Extract model year (position 10)
    const yearCode = upperVIN.charAt(9);
    const year = YEAR_CODES[yearCode] || (parseInt(yearCode) ? 2000 + parseInt(yearCode) : undefined);

    // Try to determine model from VDS (positions 4-8)
    const vds = upperVIN.substring(3, 8);
    let model = 'Unknown Model';
    let type = CarType.SEDAN;

    if (MODEL_MAP[make]) {
      const modelMatch = Object.entries(MODEL_MAP[make]).find(([code]) => 
        vds.includes(code)
      );
      if (modelMatch) {
        model = modelMatch[1].model;
        type = modelMatch[1].type;
      }
    }

    // Determine trim from remaining characters (simplified)
    const trimIndicator = upperVIN.charAt(7);
    let trim: string | undefined;
    switch (trimIndicator) {
      case 'A':
      case 'B':
        trim = 'Base';
        break;
      case 'C':
      case 'D':
        trim = 'Sport';
        break;
      case 'E':
      case 'F':
        trim = 'Premium';
        break;
      case 'G':
      case 'H':
        trim = 'Limited';
        break;
      default:
        trim = undefined;
    }

    return {
      valid: true,
      vin: upperVIN,
      make,
      model,
      year,
      type,
      trim,
      country,
    };
  } catch (error) {
    return {
      valid: false,
      vin: upperVIN,
      error: 'Error decoding VIN. Please enter vehicle details manually.',
    };
  }
};

/**
 * Create a vehicle object from VIN decode result
 */
export const createVehicleFromVIN = (
  decodeResult: VINDecodeResult,
  additionalInfo?: {
    licensePlate?: string;
    color?: string;
    mileage?: number;
    image?: string;
  }
): Omit<Vehicle, 'id'> | null => {
  if (!decodeResult.valid || !decodeResult.make || !decodeResult.year) {
    return null;
  }

  return {
    make: decodeResult.make,
    model: decodeResult.model || 'Unknown',
    year: decodeResult.year,
    type: decodeResult.type || CarType.SEDAN,
    vin: decodeResult.vin,
    trim: decodeResult.trim,
    image: additionalInfo?.image || `https://picsum.photos/300/200?random=${Math.floor(Math.random() * 1000)}`,
    licensePlate: additionalInfo?.licensePlate,
    color: additionalInfo?.color,
    mileage: additionalInfo?.mileage,
  };
};

/**
 * Format VIN for display (masked middle portion for privacy)
 */
export const formatVINMasked = (vin: string): string => {
  if (!vin || vin.length < 8) return vin;
  return `${vin.substring(0, 6)}...${vin.substring(vin.length - 4)}`;
};

/**
 * Get vehicle category description
 */
export const getVehicleCategoryDescription = (type: CarType): string => {
  switch (type) {
    case CarType.COMPACT:
      return 'Compact cars typically have smaller engines and lower service costs.';
    case CarType.SEDAN:
      return 'Standard sedans with average maintenance requirements.';
    case CarType.SUV:
      return 'SUVs and crossovers may require more fluids and larger parts.';
    case CarType.LUXURY:
      return 'Luxury vehicles often require specialized parts and expertise.';
    case CarType.EV:
      return 'Electric vehicles have unique service needs and fewer maintenance items.';
    default:
      return '';
  }
};
