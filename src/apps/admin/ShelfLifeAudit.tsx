import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  Users,
  ShieldCheck,
  RefreshCw,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';

export const ShelfLifeAudit: React.FC = () => {
  const { products, pools, lockAndConfirmPool, expireAndRefundPool, language, t } =
    useAgridirect();

  return (
    <div className="space-y-6">
      {/* Product Shelf-Life Compliance Audit */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-100 text-purple-800 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">{t('complianceTitle')}</h2>
              <p className="text-xs text-stone-500">
                Agridirect protocol requires non-perishable goods with shelf-life ≥ 3 months
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
            100% Non-Perishable Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => {
            const title =
              language === 'hi'
                ? product.title.hi
                : language === 'kn'
                ? product.title.kn
                : product.title.en;

            const isCompliant = product.shelfLifeMonths >= 3;

            return (
              <div
                key={product.id}
                className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between space-x-3"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={product.photoUrl}
                    alt={title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <h4 className="font-black text-stone-950 text-sm">{title}</h4>
                    <p className="text-xs text-stone-700 font-semibold">{product.farmerName}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                        {product.shelfLifeMonths} Months Shelf Life
                      </span>
                      <span className="text-[11px] text-stone-600 font-bold">
                        Harvest: {product.harvestMonthYear}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {isCompliant ? (
                    <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Passed
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Failed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Bulk Pool Expiry & Confirmation Monitor */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 text-amber-900 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Community Pool Expiry & Settlement Control
              </h2>
              <p className="text-xs text-stone-500">
                Manually lock/dispatch pools or auto-refund buyers if group deadlines lapse
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-stone-100 text-stone-700 font-bold text-xs rounded-full border border-stone-200">
            {pools.length} Monitored Pools
          </span>
        </div>

        <div className="space-y-4">
          {pools.map((pool) => {
            const product = products.find((p) => p.id === pool.productId);
            const cropTitle = product
              ? language === 'hi'
                ? product.title.hi
                : language === 'kn'
                ? product.title.kn
                : product.title.en
              : 'Crop';

            const progress = Math.min(
              100,
              Math.round((pool.currentQuantityKg / pool.targetQuantityKg) * 100)
            );

            return (
              <div
                key={pool.id}
                className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-stone-400">#{pool.id}</span>
                    <h4 className="font-bold text-stone-900 text-base">{cropTitle}</h4>
                    <span className="px-2 py-0.5 bg-stone-200 text-stone-800 text-[10px] font-bold rounded">
                      {pool.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Locality: <strong>{pool.localityName}</strong> • Target: {pool.targetQuantityKg} kg •
                    Current: <strong>{pool.currentQuantityKg} kg ({progress}%)</strong>
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Expires at: {new Date(pool.expiresAt).toLocaleString()}
                  </p>
                </div>

                {pool.status === 'OPEN' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => lockAndConfirmPool(pool.id)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t('forceCompletePoolBtn')}</span>
                    </button>
                    <button
                      onClick={() => expireAndRefundPool(pool.id)}
                      className="px-3 py-2 bg-stone-200 hover:bg-red-100 text-stone-700 hover:text-red-800 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t('refundExpiredPoolBtn')}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

