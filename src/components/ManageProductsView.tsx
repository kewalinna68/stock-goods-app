import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw, 
  MapPin, 
  Check, 
  AlertCircle, 
  Save, 
  X,
  FileSpreadsheet,
  Barcode as BarcodeIcon,
  Camera,
  QrCode,
  Printer
} from 'lucide-react';
import { Product, Transaction } from '../types';
import { downloadBackupJSON } from '../utils/backup';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ShelfPriceTagsModal } from './ShelfPriceTagsModal';

interface ManageProductsViewProps {
  products: Product[];
  transactions: Transaction[];
  onSaveProduct: (product: Product, isEdit: boolean) => void;
  onDeleteProduct: (productId: string) => void;
  onResetToDemoData: () => void;
  onImportProducts: (products: Product[]) => void;
  onImportFullBackup?: (products: Product[], transactions: Transaction[]) => void;
  editingProduct: Product | null;
  onCloseEditModal: () => void;
  onOpenNewProductModal: () => void;
  isModalOpen: boolean;
}

export const ManageProductsView: React.FC<ManageProductsViewProps> = ({
  products,
  transactions,
  onSaveProduct,
  onDeleteProduct,
  onResetToDemoData,
  onImportProducts,
  onImportFullBackup,
  editingProduct,
  onCloseEditModal,
  onOpenNewProductModal,
  isModalOpen,
}) => {
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    id: '',
    name: '',
    emoji: '📦',
    barcode: '',
    currentStock: 10,
    minStock: 5,
    location: 'ชั้น A1',
    price: 20,
    costPrice: 15,
    unit: 'ชิ้น',
    category: 'ของใช้ทั่วไป',
    expiryDate: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showEmojiPalette, setShowEmojiPalette] = useState(false);
  const [isShelfTagsModalOpen, setIsShelfTagsModalOpen] = useState(false);
  const [selectedTagProductId, setSelectedTagProductId] = useState<string | undefined>(undefined);

  // Grocery emoji categories
  const GROCERY_EMOJIS = {
    'ยอดนิยม': ['🍜', '🥤', '🍿', '🧂', '🧼', '🍺', '💊', '🥚'],
    'อาหาร & วัตถุดิบ': ['🌾', '🍞', '🐟', '🥫', '🍳', '🍫', '🧄', '🧅'],
    'เครื่องดื่ม': ['🥛', '☕', '🧃', '🧊', '🧋', '🍶', '🍾', '🍵'],
    'ของใช้ & ดูแลบ้าน': ['🧺', '🧴', '🪥', '🧻', '🧹', '🧽', '🪒', '🪣'],
    'ยาสามัญ & เบ็ดเตล็ด': ['🩹', '🔋', '🕯️', '📦', '✂️', '🏷️', '🛍️', '🪙'],
  };

  // Sync form data when editingProduct changes
  React.useEffect(() => {
    if (editingProduct) {
      setFormData({
        ...editingProduct,
        emoji: editingProduct.emoji || '📦',
      });
    } else {
      // Auto-generate next Product ID
      const nextNum = products.length + 1;
      const nextId = `P${String(nextNum).padStart(3, '0')}`;
      setFormData({
        id: nextId,
        name: '',
        emoji: '🍜',
        barcode: '',
        currentStock: 10,
        minStock: 5,
        location: 'ชั้น A1',
        price: 20,
        costPrice: 15,
        unit: 'ชิ้น',
        category: 'อาหารแห้ง',
        expiryDate: '',
      });
    }
  }, [editingProduct, products.length, isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim()) {
      setFormError('กรุณากรอกชื่อสินค้า');
      return;
    }

    if (!formData.id?.trim()) {
      setFormError('กรุณากรอกรหัสสินค้า');
      return;
    }

    // Check duplicate ID for new products
    if (!editingProduct && products.some((p) => p.id === formData.id?.trim())) {
      setFormError(`รหัสสินค้า "${formData.id}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    const fullProduct: Product = {
      id: formData.id.trim(),
      name: formData.name.trim(),
      emoji: formData.emoji || '📦',
      barcode: formData.barcode?.trim() || undefined,
      currentStock: Number(formData.currentStock) || 0,
      minStock: Number(formData.minStock) || 1,
      location: formData.location?.trim() || 'ชั้นวางทั่วไป',
      price: Number(formData.price) || 0,
      costPrice: Number(formData.costPrice) || 0,
      unit: formData.unit?.trim() || 'ชิ้น',
      category: formData.category?.trim() || 'ของใช้ทั่วไป',
      totalSold: editingProduct ? editingProduct.totalSold : 0,
      lastUpdated: new Date().toISOString(),
      expiryDate: formData.expiryDate?.trim() || undefined,
      lots: editingProduct?.lots,
      isClearance: editingProduct?.isClearance,
      originalPrice: editingProduct?.originalPrice,
    };

    onSaveProduct(fullProduct, !!editingProduct);
    onCloseEditModal();
  };

  const handleBarcodeScanned = (barcode: string) => {
    setFormData((prev) => ({ ...prev, barcode }));
    setIsScannerOpen(false);
  };

  // Export CSV for Excel
  const handleExportCSV = () => {
    const headers = ["รหัสสินค้า,ชื่อสินค้า,บาร์โค้ด,คงเหลือ,ขั้นต่ำแจ้งเตือน,ตำแหน่งจัดเก็บ,ราคาขาย,ราคาทุน,หน่วยนับ,หมวดหมู่,ขายสะสม"];
    const rows = products.map(p => 
      `"${p.id}","${p.name.replace(/"/g, '""')}","${p.barcode || ''}",${p.currentStock},${p.minStock},"${p.location}",${p.price},${p.costPrice || 0},"${p.unit}","${p.category}",${p.totalSold || 0}`
    );
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `grocery_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Import JSON File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Check if full backup with products and transactions
        if (json && Array.isArray(json.products) && json.products.length > 0) {
          if (onImportFullBackup && Array.isArray(json.transactions)) {
            onImportFullBackup(json.products, json.transactions);
            alert(`นำเข้าสำรองข้อมูลสำเร็จ: สินค้า ${json.products.length} รายการ และประวัติ ${json.transactions.length} รายการ`);
          } else {
            onImportProducts(json.products);
            alert(`นำเข้าข้อมูลสินค้าเรียบร้อยแล้ว จำนวน ${json.products.length} รายการ`);
          }
        } else if (Array.isArray(json) && json.length > 0 && json[0].id && json[0].name) {
          onImportProducts(json);
          alert(`นำเข้าข้อมูลสินค้าเรียบร้อยแล้ว จำนวน ${json.length} รายการ`);
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้องสำหรับรายการสินค้าหรือไฟล์สำรอง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner with Add Button */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">จัดการฐานข้อมูลสินค้า</h2>
          <p className="text-xs text-slate-400">เพิ่ม ลบ แก้ไข กำหนดขั้นต่ำ และตำแหน่งจัดเก็บ</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedTagProductId(undefined);
              setIsShelfTagsModalOpen(true);
            }}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            title="พิมพ์ป้ายราคา QR Code สำหรับวางหน้าเชลฟ์"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">พิมพ์ป้ายราคา QR</span>
            <span className="sm:hidden">ป้าย QR</span>
          </button>
          <button
            onClick={onOpenNewProductModal}
            className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      </div>

      {/* Prominent QR Code Shelf Price Tag Printing Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-purple-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white">
                สร้างและพิมพ์ป้ายราคา QR Code หน้าเชลฟ์
              </h3>
              <span className="text-[10px] bg-purple-300 text-purple-950 font-extrabold px-2 py-0.5 rounded-full">
                Shelf Tags Ready
              </span>
            </div>
            <p className="text-xs text-purple-200/90 mt-0.5">
              ดึงชื่อสินค้า ราคา และอิโมจิ พร้อม QR Code ประจำตัวสินค้า จัดวางในรูปแบบการ์ดพร้อมสั่งพิมพ์สำหรับวางหน้าเชลฟ์สินค้า
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedTagProductId(undefined);
            setIsShelfTagsModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-purple-500 hover:bg-purple-400 active:scale-95 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4 text-white" />
          <span>พิมพ์ป้ายราคา ({products.length} สินค้า)</span>
        </button>
      </div>

      {/* Backup & Tools Box */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-slate-800 block">
              สำรองข้อมูลระบบ (System Backup)
            </span>
            <p className="text-xs text-slate-500">
              ดาวน์โหลดข้อมูลสินค้าและประวัติการรับเข้า-จ่ายออกทั้งหมดลงเครื่องแบบไฟล์ JSON
            </p>
          </div>
          <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full shrink-0">
            {products.length} สินค้า • {transactions.length} ประวัติ
          </span>
        </div>

        {/* Dedicated prominent Download Backup button */}
        <button
          onClick={() => downloadBackupJSON(products, transactions)}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Download className="w-4 h-4 text-white" />
          <span>ดาวน์โหลดสำรองข้อมูล (JSON) ทั้งสินค้าและประวัติ</span>
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV (Excel)</span>
          </button>

          <label className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-amber-600" />
            <span>กู้คืน/นำเข้าไฟล์ JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (window.confirm('คุณต้องการรีเซ็ตสินค้ากลับเป็นชุดตัวอย่างร้านของชำดั้งเดิมหรือไม่?')) {
                onResetToDemoData();
              }
            }}
            className="col-span-2 sm:col-span-1 p-2.5 bg-rose-50 border border-rose-200 rounded-xl font-medium text-rose-700 hover:bg-rose-100 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>รีเซ็ตค่าเริ่มต้น</span>
          </button>
        </div>
      </div>

      {/* Product List Table / Cards for Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>รายการสินค้าทั้งหมด ({products.length} รายการ)</span>
        </div>

        <div className="divide-y divide-slate-100">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl shrink-0" role="img" aria-label="emoji">
                    {p.emoji || '📦'}
                  </span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {p.id}
                  </span>
                  {p.barcode && (
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <BarcodeIcon className="w-2.5 h-2.5 text-slate-400" />
                      {p.barcode}
                    </span>
                  )}
                  {p.expiryDate && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                      Exp: {p.expiryDate}
                    </span>
                  )}
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {p.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-0.5 text-slate-700">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {p.location}
                  </span>
                  <span>•</span>
                  <span>คงเหลือ: <strong className="text-slate-800">{p.currentStock} {p.unit}</strong></span>
                  <span>•</span>
                  <span>ขั้นต่ำ: <strong className="text-rose-600">{p.minStock}</strong></span>
                  <span>•</span>
                  <span>ขาย: ฿{p.price}</span>
                </div>
              </div>

              {/* Action Buttons: QR Tag, Edit & Delete */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setSelectedTagProductId(p.id);
                    setIsShelfTagsModalOpen(true);
                  }}
                  className="p-2 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 active:scale-95 transition-all"
                  title="พิมพ์ป้ายราคา QR หน้าเชลฟ์สำหรับสินค้านี้"
                >
                  <QrCode className="w-4 h-4 text-purple-600" />
                </button>

                <button
                  onClick={() => {
                    setFormData(p);
                    onOpenNewProductModal();
                  }}
                  className="p-2 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 active:scale-95 transition-all"
                  title="แก้ไขข้อมูล"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setConfirmDeleteId(p.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
                  title="ลบสินค้า"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Delete Dialog Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4.5 space-y-3 shadow-xl">
            <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบสินค้า?</h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้ออกจากระบบ การดำเนินการนี้ไม่สามารถยกเลิกได้
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteProduct(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base sm:text-lg text-slate-900">
                {editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่ในระบบ'}
              </h3>
              <button
                onClick={onCloseEditModal}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                {/* Product Code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    รหัสสินค้า *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id || ''}
                    disabled={!!editingProduct}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="เช่น P001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none disabled:bg-slate-100 font-mono text-xs sm:text-sm"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    หมวดหมู่
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="เช่น อาหารแห้ง, เครื่องดื่ม"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Barcode Field with Camera Scan Button */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    รหัสบาร์โค้ด (Barcode)
                  </label>
                  <span className="text-[11px] text-slate-400">ถ้ามี หรือสแกนจากสินค้าจริง</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <BarcodeIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={formData.barcode || ''}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="เช่น 8850123456789"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none font-mono text-xs sm:text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-3.5 py-2.5 bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 rounded-xl font-semibold text-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4 text-purple-600" />
                    <span>สแกนบาร์โค้ด</span>
                  </button>
                </div>
              </div>

              {/* Product Emoji & Name */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  อิโมจิประจำตัวสินค้า & ชื่อสินค้า *
                </label>

                {/* Emoji Selector Bar */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPalette(!showEmojiPalette)}
                      className="w-12 h-12 rounded-xl bg-white border-2 border-purple-500 shadow-xs flex items-center justify-center text-2xl hover:scale-105 transition-transform shrink-0"
                      title="คลิกเพื่อเลือกอิโมจิ"
                    >
                      {formData.emoji || '📦'}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                        <span>อิโมจิที่เลือก: <strong className="text-slate-800 text-sm">{formData.emoji || '📦'}</strong></span>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPalette(!showEmojiPalette)}
                          className="text-purple-700 font-semibold hover:underline"
                        >
                          {showEmojiPalette ? 'ซ่อนจานสี' : 'เลือกจากจานสียอดนิยม'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.emoji || ''}
                        maxLength={4}
                        onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                        placeholder="พิมพ์อิโมจิเอง หรือคลิกเลือก ➔"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Categorized Emoji Palette */}
                  {showEmojiPalette && (
                    <div className="pt-2 border-t border-slate-200 space-y-2 animate-in fade-in">
                      {Object.entries(GROCERY_EMOJIS).map(([categoryName, emojiList]) => (
                        <div key={categoryName} className="space-y-1">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {categoryName}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {emojiList.map((em) => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, emoji: em });
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all active:scale-95 ${
                                  formData.emoji === em
                                    ? 'bg-purple-600 text-white shadow-xs scale-110'
                                    : 'bg-white hover:bg-purple-50 border border-slate-200'
                                }`}
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Name Input */}
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ไข่ไก่เบอร์ 2 (แผง 30 ฟอง)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none text-xs sm:text-sm"
                />
              </div>

              {/* Shelf Location */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ตำแหน่งจัดเก็บ (ชั้น / ล็อก / ตู้แช่) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="เช่น ชั้น A1, ตู้แช่ 1, ล็อกหลังร้าน 3"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Current Stock */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    จำนวนคงเหลือ *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock ?? 0}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none text-center font-bold"
                  />
                </div>

                {/* Min Stock (Warning threshold) */}
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">
                    ขั้นต่ำที่ต้องแจ้งเตือน *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minStock ?? 5}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-none text-center font-bold"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    หน่วยนับ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unit || 'ชิ้น'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="ซอง, ขวด, แพ็ค"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Selling Price */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ราคาขายหน้าร้าน (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.price ?? 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none text-right font-medium"
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ราคาทุน (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.costPrice ?? 0}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none text-right font-medium"
                  />
                </div>
              </div>

              {/* Expiry Date (FIFO Queue support) */}
              <div className="space-y-1.5 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-amber-950 text-xs sm:text-sm">
                    📅 วันหมดอายุของสินค้า (สำหรับคิว FIFO)
                  </label>
                  <span className="text-[11px] text-amber-700">ไม่บังคับ</span>
                </div>
                <input
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px]">
                  <span className="text-amber-800 text-[10px]">ลัด:</span>
                  {[
                    { label: '+7 วัน', days: 7 },
                    { label: '+1 เดือน', days: 30 },
                    { label: '+6 เดือน', days: 180 },
                    { label: '+1 ปี', days: 365 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const target = new Date();
                        target.setDate(target.getDate() + preset.days);
                        setFormData({ ...formData, expiryDate: target.toISOString().slice(0, 10) });
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                  {formData.expiryDate && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, expiryDate: '' })}
                      className="px-2 py-0.5 rounded-lg text-slate-500 hover:text-slate-700"
                    >
                      ล้าง
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCloseEditModal}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกข้อมูลสินค้า</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal for Product Form */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="สแกนบาร์โค้ดสินค้า"
        description="ส่องกล้องไปที่แถบบาร์โค้ดบนสินค้าจริงเพื่อบันทึกรหัสอัตโนมัติ"
      />

      {/* Shelf Price Tags Modal */}
      <ShelfPriceTagsModal
        isOpen={isShelfTagsModalOpen}
        onClose={() => {
          setIsShelfTagsModalOpen(false);
          setSelectedTagProductId(undefined);
        }}
        products={products}
        initialSelectedProductId={selectedTagProductId}
      />
    </div>
  );
};
