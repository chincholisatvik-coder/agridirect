import React, { useState } from 'react';
import {
  Users,
  Share2,
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  MessageCircle,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { GroupBuyPool, Product } from '../../types/agridirect';

interface GroupPoolsBoardProps {
  onJoinPool: (product: Product, pool: GroupBuyPool) => void;
}

export const GroupPoolsBoard: React.FC<GroupPoolsBoardProps> = ({ onJoinPool }) => {
  const { pools, products, language, t } = useAgridirect();
  const [copiedPoolId, setCopiedPoolId] = useState<string | null>(null);

  const handleShareWhatsApp = (pool: GroupBuyPool, product: Product) => {
    const cropName =
      language === 'hi'
        ? product.title.hi
        : language === 'kn'
        ? product.title.kn
        : product.title.en;

    const savingPerKg = product.marketRetailBenchmarkPerKg - pool.unitBulkPrice;

    let text = '';
    if (language === 'hi') {
      text = `नमस्ते पड़ोसियों! मैंने एग्रीडायरेक्ट पर किसान ${product.farmerName} से ₹${pool.unitBulkPrice}/किग्रा में ${cropName} का सामूहिक थोक पूल शुरू किया है (बाज़ार भाव से ₹${savingPerKg}/किग्रा सस्ता!)। हमारे ${pool.localityName} पूल में शामिल हों: https://agridirect.in/pool/${pool.id}`;
    } else if (language === 'kn') {
      text = `ನಮಸ್ಕಾರ! ನಾನು ಅಗ್ರಿಡೈರೆಕ್ಟ್‌ನಲ್ಲಿ ರೈತ ${product.farmerName} ಅವರಿಂದ ₹${pool.unitBulkPrice}/ಕೆಜಿ ದರದಲ್ಲಿ ${cropName} ಗುಂಪು ಖರೀದಿ ಸೇರಿದ್ದೇನೆ (ಮಾರುಕಟ್ಟೆಗಿಂತ ₹${savingPerKg}/ಕೆಜಿ ಉಳಿತಾಯ!)। ನಮ್ಮ ${pool.localityName} ಪೂಲ್ ಸೇರಿಕೊಳ್ಳಿ: https://agridirect.in/pool/${pool.id}`;
    } else {
      text = `Hey neighbors! I joined a community bulk buy pool on Agridirect for ${cropName} at ₹${pool.unitBulkPrice}/kg directly from farmer ${product.farmerName} (Save ₹${savingPerKg}/kg vs market retail!). Join our ${pool.localityName} pool here: https://agridirect.in/pool/${pool.id}`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    const opened = window.open(whatsappUrl, '_blank');
    if (!opened && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedPoolId(pool.id);
        setTimeout(() => setCopiedPoolId(null), 3000);
      });
    } else {
      setCopiedPoolId(pool.id);
      setTimeout(() => setCopiedPoolId(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              {t('activePoolsNearYou')}
            </span>
            <span className="flex items-center text-[11px] sm:text-xs font-bold text-emerald-300 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-600">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Community Bulk-Buy Savings
            </span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Neighborhood Buying Pools
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/80 max-w-2xl leading-relaxed">
            When neighbors aggregate individual orders to reach the farmer's bulk threshold (e.g. 50 kg),
            everyone automatically unlocks the lowest farm-gate bulk price!
          </p>
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {pools.map((pool) => {
          const product = products.find((p) => p.id === pool.productId);
          if (!product) return null;

          const cropTitle =
            language === 'hi'
              ? product.title.hi
              : language === 'kn'
              ? product.title.kn
              : product.title.en;

          const progressPercent = Math.min(
            100,
            Math.round((pool.currentQuantityKg / pool.targetQuantityKg) * 100)
          );

          const isComplete = pool.status === 'LOCKED_CONFIRMED';
          const remainingKg = Math.max(0, pool.targetQuantityKg - pool.currentQuantityKg);

          return (
            <div
              key={pool.id}
              className={`bg-white rounded-2xl sm:rounded-3xl border-2 transition-all p-4 sm:p-6 flex flex-col justify-between space-y-4 sm:space-y-5 shadow-sm hover:shadow-xl ${
                isComplete ? 'border-emerald-500 bg-emerald-50/20' : 'border-stone-200'
              }`}
            >
              {/* Top Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">
                      Pool #{pool.id.slice(-6)}
                    </span>
                    <h3 className="font-extrabold text-stone-900 text-lg leading-tight">
                      {cropTitle}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center ${
                      isComplete
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {isComplete ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Target Met & Confirmed
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Live Pledging
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-stone-700 flex items-center font-bold">
                  <MapPin className="w-4 h-4 mr-1 text-emerald-700 shrink-0" />
                  {pool.localityName} ({pool.localityPincode})
                </p>

                <p className="text-[11px] text-stone-600 font-semibold">
                  Drop-off point: <strong className="text-stone-900">{pool.dropOffAddress}</strong>
                </p>
              </div>

              {/* Progress Bar & Target */}
              <div className="space-y-2 bg-stone-100/70 p-4 rounded-2xl border border-stone-200">
                <div className="flex justify-between items-baseline text-xs font-bold">
                  <span className="text-stone-800">
                    {t('poolProgress')}:{' '}
                    <strong className="text-stone-950 font-black">
                      {pool.currentQuantityKg} kg / {pool.targetQuantityKg} kg
                    </strong>{' '}
                    <span className="text-[11px] text-stone-600 font-semibold">
                      (Cap: {pool.maxQuantityKg || product.bulkMaxQuantityKg} kg)
                    </span>
                  </span>
                  <span className="text-emerald-800 text-sm font-black">
                    {progressPercent}%
                  </span>
                </div>

                <div className="w-full bg-stone-200 rounded-full h-3.5 overflow-hidden border border-stone-300">
                  <div
                    className={`h-3.5 rounded-full transition-all duration-700 ${
                      isComplete ? 'bg-emerald-700' : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-stone-600 pt-1">
                  <span>
                    Bulk Rate: <strong className="text-stone-950 font-black">₹{pool.unitBulkPrice}/kg</strong>
                  </span>
                  {!isComplete && (
                    <span className="text-amber-950 font-extrabold bg-amber-200 px-2.5 py-0.5 rounded border border-amber-300">
                      Only {remainingKg} kg needed to unlock!
                    </span>
                  )}
                </div>
              </div>

              {/* Participating Neighbors */}
              <div className="space-y-2">
                <span className="text-[11px] font-black text-stone-700 uppercase tracking-wider block">
                  {pool.participants.length} Neighbors Joined:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pool.participants.map((pt, pIdx) => (
                    <span
                      key={pIdx}
                      className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 flex items-center"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                      {pt.buyerName}: <strong className="ml-1 text-stone-900">{pt.quantityKg} kg</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => onJoinPool(product, pool)}
                  disabled={isComplete}
                  className={`flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl text-xs font-extrabold transition shadow-md ${
                    isComplete
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-600/20 active:scale-95'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{isComplete ? 'Pool Completed' : 'Join & Pay Split Share'}</span>
                </button>

                <button
                  onClick={() => handleShareWhatsApp(pool, product)}
                  className="flex items-center justify-center space-x-1.5 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>
                    {copiedPoolId === pool.id ? 'Shared link!' : t('shareWhatsApp')}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

