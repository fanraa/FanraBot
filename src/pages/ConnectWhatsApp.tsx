import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Smartphone, 
  RefreshCcw, 
  CheckCircle2, 
  Loader2, 
  Info, 
  ShieldAlert, 
  LogOut,
  Phone,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingView } from '../components/LoadingView';

interface ConnectionStatus {
  connected: boolean;
  status: 'disconnected' | 'connecting' | 'qrcode' | 'connected';
  number?: string;
  name?: string;
  connectedAt?: number | null;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return 'Baru saja';
  const totalSecs = Math.floor(ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  if (minutes > 0) parts.push(`${minutes} menit`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} detik`);

  return parts.join(' ');
}

export default function ConnectWhatsApp() {
  const [activeMethod, setActiveMethod] = useState<'qr' | 'pairing'>('qr');
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    status: 'disconnected'
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [uptimeStr, setUptimeStr] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isFetchQrLoading, setIsFetchQrLoading] = useState(false);
  
  const [isConfirmingDisconnect, setIsConfirmingDisconnect] = useState(false);
  const [qrCooldown, setQrCooldown] = useState(0);

  // QR Code Reload Countdown cooldown effect
  useEffect(() => {
    if (qrCooldown <= 0) return;
    const timer = setInterval(() => {
      setQrCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [qrCooldown]);
  
  // Pairing Code States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isPairingLoading, setIsPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [copiedPairing, setCopiedPairing] = useState(false);

  // Delete Reset Session States
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteStatusMsg, setDeleteStatusMsg] = useState<string | null>(null);

  // Polling Connection Status every 3 seconds
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        if (res.ok && isMounted) {
          const data: ConnectionStatus = await res.json();
          setStatus(data);
          // If already connected, reset any loading qr/pairing states
          if (data.connected) {
            setQrCodeData(null);
            setPairingCode(null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch WhatsApp connection status:', err);
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000); // Poll status every 3 seconds for fast real-time updates
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Update connection active timer live
  useEffect(() => {
    if (!status.connected || !status.connectedAt) {
      setUptimeStr('');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = now - status.connectedAt!;
      setUptimeStr(formatDuration(diffMs));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status.connected, status.connectedAt]);

  // Fetch QR Code from Backend
  const handleFetchQR = async () => {
    setIsFetchQrLoading(true);
    setQrError(null);
    try {
      const res = await fetch('/api/whatsapp/qr');
      if (res.ok) {
        const data = await res.json();
        setQrCodeData(data.qr);
      } else {
        const errData = await res.json();
        setQrError(errData.error || 'QR belum dibuat oleh Baileys. Silakan tunggu beberapa detik...');
      }
    } catch (err: any) {
      setQrError('Gagal terhubung ke modul backend. Pastikan server aktif.');
    } finally {
      setIsFetchQrLoading(false);
    }
  };

  // Poll QR automatically if user switches to QR and is not connected
  useEffect(() => {
    if (activeMethod !== 'qr' || status.connected) return;

    let isMounted = true;
    const pollQR = async () => {
      try {
        const res = await fetch('/api/whatsapp/qr');
        if (res.ok && isMounted) {
          const data = await res.json();
          setQrCodeData(data.qr);
          setQrError(null);
        } else if (isMounted) {
          const errData = await res.json();
          // Filter out the normal startup delay message to avoid showing annoying warnings, keep it in loading state instead
          if (errData.error && errData.error.includes('belum dibuat')) {
            setQrError(null);
          } else if (!qrCodeData) {
            setQrError(errData.error || 'Engine Baileys sedang memuat...');
          }
        }
      } catch (err) {
        if (isMounted && !qrCodeData) {
          setQrError('Gagal terhubung ke modul backend.');
        }
      }
    };

    pollQR();
    const interval = setInterval(pollQR, 3000); // Check and keep QR updated every 3 seconds for fast real-time synchronization

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeMethod, status.connected, qrCodeData === null]);

  // Request Pairing Code
  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setIsPairingLoading(true);
    setPairingError(null);
    setPairingCode(null);

    try {
      const res = await fetch('/api/whatsapp/pairing-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      });
      
      const data = await res.json();
      if (res.ok) {
        setPairingCode(data.code);
      } else {
        setPairingError(data.error || 'Gagal menghasilkan pairing code.');
      }
    } catch (err) {
      setPairingError('Gagal membuat request kode pairing.');
    } finally {
      setIsPairingLoading(false);
    }
  };

  // Logout / Disconnect Device
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/whatsapp/logout', {
        method: 'POST'
      });
      if (res.ok) {
        setStatus({ connected: false, status: 'disconnected' });
        setQrCodeData(null);
        setPairingCode(null);
        setPhoneNumber('');
        setIsConfirmingDisconnect(false);
      } else {
        alert('Gagal melakukan proses logout dari server.');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCopyPairingCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopiedPairing(true);
    setTimeout(() => setCopiedPairing(false), 2000);
  };

  const handleDeleteSession = async () => {
    setIsDeletingSession(true);
    setDeleteStatusMsg(null);
    try {
      const res = await fetch('/api/whatsapp/session', {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeleteStatusMsg("Session berhasil dihapus. Silakan connect ulang dengan QR atau pairing code.");
        setQrCodeData(null);
        setPairingCode(null);
        setPhoneNumber('');
        setIsConfirmingDelete(false);
        // Force refresh connection status immediately
        const statusRes = await fetch('/api/whatsapp/status');
        if (statusRes.ok) {
          const data = await statusRes.json();
          setStatus(data);
        }
      } else {
        const errData = await res.json();
        setDeleteStatusMsg(`Gagal menghapus session: ${errData.error || 'Server error'}`);
      }
    } catch (err: any) {
      setDeleteStatusMsg(`Error menghubungi server: ${err.message || err}`);
    } finally {
      setIsDeletingSession(false);
    }
  };

  if (isInitialLoading) {
    return <LoadingView message="Memeriksa Status Koneksi..." />;
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto pb-44 md:pb-24 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-on-surface text-left">Hubunakan WhatsApp</h1>
          <p className="text-xs md:text-sm text-on-surface-muted opacity-80 text-left">
            Hubungkan akun WhatsApp asli Anda ke engine Baileys server untuk memproses pesan otomatis.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status.connected ? (
          // CONNECTED DASHBOARD PANELS
          <motion.div
            key="connected-panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-outline rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-outline/40">
              <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 relative">
                  <svg className="w-9 h-9 text-emerald-600 fill-current" viewBox="0 0 24 24">
                    <path d="M12.011 2.25c-5.38 0-9.75 4.37-9.75 9.75 0 1.72.446 3.4 1.3 4.88L2.25 21.75l5.02-1.31c1.438.79 3.05 1.21 4.74 1.21 5.38 0 9.75-4.37 9.75-9.75s-4.37-9.75-9.75-9.75zm0 17.85c-1.48 0-2.93-.4-4.18-1.15l-.3-.18-3.1.81.82-3.02-.2-.31a8.03 8.03 0 01-1.24-4.3c0-4.44 3.62-8.06 8.06-8.06s8.06 3.62 8.06 8.06-3.62 8.06-8.06 8.06zm4.56-6.19c-.25-.13-1.48-.73-1.71-.81-.23-.08-.4-.13-.57.13-.17.25-.66.81-.81.99-.15.17-.3.19-.55.07a6.93 6.93 0 01-2.04-1.26 7.64 7.64 0 01-1.41-1.75c-.15-.25-.02-.39.11-.52.12-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.88-.2-.5-.42-.43-.57-.43h-.49c-.17 0-.45.06-.68.31s-.89.87-.89 2.12c0 1.25.91 2.46 1.03 2.63.13.17 1.79 2.74 4.34 3.84.61.26 1.08.42 1.45.54.62.2 1.18.17 1.63.1.5-.07 1.48-.6 1.69-1.18.2-.58.2-1.09.14-1.18-.06-.1-.23-.15-.48-.28z"/>
                  </svg>
                  <span className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-emerald-500 rounded-full border-4 border-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    Tersambung
                  </h3>
                  {uptimeStr && (
                    <p className="text-[11px] text-on-surface-muted font-medium mt-0.5">
                      Online selama: <span className="font-semibold text-emerald-600">{uptimeStr}</span>
                    </p>
                  )}
                </div>
              </div>
              {isConfirmingDisconnect ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleLogout}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm shadow-red-200 uppercase tracking-wider"
                  >
                    Ya, Putuskan
                  </button>
                  <button
                    onClick={() => setIsConfirmingDisconnect(false)}
                    className="px-3.5 py-1.5 bg-surface-muted hover:bg-surface-subtle border border-outline/60 text-on-surface rounded-lg font-bold text-xs transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingDisconnect(true)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-red-100/50 cursor-pointer uppercase tracking-wider shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Putuskan
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-surface-muted/50 border border-outline/40 rounded-2xl space-y-1 text-left">
                <span className="text-[10px] font-bold text-on-surface-muted uppercase tracking-wider">No HP WhatsApp</span>
                <p className="text-sm font-bold text-on-surface font-mono">+{status.number || 'N/A'}</p>
              </div>
              <div className="p-5 bg-surface-muted/50 border border-outline/40 rounded-2xl space-y-1 text-left">
                <span className="text-[10px] font-bold text-on-surface-muted uppercase tracking-wider">Nama Perangkat Sesi</span>
                <p className="text-sm font-bold text-primary">{status.name || 'WhatsApp Multi-Device'}</p>
              </div>
            </div>

            <div className="p-4 bg-green-50/40 border border-green-200/40 rounded-2xl text-left">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-green-900 uppercase tracking-wider">OTOMATISASI AKTIF</p>
                <p className="text-[11px] text-green-800 leading-relaxed font-semibold">
                  WhatsApp terhubung ke server FanraBot. Semua pesan masuk yang membutuhkan respon AI akan dijawab secara instan.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          // DISCONNECTED / CONNECTING WIZARD
          <motion.div
            key="disconnected-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Method selection tabs */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => {
                  setActiveMethod('qr');
                  setPairingCode(null);
                  setPairingError(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all border outline-none cursor-pointer w-full",
                  activeMethod === 'qr' 
                    ? "bg-white text-emerald-600 border-emerald-500 shadow-sm" 
                    : "bg-surface-muted hover:bg-surface-subtle border-outline/30 text-on-surface-muted hover:text-on-surface"
                )}
              >
                <QrCode className="w-3 h-3" /> QR Code
              </button>
              <button
                onClick={() => {
                  setActiveMethod('pairing');
                  setQrCodeData(null);
                  setQrError(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all border outline-none cursor-pointer w-full",
                  activeMethod === 'pairing' 
                    ? "bg-white text-emerald-600 border-emerald-500 shadow-sm" 
                    : "bg-surface-muted hover:bg-surface-subtle border-outline/30 text-on-surface-muted hover:text-on-surface"
                )}
              >
                <Smartphone className="w-3 h-3" /> Code Pairing
              </button>
            </div>

            {/* Panel Area */}
            {activeMethod === 'qr' ? (
              // 1. QR CODE SCANNING VIEW
              <div className="flex flex-col items-center justify-center space-y-6 w-full">
                {/* Standalone QR Code Display Box */}
                <div className="bg-white border border-outline rounded-xl p-6 shadow-sm max-w-xs w-full text-center space-y-4">
                  <div className="relative p-2 bg-white border border-outline rounded-2xl shadow-inner flex items-center justify-center overflow-hidden w-48 h-48 select-none mx-auto">
                    {(!qrCodeData || isFetchQrLoading) ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-surface-muted/10">
                        {/* Blurred decorative QR box imitation */}
                        <div className="absolute inset-4 opacity-5 filter blur-[3px] grid grid-cols-6 gap-2 pointer-events-none select-none">
                          <div className="border-[6px] border-on-surface w-8 h-8 rounded-sm" />
                          <div className="bg-on-surface w-full h-3" />
                          <div className="bg-on-surface w-full h-5 col-span-2" />
                          <div className="border-[6px] border-on-surface w-8 h-8 rounded-sm col-start-5" />
                          <div className="bg-on-surface w-full h-4" />
                          <div className="bg-on-surface w-full h-2 col-span-3" />
                          <div className="bg-on-surface w-full h-6" />
                          <div className="border-[6px] border-on-surface w-8 h-8 rounded-sm row-start-5 col-start-1" />
                          <div className="bg-on-surface w-full h-3 col-span-4" />
                          <div className="bg-on-surface w-full h-4 col-span-2" />
                        </div>
                        {/* Beautiful real-time centered loader overlay */}
                        <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
                          <div className="relative select-none pointer-events-none">
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-full filter blur-md animate-ping" />
                            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin relative z-10" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest animate-pulse">
                              Generating QR Code
                            </p>
                            <p className="text-[8px] text-on-surface-muted/90 font-medium max-w-[130px] mx-auto leading-relaxed">
                              Engine sedang bersiap... Silakan tunggu sekejap.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={qrCodeData} 
                        alt="WhatsApp Baileys QR Code" 
                        className="w-40 h-40 object-contain animate-fade-in transition-all"
                        onError={() => setQrCodeData(null)}
                      />
                    )}
                  </div>

                  <button
                    onClick={() => {
                      handleFetchQR();
                      setQrCooldown(15);
                    }}
                    disabled={isFetchQrLoading || qrCooldown > 0}
                    className="px-4 py-2 w-full bg-surface-muted hover:bg-surface-subtle border border-outline/40 text-on-surface font-semibold text-[11px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RefreshCcw className={cn("w-3.5 h-3.5", isFetchQrLoading && "animate-spin")} />
                    {qrCooldown > 0 ? `Muat Ulang (${qrCooldown}s)` : 'Muat Ulang QR'}
                  </button>
                </div>

                {/* Separate, transparent and clean instruction details */}
                <div className="space-y-3 max-w-md w-full pt-2 opacity-70 text-center">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Pindai kode QR untuk menghubungkan</h3>
                  
                  <div className="text-[11px] text-on-surface-muted font-medium text-left space-y-1.5 max-w-xs mx-auto">
                    <p><span className="text-emerald-600 font-bold">1.</span> Buka aplikasi WhatsApp di HP Anda.</p>
                    <p><span className="text-emerald-600 font-bold">2.</span> Ketuk <span className="font-bold text-on-surface">Menu</span> atau <span className="font-bold text-on-surface">Pengaturan</span> dan pilih <span className="font-bold text-on-surface">Perangkat Tertaut</span>.</p>
                    <p><span className="text-emerald-600 font-bold">3.</span> Ketuk <span className="font-bold text-on-surface">Tautkan Perangkat</span>.</p>
                    <p><span className="text-emerald-600 font-bold">4.</span> Arahkan kamera HP Anda ke layar ini untuk memindai kode QR di samping.</p>
                  </div>

                  {qrError && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200/50 text-amber-900 rounded-lg text-[10px] font-medium leading-relaxed max-w-xs mx-auto text-center mt-2">
                      ⚠️ Hub memproses: {qrError}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 2. CODE PAIRING VIEW (Completely outside card container boxes, layout matching requested format)
              <div className="max-w-md mx-auto py-4 space-y-5 flex flex-col items-center w-full">
                {!pairingCode ? (
                  <form onSubmit={handleRequestPairingCode} className="w-full space-y-5 text-center">
                    {/* Official Green WhatsApp Circle Logo */}
                    <div className="mx-auto w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-md shadow-emerald-200/50">
                      <svg className="w-10 h-10 text-white fill-current" viewBox="0 0 24 24">
                        <path d="M12.011 2.25c-5.38 0-9.75 4.37-9.75 9.75 0 1.72.446 3.4 1.3 4.88L2.25 21.75l5.02-1.31c1.438.79 3.05 1.21 4.74 1.21 5.38 0 9.75-4.37 9.75-9.75s-4.37-9.75-9.75-9.75zm0 17.85c-1.48 0-2.93-.4-4.18-1.15l-.3-.18-3.1.81.82-3.02-.2-.31a8.03 8.03 0 01-1.24-4.3c0-4.44 3.62-8.06 8.06-8.06s8.06 3.62 8.06 8.06-3.62 8.06-8.06 8.06zm4.56-6.19c-.25-.13-1.48-.73-1.71-.81-.23-.08-.4-.13-.57.13-.17.25-.66.81-.81.99-.15.17-.3.19-.55.07a6.93 6.93 0 01-2.04-1.26 7.64 7.64 0 01-1.41-1.75c-.15-.25-.02-.39.11-.52.12-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.88-.2-.5-.42-.43-.57-.43h-.49c-.17 0-.45.06-.68.31s-.89.87-.89 2.12c0 1.25.91 2.46 1.03 2.63.13.17 1.79 2.74 4.34 3.84.61.26 1.08.42 1.45.54.62.2 1.18.17 1.63.1.5-.07 1.48-.6 1.69-1.18.2-.58.2-1.09.14-1.18-.06-.1-.23-.15-.48-.28z"/>
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-on-surface tracking-tight">Tautkan dengan Code Pairing</h3>
                      <p className="text-[11px] text-on-surface-muted/90 max-w-xs mx-auto font-medium">Masukkan nomor ponsel WhatsApp yang ingin ditautkan.</p>
                    </div>

                    <div className="space-y-1.5 text-left max-w-sm mx-auto w-full">
                      <label className="text-[10px] font-bold text-on-surface-muted uppercase tracking-wider ml-1">Nomor WhatsApp HP Anda</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center font-bold text-sm text-on-surface">
                          +
                        </span>
                        <input 
                          type="text"
                          placeholder="628123456789"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-8 pr-12 py-2.5 bg-surface-muted border border-outline rounded-lg outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold tracking-wider"
                        />
                        <Phone className="w-4 h-4 text-on-surface-muted absolute right-4 top-1/2 -translate-y-1/2 opacity-75" />
                      </div>
                      <p className="text-[10px] text-on-surface-muted/80 pl-1 leading-relaxed">
                        Gunakan format nomor internasional langsung tanpa tanda "+" atau spasi (contoh: 6281234xxxx).
                      </p>
                    </div>

                    {pairingError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold max-w-sm mx-auto w-full">
                        ✗ {pairingError}
                      </div>
                    )}

                    <div className="max-w-sm mx-auto w-full">
                      <button
                        type="submit"
                        disabled={isPairingLoading || !phoneNumber}
                        className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1ca34e] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-emerald-200/50 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isPairingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hubungkan & Minta Kode'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="w-full space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-base font-bold text-on-surface tracking-tight">Ketikkan Kode Pairing di HP Anda</h3>
                      <p className="text-xs text-on-surface-muted leading-relaxed max-w-sm mx-auto">
                        Buka navigasi perangkat tertaut WhatsApp di HP <span className="text-emerald-600 font-bold">+{phoneNumber}</span>, klik <span className="font-bold text-on-surface">Tautkan Perangkat</span> lalu pilih <span className="text-emerald-600 font-bold">Hubungkan dengan Nomor Telepon</span>, dan masukkan kode ini:
                      </p>
                    </div>

                    <div className="flex justify-center gap-1.5 max-w-xs mx-auto">
                      {pairingCode.replace('-', '').split('').map((char, i) => (
                        <div 
                          key={i} 
                          className="w-8 h-12 border border-outline rounded-lg bg-white shadow-sm flex items-center justify-center text-lg font-black text-emerald-600 font-mono select-all hover:bg-surface-muted transition-colors"
                        >
                          {char}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={handleCopyPairingCode}
                        className="px-4 py-1.5 bg-surface-muted border border-outline hover:bg-surface-subtle transition-all rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-on-surface cursor-pointer"
                      >
                        {copiedPairing ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPairing ? 'Kode Disalin!' : 'Salin Kode Pairing'}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setPairingCode(null);
                      }}
                      className="w-full max-w-sm mx-auto block py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-600 transition-all text-center cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Section Danger Zone / Reset Session */}
            <div className="mt-8 pt-6 border-t border-red-100 bg-red-50/20 p-5 rounded-2xl text-left space-y-4">
              <div>
                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">Troubleshooting / Reset Sesi</h4>
                <p className="text-[11px] text-on-surface-muted mt-1 leading-relaxed">
                  Jika koneksi WhatsApp stagnan, stuck, tidak stabil, atau berkali-kali gagal menyambung, Anda dapat menghapus data sesi server dan database secara bersih untuk memulai ulang.
                </p>
              </div>

              {deleteStatusMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold leading-relaxed">
                  {deleteStatusMsg}
                </div>
              )}

              {isConfirmingDelete ? (
                <div className="bg-white border border-red-200 p-4 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-red-800 leading-normal">
                    ⚠️ Yakin hapus session WhatsApp? Bot akan logout dan perlu scan QR/pairing ulang.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteSession}
                      disabled={isDeletingSession}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      {isDeletingSession ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ya, Hapus Sesi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isDeletingSession}
                      className="px-4 py-2 bg-surface-muted hover:bg-surface-subtle border border-outline text-on-surface rounded-lg font-bold text-xs transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmingDelete(true);
                    setDeleteStatusMsg(null);
                  }}
                  className="px-4 py-2 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shadow-sm"
                >
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  Hapus Session WhatsApp
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
