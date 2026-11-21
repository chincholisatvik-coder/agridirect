import React, { useState } from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Truck,
  Phone,
  Copy,
  Check,
  QrCode,
  FileText,
  AlertCircle,
  Building,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { Order, Product } from '../../types/agridirect';

interface EReceiptModalProps {
  order: Order | null;
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EReceiptModal: React.FC<EReceiptModalProps> = ({
  order,
  product,
  isOpen,
  onClose,
}) => {
  const { products, language, t } = useAgridirect();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const matchedProduct = product || products.find((p) => p.id === order.productId);

  const productTitle =
    language === 'hi'
      ? order.productTitle.hi
      : language === 'kn'
      ? order.productTitle.kn
      : order.productTitle.en;

  const receiptNumber = `AGR-REC-2026-${order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const textToCopy = `Agridirect Official E-Receipt\nReceipt No: ${receiptNumber}\nOrder ID: ${order.id}\nItem: ${productTitle} (${order.quantityKg} kg)\nTotal Escrow Paid: ₹${order.totalAmount}\nFarmer: ${order.farmerName}\nDelivery Address: ${order.buyerAddress}\nStatus: Paid & Held in 24h Escrow`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/75 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-0 sm:my-6 print:shadow-none print:border-none print:m-0 print:rounded-none max-h-[92vh] flex flex-col">
        {/* Top Action Bar (hidden on print) */}
        <div className="no-print bg-emerald-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-300" />
            <h2 className="text-sm sm:text-base font-bold tracking-tight">Official Order E-Receipt</h2>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-lg text-xs font-semibold transition border border-emerald-600/40"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-lg text-xs font-semibold transition border border-emerald-600/40"
              title="Copy Receipt Reference"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable E-Receipt Document Body */}
        <div className="p-4 sm:p-8 space-y-5 sm:space-y-6 text-stone-900 print:p-6 bg-white overflow-y-auto" id="agridirect-e-receipt">
          {/* Header Banner */}
          <div className="border-b-2 border-emerald-800 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    🌾
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-emerald-950 uppercase">
                      AGRIDIRECT KARNATAKA
                    </h1>
                    <p className="text-[11px] font-semibold text-stone-500">
                      Govt of Karnataka Direct Agricultural Farmgate & Escrow Network
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                  PAID • ESCROW SECURED
                </span>
                <p className="text-[10px] text-stone-500 mt-1 font-mono">
                  Tx Hash: 0x{order.id.slice(-8)}...escrow
                </p>
              </div>
            </div>

            {/* Receipt & Order Metadata Bar */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 rounded-2xl p-3 border border-stone-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Receipt No.</span>
                <span className="font-extrabold text-stone-900 font-mono">{receiptNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Order ID</span>
                <span className="font-extrabold text-stone-900 font-mono">{order.id}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Date & Time</span>
                <span className="font-semibold text-stone-800">{orderDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Payment Mode</span>
                <span className="font-semibold text-emerald-700">UPI / Direct Escrow</span>
              </div>
            </div>
          </div>

          {/* Farmer & Buyer Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Farmer / Seller Column */}
            <div className="rounded-2xl border border-stone-200 p-4 bg-stone-50/50 space-y-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-stone-600 uppercase tracking-wider flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                  Farmer / Producer Details
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  RTC Verified
                </span>
              </div>
              <div>
                <p className="font-extrabold text-stone-900 text-sm">{order.farmerName}</p>
                <p className="text-stone-600 flex items-center mt-0.5">
                  <MapPin className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                  {matchedProduct?.pickupLocationName || 'Hubballi-Dharwad Agri Belt, Karnataka'}
                </p>
                <p className="text-stone-600 flex items-center mt-0.5">
                  <Phone className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                  {matchedProduct?.farmerPhone || '+91 98450 12890'}
                </p>
                <p className="text-[10px] text-stone-500 mt-1">
                  Land Record: <span className="font-mono text-stone-700">KA-RTC-2026-BHOOMI-092</span>
                </p>
              </div>
            </div>

            {/* Buyer / Delivery Column */}
            <div className="rounded-2xl border border-stone-200 p-4 bg-stone-50/50 space-y-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-stone-600 uppercase tracking-wider flex items-center">
                  <Truck className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                  Buyer & Delivery Details
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                  {order.fulfillmentType === 'HOME_DELIVERY' ? 'Doorstep Delivery' : 'Self-Pickup'}
                </span>
              </div>
              <div>
                <p className="font-extrabold text-stone-900 text-sm">{order.buyerName}</p>
                <p className="text-stone-600 flex items-start mt-0.5">
                  <MapPin className="w-3 h-3 mr-1 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{order.buyerAddress}</span>
                </p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Order Type: <span className="font-semibold text-stone-800">{order.orderType === 'GROUP_BULK' ? 'Community Bulk Buy Pool' : 'Direct Individual Purchase'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="rounded-2xl border border-stone-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Quality Grade</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr>
                  <td className="py-3 px-3 text-stone-500 font-medium">1</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-stone-900">{productTitle}</p>
                    <p className="text-[11px] text-stone-500">
                      Harvest: {matchedProduct?.harvestMonthYear || 'Oct 2026'} · Shelf Life: {matchedProduct?.shelfLifeMonths || 6} Months
                    </p>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 bg-stone-100 rounded text-[11px] font-semibold text-stone-800">
                      {matchedProduct?.qualityGrade ? matchedProduct.qualityGrade.replace(/_/g, ' ') : 'Grade A Bold'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-stone-900">
                    {order.quantityKg} kg
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-stone-700">
                    ₹{order.unitPriceApplied}/kg
                  </td>
                  <td className="py-3 px-3 text-right font-black text-stone-900">
                    ₹{order.subtotalAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-stone-50 border-t border-stone-200 divide-y divide-stone-100">
                <tr>
                  <td colSpan={5} className="py-2 px-3 text-right font-medium text-stone-600">
                    Produce Subtotal:
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-stone-900">
                    ₹{order.subtotalAmount.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="py-2 px-3 text-right font-medium text-stone-600">
                    Logistics / Delivery Charges:
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-stone-900">
                    {order.deliveryFee > 0 ? `₹${order.deliveryFee.toFixed(2)}` : 'FREE (Farm Pickup)'}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="py-2 px-3 text-right font-medium text-stone-600">
                    Mandi Middleman Commission:
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-700">
                    ₹0.00 (Zero Middleman)
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="py-2 px-3 text-right font-medium text-stone-600">
                    Agricultural GST / Cess:
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-stone-700">
                    ₹0.00 (Tax Exempt)
                  </td>
                </tr>
                <tr className="bg-emerald-50">
                  <td colSpan={5} className="py-3 px-3 text-right font-black text-emerald-950 text-sm">
                    Grand Total Held in Escrow:
                  </td>
                  <td className="py-3 px-3 text-right font-black text-emerald-900 text-base">
                    ₹{order.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Escrow Guarantee & Security Barcode/QR Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 rounded-2xl p-4 border border-stone-200 items-center">
            {/* Simulated Clean SVG QR Code */}
            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-stone-200">
              <svg
                viewBox="0 0 100 100"
                className="w-24 h-24 text-stone-900"
                fill="currentColor"
              >
                {/* 3 Finder patterns */}
                <rect x="10" y="10" width="24" height="24" rx="3" fill="#113C2E" />
                <rect x="14" y="14" width="16" height="16" rx="2" fill="#FFFFFF" />
                <rect x="18" y="18" width="8" height="8" rx="1" fill="#113C2E" />

                <rect x="66" y="10" width="24" height="24" rx="3" fill="#113C2E" />
                <rect x="70" y="14" width="16" height="16" rx="2" fill="#FFFFFF" />
                <rect x="74" y="18" width="8" height="8" rx="1" fill="#113C2E" />

                <rect x="10" y="66" width="24" height="24" rx="3" fill="#113C2E" />
                <rect x="14" y="70" width="16" height="16" rx="2" fill="#FFFFFF" />
                <rect x="18" y="74" width="8" height="8" rx="1" fill="#113C2E" />

                {/* Simulated Data blocks */}
                <rect x="42" y="12" width="6" height="6" fill="#113C2E" />
                <rect x="52" y="12" width="6" height="6" fill="#113C2E" />
                <rect x="42" y="24" width="6" height="6" fill="#113C2E" />
                <rect x="52" y="24" width="6" height="6" fill="#113C2E" />
                <rect x="42" y="36" width="16" height="6" fill="#113C2E" />

                <rect x="12" y="42" width="6" height="6" fill="#113C2E" />
                <rect x="24" y="42" width="6" height="6" fill="#113C2E" />
                <rect x="12" y="52" width="6" height="6" fill="#113C2E" />
                <rect x="24" y="52" width="6" height="6" fill="#113C2E" />

                <rect x="40" y="48" width="8" height="8" rx="1" fill="#047857" />
                <rect x="54" y="48" width="8" height="8" rx="1" fill="#047857" />
                <rect x="44" y="64" width="12" height="6" fill="#113C2E" />
                <rect x="64" y="64" width="6" height="12" fill="#113C2E" />
                <rect x="76" y="64" width="14" height="6" fill="#113C2E" />
                <rect x="74" y="76" width="16" height="12" fill="#113C2E" />
                <rect x="44" y="78" width="14" height="8" fill="#113C2E" />
              </svg>
              <span className="text-[9px] font-mono font-bold text-stone-500 mt-1 uppercase">
                Scan for Escrow Release
              </span>
            </div>

            {/* Escrow Terms and Policy */}
            <div className="sm:col-span-2 space-y-1.5 text-xs text-stone-600">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>24-Hour Escrow Quality Protection Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Your payment of <strong className="text-stone-900">₹{order.totalAmount.toFixed(2)}</strong> is locked safely in the Agridirect Karnataka escrow vault. Funds are only transferred to farmer <strong className="text-stone-900">{order.farmerName}</strong> after the 24-hour buyer inspection window has elapsed without dispute.
              </p>
              <div className="flex items-center space-x-2 text-[10px] text-stone-500 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Moisture & Weight Dispute Guarantee</span>
                <span>•</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Middleman Deductions</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-stone-200 pt-4 text-center text-[10px] text-stone-400">
            This is a computer-generated electronic receipt issued under the Karnataka Farmer Direct Produce Marketplace Act. No physical signature required.
          </div>
        </div>

        {/* Bottom Actions (hidden on print) */}
        <div className="no-print bg-stone-50 border-t border-stone-200 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-stone-500">
            Order confirmed. You can re-view or print this e-receipt anytime from <span className="font-semibold text-stone-700">My Orders</span>.
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print E-Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

