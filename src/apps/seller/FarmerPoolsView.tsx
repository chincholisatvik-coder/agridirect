import React, { useState } from 'react';
import {
  Users,
  Printer,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  FileText,
  Truck,
  IndianRupee,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { GroupBuyPool } from '../../types/agridirect';

export const FarmerPoolsView: React.FC = () => {
  const { pools, products, currentUser, language, t } = useAgridirect();
  const [selectedPoolForSlip, setSelectedPoolForSlip] = useState<GroupBuyPool | null>(null);

  if (!currentUser) return null;

  // Pools for crops owned by this farmer
  const farmerProductIds = products
    .filter((p) => p.farmerId === currentUser.id)
    .map((p) => p.id);

  const relevantPools = pools.filter((p) => farmerProductIds.includes(p.productId));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">{t('activeGroupPools')}</h2>
            <p className="text-xs text-stone-500">
              Community bulk orders aggregating directly to your farm minimum threshold
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-200">
          {relevantPools.length} Pools
        </span>
      </div>

      {relevantPools.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <Package className="w-12 h-12 mx-auto stroke-1 mb-2 text-stone-300" />
          <p className="font-semibold text-sm">No community pools currently active for your crops</p>
          <p className="text-xs text-stone-400 mt-1">
            When apartment clusters start group orders, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relevantPools.map((pool) => {
            const product = products.find((p) => p.id === pool.productId);
            const cropTitle = product
              ? language === 'hi'
                ? product.title.hi
                : language === 'kn'
                ? product.title.kn
                : product.title.en
              : 'Agricultural Commodity';

            const progress = Math.min(
              100,
              Math.round((pool.currentQuantityKg / pool.targetQuantityKg) * 100)
            );
            const isConfirmed = pool.status === 'LOCKED_CONFIRMED';

            return (
              <div
                key={pool.id}
                className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-stone-400">
                      Pool ID: {pool.id}
                    </span>
                    <h3 className="font-bold text-stone-800 text-base">{cropTitle}</h3>
                    <p className="text-xs text-stone-600 font-medium flex items-center mt-0.5">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                      {pool.localityName}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center ${
                      isConfirmed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isConfirmed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Locked & Ready
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Pledging Active
                      </>
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-stone-700">
                      {pool.currentQuantityKg} / {pool.targetQuantityKg} kg
                    </span>
                    <span className="text-emerald-700 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isConfirmed ? 'bg-emerald-600' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Neighbors Breakdown */}
                <div className="bg-white p-3 rounded-lg border border-stone-200 text-xs">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                    Participants ({pool.participants.length} Neighbors)
                  </span>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {pool.participants.map((participant, pIdx) => (
                      <div
                        key={pIdx}
                        className="flex items-center justify-between py-0.5 border-b border-stone-100 last:border-none"
                      >
                        <span className="text-stone-700 font-medium">
                          {pIdx + 1}. {participant.buyerName}
                        </span>
                        <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                          {participant.quantityKg} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Packing Slip Button */}
                <button
                  onClick={() => setSelectedPoolForSlip(pool)}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-sm transition"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>{t('downloadPackingSlip')}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Consolidated Packing Slip Modal */}
      {selectedPoolForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">{t('packingSlipModalTitle')}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('printSlip')}</span>
                </button>
                <button
                  onClick={() => setSelectedPoolForSlip(null)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 space-y-6 text-stone-900 print:p-0">
              {/* Slip Header */}
              <div className="border-b-2 border-stone-800 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-emerald-800">
                    AGRIDIRECT BULK DISPATCH SLIP
                  </h1>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                    MANIFEST REF: {selectedPoolForSlip.id.toUpperCase()}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold block text-stone-800">Farmer: {currentUser.name}</span>
                  <span className="text-stone-500">{currentUser.locationName}</span>
                  <span className="block font-mono text-[11px] text-stone-400">
                    {new Date().toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Destination Hub */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 font-bold block uppercase text-[10px]">
                    Drop-off Community Locality
                  </span>
                  <p className="font-bold text-stone-800 text-sm mt-0.5">
                    {selectedPoolForSlip.localityName}
                  </p>
                  <p className="text-stone-600 mt-1">{selectedPoolForSlip.dropOffAddress}</p>
                  <p className="text-stone-500 font-mono">Pincode: {selectedPoolForSlip.localityPincode}</p>
                </div>
                <div>
                  <span className="text-stone-400 font-bold block uppercase text-[10px]">
                    Pool Aggregation Summary
                  </span>
                  <p className="font-bold text-emerald-800 text-sm mt-0.5">
                    Total Dispatched: {selectedPoolForSlip.currentQuantityKg} kg
                  </p>
                  <p className="text-stone-600 mt-1">
                    Target Threshold: {selectedPoolForSlip.targetQuantityKg} kg (
                    {Math.round(
                      (selectedPoolForSlip.currentQuantityKg /
                        selectedPoolForSlip.targetQuantityKg) *
                        100
                    )}
                    % Met)
                  </p>
                  <p className="text-stone-600">
                    Fulfillment:{' '}
                    <strong className="text-stone-800">{selectedPoolForSlip.fulfillmentType}</strong>
                  </p>
                </div>
              </div>

              {/* Bag Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Individual Pre-Packaged Neighbor Bags:
                </h4>
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Bag #</th>
                        <th className="py-2.5 px-3">Recipient Neighbor</th>
                        <th className="py-2.5 px-3">Bag Weight</th>
                        <th className="py-2.5 px-3">Escrow Status</th>
                        <th className="py-2.5 px-3 text-right">Verification Check</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {selectedPoolForSlip.participants.map((pt, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                            BAG-{String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-stone-800">
                            {pt.buyerName}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-stone-900">
                            {pt.quantityKg} kg
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              PAID ESCROW (₹{pt.amountPaidEscrow})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-stone-400">
                            [ &nbsp; ] Tagged & Sealed
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-[11px] text-stone-500 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <p className="font-semibold text-amber-900">Packing & Handling Instructions:</p>
                <p className="mt-0.5">
                  Pack individual bags as labeled above. Hand over all tagged bags together to the
                  delivery vehicle or community host at {selectedPoolForSlip.localityName}. Escrow
                  will auto-unlock to your UPI after 24h of customer inspection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

