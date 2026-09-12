import React, { useState } from 'react';
import { 
  Sheet as SheetIcon, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  X, 
  Code, 
  FileText, 
  Database,
  ArrowUpRight,
  Mail,
  Send,
  Clock
} from 'lucide-react';
import { GoogleSheetsConfig, Product, Transaction } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE, triggerDailySummaryEmail } from '../services/sheetsService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (newConfig: GoogleSheetsConfig) => void;
  onTestConnection: (url: string) => Promise<boolean>;
  onManualSync: () => Promise<void>;
  onPullFromSheets: () => Promise<void>;
  isSyncing: boolean;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestConnection,
  onManualSync,
  onPullFromSheets,
  isSyncing,
}) => {
  const [urlInput, setUrlInput] = useState(config.webAppUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSync ?? true);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'setup' | 'code' | 'structure'>('setup');
  const [customEmail, setCustomEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestEmail = async () => {
    const url = urlInput.trim() || config.webAppUrl;
    if (!url) {
      setEmailStatus('error');
      setEmailMessage('กรุณาระบุ URL ของ Web App ก่อน');
      return;
    }

    setEmailStatus('sending');
    setEmailMessage(null);

    try {
      const ok = await triggerDailySummaryEmail(url, customEmail.trim() || undefined);
      if (ok) {
        setEmailStatus('success');
        setEmailMessage(
          customEmail.trim() 
            ? `ส่งคำขอส่งอีเมลสรุปสินค้าไปที่ ${customEmail.trim()} สำเร็จแล้ว (กรุณาตรวจดูกล่องจดหมายหรือสแปม)`
            : 'ส่งคำขอส่งอีเมลสรุปสินค้าไปยังอีเมลเจ้าของบัญชี Google Apps Script สำเร็จแล้ว!'
        );
      } else {
        setEmailStatus('error');
        setEmailMessage('ไม่สามารถส่งอีเมลได้ ตรวจสอบสิทธิ์การเข้าถึงหรือ URL Web App');
      }
    } catch (err: any) {
      setEmailStatus('error');
      setEmailMessage(err.message || 'เกิดข้อผิดพลาดในการส่งอีเมล');
    }
  };

  const handleTest = async () => {
    if (!urlInput.trim()) {
      setTestStatus('error');
      setTestMessage('กรุณาระบุ URL ของ Google Apps Script Web App');
      return;
    }

    setTestStatus('testing');
    setTestMessage(null);

    try {
      const ok = await onTestConnection(urlInput.trim());
      if (ok) {
        setTestStatus('success');
        setTestMessage('เชื่อมต่อกับ Google Sheets สำเร็จ! สามารถซิงค์ข้อมูลได้ทันที');
        onSaveConfig({
          webAppUrl: urlInput.trim(),
          autoSync: autoSync,
          lastSyncTime: new Date().toISOString(),
          isConnected: true,
        });
      } else {
        setTestStatus('error');
        setTestMessage('ไม่สามารถเชื่อมต่อได้ ตรวจสอบว่าตั้งค่า "Who has access (ผู้มีสิทธิ์เข้าถึง)" เป็น "Anyone (ทุกคน)" หรือยัง');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleSaveSettings = () => {
    onSaveConfig({
      webAppUrl: urlInput.trim(),
      autoSync: autoSync,
      lastSyncTime: config.lastSyncTime,
      isConnected: !!urlInput.trim(),
    });
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleDownloadCodeGs = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center">
              <SheetIcon className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="font-bold text-base">เชื่อมต่อฐานข้อมูล Google Sheets</h2>
              <p className="text-xs text-emerald-100">
                เก็บข้อมูลสินค้าและประวัติลงใน Google Sheets ของคุณแบบ Real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
          {/* Connection URL Form */}
          <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-700" />
                <span>Google Apps Script Web App URL:</span>
              </label>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                config.isConnected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${config.isConnected ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                {config.isConnected ? 'เชื่อมต่อแล้ว' : 'บันทึกในเครื่อง (Local)'}
              </span>
            </div>

            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Test connection & sync buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={testStatus === 'testing'}
                onClick={handleTest}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{testStatus === 'testing' ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
              </button>

              {config.isConnected && (
                <>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={onManualSync}
                    className="px-3 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>ส่งข้อมูลขึ้น Sheets</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={onPullFromSheets}
                    className="px-3 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดึงข้อมูลจาก Sheets</span>
                  </button>
                </>
              )}
            </div>

            {/* Auto-Sync Toggle */}
            <label className="flex items-center gap-2 text-xs text-emerald-950 font-medium cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>ซิงค์ข้อมูลอัตโนมัติทุกครั้งเมื่อบันทึกรับเข้า-จ่ายออก</span>
            </label>

            {/* Test Status Feedback */}
            {testMessage && (
              <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                testStatus === 'success' 
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}>
                {testStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testMessage}</span>
              </div>
            )}

            {/* Daily Email Summary Test Card */}
            <div className="pt-3 border-t border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ระบบส่งอีเมลสรุปสินค้าต้องเติมรายวัน (Daily Email Alert):</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>ส่งอัตโนมัติทุกเช้า 7:00-8:00 น.</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                เมื่อตั้งทริกเกอร์ใน Apps Script ระบบจะส่งอีเมลสรุปรายการสินค้าที่ถึงจุดสั่งซื้อ (สต๊อก &le; ขั้นต่ำ) พร้อมบอกตำแหน่งจัดเก็บให้เจ้าของร้านทุกเช้า
              </p>

              <div className="flex gap-2 items-center">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="ใส่อีเมลปลายทาง (ถ้าไม่ระบุ จะส่งให้อีเมลเจ้าของบัญชี Google)"
                  className="flex-1 p-2 bg-white border border-emerald-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  disabled={emailStatus === 'sending'}
                  onClick={handleTestEmail}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50 transition-all shadow-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${emailStatus === 'sending' ? 'animate-pulse' : ''}`} />
                  <span>{emailStatus === 'sending' ? 'กำลังส่ง...' : 'ทดสอบส่งอีเมลทันที'}</span>
                </button>
              </div>

              {emailMessage && (
                <div className={`p-2 rounded-lg text-xs flex items-start gap-1.5 ${
                  emailStatus === 'success' 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                    : 'bg-rose-100 text-rose-900 border border-rose-200'
                }`}>
                  {emailStatus === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{emailMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-semibold gap-2">
            <button
              onClick={() => setActiveSubTab('setup')}
              className={`pb-2 border-b-2 px-2 transition-colors ${
                activeSubTab === 'setup'
                  ? 'border-emerald-600 text-emerald-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1. วิธีติดตั้ง & Deploy (5 ขั้นตอน)
            </button>
            <button
              onClick={() => setActiveSubTab('code')}
              className={`pb-2 border-b-2 px-2 transition-colors ${
                activeSubTab === 'code'
                  ? 'border-emerald-600 text-emerald-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              2. โค้ด Apps Script (Code.gs)
            </button>
            <button
              onClick={() => setActiveSubTab('structure')}
              className={`pb-2 border-b-2 px-2 transition-colors ${
                activeSubTab === 'structure'
                  ? 'border-emerald-600 text-emerald-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              3. โครงสร้าง Google Sheets
            </button>
          </div>

          {/* Tab 1: Setup Instructions */}
          {activeSubTab === 'setup' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">1</span>
                  <span>สร้าง Google Sheets และเปิด Apps Script</span>
                </div>
                <p className="text-slate-600 text-xs pl-7">
                  ไปที่ Google Drive แล้วสร้าง <strong>Google Sheets</strong> แผ่นงานใหม่ จากนั้นคลิกเมนูด้านบน <strong>"ส่วนขยาย" (Extensions) &gt; "Apps Script"</strong>
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">2</span>
                  <span>วางโค้ด Apps Script และรัน setupSheets</span>
                </div>
                <p className="text-slate-600 text-xs pl-7">
                  ลบโค้ดเดิมใน <code>Code.gs</code> ออกทั้งหมด แล้วคัดลอกโค้ดจากแท็บ <strong>"โค้ด Apps Script"</strong> ไปวาง จากนั้นเลือกฟังก์ชัน <code>setupSheets</code> แล้วกดปุ่ม <strong>"เรียกใช้" (Run)</strong> 1 ครั้ง เพื่อให้ระบบสร้างหัวตารางใน Sheets ให้อัตโนมัติ (รวมคอลัมน์บาร์โค้ด)
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">3</span>
                  <span>Deploy เป็น Web App (สำคัญมาก)</span>
                </div>
                <p className="text-slate-600 text-xs pl-7">
                  กดปุ่มสีฟ้า <strong>"ทำให้ใช้งานได้" (Deploy) &gt; "การทำให้ใช้งานได้รายการใหม่" (New deployment)</strong><br />
                  - เลือกประเภท: <strong>เว็บแอป (Web app)</strong><br />
                  - ดำเนินการในฐานะ (Execute as): <strong>ตัวฉัน (Me)</strong><br />
                  - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): <strong>ทุกคน (Anyone)</strong> <em>(เพื่อให้มือถือเปิดใช้งานได้ทันทีไม่ต้องล็อกอิน)</em>
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">4</span>
                  <span>นำ URL มาใส่ในช่องด้านบน</span>
                </div>
                <p className="text-slate-600 text-xs pl-7">
                  คัดลอก <strong>"URL เว็บแอป" (Web App URL)</strong> มาวางในช่องด้านบน แล้วกด <strong>"ทดสอบการเชื่อมต่อ"</strong> และกด <strong>"ส่งข้อมูลขึ้น Sheets"</strong> ได้ทันที!
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-xs flex items-center justify-center">5</span>
                  <span>เปิดใช้งานอีเมลสรุปสินค้าใกล้หมดทุกเช้า (Daily Email Alert)</span>
                </div>
                <p className="text-slate-700 text-xs pl-7 leading-relaxed">
                  ในหน้าต่าง Apps Script เลือกฟังก์ชัน <code>createDailyTrigger</code> แล้วกด <strong>"เรียกใช้" (Run)</strong> 1 ครั้ง<br />
                  ระบบจะตั้งเวลาอัตโนมัติเพื่อตรวจสอบสต๊อกและส่งอีเมลสรุปรายการสินค้าที่ต้องสั่งซื้อ/เติมของไปยังอีเมลของคุณทุกวัน เวลา 07:00 - 08:00 น.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Code.gs Copy/Download */}
          {activeSubTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  ไฟล์: Code.gs (Google Apps Script)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg text-xs flex items-center gap-1 hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'คัดลอกเรียบร้อย!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                  </button>

                  <button
                    onClick={handleDownloadCodeGs}
                    className="px-2.5 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 hover:bg-slate-200 transition-all border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลด .gs</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 3: Google Sheets Structure */}
          {activeSubTab === 'structure' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>แผ่นงานที่ 1: ชื่อแท็บ <code>Products</code> (ข้อมูลสินค้า)</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border border-slate-200 bg-white">
                    <thead className="bg-emerald-800 text-white">
                      <tr>
                        <th className="p-1.5 border">คอลัมน์ A</th>
                        <th className="p-1.5 border">คอลัมน์ B</th>
                        <th className="p-1.5 border">คอลัมน์ C</th>
                        <th className="p-1.5 border">คอลัมน์ D</th>
                        <th className="p-1.5 border">คอลัมน์ E</th>
                        <th className="p-1.5 border">คอลัมน์ F</th>
                        <th className="p-1.5 border">คอลัมน์ G</th>
                        <th className="p-1.5 border">คอลัมน์ H</th>
                        <th className="p-1.5 border">คอลัมน์ I</th>
                        <th className="p-1.5 border">คอลัมน์ J</th>
                        <th className="p-1.5 border">คอลัมน์ K</th>
                        <th className="p-1.5 border">คอลัมน์ L</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      <tr>
                        <td className="p-1.5 border font-semibold">รหัสสินค้า (id)</td>
                        <td className="p-1.5 border font-semibold">ชื่อสินค้า (name)</td>
                        <td className="p-1.5 border font-semibold">คงเหลือ (currentStock)</td>
                        <td className="p-1.5 border font-semibold">ขั้นต่ำเตือน (minStock)</td>
                        <td className="p-1.5 border font-semibold">ตำแหน่งจัดเก็บ (location)</td>
                        <td className="p-1.5 border font-semibold">ราคาขาย (price)</td>
                        <td className="p-1.5 border font-semibold">ราคาทุน (costPrice)</td>
                        <td className="p-1.5 border font-semibold">หน่วยนับ (unit)</td>
                        <td className="p-1.5 border font-semibold">หมวดหมู่ (category)</td>
                        <td className="p-1.5 border font-semibold">ขายสะสม (totalSold)</td>
                        <td className="p-1.5 border font-semibold">อัปเดตล่าสุด</td>
                        <td className="p-1.5 border font-semibold text-emerald-800">บาร์โค้ด (barcode)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>แผ่นงานที่ 2: ชื่อแท็บ <code>Transactions</code> (ประวัติรับเข้า-จ่ายออก)</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border border-slate-200 bg-white">
                    <thead className="bg-blue-900 text-white">
                      <tr>
                        <th className="p-1.5 border">คอลัมน์ A</th>
                        <th className="p-1.5 border">คอลัมน์ B</th>
                        <th className="p-1.5 border">คอลัมน์ C</th>
                        <th className="p-1.5 border">คอลัมน์ D</th>
                        <th className="p-1.5 border">คอลัมน์ E</th>
                        <th className="p-1.5 border">คอลัมน์ F</th>
                        <th className="p-1.5 border">คอลัมน์ G</th>
                        <th className="p-1.5 border">คอลัมน์ H</th>
                        <th className="p-1.5 border">คอลัมน์ I</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      <tr>
                        <td className="p-1.5 border font-semibold">รหัสบันทึก (id)</td>
                        <td className="p-1.5 border font-semibold">วันเวลา (timestamp)</td>
                        <td className="p-1.5 border font-semibold">รหัสสินค้า</td>
                        <td className="p-1.5 border font-semibold">ชื่อสินค้า</td>
                        <td className="p-1.5 border font-semibold">ประเภท (IN/OUT)</td>
                        <td className="p-1.5 border font-semibold">จำนวน</td>
                        <td className="p-1.5 border font-semibold">คงเหลือก่อนหน้า</td>
                        <td className="p-1.5 border font-semibold">คงเหลือใหม่</td>
                        <td className="p-1.5 border font-semibold">หมายเหตุ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-500">
                  * หมายเหตุ: คุณไม่ต้องสร้างหัวตารางเองด้วยมือ เพียงรันฟังก์ชัน <code>setupSheets()</code> ใน Apps Script ระบบจะสร้างแท็บและหัวตารางให้ทันที!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs"
          >
            ปิด
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
