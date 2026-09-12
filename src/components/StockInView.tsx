import React, { useState, useMemo } from 'react';
import { 
  ArrowDownToLine, 
  Search, 
  Plus, 
  Minus, 
  MapPin, 
  Check, 
  CheckCircle2, 
  RotateCcw, 
  Tag, 
  PackageCheck,
  Camera,
  ScanLine,
  Barcode as BarcodeIcon,
  AlertCircle
} from 'lucide-react';
import { Product } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { audioService } from '../utils/audioEffects';

interface StockInViewProps {
  products: Product[];
  onSaveStockIn: (productId: string, quantity: number, note: string) => void;
  preSelectedProductId?: string;
}

export const StockInView: React.FC<StockInViewProps> = ({
  products,
  onSaveStockIn,
  preSelectedProductId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preSelectedProductId || (products.length > 0 ? products[0].id : '')
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('สั่งของเพิ่ม/เติมสต๊อก');
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanAlert, setScanAlert] = useState<{ type: 'found' | 'not_found'; message: string; code: string } | null>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Fast filtered products list for quick selection (supports search by barcode as well!)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.location.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Quick preset quantities for grocery wholesale packaging
  const presetQuantities = [1, 5, 10, 12, 24, 50, 100];

  // Quick note suggestions
  const presetNotes = [
    'สั่งของเพิ่ม/เติมสต๊อก',
    'รับจากแม็คโคร/โลตัส',
    'เซลล์บริษัทมาส่ง',
    'นับสต๊อกเพิ่ม',
    'ลูกค้านำมาคืน',
  ];

  // Handle scanned barcode
  const handleBarcodeScanned = (scannedCode: string) => {
    const clean = scannedCode.trim();
    const matched = products.find(
      (p) => (p.barcode && p.barcode.trim() === clean) || p.id.toLowerCase() === clean.toLowerCase()
    );

    if (matched) {
      audioService.playBeep();
      setSelectedProductId(matched.id);
      setScanAlert({
        type: 'found',
        message: `สแกนพบสินค้า: ${matched.name}`,
        code: clean,
      });
      setTimeout(() => setScanAlert(null), 4000);
    } else {
      audioService.playWarningLowStock();
      setScanAlert({
        type: 'not_found',
        message: `ไม่พบสินค้าที่มีรหัสบาร์โค้ด: ${clean}`,
        code: clean,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;

    onSaveStockIn(selectedProduct.id, quantity, note);
    audioService.playSuccess();

    const feedbackMsg = `รับเข้าสำเร็จ: ${selectedProduct.name} +${quantity} ${selectedProduct.unit}`;
    setSuccessFeedback(feedbackMsg);

    // Reset fields for next stock-in
    setQuantity(1);
    setTimeout(() => {
      setSuccessFeedback(null);
    }, 3500);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Page Header */}
      <div className="bg-purple-600 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-700/80 flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">บันทึกรับสินค้าเข้า (Stock In)</h2>
            <p className="text-xs text-purple-100">เพิ่มจำนวนสินค้าในสต๊อกเมื่อมีสินค้าเข้ามาใหม่</p>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successFeedback && (
        <div className="bg-purple-50 border border-purple-300 text-purple-950 p-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
          <span>{successFeedback}</span>
        </div>
      )}

      {/* Barcode Scan Alert Banner */}
      {scanAlert && (
        <div
          className={`p-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-2 shadow-xs animate-in fade-in ${
            scanAlert.type === 'found'
              ? 'bg-purple-100/90 border border-purple-400 text-purple-950'
              : 'bg-amber-100 border border-amber-400 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {scanAlert.type === 'found' ? (
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            )}
            <span className="truncate">{scanAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setScanAlert(null)}
            className="text-xs text-slate-500 hover:text-slate-800 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Step 1: Select Product */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
            1. ค้นหาหรือสแกนบาร์โค้ด
          </label>
          <span className="text-[11px] text-slate-400">เลือกสินค้าที่จะรับเข้า</span>
        </div>

        {/* Search Bar + Barcode Camera Scan Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์ชื่อสินค้า, บาร์โค้ด หรือรหัส..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dedicated Barcode Scanner Button */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="h-10.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 transition-all"
            title="เปิดกล้องสแกนบาร์โค้ด"
          >
            <Camera className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">สแกนบาร์โค้ด</span>
            <span className="sm:hidden">สแกน</span>
          </button>
        </div>

        {/* Products Dropdown / Quick Select Cards */}
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-center space-y-1">
              <p className="text-xs text-slate-400">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
              <p className="text-[11px] text-slate-400">ลองกดปุ่ม &quot;สแกนบาร์โค้ด&quot; เพื่อค้นหาด้วยกล้อง</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isSelected = p.id === selectedProductId;
              const isLow = p.currentStock <= p.minStock;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedProductId(p.id);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-purple-50 border-2 border-purple-500 text-purple-950 font-medium shadow-xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="text-xl shrink-0" role="img" aria-label="emoji">
                    {p.emoji || '📦'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                      <span className="text-slate-400 font-mono">[{p.id}]</span>
                      {p.barcode && (
                        <span className="font-mono text-purple-700 bg-purple-100/70 px-1 rounded text-[10px] flex items-center gap-0.5">
                          <BarcodeIcon className="w-2.5 h-2.5" />
                          {p.barcode}
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {p.location}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                      isLow ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      คงเหลือ: {p.currentStock} {p.unit}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Selected Product Card Preview */}
        {selectedProduct && (
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-800 font-medium">สินค้าที่เลือก:</span>
              <div className="flex items-center gap-1.5">
                {selectedProduct.barcode && (
                  <span className="text-[11px] font-mono bg-purple-200/70 text-purple-950 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <BarcodeIcon className="w-3 h-3" />
                    {selectedProduct.barcode}
                  </span>
                )}
                <span className="text-xs font-mono bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded">
                  รหัส: {selectedProduct.id}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl shrink-0" role="img" aria-label="emoji">
                {selectedProduct.emoji || '📦'}
              </span>
              <h3 className="text-sm font-bold text-slate-900 leading-tight flex-1 min-w-0">
                {selectedProduct.name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                ตำแหน่ง: <strong>{selectedProduct.location}</strong>
              </span>
              <span>•</span>
              <span>
                คงเหลือปัจจุบัน: <strong>{selectedProduct.currentStock} {selectedProduct.unit}</strong>
              </span>
              <span>•</span>
              <span className="text-purple-700 font-semibold">
                หลังรับเข้าจะเป็น: {selectedProduct.currentStock + (quantity || 0)} {selectedProduct.unit}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="สแกนรับสินค้าเข้าสต๊อก"
        description="สแกนบาร์โค้ดบนกล่องหรือแพ็คสินค้าเพื่อเลือกทันที"
      />

      {/* Step 2: Quantity Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
          2. ระบุจำนวนที่รับเข้า ({selectedProduct?.unit || 'ชิ้น'})
        </label>

        {/* Main Stepper Control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
            className="w-13 h-13 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 flex items-center justify-center font-bold text-xl transition-all shadow-xs shrink-0"
          >
            <Minus className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full h-13 text-center text-2xl font-bold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setQuantity((prev) => prev + 1)}
            className="w-13 h-13 rounded-xl bg-purple-600 text-white hover:bg-purple-700 active:scale-95 flex items-center justify-center font-bold text-xl transition-all shadow-xs shrink-0"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Increment Chips */}
        <div>
          <span className="text-[11px] text-slate-500 block mb-1.5">กดบวกด่วนตามขนาดแพ็ค:</span>
          <div className="flex flex-wrap gap-1.5">
            {presetQuantities.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setQuantity(amt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  quantity === amt
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: Note / Remarks */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
          3. หมายเหตุ (เลือกหรือพิมพ์เอง)
        </label>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="เช่น สั่งจากแม็คโคร, เซลล์มาส่ง, นับสต๊อก..."
          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-purple-500 focus:outline-none"
        />

        <div className="flex flex-wrap gap-1.5">
          {presetNotes.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setNote(preset)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                note === preset
                  ? 'bg-purple-100 text-purple-900 font-semibold border border-purple-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Big Action Submit Button */}
      <button
        type="button"
        disabled={!selectedProduct || quantity <= 0}
        onClick={handleSubmit}
        className="w-full py-4 bg-purple-600 text-white font-bold text-base sm:text-lg rounded-2xl shadow-md hover:bg-purple-700 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <PackageCheck className="w-6 h-6" />
        <span>บันทึกรับสินค้าเข้า (+{quantity} {selectedProduct?.unit || ''})</span>
      </button>
    </div>
  );
};
