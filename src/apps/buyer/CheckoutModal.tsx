import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Users,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Copy,
  Check,
  FileText,
  Calendar,
  Building,
  Phone,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { Product, GroupBuyPool, Order } from '../../types/agridirect';
import {
  calculateHaversineDistance,
  calculateDeliveryFee,
  calculateGroupSplitPayment,
} from '../../utils/pricing';

interface CheckoutModalProps {
  product: Product | null;
  initialMode?: 'NORMAL' | 'GROUP_BULK';
  targetPool?: GroupBuyPool | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  initialMode = 'NORMAL',
  targetPool = null,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language, t, currentUser, pools, placeNormalOrder, joinOrCreateGroupPool } =
    useAgridirect();

  const [mode, setMode] = useState<'NORMAL' | 'GROUP_BULK'>(initialMode);
  const [fulfillmentType, setFulfillmentType] = useState<'SELF_PICKUP' | 'HOME_DELIVERY'>('HOME_DELIVERY');
  const [quantityKg, setQuantityKg] = useState<number>(5);

  // Group Pool details
  const [selectedPoolId, setSelectedPoolId] = useState<string>(targetPool?.id || '');
  const [localityName, setLocalityName] = useState('Vidyanagar Apartment Association');
  const [localityPincode, setLocalityPincode] = useState('580021');
  const [dropOffAddress, setDropOffAddress] = useState(
    'B-Block Security Desk, Crystal Palms, Vidyanagar, Hubballi'
  );

  // Buyer Delivery Address
  const [buyerAddress, setBuyerAddress] = useState(
    currentUser?.locationName
      ? `${currentUser.locationName}${currentUser.pincode ? ' - ' + currentUser.pincode : ''}`
      : 'Flat 402, Crystal Palms, Vidyanagar, Hubballi - 580021'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setOrderConfirmed(false);
    setCreatedOrder(null);
    if (targetPool) {
      setSelectedPoolId(targetPool.id);
      setLocalityName(targetPool.localityName);
      setLocalityPincode(targetPool.localityPincode);
      setDropOffAddress(targetPool.dropOffAddress);
      setQuantityKg(12);
    } else {
      setQuantityKg(initialMode === 'NORMAL' ? 5 : 10);
    }
  }, [initialMode, targetPool, isOpen]);

  if (!isOpen || !product) return null;

  const title =
    language === 'hi'
      ? product.title.hi
      : language === 'kn'
      ? product.title.kn
      : product.title.en;

  // Active pools for this product
  const activePoolsForProduct = pools.filter(
    (p) => p.productId === product.id && p.status === 'OPEN'
  );

  // Road distance
  const distanceKm = calculateHaversineDistance(
    currentUser?.lat || 15.3715,
    currentUser?.lng || 75.1235,
    product.pickupLat || 15.3647,
    product.pickupLng || 75.1240
  );

  // Pricing calculations
  const unitPrice =
    mode === 'NORMAL' ? product.normalPricePerKg : product.bulkPricePerKg;
  const subtotal = quantityKg * unitPrice;

  // Delivery fee calculation
  let deliveryFee = 0;
  if (fulfillmentType === 'HOME_DELIVERY') {
    if (mode === 'NORMAL') {
      deliveryFee = calculateDeliveryFee(
        'HOME_DELIVERY',
        distanceKm,
        quantityKg,
        product.deliveryBaseFee,
        product.deliveryRatePerKm,
        product.deliveryRatePerKg
      );
    } else {
      const poolTarget =
        targetPool?.targetQuantityKg || product.bulkMinQuantityKg;
      const split = calculateGroupSplitPayment(
        quantityKg,
        poolTarget,
        product.bulkPricePerKg,
        65
      );
      deliveryFee = split.deliveryShare;
    }
  }

  const totalAmount = subtotal + deliveryFee;

  // Determine max quantity allowed based on mode and farmer bulk cap
  const currentSelectedPool = pools.find((p) => p.id === selectedPoolId);
  const poolCapKg = currentSelectedPool?.maxQuantityKg || product.bulkMaxQuantityKg;
  const currentPoolQty = currentSelectedPool?.currentQuantityKg || 0;
  const remainingPoolCap = Math.max(1, poolCapKg - currentPoolQty);
  const maxBuyableKg =
    mode === 'GROUP_BULK'
      ? Math.min(product.availableStockKg, remainingPoolCap)
      : Math.min(product.availableStockKg, 100);

  const handleConfirmOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      try {
        let placed: Order;
        if (mode === 'NORMAL') {
          placed = placeNormalOrder({
            productId: product.id,
            quantityKg,
            fulfillmentType,
            buyerAddress:
              fulfillmentType === 'HOME_DELIVERY'
                ? buyerAddress
                : `Self-Pickup at ${product.pickupLocationName}`,
            distanceKm: fulfillmentType === 'HOME_DELIVERY' ? distanceKm : 0,
            deliveryFee,
          });
        } else {
          const res = joinOrCreateGroupPool({
            poolId: selectedPoolId || undefined,
            productId: product.id,
            localityName,
            localityPincode,
            dropOffAddress,
            targetQuantityKg: product.bulkMinQuantityKg,
            quantityKg,
            fulfillmentType,
          });
          placed = res.order;
        }

        setIsSubmitting(false);
        setCreatedOrder(placed);
        setOrderConfirmed(true);
        onSuccess();
      } catch (err) {
        setIsSubmitting(false);
      }
    }, 500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReceipt = () => {
    if (!createdOrder) return;
    const text = `Agridirect Official E-Receipt\nReceipt No: AGR-REC-2026-${createdOrder.id.slice(-6).toUpperCase()}\nOrder ID: ${createdOrder.id}\nItem: ${title} (${createdOrder.quantityKg} kg)\nAmount: ₹${createdOrder.totalAmount}\nFarmer: ${createdOrder.farmerName}\nStatus: Escrow Secured`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/75 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-0 sm:my-6 print:shadow-none print:border-none print:m-0 print:rounded-none max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="no-print bg-gradient-to-r from-emerald-800 to-emerald-950 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-700/50 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {orderConfirmed ? 'Order Confirmed · Official E-Receipt' : 'Secure Escrow Checkout'}
              </h2>
              <p className="text-xs text-emerald-200/90">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderConfirmed && createdOrder ? (
          /* ========================================================= */
          /* GENERATED E-RECEIPT & COMPREHENSIVE ORDER SUMMARY VIEW   */
          /* ========================================================= */
          <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto bg-white" id="agridirect-e-receipt">
            {/* Success Notification Bar (no-print) */}
            <div className="no-print bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-950">Payment Secured in 24h Escrow!</h3>
                  <p className="text-xs text-emerald-700">
                    Your payment of <strong>₹{createdOrder.totalAmount}</strong> is protected. Funds release only after inspection.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs flex items-center space-x-1 transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>

            {/* Official Agricultural E-Receipt Document */}
            <div className="border border-stone-200 rounded-2xl p-5 sm:p-6 bg-white space-y-5">
              {/* Receipt Header */}
              <div className="border-b-2 border-emerald-800 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🌾</span>
                    <div>
                      <h1 className="text-base font-black tracking-tight text-emerald-950 uppercase">
                        AGRIDIRECT KARNATAKA
                      </h1>
                      <p className="text-[10px] text-stone-500 font-semibold">
                        Direct Farmgate Escrow Settlement Network
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <ShieldCheck className="w-3 h-3 mr-1 text-emerald-700" />
                      PAID • 24H ESCROW SECURED
                    </span>
                    <p className="text-[9px] text-stone-400 font-mono mt-0.5">
                      Tx: 0x{createdOrder.id.slice(-8)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-50 rounded-xl p-2.5 border border-stone-200 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-500 block">Receipt No</span>
                    <span className="font-extrabold text-stone-900 font-mono text-[11px]">
                      AGR-REC-2026-{createdOrder.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-500 block">Order ID</span>
                    <span className="font-extrabold text-stone-900 font-mono text-[11px]">
                      {createdOrder.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-500 block">Date & Time</span>
                    <span className="font-semibold text-stone-800 text-[11px]">
                      {new Date(createdOrder.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-500 block">Payment Method</span>
                    <span className="font-semibold text-emerald-700 text-[11px]">UPI / Escrow</span>
                  </div>
                </div>
              </div>

              {/* Farmer & Buyer Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-stone-200 p-3 bg-stone-50/50 space-y-1">
                  <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block">
                    Farmer / Producer Details
                  </span>
                  <p className="font-extrabold text-stone-900 text-xs">{createdOrder.farmerName}</p>
                  <p className="text-stone-600 text-[11px] flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                    {product.pickupLocationName}
                  </p>
                  <p className="text-stone-600 text-[11px] flex items-center">
                    <Phone className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                    {product.farmerPhone || '+91 98450 12890'}
                  </p>
                  <p className="text-[10px] text-emerald-800 font-semibold pt-0.5">
                    ✓ Bhoomi RTC Record Verified (KA-RTC-2026)
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200 p-3 bg-stone-50/50 space-y-1">
                  <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block">
                    Buyer & Delivery Details
                  </span>
                  <p className="font-extrabold text-stone-900 text-xs">{createdOrder.buyerName}</p>
                  <p className="text-stone-600 text-[11px] flex items-start">
                    <MapPin className="w-3 h-3 mr-1 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{createdOrder.buyerAddress}</span>
                  </p>
                  <p className="text-[10px] text-stone-500 pt-0.5">
                    Fulfillment: <strong className="text-stone-800">{createdOrder.fulfillmentType === 'HOME_DELIVERY' ? 'Doorstep Delivery' : 'Self-Pickup at Farmgate'}</strong>
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="rounded-xl border border-stone-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3 text-center">Quality Grade</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-stone-900 block">{title}</span>
                        <span className="text-[10px] text-stone-500">
                          {product.category.replace(/_/g, ' ')} · Shelf life: {product.shelfLifeMonths}m
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[10px] font-semibold text-stone-700">
                          {product.qualityGrade.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-stone-900">
                        {createdOrder.quantityKg} kg
                      </td>
                      <td className="py-2.5 px-3 text-right text-stone-700">
                        ₹{createdOrder.unitPriceApplied}/kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-stone-900">
                        ₹{createdOrder.subtotalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-stone-50 border-t border-stone-200 divide-y divide-stone-100 text-xs">
                    <tr>
                      <td colSpan={4} className="py-1.5 px-3 text-right text-stone-500 font-medium">
                        Subtotal:
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-stone-900">
                        ₹{createdOrder.subtotalAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-1.5 px-3 text-right text-stone-500 font-medium">
                        Logistics / Delivery Fee:
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-stone-900">
                        {createdOrder.deliveryFee > 0 ? `₹${createdOrder.deliveryFee.toFixed(2)}` : 'FREE (Self-Pickup)'}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-1.5 px-3 text-right text-stone-500 font-medium">
                        Middleman Commission:
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-emerald-700">
                        ₹0.00 (Zero Middleman)
                      </td>
                    </tr>
                    <tr className="bg-emerald-50">
                      <td colSpan={4} className="py-2 px-3 text-right font-black text-emerald-950">
                        Grand Total Escrow Paid:
                      </td>
                      <td className="py-2 px-3 text-right font-black text-emerald-900 text-sm">
                        ₹{createdOrder.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Simulated QR Code & Escrow Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 rounded-xl p-3 border border-stone-200 items-center">
                <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-stone-200">
                  <svg viewBox="0 0 100 100" className="w-20 h-20 text-stone-900" fill="currentColor">
                    <rect x="10" y="10" width="24" height="24" rx="3" fill="#113C2E" />
                    <rect x="14" y="14" width="16" height="16" rx="2" fill="#FFFFFF" />
                    <rect x="18" y="18" width="8" height="8" rx="1" fill="#113C2E" />
                    <rect x="66" y="10" width="24" height="24" rx="3" fill="#113C2E" />
                    <rect x="70" y="14" width="16" height="16" rx="2" fill="#FFFFFF" />
                    <rect x="74" y="18" width="8" height="8" rx="1" fill="#113C2E" />
                    <rect x="10" y="66" width="24" height="24" rx="3" fill="#113C2E" />
                    <rect x="14" y="70" width="16" height="16" rx="2" fill="#FFFFFF" />
                    <rect x="18" y="74" width="8" height="8" rx="1" fill="#113C2E" />
                    <rect x="42" y="12" width="6" height="6" fill="#113C2E" />
                    <rect x="52" y="12" width="6" height="6" fill="#113C2E" />
                    <rect x="42" y="24" width="6" height="6" fill="#113C2E" />
                    <rect x="52" y="24" width="6" height="6" fill="#113C2E" />
                    <rect x="40" y="48" width="8" height="8" rx="1" fill="#047857" />
                    <rect x="54" y="48" width="8" height="8" rx="1" fill="#047857" />
                    <rect x="44" y="64" width="12" height="6" fill="#113C2E" />
                    <rect x="64" y="64" width="6" height="12" fill="#113C2E" />
                  </svg>
                  <span className="text-[8px] font-mono font-bold text-stone-500 mt-0.5 uppercase">
                    Escrow QR Verify
                  </span>
                </div>

                <div className="sm:col-span-2 space-y-1 text-xs text-stone-600">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>24h Post-Delivery Escrow Guarantee</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Funds remain protected in the Agridirect escrow account. Inspect your crop upon delivery. If moisture or weight fails digital scale testing, you can freeze payout with 1 click.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions (no-print) */}
            <div className="no-print pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200">
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="w-full sm:w-auto px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition flex items-center justify-center space-x-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Reference Copied' : 'Copy Reference'}</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-stone-900 hover:bg-stone-950 text-white rounded-xl text-xs font-bold transition"
                >
                  Close & Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* CHECKOUT CONFIGURATION & INTERACTIVE ORDER SUMMARY FORM   */
          /* ========================================================= */
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Purchase Mode Toggle */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Purchase Mode:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('NORMAL')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    mode === 'NORMAL'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                      : 'border-stone-300 hover:border-stone-400 text-stone-700 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    <span className="font-black text-xs text-stone-900">{t('normalBuyLabel')}</span>
                  </div>
                  <span className="text-lg font-black text-emerald-900 mt-2">
                    ₹{product.normalPricePerKg}/kg
                  </span>
                  <span className="text-[11px] font-bold text-stone-600">
                    Buy any amount (from 1 kg) immediately
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('GROUP_BULK')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    mode === 'GROUP_BULK'
                      ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm'
                      : 'border-stone-300 hover:border-stone-400 text-stone-700 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-amber-700" />
                    <span className="font-black text-xs text-stone-900">{t('bulkBuyLabel')}</span>
                  </div>
                  <span className="text-lg font-black text-amber-950 mt-2">
                    ₹{product.bulkPricePerKg}/kg
                  </span>
                  <span className="text-[11px] font-bold text-amber-900">
                    Pool with neighbors for extra ~10% bulk discount
                  </span>
                </button>
              </div>
            </div>

            {/* If GROUP_BULK: Choose Existing Pool or Start New Pool */}
            {mode === 'GROUP_BULK' && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  Select Community Pool:
                </span>

                {activePoolsForProduct.length > 0 && (
                  <div className="space-y-2">
                    {activePoolsForProduct.map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          selectedPoolId === p.id
                            ? 'bg-white border-amber-500 shadow-sm'
                            : 'bg-white/60 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="activePool"
                            checked={selectedPoolId === p.id}
                            onChange={() => {
                              setSelectedPoolId(p.id);
                              setLocalityName(p.localityName);
                              setLocalityPincode(p.localityPincode);
                              setDropOffAddress(p.dropOffAddress);
                            }}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-bold text-xs text-stone-800 block">
                              {p.localityName}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {p.currentQuantityKg} / {p.targetQuantityKg} kg pledged (
                              {p.participants.length} neighbors)
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded">
                          {p.targetQuantityKg - p.currentQuantityKg} kg needed
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <label className="flex items-center space-x-2 pt-1 text-xs font-semibold text-amber-950 cursor-pointer">
                  <input
                    type="radio"
                    name="activePool"
                    checked={selectedPoolId === ''}
                    onChange={() => setSelectedPoolId('')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Start a New Neighborhood Pool for your building / locality</span>
                </label>

                {selectedPoolId === '' && (
                  <div className="space-y-2 pt-2 border-t border-amber-200 text-xs">
                    <div>
                      <span className="text-stone-600 block mb-0.5">Locality / Society Name</span>
                      <input
                        type="text"
                        value={localityName}
                        onChange={(e) => setLocalityName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-lg bg-white"
                        placeholder="e.g. Vidyanagar Apartment Association"
                      />
                    </div>
                    <div>
                      <span className="text-stone-600 block mb-0.5">Drop-Off Point / Address</span>
                      <input
                        type="text"
                        value={dropOffAddress}
                        onChange={(e) => setDropOffAddress(e.target.value)}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-lg bg-white"
                        placeholder="e.g. Society Gate / Security Desk"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  {t('quantityToBuy')}:
                </label>
                <span className="text-xs text-stone-500">
                  Stock Available: <strong>{product.availableStockKg} kg</strong>
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="1"
                  max={maxBuyableKg}
                  value={Math.min(quantityKg, maxBuyableKg)}
                  onChange={(e) => setQuantityKg(parseInt(e.target.value, 10) || 1)}
                  className="flex-1 accent-emerald-600"
                />
                <div className="flex items-center space-x-1 border border-stone-300 rounded-xl px-3 py-1.5 bg-stone-50">
                  <input
                    type="number"
                    min="1"
                    max={maxBuyableKg}
                    value={Math.min(quantityKg, maxBuyableKg)}
                    onChange={(e) => setQuantityKg(parseInt(e.target.value, 10) || 1)}
                    className="w-16 font-extrabold text-stone-900 text-center bg-transparent focus:outline-none"
                  />
                  <span className="text-xs font-bold text-stone-500">kg</span>
                </div>
              </div>

              {/* Farmer Min / Max Bulk Limits Notice */}
              {mode === 'GROUP_BULK' && (
                <div className="mt-2 bg-amber-50 border border-amber-200/90 rounded-xl p-2.5 text-[11px] text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>
                    Farmer Bulk Limits: <strong>Min {product.bulkMinQuantityKg} kg</strong> (unlock threshold) • <strong>Max {product.bulkMaxQuantityKg} kg</strong> (pool cap)
                  </span>
                  <span className="font-bold text-amber-950 bg-amber-200/70 px-2 py-0.5 rounded">
                    {remainingPoolCap} kg room remaining
                  </span>
                </div>
              )}
            </div>

            {/* Fulfillment Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                {t('selectFulfillment')}:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('SELF_PICKUP')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition ${
                    fulfillmentType === 'SELF_PICKUP'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                      : 'border-stone-300 hover:border-stone-400 text-stone-700 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-stone-900">{t('selfPickupOption')}</span>
                    <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-950 text-[10px] font-black rounded-md border border-emerald-300">
                      ₹0 FREE
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium mt-2 line-clamp-2">
                    Pick up from: {product.pickupLocationName}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType('HOME_DELIVERY')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition ${
                    fulfillmentType === 'HOME_DELIVERY'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                      : 'border-stone-300 hover:border-stone-400 text-stone-700 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-stone-900">{t('homeDeliveryOption')}</span>
                    <span className="px-2.5 py-0.5 bg-stone-200 text-stone-900 text-[10px] font-black rounded-md border border-stone-300">
                      +₹{deliveryFee}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium mt-2">
                    Doorstep transport ({distanceKm} km from farm)
                  </p>
                </button>
              </div>

              {fulfillmentType === 'HOME_DELIVERY' && mode === 'NORMAL' && (
                <div className="mt-3">
                  <span className="text-xs font-bold text-stone-800 block mb-1">
                    Your Delivery Address:
                  </span>
                  <input
                    type="text"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:outline-none focus:border-emerald-700"
                    required
                  />
                  <p className="text-[11px] text-stone-500 font-medium mt-1">
                    * Note: Home Delivery is subject to farmer route approval in their dashboard.
                  </p>
                </div>
              )}
            </div>

            {/* Escrow Guarantee Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{t('escrowNotice')}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Your funds are locked in Escrow. If there is any weight deficit or quality issue,
                  you have 24 hours after delivery to freeze the payout or report an issue.
                </p>
              </div>
            </div>

            {/* Interactive Order Summary Card */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-bold uppercase tracking-wider text-stone-700 flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-emerald-700" />
                  Live Order Summary
                </span>
                <span className="text-[10px] text-stone-500">
                  {mode === 'NORMAL' ? 'Individual Direct Order' : 'Group Pool Order'}
                </span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>
                  Crop Subtotal ({quantityKg} kg × ₹{unitPrice}/kg):
                </span>
                <span className="font-bold text-stone-800">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>
                  {fulfillmentType === 'HOME_DELIVERY'
                    ? `${t('deliveryFeeLabel')} (${distanceKm} km)`
                    : 'Self-Pickup'}:
                </span>
                <span className="font-bold text-stone-800">
                  {deliveryFee === 0 ? '₹0.00' : `₹${deliveryFee.toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between text-emerald-700 font-medium">
                <span>24-Hour Escrow Quality Guarantee:</span>
                <span className="font-bold">INCLUDED (FREE)</span>
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-extrabold text-stone-900 text-sm">
                  {t('totalToPay')}:
                </span>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-800">₹{totalAmount.toFixed(2)}</span>
                  <span className="block text-[10px] text-stone-500 font-medium">Escrow Protected</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-stone-300 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
              >
                {t('cancel')}
              </button>

              <button
                type="button"
                disabled={isSubmitting || (mode === 'GROUP_BULK' && remainingPoolCap <= 0)}
                onClick={handleConfirmOrder}
                className={`flex-2 w-full py-3.5 rounded-xl text-xs font-extrabold shadow-lg transition flex items-center justify-center space-x-1.5 ${
                  isSubmitting || (mode === 'GROUP_BULK' && remainingPoolCap <= 0)
                    ? 'bg-stone-400 text-stone-200 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20 text-white active:scale-98'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {mode === 'GROUP_BULK' && remainingPoolCap <= 0
                    ? 'Pool Capacity Full'
                    : isSubmitting
                    ? 'Securing Escrow & Generating E-Receipt...'
                    : `${t('confirmPayEscrow')} (₹${totalAmount.toFixed(2)})`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
