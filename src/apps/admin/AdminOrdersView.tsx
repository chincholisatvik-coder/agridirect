import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  MapPin,
  Printer,
  FileText,
  IndianRupee,
  Users,
  ShoppingBag,
  Filter,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { Order, OrderStatus, OrderType } from '../../types/agridirect';
import { EReceiptModal } from '../buyer/EReceiptModal';

export const AdminOrdersView: React.FC = () => {
  const { orders, products, resolveEscrowAdmin, language, t } = useAgridirect();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOrderType, setSelectedOrderType] = useState<string>('ALL');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Financial Statistics
  const totalVolumeKg = orders.reduce((sum, o) => sum + o.quantityKg, 0);
  const totalTransactedRupees = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const activeEscrowAmount = orders
    .filter((o) =>
      [
        'ESCROW_HELD',
        'AWAITING_POOL_COMPLETION',
        'CONFIRMED_PREPARING',
        'READY_FOR_PICKUP',
        'OUT_FOR_DELIVERY',
        'DELIVERED_INSPECTION_WINDOW',
        'DISPUTED_FROZEN',
      ].includes(o.status)
    )
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const disputedCount = orders.filter((o) => o.status === 'DISPUTED_FROZEN').length;

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Order type match
      if (selectedOrderType !== 'ALL' && o.orderType !== selectedOrderType) {
        return false;
      }

      // Status match
      if (selectedStatus !== 'ALL' && o.status !== selectedStatus) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const idMatch = o.id.toLowerCase().includes(query);
        const buyerMatch = o.buyerName.toLowerCase().includes(query);
        const farmerMatch = o.farmerName.toLowerCase().includes(query);
        const titleMatch =
          o.productTitle.en.toLowerCase().includes(query) ||
          o.productTitle.hi.toLowerCase().includes(query) ||
          o.productTitle.kn.toLowerCase().includes(query);
        const addrMatch = o.buyerAddress.toLowerCase().includes(query);
        return idMatch || buyerMatch || farmerMatch || titleMatch || addrMatch;
      }

      return true;
    });
  }, [orders, selectedOrderType, selectedStatus, searchQuery]);

  const renderStatusPill = (status: OrderStatus) => {
    switch (status) {
      case 'ESCROW_HELD':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-max">
            <Clock className="w-3 h-3 mr-1 text-blue-600" />
            Escrow Held
          </span>
        );
      case 'AWAITING_POOL_COMPLETION':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-max">
            <Clock className="w-3 h-3 mr-1 text-amber-700" />
            Awaiting Pool
          </span>
        );
      case 'CONFIRMED_PREPARING':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-max">
            <Package className="w-3 h-3 mr-1 text-purple-600" />
            Farm Packing
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-max">
            <MapPin className="w-3 h-3 mr-1 text-indigo-600" />
            Ready for Pickup
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-max">
            <Truck className="w-3 h-3 mr-1 text-amber-600" />
            Out for Delivery
          </span>
        );
      case 'DELIVERED_INSPECTION_WINDOW':
        return (
          <span className="px-2.5 py-1 bg-amber-500 text-stone-900 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-max animate-pulse">
            <Clock className="w-3 h-3 mr-1 text-stone-900" />
            24h Inspection Window
          </span>
        );
      case 'COMPLETED_RELEASED_TO_FARMER':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-max">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Released to Farmer
          </span>
        );
      case 'DISPUTED_FROZEN':
        return (
          <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-max animate-bounce">
            <AlertTriangle className="w-3 h-3 mr-1 text-red-600" />
            Escrow Frozen
          </span>
        );
      case 'REFUNDED_TO_BUYER':
        return (
          <span className="px-2.5 py-1 bg-stone-200 text-stone-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center w-max">
            <CheckCircle2 className="w-3 h-3 mr-1 text-stone-600" />
            Refunded
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Transaction KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">Total Orders</span>
            <Package className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-stone-900">{orders.length}</div>
          <span className="text-[10px] text-stone-400">Total contracts initiated</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">Gross Transacted</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">₹{totalTransactedRupees.toFixed(2)}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {totalVolumeKg} kg crop moved
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">Active Escrow Locked</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">₹{activeEscrowAmount.toFixed(2)}</div>
          <span className="text-[10px] text-stone-400">Under 24h quality protection</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">Disputed Orders</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600">{disputedCount}</div>
          <span className="text-[10px] text-stone-400">Pending admin arbitration</span>
        </div>
      </div>

      {/* Main Transactions & Orders Table Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-emerald-700 shrink-0" />
              Comprehensive Order Ledger & Transactions
            </h2>
            <p className="text-xs text-stone-500">
              Audit trail of every single individual order, community bulk buy, and escrow release across Karnataka.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, Buyer, Farmer, Crop..."
              className="w-full pl-9 pr-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-700 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-stone-700 uppercase text-[11px] mr-1">Type:</span>
            {[
              { id: 'ALL', label: `All Orders (${orders.length})` },
              { id: 'NORMAL', label: 'Direct Normal' },
              { id: 'GROUP_BULK', label: 'Group Bulk Pools' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedOrderType(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-black transition text-xs ${
                  selectedOrderType === tab.id
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white border-2 border-stone-300 text-stone-800 hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="font-black text-stone-700 uppercase text-[11px] shrink-0">Filter Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 border-2 border-stone-300 rounded-xl bg-white font-black text-xs text-stone-900 focus:outline-none focus:border-emerald-700 shadow-sm"
            >
              <option value="ALL">All Statuses ({orders.length})</option>
              <option value="ESCROW_HELD">Escrow Held</option>
              <option value="AWAITING_POOL_COMPLETION">Awaiting Pool</option>
              <option value="CONFIRMED_PREPARING">Preparing</option>
              <option value="DELIVERED_INSPECTION_WINDOW">Inspection Window (24h)</option>
              <option value="COMPLETED_RELEASED_TO_FARMER">Completed (Released)</option>
              <option value="DISPUTED_FROZEN">Disputed (Frozen)</option>
              <option value="REFUNDED_TO_BUYER">Refunded</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-stone-200 touch-scroll">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Crop Produce</th>
                <th className="py-3 px-4">Farmer (Seller)</th>
                <th className="py-3 px-4">Buyer (Consumer)</th>
                <th className="py-3 px-4 text-right">Qty & Rate</th>
                <th className="py-3 px-4 text-right">Escrow Paid</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">E-Receipt & Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-stone-400">
                    No orders or transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const title =
                    language === 'hi'
                      ? order.productTitle.hi
                      : language === 'kn'
                      ? order.productTitle.kn
                      : order.productTitle.en;

                  const matchedProduct = products.find((p) => p.id === order.productId);
                  const isDisputed = order.status === 'DISPUTED_FROZEN';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-stone-50/80 transition ${
                        isDisputed ? 'bg-red-50/40' : ''
                      }`}
                    >
                      {/* Order ID & Date */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-stone-950 block text-xs">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-[11px] font-semibold text-stone-600 block mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-[10px] font-extrabold text-stone-700 uppercase">
                          {order.orderType === 'GROUP_BULK' ? 'Group Pool' : 'Direct Buy'}
                        </span>
                      </td>

                      {/* Crop Produce */}
                      <td className="py-3 px-4">
                        <span className="font-black text-stone-950 block text-sm">
                          {title}
                        </span>
                        <span className="text-[11px] font-semibold text-stone-600">
                          Grade: {matchedProduct?.qualityGrade ? matchedProduct.qualityGrade.replace(/_/g, ' ') : 'Grade A Bold'}
                        </span>
                      </td>

                      {/* Farmer */}
                      <td className="py-3 px-4">
                        <span className="font-black text-stone-950 block">
                          {order.farmerName}
                        </span>
                        <span className="text-[11px] font-semibold text-stone-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-0.5 text-emerald-700" />
                          {matchedProduct?.pickupLocationName || 'Hubballi Farm'}
                        </span>
                      </td>

                      {/* Buyer */}
                      <td className="py-3 px-4">
                        <span className="font-black text-stone-950 block">
                          {order.buyerName}
                        </span>
                        <span className="text-[11px] font-semibold text-stone-600 truncate max-w-[150px] block" title={order.buyerAddress}>
                          {order.buyerAddress}
                        </span>
                      </td>

                      {/* Quantity & Unit Rate */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-stone-950 block text-xs">
                          {order.quantityKg} kg
                        </span>
                        <span className="text-[11px] font-bold text-stone-700">
                          @ ₹{order.unitPriceApplied}/kg
                        </span>
                      </td>

                      {/* Total Escrow Paid */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-emerald-900 text-sm block">
                          ₹{order.totalAmount.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-stone-600">
                          {order.deliveryFee > 0 ? `+₹${order.deliveryFee} ship` : 'Free pickup'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          {renderStatusPill(order.status)}
                        </div>
                      </td>

                      {/* Actions: View E-Receipt & Escrow Management */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                            title="Inspect & Print E-Receipt"
                          >
                            <FileText className="w-3 h-3 text-emerald-700" />
                            <span>E-Receipt</span>
                          </button>

                          {isDisputed && (
                            <button
                              type="button"
                              onClick={() => resolveEscrowAdmin(order.id, 'RELEASE_TO_FARMER')}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold transition"
                            >
                              Release
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Order E-Receipt Modal for Admin */}
      <EReceiptModal
        order={selectedReceiptOrder}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
};

