import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Truck,
  X,
  Star,
  Sparkles,
  ShoppingBag,
  Users,
  ChevronRight,
  TrendingDown,
  Phone,
  Layers,
  Award,
  Maximize2,
  Info,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { Product } from '../../types/agridirect';
import { calculateHaversineDistance } from '../../utils/pricing';
import { ReportModal } from '../../components/ReportModal';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onBuyNormal: (product: Product) => void;
  onJoinPool: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onBuyNormal,
  onJoinPool,
}) => {
  const { language, t, currentUser } = useAgridirect();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [pincodeInput, setPincodeInput] = useState(currentUser?.pincode || '580021');
  const [pincodeChecked, setPincodeChecked] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews' | 'farmer'>('specs');
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActivePhotoIndex(0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const title =
    language === 'hi' ? product.title.hi : language === 'kn' ? product.title.kn : product.title.en;
  const description =
    language === 'hi'
      ? product.description.hi
      : language === 'kn'
      ? product.description.kn
      : product.description.en;

  // Multi-angle gallery images
  const galleryImages = [
    {
      url: product.photoUrl,
      label: 'Main Crop Harvest',
      caption: 'Real unpolished crop straight from the drying yard',
    },
    {
      url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80',
      label: 'Moisture Testing',
      caption: 'Digital moisture meter verification bench (< 10% moisture content)',
    },
    {
      url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
      label: 'Storage & Packaging',
      caption: 'Packed in double-layered breathable food-grade jute gunny bags',
    },
    {
      url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
      label: 'Farm Origin & Land Record',
      caption: 'Farmstead plot with Karnataka Bhoomi RTC Verified documentation',
    },
  ];

  // Pricing calculations
  const retailPrice = product.marketRetailBenchmarkPerKg;
  const normalPrice = product.normalPricePerKg;
  const bulkPrice = product.bulkPricePerKg;
  const wholesaleMandi = product.wholesaleBenchmarkPerKg;

  const normalSavings = Math.max(0, retailPrice - normalPrice);
  const normalSavingsPct = Math.max(0, Math.round((normalSavings / retailPrice) * 100));

  const bulkSavings = Math.max(0, retailPrice - bulkPrice);
  const bulkSavingsPct = Math.max(0, Math.round((bulkSavings / retailPrice) * 100));

  const farmerGainPct = Math.max(
    0,
    Math.round(((normalPrice - wholesaleMandi) / (wholesaleMandi || 1)) * 100)
  );

  const distanceKm = calculateHaversineDistance(
    currentUser?.lat || 15.3715,
    currentUser?.lng || 75.1235,
    product.pickupLat || 15.3647,
    product.pickupLng || 75.1240
  );

  const handleBuyNormal = () => {
    onClose();
    onBuyNormal(product);
  };

  const handleJoinPool = () => {
    onClose();
    onJoinPool(product);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/80 p-0 sm:p-4 md:p-6 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-details-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[92vh] sm:max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-stone-200">
        {/* Sticky Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 z-20 rounded-full bg-stone-900/80 hover:bg-stone-950 p-2 sm:p-2.5 text-white transition shadow-lg backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Amazon/Flipkart Breadcrumbs */}
        <div className="border-b border-stone-200 bg-stone-50/80 px-6 py-3 text-xs text-stone-500 flex items-center space-x-1.5 overflow-x-auto">
          <span className="font-semibold text-emerald-800">AgriDirect Karnataka</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="capitalize">{product.category.replace(/_/g, ' ').toLowerCase()}</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="font-bold text-stone-800 truncate">{title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
          {/* LEFT COLUMN: Gallery & Visual Verification (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 space-y-4 bg-stone-50/30 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Main Image Frame with Amazon-style Zoom Badge */}
              <div className="relative aspect-square w-full rounded-2xl bg-stone-100 overflow-hidden border border-stone-200 shadow-inner group">
                <img
                  src={galleryImages[activePhotoIndex].url}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Overlaid Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-900/90 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-sm">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Gemini AI Verified Real</span>
                  </span>

                  <span className="inline-flex items-center px-2 py-0.5 bg-emerald-600/95 text-white rounded-md text-[10px] font-bold shadow-md">
                    {product.qualityGrade.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3">
                  <span className="px-2 py-1 bg-stone-900/80 text-white text-[10px] font-semibold rounded-md backdrop-blur-sm">
                    Photo {activePhotoIndex + 1} of {galleryImages.length}
                  </span>
                </div>
              </div>

              {/* Caption of active photo */}
              <p className="text-xs text-stone-500 italic text-center px-2">
                {galleryImages[activePhotoIndex].caption}
              </p>

              {/* Interactive Thumbnails */}
              <div className="grid grid-cols-4 gap-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                      activePhotoIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-md'
                        : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quality & Escrow Assurance Box */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2.5 text-xs text-emerald-950">
              <div className="flex items-center space-x-2 font-bold text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>AgriDirect Escrow & Quality Protection</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-emerald-800">
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>24-Hour Post-Delivery Inspection:</strong> Test moisture and grain count before funds release to farmer.</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Mandi Commission:</strong> 100% of purchase value directly benefits Karnataka farmers.</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Official E-Receipt:</strong> Downloadable, tax-exempt agricultural invoice generated on checkout.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: Details, Pricing, Pincode & Purchase Actions (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
            {/* Header: Category, Title, Seller & Ratings */}
            <div className="space-y-2 border-b border-stone-200 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  {product.category.replace(/_/g, ' ')}
                </span>
                <span className="inline-flex items-center text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Award className="w-3 h-3 mr-1 text-amber-700" />
                  AgriDirect Choice
                </span>
              </div>

              <h1 id="product-details-title" className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
                {title}
              </h1>

              {/* Farmer and Ratings row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1">
                <div className="flex items-center text-amber-500 font-bold">
                  <div className="flex mr-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-400/50 text-amber-400/50'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-stone-900 font-black">4.9</span>
                  <span className="text-stone-400 ml-1">(86 ratings)</span>
                </div>

                <span className="text-stone-300">•</span>

                <div className="flex items-center space-x-1 font-semibold text-stone-700">
                  <span>Sold by:</span>
                  <span className="font-extrabold text-stone-900">{product.farmerName}</span>
                  {product.farmerVerified && (
                    <span title="Bhoomi RTC Verified Landholder" className="inline-flex">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Amazon / Flipkart Style Pricing Card */}
            <div className="rounded-2xl border-2 border-emerald-600/30 bg-emerald-50/40 p-4 space-y-3">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-black text-emerald-950">₹{normalPrice}</span>
                <span className="text-xs font-semibold text-stone-500">/ kg</span>
                <span className="text-sm font-semibold line-through text-stone-400">
                  ₹{retailPrice}/kg MRP
                </span>
                <span className="px-2 py-0.5 bg-emerald-700 text-white font-black text-xs rounded-md">
                  {normalSavingsPct}% OFF
                </span>
              </div>

              {/* Mandi vs Retail Middleman Transparency */}
              <div className="bg-white rounded-xl p-3 border border-emerald-200/80 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-stone-600">
                  <span>Supermarket Retail MRP:</span>
                  <span className="font-bold text-stone-800 line-through">₹{retailPrice}/kg</span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>APMC Mandi Middleman pays farmer:</span>
                  <span className="font-bold text-red-600">₹{wholesaleMandi}/kg</span>
                </div>
                <div className="flex justify-between items-center font-bold text-emerald-800 border-t border-stone-100 pt-1">
                  <span>AgriDirect Fair Direct Price:</span>
                  <span className="text-sm font-black text-emerald-900">₹{normalPrice}/kg</span>
                </div>
                <p className="text-[10px] text-emerald-700 pt-0.5">
                  ✓ You save ₹{normalSavings}/kg ({normalSavingsPct}%) • Farmer earns +{farmerGainPct}% more than Mandi!
                </p>
              </div>

              {/* Group Buy option callout */}
              <div className="flex items-center justify-between bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs">
                <div>
                  <span className="font-extrabold text-amber-950 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-amber-700" />
                    Community Bulk Buy Deal
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Join with society neighbors: <strong>₹{bulkPrice}/kg</strong> (Save {bulkSavingsPct}%)
                  </span>
                </div>
                <button
                  onClick={handleJoinPool}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-900 font-extrabold rounded-lg text-xs shadow-sm transition"
                >
                  Join Pool
                </button>
              </div>
            </div>

            {/* Flipkart-style Pincode & Delivery Checker */}
            <div className="rounded-2xl border border-stone-200 p-4 space-y-3 text-xs bg-stone-50/50">
              <span className="font-bold text-stone-700 uppercase tracking-wider block">
                Delivery & Availability
              </span>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-emerald-700" />
                  <input
                    type="text"
                    value={pincodeInput}
                    onChange={(e) => {
                      setPincodeInput(e.target.value);
                      setPincodeChecked(false);
                    }}
                    placeholder="Enter 6-digit delivery pincode"
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl bg-white text-xs font-semibold focus:outline-emerald-600"
                    maxLength={6}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPincodeChecked(true)}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition"
                >
                  {t('checkBtn')}
                </button>
              </div>

              {pincodeChecked && (
                <div className="space-y-1.5 text-stone-600 text-[11px]">
                  <p className="flex items-center text-emerald-800 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                    Delivery available to {pincodeInput} · Direct from farm within 24 hours
                  </p>
                  <p className="flex items-center text-stone-500">
                    <Truck className="w-3.5 h-3.5 mr-1 text-stone-400 shrink-0" />
                    Farmyard is approx. <strong>{distanceKm} km</strong> from your location ({product.pickupLocationName})
                  </p>
                  <p className="text-stone-500">
                    Stock Available: <strong className="text-stone-900">{product.availableStockKg} kg</strong> ready in harvest barn
                  </p>
                </div>
              )}
            </div>

            {/* Tabbed Specifications, Reviews & Farmer Details */}
            <div className="space-y-3">
              <div className="flex border-b border-stone-200 space-x-6 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'specs'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Product Specifications
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('farmer')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'farmer'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Farmer & Provenance
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'reviews'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Customer Reviews (86)
                </button>
              </div>

              {activeTab === 'specs' && (
                <div className="space-y-3">
                  <p className="text-xs text-stone-600 leading-relaxed">{description}</p>
                  <div className="rounded-2xl border border-stone-200 overflow-hidden text-xs">
                    <div className="grid grid-cols-2 p-2.5 bg-stone-50 border-b border-stone-200">
                      <span className="font-bold text-stone-700">Quality Grading:</span>
                      <span className="font-extrabold text-stone-950">{product.qualityGrade.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5 bg-white border-b border-stone-200">
                      <span className="font-bold text-stone-700">Moisture Content:</span>
                      <span className="font-extrabold text-emerald-800">&lt; 9.4% (Optimal Dry Standard)</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5 bg-stone-50 border-b border-stone-200">
                      <span className="font-bold text-stone-700">Harvest Period:</span>
                      <span className="font-extrabold text-stone-950">{product.harvestMonthYear}</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5 bg-white border-b border-stone-200">
                      <span className="font-bold text-stone-700">Guaranteed Shelf-Life:</span>
                      <span className="font-extrabold text-stone-950">{product.shelfLifeMonths} Months</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5 bg-stone-50 border-b border-stone-200">
                      <span className="font-bold text-stone-700">Processing & Polish:</span>
                      <span className="font-extrabold text-stone-950">Naturally Sun-Cured · 0% Chemical Waxing</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5 bg-white">
                      <span className="font-bold text-stone-700">Packaging Type:</span>
                      <span className="font-extrabold text-stone-950">Double Food-Grade Breathable Jute Bags</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'farmer' && (
                <div className="rounded-2xl border border-stone-200 p-4 space-y-3 text-xs bg-stone-50/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-black flex items-center justify-center text-lg shadow-sm">
                      {product.farmerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm flex items-center">
                        {product.farmerName}
                        <ShieldCheck className="w-4 h-4 ml-1.5 text-emerald-600" />
                      </h4>
                      <p className="text-stone-600 font-medium text-[11px]">
                        Certified Organic & Pulse Cultivator · Dharwad Agricultural Belt
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-stone-200 pt-3 grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-stone-600 font-semibold block">Land Record RTC (Pahani):</span>
                      <span className="font-mono font-bold text-stone-900">KA-RTC-2026-BHOOMI-092</span>
                    </div>
                    <div>
                      <span className="text-stone-600 font-semibold block">Farm Yard Location:</span>
                      <span className="font-bold text-stone-900">{product.pickupLocationName}</span>
                    </div>
                    <div>
                      <span className="text-stone-600 font-semibold block">Direct Contact:</span>
                      <span className="font-bold text-stone-900">{product.farmerPhone}</span>
                    </div>
                    <div>
                      <span className="text-stone-600 font-semibold block">Escrow Settlement:</span>
                      <span className="font-extrabold text-emerald-800">Karnataka AgriDirect Escrow</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">Anita D. (Vidyanagar, Hubballi)</span>
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-stone-600 text-[11px]">
                      "Extremely bold groundnuts! Completely dry with zero bad kernels. Delivered directly to our apartment gate within 24 hours."
                    </p>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">Mahesh K. (Dharwad)</span>
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-stone-600 text-[11px]">
                      "Ordered 25kg through our society bulk pool. Incredible savings compared to market retail and the quality is unadulterated."
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Prominent Action Buy Buttons (Amazon/Flipkart Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleBuyNormal}
                className="flex items-center justify-center space-x-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm py-3.5 px-4 shadow-lg hover:shadow-emerald-700/25 transition active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buy Now · ₹{normalPrice}/kg</span>
              </button>

              <button
                type="button"
                onClick={handleJoinPool}
                className="flex items-center justify-center space-x-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-900 font-black text-sm py-3.5 px-4 shadow-lg hover:shadow-amber-500/25 transition active:scale-98"
              >
                <Users className="w-4 h-4" />
                <span>Join Group Pool · ₹{bulkPrice}/kg</span>
              </button>
            </div>

            {/* Platform Protection & Incident Reporting Link */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-stone-200/80 text-xs text-stone-500">
              <span className="flex items-center space-x-1.5 text-stone-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>24-Hour Quality Inspection & Directorate Escrow Protected</span>
              </span>

              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 font-bold hover:underline transition"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Report Produce Listing</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Incident / Dispute Reporting Modal */}
      {isReportOpen && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          defaultTargetType="PRODUCT"
          defaultTargetId={product.id}
          defaultTargetName={`${title} (${product.qualityGrade})`}
        />
      )}
    </div>
  );
};
