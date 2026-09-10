import React, { useState, useEffect } from 'react';
import { 
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  Save,
  RefreshCcw,
  ArrowRight,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LoadingView } from '../components/LoadingView';

interface Provider {
  id: string;
  name: string;
  status: 'connected' | 'error' | 'idle';
  apiKey: string;
  lastValidated: string;
  logo?: string;
  errorMessage?: string;
}

const DEFAULT_LOGOS: Record<string, string> = {
  gemini: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg/960px-Google_Gemini_icon_2025.svg.png",
  groq: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/groq.png",
  openai: "https://tse3.mm.bing.net/th/id/OIP.LmUVYFEdQNlbiVJULP0qnwHaHh?pid=Api&h=220&P=0",
  anthropic: "https://tse3.mm.bing.net/th/id/OIP.ipQPNdScfLIsMp8_-r14qQHaHa?pid=Api&h=220&P=0",
  deepseek: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png",
  kimi: "https://statics.moonshot.cn/kimi-chat/favicon.ico"
};

const PROVIDER_API_URLS: Record<string, string> = {
  gemini: "https://aistudio.google.com/app/apikey",
  groq: "https://console.groq.com/keys",
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://console.anthropic.com/settings/keys",
  deepseek: "https://platform.deepseek.com/api_keys",
  kimi: "https://platform.moonshot.cn/console/api-keys"
};

export default function AIProviderPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedGroqModel, setSelectedGroqModel] = useState<string>('llama-3.1-8b-instant');
  
  // 2-Step delete confirmation state per provider
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteTimeout, setDeleteTimeout] = useState<NodeJS.Timeout | null>(null);

  // Floating slide-down alert notification state (notif atas turun kebawah)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
    return () => {
      if (deleteTimeout) clearTimeout(deleteTimeout);
    };
  }, []);

  const getFormattedNow = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const showNotification = (type: 'success' | 'error', title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: `${title}: ${message}`, type }
    }));
  };

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
        
        // Initialize editing keys with actual values
        const initialKeys: Record<string, string> = {};
        (data.providers || []).forEach((p: Provider) => {
          initialKeys[p.id] = p.apiKey || '';
        });
        setEditingKeys(initialKeys);
      }
    } catch (err) {
      console.error('Error loading AI provider config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyChange = (id: string, value: string) => {
    setEditingKeys(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    const key = editingKeys[id] || '';
    
    if (key.trim()) {
      const duplicateFound = providers.some(p => p.id !== id && p.apiKey && p.apiKey.trim() === key.trim());
      if (duplicateFound) {
        showNotification('error', 'Duplikasi Terdeteksi', 'Kunci API ini sudah didaftarkan pada provider lain. Harap gunakan kunci yang unik untuk setiap provider.');
        setTestingId(null);
        return;
      }
    }
    
    try {
      const res = await fetch('/api/whatsapp/test-provider-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ providerId: id, apiKey: key, model: id === 'groq' ? selectedGroqModel : undefined })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', 'Validasi Berhasil', data.message || 'API Key valid dan terkoneksi.');
      } else {
        showNotification('error', 'Validasi Gagal', data.error || 'API Key tidak valid, kuota habis atau kedaluwarsa.');
      }
    } catch (err: any) {
      console.error('Error testing connection:', err);
      showNotification('error', 'Koneksi Error', 'Gagal menghubungi server verifikasi.');
    } finally {
      setTestingId(null);
    }
  };

  const handleSaveProvider = async (id: string) => {
    if (savingId || testingId || deletingId) return;
    setSavingId(id);
    try {
      const key = editingKeys[id] || '';
      
      if (key.trim()) {
        const duplicateFound = providers.some(p => p.id !== id && p.apiKey && p.apiKey.trim() === key.trim());
        if (duplicateFound) {
          showNotification('error', 'Duplikasi Terdeteksi', 'Kunci API ini sudah didaftarkan pada provider lain. Harap gunakan kunci yang unik untuk setiap provider.');
          setSavingId(null);
          return;
        }
      }

      const nowStr = getFormattedNow();
      const updatedProviders = providers.map(p => {
        if (p.id === id) {
          return {
            ...p,
            apiKey: key,
            status: (key.trim().length > 10 ? 'connected' : 'idle') as any,
            lastValidated: key.trim().length > 10 ? nowStr : '-'
          };
        }
        return p;
      });

      // Fetch the rest of the config to preserve them
      const resGet = await fetch('/api/whatsapp/config');
      const currentConfig = resGet.ok ? await resGet.json() : {};

      const newConfig = {
        ...currentConfig,
        providers: updatedProviders
      };

      const resPost = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });

      if (resPost.ok) {
        setProviders(updatedProviders);
        showNotification('success', 'Tersimpan', `API Key ${id.toUpperCase()} berhasil disimpan.`);
        setExpandedId(null);
      } else {
        showNotification('error', 'Gagal', 'Terjadi kesalahan sistem saat menyimpan konfigurasi.');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      showNotification('error', 'Error', 'Gagal menyimpan konfigurasi.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteProviderKey = async (id: string) => {
    if (savingId || testingId || deletingId) return;
    // 2-Step Delete Verification
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      if (deleteTimeout) clearTimeout(deleteTimeout);
      
      const timer = setTimeout(() => {
        setDeleteConfirmId(null);
      }, 4000); // Reset confirmation if user didn't click again in 4s
      setDeleteTimeout(timer);
      return;
    }

    // Double confirmation matched - perform destruction
    setDeleteConfirmId(null);
    if (deleteTimeout) clearTimeout(deleteTimeout);
    
    setDeletingId(id);
    try {
      setEditingKeys(prev => ({
        ...prev,
        [id]: ''
      }));

      const updatedProviders = providers.map(p => {
        if (p.id === id) {
          return {
            ...p,
            apiKey: '',
            status: 'idle' as any,
            lastValidated: '-'
          };
        }
        return p;
      });

      const resGet = await fetch('/api/whatsapp/config');
      const currentConfig = resGet.ok ? await resGet.json() : {};

      const newConfig = {
        ...currentConfig,
        providers: updatedProviders
      };

      const resPost = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });

      if (resPost.ok) {
        setProviders(updatedProviders);
        showNotification('success', 'Kunci Dihapus', `API Key ${id.toUpperCase()} berhasil dikosongkan.`);
      } else {
        showNotification('error', 'Gagal', 'Terjadi kesalahan menghapus API Key.');
      }
    } catch (err) {
      console.error('Error deleting provider Key:', err);
      showNotification('error', 'Error', 'Gagal menghapus API Key.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && providers.length === 0) {
    return <LoadingView message="Memuat Konfigurasi..." />;
  }

  return (
    <div className="min-h-full bg-slate-50/50 flex flex-col relative">

      {/* Header Full Width */}
      <div className="bg-white border-b border-outline px-4 py-6 md:px-8">
        <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-black text-on-surface tracking-tight font-brand">
                AI Provider
              </h1>
              <p className="text-[11px] font-semibold text-on-surface-muted opacity-80 mt-0.5">Kelola API Key kecerdasan buatan Anda langsung ke Baileys.</p>
            </div>
            <div className="inline-flex self-start md:self-auto text-[9px] font-bold text-on-surface-muted bg-slate-150 px-2.5 py-1 rounded-md select-none bg-slate-100 shrink-0">
              🛡️ Enkripsi AES-256 Aman
            </div>
          </div>


        </div>
      </div>

      {/* Main Content Area dengan PB-40 agar tidak tertutup bottom navbar */}
      <div className="flex-1 w-full p-4 md:p-8 pb-40">
        <div className="max-w-7xl mx-auto">
          
          <div className="space-y-6">
            
            {/* Row Atas: Card List of Providers (Full Width!) */}
            <div className="space-y-4 w-full">
              {providers.map((provider) => {
                const isExpanded = expandedId === provider.id;
                const isTesting = testingId === provider.id;
                const isSaving = savingId === provider.id;
                const isDeleting = deletingId === provider.id;
                const isConfirming = deleteConfirmId === provider.id;
                const logo = DEFAULT_LOGOS[provider.id] || DEFAULT_LOGOS.gemini;
                const currentKeyVal = editingKeys[provider.id] || '';
                const isKeyVisible = !!visibleKeys[provider.id];

                return (
                  <div 
                    key={provider.id}
                    className={cn(
                      "group bg-white border border-outline rounded-xl transition-all duration-300 overflow-hidden",
                      isExpanded ? "ring-2 ring-primary/5 border-primary shadow-md" : "hover:shadow-sm hover:border-outline-variant"
                    )}
                  >
                    {/* Card Header (Clickable & Compact) */}
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : provider.id)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-outline/30 p-1.5 shadow-sm group-hover:scale-105 transition-transform">
                          <img src={logo} alt={provider.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-brand font-black text-xs text-on-surface tracking-tight">{provider.name}</h3>
                            <a 
                              href={PROVIDER_API_URLS[provider.id] || "https://aistudio.google.com/"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded text-primary hover:bg-primary/5 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                              title={`Dapatkan API Key ${provider.name}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          </div>
                          <p className="text-[9px] font-bold text-on-surface-muted uppercase tracking-widest mt-0.5">
                            {provider.id === 'gemini' ? 'Google AI' : 'LLM Provider'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {provider.status === 'error' && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-[9px] font-black uppercase tracking-wider animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            GANGGUAN
                          </div>
                        )}
                        {provider.status === 'connected' && !isExpanded && (
                          <div className="flex items-center px-2 py-0.5 bg-green-50 text-green-600 border border-green-500/10 rounded-md text-[9px] font-black uppercase tracking-wider">
                            ✓ AKTIF
                          </div>
                        )}
                        <ChevronRight className={cn(
                          "w-4 h-4 text-on-surface-muted transition-transform duration-300",
                          isExpanded && "rotate-90 text-primary"
                        )} />
                      </div>
                    </div>

                    {/* Expandable Content - Responsive & Compact layout */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-outline/50"
                        >
                          <div className="p-4 md:p-6 space-y-4 bg-slate-50/30">
                            
                            {/* Input Area */}
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-on-surface-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
                                API KEY {provider.name}
                              </label>
                              
                              <div className="relative flex items-center">
                                <input 
                                  type={isKeyVisible ? "text" : "password"} 
                                  value={currentKeyVal}
                                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                                  placeholder={provider.id === 'gemini' ? "🔑 Menggunakan kunci server (.env) atau ketik disini" : "Masukkan API Key asli Anda"}
                                  className="w-full pl-3 pr-10 py-2 bg-white border border-outline rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all text-xs outline-none font-mono placeholder:text-on-surface-muted/30"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleKeyVisibility(provider.id);
                                  }}
                                  className="absolute right-3 p-1.5 text-on-surface-muted hover:text-primary rounded-md transition-all cursor-pointer flex items-center justify-center pointer-events-auto"
                                  title={isKeyVisible ? "Sembunyikan" : "Tampilkan"}
                                >
                                  {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              <p className="text-[9px] text-on-surface-muted font-bold opacity-75">
                                Kunci dienkripsi asimetris di server internal.
                              </p>
                            </div>

                            {provider.id === 'groq' && (
                              <div className="space-y-1.5 pt-1">
                                <label className="text-[9px] font-black text-on-surface-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
                                  Model Uji Koneksi / Utama
                                </label>
                                <select
                                  value={selectedGroqModel}
                                  onChange={(e: any) => setSelectedGroqModel(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-outline rounded-lg text-xs font-semibold focus:ring-2 focus:ring-primary/10 transition-all focus:border-primary outline-none cursor-pointer"
                                >
                                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Hemat / Rekomendasi) - llama-3.1-8b-instant</option>
                                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Kuat / Akurat) - llama-3.3-70b-versatile</option>
                                </select>
                                <p className="text-[9px] text-on-surface-muted leading-relaxed">
                                  Sesuai kebijakan Groq baru, model lama <code className="font-mono bg-rose-50 px-1 rounded text-red-600">llama3-8b-8192</code> telah di-decommissioned.
                                </p>
                              </div>
                            )}

                            {/* Status Validasi Tanpa Kelap-kelip */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[9px] font-bold text-on-surface-muted uppercase tracking-wider">
                                Validasi Terakhir: {provider.lastValidated}
                              </span>
                            </div>

                            {/* Diagnostics Alert for Billing or Setup Errors */}
                            {provider.status === 'error' && provider.errorMessage && (
                              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-[11px] font-medium leading-relaxed flex flex-col gap-1 select-text">
                                <p className="font-black text-[9px] uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  Detail Gangguan
                                </p>
                                <span className="break-words font-mono text-[10px] bg-rose-100/35 p-1.5 rounded border border-rose-200/50">
                                  {provider.errorMessage}
                                </span>
                              </div>
                            )}

                            {/* Ramping Action Buttons - Stacked Vertically on Mobile & Desktop for precise layout size */}
                            <div className="flex flex-col gap-1.5 w-full pt-1.5">
                              {currentKeyVal && (
                                <button
                                  onClick={() => handleDeleteProviderKey(provider.id)}
                                  disabled={isDeleting || isSaving || isTesting}
                                  className={cn(
                                    "w-full py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 select-none cursor-pointer text-center flex items-center justify-center gap-1.5 border h-9",
                                    isConfirming 
                                      ? "bg-rose-600 text-white border-rose-600 animate-pulse" 
                                      : "bg-rose-50 text-rose-600 border-rose-150 hover:bg-rose-100 border-rose-100"
                                  )}
                                >
                                  {isDeleting ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      MEMPROSES...
                                    </>
                                  ) : isConfirming ? (
                                    "Yakin? Klik Sekali Lagi untuk Hapus"
                                  ) : (
                                    <>
                                      <Trash2 className="w-3.5 h-3.5" />
                                      HAPUS KUNCI
                                    </>
                                  )}
                                </button>
                              )}
                              
                              <button 
                                onClick={() => handleTestConnection(provider.id)}
                                disabled={isTesting || isSaving || isDeleting || (!currentKeyVal && provider.id !== 'gemini')}
                                className="w-full h-9 py-2 px-3 bg-white border border-outline hover:bg-slate-50 text-on-surface text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {isTesting ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    MENCOBA KONEKSI...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCcw className="w-3.5 h-3.5" />
                                    TES KONEKSI
                                  </>
                                )}
                              </button>

                              <button 
                                onClick={() => handleSaveProvider(provider.id)}
                                disabled={isSaving || isTesting || isDeleting || (!currentKeyVal && provider.id !== 'gemini')}
                                className="w-full h-9 py-2 px-3 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-primary/95 transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    MENYIMPAN...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5" />
                                    SIMPAN KUNCI
                                  </>
                                )}
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Row Bawah: Info & Rekomendasi (Full Width grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-2">
              
              {/* Recommendation Card */}
              <div className="bg-primary text-white border border-primary rounded-xl p-6 relative overflow-hidden flex flex-col min-h-[220px]">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-1 text-white/70 font-black text-[8px] uppercase tracking-[0.2em] select-none">
                    🔥 Rekomendasi
                  </div>
                  <h3 className="text-lg font-black leading-tight tracking-tight font-brand">Kehabisan kuota gratis Gemini?</h3>
                  <p className="text-white/80 text-[11px] leading-relaxed font-semibold">
                    FanraBot merekomendasikan <span className="text-white underline underline-offset-4 decoration-white/30">OpenRouter</span> untuk alternatif ribuan model AI dengan satu top-up saldo stabil.
                  </p>
                </div>
                <div className="mt-auto pt-4 relative z-10">
                  <a 
                    href="https://openrouter.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-white text-primary font-black rounded-lg hover:bg-white/95 transition-all shadow-md text-[9px] uppercase tracking-wider text-center block"
                  >
                    AKSES OPENROUTER
                  </a>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* Bantuan Setup Card */}
              <div className="bg-white border border-outline rounded-xl p-6 space-y-4 shadow-sm">
                <h4 className="text-[9px] font-black text-on-surface-muted uppercase tracking-[0.15em] flex items-center gap-1.5 select-none text-primary font-brand">
                  <HelpCircle className="w-3.5 h-3.5 text-primary" /> Setup Cepat
                </h4>
                <ul className="space-y-3">
                  {[
                    "Kunjungi dashboard provider AI Anda.",
                    "Generate API Key baru dengan izin baca.",
                    "Paste key ke kolom di samping.",
                    "Klik simpan untuk mengaktifkan AI."
                  ].map((text, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="text-xs font-black text-primary shrink-0 min-w-[14px]">
                        {i + 1}.
                      </span>
                      <p className="text-[11px] font-semibold text-on-surface-muted leading-snug">{text}</p>
                    </li>
                  ))}
                </ul>
              </div>
              
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
