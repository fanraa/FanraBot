import React, { useState } from 'react';
import { Bell, Search, Menu, X, MessageSquare, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/default_avatar.jpg';

export const Topbar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  // Load actual user details from localStorage statefully
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  const [notifications, setNotifications] = useState<any[]>([]);

  React.useEffect(() => {
    const handleUpdate = () => {
      const userStr = localStorage.getItem('user');
      setUser(userStr ? JSON.parse(userStr) : null);
    };
    window.addEventListener('userUpdate', handleUpdate);
    return () => {
      window.removeEventListener('userUpdate', handleUpdate);
    };
  }, []);

  // Fetch real notification logs
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/whatsapp/logs');
      if (res.ok) {
        const logData = await res.json();
        // Grab the top 5 newest notifications
        const formatted = logData.slice(0, 5).map((log: any) => {
          let icon = <Info className="w-4 h-4 text-blue-500" />;
          if (log.status === 'success') {
            icon = <CheckCircle2 className="w-4 h-4 text-green-500" />;
          } else if (log.status === 'error') {
            icon = <AlertCircle className="w-4 h-4 text-red-500" />;
          } else if (log.status === 'warning') {
            icon = <AlertCircle className="w-4 h-4 text-orange-500" />;
          }

          // Simple relative/time display helper
          const formatTimeStr = (ts: string) => {
            if (!ts) return 'Baru saja';
            try {
              const parts = ts.split(' ');
              if (parts.length > 1) {
                return parts[1].substring(0, 5); // Returns HH:MM
              }
              return ts;
            } catch {
              return ts;
            }
          };

          return {
            id: log.id,
            icon,
            title: log.event || 'Aktivitas Bot',
            desc: log.detail || '',
            time: formatTimeStr(log.timestamp)
          };
        });
        setNotifications(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch topbar notifications:', err);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 60000);
    return () => clearInterval(timer);
  }, []);

  const displayName = user?.username || 'Fanra';
  const displayAvatar = user?.avatar || defaultAvatar;

  return (
    <header className="h-16 border-b border-outline bg-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4 h-full">
        <button 
          onClick={onMenuClick}
          className="p-2 lg:hidden text-on-surface-variant hover:bg-surface-muted rounded-md flex items-center justify-center cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* FanraBot logo on mobile */}
        <span className="lg:hidden text-lg font-bold text-[#111827] font-brand tracking-[-0.03em] flex items-center h-full select-none">FanraBot</span>

        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-on-surface-muted" />
          <input 
            type="text" 
            placeholder="Cari fitur atau data..."
            className="pl-10 pr-4 py-1.5 bg-surface-muted border border-outline rounded-lg text-sm w-56 outline-none transition-all focus:border-primary/50 focus:w-64"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4 h-full">
        <div className="relative flex items-center gap-2 sm:gap-3 h-full">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "p-2 rounded-lg transition-all duration-300 flex items-center justify-center cursor-pointer relative",
              showNotifications ? "bg-primary/10 text-primary" : "text-on-surface-muted hover:bg-surface-muted hover:text-on-surface"
            )}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* User Profile Avatar Exactly Like the HTML */}
          <div 
            onClick={() => navigate('/dashboard/account')}
            className="flex items-center gap-2 cursor-pointer hover:bg-surface-muted/60 p-1.5 rounded-lg transition-colors h-full"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-primary-container shrink-0 border border-outline-variant flex items-center justify-center">
              <img 
                alt="Profile" 
                className="w-full h-full object-cover" 
                src={displayAvatar}
              />
            </div>
            <span className="hidden sm:block text-xs font-semibold text-on-surface">{displayName}</span>
          </div>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowNotifications(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-60 bg-white border border-outline rounded-lg shadow-2xl z-50 overflow-hidden origin-top-right"
                >
                  {/* Arrow Pointing upwards - Aligned with the bell icon */}
                  <div className="absolute top-0 right-[68px] -mt-1.5 w-3 h-3 bg-white border-t border-l border-outline rotate-45 z-[-1] rounded-tl-[2px]" />
                  
                  <div className="p-3 border-b border-outline flex items-center justify-between bg-white relative z-10">
                    <h3 className="text-[10px] font-bold text-on-surface-muted uppercase">Notifikasi</h3>
                    <button onClick={() => setShowNotifications(false)}>
                      <X className="w-3 h-3 text-on-surface-muted hover:text-on-surface transition-colors" />
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto bg-white relative z-10">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className="p-2.5 border-b border-outline last:border-0 hover:bg-surface-muted/50 cursor-pointer transition-colors group"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/dashboard/logs');
                        }}
                      >
                        <div className="flex gap-2">
                          <div className="mt-0.5 shrink-0 scale-75 opacity-70 group-hover:opacity-100 transition-all duration-300">{notif.icon}</div>
                          <div className="space-y-0 overflow-hidden">
                            <h4 className="text-[9px] font-bold text-on-surface group-hover:text-primary transition-colors truncate">{notif.title}</h4>
                            <p className="text-[9px] text-on-surface-variant leading-tight line-clamp-1 opacity-70 group-hover:opacity-100">{notif.desc}</p>
                            <span className="text-[7px] font-medium text-on-surface-muted flex items-center gap-1 mt-0.5">
                              {notif.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/dashboard/logs');
                    }}
                    className="w-full py-2 bg-surface-muted text-[10px] font-bold text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center uppercase"
                  >
                    Lihat Semua
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
