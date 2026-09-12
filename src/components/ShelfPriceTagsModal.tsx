import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  X,
  QrCode,
  CheckSquare,
  Square,
  Search,
  Tag,
  MapPin,
  Sparkles,
  Sliders,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Percent
} from 'lucide-react';
import QRCode from 'qrcode';
import { Product } from '../types';

interface ShelfPriceTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialSelectedProductId?: string;
}

type TagSize = 'compact' | 'standard' | 'large';

export const ShelfPriceTagsModal: React.FC<ShelfPriceTagsModalProps> = ({
  isOpen,
  onClose,
  products,
  initialSelectedProductId,
}) => {
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(initialSelectedProductId ? [initialSelectedProductId] : products.map((p) => p.id))
  );
  const [tagSize, setTagSize] = useState<TagSize>('standard');
  const [showLocation, setShowLocation] = useState(true);
  const [showBarcodeText, setShowBarcodeText] = useState(true);
  const [showCutBorder, setShowCutBorder] = useState(true);
  const [storeName, setStoreName] = useState('ร้านของชำชุมชน');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Update selected IDs if initialSelectedProductId changes when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedProductId) {
        setSelectedProductIds(new Set([initialSelectedProductId]));
      } else {
        setSelectedProductIds(new Set(products.map((p) => p.id)));
      }
    }
  }, [isOpen, initialSelectedProductId, products]);

  // Categories for filtering
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Generate QR Code data URLs
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsGeneratingQr(true);

    const generateQrs = async () => {
      const map: Record<string, string> = {};
      for (const p of products) {
        // Encode ID and barcode so in-app scanner or mobile camera recognizes it
        const qrContent = p.barcode ? p.barcode : p.id;
        try {
          const dataUrl = await QRCode.toDataURL(qrContent, {
            width: 220,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          });
          map[p.id] = dataUrl;
        } catch (err) {
          console.error(`Error generating QR code for ${p.id}:`, err);
        }
      }

      if (isMounted) {
        setQrCodeMap(map);
        setIsGeneratingQr(false);
      }
    };

    generateQrs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, products]);

  // Filtered products for selection checklist
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Products to print (in order of products array)
  const productsToPrint = useMemo(() => {
    return products.filter((p) => selectedProductIds.has(p.id));
  }, [products, selectedProductIds]);

  const handleToggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      // Deselect all filtered
      const next = new Set(selectedProductIds);
      filteredProducts.forEach((p) => next.delete(p.id));
      setSelectedProductIds(next);
    } else {
      // Select all filtered
      const next = new Set(selectedProductIds);
      filteredProducts.forEach((p) => next.add(p.id));
      setSelectedProductIds(next);
    }
  };

  const handleToggleProduct = (id: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProductIds(next);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      id="shelf-tags-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      {/* Print Stylesheet strictly for printing */}
      <style>{`
        @media print {
          /* Hide non-printable UI */
          body * {
            visibility: hidden;
          }
          #shelf-tags-print-area, #shelf-tags-print-area * {
            visibility: visible;
          }
          #shelf-tags-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 5mm;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .tag-card {
            page-break-inside: avoid;
            break-inside: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header (No print) */}
        <div className="no-print bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>สร้างและพิมพ์ป้ายราคา QR Code</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  สำหรับวางหน้าเชลฟ์
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate">
                ดึงชื่อสินค้า ราคา และอิโมจิ พร้อม QR Code ประจำตัวสินค้า พร้อมพิมพ์ลงกระดาษ A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="print-shelf-tags-btn"
              onClick={handlePrint}
              disabled={productsToPrint.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ป้าย ({productsToPrint.length})</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls (No print) */}
        <div className="no-print p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          {/* Tag Size Selector */}
          <div className="md:col-span-4 space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>ขนาดป้ายราคา:</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTagSize('compact')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                  tagSize === 'compact'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                กะทัดรัด (8/หน้า)
              </button>
              <button
                type="button"
                onClick={() => setTagSize('standard')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                  tagSize === 'standard'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                มาตรฐาน (6/หน้า)
              </button>
              <button
                type="button"
                onClick={() => setTagSize('large')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                  tagSize === 'large'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                ขนาดใหญ่ (4/หน้า)
              </button>
            </div>
          </div>

          {/* Store Name & Options */}
          <div className="md:col-span-5 space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>ชื่อร้านบนหัวป้าย:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="ชื่อร้านของคุณ เช่น ร้านของชำชุมชน"
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
              />
              <div className="flex items-center gap-2 px-2 bg-white rounded-xl border border-slate-200 text-slate-600">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span>แสดงชั้นวาง</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCutBorder}
                    onChange={(e) => setShowCutBorder(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span>เส้นประตัด</span>
                </label>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-3 flex items-end justify-between md:justify-end gap-2">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 w-full text-center">
              <span className="text-[10px] text-emerald-700 block">เลือกพิมพ์แล้ว</span>
              <strong className="text-sm font-black text-emerald-800">
                {productsToPrint.length} / {products.length} รายการ
              </strong>
            </div>
          </div>
        </div>

        {/* Content Body: Left = Product Selector, Right = Live Printable Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Product Selection Checklist (No print) */}
          <div className="no-print lg:col-span-4 p-3.5 sm:p-4 bg-slate-50/50 flex flex-col space-y-3 max-h-[70vh] lg:max-h-none overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">เลือกสินค้าที่จะพิมพ์</span>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                {selectedProductIds.size === filteredProducts.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>ยกเลิกทั้งหมด</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>เลือกทั้งหมด</span>
                  </>
                )}
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อ รหัส หรือบาร์โค้ด..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'ทั้งหมด' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.has(p.id);
                return (
                  <label
                    key={p.id}
                    onClick={() => handleToggleProduct(p.id)}
                    className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-emerald-500 shadow-2xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent label onClick
                      className="rounded text-emerald-600 focus:ring-0 cursor-pointer shrink-0"
                    />

                    <span className="text-xl shrink-0" role="img" aria-label="emoji">
                      {p.emoji || '📦'}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-slate-100 px-1 rounded text-slate-600">
                          {p.id}
                        </span>
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span>ราคา: <strong>฿{p.price}</strong></span>
                        <span>•</span>
                        <span>{p.location}</span>
                        {p.isClearance && (
                          <span className="bg-rose-100 text-rose-700 px-1 rounded font-bold">
                            Clearance
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  ไม่พบสินค้าตรงกับคำค้นหา
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Printable Cards Preview */}
          <div className="lg:col-span-8 p-4 sm:p-6 bg-slate-100/60 overflow-y-auto">
            <div className="flex items-center justify-between mb-3 no-print">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  ตัวอย่างป้ายราคาหน้าเชลฟ์ (Live Preview)
                </span>
                <span className="text-[11px] text-slate-500">
                  (ระบบจะตัดส่วนเมนูออกตอนกดพิมพ์ จะแสดงเฉพาะตัวการ์ดป้ายราคา)
                </span>
              </div>
              <button
                onClick={handlePrint}
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ตอนนี้</span>
              </button>
            </div>

            {/* Printable Container */}
            <div
              id="shelf-tags-print-area"
              className={`bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200 grid gap-3 sm:gap-4 ${
                tagSize === 'compact'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : tagSize === 'large'
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              {productsToPrint.map((p) => {
                const qrData = qrCodeMap[p.id];
                const isClearance = !!p.isClearance;
                const originalPrice = p.originalPrice || p.price;

                return (
                  <div
                    key={p.id}
                    className={`tag-card relative bg-white rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all ${
                      showCutBorder ? 'border-2 border-dashed border-slate-300' : 'border border-slate-200 shadow-xs'
                    }`}
                    style={{ minHeight: tagSize === 'compact' ? '150px' : tagSize === 'large' ? '220px' : '180px' }}
                  >
                    {/* Cut guideline marks if enabled */}
                    {showCutBorder && (
                      <div className="absolute -top-2.5 right-3 px-1.5 py-0.2 bg-white text-[9px] text-slate-400 font-mono tracking-widest uppercase">
                        ✂ ตัดตามรอย
                      </div>
                    )}

                    {/* Tag Header: Store Name & Category */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                          {storeName || 'ร้านของชำ'}
                        </span>
                        <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-bold">
                          {p.id}
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-medium px-1.5 py-0.2 rounded-md border border-emerald-200/60">
                        {p.category}
                      </span>
                    </div>

                    {/* Tag Middle: Emoji + Product Name + Details */}
                    <div className="flex items-start gap-2.5 my-auto">
                      {/* Product Emoji */}
                      <div
                        className={`rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 ${
                          tagSize === 'compact'
                            ? 'w-12 h-12 text-2xl'
                            : tagSize === 'large'
                            ? 'w-18 h-18 text-4xl'
                            : 'w-14 h-14 text-3xl'
                        }`}
                      >
                        <span role="img" aria-label="emoji">
                          {p.emoji || '📦'}
                        </span>
                      </div>

                      {/* Name & Details */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h3
                          className={`font-black text-slate-900 leading-snug line-clamp-2 ${
                            tagSize === 'compact' ? 'text-xs' : tagSize === 'large' ? 'text-base sm:text-lg' : 'text-sm'
                          }`}
                        >
                          {p.name}
                        </h3>

                        {/* Location & Barcode */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-slate-500 pt-0.5">
                          {showLocation && p.location && (
                            <span className="flex items-center gap-0.5 font-medium text-slate-700">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              <span>{p.location}</span>
                            </span>
                          )}
                          {showBarcodeText && p.barcode && (
                            <span className="font-mono text-[9.5px] text-slate-400">
                              บาร์โค้ด: {p.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tag Footer: Price Banner & QR Code */}
                    <div className="mt-2.5 pt-2 border-t-2 border-slate-900 flex items-end justify-between gap-2">
                      {/* Price Section */}
                      <div className="min-w-0">
                        {isClearance ? (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <span className="line-through">฿{originalPrice}</span>
                              <span className="bg-rose-600 text-white text-[10px] font-bold px-1 rounded-sm">
                                ลด {p.clearanceDiscount || 30}%
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1 text-rose-600 font-black">
                              <span className="text-xs">฿</span>
                              <span
                                className={`tracking-tight ${
                                  tagSize === 'compact' ? 'text-2xl' : tagSize === 'large' ? 'text-4xl' : 'text-3xl'
                                }`}
                              >
                                {p.price}
                              </span>
                              <span className="text-[11px] font-normal text-slate-500">
                                / {p.unit}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              ราคาขาย
                            </span>
                            <div className="flex items-baseline gap-1 text-slate-950 font-black">
                              <span className="text-xs font-bold text-slate-700">฿</span>
                              <span
                                className={`tracking-tight ${
                                  tagSize === 'compact' ? 'text-2xl' : tagSize === 'large' ? 'text-4xl' : 'text-3xl'
                                }`}
                              >
                                {p.price}
                              </span>
                              <span className="text-[11px] font-normal text-slate-500">
                                / {p.unit}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* QR Code Container */}
                      <div className="flex flex-col items-center shrink-0">
                        {qrData ? (
                          <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-2xs">
                            <img
                              src={qrData}
                              alt={`QR ${p.id}`}
                              className={`object-contain ${
                                tagSize === 'compact' ? 'w-11 h-11' : tagSize === 'large' ? 'w-18 h-18' : 'w-14 h-14'
                              }`}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg animate-pulse" />
                        )}
                        <span className="text-[8.5px] font-mono text-slate-500 mt-0.5">
                          {p.barcode ? 'สแกนเช็คสต๊อก' : p.id}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {productsToPrint.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
                  <QrCode className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">ยังไม่ได้เลือกสินค้าเพื่อพิมพ์ป้าย</p>
                  <p className="text-xs text-slate-400">
                    กรุณาคลิกเลือกสินค้าจากรายการด้านซ้าย หรือคลิก &quot;เลือกทั้งหมด&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer (No print) */}
        <div className="no-print p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              พร้อมสำหรับเครื่องพิมพ์ทั่วไป หรือเลือกบันทึกเป็น PDF (Print to PDF)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
            >
              ปิด
            </button>
            <button
              onClick={handlePrint}
              disabled={productsToPrint.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ป้ายราคา ({productsToPrint.length} ชิ้น)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
