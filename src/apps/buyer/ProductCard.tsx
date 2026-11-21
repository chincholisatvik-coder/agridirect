import React from 'react';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Users,
  ShoppingBag,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { Product } from '../../types/agridirect';
import { calculateHaversineDistance } from '../../utils/pricing';

interface ProductCardProps {
  product: Product;
  onBuyNormal: (product: Product) => void;
  onJoinPool: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onBuyNormal,
  onJoinPool,
  onViewDetails,
}) => {
  const { language, t, currentUser } = useAgridirect();

  const title =
    language === 'hi'
      ? product.title.hi
      : language === 'kn'
      ? product.title.kn
      : product.title.en;

  const description =
    language === 'hi'
      ? product.description.hi
      : language === 'kn'
      ? product.description.kn
      : product.description.en;

  // Calculate distance from buyer to farmer's pickup location
  const distanceKm = calculateHaversineDistance(
    currentUser?.lat || 15.3715,
    currentUser?.lng || 75.1235,
    product.pickupLat || 15.3647,
    product.pickupLng || 75.1240
  );

  // Price calculations
  const retailPrice = product.marketRetailBenchmarkPerKg;
  const normalPrice = product.normalPricePerKg;
  const bulkPrice = product.bulkPricePerKg;

  const normalSavingsPercent = Math.max(
    0,
    Math.round(((retailPrice - normalPrice) / retailPrice) * 100)
  );
  const bulkSavingsPercent = Math.max(
    0,
    Math.round(((retailPrice - bulkPrice) / retailPrice) * 100)
  );

  const farmerGainPercent = Math.max(
    0,
    Math.round(
      ((normalPrice - product.wholesaleBenchmarkPerKg) /
        (product.wholesaleBenchmarkPerKg || 1)) *
        100
    )
  );

  return (
    <div className="card-glass rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Product Image & Badges */}
      <button
        type="button"
        onClick={() => onViewDetails(product)}
        className="relative h-48 sm:h-56 w-full bg-stone-100 overflow-hidden text-left focus:outline-none"
        aria-label={`View details for ${title}`}
      >
        <img
          src={product.photoUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Shelf-Life & Grade Top Badges */}
        <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 flex flex-wrap gap-1 sm:gap-1.5 max-w-[75%]">
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-stone-900/85 backdrop-blur text-white text-[10px] sm:text-[11px] font-bold rounded-lg shadow-sm flex items-center">
            <Clock className="w-3 h-3 mr-1 text-emerald-400" />
            {product.shelfLifeMonths} {t('monthsUnit')} {t('shelfLifeBadge')}
          </span>

          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-600/90 backdrop-blur text-white text-[10px] sm:text-[11px] font-bold rounded-lg shadow-sm">
            {product.qualityGrade.replace(/_/g, ' ')}
          </span>

          {product.isAiVerified && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 text-[9px] sm:text-[10px] font-extrabold rounded-lg shadow-sm flex items-center">
              <Sparkles className="w-2.5 h-2.5 mr-1 text-cyan-400" />
              AI-Free Real Photo
            </span>
          )}
        </div>

        {/* Harvest Month Badge */}
        <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3">
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-white/95 backdrop-blur text-stone-800 text-[10px] sm:text-[11px] font-bold rounded-lg shadow-sm flex items-center">
            <Calendar className="w-3 h-3 mr-1 text-emerald-600" />
            {t('harvestBadge')}: {product.harvestMonthYear}
          </span>
        </div>

        {/* Farmer Uplift Ribbon */}
        <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3">
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide rounded-md shadow-md">
            +{farmerGainPercent}% Farmer Pay
          </span>
        </div>
        <span className="absolute bottom-2.5 sm:bottom-3 right-2.5 sm:right-3 rounded-lg bg-stone-900/80 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white shadow-sm flex items-center space-x-1 backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 transition">
          <span>Details</span>
          <span className="text-emerald-400">→</span>
        </span>
      </button>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
        {/* Farmer & Location Info */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-stone-800">
              <span>{product.farmerName}</span>
              {product.farmerVerified ? (
                <span title="KYC & RTC Verified Farmer">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 font-semibold">(Verification Pending)</span>
              )}
            </div>

            <span className="text-stone-700 flex items-center font-bold text-[11px]">
              <MapPin className="w-3.5 h-3.5 mr-0.5 text-emerald-700" />
              {distanceKm} km away
            </span>
          </div>

          <button
            type="button"
            onClick={() => onViewDetails(product)}
            className="text-left font-black text-stone-950 text-lg leading-tight line-clamp-1 hover:text-emerald-800 transition"
          >
            {title}
          </button>

          <p className="text-xs text-stone-700 line-clamp-2 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* 8.3.1 3-Tier Price Box */}
        <div className="bg-stone-100/80 rounded-2xl p-3.5 border border-stone-300/80 space-y-2.5">
          {/* Strikethrough Market Retail */}
          <div className="flex items-center justify-between text-xs text-stone-700">
            <span className="font-semibold">{t('marketRetailLabel')} (APMC / Mandi):</span>
            <span className="line-through font-bold text-stone-500">
              ₹{retailPrice}/kg
            </span>
          </div>

          {/* Option 1: Normal Direct Price */}
          <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-stone-200 shadow-sm">
            <div>
              <span className="text-xs font-black text-stone-900 block">
                {t('normalBuyLabel')}
              </span>
              <span className="text-[11px] text-emerald-800 font-extrabold">
                {t('youSave')} {normalSavingsPercent}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-800">
                ₹{normalPrice}
              </span>
              <span className="text-xs font-bold text-stone-600">/kg</span>
            </div>
          </div>

          {/* Option 2: Group Bulk-Buy Price */}
          <div className="flex items-center justify-between bg-amber-50 px-3.5 py-2.5 rounded-xl border-2 border-amber-300 shadow-sm">
            <div>
              <span className="text-xs font-black text-amber-950 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-amber-800" />
                {t('bulkBuyLabel')}
              </span>
              <span className="text-[11px] text-amber-900 font-extrabold block">
                Save {bulkSavingsPercent}% • Pool: {product.bulkMinQuantityKg} kg min - {product.bulkMaxQuantityKg} kg cap
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-amber-950">
                ₹{bulkPrice}
              </span>
              <span className="text-xs font-bold text-amber-900">/kg</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onBuyNormal(product)}
            className="flex items-center justify-center space-x-1 sm:space-x-1.5 py-2.5 sm:py-3 px-2 sm:px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-black text-[11px] sm:text-xs shadow-md hover:shadow-emerald-900/20 transition active:scale-95 min-h-[44px]"
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('buyNormalBtn')}</span>
          </button>

          <button
            onClick={() => onJoinPool(product)}
            className="flex items-center justify-center space-x-1 sm:space-x-1.5 py-2.5 sm:py-3 px-2 sm:px-3 bg-amber-400 hover:bg-amber-500 text-stone-950 rounded-xl font-black text-[11px] sm:text-xs shadow-md transition active:scale-95 border border-amber-500 min-h-[44px]"
          >
            <Users className="w-3.5 h-3.5 text-stone-950 shrink-0" />
            <span className="truncate">{t('joinGroupPoolBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
