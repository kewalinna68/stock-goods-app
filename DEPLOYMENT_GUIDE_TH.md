# คู่มือการติดตั้งและใช้งานระบบสต๊อกร้านขายของชำ (Google Sheets & Apps Script)

แอปพลิเคชันนี้ออกแบบมาสำหรับการจัดการสต๊อกและคลังสินค้าของร้านขายของชำบนมือถือโดยเฉพาะ (Mobile First) โดยไม่ต้องมีระบบ Login สะดวกต่อเจ้าของร้านและผู้ช่วยในร้าน

---

## 1. โครงสร้างตาราง Google Sheets

สร้าง Google Sheets ขึ้นมา 1 ไฟล์ และสร้างชีต (แผ่นงาน) 2 หน้าดังนี้:

### ชีตที่ 1: `Products` (ข้อมูลสินค้า)
ตั้งชื่อแท็บว่า: **`Products`** (ตัวพิมพ์ใหญ่-เล็กตามนี้)
บรรทัดที่ 1 (หัวตาราง):
1. คอลัมน์ A: `รหัสสินค้า (id)`
2. คอลัมน์ B: `ชื่อสินค้า (name)`
3. คอลัมน์ C: `จำนวนคงเหลือ (currentStock)`
4. คอลัมน์ D: `ขั้นต่ำแจ้งเตือน (minStock)`
5. คอลัมน์ E: `ตำแหน่งจัดเก็บ (location)`
6. คอลัมน์ F: `ราคาขาย (price)`
7. คอลัมน์ G: `ราคาทุน (costPrice)`
8. คอลัมน์ H: `หน่วยนับ (unit)`
9. คอลัมน์ I: `หมวดหมู่ (category)`
10. คอลัมน์ J: `จ่ายสะสม (totalSold)`
11. คอลัมน์ K: `อัปเดตล่าสุด (lastUpdated)`

### ชีตที่ 2: `Transactions` (ประวัติรับเข้า-จ่ายออก)
ตั้งชื่อแท็บว่า: **`Transactions`**
บรรทัดที่ 1 (หัวตาราง):
1. คอลัมน์ A: `รหัสรายการ (id)`
2. คอลัมน์ B: `วันเวลา (timestamp)`
3. คอลัมน์ C: `รหัสสินค้า (productId)`
4. คอลัมน์ D: `ชื่อสินค้า (productName)`
5. คอลัมน์ E: `ประเภท (type)` (IN / OUT)
6. คอลัมน์ F: `จำนวน (quantity)`
7. คอลัมน์ G: `คงเหลือก่อนหน้า (prevStock)`
8. คอลัมน์ H: `คงเหลือใหม่ (newStock)`
9. คอลัมน์ I: `หมายเหตุ (note)`

*(หมายเหตุ: ในโค้ด Google Apps Script มีฟังก์ชัน `setupSheets()` ที่ช่วยสร้างหัวตารางทั้ง 2 ชีตนี้ให้อัตโนมัติ)*

---

## 2. โค้ด Google Apps Script (`Code.gs`)

1. ใน Google Sheets ให้คลิกเมนูด้านบน: **ส่วนขยาย (Extensions) > Apps Script**
2. ลบโค้ดเดิมออกทั้งหมด แล้วนำโค้ดด้านล่างนี้ไปวาง:

```javascript
const SHEET_PRODUCTS = "Products";
const SHEET_TRANSACTIONS = "Transactions";

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. สร้าง Sheet สินค้า (Products)
  let prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
  if (!prodSheet) {
    prodSheet = ss.insertSheet(SHEET_PRODUCTS);
  }
  const prodHeaders = [
    "รหัสสินค้า (id)", 
    "ชื่อสินค้า (name)", 
    "จำนวนคงเหลือ (currentStock)", 
    "ขั้นต่ำแจ้งเตือน (minStock)", 
    "ตำแหน่งจัดเก็บ (location)", 
    "ราคาขาย (price)", 
    "ราคาทุน (costPrice)", 
    "หน่วยนับ (unit)", 
    "หมวดหมู่ (category)", 
    "จ่ายสะสม (totalSold)", 
    "อัปเดตล่าสุด (lastUpdated)"
  ];
  prodSheet.getRange(1, 1, 1, prodHeaders.length).setValues([prodHeaders]);
  prodSheet.getRange(1, 1, 1, prodHeaders.length).setBackground("#047857").setFontColor("#FFFFFF").setFontWeight("bold");
  prodSheet.setFrozenRows(1);
  
  // 2. สร้าง Sheet ประวัติ (Transactions)
  let txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!txSheet) {
    txSheet = ss.insertSheet(SHEET_TRANSACTIONS);
  }
  const txHeaders = [
    "รหัสรายการ (id)", 
    "วันเวลา (timestamp)", 
    "รหัสสินค้า (productId)", 
    "ชื่อสินค้า (productName)", 
    "ประเภท (type)", 
    "จำนวน (quantity)", 
    "คงเหลือก่อนหน้า (prevStock)", 
    "คงเหลือใหม่ (newStock)", 
    "หมายเหตุ (note)"
  ];
  txSheet.getRange(1, 1, 1, txHeaders.length).setValues([txHeaders]);
  txSheet.getRange(1, 1, 1, txHeaders.length).setBackground("#1E3A8A").setFontColor("#FFFFFF").setFontWeight("bold");
  txSheet.setFrozenRows(1);
  
  Logger.log("สร้างตารางเรียบร้อยแล้ว!");
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
    let products = [];
    if (prodSheet && prodSheet.getLastRow() > 1) {
      const pData = prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, 11).getValues();
      products = pData.map(row => ({
        id: String(row[0] || ''),
        name: String(row[1] || ''),
        currentStock: Number(row[2]) || 0,
        minStock: Number(row[3]) || 0,
        location: String(row[4] || ''),
        price: Number(row[5]) || 0,
        costPrice: Number(row[6]) || 0,
        unit: String(row[7] || ''),
        category: String(row[8] || ''),
        totalSold: Number(row[9]) || 0,
        lastUpdated: row[10] ? String(row[10]) : new Date().toISOString()
      })).filter(p => p.id !== '');
    }
    
    let txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    let transactions = [];
    if (txSheet && txSheet.getLastRow() > 1) {
      const numRows = Math.min(txSheet.getLastRow() - 1, 100);
      const startRow = Math.max(2, txSheet.getLastRow() - numRows + 1);
      const tData = txSheet.getRange(startRow, 1, numRows, 9).getValues();
      transactions = tData.map(row => ({
        id: String(row[0] || ''),
        timestamp: String(row[1] || ''),
        productId: String(row[2] || ''),
        productName: String(row[3] || ''),
        type: String(row[4] || 'OUT'),
        quantity: Number(row[5]) || 0,
        prevStock: Number(row[6]) || 0,
        newStock: Number(row[7]) || 0,
        note: String(row[8] || ''),
        canUndo: true
      })).reverse();
    }

    const output = {
      status: "success",
      timestamp: new Date().toISOString(),
      products: products,
      transactions: transactions
    };

    return ContentService
      .createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const body = JSON.parse(rawData);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (body.action === "syncAll") {
      let prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
      if (!prodSheet) {
        setupSheets();
        prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
      }
      
      if (prodSheet.getLastRow() > 1) {
        prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, 11).clearContent();
      }
      
      if (body.products && body.products.length > 0) {
        const rows = body.products.map(p => [
          p.id,
          p.name,
          p.currentStock,
          p.minStock,
          p.location,
          p.price,
          p.costPrice || 0,
          p.unit,
          p.category,
          p.totalSold || 0,
          p.lastUpdated || new Date().toISOString()
        ]);
        prodSheet.getRange(2, 1, rows.length, 11).setValues(rows);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "ซิงค์สินค้าทั้งหมดสำเร็จ" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (body.action === "addTransaction") {
      const tx = body.transaction;
      let txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
      let prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
      if (!txSheet || !prodSheet) {
        setupSheets();
        txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
        prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
      }
      
      txSheet.appendRow([
        tx.id,
        tx.timestamp,
        tx.productId,
        tx.productName,
        tx.type,
        tx.quantity,
        tx.prevStock,
        tx.newStock,
        tx.note
      ]);
      
      if (prodSheet.getLastRow() > 1) {
        const pIds = prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, 1).getValues();
        for (let i = 0; i < pIds.length; i++) {
          if (String(pIds[i][0]) === String(tx.productId)) {
            const rowIndex = i + 2;
            prodSheet.getRange(rowIndex, 3).setValue(tx.newStock);
            if (tx.type === 'OUT') {
              const currentSold = Number(prodSheet.getRange(rowIndex, 10).getValue()) || 0;
              prodSheet.getRange(rowIndex, 10).setValue(currentSold + tx.quantity);
            }
            prodSheet.getRange(rowIndex, 11).setValue(new Date().toISOString());
            break;
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "บันทึกรายการสำเร็จ" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "ไม่พบคำสั่งที่ระบุ" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 3. ขั้นตอนการ Deploy เป็น Web App

1. ในหน้า Apps Script ให้กดปุ่ม **บันทึก (ไอคอนแผ่นดิสก์)**
2. เลื่อนเมาส์ไปที่กล่องเลือกฟังก์ชัน แล้วเลือก `setupSheets` จากนั้นกดปุ่ม **"เรียกใช้" (Run)** 1 ครั้ง เพื่อให้สร้างชีตและหัวตาราง (กดยืนยันสิทธิ์อนุญาตการเข้าถึงหากมีหน้าต่างถาม)
3. กดปุ่มสีน้ำเงิน **"ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)**
4. เลือกประเภท: **เว็บแอป (Web app)**
5. กำหนดการตั้งค่า:
   - **คำอธิบาย (Description):** `Grocery Stock Web App`
   - **ดำเนินการในฐานะ (Execute as):** `ตัวฉัน (Me)`
   - **ผู้ที่มีสิทธิ์เข้าถึง (Who has access):** `ทุกคน (Anyone)` *(สำคัญมาก: ต้องเลือก Anyone เพื่อให้สามารถใช้งานจากมือถือได้ทันทีโดยไม่ต้องล็อกอิน)*
6. กดปุ่ม **"ทำให้ใช้งานได้" (Deploy)**
7. คัดลอก **"URL เว็บแอป" (Web App URL)** ที่ลงท้ายด้วย `/exec`
8. กลับมาที่ Web Application นี้ กดปุ่ม **"ต่อ Sheets"** มุมขวาบน แล้ววาง URL ลงในช่อง จากนั้นกดปุ่ม **"ทดสอบการเชื่อมต่อ"** แล้วกด **"ส่งข้อมูลขึ้น Sheets"** ได้ทันที!
