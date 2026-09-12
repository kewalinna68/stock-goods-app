export interface ProductLot {
  lotNumber: string;       // รหัสล็อต เช่น LOT-01
  expiryDate: string;      // วันหมดอายุ ISO string (YYYY-MM-DD)
  quantity: number;        // จำนวนในล็อตนี้
  receivedDate?: string;   // วันที่รับเข้า
  isClearance?: boolean;   // ป้ายลดราคา Clearance
}

export interface Product {
  id: string;              // รหัสสินค้า เช่น P001 หรือบาร์โค้ด
  name: string;            // ชื่อสินค้า เช่น ข้าวสารหอมมะลิ 5 กก.
  emoji?: string;          // อิโมจิประจำตัวสินค้า เช่น 🍜, 🥤, 🍿, 🧂, 🧼, 🍺, 💊
  barcode?: string;        // รหัสบาร์โค้ด เช่น 8850123456789 (EAN-13, EAN-8, Code 128)
  currentStock: number;    // จำนวนคงเหลือปัจจุบัน
  minStock: number;        // จำนวนขั้นต่ำที่ต้องแจ้งเตือน
  location: string;        // ตำแหน่งจัดเก็บ เช่น ชั้น A1, ตู้แช่ 1
  price: number;           // ราคาขาย (บาท)
  originalPrice?: number;  // ราคาปกติก่อนลด Clearance (ถ้ามี)
  isClearance?: boolean;   // ติดป้ายลดราคา Clearance 30% หรือไม่
  clearanceDiscount?: number; // เปอร์เซ็นต์ลดราคา เช่น 30
  costPrice?: number;      // ราคาทุน (ถ้ามี)
  unit: string;            // หน่วยนับ เช่น ซอง, ขวด, แพ็ค, แผง, ชิ้น
  category: string;        // หมวดหมู่ เช่น อาหารแห้ง, เครื่องดื่ม, ของใช้
  totalSold: number;       // จำนวนจ่ายออกสะสม (สำหรับวิเคราะห์สินค้ายอดนิยม)
  lastUpdated: string;     // วันที่แก้ไขล่าสุด ISO string
  expiryDate?: string;     // วันหมดอายุของล็อตที่ใกล้หมดที่สุด (YYYY-MM-DD)
  lots?: ProductLot[];     // รายการล็อตสำหรับคิว FIFO
}

export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
  id: string;              // รหัสบันทึก เช่น TX-168...
  timestamp: string;       // วันเวลาที่บันทึก
  productId: string;       // รหัสสินค้า
  productName: string;     // ชื่อสินค้า
  type: TransactionType;   // IN (รับเข้า) หรือ OUT (จ่ายออก/ขาย)
  quantity: number;        // จำนวนที่รับเข้าหรือจ่ายออก
  prevStock: number;       // คงเหลือก่อนหน้า
  newStock: number;        // คงเหลือใหม่
  note: string;            // หมายเหตุ เช่น ขายหน้าร้าน, รับจากแม็คโคร
  canUndo: boolean;        // สามารถกดย้อนกลับรายการนี้ได้หรือไม่
}

export interface GoogleSheetsConfig {
  webAppUrl: string;       // URL ของ Google Apps Script Web App
  autoSync: boolean;       // ซิงค์อัตโนมัติเมื่อบันทึก
  lastSyncTime: string | null;
  isConnected: boolean;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'stock-in' 
  | 'stock-out' 
  | 'products' 
  | 'fifo' 
  | 'analytics' 
  | 'restock' 
  | 'manage';

