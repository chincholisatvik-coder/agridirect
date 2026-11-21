import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Order, GroupBuyPool, User, PlatformReport } from '../types/agridirect';

// Reads from import.meta.env
const getSupabaseEnv = () => {
  const metaEnv = (import.meta as any).env || {};
  let url = metaEnv.VITE_SUPABASE_URL || '';
  let key = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}.supabase.co`;
  }

  return { url, key };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseEnv();
  return Boolean(url && key && url.includes('supabase.co'));
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseEnv();
  if (!url || !key) return null;

  if (!clientInstance) {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
};

export const supabase = getSupabaseClient();

/**
 * Product Database Sync
 */
export async function syncProductToDb(product: Product): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('products').upsert({
      id: product.id,
      farmer_id: product.farmerId,
      farmer_name: product.farmerName,
      farmer_phone: product.farmerPhone,
      farmer_verified: product.farmerVerified,
      category: product.category,
      title: product.title,
      description: product.description,
      photo_url: product.photoUrl,
      harvest_month_year: product.harvestMonthYear,
      quality_grade: product.qualityGrade,
      shelf_life_months: product.shelfLifeMonths,
      available_stock_kg: product.availableStockKg,
      wholesale_benchmark_per_kg: product.wholesaleBenchmarkPerKg,
      market_retail_benchmark_per_kg: product.marketRetailBenchmarkPerKg,
      normal_price_per_kg: product.normalPricePerKg,
      bulk_price_per_kg: product.bulkPricePerKg,
      bulk_min_quantity_kg: product.bulkMinQuantityKg,
      bulk_max_quantity_kg: product.bulkMaxQuantityKg,
      pickup_location_name: product.pickupLocationName,
      pickup_pincode: product.pickupPincode,
      pickup_lat: product.pickupLat,
      pickup_lng: product.pickupLng,
      home_delivery_available: product.homeDeliveryAvailable,
      delivery_base_fee: product.deliveryBaseFee,
      delivery_rate_per_km: product.deliveryRatePerKm,
      delivery_rate_per_kg: product.deliveryRatePerKg,
      max_delivery_radius_km: product.maxDeliveryRadiusKm,
      is_approved_by_admin: product.isApprovedByAdmin,
      is_ai_verified: product.isAiVerified ?? true,
      ai_verification_details: product.aiVerificationDetails,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Order Database Sync
 */
export async function syncOrderToDb(order: Order): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('orders').upsert({
      id: order.id,
      buyer_id: order.buyerId,
      buyer_name: order.buyerName,
      farmer_id: order.farmerId,
      farmer_name: order.farmerName,
      product_id: order.productId,
      product_title: order.productTitle,
      order_type: order.orderType,
      pool_id: order.poolId,
      quantity_kg: order.quantityKg,
      unit_price_applied: order.unitPriceApplied,
      subtotal_amount: order.subtotalAmount,
      fulfillment_type: order.fulfillmentType,
      farmer_delivery_approval: order.farmerDeliveryApproval,
      buyer_address: order.buyerAddress,
      distance_km: order.distanceKm,
      delivery_fee: order.deliveryFee,
      total_amount: order.totalAmount,
      status: order.status,
      created_at: order.createdAt,
      delivered_at: order.deliveredAt,
      escrow_release_at: order.escrowReleaseAt,
      dispute_reason: order.disputeReason,
      dispute_photo_url: order.disputePhotoUrl,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Group Buy Pool Database Sync
 */
export async function syncPoolToDb(pool: GroupBuyPool): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('group_buy_pools').upsert({
      id: pool.id,
      product_id: pool.productId,
      host_buyer_id: pool.hostBuyerId,
      host_buyer_name: pool.hostBuyerName,
      locality_name: pool.localityName,
      locality_pincode: pool.localityPincode,
      drop_off_address: pool.dropOffAddress,
      target_quantity_kg: pool.targetQuantityKg,
      max_quantity_kg: pool.maxQuantityKg,
      current_quantity_kg: pool.currentQuantityKg,
      unit_bulk_price: pool.unitBulkPrice,
      fulfillment_type: pool.fulfillmentType,
      estimated_delivery_fee_total: pool.estimatedDeliveryFeeTotal,
      status: pool.status,
      expires_at: pool.expiresAt,
      participants: pool.participants,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Platform Reports Sync
 */
export async function syncReportToDb(report: PlatformReport): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('platform_reports').upsert({
      id: report.id,
      reporter_id: report.reporterId,
      reporter_name: report.reporterName,
      reporter_role: report.reporterRole,
      reporter_phone: report.reporterPhone,
      target_type: report.targetType,
      target_id: report.targetId,
      target_name: report.targetName,
      category: report.category,
      severity: report.severity,
      title: report.title,
      description: report.description,
      evidence_photo_url: report.evidencePhotoUrl,
      status: report.status,
      admin_notes: report.adminNotes,
      created_at: report.createdAt,
      resolved_at: report.resolvedAt,
    });
    return !error;
  } catch {
    return false;
  }
}
