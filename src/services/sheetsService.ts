import { Product, Transaction } from '../types';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ====================================================================
 * ระบบสต๊อกร้านของชำ (Grocery Store Inventory) - Google Apps Script
 * ====================================================================
 * วิธีติดตั้ง:
 * 1. เปิด Google Sheets เปล่า (หรือแผ่นงานที่มีอยู่)
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. ลบโค้ดเดิมทั้งหมดออก แล้วนำโค้ดด้านล่างนี้ไปวางแทน
 * 4. กดปุ่มบันทึก (ไอคอนแผ่นดิสก์)
 * 5. กดเลือกฟังก์ชัน "setupSheets" แล้วกดปุ่ม "เรียกใช้" (Run) 1 ครั้ง เพื่อสร้างตารางอัตโนมัติ
 * 6. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 7. เลือกประเภทเป็น "เว็บแอป" (Web app)
 * 8. ตั้งค่า:
 *    - คำอธิบาย: Grocery Stock Web App
 *    - ดำเนินการในฐานะ (Execute as): ตัวฉัน (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): ทุกคน (Anyone)  <-- สำคัญมาก!
 * 9. กดปุ่ม "ทำให้ใช้งานได้" แล้วคัดลอก "URL เว็บแอป" มาใส่ในแอปพลิเคชัน
 */

const SHEET_PRODUCTS = "Products";
const SHEET_TRANSACTIONS = "Transactions";

/**
 * ฟังก์ชันสร้างหัวตารางอัตโนมัติ (รันครั้งแรกเพียงครั้งเดียว)
 */
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
    "รหัสบาร์โค้ด (barcode)",
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
  
  // 2. สร้าง Sheet ประวัติรับเข้า-จ่ายออก (Transactions)
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

/**
 * ฟังก์ชันส่งอีเมลสรุปรายการสินค้าที่ต้องเติมให้เจ้าของร้าน
 * ทำงานอัตโนมัติทุกเช้าผ่าน Time-driven trigger หรือกดส่งทดสอบได้
 */
function sendDailySummaryEmail(recipientEmail) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
    if (!prodSheet || prodSheet.getLastRow() <= 1) {
      return { status: "empty", message: "ยังไม่มีรายการสินค้าในระบบ" };
    }

    // กำหนดอีเมลผู้รับ (หากไม่ได้ระบุ จะส่งหาเจ้าของ Google Account ที่รันสคริปต์)
    const emailTo = recipientEmail || Session.getActiveUser().getEmail();
    if (!emailTo) {
      return { status: "error", message: "ไม่พบอีเมลผู้รับ" };
    }

    const lastRow = prodSheet.getLastRow();
    const pData = prodSheet.getRange(2, 1, lastRow - 1, 12).getValues();

    const lowStockItems = [];
    pData.forEach(row => {
      const id = String(row[0] || '');
      const name = String(row[1] || '');
      const barcode = String(row[2] || '-');
      const current = Number(row[3]) || 0;
      const min = Number(row[4]) || 0;
      const location = String(row[5] || '-');
      const price = Number(row[6]) || 0;
      const unit = String(row[8] || 'ชิ้น');

      if (id && current <= min) {
        lowStockItems.push({
          id: id,
          name: name,
          barcode: barcode,
          current: current,
          min: min,
          location: location,
          price: price,
          unit: unit,
          suggestedRestock: Math.max(min * 2 - current, min - current + 1)
        });
      }
    });

    const todayStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "dd/MM/yyyy HH:mm");
    const storeTitle = ss.getName() || "ร้านขายของชำ";

    let subject = "";
    let htmlBody = "";

    if (lowStockItems.length > 0) {
      subject = "⚠️ [แจ้งเตือนสต๊อกร้านของชำ] สรุปรายการสินค้าที่ต้องสั่งเติม (" + todayStr + ") - พบ " + lowStockItems.length + " รายการ";

      let tableRows = "";
      lowStockItems.forEach((item, index) => {
        tableRows += "<tr style='border-bottom: 1px solid #e2e8f0;'>" +
          "<td style='padding: 10px; text-align: center; color: #64748b;'>" + (index + 1) + "</td>" +
          "<td style='padding: 10px; font-weight: bold; color: #1e293b;'>" + item.name + 
            (item.barcode && item.barcode !== '-' ? "<br><span style='font-size: 11px; color: #94a3b8;'>บาร์โค้ด: " + item.barcode + "</span>" : "") +
          "</td>" +
          "<td style='padding: 10px; text-align: center; color: #dc2626; font-weight: bold; background-color: #fef2f2;'>" + item.current + " " + item.unit + "</td>" +
          "<td style='padding: 10px; text-align: center; color: #64748b;'>" + item.min + " " + item.unit + "</td>" +
          "<td style='padding: 10px; text-align: center; color: #047857; font-weight: bold; background-color: #ecfdf5;'>+" + item.suggestedRestock + " " + item.unit + "</td>" +
          "<td style='padding: 10px; color: #475569;'>" + item.location + "</td>" +
        "</tr>";
      });

      htmlBody = "<div style='font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;'>" +
        "<div style='background: #047857; color: #ffffff; padding: 20px; text-align: center;'>" +
          "<h2 style='margin: 0; font-size: 20px;'>📦 สรุปรายการสินค้าที่ต้องสั่งเติมประจำวัน</h2>" +
          "<p style='margin: 5px 0 0 0; font-size: 13px; color: #a7f3d0;'>ระบบจัดการสต๊อกร้านของชำ | รายงาน ณ วันที่ " + todayStr + "</p>" +
        "</div>" +
        "<div style='padding: 20px;'>" +
          "<p style='font-size: 14px; color: #334155; margin-top: 0;'>สวัสดีครับเจ้าของร้าน,<br>เช้านี้มีสินค้าใกล้หมดและถึงจุดสั่งซื้อที่ต้องเติมสต๊อกทั้งหมด <strong>" + lowStockItems.length + " รายการ</strong> ดังตารางด้านล่างนี้ครับ:</p>" +
          "<div style='overflow-x: auto;'>" +
            "<table style='width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; margin: 15px 0;'>" +
              "<thead>" +
                "<tr style='background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;'>" +
                  "<th style='padding: 10px; text-align: center;'>#</th>" +
                  "<th style='padding: 10px;'>ชื่อสินค้า</th>" +
                  "<th style='padding: 10px; text-align: center;'>คงเหลือ</th>" +
                  "<th style='padding: 10px; text-align: center;'>เกณฑ์ขั้นต่ำ</th>" +
                  "<th style='padding: 10px; text-align: center;'>แนะนำสั่งเติม</th>" +
                  "<th style='padding: 10px;'>ตำแหน่งจัดเก็บ</th>" +
                "</tr>" +
              "</thead>" +
              "<tbody>" + tableRows + "</tbody>" +
            "</table>" +
          "</div>" +
          "<div style='background-color: #f1f5f9; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #64748b; margin-top: 15px;'>" +
            "💡 แนะนำให้ตรวจสอบสต๊อกจริงหน้าร้านและสั่งซื้อสินค้าเพื่อไม่ให้สินค้าขาดช่วงขายครับ" +
          "</div>" +
        "</div>" +
        "<div style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px; text-align: center; font-size: 11px; color: #94a3b8;'>" +
          "รายงานอัตโนมัติจากระบบจัดการสต๊อกร้านของชำ (Google Apps Script)" +
        "</div>" +
      "</div>";
    } else {
      subject = "✅ [สต๊อกร้านของชำ] สต๊อกสินค้าพร้อมขายทุกรายการ (" + todayStr + ")";
      htmlBody = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; text-align: center;'>" +
        "<div style='font-size: 40px; margin-bottom: 10px;'>🎉</div>" +
        "<h2 style='color: #047857; margin: 0 0 10px 0;'>สต๊อกสินค้าพร้อมขายทุกรายการ</h2>" +
        "<p style='color: #475569; font-size: 14px;'>ณ วันที่ " + todayStr + " ไม่มีสินค้าใดที่ต่ำกว่าเกณฑ์ขั้นต่ำครับ สินค้าพร้อมจำหน่ายปกติ</p>" +
      "</div>";
    }

    MailApp.sendEmail({
      to: emailTo,
      subject: subject,
      htmlBody: htmlBody
    });

    Logger.log("ส่งอีเมลสรุปสำเร็จไปยัง: " + emailTo);
    return { 
      status: "success", 
      message: "ส่งอีเมลแจ้งเตือนสำเร็จไปยัง " + emailTo,
      lowStockCount: lowStockItems.length
    };
  } catch (err) {
    Logger.log("ส่งอีเมลไม่สำเร็จ: " + err.toString());
    return { status: "error", message: err.toString() };
  }
}

/**
 * ฟังก์ชันสร้างตัวจับเวลา (Trigger) เพื่อส่งอีเมลสรุปทุกเช้าเวลา 07:00 - 08:00 น. อัตโนมัติ
 * รันฟังก์ชันนี้ใน Apps Script เพียง 1 ครั้ง
 */
function createDailyTrigger() {
  // ลบ trigger เดิมของฟังก์ชันนี้ก่อนเพื่อป้องกันการส่งซ้ำซ้อน
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "sendDailySummaryEmail") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // สร้าง Trigger ใหม่ทุกวันเวลา 07:00 - 08:00 น.
  ScriptApp.newTrigger("sendDailySummaryEmail")
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  Logger.log("ตั้งค่าแจ้งเตือนอัตโนมัติทุกเช้า 07:00 - 08:00 น. สำเร็จแล้ว!");
}

/**
 * ดึงข้อมูลสินค้าและประวัติทั้งหมดผ่าน HTTP GET
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ตรวจสอบ action พิเศษผ่าน GET เช่น การทดสอบ
    if (e && e.parameter && e.parameter.action === "sendDailySummary") {
      const emailResult = sendDailySummaryEmail(e.parameter.email);
      return ContentService
        .createTextOutput(JSON.stringify(emailResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // อ่านข้อมูลสินค้า
    let prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
    let products = [];
    if (prodSheet && prodSheet.getLastRow() > 1) {
      const numCols = Math.max(prodSheet.getLastColumn(), 12);
      const pData = prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, numCols).getValues();
      products = pData.map(row => ({
        id: String(row[0] || ''),
        name: String(row[1] || ''),
        barcode: String(row[2] || ''),
        currentStock: Number(row[3]) || 0,
        minStock: Number(row[4]) || 0,
        location: String(row[5] || ''),
        price: Number(row[6]) || 0,
        costPrice: Number(row[7]) || 0,
        unit: String(row[8] || ''),
        category: String(row[9] || ''),
        totalSold: Number(row[10]) || 0,
        lastUpdated: row[11] ? String(row[11]) : new Date().toISOString()
      })).filter(p => p.id !== '');
    }
    
    // อ่านประวัติรายการ (จำกัดล่าสุด 100 รายการ)
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

/**
 * บันทึกข้อมูลผ่าน HTTP POST (รับเข้า, จ่ายออก, ซิงค์สต๊อก, ส่งอีเมล)
 */
function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const body = JSON.parse(rawData);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // คำสั่งทดสอบส่งอีเมลสรุปสต๊อก
    if (body.action === "sendDailySummary" || body.action === "sendTestEmail") {
      const emailResult = sendDailySummaryEmail(body.recipientEmail);
      return ContentService.createTextOutput(JSON.stringify(emailResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (body.action === "syncAll") {
      // เขียนทับตารางสินค้าทั้งหมด
      let prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
      if (!prodSheet) {
        setupSheets();
        prodSheet = ss.getSheetByName(SHEET_PRODUCTS);
      }
      
      // ล้างข้อมูลเก่า (คงหัวตารางแถว 1 ไว้)
      if (prodSheet.getLastRow() > 1) {
        prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, 12).clearContent();
      }
      
      if (body.products && body.products.length > 0) {
        const rows = body.products.map(p => [
          p.id,
          p.name,
          p.barcode || '',
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
        prodSheet.getRange(2, 1, rows.length, 12).setValues(rows);
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
      
      // เพิ่มบันทึกประวัติ
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
      
      // อัปเดตสต๊อกคงเหลือใน Sheet สินค้า
      if (prodSheet.getLastRow() > 1) {
        const pIds = prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, 1).getValues();
        for (let i = 0; i < pIds.length; i++) {
          if (String(pIds[i][0]) === String(tx.productId)) {
            const rowIndex = i + 2;
            prodSheet.getRange(rowIndex, 4).setValue(tx.newStock); // currentStock column (col 4)
            if (tx.type === 'OUT') {
              const currentSold = Number(prodSheet.getRange(rowIndex, 11).getValue()) || 0;
              prodSheet.getRange(rowIndex, 11).setValue(currentSold + tx.quantity);
            }
            prodSheet.getRange(rowIndex, 12).setValue(new Date().toISOString());
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
`;

/**
 * ดึงข้อมูลสินค้าและประวัติจาก Google Apps Script Web App URL
 */
export async function fetchFromGoogleSheets(webAppUrl: string): Promise<{ products: Product[]; transactions: Transaction[] } | null> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    throw new Error('กรุณาระบุ URL ของ Google Apps Script Web App ให้ถูกต้อง');
  }

  try {
    const response = await fetch(webAppUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`เชื่อมต่อไม่สำเร็จ (HTTP Status: ${response.status})`);
    }

    const data = await response.json();
    if (data && data.status === 'success') {
      return {
        products: data.products || [],
        transactions: data.transactions || []
      };
    } else {
      throw new Error(data.message || 'โครงสร้างข้อมูลตอบกลับไม่ถูกต้อง');
    }
  } catch (err: any) {
    console.error('Google Sheets Fetch Error:', err);
    throw new Error(err.message || 'ไม่สามารถเชื่อมต่อกับ Google Apps Script ได้ ตรวจสอบสิทธิ์เป็น "ทุกคน (Anyone)" หรือยัง');
  }
}

/**
 * ซิงค์ข้อมูลทั้งหมดไปยัง Google Sheet
 */
export async function syncAllToGoogleSheets(webAppUrl: string, products: Product[]): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) return false;

  try {
    const payload = {
      action: 'syncAll',
      products: products
    };

    // Google Apps Script redirect handling using text/plain to prevent CORS preflight blocking
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (err) {
    console.error('Sync Error:', err);
    return false;
  }
}

/**
 * ส่ง Transaction เดียวไปบันทึกใน Google Sheets
 */
export async function pushTransactionToSheets(webAppUrl: string, transaction: Transaction): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) return false;

  try {
    const payload = {
      action: 'addTransaction',
      transaction: transaction
    };

    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (err) {
    console.error('Transaction push error:', err);
    return false;
  }
}

/**
 * สั่งให้ Google Apps Script ส่งอีเมลสรุปสินค้าใกล้หมดทันที (สำหรับทดสอบ)
 */
export async function triggerDailySummaryEmail(webAppUrl: string, recipientEmail?: string): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) return false;

  try {
    const payload = {
      action: 'sendTestEmail',
      recipientEmail: recipientEmail?.trim() || undefined,
    };

    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (err) {
    console.error('Send test email error:', err);
    return false;
  }
}

