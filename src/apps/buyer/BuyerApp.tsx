import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Package,
  Users,
  Clock,
  Sparkles,
  ShoppingBag,
  Filter,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { CommodityCategory, Product, GroupBuyPool } from '../../types/agridirect';
import { ProductCard } from './ProductCard';
import { CheckoutModal } from './CheckoutModal';
import { GroupPoolsBoard } from './GroupPoolsBoard';
import { BuyerOrdersView } from './BuyerOrdersView';
import { ProductDetailsModal } from './ProductDetailsModal';

export const BuyerApp: React.FC = () => {
  const { products, pools, orders, currentUser, language, t } = useAgridirect();

  const [activeTab, setActiveTab] = useState<'catalog' | 'pools' | 'orders'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'NORMAL' | 'GROUP_BULK'>('NORMAL');
  const [targetPool, setTargetPool] = useState<GroupBuyPool | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);

  // Active open pools count
  const activePoolsCount = pools.filter((p) => p.status === 'OPEN').length;

  // Active buyer orders count
  const activeBuyerOrdersCount = orders.filter(
    (o) => o.buyerId === currentUser?.id
  ).length;

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category match
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch =
          p.title.en.toLowerCase().includes(query) ||
          p.title.hi.toLowerCase().includes(query) ||
          p.title.kn.toLowerCase().includes(query);
        const farmerMatch = p.farmerName.toLowerCase().includes(query);
        const locMatch = p.pickupLocationName.toLowerCase().includes(query);
        return titleMatch || farmerMatch || locMatch;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleBuyNormal = (product: Product) => {
    setSelectedProduct(product);
    setCheckoutMode('NORMAL');
    setTargetPool(null);
    setIsCheckoutOpen(true);
  };

  const handleJoinPool = (product: Product, pool?: GroupBuyPool) => {
    setSelectedProduct(product);
    setCheckoutMode('GROUP_BULK');
    setTargetPool(pool || null);
    setIsCheckoutOpen(true);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-8">
      {/* Top Marketplace Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center space-x-2 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-[11px] sm:text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('shelfLifeBanner')}</span>
          </div>

          <h1 className="text-xl sm:text-4xl font-black tracking-tight leading-tight">
            {t('marketplaceTitle')}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed line-clamp-2 sm:line-clamp-none">
            Eliminating 3-tier APMC mandi middlemen. Get unpolished pulses, dry-cured groundnuts,
            winter grains, and spices directly from verified Karnataka farmers at fair middle prices.
          </p>
        </div>
      </div>

      {/* Main App Navigation Tabs */}
      <div className="flex border-b-2 border-stone-200 space-x-2 sm:space-x-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-xs sm:text-sm font-black flex items-center space-x-1.5 sm:space-x-2 transition border-b-2 -mb-0.5 shrink-0 ${
            activeTab === 'catalog'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Fresh Harvest Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('pools')}
          className={`pb-3 text-xs sm:text-sm font-black flex items-center space-x-1.5 sm:space-x-2 transition border-b-2 -mb-0.5 relative shrink-0 ${
            activeTab === 'pools'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('activePoolsNearYou')}</span>
          {activePoolsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-400 text-stone-950 font-black text-[10px] rounded-full border border-amber-500 shadow-sm">
              {activePoolsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs sm:text-sm font-black flex items-center space-x-1.5 sm:space-x-2 transition border-b-2 -mb-0.5 relative shrink-0 ${
            activeTab === 'orders'
              ? 'border-emerald-800 text-emerald-950 font-black'
              : 'border-transparent text-stone-600 hover:text-stone-900 font-bold'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t('myOrdersTitle')}</span>
          {activeBuyerOrdersCount > 0 && (
            <span className="px-1.5 py-0.5 bg-emerald-700 text-white font-black text-[10px] rounded-full shadow-sm">
              {activeBuyerOrdersCount}
            </span>
          )}
        </button>
      </div>

      {/* View 1: Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-stone-300 rounded-2xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 focus:outline-none shadow-sm"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 touch-pan-x">
              {[
                { id: 'ALL', label: t('allCategories') },
                { id: 'PEANUTS_OILSEEDS', label: t('peanutsOilseeds') },
                { id: 'PULSES_DALS', label: t('pulsesDals') },
                { id: 'GRAINS_MILLETS', label: t('grainsMillets') },
                { id: 'DRY_SPICES', label: t('drySpices') },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black whitespace-nowrap transition shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-800 text-white shadow-md'
                      : 'bg-white border-2 border-stone-300 text-stone-800 hover:bg-stone-50 hover:border-stone-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center text-stone-400">
              <Package className="w-12 h-12 mx-auto stroke-1 mb-2 text-stone-300" />
              <p className="font-semibold text-sm">No crops found matching your search</p>
              <p className="text-xs text-stone-400 mt-1">
                Try selecting "All Categories" or searching for peanuts, dal, or spices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onBuyNormal={handleBuyNormal}
                  onJoinPool={() => handleJoinPool(product)}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* View 2: Neighborhood Group Pools */}
      {activeTab === 'pools' && (
        <GroupPoolsBoard
          onJoinPool={(product, pool) => handleJoinPool(product, pool)}
        />
      )}

      {/* View 3: Buyer Orders & 24h Inspection */}
      {activeTab === 'orders' && <BuyerOrdersView />}

      {/* Dual Checkout Modal */}
      <CheckoutModal
        product={selectedProduct}
        initialMode={checkoutMode}
        targetPool={targetPool}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => setActiveTab('orders')}
      />

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isProductDetailsOpen}
        onClose={() => setIsProductDetailsOpen(false)}
        onBuyNormal={handleBuyNormal}
        onJoinPool={handleJoinPool}
      />

      {/* Native-Feel Mobile Bottom Navigation Bar for Buyer */}
      <nav
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-xl border-t border-stone-800 safe-bottom shadow-2xl"
      >
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center space-y-1 transition active:scale-95 ${
              activeTab === 'catalog'
                ? 'text-emerald-400 font-black'
                : 'text-stone-400 hover:text-stone-200 font-semibold'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('pools');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center space-y-1 transition active:scale-95 relative ${
              activeTab === 'pools'
                ? 'text-amber-400 font-black'
                : 'text-stone-400 hover:text-stone-200 font-semibold'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              {activePoolsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-amber-400 text-stone-950 font-black text-[9px] rounded-full shadow-sm">
                  {activePoolsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Bulk Pools</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('orders');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center space-y-1 transition active:scale-95 relative ${
              activeTab === 'orders'
                ? 'text-emerald-400 font-black'
                : 'text-stone-400 hover:text-stone-200 font-semibold'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {activeBuyerOrdersCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-emerald-600 text-white font-black text-[9px] rounded-full shadow-sm">
                  {activeBuyerOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">My Orders</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

