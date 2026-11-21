import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  IndianRupee,
  ExternalLink,
  ChevronDown,
  User,
  ArrowRight,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { Order } from '../../types/agridirect';
import { sanitizeUrl } from '../../utils/security';

export const EscrowLedger: React.FC = () => {
  const { orders, resolveEscrowAdmin, language, t } = useAgridirect();
  const [selectedDisputeOrder, setSelectedDisputeOrder] = useState<Order | null>(null);

  // Calculate live escrow total currently held in limbo
  const escrowHoldingOrders = orders.filter((o) =>
    ['ESCROW_HELD', 'AWAITING_POOL_COMPLETION', 'CONFIRMED_PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED_INSPECTION_WINDOW', 'DISPUTED_FROZEN'].includes(
      o.status
    )
  );

  const totalHeldInEscrow = escrowHoldingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
      {/* Header & Escrow Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">{t('escrowLedgerTitle')}</h2>
            <p className="text-xs text-stone-500">
              Zero middleman risk: payments held until 24 hours of successful buyer receipt
            </p>
          </div>
        </div>

        <div className="bg-emerald-950 text-white px-5 py-3 rounded-2xl flex items-center space-x-4">
          <div>
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
              Total Active Escrow Locked
            </span>
            <span className="text-xl font-black text-white">₹{totalHeldInEscrow}</span>
          </div>
          <span className="px-2.5 py-1 bg-emerald-800 text-emerald-200 text-xs font-bold rounded-lg">
            {escrowHoldingOrders.length} Held Orders
          </span>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const cropTitle =
            language === 'hi'
              ? order.productTitle.hi
              : language === 'kn'
              ? order.productTitle.kn
              : order.productTitle.en;

          const isDisputed = order.status === 'DISPUTED_FROZEN';
          const isReleased = order.status === 'COMPLETED_RELEASED_TO_FARMER';
          const isRefunded = order.status === 'REFUNDED_TO_BUYER';
          const isDeliveredWindow = order.status === 'DELIVERED_INSPECTION_WINDOW';

          return (
            <div
              key={order.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDisputed
                  ? 'bg-red-50/60 border-red-300 ring-2 ring-red-200'
                  : isReleased
                  ? 'bg-stone-50 border-stone-200'
                  : 'bg-white border-stone-200 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-stone-700">
                      #{order.id.slice(-8)}
                    </span>
                    <h3 className="font-black text-stone-950 text-base">{cropTitle}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isDisputed
                          ? 'bg-red-600 text-white animate-pulse'
                          : isReleased
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                          : isRefunded
                          ? 'bg-stone-200 text-stone-900 border border-stone-300'
                          : 'bg-amber-200 text-amber-950 border border-amber-300'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-700 pt-1">
                    <div>
                      <span className="text-stone-600 block text-[10px] font-bold uppercase">Buyer</span>
                      <strong className="text-stone-950 font-black">{order.buyerName}</strong>
                    </div>
                    <div>
                      <span className="text-stone-600 block text-[10px] font-bold uppercase">Farmer</span>
                      <strong className="text-stone-950 font-black">{order.farmerName}</strong>
                    </div>
                    <div>
                      <span className="text-stone-600 block text-[10px] font-bold uppercase">Weight & Type</span>
                      <strong className="text-stone-950 font-black">
                        {order.quantityKg} kg ({order.orderType})
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-600 block text-[10px] font-bold uppercase">Escrow Amount</span>
                      <strong className="text-emerald-900 font-black text-sm">₹{order.totalAmount}</strong>
                    </div>
                  </div>

                  {/* Disputed Information Details */}
                  {isDisputed && (
                    <div className="bg-red-100/70 border border-red-300 rounded-xl p-3 text-xs text-red-950 mt-2 space-y-1">
                      <p className="font-bold flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1 text-red-600 shrink-0" />
                        Dispute Reason Reported by Buyer:
                      </p>
                      <p className="italic text-red-900 pl-5">"{order.disputeReason}"</p>
                      {order.disputePhotoUrl && sanitizeUrl(order.disputePhotoUrl) && (
                        <div className="pl-5 pt-1">
                          <a
                            href={sanitizeUrl(order.disputePhotoUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-700 underline font-semibold flex items-center"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            View Buyer Photo Evidence
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {isDeliveredWindow && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>24-Hour Inspection Hold Active. Payout auto-releases tomorrow.</span>
                    </div>
                  )}
                </div>

                {/* Admin Arbitration Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {(isDisputed || isDeliveredWindow || order.status === 'ESCROW_HELD') && (
                    <>
                      <button
                        onClick={() => resolveEscrowAdmin(order.id, 'RELEASE_TO_FARMER')}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t('releasePayoutBtn')}</span>
                      </button>

                      <button
                        onClick={() => resolveEscrowAdmin(order.id, 'REFUND_BUYER')}
                        className="px-3.5 py-2 bg-stone-100 hover:bg-red-100 text-stone-700 hover:text-red-800 border border-stone-300 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{t('refundBuyerBtn')}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

