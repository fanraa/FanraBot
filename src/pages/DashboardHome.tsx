import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MessageSquare, Users, Sparkles, Clock, Loader2, Bot,
  Settings, Terminal, Zap, ShieldAlert, Image as ImageIcon,
  Download, CheckCircle2, AlertCircle, Phone, ArrowUpRight, ArrowRight, Lightbulb
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingView } from '../components/LoadingView';

export default function DashboardHome() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const userStr = localStorage.getItem('user');
      setUser(userStr ? JSON.parse(userStr) : null);
    };
    window.addEventListener('userUpdate', handleUpdate);
    return () => window.removeEventListener('userUpdate', handleUpdate);
  }, []);

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await fetch('/api/whatsapp/dashboard/summary');
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSummary();
    const interval = setInterval(loadSummary, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !summary) {
    return <LoadingView message="Memuat Dashboard..." />;
  }

  const { setup, status, stats, aiDistribution, recentLogs, recommendation } = summary || {};

  const formattedDate = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  const isConnected = status?.whatsapp === 'connected';

  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  // Calculate AI percentage
  const totalAi = (aiDistribution?.gemini || 0) + (aiDistribution?.groq || 0) + (aiDistribution?.openai || 0) + (aiDistribution?.claude || 0) + (aiDistribution?.deepseek || 0) + (aiDistribution?.kimi || 0);
  
  const getAiPerc = (val: number) => {
    if (totalAi === 0) return 0;
    return Math.round((val / totalAi) * 100);
  };

  const isEmptyState = stats?.totalMessages === 0 && !isConnected;

  return (
    <div className="flex flex-col space-y-4 md:space-y-6 pb-28 md:pb-10">
      
      {/* Header Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Selamat Datang, {user?.username || 'Fanra'}! 👋</h2>
          <p className="text-sm text-slate-500 mt-1">Ringkasan aktivitas asisten AI Anda hari ini</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{formattedDate}</span>
        </div>
      </div>

      {isEmptyState ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Bot belum menerima aktivitas</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm">Hubungkan WhatsApp untuk mulai menggunakan FanraBot dan melihat statistik otomasi Anda di sini.</p>
          <Link to="/dashboard/connect" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Hubungkan WhatsApp
          </Link>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3">
            <Link to="/dashboard/connect" className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-[12px] sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[40px] text-center">
              <Phone className="w-4 h-4 shrink-0" />
              <span className="truncate">{isConnected ? 'Status WA' : 'Hubungkan WA'}</span>
            </Link>
            <Link to="/dashboard/automation" className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-[12px] sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[40px] text-center">
              <Zap className="w-4 h-4 shrink-0" />
              <span className="truncate">Otomatisasi</span>
            </Link>
            <Link to="/dashboard/commands" className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-[12px] sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[40px] text-center">
              <Terminal className="w-4 h-4 shrink-0" />
              <span className="truncate">Perintah</span>
            </Link>
            <Link to="/dashboard/providers" className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-[12px] sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[40px] text-center">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="truncate">AI Provider</span>
            </Link>
            <Link to="/dashboard/logs" className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-[12px] sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[40px] text-center col-span-2 md:col-span-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">Log Sistem</span>
            </Link>
          </div>

          {/* Status Ringkas - Full width horizontal */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 w-full flex justify-between items-center overflow-hidden">
            <StatusBadge label="WhatsApp" active={isConnected} activeText="Terhubung" inactiveText={status?.whatsapp === 'qr' ? 'Tunggu QR' : 'Terputus'} />
            <StatusBadge label="AI Provider" active={status?.aiProvider === 'active'} />
            <StatusBadge label="Auto Reply" active={status?.autoReply} />
            <StatusBadge label="Natural Language" active={status?.naturalLanguage} />
          </div>

          {/* Setup Progress */}
          {setup?.completed < setup?.total && (
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center shrink-0 relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-blue-500"
                    strokeDasharray={`${(setup?.completed / setup?.total) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
                <span className="text-xs font-semibold text-slate-700">{setup?.completed}/{setup?.total}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 text-sm">Selesaikan Pengaturan Awal</h3>
                <p className="text-xs text-slate-500 mt-0.5">Selesaikan beberapa langkah terakhir agar bot dapat berjalan optimal.</p>
              </div>
            </div>
          )}

          {/* Real Stats Grid - Full width (2 cols mobile, 4 cols desktop or 4 desktop, 2 mobile. there are 8 cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={<MessageSquare />} label="Pesan WA" value={stats?.totalMessages} />
            <StatCard icon={<Sparkles />} label="AI Respons" value={stats?.aiResponses} />
            <StatCard icon={<Users />} label="Kontak Baru" value={stats?.newContacts} />
            <StatCard icon={<Clock />} label="Rata Respon" value={`${stats?.averageResponseTime}s`} />
            
            <StatCard icon={<ImageIcon />} label="Media Pros" value={stats?.mediaProcessed} />
            <StatCard icon={<Download />} label="Downloader" value={stats?.downloaderCount} />
            <StatCard icon={<ShieldAlert />} label="Link Blokir" value={stats?.blockedLinks} />
            <StatCard icon={<CheckCircle2 />} label="Firestore" value={status?.firestoreSync === 'ok' ? 'Sinkron' : 'Error'} />
          </div>

          {/* AI Distribution Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm">Distribusi AI</h3>
            {totalAi > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-6 md:grid-cols-3 gap-4">
                <DistributionBar label="OpenAI" value={getAiPerc(aiDistribution?.openai)} color="bg-emerald-500" />
                <DistributionBar label="Gemini" value={getAiPerc(aiDistribution?.gemini)} color="bg-blue-500" />
                <DistributionBar label="Claude" value={getAiPerc(aiDistribution?.claude)} color="bg-violet-500" />
                <DistributionBar label="Groq" value={getAiPerc(aiDistribution?.groq)} color="bg-orange-500" />
                <DistributionBar label="DeepSeek" value={getAiPerc(aiDistribution?.deepseek)} color="bg-cyan-500" />
                <DistributionBar label="Kimi" value={getAiPerc(aiDistribution?.kimi)} color="bg-indigo-500" />
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-6 md:grid-cols-3 gap-4">
                <DistributionBar label="OpenAI" value={0} color="bg-emerald-500" />
                <DistributionBar label="Gemini" value={0} color="bg-blue-500" />
                <DistributionBar label="Claude" value={0} color="bg-violet-500" />
                <DistributionBar label="Groq" value={0} color="bg-orange-500" />
                <DistributionBar label="DeepSeek" value={0} color="bg-cyan-500" />
                <DistributionBar label="Kimi" value={0} color="bg-indigo-500" />
              </div>
            )}
          </div>

          {/* Recommendation Card Flat */}
          {recommendation && (
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-1.5">
                {recommendation.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                 recommendation.type === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-500" /> :
                 <Lightbulb className="w-4 h-4 text-blue-500" />}
                <h3 className="font-medium text-sm text-slate-800">{recommendation.title}</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {recommendation.message}
              </p>
            </div>
          )}

          {/* Aktivitas Terakhir */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 text-sm">Aktivitas Terakhir</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {recentLogs && recentLogs.length > 0 ? (
                recentLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <div className={cn(
                      "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      log.type === 'error' ? "bg-red-50 text-red-600" :
                      log.type === 'warning' ? "bg-amber-50 text-amber-600" :
                      "bg-blue-50 text-blue-600"
                    )}>
                      {log.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
                       log.type === 'warning' ? <ShieldAlert className="w-4 h-4" /> :
                       <Bot className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{log.title}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{log.message}</p>
                    </div>
                    <div className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatTime(log.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Belum ada aktivitas.
                </div>
              )}
            </div>
          </div>
          
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-100 flex flex-col gap-3 shadow-sm hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</div>
        <span className="text-[11px] font-medium text-slate-500 leading-none">{label}</span>
      </div>
      <p className="text-lg font-semibold text-slate-800 tracking-tight leading-none">
        {value || 0}
      </p>
    </div>
  );
}

function StatusBadge({ label, active, activeText = 'Aktif', inactiveText = 'Nonaktif' }: { label: string, active: boolean, activeText?: string, inactiveText?: string }) {
  return (
    <div className="flex flex-col items-center sm:items-start gap-0.5 sm:gap-1 px-1 sm:px-0 w-full overflow-hidden">
      <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium truncate w-full text-center sm:text-left">{label}</span>
      <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 w-full">
        <span className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0", active ? "bg-emerald-500" : "bg-slate-300")} />
        <span className="text-[9px] sm:text-xs font-semibold text-slate-700 truncate">{active ? activeText : inactiveText}</span>
      </div>
    </div>
  );
}

function DistributionBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-800">{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

