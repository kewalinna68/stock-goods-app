import React, { useState, useMemo } from 'react';
import { 
  History, 
  RotateCcw, 
  Search, 
  X, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Clock, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Transaction } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onUndoTransaction: (transactionId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onUndoTransaction,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'ALL' && t.type !== filterType) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.productName.toLowerCase().includes(q) ||
        t.productId.toLowerCase().includes(q) ||
        t.note.toLowerCase().includes(q)
      );
    });
  }, [transactions, filterType, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-sm sm:text-base">ประวัติรับเข้าและจ่ายออก</h2>
              <p className="text-[11px] text-slate-300">
                รวมทั้งหมด {transactions.length} รายการ (ย้อนหลัง)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า รหัส หรือหมายเหตุ..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type tabs */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              ทั้งหมด ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('IN')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'IN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              รับเข้า (+{transactions.filter((t) => t.type === 'IN').length})
            </button>
            <button
              onClick={() => setFilterType('OUT')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'OUT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-rose-800 hover:bg-rose-50'
              }`}
            >
              จ่ายออก (-{transactions.filter((t) => t.type === 'OUT').length})
            </button>
          </div>
        </div>

        {/* Transaction Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ไม่พบประวัติการทำรายการตามเงื่อนไข
            </div>
          ) : (
            filtered.map((tx, index) => {
              const dateObj = new Date(tx.timestamp);
              const timeFormatted = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              const dateFormatted = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

              return (
                <div
                  key={tx.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          tx.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.type === 'IN' ? 'รับเข้า' : 'จ่ายออก'}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                        {tx.productName}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-bold text-sm ${
                          tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                    </div>
                  </div>

                  {/* Stock Change Details */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span>{dateFormatted} {timeFormatted} น.</span>
                      {tx.note && <span>• {tx.note}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        {tx.prevStock} → <strong>{tx.newStock}</strong>
                      </span>

                      {/* Undo Action button */}
                      {tx.canUndo && index === 0 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`ต้องการย้อนรายการ ${tx.productName} (${tx.type === 'IN' ? '+' : '-'}${tx.quantity}) ใช่หรือไม่?`)) {
                              onUndoTransaction(tx.id);
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold hover:bg-amber-100 flex items-center gap-0.5 active:scale-95 transition-all"
                          title="ย้อนกลับการกระทำนี้"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-600" />
                          <span>ย้อนรายการ</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
