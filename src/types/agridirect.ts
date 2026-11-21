export type LanguageCode = 'en' | 'hi' | 'kn';

export type UserRole = 'FARMER' | 'BUYER' | 'ADMIN';

export type QualityGrade = 'GRADE_A_BOLD' | 'STANDARD' | 'ORGANIC_UNPOLISHED';

export type CommodityCategory =
  | 'PEANUTS_OILSEEDS'
  | 'PULSES_DALS'
  | 'GRAINS_MILLETS'
  | 'DRY_SPICES';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  username?: string;
  password?: string;
  preferredLanguage: LanguageCode;
  locationName: string;
  pincode: string;
  lat: number;
  lng: number;
  kycDocumentId?: string; // e.g., RTC / Aadhaar reference for farmers
  isVerified: boolean;
  upiId?: string;
  email?: string;
  avatarUrl?: string;
  authProvider?: 'LOCAL' | 'GOOGLE';
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerVerified: boolean;
  category: CommodityCategory;
  title: {
    en: string;
    hi: string;
    kn: string;
  };
  description: {
    en: string;
    hi: string;
    kn: string;
  };
  photoUrl: string;
  harvestMonthYear: string; // e.g., "Oct 2026"
  qualityGrade: QualityGrade;
  shelfLifeMonths: number; // Must be >= 3
  availableStockKg: number;
  wholesaleBenchmarkPerKg: number; // e.g., 12 for peanuts
  marketRetailBenchmarkPerKg: number; // e.g., 38 for peanuts
  normalPricePerKg: number; // Option 1 price (e.g., 24)
  bulkPricePerKg: number; // Option 2 price (e.g., 22)
  bulkMinQuantityKg: number; // Minimum pool target (e.g., 50 kg)
  bulkMaxQuantityKg: number; // Maximum pool cap set by farmer (e.g., 150 kg)
  pickupLocationName: string;
  pickupPincode: string;
  pickupLat: number;
  pickupLng: number;
  homeDeliveryAvailable: boolean;
  deliveryBaseFee: number; // D_base in INR
  deliveryRatePerKm: number; // r_km in INR
  deliveryRatePerKg: number; // r_kg in INR
  maxDeliveryRadiusKm: number;
  isApprovedByAdmin: boolean;
  isAiVerified?: boolean;
  aiVerificationDetails?: {
    verdict: string;
    confidenceScore: number;
    aiLikelihoodPercentage: number;
    forensicAnalysis: string;
  };
}

export interface PoolParticipant {
  buyerId: string;
  buyerName: string;
  quantityKg: number;
  amountPaidEscrow: number;
  joinedAt: string;
}

export type PoolStatus = 'OPEN' | 'LOCKED_CONFIRMED' | 'EXPIRED_REFUNDED';

export interface GroupBuyPool {
  id: string;
  productId: string;
  hostBuyerId: string;
  hostBuyerName: string;
  localityName: string;
  localityPincode: string;
  dropOffAddress: string;
  targetQuantityKg: number;
  maxQuantityKg?: number;
  currentQuantityKg: number;
  unitBulkPrice: number;
  fulfillmentType: 'SELF_PICKUP' | 'HOME_DELIVERY';
  estimatedDeliveryFeeTotal: number;
  status: PoolStatus;
  expiresAt: string;
  participants: PoolParticipant[];
}

export type OrderType = 'NORMAL' | 'GROUP_BULK';
export type FulfillmentType = 'SELF_PICKUP' | 'HOME_DELIVERY';
export type FarmerDeliveryApproval = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type OrderStatus =
  | 'ESCROW_HELD'
  | 'AWAITING_POOL_COMPLETION'
  | 'CONFIRMED_PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED_INSPECTION_WINDOW'
  | 'COMPLETED_RELEASED_TO_FARMER'
  | 'DISPUTED_FROZEN'
  | 'REFUNDED_TO_BUYER';

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  productId: string;
  productTitle: { en: string; hi: string; kn: string };
  orderType: OrderType;
  poolId?: string;
  quantityKg: number;
  unitPriceApplied: number;
  subtotalAmount: number;
  fulfillmentType: FulfillmentType;
  farmerDeliveryApproval: FarmerDeliveryApproval;
  buyerAddress: string;
  distanceKm: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  deliveredAt?: string;
  escrowReleaseAt?: string; // deliveredAt + 24 hours
  disputeReason?: string;
  disputePhotoUrl?: string;
}

export type ReportCategory =
  | 'CROP_QUALITY_MOISTURE'
  | 'UNDERWEIGHT_DISCREPANCY'
  | 'PAYMENT_ESCROW_ISSUE'
  | 'FALSE_DISPUTE_CLAIM'
  | 'DELIVERY_TRANSPORT_ABUSE'
  | 'HARASSMENT_UNRESPONSIVE'
  | 'OTHER_COMPLAINT';

export type ReportSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';
export type ReportStatus = 'OPEN_PENDING' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'DISMISSED';

export interface PlatformReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  reporterPhone?: string;
  targetType: 'ORDER' | 'PRODUCT' | 'USER' | 'GENERAL';
  targetId?: string;
  targetName?: string;
  category: ReportCategory;
  severity: ReportSeverity;
  title: string;
  description: string;
  evidencePhotoUrl?: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}


