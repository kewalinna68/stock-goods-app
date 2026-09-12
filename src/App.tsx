import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { StockInView } from './components/StockInView';
import { StockOutView } from './components/StockOutView';
import { ProductListView } from './components/ProductListView';
import { RestockView } from './components/RestockView';
import { ManageProductsView } from './components/ManageProductsView';
import { FifoExpiryView } from './components/FifoExpiryView';
import { ProfitAnalyticsView } from './components/ProfitAnalyticsView';
import { HistoryModal } from './components/HistoryModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { Product, Transaction, GoogleSheetsConfig, ActiveTab } from './types';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS } from './data/initialProducts';
import { 
  fetchFromGoogleSheets, 
  syncAllToGoogleSheets, 
  pushTransactionToSheets 
} from './services/sheetsService';
import { RotateCcw, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const STORAGE_KEY_PRODUCTS = 'grocery_stock_products_v1';
const STORAGE_KEY_TRANSACTIONS = 'grocery_stock_transactions_v1';
const STORAGE_KEY_CONFIG = 'grocery_stock_sheets_config_v1';

export default function App() {
  // Load initial products from localStorage or default
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing products', e);
      }
    }
    return INITIAL_PRODUCTS;
  });

  // Load transactions history from localStorage or default
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing transactions', e);
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  // Google Sheets Config
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing config', e);
      }
    }
    return {
      webAppUrl: '',
      autoSync: true,
      lastSyncTime: null,
      isConnected: false,
    };
  });

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [preSelectedStockInId, setPreSelectedStockInId] = useState<string | undefined>(undefined);
  const [preSelectedStockOutId, setPreSelectedStockOutId] = useState<string | undefined>(undefined);
  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: 'success' | 'warning' | 'info';
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(sheetConfig));
  }, [sheetConfig]);

  // Show Toast Helper
  const showToast = (
    message: string, 
    type: 'success' | 'warning' | 'info' = 'success',
    actionLabel?: string,
    onAction?: () => void
  ) => {
    const id = Date.now();
    setToast({ id, message, type, actionLabel, onAction });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  };

  // Restock count (items <= minStock)
  const restockCount = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minStock).length;
  }, [products]);

  // FIFO Expiring soon count (lots or products expiring within 7 days)
  const fifoExpiringCount = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    let count = 0;
    products.forEach((p) => {
      if (p.lots && p.lots.length > 0) {
        p.lots.forEach((lot) => {
          if (lot.quantity > 0) {
            const exp = new Date(lot.expiryDate);
            if (!isNaN(exp.getTime()) && exp <= sevenDaysLater) {
              count++;
            }
          }
        });
      } else if (p.expiryDate && p.currentStock > 0) {
        const exp = new Date(p.expiryDate);
        if (!isNaN(exp.getTime()) && exp <= sevenDaysLater) {
          count++;
        }
      }
    });
    return count;
  }, [products]);

  // Latest transaction for top Undo button
  const latestTransaction = useMemo(() => {
    return transactions.length > 0 && transactions[0].canUndo ? transactions[0] : null;
  }, [transactions]);

  // Handle Stock In
  const handleSaveStockIn = (productId: string, quantity: number, note: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product || quantity <= 0) return;

    const prevStock = product.currentStock;
    const newStock = prevStock + quantity;
    const nowIso = new Date().toISOString();

    const newTransaction: Transaction = {
      id: `TX-${Date.now()}`,
      timestamp: nowIso,
      productId: product.id,
      productName: product.name,
      type: 'IN',
      quantity,
      prevStock,
      newStock,
      note: note || 'รับสินค้าเข้า',
      canUndo: true,
    };

    // Update product stock
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              currentStock: newStock,
              lastUpdated: nowIso,
            }
          : p
      )
    );

    // Add to transactions
    setTransactions((prev) => [newTransaction, ...prev]);

    // Push to Google Sheets if connected & autoSync is on
    if (sheetConfig.isConnected && sheetConfig.autoSync && sheetConfig.webAppUrl) {
      pushTransactionToSheets(sheetConfig.webAppUrl, newTransaction).catch((err) =>
        console.error('Auto sync error:', err)
      );
    }

    showToast(
      `รับเข้าสำเร็จ: ${product.name} (+${quantity} ${product.unit})`,
      'success',
      'ย้อนรายการ',
      () => handleUndoTransaction(newTransaction.id)
    );
  };

  // Handle Stock Out (Sell / Dispense)
  const handleSaveStockOut = (productId: string, quantity: number, note: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product || quantity <= 0) return;

    const prevStock = product.currentStock;
    const newStock = Math.max(0, prevStock - quantity);
    const nowIso = new Date().toISOString();

    const newTransaction: Transaction = {
      id: `TX-${Date.now()}`,
      timestamp: nowIso,
      productId: product.id,
      productName: product.name,
      type: 'OUT',
      quantity,
      prevStock,
      newStock,
      note: note || 'ขายหน้าร้าน',
      canUndo: true,
    };

    // Update product stock & totalSold
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              currentStock: newStock,
              totalSold: (p.totalSold || 0) + quantity,
              lastUpdated: nowIso,
            }
          : p
      )
    );

    setTransactions((prev) => [newTransaction, ...prev]);

    // Push to Google Sheets if connected & autoSync is on
    if (sheetConfig.isConnected && sheetConfig.autoSync && sheetConfig.webAppUrl) {
      pushTransactionToSheets(sheetConfig.webAppUrl, newTransaction).catch((err) =>
        console.error('Auto sync error:', err)
      );
    }

    showToast(
      `จ่ายออกสำเร็จ: ${product.name} (-${quantity} ${product.unit}) คงเหลือ ${newStock}`,
      newStock <= product.minStock ? 'warning' : 'success',
      'ย้อนรายการ',
      () => handleUndoTransaction(newTransaction.id)
    );
  };

  // Handle Quick Stock Out directly from dashboard or lists
  const handleQuickStockOut = (product: Product, quantity: number) => {
    handleSaveStockOut(product.id, quantity, 'ขายหน้าร้าน (กดด่วน)');
  };

  // Handle Undo Transaction
  const handleUndoTransaction = (transactionId: string) => {
    const txIndex = transactions.findIndex((t) => t.id === transactionId);
    if (txIndex === -1) return;

    const tx = transactions[txIndex];
    if (!tx.canUndo) {
      showToast('ไม่สามารถย้อนรายการนี้ได้', 'warning');
      return;
    }

    const product = products.find((p) => p.id === tx.productId);
    if (!product) return;

    // Revert logic:
    // If it was IN (+qty), subtract qty back.
    // If it was OUT (-qty), add qty back and decrement totalSold.
    let revertedStock = product.currentStock;
    let revertedSold = product.totalSold || 0;

    if (tx.type === 'IN') {
      revertedStock = Math.max(0, product.currentStock - tx.quantity);
    } else {
      revertedStock = product.currentStock + tx.quantity;
      revertedSold = Math.max(0, revertedSold - tx.quantity);
    }

    const nowIso = new Date().toISOString();

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              currentStock: revertedStock,
              totalSold: revertedSold,
              lastUpdated: nowIso,
            }
          : p
      )
    );

    // Mark as undone
    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, canUndo: false, note: `${t.note} (ย้อนกลับแล้ว)` } : t))
    );

    showToast(`ย้อนรายการสำเร็จ: ${tx.productName} คืนสต๊อกเป็น ${revertedStock} ${product.unit}`, 'info');
  };

  // Save new or edited product
  const handleSaveProduct = (product: Product, isEdit: boolean) => {
    let updatedList: Product[];
    if (isEdit) {
      updatedList = products.map((p) => (p.id === product.id ? product : p));
      showToast(`แก้ไขข้อมูลสินค้า "${product.name}" สำเร็จ`, 'success');
    } else {
      updatedList = [product, ...products];
      showToast(`เพิ่มสินค้าใหม่ "${product.name}" สำเร็จ`, 'success');
    }
    setProducts(updatedList);

    // If Google Sheets connected, sync all
    if (sheetConfig.isConnected && sheetConfig.autoSync && sheetConfig.webAppUrl) {
      syncAllToGoogleSheets(sheetConfig.webAppUrl, updatedList).catch(console.error);
    }
  };

  // Delete product
  const handleDeleteProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    const updatedList = products.filter((x) => x.id !== productId);
    setProducts(updatedList);
    showToast(`ลบสินค้า ${p?.name || ''} เรียบร้อยแล้ว`, 'info');

    if (sheetConfig.isConnected && sheetConfig.autoSync && sheetConfig.webAppUrl) {
      syncAllToGoogleSheets(sheetConfig.webAppUrl, updatedList).catch(console.error);
    }
  };

  // Apply Clearance Discount
  const handleApplyClearance = (productId: string, discountPercent: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const originalPrice = product.originalPrice || product.price;
    const discountedPrice = Math.max(1, Math.round(originalPrice * (1 - discountPercent / 100)));

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              isClearance: true,
              clearanceDiscount: discountPercent,
              originalPrice,
              price: discountedPrice,
              lastUpdated: new Date().toISOString(),
            }
          : p
      )
    );

    showToast(
      `ติดป้ายลดราคา Clearance -${discountPercent}% ให้ "${product.name}" (ราคา ฿${discountedPrice})`,
      'success',
      'ยกเลิก',
      () => {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  isClearance: false,
                  clearanceDiscount: undefined,
                  price: originalPrice,
                }
              : p
          )
        );
        showToast(`คืนราคาปกติ ฿${originalPrice} ให้ ${product.name} แล้ว`, 'info');
      }
    );
  };

  // Consume FIFO Lot (Stock out from specific oldest lot)
  const handleConsumeFifoLot = (productId: string, lotNumber: string, quantity: number) => {
    handleSaveStockOut(productId, quantity, `ขายด่วนตามคิว FIFO ล็อต #${lotNumber}`);
  };

  // Reset to Demo Data
  const handleResetToDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setTransactions(INITIAL_TRANSACTIONS);
    showToast('รีเซ็ตข้อมูลตัวอย่างร้านขายของชำเรียบร้อยแล้ว', 'info');
  };

  // Import products
  const handleImportProducts = (imported: Product[]) => {
    setProducts(imported);
    showToast(`นำเข้าสินค้าเรียบร้อยแล้ว ${imported.length} รายการ`, 'success');
  };

  // Google Sheets Test Connection
  const handleTestConnection = async (url: string): Promise<boolean> => {
    try {
      const data = await fetchFromGoogleSheets(url);
      return data !== null;
    } catch (e) {
      throw e;
    }
  };

  // Manual Sync (Push local to Sheets)
  const handleManualSync = async () => {
    if (!sheetConfig.webAppUrl) return;
    setIsSyncing(true);
    try {
      await syncAllToGoogleSheets(sheetConfig.webAppUrl, products);
      setSheetConfig((prev) => ({ ...prev, lastSyncTime: new Date().toISOString() }));
      showToast('ส่งข้อมูลสินค้าขึ้น Google Sheets สำเร็จเรียบร้อย!', 'success');
    } catch (e: any) {
      showToast(e.message || 'ซิงค์ไม่สำเร็จ ตรวจสอบการเชื่อมต่อ', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull latest from Google Sheets
  const handlePullFromSheets = async () => {
    if (!sheetConfig.webAppUrl) return;
    setIsSyncing(true);
    try {
      const data = await fetchFromGoogleSheets(sheetConfig.webAppUrl);
      if (data && data.products && data.products.length > 0) {
        setProducts(data.products);
        if (data.transactions && data.transactions.length > 0) {
          setTransactions(data.transactions);
        }
        setSheetConfig((prev) => ({ ...prev, lastSyncTime: new Date().toISOString() }));
        showToast(`ดึงข้อมูลสำเร็จ! พบสินค้า ${data.products.length} รายการ`, 'success');
      } else {
        showToast('ไม่พบข้อมูลใน Google Sheets กำลังส่งข้อมูลปัจจุบันขึ้นไปแทน...', 'info');
        await syncAllToGoogleSheets(sheetConfig.webAppUrl, products);
      }
    } catch (e: any) {
      showToast(e.message || 'ไม่สามารถดึงข้อมูลจาก Sheets ได้', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  // Nav actions from components
  const handleSelectForStockIn = (productId: string) => {
    setPreSelectedStockInId(productId);
    setActiveTab('stock-in');
  };

  const handleSelectForStockOut = (productId: string) => {
    setPreSelectedStockOutId(productId);
    setActiveTab('stock-out');
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Prompt',sans-serif]">
      {/* Mobile-First Shell Container */}
      <div className="w-full max-w-xl mx-auto min-h-screen bg-white shadow-xl flex flex-col relative">
        {/* Top Sticky Header */}
        <Header
          sheetConfig={sheetConfig}
          onOpenSheetModal={() => setIsSheetModalOpen(true)}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          lastTransaction={latestTransaction}
          onUndoLast={() => latestTransaction && handleUndoTransaction(latestTransaction.id)}
          isSyncing={isSyncing}
          lowStockCount={restockCount}
          onNavigateRestock={() => setActiveTab('restock')}
        />

        {/* Main Content View with Tab Routing */}
        <main className="flex-1 p-3.5 sm:p-4 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              transactions={transactions}
              onNavigate={(tab) => {
                setPreSelectedStockInId(undefined);
                setPreSelectedStockOutId(undefined);
                setActiveTab(tab);
              }}
              onQuickStockOut={handleQuickStockOut}
              onUndoLast={() => latestTransaction && handleUndoTransaction(latestTransaction.id)}
              lastTransaction={latestTransaction}
            />
          )}

          {activeTab === 'stock-in' && (
            <StockInView
              products={products}
              onSaveStockIn={handleSaveStockIn}
              preSelectedProductId={preSelectedStockInId}
            />
          )}

          {activeTab === 'stock-out' && (
            <StockOutView
              products={products}
              onSaveStockOut={handleSaveStockOut}
              preSelectedProductId={preSelectedStockOutId}
            />
          )}

          {activeTab === 'products' && (
            <ProductListView
              products={products}
              onSelectForStockIn={handleSelectForStockIn}
              onSelectForStockOut={handleSelectForStockOut}
              onEditProduct={handleOpenEditProduct}
              onAddNewProduct={handleOpenNewProduct}
            />
          )}

          {activeTab === 'restock' && (
            <RestockView
              products={products}
              onSelectForStockIn={handleSelectForStockIn}
              onBatchRestock={() => {}}
            />
          )}

          {activeTab === 'fifo' && (
            <FifoExpiryView
              products={products}
              onApplyClearance={handleApplyClearance}
              onConsumeLot={handleConsumeFifoLot}
              onSelectForStockIn={handleSelectForStockIn}
            />
          )}

          {activeTab === 'analytics' && (
            <ProfitAnalyticsView
              products={products}
              transactions={transactions}
              onNavigate={(tab) => {
                setPreSelectedStockInId(undefined);
                setPreSelectedStockOutId(undefined);
                setActiveTab(tab);
              }}
            />
          )}

          {activeTab === 'manage' && (
            <ManageProductsView
              products={products}
              transactions={transactions}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onResetToDemoData={handleResetToDemoData}
              onImportProducts={handleImportProducts}
              onImportFullBackup={(newProducts, newTransactions) => {
                setProducts(newProducts);
                setTransactions(newTransactions);
                showToast(`กู้คืนสำรองข้อมูลเรียบร้อย: ${newProducts.length} สินค้า, ${newTransactions.length} รายการประวัติ`, 'success');
              }}
              editingProduct={editingProduct}
              onCloseEditModal={() => {
                setIsProductModalOpen(false);
                setEditingProduct(null);
              }}
              onOpenNewProductModal={handleOpenNewProduct}
              isModalOpen={isProductModalOpen}
            />
          )}
        </main>

        {/* Global Toast Notification */}
        {toast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[92%] animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div
              className={`p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-medium border ${
                toast.type === 'success'
                  ? 'bg-slate-900 text-white border-slate-800'
                  : toast.type === 'warning'
                    ? 'bg-amber-950 text-white border-amber-800'
                    : 'bg-slate-900 text-white border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <span className="truncate">{toast.message}</span>
              </div>

              {toast.actionLabel && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.();
                    setToast(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{toast.actionLabel}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setPreSelectedStockInId(undefined);
            setPreSelectedStockOutId(undefined);
            setActiveTab(tab);
          }}
          restockCount={restockCount}
          fifoCount={fifoExpiringCount}
        />

        {/* History Modal */}
        <HistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          transactions={transactions}
          onUndoTransaction={handleUndoTransaction}
        />

        {/* Google Sheets Integration & Setup Modal */}
        <GoogleSheetsModal
          isOpen={isSheetModalOpen}
          onClose={() => setIsSheetModalOpen(false)}
          config={sheetConfig}
          onSaveConfig={(newCfg) => {
            setSheetConfig(newCfg);
            showToast('บันทึกการตั้งค่า Google Sheets เรียบร้อย', 'success');
          }}
          onTestConnection={handleTestConnection}
          onManualSync={handleManualSync}
          onPullFromSheets={handlePullFromSheets}
          isSyncing={isSyncing}
        />
      </div>
    </div>
  );
}
