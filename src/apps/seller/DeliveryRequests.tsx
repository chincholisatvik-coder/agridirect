import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  CheckCircle,
  XCircle,
  Package,
  Calendar,
  IndianRupee,
  Phone,
  User,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { Order } from '../../types/agridirect';
import { ReportModal } from '../../components/ReportModal';

export const DeliveryRequests: React.FC = () => {
  const { orders, respondToDeliveryRequest, currentUser, language, t } = useAgridirect();
  const [reportOrder, setReportOrder] = useState<Order | null>(null);

  if (!currentUser) return null;

  // Filter orders for this farmer with pending delivery approval
  const pendingRequests = orders.filter(
    (order) =>
      order.farmerId === currentUser.id && order.farmerDeliveryApproval === 'PENDING'
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {t('deliveryRequestsTitle')}
            </h2>
            <p className="text-xs text-stone-500">
              Buyers requesting doorstep transport with automated distance surcharges
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-full border border-amber-200">
          {pendingRequests.length} Pending
        </span>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <Truck className="w-12 h-12 mx-auto stroke-1 mb-2 text-stone-300" />
          <p className="font-semibold text-sm">No pending home delivery requests</p>
          <p className="text-xs text-stone-400 mt-1">
            New doorstep requests will appear here for your approval
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingRequests.map((order) => {
            const cropTitle =
              language === 'hi'
                ? order.productTitle.hi
                : language === 'kn'
                ? order.productTitle.kn
                : order.productTitle.en;

            return (
              <div
                key={order.id}
                className="bg-stone-50 rounded-xl border border-stone-200 p-5 space-y-4 hover:shadow-md transition"
              >
                {/* Header & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">
                      Order #{order.id.slice(-6)}
                    </span>
                    <h3 className="font-bold text-stone-800 text-base">{cropTitle}</h3>
                    <div className="flex items-center text-xs text-stone-600 mt-0.5 space-x-2">
                      <span className="flex items-center">
                        <Package className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        {order.quantityKg} kg
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-stone-700" />
                        ₹{order.totalAmount}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg flex items-center">
                    Action Needed
                  </span>
                </div>

                {/* Buyer & Destination Details */}
                <div className="bg-white p-3.5 rounded-lg border border-stone-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-stone-700">
                    <span className="flex items-center font-semibold">
                      <User className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                      {order.buyerName}
                    </span>
                    <span className="flex items-center text-stone-500">
                      <Phone className="w-3 h-3 mr-1" />
                      Verified Buyer
                    </span>
                  </div>

                  <div className="flex items-start text-stone-600">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{order.buyerAddress}</span>
                  </div>

                  {/* Calculated Distance & Extra Payout */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px]">
                    <span className="text-stone-500">
                      Calculated Road Distance:{' '}
                      <strong className="text-stone-800">{order.distanceKm} km</strong>
                    </span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      +₹{order.deliveryFee} Extra Payout
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => respondToDeliveryRequest(order.id, 'APPROVED')}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('approveDelivery')}</span>
                  </button>

                  <button
                    onClick={() => respondToDeliveryRequest(order.id, 'REJECTED')}
                    className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs border border-stone-300 transition"
                  >
                    <XCircle className="w-4 h-4 text-stone-500" />
                    <span>{t('rejectDelivery')}</span>
                  </button>
                </div>

                {/* Farmer Report Option for Buyer Discrepancies */}
                <div className="pt-2 border-t border-stone-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setReportOrder(order)}
                    className="inline-flex items-center space-x-1 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Report Buyer / Transport Issue</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reportOrder && (
        <ReportModal
          isOpen={!!reportOrder}
          onClose={() => setReportOrder(null)}
          defaultTargetType="ORDER"
          defaultTargetId={reportOrder.id}
          defaultTargetName={`Delivery Request Order #${reportOrder.id.slice(0, 8)} (${reportOrder.buyerName})`}
        />
      )}
    </div>
  );
};

