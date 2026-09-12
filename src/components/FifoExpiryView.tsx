import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Tag, 
  Percent, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  HelpCircle, 
  ChevronRight, 
  MapPin, 
  ShoppingBag,
  Printer,
  RotateCcw,
  Check,
  Search,
  Filter,
  Layers,
  Zap
} from 'lucide-react';
import { Product, ProductLot } from '../types';

interface FifoExpiryViewProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onSelectForStockOut: (productId: string) => void;
}

interface FlatLotItem {
  productId: string;
  productName: string;
  productEmoji: string;
  category: string;
  location: string;
  price: number;
  originalPrice?: number;
  isClearance?: boolean;
  clearanceDiscount?: number;
  unit: string;
  lotNumber: string;
  expiryDate: string;
  quantity: number;
  receivedDate?: string;
  daysRemaining: number;
  isEarliestForProduct: boolean;
  fifoRankInProduct: number;
  isGlobalEarliest: boolean;
}

export const FifoExpiryView: React.FC<FifoExpiryViewProps> = ({
  products,
  onUpdateProduct,
  onSelectForStockOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'urgent' | 'warning' | 'clearance'>('all');
  const [showGuide, setShowGuide] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calculateDaysRemaining = (expiryDateStr: string) => {
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Flatten and prepare all lots across all products
  const allLots = useMemo(() => {
    const list: FlatLotItem[] = [];

    products.forEach((p) => {
      const lots: ProductLot[] = p.lots && p.lots.length > 0 
        ? p.lots 
        : p.expiryDate 
          ? [{ lotNumber: 'LOT-01', expiryDate: p.expiryDate, quantity: p.currentStock, isClearance: p.isClearance }]
          : [];

      // Sort product's lots by expiryDate ascending
      const sortedLots = [...lots].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      sortedLots.forEach((lot, index) => {
        const days = calculateDaysRemaining(lot.expiryDate);
        list.push({
          productId: p.id,
          productName: p.name,
          productEmoji: p.emoji || '📦',
          category: p.category,
          location: p.location,
          price: p.price,
          originalPrice: p.originalPrice,
          isClearance: lot.isClearance ?? p.isClearance,
          clearanceDiscount: p.clearanceDiscount || 30,
          unit: p.unit,
          lotNumber: lot.lotNumber,
          expiryDate: lot.expiryDate,
          quantity: lot.quantity,
          receivedDate: lot.receivedDate,
          daysRemaining: days,
          isEarliestForProduct: index === 0,
          fifoRankInProduct: index + 1,
          isGlobalEarliest: false, // will calculate below
        });
      });
    });

    // Global sort by expiry date
    list.sort((a, b) => a.daysRemaining - b.daysRemaining);

    if (list.length > 0) {
      list[0].isGlobalEarliest = true;
    }

    return list;
  }, [products, today]);

  // Statistics
  const urgentCount = allLots.filter((item) => item.daysRemaining <= 7 && item.daysRemaining >= 0).length;
  const expiredCount = allLots.filter((item) => item.daysRemaining < 0).length;
  const warningCount = allLots.filter((item) => item.daysRemaining > 7 && item.daysRemaining <= 30).length;
  const clearanceCount = allLots.filter((item) => item.isClearance).length;

  // Filtered items
  const filteredLots = useMemo(() => {
    return allLots.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          item.productName.toLowerCase().includes(q) ||
          item.productId.toLowerCase().includes(q) ||
          item.lotNumber.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Filter category
      if (filterType === 'urgent') return item.daysRemaining <= 7;
      if (filterType === 'warning') return item.daysRemaining > 7 && item.daysRemaining <= 30;
      if (filterType === 'clearance') return item.isClearance;

      return true;
    });
  }, [allLots, searchQuery, filterType]);

  // Toggle Clearance 30% on a product / lot
  const handleToggleClearance = (item: FlatLotItem) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;

    const willBeClearance = !item.isClearance;
    let newPrice = product.price;
    let newOriginalPrice = product.originalPrice;

    if (willBeClearance) {
      // Apply 30% discount
      newOriginalPrice = product.price;
      newPrice = Math.max(1, Math.round(product.price * 0.7)); // 30% off
    } else {
      // Revert discount
      if (product.originalPrice) {
        newPrice = product.originalPrice;
        newOriginalPrice = undefined;
      }
    }

    // Update lots
    const updatedLots = (product.lots || []).map((l) => 
      l.lotNumber === item.lotNumber 
        ? { ...l, isClearance: willBeClearance } 
        : l
    );

    const updatedProduct: Product = {
      ...product,
      price: newPrice,
      originalPrice: newOriginalPrice,
      isClearance: willBeClearance,
      clearanceDiscount: 30,
      lots: updatedLots.length > 0 ? updatedLots : undefined,
      lastUpdated: new Date().toISOString(),
    };

    onUpdateProduct(updatedProduct);

    const msg = willBeClearance
      ? `ติดป้าย Clearance -30% ให้ ${product.name} (ราคา ฿${product.price} ➔ ฿${newPrice})`
      : `ยกเลิกป้าย Clearance ให้ ${product.name} คืนราคาปกติ ฿${newPrice}`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-4 pb-24 font-['Prompt',sans-serif]">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-1.5">
                <span>วันหมดอายุ & ลำดับ FIFO</span>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">First-In, First-Out</span>
              </h2>
              <p className="text-xs text-amber-100 mt-0.5">
                จัดระเบียบล็อตสินค้า ขายของล็อตเก่าก่อน ป้องกันของหมดอายุค้างสต๊อก
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-purple-950 text-white p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md animate-in fade-in border border-purple-900">
          <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Store Merchandising Visual Guidance Box */}
      {showGuide && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5 relative">
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            className="absolute right-3 top-3 text-amber-700 hover:text-amber-900 text-xs p-1"
            title="ซ่อนคำแนะนำ"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>คำแนะนำการวางสินค้าหน้าร้านตามหลัก FIFO (First-In, First-Out)</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            กฎเหล็กของร้านโชห่วย: <strong className="text-amber-950">"หยิบล็อตเก่าไว้ด้านหน้า ล็อตใหม่ไว้ด้านหลัง"</strong> เพื่อให้ลูกค้าหยิบล็อตที่ใกล้หมดอายุไปก่อนเสมอ
          </p>

          {/* Visual Shelf Diagram */}
          <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2 text-center text-xs">
            <div className="flex-1 p-2 bg-amber-100/90 rounded-lg border border-amber-300 font-bold text-amber-950">
              <span className="block text-[10px] text-amber-700 uppercase tracking-wide">ตำแหน่งหน้าสุด</span>
              <span className="text-xs sm:text-sm text-rose-700">👀 #FIFO ลำดับที่ 1</span>
              <span className="block text-[10px] text-slate-600 mt-0.5">ล็อตหมดอายุก่อน (ขายก่อน!)</span>
            </div>

            <ArrowRight className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />

            <div className="flex-1 p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              <span className="block text-[10px] text-slate-500 uppercase tracking-wide">ตำแหน่งด้านใน/หลัง</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800">📦 #FIFO ลำดับรอง</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">ล็อตใหม่ วันหมดอายุยาวกว่า</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1">
            <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>สินค้าที่เหลือเวลา &le; 7 วัน กดปุ่ม <strong>"ติดป้าย Clearance -30%"</strong> ด้านล่างเพื่อเร่งระบายสินค้าได้ทันที</span>
          </div>
        </div>
      )}

      {/* Expiry Overview Metric Cards */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <button
          onClick={() => setFilterType('urgent')}
          className={`p-2.5 rounded-xl border transition-all ${
            filterType === 'urgent'
              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
              : 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
          }`}
        >
          <span className="block text-[10px] sm:text-xs font-semibold">ใกล้หมด (≤7 วัน)</span>
          <span className="block text-xl font-bold mt-0.5">{urgentCount + expiredCount}</span>
        </button>

        <button
          onClick={() => setFilterType('warning')}
          className={`p-2.5 rounded-xl border transition-all ${
            filterType === 'warning'
              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
              : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
          }`}
        >
          <span className="block text-[10px] sm:text-xs font-semibold">เตือน (≤30 วัน)</span>
          <span className="block text-xl font-bold mt-0.5">{warningCount}</span>
        </button>

        <button
          onClick={() => setFilterType('clearance')}
          className={`p-2.5 rounded-xl border transition-all ${
            filterType === 'clearance'
              ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
              : 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'
          }`}
        >
          <span className="block text-[10px] sm:text-xs font-semibold">ป้าย Clearance</span>
          <span className="block text-xl font-bold mt-0.5">{clearanceCount}</span>
        </button>

        <button
          onClick={() => setFilterType('all')}
          className={`p-2.5 rounded-xl border transition-all ${
            filterType === 'all'
              ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <span className="block text-[10px] sm:text-xs font-semibold">ทุกล็อต FIFO</span>
          <span className="block text-xl font-bold mt-0.5">{allLots.length}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาชื่อสินค้า, รหัสล็อต หรือตำแหน่ง..."
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* FIFO Expiry Queue List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>คิวจัดลำดับล็อตตามวันหมดอายุ (FIFO Queue)</span>
          </span>
          <span>{filteredLots.length} รายการล็อต</span>
        </div>

        {filteredLots.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">ไม่พบล็อตสินค้าในเงื่อนไขนี้</h3>
            <p className="text-xs text-slate-500">ทุกล็อตสินค้าอยู่ในเกณฑ์ปลอดภัย หรือไม่มีสินค้าที่ตรงกับการค้นหา</p>
          </div>
        ) : (
          filteredLots.map((item) => {
            const isExpired = item.daysRemaining < 0;
            const isUrgent = item.daysRemaining <= 7 && !isExpired;
            const isWarning = item.daysRemaining > 7 && item.daysRemaining <= 30;

            const expiryFormatted = new Date(item.expiryDate).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={`${item.productId}-${item.lotNumber}`}
                className={`p-3.5 rounded-2xl bg-white border transition-all shadow-2xs relative overflow-hidden ${
                  item.isClearance
                    ? 'border-purple-300 ring-1 ring-purple-400 bg-purple-50/20'
                    : isExpired
                      ? 'border-rose-400 bg-rose-50/25'
                      : isUrgent
                        ? 'border-amber-400 bg-amber-50/20'
                        : 'border-slate-200'
                }`}
              >
                {/* FIFO Badge Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* #FIFO Rank 1 prominent tag */}
                      {item.isEarliestForProduct ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-600 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs animate-pulse">
                          <span>#FIFO ลำดับที่ 1</span>
                          <span className="text-[10px] bg-amber-800/80 px-1 rounded font-normal">ขายก่อน!</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                          #FIFO ลำดับที่ {item.fifoRankInProduct} (สต๊อกรอง)
                        </span>
                      )}

                      {/* Lot number */}
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.lotNumber}
                      </span>

                      {/* Clearance Tag */}
                      {item.isClearance && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200 flex items-center gap-0.5">
                          <Tag className="w-3 h-3 text-purple-600" />
                          <span>Clearance -30%</span>
                        </span>
                      )}
                    </div>

                    {/* Product Name & Emoji */}
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0" role="img" aria-label="emoji">
                        {item.productEmoji}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        {item.productName}
                      </h3>
                    </div>

                    {/* Meta info: Location & Price */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.location}
                      </span>
                      <span>•</span>
                      <span>จำนวนในล็อต: <strong className="text-slate-800">{item.quantity} {item.unit}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {item.isClearance && item.originalPrice ? (
                          <>
                            <span className="line-through text-slate-400 text-[11px]">฿{item.originalPrice}</span>
                            <span className="font-bold text-purple-700 text-sm">฿{item.price}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-slate-800">฿{item.price}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Expiry Pill */}
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                      isExpired
                        ? 'bg-rose-600 text-white'
                        : isUrgent
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isWarning
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                    }`}>
                      {isExpired 
                        ? 'หมดอายุแล้ว!' 
                        : item.daysRemaining === 0 
                          ? 'หมดอายุวันนี้!' 
                          : `เหลืออีก ${item.daysRemaining} วัน`}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Exp: {expiryFormatted}
                    </span>
                  </div>
                </div>

                {/* Merchandising Placement Guide Note */}
                <div className="mt-2.5 pt-2 bg-slate-50/80 -mx-3.5 -mb-3.5 p-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-1 min-w-[200px]">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    <span>
                      {item.isEarliestForProduct 
                        ? `ตำแหน่ง: นำล็อตนี้วาง "หน้าสุด" ของ ${item.location} เพื่อให้ลูกค้าหยิบก่อน`
                        : `ตำแหน่ง: จัดเก็บไว้ "ด้านหลัง" รอขายล็อตที่ 1 หมดก่อน`}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Clearance 30% button */}
                    <button
                      type="button"
                      onClick={() => handleToggleClearance(item)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs ${
                        item.isClearance
                          ? 'bg-purple-100 text-purple-900 border border-purple-300 hover:bg-purple-200'
                          : 'bg-amber-500 hover:bg-amber-600 text-white'
                      }`}
                      title={item.isClearance ? 'ยกเลิกป้าย Clearance' : 'ติดป้ายลดราคา Clearance 30%'}
                    >
                      <Percent className="w-3 h-3" />
                      <span>{item.isClearance ? 'ยกเลิก Clearance' : 'ลด Clearance 30%'}</span>
                    </button>

                    {/* Dispense / Sell Out button */}
                    <button
                      type="button"
                      onClick={() => onSelectForStockOut(item.productId)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-xs"
                      title="ตัดสต๊อก / ขายสินค้านี้"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>ขายสินค้านี้</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
