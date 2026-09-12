import { Product, Transaction } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'P001',
    name: 'ไข่ไก่สด เบอร์ 2 (แผง 30 ฟอง)',
    emoji: '🥚',
    barcode: '8850001001015',
    currentStock: 3,
    minStock: 8,
    location: 'ชั้นไข่สด หน้าร้าน',
    price: 135,
    costPrice: 118,
    unit: 'แผง',
    category: 'ของสด / ไข่',
    totalSold: 64,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2026-09-17',
    lots: [
      { lotNumber: 'LOT-EGG-09A', expiryDate: '2026-09-17', quantity: 3, receivedDate: '2026-09-03' }
    ]
  },
  {
    id: 'P002',
    name: 'มาม่า บะหมี่กึ่งสำเร็จรูป รสต้มยำกุ้ง (60ก.)',
    emoji: '🍜',
    barcode: '8850987101018',
    currentStock: 12,
    minStock: 30,
    location: 'ชั้น A1 บะหมี่กึ่งสำเร็จรูป',
    price: 7,
    costPrice: 5.5,
    unit: 'ซอง',
    category: 'อาหารแห้ง',
    totalSold: 142,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2026-09-28',
    lots: [
      { lotNumber: 'LOT-MM-08B', expiryDate: '2026-09-28', quantity: 5, receivedDate: '2026-03-28' },
      { lotNumber: 'LOT-MM-09A', expiryDate: '2027-02-15', quantity: 7, receivedDate: '2026-08-15' }
    ]
  },
  {
    id: 'P003',
    name: 'ไวไว รสดั้งเดิม (55ก.)',
    emoji: '🍜',
    barcode: '8850127001011',
    currentStock: 25,
    minStock: 20,
    location: 'ชั้น A1 บะหมี่กึ่งสำเร็จรูป',
    price: 7,
    costPrice: 5.5,
    unit: 'ซอง',
    category: 'อาหารแห้ง',
    totalSold: 88,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2026-11-20',
    lots: [
      { lotNumber: 'LOT-WW-11', expiryDate: '2026-11-20', quantity: 25, receivedDate: '2026-05-20' }
    ]
  },
  {
    id: 'P004',
    name: 'ข้าวสารหอมมะลิ ตราฉัตร (ถุง 5 กก.)',
    emoji: '🌾',
    barcode: '8851932305012',
    currentStock: 4,
    minStock: 6,
    location: 'ล็อกข้าวสาร 1 หลังร้าน',
    price: 199,
    costPrice: 175,
    unit: 'ถุง',
    category: 'อาหารแห้ง',
    totalSold: 32,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2027-03-10',
    lots: [
      { lotNumber: 'LOT-RC-03', expiryDate: '2027-03-10', quantity: 4, receivedDate: '2026-03-10' }
    ]
  },
  {
    id: 'P005',
    name: 'น้ำมันพืช มรกต ปาล์ม (1 ลิตร)',
    emoji: '🍳',
    barcode: '8850035010014',
    currentStock: 5,
    minStock: 12,
    location: 'ชั้น B1 น้ำมันพืช',
    price: 48,
    costPrice: 42,
    unit: 'ขวด',
    category: 'เครื่องปรุง',
    totalSold: 75,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2026-12-05',
    lots: [
      { lotNumber: 'LOT-OIL-12', expiryDate: '2026-12-05', quantity: 5, receivedDate: '2025-12-05' }
    ]
  },
  {
    id: 'P006',
    name: 'น้ำปลาแท้ ทิพรส (ขวด 700 มล.)',
    emoji: '🧂',
    barcode: '8850125007015',
    currentStock: 14,
    minStock: 10,
    location: 'ชั้น B2 เครื่องปรุงรส',
    price: 33,
    costPrice: 28,
    unit: 'ขวด',
    category: 'เครื่องปรุง',
    totalSold: 41,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2027-01-20',
    lots: [
      { lotNumber: 'LOT-FS-01', expiryDate: '2027-01-20', quantity: 14, receivedDate: '2026-01-20' }
    ]
  },
  {
    id: 'P007',
    name: 'ปลากระป๋อง ตราสามแม่ครัว (155ก.)',
    emoji: '🐟',
    barcode: '8850188001552',
    currentStock: 6,
    minStock: 24,
    location: 'ชั้น A3 อาหารกระป๋อง',
    price: 20,
    costPrice: 16.5,
    unit: 'กระป๋อง',
    category: 'อาหารแห้ง',
    totalSold: 96,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2026-10-05',
    lots: [
      { lotNumber: 'LOT-FISH-10', expiryDate: '2026-10-05', quantity: 6, receivedDate: '2023-10-05' }
    ]
  },
  {
    id: 'P008',
    name: 'นมข้นหวาน ตรามะลิ (380ก.)',
    emoji: '🥫',
    barcode: '8850153038019',
    currentStock: 18,
    minStock: 12,
    location: 'ชั้น A2 นม/กาแฟ',
    price: 28,
    costPrice: 23,
    unit: 'กระป๋อง',
    category: 'อาหารแห้ง',
    totalSold: 53,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2026-12-15',
    lots: [
      { lotNumber: 'LOT-ML-12', expiryDate: '2026-12-15', quantity: 18, receivedDate: '2025-12-15' }
    ]
  },
  {
    id: 'P009',
    name: 'น้ำดื่มคริสตัล (ขวด 600 มล.)',
    emoji: '🥤',
    barcode: '8851959132011',
    currentStock: 8,
    minStock: 36,
    location: 'ตู้แช่เย็น 2',
    price: 7,
    costPrice: 4.8,
    unit: 'ขวด',
    category: 'เครื่องดื่ม',
    totalSold: 185,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2027-06-30',
    lots: [
      { lotNumber: 'LOT-WT-06', expiryDate: '2027-06-30', quantity: 8, receivedDate: '2026-06-30' }
    ]
  },
  {
    id: 'P010',
    name: 'โค้ก กระป๋อง ออริจินัล (325 มล.)',
    emoji: '🥤',
    barcode: '8851959141013',
    currentStock: 15,
    minStock: 24,
    location: 'ตู้แช่เย็น 1',
    price: 16,
    costPrice: 12.5,
    unit: 'กระป๋อง',
    category: 'เครื่องดื่ม',
    totalSold: 110,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2026-11-15',
    lots: [
      { lotNumber: 'LOT-COKE-11', expiryDate: '2026-11-15', quantity: 7, receivedDate: '2026-05-15' },
      { lotNumber: 'LOT-COKE-01', expiryDate: '2027-01-20', quantity: 8, receivedDate: '2026-07-20' }
    ]
  },
  {
    id: 'P011',
    name: 'นมถั่วเหลือง แลคตาซอย หวาน (300 มล.)',
    emoji: '🥛',
    barcode: '8850228001018',
    currentStock: 10,
    minStock: 20,
    location: 'ตู้แช่เย็น 1',
    price: 12,
    costPrice: 9.5,
    unit: 'กล่อง',
    category: 'เครื่องดื่ม',
    totalSold: 67,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2026-09-22',
    lots: [
      { lotNumber: 'LOT-LAC-09', expiryDate: '2026-09-22', quantity: 4, receivedDate: '2026-03-22' },
      { lotNumber: 'LOT-LAC-12', expiryDate: '2026-12-10', quantity: 6, receivedDate: '2026-06-10' }
    ]
  },
  {
    id: 'P012',
    name: 'ผงซักฟอก บรีสเอกเซล (800ก.)',
    emoji: '🧺',
    barcode: '8851932311808',
    currentStock: 7,
    minStock: 10,
    location: 'ชั้น C1 ของใช้ในบ้าน',
    price: 89,
    costPrice: 76,
    unit: 'ถุง',
    category: 'ของใช้ในบ้าน',
    totalSold: 28,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2028-01-01',
    lots: [
      { lotNumber: 'LOT-DET-01', expiryDate: '2028-01-01', quantity: 7, receivedDate: '2025-01-01' }
    ]
  },
  {
    id: 'P013',
    name: 'น้ำยาล้างจาน ซันไลต์ เลมอนเทอร์โบ (750 มล.)',
    emoji: '🧼',
    barcode: '8851932375018',
    currentStock: 16,
    minStock: 12,
    location: 'ชั้น C1 ของใช้ในบ้าน',
    price: 36,
    costPrice: 30,
    unit: 'ถุง',
    category: 'ของใช้ในบ้าน',
    totalSold: 46,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2027-10-15',
    lots: [
      { lotNumber: 'LOT-SL-10', expiryDate: '2027-10-15', quantity: 16, receivedDate: '2025-10-15' }
    ]
  },
  {
    id: 'P014',
    name: 'สบู่ก้อน โพรเทคส์ สดชื่น (65ก.)',
    emoji: '🧼',
    barcode: '8850006006518',
    currentStock: 22,
    minStock: 15,
    location: 'ชั้น C2 ของใช้ส่วนตัว',
    price: 15,
    costPrice: 11,
    unit: 'ก้อน',
    category: 'ของใช้ส่วนตัว',
    totalSold: 39,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2028-05-01',
    lots: [
      { lotNumber: 'LOT-SOAP-05', expiryDate: '2028-05-01', quantity: 22, receivedDate: '2025-05-01' }
    ]
  },
  {
    id: 'P015',
    name: 'ยาสีฟัน คอลเกต ยอดนิยม (150ก.)',
    emoji: '🪥',
    barcode: '8850006015015',
    currentStock: 9,
    minStock: 10,
    location: 'ชั้น C2 ของใช้ส่วนตัว',
    price: 52,
    costPrice: 42,
    unit: 'หลอด',
    category: 'ของใช้ส่วนตัว',
    totalSold: 25,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2027-08-20',
    lots: [
      { lotNumber: 'LOT-TP-08', expiryDate: '2027-08-20', quantity: 9, receivedDate: '2025-08-20' }
    ]
  },
  {
    id: 'P016',
    name: 'กาแฟปรุงสำเร็จ เบอร์ดี้ โรบัสต้า (แพ็ค 25 ซอง)',
    emoji: '☕',
    barcode: '8850125025019',
    currentStock: 6,
    minStock: 8,
    location: 'ชั้น A2 นม/กาแฟ',
    price: 95,
    costPrice: 82,
    unit: 'แพ็ค',
    category: 'เครื่องดื่ม',
    totalSold: 34,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2026-10-18',
    lots: [
      { lotNumber: 'LOT-CF-10', expiryDate: '2026-10-18', quantity: 6, receivedDate: '2025-10-18' }
    ]
  },
  {
    id: 'P017',
    name: 'ขนมปังแถว ฟาร์มเฮ้าส์ (แพ็ค 480ก.)',
    emoji: '🍞',
    barcode: '8850250004803',
    currentStock: 2,
    minStock: 6,
    location: 'ชั้นขนมปังสด หน้าร้าน',
    price: 42,
    costPrice: 35,
    unit: 'แถว',
    category: 'ของสด / ขนมปัง',
    totalSold: 58,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2026-09-15',
    lots: [
      { lotNumber: 'LOT-BRD-09', expiryDate: '2026-09-15', quantity: 2, receivedDate: '2026-09-08' }
    ]
  },
  {
    id: 'P018',
    name: 'น้ำตาลทรายขาว มิตรผล (1 กก.)',
    emoji: '🧂',
    barcode: '8850127010013',
    currentStock: 11,
    minStock: 15,
    location: 'ชั้น B2 เครื่องปรุงรส',
    price: 27,
    costPrice: 23.5,
    unit: 'ถุง',
    category: 'เครื่องปรุง',
    totalSold: 61,
    lastUpdated: new Date().toISOString(),
    expiryDate: '2028-12-31',
    lots: [
      { lotNumber: 'LOT-SUGAR-12', expiryDate: '2028-12-31', quantity: 11, receivedDate: '2026-01-10' }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-001',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    productId: 'P009',
    productName: 'น้ำดื่มคริสตัล (ขวด 600 มล.)',
    type: 'OUT',
    quantity: 12,
    prevStock: 20,
    newStock: 8,
    note: 'ขายลูกค้าร้านลาบ 1 โหล',
    canUndo: true,
  },
  {
    id: 'TX-002',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    productId: 'P001',
    productName: 'ไข่ไก่สด เบอร์ 2 (แผง 30 ฟอง)',
    type: 'OUT',
    quantity: 2,
    prevStock: 5,
    newStock: 3,
    note: 'ขายหน้าร้าน',
    canUndo: true,
  },
  {
    id: 'TX-003',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    productId: 'P007',
    productName: 'ปลากระป๋อง ตราสามแม่ครัว (155ก.)',
    type: 'OUT',
    quantity: 6,
    prevStock: 12,
    newStock: 6,
    note: 'ขายหน้าร้าน',
    canUndo: true,
  },
  {
    id: 'TX-004',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    productId: 'P002',
    productName: 'มาม่า บะหมี่กึ่งสำเร็จรูป รสต้มยำกุ้ง (60ก.)',
    type: 'IN',
    quantity: 30,
    prevStock: 0,
    newStock: 30,
    note: 'รับสินค้าจากแม็คโคร',
    canUndo: false,
  },
];
