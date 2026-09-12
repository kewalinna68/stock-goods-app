import { Product, Transaction } from '../types';

export interface BackupData {
  system: string;
  exportedAt: string;
  version: string;
  summary: {
    totalProducts: number;
    totalTransactions: number;
  };
  products: Product[];
  transactions: Transaction[];
}

/**
 * ดาวน์โหลดข้อมูลสำรองทั้งระบบ (สินค้า + ประวัติการทำรายการ) ในรูปแบบไฟล์ JSON
 */
export function downloadBackupJSON(products: Product[], transactions: Transaction[]) {
  const backup: BackupData = {
    system: 'ระบบจัดการสต๊อกร้านของชำ (Grocery Store Stock)',
    exportedAt: new Date().toISOString(),
    version: '1.1',
    summary: {
      totalProducts: products.length,
      totalTransactions: transactions.length,
    },
    products,
    transactions,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `สำรองข้อมูลสต๊อกร้าน_${dateStr}.json`;

  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = filename;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}
