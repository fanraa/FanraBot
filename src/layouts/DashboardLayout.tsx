import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, BarChart3, Terminal, Settings } from 'lucide-react';

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'warning' | 'error' | 'success' } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Route protection gating: Check for active login session & Sync user profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Sync latest user profile details (such as avatar/profile picture) from database
    const syncUserProfile = async () => {
      try {
        const res = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const profileData = await res.json();
          const currentLocalUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : {};
          const updatedUser = {
            ...currentLocalUser,
            username: profileData.username,
            email: profileData.email,
            avatar: profileData.avatar || ''
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          // Broadcast local storage update event
          window.dispatchEvent(new Event('userUpdate'));
        }
      } catch (err) {
        console.error('Error auto-syncing user profile:', err);
      }
    };

    syncUserProfile();
  }, [navigate]);

  // Global Toast Handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleToastEvent = (e: Event) => {
      const customEx = e as CustomEvent<{ message: string; type?: 'info' | 'warning' | 'error' | 'success' }>;
      if (customEx.detail) {
        if (timeoutId) clearTimeout(timeoutId);
        setToast({
          msg: customEx.detail.message,
          type: customEx.detail.type || 'success'
        });
        timeoutId = setTimeout(() => {
          setToast(null);
        }, 4000);
      }
    };

    window.addEventListener('show-toast' as any, handleToastEvent);
    return () => {
      window.removeEventListener('show-toast' as any, handleToastEvent);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const mobileNavItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { icon: BarChart3, label: 'Stats', path: '/dashboard/analytics' },
    { icon: Terminal, label: 'Commands', path: '/dashboard/commands' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <div className="h-screen bg-background flex overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar - Desktop Version */}
      <Sidebar className="hidden lg:flex lg:z-30" onItemClick={() => setIsSidebarOpen(false)} />

      {/* Sidebar - Mobile Version (Slide-In) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            className="fixed top-0 left-0 h-screen w-64 z-[70] lg:hidden"
          >
            <Sidebar className="relative z-[70]" onItemClick={() => setIsSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:ml-64 transition-all overflow-hidden relative">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <div className={cn(
          "flex-1 overflow-y-auto w-full pb-20 md:pb-8",
          location.pathname === '/dashboard/conversations' || location.pathname === '/dashboard/ai-provider' ? "p-0" : "p-6 md:p-8"
        )}>
          <div className={cn(
            "mx-auto h-full",
            location.pathname === '/dashboard/conversations' || location.pathname === '/dashboard/ai-provider' ? "max-w-none" : "max-w-[1440px]"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={cn(location.pathname === '/dashboard/conversations' || location.pathname === '/dashboard/ai-provider' ? "h-full" : "")}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar - with slightly rounded corners (rounded-lg) */}
        <nav className="fixed bottom-0 left-0 w-full flex md:hidden justify-around items-center px-4 py-3 bg-white border-t border-outline z-50 shadow-lg">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-3 transition-all",
                  isActive 
                    ? "bg-primary/10 text-primary rounded-lg font-medium" 
                    : "text-on-surface-muted hover:text-on-surface"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </main>

      {/* Global Toast Notification */}
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
    </div>
  );
};

