import React, { useState, useMemo } from 'react';
import { 
  ArrowUpFromLine, 
  Search, 
  Plus, 
  Minus, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  TrendingDown, 
  Check,
  Camera,
  Barcode as BarcodeIcon,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Product } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { audioService } from '../utils/audioEffects';

interface StockOutViewProps {
  products: Product[];
  onSaveStockOut: (productId: string, quantity: number, note: string) => void;
  preSelectedProductId?: string;
}

export const StockOutView: React.FC<StockOutViewProps> = ({
  products,
  onSaveStockOut,
  preSelectedProductId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preSelectedProductId || (products.length > 0 ? products[0].id : '')
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('ขายหน้าร้าน');
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanAlert, setScanAlert] = useState<{ type: 'found' | 'not_found'; message: string; code: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(audioService.isEnabled());

  const handleToggleSound = () => {
    const next = audioService.toggle();
    setSoundEnabled(next);
  };

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Filtered products list (supports search by barcode as well!)
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

  // Popular items for quick dispensing
  const popularItems = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
      .slice(0, 4);
  }, [products]);

  const presetQuantities = [1, 2, 3, 5, 10, 12, 24];

  const presetNotes = [
    'ขายหน้าร้าน',
    'เบิกใช้ในร้าน',
    'ชำรุด/แตกหัก/เสียหาย',
    'สินค้าหมดอายุ',
    'คืนบริษัทผู้ผลิต',
  ];

  // Handle scanned barcode
  const handleBarcodeScanned = (scannedCode: string) => {
    const clean = scannedCode.trim();
    const matched = products.find(
      (p) => (p.barcode && p.barcode.trim() === clean) || p.id.toLowerCase() === clean.toLowerCase()
    );

    if (matched) {
      // Play barcode scanner Beep sound
      audioService.playBeep();
      setSelectedProductId(matched.id);
      setScanAlert({
        type: 'found',
        message: `สแกนพบสินค้า: ${matched.name}`,
        code: clean,
      });
      setTimeout(() => setScanAlert(null), 4000);
    } else {
      // Play warning tone if barcode not found
      audioService.playWarningLowStock();
      setScanAlert({
        type: 'not_found',
        message: `ไม่พบสินค้าที่มีรหัสบาร์โค้ด: ${clean}`,
        code: clean,
      });
    }
  };

  const isOverStock = selectedProduct ? quantity > selectedProduct.currentStock : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0 || isOverStock) return;

    const remainingStock = selectedProduct.currentStock - quantity;

    onSaveStockOut(selectedProduct.id, quantity, note);

    // Audio sound effects trigger based on stock level
    if (remainingStock <= selectedProduct.minStock) {
      // Special warning sound when dispensed item stock drops below minStock
      audioService.playWarningLowStock();
    } else {
      // Cash register Ka-Ching sound for normal sales
      audioService.playKaChing();
    }

    const feedbackMsg = `จ่ายออกสำเร็จ: ${selectedProduct.name} -${quantity} ${selectedProduct.unit}`;
    setSuccessFeedback(feedbackMsg);

    setQuantity(1);
    setTimeout(() => {
      setSuccessFeedback(null);
    }, 3500);
  };

  return (
    <div className="space-y-4 pb-24 font-['Prompt',sans-serif]">
      {/* Page Header with Sound Toggle Button */}
      <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-800/80 flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">บันทึกจ่ายสินค้าออก (Stock Out / ขาย)</h2>
              <p className="text-xs text-rose-100">ตัดสต๊อกเมื่อมีการขาย หรือเบิกสินค้าไปใช้งาน</p>
            </div>
          </div>

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-xs transition-all active:scale-95 shadow-xs ${
              soundEnabled
                ? 'bg-white/25 text-white hover:bg-white/30 border border-white/30'
                : 'bg-black/30 text-rose-200 hover:bg-black/40 border border-white/10'
            }`}
            title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน Web Audio'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-200" />
                <span>เสียงเปิด</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-300" />
                <span>เสียงปิด</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successFeedback}</span>
        </div>
      )}

      {/* Barcode Scan Alert Banner */}
      {scanAlert && (
        <div
          className={`p-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-2 shadow-xs animate-in fade-in ${
            scanAlert.type === 'found'
              ? 'bg-emerald-100/90 border border-emerald-400 text-emerald-950'
              : 'bg-amber-100 border border-amber-400 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {scanAlert.type === 'found' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
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

      {/* Quick Select from Best Sellers */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>เลือกด่วนจากสินค้ายอดนิยม:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {popularItems.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedProductId(p.id);
                setQuantity(1);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
                selectedProductId === p.id
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="text-sm shrink-0">{p.emoji || '📦'}</span>
              <span>{p.name.split('(')[0]}</span>
              <span className={`text-[10px] px-1 rounded ${
                selectedProductId === p.id ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                เหลือ {p.currentStock}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Search & Select */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
            1. ค้นหาหรือสแกนบาร์โค้ด
          </label>
          <span className="text-[11px] text-slate-400">เลือกสินค้าที่จะจ่ายออก/ขาย</span>
        </div>

        {/* Instant Search Bar + Barcode Scanner Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า, บาร์โค้ด หรือรหัส..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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

          {/* Barcode Camera Button */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="h-10.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 transition-all"
            title="เปิดกล้องสแกนบาร์โค้ด"
          >
            <Camera className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">สแกนบาร์โค้ด</span>
            <span className="sm:hidden">สแกน</span>
          </button>
        </div>

        {/* Filtered list */}
        <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-center space-y-1">
              <p className="text-xs text-slate-400">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
              <p className="text-[11px] text-slate-400">ลองกดปุ่ม &quot;สแกนบาร์โค้ด&quot; เพื่อค้นหาด้วยกล้อง</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isSelected = p.id === selectedProductId;
              const isLow = p.currentStock <= p.minStock;
              const isOut = p.currentStock === 0;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProductId(p.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-rose-50 border-2 border-rose-500 text-rose-950 font-medium shadow-xs'
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
                        <span className="font-mono text-rose-700 bg-rose-100/70 px-1 rounded text-[10px] flex items-center gap-0.5">
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
                      isOut 
                        ? 'bg-rose-600 text-white' 
                        : isLow 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-purple-100 text-purple-800'
                    }`}>
                      {isOut ? 'หมดสต๊อก' : `เหลือ ${p.currentStock} ${p.unit}`}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Selected Product Card Preview */}
        {selectedProduct && (
          <div className={`p-3 rounded-xl border space-y-1.5 ${
            selectedProduct.currentStock === 0
              ? 'bg-rose-50/80 border-rose-300 text-rose-900'
              : selectedProduct.currentStock <= selectedProduct.minStock
                ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                : 'bg-purple-50/60 border-purple-200 text-purple-950'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">สินค้าที่เลือก:</span>
              <div className="flex items-center gap-1.5">
                {selectedProduct.barcode && (
                  <span className="text-[11px] font-mono bg-white/90 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                    <BarcodeIcon className="w-3 h-3" />
                    {selectedProduct.barcode}
                  </span>
                )}
                <span className="text-xs font-mono bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                  รหัส: {selectedProduct.id}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl shrink-0" role="img" aria-label="emoji">
                {selectedProduct.emoji || '📦'}
              </span>
              <h3 className="text-sm font-bold leading-tight flex-1 min-w-0">
                {selectedProduct.name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                ตำแหน่ง: <strong>{selectedProduct.location}</strong>
              </span>
              <span>•</span>
              <span>
                ราคา: <strong>฿{selectedProduct.price} / {selectedProduct.unit}</strong>
              </span>
              <span>•</span>
              <span className={`font-bold ${
                selectedProduct.currentStock <= selectedProduct.minStock ? 'text-rose-600' : 'text-purple-800'
              }`}>
                คงเหลือปัจจุบัน: {selectedProduct.currentStock} {selectedProduct.unit}
              </span>
            </div>

            {/* Live calculation after stock out */}
            <div className="pt-1.5 border-t border-purple-200/60 text-xs flex items-center justify-between">
              <span>ยอดคงเหลือหลังหัก:</span>
              <span className={`font-bold text-sm ${
                selectedProduct.currentStock - quantity < 0 
                  ? 'text-rose-600 underline' 
                  : selectedProduct.currentStock - quantity <= selectedProduct.minStock 
                    ? 'text-rose-600' 
                    : 'text-purple-700'
              }`}>
                {selectedProduct.currentStock - quantity} {selectedProduct.unit}
                {selectedProduct.currentStock - quantity <= selectedProduct.minStock && selectedProduct.currentStock - quantity >= 0 && (
                  <span className="text-xs font-normal text-rose-600 ml-1">(จะเข้าเกณฑ์ใกล้หมด)</span>
                )}
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
        title="สแกนจ่ายสินค้าออก / ขาย"
        description="สแกนบาร์โค้ดบนสินค้าเพื่อตัดสต๊อกทันที"
      />

      {/* Step 2: Quantity Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
          2. ระบุจำนวนที่จ่ายออก ({selectedProduct?.unit || 'ชิ้น'})
        </label>

        {/* Stepper Control */}
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
              max={selectedProduct ? selectedProduct.currentStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className={`w-full h-13 text-center text-2xl font-bold bg-slate-50 border-2 rounded-xl focus:bg-white focus:outline-none ${
                isOverStock 
                  ? 'border-rose-500 text-rose-600 bg-rose-50' 
                  : 'border-slate-200 text-slate-900 focus:border-rose-500'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={() => setQuantity((prev) => prev + 1)}
            className="w-13 h-13 rounded-xl bg-rose-600 text-white hover:bg-rose-700 active:scale-95 flex items-center justify-center font-bold text-xl transition-all shadow-xs shrink-0"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Warning if trying to dispense more than current stock */}
        {isOverStock && (
          <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>จำนวนที่จ่ายออก ({quantity}) เกินสินค้าคงเหลือ ({selectedProduct?.currentStock}) กรุณาตรวจสอบ</span>
          </div>
        )}

        {/* Quick buttons */}
        <div>
          <span className="text-[11px] text-slate-500 block mb-1.5">กดเลือกจำนวนด่วน:</span>
          <div className="flex flex-wrap gap-1.5">
            {presetQuantities.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setQuantity(amt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  quantity === amt
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                -{amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: Note / Reason */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
          3. หมายเหตุ / สาเหตุการจ่ายออก
        </label>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="เช่น ขายหน้าร้าน, เบิกใช้..."
          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-rose-500 focus:outline-none"
        />

        <div className="flex flex-wrap gap-1.5">
          {presetNotes.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setNote(preset)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                note === preset
                  ? 'bg-rose-100 text-rose-800 font-semibold border border-rose-300'
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
        disabled={!selectedProduct || quantity <= 0 || isOverStock || selectedProduct.currentStock === 0}
        onClick={handleSubmit}
        className="w-full py-4 bg-rose-600 text-white font-bold text-base sm:text-lg rounded-2xl shadow-md hover:bg-rose-700 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
      >
        <TrendingDown className="w-6 h-6" />
        <span>
          บันทึกจ่ายสินค้าออก (-{quantity} {selectedProduct?.unit || ''})
        </span>
      </button>
    </div>
  );
};
