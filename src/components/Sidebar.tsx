import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  QrCode, 
  Cpu, 
  Route as RouterIcon, 
  Settings, 
  Terminal, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  History, 
  UserCircle,
  Bot,
  LogOut,
  Gift
} from 'lucide-react';
import { cn } from '../lib/utils';
import defaultAvatar from '../assets/default_avatar.jpg';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: QrCode, label: 'Hubungkan WhatsApp', path: '/dashboard/connect' },
  { icon: Cpu, label: 'AI Provider', path: '/dashboard/providers' },
  { icon: RouterIcon, label: 'AI Router', path: '/dashboard/router' },
  { icon: Settings, label: 'Pengaturan Bot', path: '/dashboard/settings' },
  { icon: Terminal, label: 'Perintah Bot', path: '/dashboard/commands' },
  { icon: Zap, label: 'Otomatisasi', path: '/dashboard/automation' },
  { icon: MessageSquare, label: 'Percakapan', path: '/dashboard/conversations' },
  { icon: Gift, label: 'Fanra Rewards', path: '/dashboard/rewards' },
  { icon: BarChart3, label: 'Analitik', path: '/dashboard/analytics' },
  { icon: History, label: 'Log Sistem', path: '/dashboard/logs' },
  { icon: UserCircle, label: 'Pengaturan Akun', path: '/dashboard/account' },
];

export const Sidebar = ({ onItemClick, className }: { onItemClick?: () => void; className?: string }) => {
  const navigate = useNavigate();

  // Load actual user details from localStorage statefully
  const [user, setUser] = React.useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

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

  const [logoutConfirm, setLogoutConfirm] = React.useState(false);

  const displayName = user?.username || 'Fanra';
  const displayEmail = user?.email || 'fanra@fanrabot.ai';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    if (!logoutConfirm) {
      setLogoutConfirm(true);
      // Auto-reset after 4 seconds of inactivity
      setTimeout(() => {
        setLogoutConfirm(false);
      }, 4000);
      return;
    }

    localStorage.clear();
    sessionStorage.clear();
    try {
      if (window.indexedDB && window.indexedDB.databases) {
        window.indexedDB.databases().then((dbs) => {
          dbs.forEach((dbInfo) => {
            if (dbInfo.name) {
              window.indexedDB.deleteDatabase(dbInfo.name);
            }
          });
        });
      }
    } catch (err) {
      console.warn('Failed to clear IndexedDB databases:', err);
    }
    navigate('/login');
  };

  return (
    <aside className={cn("w-64 h-screen bg-surface-subtle border-r border-outline flex flex-col fixed left-0 top-0 overflow-y-auto z-40", className)}>
      <div className="p-6 flex items-center gap-3">
        <img 
          src="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578024/file_0000000030647209b33b695fffe52c90_gi9rwf.png" 
          alt="FanraBot Logo" 
          className="h-9 w-auto object-contain shrink-0"
          referrerPolicy="no-referrer"
        />
        <span className="text-xl font-bold tracking-tight text-[#111827] font-brand tracking-[-0.03em] select-none">FanraBot</span>
      </div>
      
      <nav className="flex-1 px-4 py-2 space-y-1">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            onClick={onItemClick}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all group",
              isActive 
                ? "bg-white text-primary shadow-sm" 
                : "text-on-surface-variant hover:bg-surface-muted"
            )}
          >
            <item.icon className={cn("w-5 h-5", "group-hover:scale-110 transition-transform")} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 mt-auto border-t border-outline">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-outline/30 bg-slate-100">
              <img 
                src={user?.avatar || defaultAvatar} 
                alt="Profile" 
                className="w-full h-full object-cover animate-fade-in" 
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold truncate text-on-surface">{displayName}</p>
              <p className="text-[10px] text-on-surface-muted truncate">{displayEmail}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title={logoutConfirm ? "Klik sekali lagi untuk keluar sesi" : "Keluar Sesi"}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1 text-xs font-semibold select-none",
              logoutConfirm 
                ? "bg-red-600 text-white hover:bg-red-700 hover:shadow-md animate-pulse shadow-sm px-2.5 py-1.5" 
                : "text-on-surface-muted hover:text-red-600 hover:bg-red-50"
            )}
          >
            <LogOut className={cn("w-4 h-4", logoutConfirm && "scale-110")} />
            {logoutConfirm && <span className="text-[10px] font-bold">Keluar?</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
