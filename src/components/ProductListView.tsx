import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Tag, 
  ArrowUpDown, 
  Sparkles,
  Layers,
  Camera,
  Barcode as BarcodeIcon
} from 'lucide-react';
import { Product } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface ProductListViewProps {
  products: Product[];
  onSelectForStockIn: (productId: string) => void;
  onSelectForStockOut: (productId: string) => void;
  onEditProduct: (product: Product) => void;
  onAddNewProduct: () => void;
}

export const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  onSelectForStockIn,
  onSelectForStockOut,
  onEditProduct,
  onAddNewProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out' | 'normal'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stock-asc' | 'popular' | 'name' | 'id'>('stock-asc');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Unique list of locations for filtering
  const locations = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.location) set.add(p.location.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.location.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      if (!matchQuery) return false;

      // Status filter
      if (statusFilter === 'low' && !(p.currentStock <= p.minStock && p.currentStock > 0)) return false;
      if (statusFilter === 'out' && p.currentStock !== 0) return false;
      if (statusFilter === 'normal' && p.currentStock <= p.minStock) return false;

      // Location filter
      if (locationFilter !== 'all' && p.location.trim() !== locationFilter) return false;

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'stock-asc') return a.currentStock - b.currentStock;
      if (sortBy === 'popular') return (b.totalSold || 0) - (a.totalSold || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'th');
      if (sortBy === 'id') return a.id.localeCompare(b.id);
      return 0;
    });

    return list;
  }, [products, searchQuery, statusFilter, locationFilter, sortBy]);

  const lowStockTotal = products.filter((p) => p.currentStock <= p.minStock).length;

  const handleBarcodeScanned = (barcode: string) => {
    setSearchQuery(barcode);
    setIsScannerOpen(false);
  };

  return (
    <div className="space-y-3.5 pb-24">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        {/* Instant Search Bar with Barcode Scanner button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์ชื่อสินค้า, รหัส, บาร์โค้ด หรือชั้น..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-2 bg-purple-50 border border-purple-200 text-purple-900 hover:bg-purple-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
            title="สแกนบาร์โค้ดเพื่อค้นหา"
          >
            <Camera className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">สแกนบาร์โค้ด</span>
            <span className="sm:hidden">สแกน</span>
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('low')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap flex items-center gap-1 transition-all ${
              statusFilter === 'low'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ใกล้หมด ({lowStockTotal})</span>
          </button>
          <button
            onClick={() => setStatusFilter('out')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              statusFilter === 'out'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            หมดสต๊อก ({products.filter((p) => p.currentStock === 0).length})
          </button>
          <button
            onClick={() => setStatusFilter('normal')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              statusFilter === 'normal'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            ปกติ ({products.filter((p) => p.currentStock > p.minStock).length})
          </button>
        </div>

        {/* Location & Sort dropdowns */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Location filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-transparent w-full text-slate-700 focus:outline-none truncate"
            >
              <option value="all">ทุกตำแหน่งจัดเก็บ</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent w-full text-slate-700 focus:outline-none truncate"
            >
              <option value="stock-asc">คงเหลือ: น้อยไปมาก</option>
              <option value="popular">ขายดี/เบิกบ่อยสุด</option>
              <option value="name">ชื่อสินค้า ก-ฮ</option>
              <option value="id">รหัสสินค้า</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count & Quick Add button */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span>พบ {filteredProducts.length} รายการ</span>
        <button
          onClick={onAddNewProduct}
          className="text-purple-700 font-semibold hover:underline flex items-center gap-1"
        >
          <span>+ เพิ่มสินค้าใหม่</span>
        </button>
      </div>

      {/* Product List Cards */}
      <div className="space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <p className="text-sm font-medium text-slate-600">ไม่พบสินค้าตามเงื่อนไขที่เลือก</p>
            <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรอง</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setLocationFilter('all');
              }}
              className="mt-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isLow = p.currentStock <= p.minStock && p.currentStock > 0;
            const isOut = p.currentStock === 0;

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl bg-white border transition-all shadow-2xs ${
                  isOut
                    ? 'border-rose-400 ring-1 ring-rose-400/50 bg-rose-50/20'
                    : isLow
                      ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header: Code, Category & Edit */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                      {p.id}
                    </span>
                    {p.barcode && (
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <BarcodeIcon className="w-2.5 h-2.5 text-slate-400" />
                        {p.barcode}
                      </span>
                    )}
                    <span className="text-[11px] bg-purple-50 text-purple-900 border border-purple-100 px-2 py-0.5 rounded-md font-medium">
                      {p.category}
                    </span>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => onEditProduct(p)}
                    className="p-1 text-slate-400 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                    title="แก้ไขข้อมูลสินค้า"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Product Name & Emoji */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xl shrink-0" role="img" aria-label="emoji">
                    {p.emoji || '📦'}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug flex-1 min-w-0">
                    {p.name}
                  </h3>
                </div>

                {/* Meta details: Location & Price */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {p.location}
                  </span>
                  <span>•</span>
                  <span>
                    ราคาขาย: <strong className="text-slate-800">฿{p.price}</strong> / {p.unit}
                  </span>
                  {p.totalSold > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-slate-400">ขายแล้ว {p.totalSold}</span>
                    </>
                  )}
                </div>

                {/* Stock Status Box & Quick Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Stock Badge */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-base font-bold leading-none ${
                          isOut
                            ? 'text-rose-600'
                            : isLow
                              ? 'text-rose-600'
                              : 'text-purple-700'
                        }`}
                      >
                        {p.currentStock} {p.unit}
                      </span>
                      {isOut ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                          หมดสต๊อก
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                          เตือนใกล้หมด (ขั้นต่ำ {p.minStock})
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          (ขั้นต่ำ {p.minStock})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: Stock In & Stock Out */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onSelectForStockIn(p.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-semibold hover:bg-purple-100 active:scale-95 flex items-center gap-1 transition-all"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-purple-600" />
                      <span>รับเข้า</span>
                    </button>

                    <button
                      disabled={isOut}
                      onClick={() => onSelectForStockOut(p.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold hover:bg-rose-100 active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-all"
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-600" />
                      <span>จ่ายออก</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="สแกนบาร์โค้ดค้นหาสินค้า"
        description="ส่องกล้องไปที่บาร์โค้ดสินค้า เพื่อค้นหาและตรวจสอบสต๊อกทันที"
      />
    </div>
  );
};
