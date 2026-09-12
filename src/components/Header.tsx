import React from 'react';
import { Store, Sheet as SheetIcon, RotateCcw, History, RefreshCw, AlertCircle } from 'lucide-react';
import { GoogleSheetsConfig, Transaction } from '../types';

interface HeaderProps {
  sheetConfig: GoogleSheetsConfig;
  onOpenSheetModal: () => void;
  onOpenHistory: () => void;
  lastTransaction: Transaction | null;
  onUndoLast: () => void;
  isSyncing: boolean;
  lowStockCount: number;
  onNavigateRestock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sheetConfig,
  onOpenSheetModal,
  onOpenHistory,
  lastTransaction,
  onUndoLast,
  isSyncing,
  lowStockCount,
  onNavigateRestock,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2.5 sm:px-4 shadow-xs">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
                สต๊อกร้านของชำ
              </h1>
              {lowStockCount > 0 && (
                <button
                  onClick={onNavigateRestock}
                  className="bg-rose-100 text-rose-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-pulse hover:bg-rose-200 transition-colors"
                  title="มีสินค้าใกล้หมด กดดูรายการ"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>หมด {lowStockCount}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-purple-700/80 font-medium truncate">
              ระบบคลังสินค้ามือถือ
            </p>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Undo button if available */}
          {lastTransaction && lastTransaction.canUndo && (
            <button
              onClick={onUndoLast}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium flex items-center gap-1 hover:bg-amber-100 active:scale-95 transition-all shadow-xs"
              title={`ย้อนรายการล่าสุด: ${lastTransaction.productName} (${lastTransaction.type === 'IN' ? '+' : '-'}${lastTransaction.quantity})`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">ย้อนรายการ</span>
              <span className="sm:hidden">ย้อน</span>
            </button>
          )}

          {/* History button */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50 active:scale-95 transition-all"
            title="ดูประวัติรับเข้า-จ่ายออก"
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Google Sheets Status & Connect button */}
          <button
            onClick={onOpenSheetModal}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all active:scale-95 shadow-xs ${
              sheetConfig.isConnected
                ? 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="ตั้งค่าเชื่อมต่อ Google Sheets"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
            ) : (
              <SheetIcon className={`w-3.5 h-3.5 ${sheetConfig.isConnected ? 'text-purple-600' : 'text-slate-500'}`} />
            )}
            <span className="hidden sm:inline">
              {sheetConfig.isConnected ? 'ซิงค์ Google Sheets' : 'ต่อ Sheets'}
            </span>
            <span className={`w-2 h-2 rounded-full ${sheetConfig.isConnected ? 'bg-purple-600' : 'bg-slate-400'}`}></span>
          </button>
        </div>
      </div>
    </header>
  );
};
