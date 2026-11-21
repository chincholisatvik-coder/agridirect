import React, { useState } from 'react';
import {
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Truck,
  MapPin,
  X,
  Camera,
  ExternalLink,
  ChevronRight,
  IndianRupee,
  FileText,
  Printer,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { Order } from '../../types/agridirect';
import { EReceiptModal } from './EReceiptModal';
import { ReportModal } from '../../components/ReportModal';
import { sanitizeUrl } from '../../utils/security';

export const BuyerOrdersView: React.FC = () => {
  const {
    orders,
    currentUser,
    confirmOrderReceipt,
    raiseOrderDispute,
    language,
    t,
  } = useAgridirect();

  const [disputeOrder, setDisputeOrder] = useState<Order | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputePhotoUrl, setDisputePhotoUrl] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [reportingOrder, setReportingOrder] = useState<Order | null>(null);

  // Orders for current buyer
  const buyerOrders = orders.filter((o) => o.buyerId === currentUser?.id);

  const handleOpenDispute = (order: Order) => {
    setDisputeOrder(order);
    setDisputeReason('Moisture detected and bag underweight by 1.2 kg upon digital scale test.');
    setDisputePhotoUrl('https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80');
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrder || !disputeReason.trim()) return;

    raiseOrderDispute(disputeOrder.id, disputeReason, disputePhotoUrl);
    setDisputeOrder(null);
  };

  const renderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'ESCROW_HELD':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1" />
            {t('statusEscrowHeld')}
          </span>
        );
      case 'AWAITING_POOL_COMPLETION':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1" />
            {t('statusAwaitingPool')}
          </span>
        );
      case 'CONFIRMED_PREPARING':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold flex items-center">
            <Package className="w-3.5 h-3.5 mr-1" />
            {t('statusConfirmed')}
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {t('statusReadyPickup')}
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold flex items-center">
            <Truck className="w-3.5 h-3.5 mr-1" />
            {t('statusOutForDelivery')}
          </span>
        );
      case 'DELIVERED_INSPECTION_WINDOW':
        return (
          <span className="px-2.5 py-1 bg-amber-500 text-stone-900 rounded-lg text-xs font-extrabold flex items-center animate-pulse">
            <Clock className="w-3.5 h-3.5 mr-1 text-stone-900" />
            {t('statusInspectionWindow')}
          </span>
        );
      case 'COMPLETED_RELEASED_TO_FARMER':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            {t('statusReleasedFarmer')}
          </span>
        );
      case 'DISPUTED_FROZEN':
        return (
          <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600" />
            {t('statusDisputedFrozen')}
          </span>
        );
      case 'REFUNDED_TO_BUYER':
        return (
          <span className="px-2.5 py-1 bg-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {t('statusRefundedBuyer')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3 sm:pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 flex items-center">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-emerald-700" />
            {t('myOrdersTitle')}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Track farm harvests, delivery approval, and inspect goods safely under 24h Escrow Protection.
          </p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 bg-stone-100 text-stone-800 font-bold text-xs rounded-full border border-stone-200">
          {buyerOrders.length} Total Orders
        </span>
      </div>

      {buyerOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-stone-400">
          <Package className="w-12 h-12 mx-auto stroke-1 mb-2 text-stone-300" />
          <p className="font-semibold text-sm">No orders placed yet</p>
          <p className="text-xs text-stone-400 mt-1">
            Browse the fresh harvest catalog and buy direct from farmers.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {buyerOrders.map((order) => {
            const cropTitle =
              language === 'hi'
                ? order.productTitle.hi
                : language === 'kn'
                ? order.productTitle.kn
                : order.productTitle.en;

            const isInInspectionWindow =
              order.status === 'DELIVERED_INSPECTION_WINDOW';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition space-y-3.5 sm:space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-stone-700 font-black">
                        #{order.id.slice(-8)}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 bg-stone-200 text-stone-900 rounded-md font-bold">
                        {order.orderType === 'GROUP_BULK' ? 'Group Bulk Pool' : 'Normal Buy'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-stone-950">{cropTitle}</h3>
                    <p className="text-xs text-stone-700 font-medium">
                      Farmer: <strong className="text-stone-950 font-bold">{order.farmerName}</strong>
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end space-y-1">
                    {renderStatusBadge(order.status)}
                    <span className="text-[11px] text-stone-600 font-semibold">
                      Placed: {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Breakdown details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-stone-100/70 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-200 text-xs">
                  <div>
                    <span className="text-stone-700 font-black block uppercase text-[10px]">
                      Weight & Pricing
                    </span>
                    <p className="font-black text-stone-950 text-sm mt-0.5">
                      {order.quantityKg} kg @ ₹{order.unitPriceApplied}/kg
                    </p>
                    <p className="text-stone-700 font-semibold mt-0.5">Subtotal: ₹{order.subtotalAmount}</p>
                  </div>

                  <div>
                    <span className="text-stone-700 font-black block uppercase text-[10px]">
                      Fulfillment Method
                    </span>
                    <p className="font-black text-stone-950 text-sm mt-0.5">
                      {order.fulfillmentType === 'HOME_DELIVERY' ? 'Doorstep Delivery' : 'Self-Pickup'}
                    </p>
                    <p className="text-stone-700 font-semibold mt-0.5">
                      Transport Fee: {order.deliveryFee > 0 ? `₹${order.deliveryFee}` : 'Free (₹0)'}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-stone-700 font-black block uppercase text-[10px]">
                      Total Escrow Payment
                    </span>
                    <p className="font-black text-emerald-900 text-lg mt-0.5">
                      ₹{order.totalAmount}
                    </p>
                    <span className="text-[10px] text-emerald-800 font-extrabold">
                      Protected in Escrow
                    </span>
                  </div>
                </div>

                {/* Delivery Address & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-700 border-t border-stone-200 pt-3">
                  <div className="flex items-start space-x-1.5 flex-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-stone-950">Address:</strong> {order.buyerAddress}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setReceiptOrder(order)}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-2 border-emerald-300 rounded-xl font-bold transition shadow-sm active:scale-95 min-h-[40px]"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-800" />
                      <span>View E-Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportingOrder(order)}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-950 border-2 border-red-300 rounded-xl font-bold transition shadow-sm active:scale-95 min-h-[40px]"
                      title="Report an issue or dispute for this order"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
                      <span>Report Issue</span>
                    </button>
                  </div>
                </div>

                {/* 24-Hour Inspection Active Actions */}
                {isInInspectionWindow && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center space-x-2 text-amber-950 font-bold text-xs">
                        <Clock className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                        <span>24-Hour Quality Inspection Window Active</span>
                      </div>
                      <span className="text-[11px] text-amber-800 font-mono font-bold">
                        Auto-releases in ~22 hrs
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Please inspect the weight, dryness, and grain purity. If satisfactory, confirm
                      good quality to release the payout to the farmer immediately. If there is any
                      issue, report a dispute to freeze the escrow funds.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        onClick={() => confirmOrderReceipt(order.id)}
                        className="flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition active:scale-95 min-h-[44px]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('confirmReceiptBtn')}</span>
                      </button>

                      <button
                        onClick={() => handleOpenDispute(order)}
                        className="flex items-center justify-center space-x-2 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-red-700 border border-red-300 rounded-xl text-xs font-bold transition active:scale-95 min-h-[44px]"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>{t('raiseDisputeBtn')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Disputed details if already frozen */}
                {order.status === 'DISPUTED_FROZEN' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Dispute Under Admin Review (Escrow Frozen)</span>
                    </div>
                    <p className="text-stone-700">
                      <strong>Reported Reason:</strong> {order.disputeReason}
                    </p>
                    {order.disputePhotoUrl && sanitizeUrl(order.disputePhotoUrl) && (
                      <a
                        href={sanitizeUrl(order.disputePhotoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-700 underline font-medium inline-block mt-1"
                      >
                        View Attached Evidence Photo
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Raise Dispute Modal */}
      {disputeOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-0 sm:my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="bg-red-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-300 shrink-0" />
                <h3 className="font-bold text-sm sm:text-base">{t('disputeModalTitle')}</h3>
              </div>
              <button
                onClick={() => setDisputeOrder(null)}
                className="p-1.5 text-red-200 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="p-4 sm:p-6 space-y-4">
              <p className="text-xs text-stone-600">
                Filing a dispute immediately freezes the escrow payout to the farmer. The
                Agridirect Admin authority will arbitrate based on inspection evidence.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t('disputeReasonPrompt')}
                </label>
                <textarea
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  {t('disputePhotoPrompt')}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={disputePhotoUrl}
                    onChange={(e) => setDisputePhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDisputePhotoUrl(
                        'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80'
                      )
                    }
                    className="px-3 py-1.5 bg-stone-100 text-stone-700 font-semibold text-xs rounded-lg flex items-center space-x-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Sample Photo</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setDisputeOrder(null)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md transition"
                >
                  {t('submitDispute')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Order E-Receipt Modal */}
      <EReceiptModal
        order={receiptOrder}
        isOpen={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />

      {/* Incident / Dispute Reporting Modal */}
      {reportingOrder && (
        <ReportModal
          isOpen={!!reportingOrder}
          onClose={() => setReportingOrder(null)}
          defaultTargetType="ORDER"
          defaultTargetId={reportingOrder.id}
          defaultTargetName={`Order #${reportingOrder.id.slice(0, 8)} (${
            language === 'hi'
              ? reportingOrder.productTitle.hi
              : language === 'kn'
              ? reportingOrder.productTitle.kn
              : reportingOrder.productTitle.en
          })`}
        />
      )}
    </div>
  );
};

