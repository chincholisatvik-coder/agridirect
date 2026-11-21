/**
 * Mathematical & Business Logic Specifications for Agridirect
 * Implements Section 4 of Agent Build Specification
 */

export interface PriceSuggestion {
  suggestedDirectPrice: number;
  suggestedGroupPrice: number;
  isValidOrder: boolean;
  validationError?: string;
}

/**
 * 4.1 Recommended Middle-Ground Price Validator
 * P_direct = round((P_wholesale + P_retail) / 2)
 * P_group = round(P_direct * (1 - delta)), delta = 0.10
 * Ensure P_wholesale < P_group < P_direct < P_retail
 */
export function calculateRecommendedPrices(
  wholesalePrice: number,
  retailPrice: number
): PriceSuggestion {
  if (wholesalePrice <= 0 || retailPrice <= 0 || wholesalePrice >= retailPrice) {
    return {
      suggestedDirectPrice: 0,
      suggestedGroupPrice: 0,
      isValidOrder: false,
      validationError: 'Retail price must be strictly greater than wholesale price.',
    };
  }

  const directPrice = Math.round((wholesalePrice + retailPrice) / 2);
  const delta = 0.10;
  const groupPrice = Math.round(directPrice * (1 - delta));

  const isValid = wholesalePrice < groupPrice && groupPrice < directPrice && directPrice < retailPrice;

  return {
    suggestedDirectPrice: directPrice,
    suggestedGroupPrice: groupPrice,
    isValidOrder: isValid,
    validationError: isValid
      ? undefined
      : 'Calculated prices do not maintain: Wholesale < Group Bulk < Direct < Retail.',
  };
}

/**
 * Validates custom input prices against the domain constraint:
 * P_wholesale < P_group < P_direct < P_retail
 */
export function validateCustomPrices(
  wholesale: number,
  group: number,
  direct: number,
  retail: number
): { valid: boolean; message?: string } {
  if (wholesale <= 0 || group <= 0 || direct <= 0 || retail <= 0) {
    return { valid: false, message: 'All prices must be positive numbers.' };
  }
  if (wholesale >= group) {
    return { valid: false, message: 'Group bulk price must be higher than wholesale rate.' };
  }
  if (group >= direct) {
    return { valid: false, message: 'Direct price must be higher than group bulk price.' };
  }
  if (direct >= retail) {
    return { valid: false, message: 'Market retail price must be higher than direct farmer price.' };
  }
  return { valid: true };
}

/**
 * 4.2 Haversine Distance with 1.25x road-winding factor
 * R = 6371 km
 * a = sin^2(Δφ/2) + cos(φ1) * cos(φ2) * sin^2(Δλ/2)
 * d_km = round(1.25 * 2 * R * atan2(√a, √(1-a)) * 10) / 10
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  const roadDistance = 1.25 * R * c;

  // Round to 1 decimal place
  return Math.round(roadDistance * 10) / 10;
}

/**
 * 4.2 Automated Home Delivery Surcharge
 * D_fee = round(D_base + (d_km * r_km) + (Q_ordered * r_kg))
 * If Self-Pickup: D_fee = 0
 */
export function calculateDeliveryFee(
  fulfillmentType: 'SELF_PICKUP' | 'HOME_DELIVERY',
  distanceKm: number,
  quantityKg: number,
  baseFee: number = 20,
  ratePerKm: number = 2.5,
  ratePerKg: number = 0.5
): number {
  if (fulfillmentType === 'SELF_PICKUP') {
    return 0;
  }
  const fee = baseFee + distanceKm * ratePerKm + quantityKg * ratePerKg;
  return Math.round(fee);
}

/**
 * 4.3 Group Bulk-Buy Split-Pay Calculator
 * D_share = round(D_fee_pool * (Q_pledged / Q_min))
 * Escrow_buyer = (Q_pledged * P_group) + D_share
 * Progress = min(100, round((sum Q_pledged / Q_min) * 100))
 */
export function calculateGroupSplitPayment(
  quantityPledged: number,
  targetQuantityKg: number,
  unitBulkPrice: number,
  totalPoolDeliveryFee: number = 0
): {
  deliveryShare: number;
  subtotal: number;
  totalEscrowAmount: number;
} {
  const subtotal = quantityPledged * unitBulkPrice;
  const deliveryShare =
    targetQuantityKg > 0
      ? Math.round(totalPoolDeliveryFee * (quantityPledged / targetQuantityKg))
      : 0;

  return {
    deliveryShare,
    subtotal,
    totalEscrowAmount: subtotal + deliveryShare,
  };
}

export function calculatePoolProgress(
  currentQuantityKg: number,
  targetQuantityKg: number
): number {
  if (targetQuantityKg <= 0) return 100;
  return Math.min(100, Math.round((currentQuantityKg / targetQuantityKg) * 100));
}

