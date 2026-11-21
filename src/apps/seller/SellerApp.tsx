import React, { useState } from 'react';
import {
  TrendingUp,
  PlusCircle,
  Package,
  Truck,
  Users,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  IndianRupee,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { VoiceProductModal } from './VoiceProductModal';
import { DeliveryRequests } from './DeliveryRequests';
import { FarmerPoolsView } from './FarmerPoolsView';
import { ReportModal } from '../../components/ReportModal';

export const SellerApp: React.FC = () => {
  const { products, orders, pools, currentUser, language, t, pendingDeliveryCount } =
    useAgridirect();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'listings' | 'deliveries' | 'pools'>('listings');

  if (!currentUser) return null;

  // Filter products belonging to current farmer
  const farmerProducts = products.filter((p) => p.farmerId === currentUser.id);

  // Compute live financial benchmarks
  const totalStock = farmerProducts.reduce((sum, p) => sum + p.availableStockKg, 0);

  // Calculate comparative profit uplift for typical product (e.g. Peanuts)
  const peanuts = farmerProducts.find((p) => p.category === 'PEANUTS_OILSEEDS') || farmerProducts[0];
  const middlemanRate = peanuts?.wholesaleBenchmarkPerKg || 12;
  const directRate = peanuts?.normalPricePerKg || 24;
  const upliftPercent = Math.round(((directRate - middlemanRate) / (middlemanRate || 1)) * 100);

  // Total completed earnings
  const completedOrders = orders.filter(
    (o) => o.farmerId === currentUser.id && o.status === 'COMPLETED_RELEASED_TO_FARMER'
  );
  const totalEarnings = completedOrders.reduce((sum, o) => sum + o.subtotalAmount, 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-8">
      {/* Top Banner / Farmer Identity */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-stone-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-full text-xs font-bold tracking-wide uppercase">
                {t('farmerDashboard')}
              </span>
              {currentUser.isVerified ? (
                <span className="flex items-center text-xs font-bold text-emerald-300 bg-emerald-800/80 px-2.5 py-0.5 rounded-full border border-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                  KYC & Land Record (RTC) Verified
                </span>
              ) : (
                <span className="flex items-center text-xs font-bold text-amber-300 bg-amber-900/60 px-2.5 py-0.5 rounded-full border border-amber-600">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  KYC Pending Admin Verification
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-emerald-400 shrink-0" />
              <span>{currentUser.locationName} • Pincode: {currentUser.pincode}</span>
            </p>
          </div>

          {/* Action Buttons: Add Product + Report Grievance */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 sm:space-x-2 px-3.5 py-3 sm:py-3.5 bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-200 hover:text-white font-bold rounded-2xl shadow-md transition active:scale-95 text-xs min-h-[44px]"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Report Grievance</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/20 transition-all scale-100 active:scale-95 text-xs sm:text-sm min-h-[44px]"
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              <span>{t('addNewProduct')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8.2.1 Farmer Profit Comparison Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* The Benchmark Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                Middleman vs. Agridirect Net Revenue Comparison
              </h3>
            </div>
            <span className="px-2.5 sm:px-3 py-1 bg-emerald-600 text-white font-extrabold text-[11px] sm:text-xs rounded-full shadow-sm shrink-0">
              +{upliftPercent}% Extra Revenue
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/80 backdrop-blur rounded-xl p-3.5 sm:p-4 border border-amber-200/70">
              <span className="text-[11px] sm:text-xs text-stone-500 font-semibold uppercase block">
                Traditional APMC / Middleman Rate
              </span>
              <div className="text-xl sm:text-2xl font-black text-stone-700 mt-1 flex items-baseline">
                ₹{middlemanRate} <span className="text-xs font-medium text-stone-400 ml-1">/ kg</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                Middlemen take commission, storage, and 3-tier transit cuts.
              </p>
            </div>

            <div className="bg-emerald-600 text-white rounded-xl p-3.5 sm:p-4 shadow-md">
              <span className="text-[11px] sm:text-xs text-emerald-200 font-semibold uppercase block">
                Agridirect Direct Payout
              </span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1 flex items-baseline">
                ₹{directRate} <span className="text-xs font-medium text-emerald-200 ml-1">/ kg</span>
              </div>
              <p className="text-[11px] text-emerald-100 mt-2">
                100% of consumer payment lands in your bank via 24h Escrow hold.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="card-glass rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Live Farm Inventory
            </span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-stone-950">{totalStock}</span>
              <span className="text-sm font-bold text-stone-600">kg available</span>
            </div>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-stone-200 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-stone-600 font-semibold block">Active Listings</span>
              <span className="font-black text-stone-900 text-base">{farmerProducts.length} Crops</span>
            </div>
            <div>
              <span className="text-stone-600 font-semibold block">Total Dispatched</span>
              <span className="font-black text-emerald-800 text-base">₹{totalEarnings}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b-2 border-stone-200 space-x-4 sm:space-x-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('listings')}
          className={`pb-3 text-xs sm:text-sm font-black flex items-center space-x-1.5 sm:space-x-2 transition border-b-2 -mb-0.5 shrink-0 ${
            activeSubTab === 'listings'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Products ({farmerProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('deliveries')}
          className={`pb-3 text-xs sm:text-sm font-black flex items-center space-x-1.5 sm:space-x-2 transition border-b-2 -mb-0.5 relative shrink-0 ${
            activeSubTab === 'deliveries'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{t('deliveryRequestsTitle')}</span>
          {pendingDeliveryCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-400 text-stone-950 font-black text-[10px] rounded-full border border-amber-500 shadow-sm">
              {pendingDeliveryCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('pools')}
          className={`pb-3 text-xs sm:text-sm font-black flex items-center space-x-1.5 sm:space-x-2 transition border-b-2 -mb-0.5 shrink-0 ${
            activeSubTab === 'pools'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('activeGroupPools')}</span>
        </button>
      </div>

      {/* Active Tab View */}
      {activeSubTab === 'listings' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmerProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400 bg-white rounded-3xl border border-dashed border-stone-300 p-8">
              <Package className="w-16 h-16 stroke-1 mb-4 text-stone-300" />
              <p className="font-semibold text-base text-stone-700">No products listed yet</p>
              <p className="text-xs text-stone-500 mt-1">
                Click <strong>"{t('addNewProduct')}"</strong> to list your first dry harvest crop.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-5 flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('addNewProduct')}</span>
              </button>
            </div>
          )}
          {farmerProducts.map((product) => {
            const title =
              language === 'hi'
                ? product.title.hi
                : language === 'kn'
                ? product.title.kn
                : product.title.en;

            return (
              <div
                key={product.id}
                className="card-glass rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
              >
                <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                  <img
                    src={product.photoUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-emerald-600/90 backdrop-blur text-white font-bold text-[10px] rounded-md">
                      {product.shelfLifeMonths} {t('monthsUnit')} {t('shelfLifeBadge')}
                    </span>
                    <span className="px-2 py-0.5 bg-stone-900/80 backdrop-blur text-white font-bold text-[10px] rounded-md">
                      {product.qualityGrade.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">{title}</h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                      {language === 'hi'
                        ? product.description.hi
                        : language === 'kn'
                        ? product.description.kn
                        : product.description.en}
                    </p>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">
                        Stock Remaining
                      </span>
                      <span className="font-bold text-stone-800 text-sm">
                        {product.availableStockKg} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">
                        Direct Rate
                      </span>
                      <span className="font-bold text-emerald-700 text-sm">
                        ₹{product.normalPricePerKg}/kg
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                    <span className="font-medium text-stone-700">
                      Bulk: <strong>{product.bulkMinQuantityKg} - {product.bulkMaxQuantityKg} kg</strong> (₹{product.bulkPricePerKg}/kg)
                    </span>
                    <span className="font-semibold text-emerald-800">
                      Harvest: {product.harvestMonthYear}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSubTab === 'deliveries' && <DeliveryRequests />}

      {activeSubTab === 'pools' && <FarmerPoolsView />}

      {/* Voice Product Listing Modal */}
      <VoiceProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Incident / Dispute Reporting Modal for Farmers */}
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          defaultTargetType="GENERAL"
          defaultTargetName={`Farmer Grievance Desk (${currentUser.name})`}
        />
      )}

      {/* Native-Feel Mobile Bottom Navigation Bar for Farmer */}
      <nav
        aria-label="Farmer Mobile Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-xl border-t border-stone-800 safe-bottom shadow-2xl"
      >
        <div className="grid grid-cols-4 h-16 max-w-md mx-auto items-center">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('listings');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center space-y-1 transition active:scale-95 ${
              activeSubTab === 'listings'
                ? 'text-emerald-400 font-black'
                : 'text-stone-400 hover:text-stone-200 font-semibold'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">My Crops</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('deliveries');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center space-y-1 transition active:scale-95 relative ${
              activeSubTab === 'deliveries'
                ? 'text-emerald-400 font-black'
                : 'text-stone-400 hover:text-stone-200 font-semibold'
            }`}
          >
            <div className="relative">
              <Truck className="w-5 h-5" />
              {pendingDeliveryCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-amber-400 text-stone-950 font-black text-[9px] rounded-full shadow-sm">
                  {pendingDeliveryCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Deliveries</span>
          </button>

          {/* Quick List Harvest Action Button (Thumb Center FAB) */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center -mt-4 transition active:scale-90"
            title="List Harvest Produce"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-stone-950 flex items-center justify-center shadow-lg shadow-emerald-950/80 border-2 border-stone-950">
              <PlusCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-black text-emerald-400 mt-1">List Crop</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('pools');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center space-y-1 transition active:scale-95 ${
              activeSubTab === 'pools'
                ? 'text-emerald-400 font-black'
                : 'text-stone-400 hover:text-stone-200 font-semibold'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Pools</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

