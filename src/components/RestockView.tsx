import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Printer, 
  Copy, 
  Check, 
  Share2, 
  MapPin, 
  CheckCircle2, 
  ArrowDownToLine, 
  Layers, 
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { Product } from '../types';

interface RestockViewProps {
  products: Product[];
  onSelectForStockIn: (productId: string) => void;
  onBatchRestock: (items: { productId: string; quantity: number }[]) => void;
}

export const RestockView: React.FC<RestockViewProps> = ({
  products,
  onSelectForStockIn,
  onBatchRestock,
}) => {
  const [copied, setCopied] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  // Filter only items where currentStock <= minStock
  const restockItems = useMemo(() => {
    return products
      .filter((p) => p.currentStock <= p.minStock)
      .map((p) => {
        const needed = Math.max(1, p.minStock * 2 - p.currentStock); // เติมให้พอถึง 2 เท่าของขั้นต่ำ หรืออย่างน้อยพอผ่านเกณฑ์
        const minNeeded = Math.max(1, p.minStock - p.currentStock);
        const estCost = p.costPrice ? minNeeded * p.costPrice : minNeeded * (p.price * 0.8);

        return {
          ...p,
          minNeeded,
          suggestedFill: needed,
          estCost,
        };
      })
      .sort((a, b) => a.currentStock - b.currentStock); // ของที่หมดที่สุดอยู่บนสุด
  }, [products]);

  // Total estimated budget for restocking
  const totalEstCost = restockItems.reduce((sum, item) => sum + item.estCost, 0);

  // Copy readable text for sending via LINE or Notes
  const handleCopyForLine = () => {
    if (restockItems.length === 0) return;

    const dateStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    let text = `📋 รายการสั่งซื้อของเข้าร้าน (${dateStr})\n`;
    text += `รวมสินค้าต้องเติมทั้งหมด: ${restockItems.length} รายการ\n`;
    text += `------------------------------------\n`;

    restockItems.forEach((item, index) => {
      text += `${index + 1}. ${item.name}\n`;
      text += `   - คงเหลือ: ${item.currentStock} ${item.unit} (ขั้นต่ำ ${item.minStock})\n`;
      text += `   - สั่งเติม: ${item.minNeeded} ${item.unit} (ที่วาง: ${item.location})\n`;
    });

    text += `------------------------------------\n`;
    text += `ประมาณการค่าใช้จ่าย: ~฿${Math.round(totalEstCost).toLocaleString()}\n`;
    text += `สร้างจาก: ระบบสต๊อกร้านของชำ`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Browser Print trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner */}
      <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-700/80 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-100" />
            </div>
            <div>
              <h2 className="text-base font-bold">รายการสินค้าที่ต้องเติมสต๊อก</h2>
              <p className="text-xs text-rose-100">
                สินค้าที่เหลือน้อยกว่าหรือเท่ากับจำนวนขั้นต่ำ
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold bg-rose-700/80 px-3 py-1 rounded-xl">
            {restockItems.length}
          </span>
        </div>
      </div>

      {/* Quick Actions: Copy for LINE & Print Button */}
      {restockItems.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyForLine}
            className="flex items-center justify-center gap-2 p-3 bg-purple-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:bg-purple-700 active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-purple-200" />
                <span>คัดลอกสำเร็จ!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอกส่ง LINE</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 p-3 bg-white text-slate-800 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ใบสั่งของ (Print)</span>
          </button>
        </div>
      )}

      {/* Printable Area Wrapper */}
      <div id="printable-restock-area" className="space-y-2.5">
        {restockItems.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">สต๊อกสินค้าสมบูรณ์ทุกรายการ!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              ไม่มีสินค้าที่เหลือน้อยกว่าขั้นต่ำในขณะนี้ คุณสามารถตรวจดูสินค้าทั้งหมดได้ที่เมนู "สินค้า"
            </p>
          </div>
        ) : (
          <>
            {/* Header summary in print */}
            <div className="hidden print:block mb-4">
              <h1 className="text-xl font-bold text-slate-900">ใบสั่งซื้อสินค้าและรายการเติมสต๊อก</h1>
              <p className="text-sm text-slate-600">
                วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')} | จำนวน {restockItems.length} รายการ
              </p>
            </div>

            {/* List of items needing restock */}
            {restockItems.map((item, index) => {
              const isCompletelyOut = item.currentStock === 0;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl bg-white border transition-all shadow-2xs ${
                    isCompletelyOut
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Product Name & Index */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                          {item.name}
                        </h3>
                      </div>

                      {/* Location & Product Code */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3.5 h-3.5" />
                          {item.location}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          [{item.id}]
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">
                          ราคาขาย ฿{item.price}
                        </span>
                      </div>
                    </div>

                    {/* Stock Status Pill */}
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        isCompletelyOut ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isCompletelyOut ? 'หมดเกลี้ยง (0)' : `เหลือ ${item.currentStock} ${item.unit}`}
                      </span>
                    </div>
                  </div>

                  {/* Restock Math / Recommended Fill */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">เกณฑ์ขั้นต่ำ:</span>
                        <span className="font-semibold text-slate-800">{item.minStock} {item.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-rose-700 font-bold">ควรสั่งเติมขั้นต่ำ:</span>
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-sm">
                          +{item.minNeeded} {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stock-in direct button */}
                    <div className="print:hidden">
                      <button
                        onClick={() => onSelectForStockIn(item.id)}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-1 shadow-xs"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        <span>รับสินค้านี้เข้า</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Estimated Cost Summary Card */}
      {restockItems.length > 0 && (
        <div className="p-3.5 bg-purple-950 text-white rounded-2xl flex items-center justify-between text-xs sm:text-sm border border-purple-900">
          <div>
            <span className="text-purple-300 block text-[11px]">ประมาณการงบสั่งเติมขั้นต่ำ:</span>
            <span className="font-bold text-lg sm:text-xl text-purple-200">
              ~฿{Math.round(totalEstCost).toLocaleString()} บาท
            </span>
          </div>
          <button
            onClick={handleCopyForLine}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>แชร์รายการ</span>
          </button>
        </div>
      )}
    </div>
  );
};
