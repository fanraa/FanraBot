import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile, 
  User, 
  Clock, 
  Cpu, 
  Brain,
  Hash,
  Filter,
  X,
  Bot,
  Sparkles,
  Zap,
  ZapOff,
  UserCheck,
  CheckCheck,
  Smartphone,
  HelpCircle,
  TrendingUp,
  Archive,
  Ban,
  MessageCircle,
  RefreshCw,
  BellOff
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatMessage {
  id: string;
  senderName: string;
  senderNumber: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  modelUsed?: string;
  createdAt?: number;
}

interface ChatSession {
  id: string;
  contactName: string;
  contactNumber: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: ChatMessage[];
  aiEnabled: boolean;
  muted?: boolean;
  lastMessageAt?: number;
  profilePictureUrl?: string;
}

export default function ConversationsPage() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ai-enabled' | 'ai-disabled' | 'pribadi' | 'group' | 'muted'>('all');
  const [whatsappStatus, setWhatsappStatus] = useState({ connected: false, status: 'disconnected', number: '', name: '' });
  const [sendingState, setSendingState] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial loads and background polling every 2.5 seconds to sync data
  const fetchChats = async (selectFirst = false) => {
    try {
      const res = await fetch('/api/whatsapp/chats');
      if (res.ok) {
        const data: ChatSession[] = await res.json();
        setChats(data);
        if (selectFirst && data.length > 0 && !selectedChatId) {
          setSelectedChatId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setWhatsappStatus(data);
      }
    } catch (err) {
      console.error('Failed to load connection status:', err);
    }
  };

  useEffect(() => {
    fetchChats(true);
    fetchStatus();

    const interval = setInterval(() => {
      fetchChats(false);
      fetchStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Update selection & automatically clear unread counters
  useEffect(() => {
    if (selectedChatId) {
      const selected = chats.find(c => c.id === selectedChatId);
      if (selected && selected.unreadCount > 0) {
        fetch('/api/whatsapp/chats/clear-unread', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: selectedChatId })
        }).then(() => {
          setChats(prev => prev.map(c => {
            if (c.id === selectedChatId) {
              return { ...c, unreadCount: 0 };
            }
            return c;
          }));
        }).catch(err => console.error('Failed to clear unread:', err));
      }

      // Refresh profile picture URL in background to keep avatars real & synced with WA
      fetch('/api/whatsapp/chats/refresh-pp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: selectedChatId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profilePictureUrl) {
          setChats(prev => prev.map(c => {
            if (c.id === selectedChatId) {
              return { ...c, profilePictureUrl: data.profilePictureUrl };
            }
            return c;
          }));
        }
      })
      .catch(() => {});

      setTimeout(scrollToBottom, 80);
    }
  }, [selectedChatId]);

  // Smooth auto-scroll function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper to format localized synchronized local time (browser zone) in 24-hr layout (e.g. 15:52)
  const formatLocalTime = (lastMessageAt: number | undefined, serverTimeStr: string) => {
    if (!lastMessageAt) {
      return serverTimeStr;
    }
    try {
      const date = new Date(lastMessageAt);
      if (!isNaN(date.getTime())) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    } catch (_) {}
    return serverTimeStr;
  };

  // Toggle silent / mute bot replies (Senyap Bot) immediately without popups
  const handleToggleMute = async (chatId: string) => {
    try {
      const res = await fetch('/api/whatsapp/chats/toggle-mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });
      if (res.ok) {
        const data = await res.json();
        setChats(prev => prev.map(c => {
          if (c.id === chatId) {
            return { ...c, muted: data.muted };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };

  // Scroll to bottom when message log length changes
  const selectedChat = chats.find(c => c.id === selectedChatId);
  const messagesCount = selectedChat?.messages?.length || 0;
  useEffect(() => {
    scrollToBottom();
  }, [messagesCount]);

  // Sync WhatsApp contact sessions
  const handleSyncChats = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/whatsapp/chats/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Sinkronisasi selesai!');
        fetchChats();
      } else {
        alert(data.error || 'Gagal melakukan sinkronisasi.');
      }
    } catch (err) {
      console.error('Network sync error:', err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSyncing(false);
    }
  };

  // Manual dashboard message sending (for local temp rendering if needed, but input is removed)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const currentMsg = message;
    setMessage('');
    setSendingState(true);

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const tempMsgId = 'temp-' + now.getTime();
    const updatedChats = chats.map(c => {
      if (c.id === selectedChat.id) {
        return {
          ...c,
          lastMessage: currentMsg,
          timestamp: timeString,
          messages: [
            ...c.messages,
            {
              id: tempMsgId,
              senderName: "FanraBot",
              senderNumber: "bot",
              text: currentMsg,
              timestamp: timeString,
              isMe: true
            }
          ]
        };
      }
      return c;
    });
    setChats(updatedChats);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch('/api/whatsapp/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.id,
          message: currentMsg
        })
      });
      if (res.ok) {
        fetchChats();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingState(false);
    }
  };

  // Toggle AI bot replies for specific chat
  const handleToggleAI = async (chatId: string) => {
    try {
      const res = await fetch('/api/whatsapp/chats/toggle-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });
      if (res.ok) {
        setChats(prev => prev.map(c => {
          if (c.id === chatId) {
            return { ...c, aiEnabled: !c.aiEnabled };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Failed to toggle AI state:', err);
    }
  };

  // Filter list based on search and selected toggle
  const filteredChats = chats.filter(chat => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    const matchesSearch = !cleanQuery || 
                          chat.contactName.toLowerCase().includes(cleanQuery) || 
                          chat.lastMessage.toLowerCase().includes(cleanQuery) || 
                          chat.contactNumber.includes(cleanQuery);
                          
    if (!matchesSearch) return false;
    
    if (filterType === 'ai-enabled') {
      return chat.aiEnabled && !chat.muted;
    }
    if (filterType === 'ai-disabled') {
      return !chat.aiEnabled && !chat.muted;
    }
    if (filterType === 'pribadi') {
      return !chat.id.endsWith('@g.us') && !chat.muted;
    }
    if (filterType === 'group') {
      return chat.id.endsWith('@g.us') && !chat.muted;
    }
    if (filterType === 'muted') {
      return !!chat.muted;
    }
    return true; // 'all'
  });

  return (
    <div className="h-[calc(100vh-124px)] md:h-[calc(100vh-64px)] w-full flex bg-white overflow-hidden relative selection:bg-primary/20 pb-0">
      
      {/* Kolom Kiri - List Percakapan */}
      <div className={cn(
        "w-full md:w-[320px] border-r border-outline flex flex-col bg-surface-subtle shrink-0 transition-all duration-300",
        view === 'chat' ? "hidden md:flex" : "flex"
      )}>
        
        {/* Hubungkan Status WhatsApp Indicator */}
        <div className="p-3 bg-white border-b border-outline">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-on-surface uppercase tracking-wider">Percakapan</h2>
            {/* Small synchronization button replacing the old status badge position */}
            <button
              onClick={handleSyncChats}
              disabled={syncing}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-[9px] font-black rounded-lg transition-all border shrink-0 cursor-pointer",
                syncing 
                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" 
                  : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              )}
            >
              <RefreshCw className={cn("w-2.5 h-2.5", syncing && "animate-spin")} />
              {syncing ? "SINKRON..." : "SINKRONKAN"}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-muted/60" />
            <input 
              type="text" 
              placeholder="Cari pesan atau nomor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-muted border border-outline/30 focus:ring-1 focus:ring-primary/25 focus:border-primary rounded-xl text-xs font-semibold placeholder:text-on-surface-muted/50" 
            />
          </div>
        </div>

        {/* Filter Tab Buttons with no icons */}
        <div className="px-3 py-1.5 border-b border-outline/40 bg-white flex flex-wrap gap-1 items-center shrink-0">
          <button 
            onClick={() => setFilterType('all')}
            className={cn(
              "px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer",
              filterType === 'all' 
                ? "bg-primary text-white" 
                : "bg-surface-muted text-on-surface-muted hover:bg-surface-muted/85"
            )}
          >
            Semua ({chats.length})
          </button>
          
          <button 
            onClick={() => setFilterType('ai-enabled')}
            className={cn(
              "px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer",
              filterType === 'ai-enabled' 
                ? "bg-primary text-white" 
                : "bg-surface-muted text-on-surface-muted hover:bg-surface-muted/85"
            )}
          >
            AI ({chats.filter(c => c.aiEnabled && !c.muted).length})
          </button>

          <button 
            onClick={() => setFilterType('ai-disabled')}
            className={cn(
              "px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer",
              filterType === 'ai-disabled' 
                ? "bg-primary text-white" 
                : "bg-surface-muted text-on-surface-muted hover:bg-surface-muted/85"
            )}
          >
            Man ({chats.filter(c => !c.aiEnabled && !c.muted).length})
          </button>

          <button 
            onClick={() => setFilterType('pribadi')}
            className={cn(
              "px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer",
              filterType === 'pribadi' 
                ? "bg-primary text-white" 
                : "bg-surface-muted text-on-surface-muted hover:bg-surface-muted/85"
            )}
          >
            Pribadi ({chats.filter(c => !c.id.endsWith('@g.us') && !c.muted).length})
          </button>

          <button 
            onClick={() => setFilterType('group')}
            className={cn(
              "px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer",
              filterType === 'group' 
                ? "bg-primary text-white" 
                : "bg-surface-muted text-on-surface-muted hover:bg-surface-muted/85"
            )}
          >
            Grup ({chats.filter(c => c.id.endsWith('@g.us') && !c.muted).length})
          </button>

          <button 
            onClick={() => setFilterType('muted')}
            className={cn(
              "px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer",
              filterType === 'muted' 
                ? "bg-primary text-white" 
                : "bg-surface-muted text-on-surface-muted hover:bg-surface-muted/85"
            )}
          >
            Senyap ({chats.filter(c => c.muted).length})
          </button>
        </div>

        {/* Chat List Box */}
        <div className="flex-grow overflow-y-auto divide-y divide-outline/20">
          {filteredChats.length === 0 ? (
            <div className="p-6 text-center space-y-1">
              <MessageCircle className="w-6 h-6 text-on-surface-muted mx-auto opacity-30" />
              <p className="text-[10px] font-medium text-on-surface-muted">Tidak ada percakapan.</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => {
                  setSelectedChatId(chat.id);
                  setView('chat');
                }}
                className={cn(
                  "p-3 cursor-pointer hover:bg-white transition-all relative flex flex-col gap-1 border-l-2",
                  selectedChatId === chat.id 
                    ? "bg-white border-primary z-10 shadow-sm" 
                    : "border-transparent"
                )}
              >
                <div className="flex gap-2.5 items-start">
                  {chat.profilePictureUrl ? (
                    <img 
                      src={chat.profilePictureUrl} 
                      alt={chat.contactName} 
                      className="w-8 h-8 rounded-full shrink-0 object-cover border border-outline/30 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border uppercase",
                      chat.id.endsWith('@g.us') 
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/10" 
                        : "bg-primary/10 text-primary border-primary/10"
                    )}>
                      {chat.contactName.substring(0, 2)}
                    </div>
                  )}
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="text-xs font-bold text-on-surface truncate pr-1 flex items-center gap-1">
                        {chat.contactName}
                        {chat.muted && <BellOff className="w-3 h-3 text-amber-500 shrink-0" />}
                      </h4>
                      <span className="text-[9px] font-semibold text-on-surface-muted shrink-0">
                        {formatLocalTime(chat.lastMessageAt, chat.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-muted truncate pr-2">{chat.lastMessage}</p>
                  </div>
                </div>

                {/* Status Badges Row */}
                <div className="flex items-center justify-between pl-10.5 pt-0.5">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAI(chat.id);
                      }}
                      className={cn(
                        "flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider border cursor-pointer transition-all",
                        chat.aiEnabled 
                          ? "bg-green-500/10 text-green-700 border-green-500/15 hover:bg-green-500/20" 
                          : "bg-red-500/10 text-red-700 border-red-500/15 hover:bg-red-500/20"
                      )}
                    >
                      {chat.aiEnabled ? "AI Aktif" : "Tidak Aktif"}
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMute(chat.id);
                      }}
                      className={cn(
                        "flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider border cursor-pointer transition-all",
                        chat.muted 
                          ? "bg-amber-500/10 text-amber-700 border-amber-500/15 hover:bg-amber-500/20" 
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      )}
                    >
                      {chat.muted ? "Senyap" : "Bersuara"}
                    </button>

                    {chat.id.endsWith('@g.us') ? (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-black rounded uppercase border border-purple-200">
                        Grup
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black rounded uppercase border border-blue-200">
                        Pribadi
                      </span>
                    )}
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="h-4 min-w-[16px] px-1 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Kolom Tengah - Desk Workspace Chat */}
      <div className={cn(
        "flex-grow flex flex-col min-w-0 bg-white transition-all duration-300",
        view === 'list' && !selectedChat ? "hidden md:flex justify-center items-center p-8 bg-surface-subtle" : "flex"
      )}>
        {selectedChat ? (
          <>
            {/* Header Diskusi */}
            <div className="p-3 border-b border-outline flex items-center justify-between bg-white z-20 shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setView('list')}
                  className="p-1 text-on-surface-muted hover:bg-surface-muted rounded-lg transition-all md:hidden"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {selectedChat.profilePictureUrl ? (
                  <img 
                    src={selectedChat.profilePictureUrl} 
                    alt={selectedChat.contactName} 
                    className="w-8 h-8 rounded-full border border-outline/30 object-cover shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border uppercase shrink-0",
                    selectedChat.id.endsWith('@g.us') 
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/10" 
                      : "bg-primary/10 text-primary border-primary/10"
                  )}>
                    {selectedChat.contactName.substring(0, 1)}
                  </div>
                )}
                
                <div>
                  <h3 className="font-extrabold text-xs text-on-surface leading-tight">{selectedChat.contactName}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button 
                      onClick={() => handleToggleAI(selectedChat.id)}
                      className={cn(
                        "px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider border cursor-pointer transition-colors",
                        selectedChat.aiEnabled 
                          ? "bg-green-500/10 text-green-700 border-green-500/15 hover:bg-green-500/20" 
                          : "bg-red-500/10 text-red-700 border-red-500/15 hover:bg-red-500/20"
                      )}
                      title="Klik untuk mengubah status AI"
                    >
                      {selectedChat.aiEnabled ? "AI Aktif" : "Tidak Aktif"}
                    </button>
                    
                    <span className={cn(
                      "px-1.5 py-0.5 text-[8px] font-black rounded uppercase border tracking-wider",
                      selectedChat.id.endsWith('@g.us')
                        ? "bg-purple-100 text-purple-700 border-purple-200"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                    )}>
                      {selectedChat.id.endsWith('@g.us') ? "Grup" : "Pribadi"}
                    </span>

                    {selectedChat.muted && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/10 text-amber-700 text-[8px] font-black rounded uppercase border border-amber-500/15">
                        <BellOff className="w-2 h-2 shrink-0" />
                        Senyap
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Aksi Toggle Detail Info */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setShowInfo(!showInfo)}
                  className={cn(
                    "p-1.5 rounded-lg transition-all border cursor-pointer",
                    showInfo ? "bg-primary/10 text-primary border-primary/20" : "text-on-surface-muted hover:bg-surface-muted border-outline/30"
                  )}
                  title="Detail Kontak"
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bubble Chat Logger */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 bg-slate-50/50">
              <div className="flex flex-col items-center mb-2">
                <span className="px-3 py-1 bg-white border border-outline/20 rounded-full text-[8px] font-bold text-on-surface-muted tracking-wider uppercase">
                  SINKRONISASI AKTIF
                </span>
              </div>

              {selectedChat.messages.length === 0 ? (
                <div className="text-center py-8 text-on-surface-muted space-y-1">
                  <MessageCircle className="w-8 h-8 text-primary/10 mx-auto" />
                  <p className="text-xs font-semibold">Belum ada obrolan terekam di nomor ini.</p>
                  <p className="text-[10px]">Pesan masuk dari chat Anda akan otomatis tersinkronisasi di sini.</p>
                </div>
              ) : (
                selectedChat.messages.map((msg, index) => {
                  const isSystemMsg = msg.modelUsed === 'System';
                  const isMe = msg.isMe;

                  if (isSystemMsg) {
                    return (
                      <div key={msg.id || index} className="flex justify-center">
                        <span className="px-3 py-1 bg-amber-50 border border-amber-150 text-amber-600 rounded-lg text-[11px] font-semibold text-center max-w-sm">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id || index} 
                      className={cn(
                        "flex items-start gap-2",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-surface-muted border border-outline/20 flex items-center justify-center text-[9px] font-black text-on-surface-muted uppercase mt-0.5 shrink-0">
                          {msg.senderName.substring(0, 1)}
                        </div>
                      )}

                      <div className="flex flex-col max-w-[85%] md:max-w-[75%]">
                        {/* Compact Bubble Layout */}
                        <div className={cn(
                          "p-2.5 px-3.5 rounded-2xl shadow-sm text-xs",
                          isMe 
                            ? "bg-primary text-white rounded-tr-none" 
                            : "bg-white border border-outline/40 text-on-surface rounded-tl-none"
                        )}>
                          
                          {/* Nama Pengirim pada Grup Chat */}
                          {selectedChat.id.endsWith('@g.us') && !isMe && (
                            <span className="block text-[9px] font-black text-primary uppercase tracking-wide mb-0.5 opacity-80">
                              {msg.senderName}
                            </span>
                          )}

                          <p className="font-medium leading-normal whitespace-pre-wrap select-text selection:bg-white/20">
                            {msg.text}
                          </p>

                          <div className={cn(
                            "mt-1.5 flex items-center gap-1 justify-end text-[8px] font-bold uppercase tracking-wider",
                            isMe ? "text-white/70" : "text-on-surface-muted/60"
                          )}>
                            <span>{formatLocalTime(msg.createdAt, msg.timestamp)}</span>
                            {msg.modelUsed && (
                              <span className={cn(
                                "flex items-center gap-0.5 px-1 py-0.2 rounded text-[7px] font-black",
                                isMe ? "bg-white/20 text-white" : "bg-primary/5 text-primary border border-primary/10"
                              )}>
                                <Cpu className="w-2 h-2" />
                                {msg.modelUsed}
                              </span>
                            )}
                            {isMe && <CheckCheck className="w-3 h-3 text-white/70 shrink-0" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-50/50 text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="text-xs font-extrabold text-on-surface">Pilih Percakapan</h3>
              <p className="text-[10px] text-on-surface-muted">Silakan pilih salah satu kontak di menu kiri untuk memonitor percakapan aktif.</p>
            </div>
          </div>
        )}
      </div>

      {/* Kolom Kanan - Detail Kontak / Laci Drawer */}
      {selectedChat && showInfo && (
        <div className={cn(
          "absolute inset-y-0 right-0 w-72 md:relative md:w-72 border-l border-outline flex flex-col bg-white transition-all duration-300 z-30 shadow-xl md:shadow-none shrink-0"
        )}>
          <div className="p-3 border-b border-outline flex items-center justify-between bg-surface-muted/30 shrink-0">
            <h3 className="text-[9px] font-black text-on-surface-muted uppercase tracking-wider ml-1">Detail Kontak</h3>
            <button 
              onClick={() => setShowInfo(false)}
              className="p-1 hover:bg-outline/20 rounded-lg transition-all border border-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto">
            <div className="p-6 text-center space-y-3 border-b border-outline/30 text-center">
              {selectedChat.profilePictureUrl ? (
                <img 
                  src={selectedChat.profilePictureUrl} 
                  alt={selectedChat.contactName} 
                  className="w-16 h-16 rounded-full mx-auto border border-outline/30 object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/5 mx-auto border border-primary/15 flex items-center justify-center text-primary font-black text-xl uppercase">
                  {selectedChat.contactName.substring(0, 1)}
                </div>
              )}
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-on-surface tracking-tight">{selectedChat.contactName}</h3>
                <div className="flex items-center justify-center gap-1">
                  <Smartphone className="w-3 h-3 text-on-surface-muted" />
                  <p className="text-[10px] font-bold text-on-surface-muted">
                    +{selectedChat.contactNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              
              {/* Tags Section */}
              <section className="space-y-1.5">
                <h4 className="text-[8px] font-black text-on-surface-muted uppercase tracking-wider">
                  Kategori
                </h4>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 bg-primary/5 text-primary text-[9px] font-black rounded border border-primary/10 uppercase tracking-wider">
                    Customer
                  </span>
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded border border-green-100 uppercase tracking-wider">
                    Potensial
                  </span>
                </div>
              </section>

              {/* Manual Operations (Mute / Unmute) */}
              <div className="pt-3 border-t border-outline/20 space-y-2">
                <button 
                  onClick={() => handleToggleMute(selectedChat.id)}
                  className={cn(
                    "w-full py-2 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all flex items-center justify-center gap-1.5 border cursor-pointer",
                    selectedChat.muted 
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                      : "bg-amber-50/50 text-amber-600 border-amber-150 hover:bg-amber-150/40 hover:bg-amber-100 text-amber-700"
                  )}
                >
                  <BellOff className="w-3.5 h-3.5" />
                  {selectedChat.muted ? "Aktifkan Bot" : "Senyapkan Bot"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
