import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RotateCcw, 
  TrendingUp, 
  Zap, 
  Sparkles,
  MapPin,
  Clock,
  ChevronRight,
  ShoppingCart,
  CalendarClock,
  BarChart3
} from 'lucide-react';
import { Product, Transaction, ActiveTab } from '../types';

interface DashboardViewProps {
  products: Product[];
  transactions: Transaction[];
  onNavigate: (tab: ActiveTab) => void;
  onQuickStockOut: (product: Product, quantity: number) => void;
  onUndoLast: () => void;
  lastTransaction: Transaction | null;
  onSelectProductForDetail?: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  transactions,
  onNavigate,
  onQuickStockOut,
  onUndoLast,
  lastTransaction,
}) => {
  // Statistics
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0);
  const outOfStockProducts = products.filter(p => p.currentStock === 0);
  const normalStockProducts = products.filter(p => p.currentStock > p.minStock);

  // Today's activity
  const todayStr = new Date().toDateString();
  const todayTransactions = transactions.filter(t => new Date(t.timestamp).toDateString() === todayStr);
  const todayStockIn = todayTransactions
    .filter(t => t.type === 'IN')
    .reduce((sum, t) => sum + t.quantity, 0);
  const todayStockOut = todayTransactions
    .filter(t => t.type === 'OUT')
    .reduce((sum, t) => sum + t.quantity, 0);

  // Top active / most sold products
  const popularProducts = [...products]
    .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
    .slice(0, 5);

  // Recent transactions (last 4)
  const recentTransactions = transactions.slice(0, 4);

  // Stock health percentage
  const normalPercent = totalProducts ? Math.round((normalStockProducts.length / totalProducts) * 100) : 0;
  const lowPercent = totalProducts ? Math.round((lowStockProducts.length / totalProducts) * 100) : 0;
  const outPercent = totalProducts ? Math.round((outOfStockProducts.length / totalProducts) * 100) : 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Alert banner if items are low on stock */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div 
          onClick={() => onNavigate('restock')}
          className="bg-rose-50 border-2 border-rose-400/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-bounce">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-rose-900 text-sm sm:text-base leading-tight">
                แจ้งเตือน: มีสินค้าต้องเติม {lowStockProducts.length + outOfStockProducts.length} รายการ
              </p>
              <p className="text-xs text-rose-700 mt-0.5">
                {outOfStockProducts.length > 0 ? `หมดเกลี้ยง ${outOfStockProducts.length} ชิ้น • ` : ''}
                เหลือน้อยกว่าขั้นต่ำ {lowStockProducts.length} ชิ้น
              </p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium text-xs whitespace-nowrap shadow-xs hover:bg-rose-700 transition-colors shrink-0">
            ดูรายการเติม
          </button>
        </div>
      )}

      {/* Quick Action Shortcuts (Buttons) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          onClick={() => onNavigate('stock-in')}
          className="flex items-center gap-3 p-3.5 bg-purple-600 text-white rounded-2xl shadow-sm hover:bg-purple-700 active:scale-95 transition-all text-left group"
        >
          <div className="w-11 h-11 rounded-xl bg-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ArrowDownToLine className="w-6 h-6 text-purple-100" />
          </div>
          <div>
            <span className="block text-base font-bold leading-tight">รับสินค้าเข้า</span>
            <span className="text-xs text-purple-100 mt-0.5 block">เพิ่มสต๊อกใหม่</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('stock-out')}
          className="flex items-center gap-3 p-3.5 bg-rose-600 text-white rounded-2xl shadow-sm hover:bg-rose-700 active:scale-95 transition-all text-left group"
        >
          <div className="w-11 h-11 rounded-xl bg-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ArrowUpFromLine className="w-6 h-6 text-rose-100" />
          </div>
          <div>
            <span className="block text-base font-bold leading-tight">จ่ายสินค้าออก</span>
            <span className="text-xs text-rose-100 mt-0.5 block">ขาย / ตัดสต๊อก</span>
          </div>
        </button>
      </div>

      {/* Advanced Quick Modules (FIFO & Profit Analytics) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          onClick={() => onNavigate('fifo')}
          className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-left hover:bg-amber-100/70 transition-all flex items-start gap-2.5 group active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-amber-950">คิววันหมดอายุ</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-200/70 px-1 py-0.2 rounded">FIFO</span>
            </div>
            <p className="text-[11px] text-amber-800/80 mt-0.5 line-clamp-1">
              ขายก่อน #1 & Clearance
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="p-3 bg-purple-50 border border-purple-200/80 rounded-2xl text-left hover:bg-purple-100/70 transition-all flex items-start gap-2.5 group active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-purple-950">วิเคราะห์กำไร</span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-200/70 px-1 py-0.2 rounded">กราฟ</span>
            </div>
            <p className="text-[11px] text-purple-800/80 mt-0.5 line-clamp-1">
              ยอดขาย กำไร & สถิติ
            </p>
          </div>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Total Products */}
        <div 
          onClick={() => onNavigate('products')}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs text-center cursor-pointer hover:border-purple-300 transition-colors"
        >
          <span className="text-xs font-medium text-slate-500 block">สินค้าทั้งหมด</span>
          <span className="text-2xl sm:text-3xl font-bold text-purple-950 mt-1 block">
            {totalProducts}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">รายการ</span>
        </div>

        {/* Low Stock Warning */}
        <div 
          onClick={() => onNavigate('restock')}
          className={`p-3 rounded-2xl border shadow-2xs text-center cursor-pointer transition-colors ${
            lowStockProducts.length + outOfStockProducts.length > 0 
              ? 'bg-rose-50/80 border-rose-300 hover:bg-rose-100' 
              : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-medium text-rose-800 block">ต้องเติมด่วน</span>
          <span className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1 block">
            {lowStockProducts.length + outOfStockProducts.length}
          </span>
          <span className="text-[11px] text-rose-600/80 mt-0.5 block">
            {outOfStockProducts.length > 0 ? `(หมด ${outOfStockProducts.length})` : 'ใกล้หมด'}
          </span>
        </div>

        {/* Normal Stock */}
        <div 
          onClick={() => onNavigate('products')}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs text-center cursor-pointer hover:border-purple-300 transition-colors"
        >
          <span className="text-xs font-medium text-purple-800 block">สต๊อกปกติ</span>
          <span className="text-2xl sm:text-3xl font-bold text-purple-700 mt-1 block">
            {normalStockProducts.length}
          </span>
          <span className="text-[11px] text-purple-600/70 mt-0.5 block">พร้อมขาย</span>
        </div>
      </div>

      {/* Stock Health Bar (Graph) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-700">
          <span className="flex items-center gap-1.5 font-semibold text-slate-900">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            สถานะสินค้าในคลัง
          </span>
          <span className="text-slate-500">รวม {totalProducts} รายการ</span>
        </div>

        {/* Visual Gauge Bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div 
            style={{ width: `${normalPercent}%` }} 
            className="bg-purple-600 h-full transition-all duration-500" 
            title={`สต๊อกปกติ ${normalStockProducts.length} รายการ (${normalPercent}%)`}
          />
          <div 
            style={{ width: `${lowPercent}%` }} 
            className="bg-amber-400 h-full transition-all duration-500" 
            title={`ใกล้หมด ${lowStockProducts.length} รายการ (${lowPercent}%)`}
          />
          <div 
            style={{ width: `${outPercent}%` }} 
            className="bg-rose-500 h-full transition-all duration-500" 
            title={`หมดสต๊อก ${outOfStockProducts.length} รายการ (${outPercent}%)`}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            <span>ปกติ: {normalStockProducts.length} ({normalPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>ใกล้หมด: {lowStockProducts.length} ({lowPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>หมด: {outOfStockProducts.length} ({outPercent}%)</span>
          </div>
        </div>

        {/* Daily Stats */}
        <div className="mt-2 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-purple-50/80 p-2 rounded-xl text-purple-950 flex items-center justify-between border border-purple-100">
            <span className="text-purple-800 font-medium">รับเข้าวันนี้:</span>
            <span className="font-bold text-sm text-purple-700">+{todayStockIn} ชิ้น</span>
          </div>
          <div className="bg-rose-50/70 p-2 rounded-xl text-rose-900 flex items-center justify-between border border-rose-100">
            <span className="text-rose-700">จ่ายออกวันนี้:</span>
            <span className="font-bold text-sm">-{todayStockOut} ชิ้น</span>
          </div>
        </div>
      </div>

      {/* Popular Items - Fast 1-tap stock out */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">
              สินค้ายอดนิยม / ขายบ่อย
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">กดตัดสต๊อกด่วนได้ทันที</span>
        </div>

        <div className="divide-y divide-slate-100">
          {popularProducts.map((product) => {
            const isLow = product.currentStock <= product.minStock;
            const isOut = product.currentStock === 0;

            return (
              <div 
                key={product.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
              >
                <span className="text-xl shrink-0" role="img" aria-label="emoji">
                  {product.emoji || '📦'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {product.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-0.5 text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {product.location}
                    </span>
                    <span>•</span>
                    <span className={`font-semibold ${isOut ? 'text-rose-600' : isLow ? 'text-rose-600' : 'text-purple-700'}`}>
                      คงเหลือ: {product.currentStock} {product.unit}
                    </span>
                    {product.price > 0 && (
                      <>
                        <span>•</span>
                        <span>฿{product.price}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick 1-tap dispense buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={isOut}
                    onClick={() => onQuickStockOut(product, 1)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 hover:bg-rose-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title={`จ่ายออก 1 ${product.unit}`}
                  >
                    -1
                  </button>
                  <button
                    disabled={isOut || product.currentStock < 5}
                    onClick={() => onQuickStockOut(product, 5)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all hidden sm:block"
                    title={`จ่ายออก 5 ${product.unit}`}
                  >
                    -5
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Undo Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              รายการล่าสุด
            </h2>
          </div>
          {lastTransaction && lastTransaction.canUndo && (
            <button
              onClick={onUndoLast}
              className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1 transition-colors active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ย้อนรายการล่าสุด
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">ยังไม่มีประวัติการทำรายการ</p>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                      tx.type === 'IN' ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {tx.type === 'IN' ? 'รับเข้า' : 'จ่ายออก'}
                    </span>
                    <span className="font-semibold text-slate-900 truncate">
                      {tx.productName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <span>{new Date(tx.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                    {tx.note && <span>• {tx.note}</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-bold text-sm ${
                    tx.type === 'IN' ? 'text-purple-700' : 'text-rose-600'
                  }`}>
                    {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    เหลือ {tx.newStock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
