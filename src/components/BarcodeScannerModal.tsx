import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  X, 
  Zap, 
  ZapOff, 
  SwitchCamera, 
  Keyboard, 
  AlertCircle, 
  ScanLine, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  description?: string;
}

// Play pleasant scan beep using Web Audio API
function playBeepSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08); // A6 chirp

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    // Audio might be muted or not allowed
  }
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'สแกนบาร์โค้ดสินค้า',
  description = 'หันกล้องไปที่บาร์โค้ดสินค้าให้อยู่ในกรอบเพื่อสแกน',
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerIdRef = useRef(`html5-barcode-reader-${Math.random().toString(36).substring(7)}`);
  const isScanningRef = useRef(false);

  // Stop current active scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (isScanningRef.current) {
          await scannerRef.current.stop();
          isScanningRef.current = false;
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
  }, []);

  // Handle successful scan
  const handleSuccessScan = useCallback(
    (decodedText: string) => {
      if (!decodedText || scannedFeedback) return;

      playBeepSound();
      if (navigator.vibrate) {
        navigator.vibrate([40, 30, 80]);
      }

      setScannedFeedback(decodedText);
      setTimeout(() => {
        onScan(decodedText.trim());
        onClose();
      }, 400);
    },
    [onScan, onClose, scannedFeedback]
  );

  // Start scanning with selected or default rear camera
  const startScanner = useCallback(
    async (cameraId?: string) => {
      setIsStarting(true);
      setErrorMsg(null);
      setScannedFeedback(null);

      try {
        await stopScanner();

        // Check DOM element
        const readerElement = document.getElementById(readerIdRef.current);
        if (!readerElement) {
          setIsStarting(false);
          return;
        }

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        const html5QrCode = new Html5Qrcode(readerIdRef.current, {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        // Discover cameras
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
          }
        } catch (e) {
          console.warn('Could not enumerate cameras:', e);
        }

        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: 'environment' };

        const qrCodeSuccessCallback = (decodedText: string) => {
          handleSuccessScan(decodedText);
        };

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 160 }, // optimized rectangular aspect for linear barcodes
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          cameraConfig,
          config,
          qrCodeSuccessCallback,
          () => {} // silent on frame without barcode
        );

        isScanningRef.current = true;
        setIsStarting(false);

        // Check if torch / flashlight is supported
        try {
          const capabilities = (html5QrCode as any).getRunningTrackCapabilities?.();
          if (capabilities && 'torch' in capabilities) {
            setHasTorch(true);
          }
        } catch {
          // torch check not critical
        }
      } catch (err: any) {
        console.error('Failed to start barcode scanner:', err);
        setIsStarting(false);
        const msg = err?.message || String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setErrorMsg('กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์เพื่อใช้สแกนบาร์โค้ด');
        } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
          setErrorMsg('ไม่พบอุปกรณ์กล้องบนอุปกรณ์นี้ คุณสามารถพิมพ์รหัสบาร์โค้ดได้ที่แถบด้านล่าง');
        } else {
          setErrorMsg('ไม่สามารถเปิดกล้องได้ หรือกล้องกำลังถูกใช้งานโดยแอปอื่น');
        }
      }
    },
    [handleSuccessScan, stopScanner]
  );

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Could not toggle torch:', err);
    }
  };

  // Switch camera if multiple cameras
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === currentCameraId);
    const nextCamera = cameras[(currentIndex + 1) % cameras.length];
    setCurrentCameraId(nextCamera.id);
    await startScanner(nextCamera.id);
  };

  // Initialize and teardown
  useEffect(() => {
    if (isOpen && !isManualMode) {
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, isManualMode, startScanner, stopScanner]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playBeepSound();
    onScan(manualCode.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 text-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-800">
        {/* Modal Top Bar */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{title}</h3>
              <p className="text-[11px] text-slate-400">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Buttons: Camera vs Manual Input */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => setIsManualMode(false)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              !isManualMode
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>สแกนด้วยกล้อง</span>
          </button>
          <button
            type="button"
            onClick={() => setIsManualMode(true)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              isManualMode
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>พิมพ์รหัสเอง</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto">
          {!isManualMode ? (
            <div className="space-y-3">
              {/* Scanner Viewport Container */}
              <div className="relative w-full aspect-square max-h-[300px] bg-black rounded-2xl overflow-hidden border-2 border-emerald-500/40 flex items-center justify-center shadow-inner">
                {/* HTML5 QR Container */}
                <div
                  id={readerIdRef.current}
                  className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
                />

                {/* Target Frame Overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                  <div className="relative w-full max-w-[260px] h-[140px] border-2 border-emerald-400/80 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br" />

                    {/* Animated Red Laser Scan Line */}
                    <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e] animate-pulse" />
                  </div>
                </div>

                {/* Loading state */}
                {isStarting && !errorMsg && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 z-10">
                    <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                    <span className="text-xs text-slate-300">กำลังเปิดใช้งานกล้อง...</span>
                  </div>
                )}

                {/* Success feedback overlay */}
                {scannedFeedback && (
                  <div className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center gap-2 z-20 animate-in zoom-in-95 duration-150">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    <span className="text-sm font-bold text-white">สแกนสำเร็จ!</span>
                    <span className="text-xs font-mono bg-emerald-800/80 px-2 py-1 rounded text-emerald-200">
                      {scannedFeedback}
                    </span>
                  </div>
                )}

                {/* Error Banner inside Viewport */}
                {errorMsg && (
                  <div className="absolute inset-0 bg-slate-900/95 p-4 flex flex-col items-center justify-center text-center gap-3 z-20">
                    <AlertCircle className="w-8 h-8 text-amber-400 shrink-0" />
                    <p className="text-xs text-slate-200 leading-relaxed max-w-xs">{errorMsg}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startScanner()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>ลองใหม่อีกครั้ง</span>
                      </button>
                      <button
                        onClick={() => setIsManualMode(true)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium"
                      >
                        พิมพ์รหัสเอง
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls (Torch, Switch Camera) */}
              <div className="flex items-center justify-center gap-3 pt-1">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
                      isTorchOn
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {isTorchOn ? <ZapOff className="w-3.5 h-3.5 text-amber-400" /> : <Zap className="w-3.5 h-3.5" />}
                    <span>{isTorchOn ? 'ปิดแฟลช' : 'เปิดแฟลช'}</span>
                  </button>
                )}

                {cameras.length > 1 && (
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span>สลับกล้อง ({cameras.length})</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                รองรับบาร์โค้ด EAN-13, EAN-8, Code 128, UPC และ QR Code
              </p>
            </div>
          ) : (
            /* Manual Input Mode */
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  กรอกรหัสบาร์โค้ดสินค้า (ตัวเลขหรือตัวอักษร):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="เช่น 8850987101018 หรือ P001"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-500"
                  />
                  {manualCode && (
                    <button
                      type="button"
                      onClick={() => setManualCode('')}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  เหมาะสำหรับกรณีที่บาร์โค้ดเลือนราง กล้องอ่านยาก หรือใช้เครื่องสแกนบาร์โค้ดภายนอก
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualMode(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  กลับไปเปิดกล้อง
                </button>
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ตกลงค้นหา</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
