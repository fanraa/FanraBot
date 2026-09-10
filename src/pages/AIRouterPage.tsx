import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  AlertCircle, 
  Settings2,
  Loader2,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  CloudLightning,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LoadingView } from '../components/LoadingView';

// --- Types ---
interface Provider {
  id: string;
  name: string;
  status: 'connected' | 'error' | 'idle';
  apiKey: string;
  lastValidated: string;
  disabled?: boolean;
  errorMessage?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
  event: string;
  provider: string;
  detail: string;
}

interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
  lastUsedAt: string;
}

// --- Constants ---
const DEFAULT_LOGOS: Record<string, string> = {
  gemini: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg/960px-Google_Gemini_icon_2025.svg.png",
  groq: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/groq.png",
  openai: "https://tse3.mm.bing.net/th/id/OIP.LmUVYFEdQNlbiVJULP0qnwHaHh?pid=Api&h=220&P=0",
  anthropic: "https://tse3.mm.bing.net/th/id/OIP.ipQPNdScfLIsMp8_-r14qQHaHa?pid=Api&h=220&P=0",
  deepseek: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png",
  kimi: "https://statics.moonshot.cn/kimi-chat/favicon.ico"
};

// --- Components ---
const CustomToggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
  <button 
    type="button"
    onClick={onToggle}
    className={cn(
      "w-8 h-4 rounded-full transition-all relative p-0.5 shrink-0 cursor-pointer border",
      active ? "bg-primary border-primary" : "bg-slate-200 border-slate-300"
    )}
  >
    <div className={cn(
      "w-3 h-3 rounded-full bg-white transition-all shadow-sm",
      active ? "translate-x-4" : "translate-x-0"
    )} />
  </button>
);

const UsageExpandableCards = ({ usageData, providers }: { usageData: Record<string, ProviderUsage>; providers: Provider[] }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatTokens = (num: number) => {
    if (!num) return '0';
    if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num > 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString('id-ID');
  };

  const getProvIdMap = (id: string) => id === 'anthropic' ? 'claude' : id;

  const validProviders = providers.filter(p => ['gemini', 'groq', 'openai', 'anthropic'].includes(p.id));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-start">
      {validProviders.map(p => {
        const u = usageData[getProvIdMap(p.id)] || { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0, lastUsedAt: '-' };
        const isExpanded = expandedId === p.id;
        
        return (
          <div 
            key={p.id} 
            className="flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-primary/40 transition-colors shadow-sm"
            onClick={() => setExpandedId(isExpanded ? null : p.id)}
          >
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <img src={DEFAULT_LOGOS[p.id]} alt={p.name} className="w-5 h-5 object-contain rounded-sm" />
                <div>
                  <div className="text-[11px] font-bold text-slate-700 leading-tight">{p.name}</div>
                  <div className="text-[9px] text-slate-500 font-medium">{formatTokens(u.totalTokens)} token</div>
                </div>
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-300", isExpanded && "rotate-180 text-primary")} />
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-50 border-t border-slate-100 px-3 py-2.5 text-[9.5px] text-slate-500 space-y-1.5 overflow-hidden"
                >
                  <div className="flex justify-between"><span>Input:</span> <span className="font-semibold text-slate-700">{(u.inputTokens || 0).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between"><span>Output:</span> <span className="font-semibold text-slate-700">{(u.outputTokens || 0).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between"><span>Request:</span> <span className="font-semibold text-slate-700">{(u.requestCount || 0).toLocaleString('id-ID')}x</span></div>
                  <div className="flex justify-between"><span>Aktif:</span> <span className="font-semibold text-slate-700">{u.lastUsedAt !== '-' ? new Date(u.lastUsedAt).toLocaleDateString('id-ID') : '-'}</span></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default function AIRouterPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [usageStats, setUsageStats] = useState<Record<string, ProviderUsage>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Settings State
  const [routerAutoFallbackEnabled, setRouterAutoFallbackEnabled] = useState(true);
  const [routerCostGuardEnabled, setRouterCostGuardEnabled] = useState(true);
  const [routerBlockWhenLimitReached, setRouterBlockWhenLimitReached] = useState(false);
  const [routerDailyTokenLimit, setRouterDailyTokenLimit] = useState(100000);
  const [routerTimeoutMs, setRouterTimeoutMs] = useState(5000);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'warning' | 'error' | 'success' } | null>(null);

  const showToast = (msg: string, type: 'info' | 'warning' | 'error' | 'success' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchConfig();
    fetchLogs();
    fetchUsage();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
        
        const settings = data.settings || {};
        setRouterAutoFallbackEnabled(settings.routerAutoFallbackEnabled !== false);
        setRouterCostGuardEnabled(settings.routerCostGuardEnabled !== false);
        setRouterBlockWhenLimitReached(settings.routerBlockWhenLimitReached === true);
        setRouterDailyTokenLimit(settings.routerDailyTokenLimit || 100000);
        setRouterTimeoutMs(settings.routerTimeoutMs || 5000);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat konfigurasi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/whatsapp/router-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {}
  };

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/whatsapp/router-usage');
      if (res.ok) {
        const data = await res.json();
        setUsageStats(data.providers || {});
      }
    } catch (err) {}
  };

  const autoSaveConfig = async (
    targetProviders: Provider[],
    fallback: boolean,
    costGuard: boolean,
    blockLimit: boolean,
    tokenLimit: number,
    timeout: number
  ) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const resGet = await fetch('/api/whatsapp/config');
      const currentConfig = resGet.ok ? await resGet.json() : {};
      
      const newConfig = {
        ...currentConfig,
        providers: targetProviders,
        settings: {
          ...(currentConfig.settings || {}),
          routerAutoFallbackEnabled: fallback,
          routerCostGuardEnabled: costGuard,
          routerBlockWhenLimitReached: blockLimit,
          routerDailyTokenLimit: tokenLimit,
          routerTimeoutMs: timeout,
          autoFallback: fallback, // sync backward compat
          isAutoFallback: fallback
        }
      };

      await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      showToast('Pengaturan router tersimpan.', 'success');
    } catch (err) {
      showToast('Gagal menyimpan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const activeWorking = providers.filter(p => (p.apiKey && p.apiKey.trim().length > 10) && !p.disabled);
  const activeDisabled = providers.filter(p => (p.apiKey && p.apiKey.trim().length > 10) && p.disabled);
  const inactive = providers.filter(p => !(p.apiKey && p.apiKey.trim().length > 10));
  const displayList = [...activeWorking, ...activeDisabled, ...inactive];

  const handleMoveUp = (id: string, name: string) => {
    const workingIndex = activeWorking.findIndex(w => w.id === id);
    if (workingIndex <= 0) return;
    const newActiveWorking = [...activeWorking];
    const temp = newActiveWorking[workingIndex];
    newActiveWorking[workingIndex] = newActiveWorking[workingIndex - 1];
    newActiveWorking[workingIndex - 1] = temp;
    const updated = [...newActiveWorking, ...activeDisabled, ...inactive];
    setProviders(updated);
    autoSaveConfig(updated, routerAutoFallbackEnabled, routerCostGuardEnabled, routerBlockWhenLimitReached, routerDailyTokenLimit, routerTimeoutMs);
  };

  const handleMoveDown = (id: string, name: string) => {
    const workingIndex = activeWorking.findIndex(w => w.id === id);
    if (workingIndex === -1 || workingIndex >= activeWorking.length - 1) return;
    const newActiveWorking = [...activeWorking];
    const temp = newActiveWorking[workingIndex];
    newActiveWorking[workingIndex] = newActiveWorking[workingIndex + 1];
    newActiveWorking[workingIndex + 1] = temp;
    const updated = [...newActiveWorking, ...activeDisabled, ...inactive];
    setProviders(updated);
    autoSaveConfig(updated, routerAutoFallbackEnabled, routerCostGuardEnabled, routerBlockWhenLimitReached, routerDailyTokenLimit, routerTimeoutMs);
  };

  const toggleProviderActive = (id: string) => {
    const updated = providers.map(p => p.id === id ? { ...p, disabled: !p.disabled } : p);
    setProviders(updated);
    autoSaveConfig(updated, routerAutoFallbackEnabled, routerCostGuardEnabled, routerBlockWhenLimitReached, routerDailyTokenLimit, routerTimeoutMs);
  };

  let primaryUsedName = "Tidak Ada AI Aktif";
  if (activeWorking.length > 0) {
    primaryUsedName = activeWorking[0].name;
  }

  if (isLoading) {
    return <LoadingView message="Memuat Router..." />;
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto pb-24 px-4 md:px-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">AI Router</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Pengaturan prioritas router cerdas, riwayat logs, dan pengaman limit pemakaian AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSaving ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-200 text-[10px] font-semibold animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              Menyimpan...
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/80 text-emerald-700 rounded-lg border border-emerald-200/50 text-[10px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Tersimpan
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 z-[100] bg-white text-slate-700 text-[11.5px] font-semibold px-4 py-2.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-2 max-w-[90vw] whitespace-nowrap overflow-hidden text-ellipsis"
          >
            <img 
              src={
                toast.type === 'info' ? 'https://cdn-icons-png.flaticon.com/128/471/471662.png' :
                toast.type === 'warning' ? 'https://cdn-icons-png.flaticon.com/128/597/597774.png' :
                toast.type === 'error' ? 'https://cdn-icons-png.flaticon.com/128/1621/1621607.png' :
                'https://cdn-icons-png.flaticon.com/128/15219/15219916.png'
              } 
              alt={toast.type} 
              className="w-4 h-4 shrink-0" 
            />
            <span className="truncate">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 md:space-y-6">
        
        {/* Prioritas Provider */}
        <div className="bg-white border border-slate-100 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" /> Prioritas Provider
            </h3>
            <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
              Utama: <strong className="text-primary tracking-wide">{primaryUsedName}</strong>
            </span>
          </div>

          <div className="space-y-2.5">
            {displayList.map((provider, index) => {
              const hasApiKey = provider.apiKey && provider.apiKey.trim().length > 10;
              const isDisabled = provider.disabled === true;
              const isWorking = activeWorking.some(w => w.id === provider.id);
              const workingIndex = activeWorking.findIndex(w => w.id === provider.id);
              
              let statusLabel = "";
              let statusClass = "";
              if (!hasApiKey) {
                statusLabel = "Belum Disetel";
                statusClass = "text-slate-400";
              } else if (isDisabled) {
                statusLabel = "Nonaktif";
                statusClass = "text-slate-500 font-bold";
              } else if (provider.status === 'error') {
                statusLabel = "Gangguan/Limit";
                statusClass = "text-rose-600 font-bold animate-pulse";
              } else {
                statusLabel = workingIndex === 0 ? "Utama (Aktif)" : `Cadangan ${workingIndex}`;
                statusClass = workingIndex === 0 ? "text-emerald-600 font-bold" : "text-blue-600 font-semibold";
              }

              return (
                <div 
                  key={provider.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-3.5 bg-white border rounded-lg gap-3 transition-height duration-200",
                    hasApiKey ? (isDisabled ? "border-slate-200 bg-slate-50/30 shadow-sm" : "border-slate-200 shadow-sm") : "border-slate-100 opacity-60 bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <img 
                      src={DEFAULT_LOGOS[provider.id]} 
                      alt={provider.name} 
                      className="w-7 h-7 object-contain rounded-md bg-white p-0.5 border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-[12px] text-slate-800 tracking-tight">{provider.name}</div>
                      <div className={cn("text-[9px] mt-0.5 tracking-wide", statusClass)}>{statusLabel}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-none border-slate-100 pt-2.5 sm:pt-0 w-full sm:w-auto">
                    {hasApiKey && (
                      <CustomToggle 
                        active={!isDisabled} 
                        onToggle={() => toggleProviderActive(provider.id)} 
                      />
                    )}

                    {hasApiKey && (
                      <div className="flex items-center bg-slate-50/50 border border-slate-200/60 rounded-md overflow-hidden p-0.5 shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(provider.id, provider.name)}
                          disabled={!isWorking || workingIndex === 0}
                          className="p-1 px-[7px] text-slate-400 hover:text-primary hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-[1px] h-3.5 bg-slate-200"></div>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(provider.id, provider.name)}
                          disabled={!isWorking || workingIndex === activeWorking.length - 1}
                          className="p-1 px-[7px] text-slate-400 hover:text-primary hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pemakaian Token */}
        <div className="bg-white border border-slate-100 rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
            <Settings2 className="w-4 h-4 text-primary" /> Pemakaian Token (Kumulatif)
          </h3>
          <UsageExpandableCards usageData={usageStats} providers={providers} />
        </div>

        {/* Parameter Konfigurasi */}
        <div className="bg-white border border-slate-100 rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
            <Settings2 className="w-4 h-4 text-primary" /> Parameter Konfigurasi
          </h3>

          <div className="flex flex-col md:flex-row flex-wrap gap-3">
            
            <div className="flex items-center justify-between flex-1 min-w-[200px] border border-slate-100 bg-slate-50/40 p-3 rounded-lg shadow-sm">
              <div>
                <h4 className="text-[11.5px] font-bold text-slate-700 tracking-tight">Fallback Otomatis</h4>
                <p className="text-[9.5px] text-slate-500 mt-0.5 font-medium">Alihkan rute cerdas saat error.</p>
              </div>
              <CustomToggle 
                active={routerAutoFallbackEnabled} 
                onToggle={() => {
                  const val = !routerAutoFallbackEnabled;
                  setRouterAutoFallbackEnabled(val);
                  autoSaveConfig(providers, val, routerCostGuardEnabled, routerBlockWhenLimitReached, routerDailyTokenLimit, routerTimeoutMs);
                }} 
              />
            </div>

            <div className="flex items-center justify-between flex-1 min-w-[200px] border border-slate-100 bg-slate-50/40 p-3 rounded-lg shadow-sm">
              <div>
                <h4 className="text-[11.5px] font-bold text-slate-700 tracking-tight">Pengaman Token</h4>
                <p className="text-[9.5px] text-slate-500 mt-0.5 font-medium">Deteksi batas limit pemakaian.</p>
              </div>
              <CustomToggle 
                active={routerCostGuardEnabled} 
                onToggle={() => {
                  const val = !routerCostGuardEnabled;
                  setRouterCostGuardEnabled(val);
                  autoSaveConfig(providers, routerAutoFallbackEnabled, val, routerBlockWhenLimitReached, routerDailyTokenLimit, routerTimeoutMs);
                }} 
              />
            </div>

            {routerCostGuardEnabled && (
              <div className="flex items-center justify-between flex-1 min-w-[200px] border border-slate-100 bg-slate-50/40 p-3 rounded-lg shadow-sm">
                <div>
                  <h4 className="text-[11.5px] font-bold text-slate-700 tracking-tight">Blokir Saat Limit</h4>
                  <p className="text-[9.5px] text-slate-500 mt-0.5 font-medium">Hentikan jika kuota token lewat.</p>
                </div>
                <CustomToggle 
                  active={routerBlockWhenLimitReached} 
                  onToggle={() => {
                    const val = !routerBlockWhenLimitReached;
                    setRouterBlockWhenLimitReached(val);
                    autoSaveConfig(providers, routerAutoFallbackEnabled, routerCostGuardEnabled, val, routerDailyTokenLimit, routerTimeoutMs);
                  }} 
                />
              </div>
            )}

            {routerCostGuardEnabled && (
              <div className="flex items-center justify-between flex-1 min-w-[200px] border border-slate-100 bg-slate-50/40 p-3 rounded-lg shadow-sm">
                <div>
                  <h4 className="text-[11.5px] font-bold text-slate-700 tracking-tight">Batas Token /Hari</h4>
                  <p className="text-[9.5px] text-slate-500 mt-0.5 font-medium">Limit batas maksimum.</p>
                </div>
                <input 
                  type="number" 
                  value={routerDailyTokenLimit}
                  onChange={(e) => setRouterDailyTokenLimit(Number(e.target.value))}
                  onBlur={() => autoSaveConfig(providers, routerAutoFallbackEnabled, routerCostGuardEnabled, routerBlockWhenLimitReached, routerDailyTokenLimit, routerTimeoutMs)}
                  className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-mono text-center shadow-inner"
                />
              </div>
            )}

            <div className="flex items-center justify-between flex-1 min-w-[200px] border border-slate-100 bg-slate-50/40 p-3 rounded-lg shadow-sm">
              <div>
                <h4 className="text-[11.5px] font-bold text-slate-700 tracking-tight">Timeout API</h4>
                <p className="text-[9.5px] text-slate-500 mt-0.5 font-medium">Batas tunggu fallback (ms).</p>
              </div>
              <input 
                type="number" 
                value={routerTimeoutMs}
                onChange={(e) => setRouterTimeoutMs(Number(e.target.value))}
                onBlur={() => autoSaveConfig(providers, routerAutoFallbackEnabled, routerCostGuardEnabled, routerBlockWhenLimitReached, routerDailyTokenLimit, routerTimeoutMs)}
                className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-mono text-center shadow-inner"
              />
            </div>
            
          </div>
        </div>

        {/* Log Router Real */}
        <div className="bg-white border border-slate-100 rounded-lg overflow-hidden shadow-sm">
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudLightning className="w-4 h-4 text-slate-500" />
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest bg-slate-200/50 px-2 py-0.5 rounded border border-slate-200">Log Router</span>
            </div>
            <button className="text-[9px] font-bold text-slate-400 hover:text-primary transition-colors cursor-pointer flex items-center gap-1" onClick={fetchLogs}>
              Segarkan
            </button>
          </div>
          
          <div className="p-5 font-mono text-[10.5px] leading-relaxed bg-[#0f172a] text-slate-300 min-h-[160px] max-h-[300px] overflow-y-auto space-y-2 selection:bg-slate-700 selection:text-white">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic text-center py-6">Belum ada log router hari ini.</p>
            ) : (
              logs.map((log) => {
                const isErr = log.status === 'error';
                const isWarn = log.status === 'warning';
                
                let logTime = '';
                try {
                  const d = new Date(log.timestamp + 'Z'); 
                  logTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
                } catch {
                  logTime = log.timestamp.split(' ')[1] || log.timestamp;
                }

                return (
                  <div key={log.id} className="flex items-start gap-2.5">
                    <span className="text-slate-500 shrink-0 select-none">[{logTime}]</span>
                    <span className={cn(
                      "font-bold shrink-0 w-8",
                      isErr ? "text-rose-400" : isWarn ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {isErr ? 'ERR' : isWarn ? 'WRN' : 'INF'}
                    </span>
                    <span className="text-slate-300 font-medium">
                      {log.provider && log.provider !== 'System' ? <span className="text-slate-400">[{log.provider}] </span> : ''}
                      {log.detail}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
