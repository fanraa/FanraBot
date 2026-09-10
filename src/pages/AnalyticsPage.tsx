import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  MessageSquare, 
  Users, 
  Timer, 
  AlertTriangle,
  RefreshCw,
  Cpu,
  Zap,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ChartItem {
  name: string;
  pesan: number;
  tokens: number;
  geminiTokens: number;
  groqTokens: number;
  openaiTokens: number;
  anthropicTokens?: number;
  deepseekTokens?: number;
  kimiTokens?: number;
}

interface AnalyticsPayload {
  metrics: {
    pesanPerHari: number;
    penggunaAktif: number;
    avgResponseTime: string;
    errorRate: string;
    totalTokens?: number;
    aiHandled?: number;
  };
  chartData: ChartItem[];
  providers: {
    gemini: number;
    groq: number;
    openai: number;
    anthropic: number;
    deepseek?: number;
    kimi?: number;
  };
  roi: {
    savedHours: string;
  };
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90' | '365'>('7');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  const fetchAnalytics = () => {
    setLoading(true);
    fetch(`/api/whatsapp/analytics?timeframe=${timeframe}`)
      .then(res => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load analytics data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  // Dynamic friendly fallbacks if fetch or database returns 0 messages
  const fallbackData: AnalyticsPayload = {
    metrics: {
      pesanPerHari: 0,
      penggunaAktif: 0,
      avgResponseTime: "0.0s",
      errorRate: "0.00%",
      totalTokens: 0,
      aiHandled: 0
    },
    chartData: [
      { name: 'Sen', pesan: 0, tokens: 0, geminiTokens: 0, groqTokens: 0, openaiTokens: 0, anthropicTokens: 0, deepseekTokens: 0, kimiTokens: 0 },
      { name: 'Sel', pesan: 0, tokens: 0, geminiTokens: 0, groqTokens: 0, openaiTokens: 0, anthropicTokens: 0, deepseekTokens: 0, kimiTokens: 0 },
      { name: 'Rab', pesan: 0, tokens: 0, geminiTokens: 0, groqTokens: 0, openaiTokens: 0, anthropicTokens: 0, deepseekTokens: 0, kimiTokens: 0 },
      { name: 'Kam', pesan: 0, tokens: 0, geminiTokens: 0, groqTokens: 0, openaiTokens: 0, anthropicTokens: 0, deepseekTokens: 0, kimiTokens: 0 },
      { name: 'Jum', pesan: 0, tokens: 0, geminiTokens: 0, groqTokens: 0, openaiTokens: 0, anthropicTokens: 0, deepseekTokens: 0, kimiTokens: 0 },
      { name: 'Sab', pesan: 0, tokens: 0, geminiTokens: 0, groqTokens: 0, openaiTokens: 0, anthropicTokens: 0, deepseekTokens: 0, kimiTokens: 0 },
      { name: 'Min', pesan: 0, tokens: 0, geminiTokens: 0, groqTokens: 0, openaiTokens: 0, anthropicTokens: 0, deepseekTokens: 0, kimiTokens: 0 },
    ],
    providers: {
      gemini: 0,
      groq: 0,
      openai: 0,
      anthropic: 0,
      deepseek: 0,
      kimi: 0
    },
    roi: {
      savedHours: "0.0 Jam"
    }
  };

  const activeData = data || fallbackData;

  const displayMetrics = {
    pesanPerHari: activeData.metrics.pesanPerHari || 0,
    penggunaAktif: activeData.metrics.penggunaAktif || 0,
    avgResponseTime: activeData.metrics.avgResponseTime || "0s",
    errorRate: activeData.metrics.errorRate || "0.00%",
    totalTokens: activeData.metrics.totalTokens || 0,
    aiHandled: activeData.metrics.aiHandled || 0
  };

  const displayCharts = activeData.chartData || [];
  const displaySavedHours = activeData.roi?.savedHours || "0.0 Jam";

  const exportAnalyticsToCSV = () => {
    if (!activeData) return;
    
    let csvS = "\uFEFF"; // UTF-8 BOM
    // Title
    csvS += "=== LAPORAN ANALITIK PERFORMA FANRABOT ===\r\n";
    csvS += `Tanggal Cetak;${new Date().toLocaleString('id-ID')}\r\n`;
    csvS += `Rentang Waktu;${timeframe} Hari Terakhir\r\n\r\n`;
    
    // Metrics section
    csvS += "=== METRIK UTAMA ===\r\n";
    csvS += `Metrik;Nilai;Keterangan\r\n`;
    csvS += `Rata-rata Pesan Harian;${displayMetrics.pesanPerHari};Pesan Terkirim per Hari\r\n`;
    csvS += `Pengguna Aktif;${displayMetrics.penggunaAktif};Total Pengguna Unik dalam Periode\r\n`;
    csvS += `Rata-rata Respon Bot;${displayMetrics.avgResponseTime};Rata-rata Latensi Jawaban\r\n`;
    csvS += `Error Rate;${displayMetrics.errorRate};Tingkat Kesalahan Sistem\r\n`;
    csvS += `Total Token AI;${displayMetrics.totalTokens};Konsumsi Token AI\r\n`;
    csvS += `Direspon AI;${displayMetrics.aiHandled};Pesan yang ditangani Auto-pilot AI\r\n`;
    csvS += `Penghematan Waktu;${displaySavedHours};Estimasi jam kerja yang dihemat\r\n\r\n`;
    
    // Providers section
    csvS += "=== DISTRIBUSI PENGGUNAAN PROVIDER AI ===\r\n";
    csvS += "Provider;Persentase\r\n";
    csvS += `Google Gemini 1.5 Flash;${activeData.providers.gemini || 0}%\r\n`;
    csvS += `Groq Llama 3;${activeData.providers.groq || 0}%\r\n`;
    csvS += `OpenAI GPT-4o;${activeData.providers.openai || 0}%\r\n`;
    csvS += `Anthropic Claude;${activeData.providers.anthropic || 0}%\r\n`;
    csvS += `DeepSeek;${activeData.providers.deepseek || 0}%\r\n`;
    csvS += `Kimi;${activeData.providers.kimi || 0}%\r\n\r\n`;
    
    // Daily breakdown
    csvS += "=== BREAKDOWN HARIAN ===\r\n";
    csvS += "Hari/Tanggal;Total Pesan;Total Token;Token Gemini;Token Groq;Token OpenAI;Token Anthropic;Token DeepSeek;Token Kimi\r\n";
    displayCharts.forEach(row => {
      csvS += `${row.name};${row.pesan};${row.tokens};${row.geminiTokens};${row.groqTokens};${row.openaiTokens};${row.anthropicTokens || 0};${row.deepseekTokens || 0};${row.kimiTokens || 0}\r\n`;
    });
    
    const blob = new Blob([csvS], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_analitik_fanrabot_${timeframe}hari.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 select-none pb-24 md:pb-8">
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-brand font-bold text-on-surface">Analitik Performa</h1>
            <button 
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-1 text-on-surface-muted hover:text-primary rounded-full hover:bg-surface-muted transition-colors disabled:opacity-40"
              title="Refresh Data"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
          <p className="text-on-surface-muted text-sm mt-0.5">Laporan statistik penggunaan bot dan AI Anda.</p>
        </div>
        
        {/* Day Selectors & Download */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
          <div className="grid grid-cols-4 sm:flex bg-white border border-outline rounded-xl p-1 shadow-sm w-full sm:w-auto">
            <button 
              onClick={() => setTimeframe('7')}
              className={cn(
                "px-1.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black rounded-lg transition-all cursor-pointer text-center whitespace-nowrap",
                timeframe === '7' ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:bg-surface-muted"
              )}
            >
              7 Hari
            </button>
            <button 
              onClick={() => setTimeframe('30')}
              className={cn(
                "px-1.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black rounded-lg transition-all cursor-pointer text-center whitespace-nowrap",
                timeframe === '30' ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:bg-surface-muted"
              )}
            >
              30 Hari
            </button>
            <button 
              onClick={() => setTimeframe('90')}
              className={cn(
                "px-1.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black rounded-lg transition-all cursor-pointer text-center whitespace-nowrap",
                timeframe === '90' ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:bg-surface-muted"
              )}
            >
              90 Hari
            </button>
            <button 
              onClick={() => setTimeframe('365')}
              className={cn(
                "px-1.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black rounded-lg transition-all cursor-pointer text-center whitespace-nowrap",
                timeframe === '365' ? "bg-primary text-white shadow-xs" : "text-on-surface-variant hover:bg-surface-muted"
              )}
            >
              365 Hari
            </button>
          </div>

          <button
            onClick={exportAnalyticsToCSV}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary/95 transition-all cursor-pointer whitespace-nowrap"
            title="Unduh Laporan CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <MetricCard 
          title="Pesan Per Hari" 
          value={displayMetrics.pesanPerHari.toString()} 
          trend={displayMetrics.pesanPerHari > 0 ? "+15.2%" : "0.0%"} 
          desc={timeframe === '7' ? "Rata-rata minggu ini" : timeframe === '30' ? "Rata-rata 30 hari ini" : timeframe === '90' ? "Rata-rata 90 hari ini" : "Rata-rata setahun ini"} 
          icon={<MessageSquare className="w-4 h-4" />} 
        />
        <MetricCard 
          title="Pengguna Aktif" 
          value={displayMetrics.penggunaAktif.toLocaleString('id-ID')} 
          trend={displayMetrics.penggunaAktif > 0 ? "+5.4%" : "0.0%"} 
          desc={timeframe === '7' ? "Total unik seminggu" : timeframe === '30' ? "Total unik sebulan" : timeframe === '90' ? "Total unik 3 bulan" : "Total unik setahun"} 
          icon={<Users className="w-4 h-4" />} 
        />
        <MetricCard 
          title="Rata-rata Respon" 
          value={displayMetrics.avgResponseTime} 
          trend={displayMetrics.pesanPerHari > 0 ? "-0.4s" : "0.0s"} 
          desc="Latency bot" 
          icon={<Timer className="w-4 h-4" />} 
        />
        <MetricCard 
          title="Error Rate" 
          value={displayMetrics.errorRate} 
          trend={displayMetrics.pesanPerHari > 0 ? "-0.01%" : "0.00%"} 
          desc="Stabilitas sistem" 
          icon={<AlertTriangle className="w-4 h-4" />} 
        />
        <MetricCard 
          title="Total Token AI" 
          value={displayMetrics.totalTokens.toLocaleString('id-ID')} 
          trend={displayMetrics.totalTokens > 0 ? "+12.8%" : "0.0%"} 
          desc="Token dikonsumsi" 
          icon={<Cpu className="w-4 h-4 text-violet-500" />} 
        />
        <MetricCard 
          title="Direspon AI" 
          value={displayMetrics.aiHandled.toLocaleString('id-ID')} 
          trend={displayMetrics.aiHandled > 0 ? "+8.2%" : "0.0%"} 
          desc="Pesan auto-pilot" 
          icon={<Zap className="w-4 h-4 text-amber-500" />} 
        />
      </div>

      {/* Recharts Graphical Visualizations Row - Stacked layout (full width) */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* volume pesan harian */}
        <div className="bg-white border border-outline rounded-2xl shadow-xs p-6 hover:shadow-sm transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-on-surface text-sm tracking-tight">Volume Pesan Harian</h3>
              <p className="text-[10px] text-on-surface-muted mt-0.5">Grafik volume penyaluran pesan masuk dan keluar</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-on-surface-muted">
              <div className="flex items-center">
                Pesan Terkirim
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={displayCharts} style={{ outline: 'none' }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(37, 99, 235, 0.03)' }} 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '11px', fontWeight: 'bold' }} 
                />
                <Bar 
                  dataKey="pesan" 
                  fill="#2563eb" 
                  radius={[4, 4, 0, 0]} 
                  barSize={18} 
                  style={{ outline: 'none' }}
                  activeBar={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* konsumsi token AI per Provider */}
        <div className="bg-white border border-outline rounded-2xl shadow-xs p-6 hover:shadow-sm transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
            <div>
              <h3 className="font-extrabold text-on-surface text-sm tracking-tight">Konsumsi Token AI</h3>
              <p className="text-[10px] text-on-surface-muted mt-0.5">Pemakaian token real-time yang dipisahkan per AI Provider</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-[9px] font-black uppercase tracking-wide text-on-surface-muted">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white rounded flex items-center justify-center p-px border border-outline-variant/60 shadow-2xs shrink-0 select-none">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg/960px-Google_Gemini_icon_2025.svg.png" alt="Gemini" className="w-full h-full object-contain" />
                </div>
                Gemini
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white rounded flex items-center justify-center p-px border border-outline-variant/60 shadow-2xs shrink-0 select-none">
                  <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/groq.png" alt="Groq" className="w-full h-full object-contain" />
                </div>
                Groq
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white rounded flex items-center justify-center p-px border border-outline-variant/60 shadow-2xs shrink-0 select-none">
                  <img src="https://tse3.mm.bing.net/th/id/OIP.LmUVYFEdQNlbiVJULP0qnwHaHh?pid=Api&h=220&P=0" alt="OpenAI" className="w-full h-full object-contain" />
                </div>
                OpenAI
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white rounded flex items-center justify-center p-px border border-outline-variant/60 shadow-2xs shrink-0 select-none">
                  <img src="https://tse3.mm.bing.net/th/id/OIP.ipQPNdScfLIsMp8_-r14qQHaHa?pid=Api&h=220&P=0" alt="Anthropic" className="w-full h-full object-contain" />
                </div>
                Anthropic
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white rounded flex items-center justify-center p-px border border-outline-variant/60 shadow-2xs shrink-0 select-none">
                  <img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png" alt="DeepSeek" className="w-full h-full object-contain" />
                </div>
                DeepSeek
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white rounded flex items-center justify-center p-px border border-outline-variant/60 shadow-2xs shrink-0 select-none">
                  <img src="https://statics.moonshot.cn/kimi-chat/favicon.ico" alt="Kimi" className="w-full h-full object-contain" />
                </div>
                Kimi
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={displayCharts} style={{ outline: 'none' }}>
                <defs>
                  <linearGradient id="colorGemini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGroq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOpenAI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAnthropic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDeepSeek" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorKimi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '11px', fontWeight: 'bold' }} 
                  cursor={false}
                />
                
                {/* Gemini Tokens Path */}
                <Area 
                  type="monotone" 
                  dataKey="geminiTokens" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorGemini)" 
                  dot={false}
                  activeDot={false}
                  name="Tokens Gemini"
                  style={{ outline: 'none' }}
                />

                {/* Groq Tokens Path */}
                <Area 
                  type="monotone" 
                  dataKey="groqTokens" 
                  stroke="#f97316" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorGroq)" 
                  dot={false}
                  activeDot={false}
                  name="Tokens Groq"
                  style={{ outline: 'none' }}
                />

                {/* OpenAI Tokens Path */}
                <Area 
                  type="monotone" 
                  dataKey="openaiTokens" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorOpenAI)" 
                  dot={false}
                  activeDot={false}
                  name="Tokens OpenAI"
                  style={{ outline: 'none' }}
                />

                {/* Anthropic Tokens Path */}
                <Area 
                  type="monotone" 
                  dataKey="anthropicTokens" 
                  stroke="#a78bfa" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorAnthropic)" 
                  dot={false}
                  activeDot={false}
                  name="Tokens Anthropic"
                  style={{ outline: 'none' }}
                />

                {/* DeepSeek Tokens Path */}
                <Area 
                  type="monotone" 
                  dataKey="deepseekTokens" 
                  stroke="#06b6d4" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorDeepSeek)" 
                  dot={false}
                  activeDot={false}
                  name="Tokens DeepSeek"
                  style={{ outline: 'none' }}
                />

                {/* Kimi Tokens Path */}
                <Area 
                  type="monotone" 
                  dataKey="kimiTokens" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorKimi)" 
                  dot={false}
                  activeDot={false}
                  name="Tokens Kimi"
                  style={{ outline: 'none' }}
                />

              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Provider & ROI Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Provider Usage */}
        <div className="bg-white border border-outline rounded-2xl shadow-xs p-6 hover:shadow-sm transition-all duration-300">
          <h3 className="font-brand font-black text-on-surface text-sm mb-5 uppercase tracking-wide">Provider Paling Sering Dipakai</h3>
          <div className="space-y-4">
            <ProviderStat 
              label="Gemini 1.5 Flash" 
              percentage={activeData.providers.gemini || 0} 
              color="bg-blue-500" 
              logoUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg/960px-Google_Gemini_icon_2025.svg.png"
            />
            <ProviderStat 
              label="Groq (Llama 3)" 
              percentage={activeData.providers.groq || 0} 
              color="bg-orange-500" 
              logoUrl="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/groq.png"
            />
            <ProviderStat 
              label="OpenAI GPT-4o" 
              percentage={activeData.providers.openai || 0} 
              color="bg-green-500" 
              logoUrl="https://tse3.mm.bing.net/th/id/OIP.LmUVYFEdQNlbiVJULP0qnwHaHh?pid=Api&h=220&P=0"
            />
            <ProviderStat 
              label="Anthropic Claude" 
              percentage={activeData.providers.anthropic || 0} 
              color="bg-violet-500" 
              logoUrl="https://tse3.mm.bing.net/th/id/OIP.ipQPNdScfLIsMp8_-r14qQHaHa?pid=Api&h=220&P=0"
            />
            <ProviderStat 
              label="DeepSeek" 
              percentage={activeData.providers.deepseek || 0} 
              color="bg-cyan-500" 
              logoUrl="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png"
            />
            <ProviderStat 
              label="Kimi" 
              percentage={activeData.providers.kimi || 0} 
              color="bg-indigo-500" 
              logoUrl="https://statics.moonshot.cn/kimi-chat/favicon.ico"
            />
          </div>
        </div>

        {/* ROI Insight */}
        <div className="bg-white border border-outline rounded-2xl shadow-xs p-6 flex flex-col justify-center items-center text-center hover:shadow-sm transition-all duration-300">
          <div className="space-y-2.5 max-w-sm">
            <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
              ROI Insight
            </span>
            <h3 className="text-lg font-extrabold text-on-surface leading-snug">Penghematan Waktu</h3>
            <p className="text-3xl font-black text-primary tracking-tight">
              {displaySavedHours}
            </p>
            <p className="text-[11px] text-on-surface-muted font-bold">
              {timeframe === '7' 
                ? "Dibandingkan menjawab manual minggu ini" 
                : timeframe === '30' 
                  ? "Dibandingkan menjawab manual sebulan ini" 
                  : timeframe === '90'
                    ? "Dibandingkan menjawab manual 3 bulan ini"
                    : "Dibandingkan menjawab manual setahun ini"
              }
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, desc, icon }: any) {
  const isPositive = trend.startsWith('+') && trend !== '0.0%';
  const isZero = trend === '0.0%' || trend === '0.0s' || trend === '0.00%';
  return (
    <div className="bg-white border border-outline rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="text-on-surface-muted">
          {icon}
        </div>
        <div className={cn(
          "text-[10px] font-extrabold",
          isZero
            ? "text-slate-400"
            : isPositive 
              ? "text-green-600" 
              : "text-red-600"
        )}>
          {trend}
        </div>
      </div>
      <h4 className="text-xs font-bold text-on-surface-muted mb-1">{title}</h4>
      <p className="text-2xl font-black text-on-surface tracking-tight mb-1">{value}</p>
      <p className="text-[10px] text-on-surface-muted font-semibold">{desc}</p>
    </div>
  );
}

function ProviderStat({ label, percentage, color, logoUrl }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-bold">
        <div className="flex items-center gap-1.5">
          {logoUrl && (
            <div className="w-5 h-5 bg-white rounded flex items-center justify-center p-0.5 border border-outline-variant/60 shadow-xs">
              <img src={logoUrl} alt={label} className="w-full h-full object-contain" />
            </div>
          )}
          <span className="text-on-surface-variant font-semibold">{label}</span>
        </div>
        <span className="font-extrabold text-on-surface">{percentage}%</span>
      </div>
      <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden border border-outline/30">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", color)} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
