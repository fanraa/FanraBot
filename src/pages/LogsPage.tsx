import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  RefreshCw,
  Clock,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { io, Socket } from 'socket.io-client';

interface SystemLog {
  id: string;
  timestamp: string;
  event: string;
  provider: string;
  status: 'success' | 'error' | 'warning';
  detail: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    // Only fetch historical once on mount
    fetch('/api/whatsapp/logs')
      .then(res => res.json())
      .then(data => {
        // Reverse array if API returns newest first, we want oldest first in terminal
        // Assuming API returns newest first (desc)
        setLogs(Array.isArray(data) ? data.reverse() : []);
      })
      .catch(err => console.error("Failed to fetch initial logs", err));

    const socket = io('/', { path: '/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('newLog', (log: SystemLog) => {
      setLogs((prev) => [...prev, log].slice(-1000)); // Keep max 1000 logs in RAM
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto scroll effect
  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  // Handle manual scroll to pause auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // If user scrolled up manually, pause auto-scroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (isAutoScroll && !isAtBottom) {
      setIsAutoScroll(false);
    } else if (!isAutoScroll && isAtBottom) {
      setIsAutoScroll(true);
    }
  };

  const getLogColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  const [filter, setFilter] = useState<'Semua' | 'Sukses' | 'Error' | 'Peringatan'>('Semua');

  const filteredLogs = logs.filter(log => {
    if (filter === 'Sukses') return log.status === 'success';
    if (filter === 'Error') return log.status === 'error';
    if (filter === 'Peringatan') return log.status === 'warning';
    return true;
  });

  return (
    <div className="space-y-6 w-full max-w-full pb-32 md:pb-8 flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6" />
            Live System Logs
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-muted flex gap-2 items-center mt-1">
            <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")}></span>
            {isConnected ? 'Terhubung ke Stream Real-time' : 'Koneksi terputus...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={cn(
              "p-2 sm:px-3 sm:py-2 border border-outline rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer",
              isAutoScroll ? "bg-primary/10 text-primary border-primary/20" : "bg-white text-on-surface-variant hover:bg-surface-subtle"
            )}
          >
            {isAutoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoScroll ? 'Jeda Scroll' : 'Berjalan'}</span>
          </button>
          <button 
            onClick={() => setLogs([])}
            className="p-2 border border-outline rounded-xl bg-white hover:bg-surface-subtle transition-all flex items-center justify-center text-xs font-semibold text-on-surface-variant cursor-pointer text-red-500"
            title="Bersihkan Terminal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 shrink-0">
        {(['Semua', 'Sukses', 'Error', 'Peringatan'] as const).map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
              filter === f ? "bg-primary text-white shadow-xs" : "bg-white border border-outline text-on-surface-muted hover:text-on-surface"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Terminal View */}
      <div 
        className="flex-1 bg-[#0c0c0c] border border-outline rounded-2xl shadow-inner overflow-y-auto p-4 font-mono text-xs sm:text-sm custom-scrollbar relative"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full opacity-50 flex-col gap-2">
            <Terminal className="w-8 h-8 text-gray-500" />
            <span className="text-gray-500">Menunggu log sistem...</span>
          </div>
        ) : (
          <div className="space-y-1.5 break-words">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:gap-4 hover:bg-white/5 p-1 rounded-md transition-colors leading-relaxed">
                <div className="flex gap-3 shrink-0 opacity-60 w-auto sm:w-[220px]">
                  <span className="text-gray-400">[{log.timestamp.split(' ')[1] || log.timestamp}]</span>
                  <span className={cn("font-bold uppercase w-12", getLogColor(log.status))}>
                    {log.status === 'success' ? 'INFO' : log.status === 'warning' ? 'WARN' : 'ERR'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 flex-1 min-w-0 mt-1 sm:mt-0">
                  <span className="text-gray-300 font-semibold truncate sm:w-[150px] shrink-0">
                    [{log.provider}] {log.event}
                  </span>
                  <span className="text-gray-400 opacity-80 whitespace-pre-wrap flex-1">
                    {`> ${log.detail}`}
                  </span>
                </div>
              </div>
            ))}
            {isAutoScroll && (
              <div className="h-4 flex items-center gap-2 text-gray-500 mt-2">
                <span className="animate-pulse">_</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
