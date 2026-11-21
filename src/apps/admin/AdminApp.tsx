import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  TrendingUp,
  Package,
  IndianRupee,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Database,
  Layers,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { KycVerification } from './KycVerification';
import { EscrowLedger } from './EscrowLedger';
import { ShelfLifeAudit } from './ShelfLifeAudit';
import { AdminUsersView } from './AdminUsersView';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminReportsBanner } from './AdminReportsBanner';
import { isSupabaseConfigured } from '../../services/supabase';

export const AdminApp: React.FC = () => {
  const { orders, products, users, pools, reports, openReportsCount, resetToSeedData, t } = useAgridirect();
  const [activeTab, setActiveTab] = useState<'orders' | 'reports' | 'users' | 'escrow' | 'kyc' | 'compliance'>('orders');

  // Compute Platform Impact KPIs
  const totalVolumeKg = orders.reduce((sum, o) => sum + o.quantityKg, 0);

  // Escrow currently active
  const activeEscrowAmount = orders
    .filter((o) =>
      ['ESCROW_HELD', 'AWAITING_POOL_COMPLETION', 'CONFIRMED_PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED_INSPECTION_WINDOW', 'DISPUTED_FROZEN'].includes(
        o.status
      )
    )
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Total Buyer Savings
  const totalSavings = orders.reduce((sum, o) => {
    const prod = products.find((p) => p.id === o.productId);
    if (!prod) return sum;
    const retailCost = prod.marketRetailBenchmarkPerKg * o.quantityKg;
    const actualCost = o.subtotalAmount;
    return sum + Math.max(0, retailCost - actualCost);
  }, 0);

  // Unverified farmers count
  const pendingKycCount = users.filter((u) => u.role === 'FARMER' && !u.isVerified).length;
  // Disputed orders count
  const disputedCount = orders.filter((o) => o.status === 'DISPUTED_FROZEN').length;
  const isCloudConnected = isSupabaseConfigured();

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-8">
      {/* Admin Hero Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-stone-700/60 text-emerald-300 rounded-full text-[11px] sm:text-xs font-bold tracking-wide uppercase border border-stone-600">
                {t('adminTitle')}
              </span>

              {isCloudConnected && (
                <span className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-emerald-900/80 text-emerald-300 rounded-full text-[11px] sm:text-xs font-bold border border-emerald-500/40 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cloud Database: Supabase Live</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              State Agricultural Directorate & Escrow Controller
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Real-time monitoring of all registered farmers, direct buyers, every individual order, 
              24h escrow locks, quality dispute arbitration, and group-buying pool settlements.
            </p>
          </div>

          <button
            onClick={resetToSeedData}
            className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-semibold border border-stone-700 transition shadow-sm self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('resetSeed')}</span>
          </button>
        </div>
      </div>

      {/* TOP PRIORITY GRIEVANCE & INCIDENT REPORTS BANNER (DIRECTLY ON TOP) */}
      <AdminReportsBanner />

      {/* Platform Impact KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <div className="card-glass rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase">{t('kpiVolumeTraded')}</span>
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalVolumeKg} kg</div>
          <span className="text-[11px] text-stone-500 block">Dry commodities exchanged</span>
        </div>

        {/* KPI 2 */}
        <div className="card-glass rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase">{t('kpiFarmerUplift')}</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">+94%</div>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            Net vs APMC middleman
          </span>
        </div>

        {/* KPI 3 */}
        <div className="card-glass rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase">{t('kpiConsumerSavings')}</span>
            <IndianRupee className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">₹{totalSavings.toFixed(2)}</div>
          <span className="text-[11px] text-stone-500 block">Saved vs retail mandi prices</span>
        </div>

        {/* KPI 4 */}
        <div className="bg-emerald-950/90 backdrop-blur-md text-white rounded-2xl p-5 shadow-sm space-y-2 border border-emerald-800/60">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-bold uppercase">{t('kpiActiveEscrow')}</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">₹{activeEscrowAmount.toFixed(2)}</div>
          <span className="text-[11px] text-emerald-200 block">Safely held in escrow pool</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b-2 border-stone-200 space-x-3 sm:space-x-8 overflow-x-auto no-scrollbar">
        {/* Tab 1: All Orders & Transactions */}
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-black flex items-center space-x-2 transition border-b-2 -mb-0.5 relative shrink-0 ${
            activeTab === 'orders'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>All Orders & Transactions</span>
          <span className="px-2 py-0.5 bg-stone-100 text-stone-900 font-black text-[10px] rounded-full border border-stone-300">
            {orders.length}
          </span>
        </button>

        {/* Tab: Incident Reports Desk */}
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-black flex items-center space-x-2 transition border-b-2 -mb-0.5 relative shrink-0 ${
            activeTab === 'reports'
              ? 'border-red-700 text-red-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Incident Reports</span>
          {openReportsCount > 0 ? (
            <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[10px] rounded-full animate-pulse shadow-sm">
              {openReportsCount}
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-bold text-[10px] rounded-full border border-stone-300">
              {reports.length}
            </span>
          )}
        </button>

        {/* Tab 2: All Users Directory */}
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-black flex items-center space-x-2 transition border-b-2 -mb-0.5 relative shrink-0 ${
            activeTab === 'users'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users Directory</span>
          <span className="px-2 py-0.5 bg-stone-100 text-stone-900 font-black text-[10px] rounded-full border border-stone-300">
            {users.length}
          </span>
        </button>

        {/* Tab 3: Escrow Ledger */}
        <button
          onClick={() => setActiveTab('escrow')}
          className={`pb-3 text-sm font-black flex items-center space-x-2 transition border-b-2 -mb-0.5 relative shrink-0 ${
            activeTab === 'escrow'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>{t('escrowLedgerTitle')}</span>
          {disputedCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-600 text-white font-black text-[10px] rounded-full animate-bounce shadow-sm">
              {disputedCount}
            </span>
          )}
        </button>

        {/* Tab 4: Farmer KYC & RTC */}
        <button
          onClick={() => setActiveTab('kyc')}
          className={`pb-3 text-sm font-black flex items-center space-x-2 transition border-b-2 -mb-0.5 relative shrink-0 ${
            activeTab === 'kyc'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('kycQueueTitle')}</span>
          {pendingKycCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-400 text-stone-950 font-black text-[10px] rounded-full border border-amber-500 shadow-sm">
              {pendingKycCount}
            </span>
          )}
        </button>

        {/* Tab 5: Compliance */}
        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-3 text-sm font-black flex items-center space-x-2 transition border-b-2 -mb-0.5 shrink-0 ${
            activeTab === 'compliance'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('complianceTitle')}</span>
        </button>
      </div>

      {/* Tab Panes */}
      {activeTab === 'orders' && <AdminOrdersView />}
      {activeTab === 'reports' && <AdminReportsBanner />}
      {activeTab === 'users' && <AdminUsersView />}
      {activeTab === 'escrow' && <EscrowLedger />}
      {activeTab === 'kyc' && <KycVerification />}
      {activeTab === 'compliance' && <ShelfLifeAudit />}
    </div>
  );
};
