import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Smartphone, 
  Laptop,
  Monitor,
  LogOut, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Globe,
  Camera,
  Check,
  X,
  CreditCard,
  ShieldAlert,
  Loader2,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import defaultAvatar from '../assets/default_avatar.jpg';

export default function AccountPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read initial user state from localStorage
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : {
      username: 'Fanra',
      email: 'irfanrizkiaditri@gmail.com',
      avatar: ''
    };
  });

  // Simple state variables
  const [fullName, setFullName] = useState(user.username || 'Fanra');
  const [username, setUsername] = useState(user.username ? user.username.toLowerCase().replace(/\s+/g, '') : 'fanra');
  
  // Custom password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sesi / Login Session States
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Active Language State
  const [activeLang, setActiveLang] = useState<'id' | 'en'>('id');

  // Double confirmation button states
  const [logoutConfirmState, setLogoutConfirmState] = useState<'idle' | 'confirm'>('idle');
  const [deleteConfirmState, setDeleteConfirmState] = useState<'idle' | 'confirm'>('idle');

  // Input states and toggle eyes
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Trigger floating notifications using global system
  const triggerToast = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: text, type }
    }));
  };

  // Compress uploaded avatar to safe, clean size under 50KB to preserve Firestore limits securely
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8)); // Clean 80% JPEG compression
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  };

  // Helper to determine the device icon and color dynamically based on userAgent and deviceName
  const getDeviceIconAndMeta = (sess: any) => {
    const devName = (sess.deviceName || '').toLowerCase();
    const ua = (sess.userAgent || '').toLowerCase();

    const isMobile = devName.includes('android') || devName.includes('ios') || devName.includes('phone') || devName.includes('iphone') || devName.includes('ipad') || ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('mobile');
    const isTablet = devName.includes('tablet') || devName.includes('ipad') || ua.includes('ipad') || ua.includes('tablet');
    
    let osLabel = 'Device Web';
    let iconColor = 'text-slate-500';
    let labelColor = 'bg-slate-100 text-slate-700';

    if (devName.includes('windows') || ua.includes('windows')) {
      osLabel = 'Windows PC';
      iconColor = 'text-blue-500';
      labelColor = 'bg-blue-50 text-blue-700 border border-blue-100/60';
    } else if (devName.includes('mac') || ua.includes('mac os') || ua.includes('macintosh')) {
      osLabel = 'macOS Desktop';
      iconColor = 'text-slate-800';
      labelColor = 'bg-slate-100 text-slate-800 border border-slate-200/60';
    } else if (devName.includes('linux') || ua.includes('linux')) {
      osLabel = 'Linux PC';
      iconColor = 'text-orange-500';
      labelColor = 'bg-orange-50 text-orange-700 border border-orange-100/60';
    } else if (devName.includes('android') || ua.includes('android')) {
      osLabel = 'Android Phone';
      iconColor = 'text-green-500';
      labelColor = 'bg-green-50/80 text-green-700 border border-green-100/60';
    } else if (devName.includes('iphone') || ua.includes('iphone') || devName.includes('ios') || ua.includes('ios')) {
      osLabel = 'Apple iPhone';
      iconColor = 'text-rose-500';
      labelColor = 'bg-rose-50/80 text-rose-700 border border-rose-100/60';
    } else if (devName.includes('ipad') || ua.includes('ipad')) {
      osLabel = 'Apple iPad';
      iconColor = 'text-indigo-500';
      labelColor = 'bg-indigo-50/80 text-indigo-700 border border-indigo-100/60';
    }

    return {
      isMobile,
      isTablet,
      osLabel,
      iconColor,
      labelColor
    };
  };

  // Helper to compute live password security strength in Indonesian language
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200', textClass: 'text-slate-400', width: '0%' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) {
      return { score: 1, label: 'Lembek / Sangat Lemah 👎', color: 'bg-red-500', textClass: 'text-red-500 font-bold', width: '25%' };
    } else if (score === 2) {
      return { score: 2, label: 'Sedang / Cukup Aman ⚠️', color: 'bg-amber-400', textClass: 'text-amber-500 font-bold', width: '50%' };
    } else if (score === 3) {
      return { score: 3, label: 'Kuat / Aman 👍', color: 'bg-blue-500', textClass: 'text-blue-500 font-bold', width: '75%' };
    } else {
      return { score: 4, label: 'Sangat Kuat / Super Aman 💪', color: 'bg-green-500', textClass: 'text-green-600 font-bold', width: '100%' };
    }
  };

  // Fetch secure profile details & real logged-in sessions on mount
  useEffect(() => {
    const fetchProfileAndSessions = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Fetch secure profile from database
        const profileRes = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (profileRes.ok) {
          const pData = await profileRes.json();
          setUser(pData);

          const currentLocalUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : {};
          const updatedUser = {
            ...currentLocalUser,
            username: pData.username,
            email: pData.email,
            avatar: pData.avatar || ''
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('userUpdate'));

          setFullName(pData.username);
          setUsername(pData.username ? pData.username.toLowerCase().replace(/\s+/g, '') : '');
        }

        // Fetch real sessions list
        fetchSessionsList();
      } catch (err) {
        console.error('Error fetching details on mount:', err);
      }
    };

    fetchProfileAndSessions();
  }, []);

  // Fetch real-time active database sessions
  const fetchSessionsList = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoadingSessions(true);
    try {
      const sessionsRes = await fetch('/api/auth/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        setSessionsList(sData);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Profile update handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Full name validation checks
    if (!fullName.trim()) {
      triggerToast('Nama Lengkap tidak boleh kosong.', 'error');
      return;
    }
    if (fullName.trim().length < 3) {
      triggerToast('Nama Lengkap terlalu pendek (minimal 3 karakter).', 'error');
      return;
    }
    if (fullName.trim().length > 50) {
      triggerToast('Nama Lengkap terlalu panjang (maksimal 50 karakter).', 'error');
      return;
    }

    // 2. Username restrictions: lowercased, no spaces, valid length
    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUser) {
      triggerToast('Username tidak boleh kosong.', 'error');
      return;
    }
    if (cleanUser.length < 3) {
      triggerToast('Username terlalu pendek (minimal 3 karakter).', 'error');
      return;
    }
    if (cleanUser.length > 30) {
      triggerToast('Username terlalu panjang (maksimal 30 karakter).', 'error');
      return;
    }

    // 3. Security validation: Anti cross-site scripting/html markup injections
    const htmlPattern = /<[^>]*>/g;
    if (htmlPattern.test(fullName) || htmlPattern.test(cleanUser)) {
      triggerToast('Input dilarang mengandung format tag HTML atau kode skrip!', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      triggerToast('Sesi Anda tidak valid. Silakan masuk kembali.', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: cleanUser,
          avatar: pendingAvatar !== null ? pendingAvatar : user.avatar
        })
      });
      const data = await res.json();
      setIsUpdatingProfile(false);

      if (!res.ok) {
        triggerToast(data.error || 'Gagal memperbarui profil.', 'error');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setPendingAvatar(null);

      // Broadcast changes so SideBar / TopBar syncs immediately
      window.dispatchEvent(new Event('userUpdate'));
      triggerToast('Profil Anda berhasil diperbarui dengan aman!');
    } catch (err: any) {
      setIsUpdatingProfile(false);
      triggerToast(`Error menghubungi server: ${err.message || err}`, 'error');
    }
  };

  // Avatar Photo Upload (Base64) - Load only into pending state
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Ukuran berkas melebihi batas 5MB.', 'error');
      return;
    }

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      try {
        const compressed = await compressImage(base64Data);
        setPendingAvatar(compressed);
        setIsUploadingAvatar(false);
        triggerToast('Foto profil dimuat dan dioptimalkan! Klik "Perbarui Profil" untuk menyimpan.', 'success');
      } catch (err) {
        setPendingAvatar(base64Data);
        setIsUploadingAvatar(false);
        triggerToast('Foto profil dimuat. Klik "Perbarui Profil" untuk menyimpan.', 'success');
      }
    };
    reader.onerror = () => {
      setIsUploadingAvatar(false);
      triggerToast('Gagal membaca file foto profil.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Avatar Photo Deletion - Discard locally
  const handleDeletePhoto = () => {
    setPendingAvatar('');
    triggerToast('Foto diatur untuk dihapus. Klik "Perbarui Profil" untuk menyimpan.', 'success');
  };

  // Change Password directly inline
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      triggerToast('Seluruh kolom password wajib diisi!', 'error');
      return;
    }

    // Validation matching length requirements
    if (newPassword.length < 6 || newPassword.length > 32) {
      triggerToast('Password baru minimal 6 kata dan maksimal 32 kata.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('Konfirmasi password baru tidak cocok.', 'error');
      return;
    }
    if (newPassword === oldPassword) {
      triggerToast('Kata sandi baru tidak boleh sama dengan kata sandi lama Anda.', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      triggerToast('Sesi masuk Anda habis.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      setIsUpdatingPassword(false);

      if (!res.ok) {
        triggerToast(data.error || 'Gagal mengubah kata sandi.', 'error');
        return;
      }

      triggerToast('Kata sandi Anda berhasil diperbarui secara aman.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setIsUpdatingPassword(false);
      triggerToast(`Gagal memperbarui sandi: ${err.message || err}`, 'error');
    }
  };

  // Disconnect another session
  const handleTerminateSession = async (sessId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/auth/sessions/${sessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        triggerToast('Sesi login telah diputuskan.', 'success');
        fetchSessionsList(); // refresh
      } else {
        const data = await res.json();
        triggerToast(data.error || 'Gagal memutus sesi ini.', 'error');
      }
    } catch (err: any) {
      triggerToast('Kesalahan koneksi ke server: ' + err.message, 'error');
    }
  };

  // Log-out handler with confirmation
  const handleLogoutAction = () => {
    if (logoutConfirmState === 'idle') {
      setLogoutConfirmState('confirm');
      setTimeout(() => setLogoutConfirmState('idle'), 4000);
    } else {
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
    }
  };

  // Permanent Delete Account Action
  const handleDeleteAccountAction = async () => {
    if (deleteConfirmState === 'idle') {
      setDeleteConfirmState('confirm');
      setTimeout(() => setDeleteConfirmState('idle'), 4000);
    } else {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('/api/auth/delete-account', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
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
          triggerToast('Akun Anda telah dinonaktifkan secara permanen.', 'success');
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        } else {
          triggerToast(data.error || 'Gagal menghapus akun permanen.', 'error');
        }
      } catch (err: any) {
        triggerToast('Error menghubungi server untuk hapus akun.', 'error');
      }
    }
  };

  // Helper date visualizer format
  const formatDate = (isoStr: string) => {
    try {
      const dateObj = new Date(isoStr);
      return dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch (err) {
      return isoStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 pb-48">
      
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-on-surface">Account Settings</h1>
        <p className="text-sm text-on-surface-variant font-medium">Kelola akun, tingkat keamanan, dan preferensi bot automation Anda.</p>
      </div>

      {/* PROFIL PUBLIK SECTION */}
      <section className="bg-white border border-outline-variant/60 p-6 md:p-8 shadow-sm rounded-2xl space-y-6">
        <div>
          <h2 className="font-bold text-lg text-on-surface flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profil Publik
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Pantau status, ubah foto profil, dan info orisinal akun Anda.</p>
        </div>

        {/* Profile Avatar Selection Flow */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border border-outline-variant shadow-inner bg-slate-100 flex items-center justify-center">
              <img 
                src={
                  pendingAvatar !== null
                    ? (pendingAvatar === '' ? defaultAvatar : pendingAvatar)
                    : (user.avatar || defaultAvatar)
                } 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 text-center sm:text-left justify-center pt-2">
            <h3 className="font-bold text-sm text-on-surface">Foto Profil</h3>
            <p className="text-[10px] sm:text-[11px] text-on-surface-variant/80 leading-relaxed max-w-sm">Rekomendasi ukuran rasio 1:1 (400x400px). Maksimal ukuran file 2MB.</p>
            
            <div className="flex justify-center sm:justify-start gap-3 mt-1.5 flex-wrap">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="bg-primary hover:bg-primary/95 disabled:bg-primary/60 disabled:cursor-not-allowed text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 rounded-xl flex items-center gap-1.5 shadow-sm shadow-primary/25 cursor-pointer text-center justify-center min-w-[110px]"
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    Ganti Foto
                  </>
                )}
              </button>
              {(pendingAvatar !== null ? pendingAvatar !== '' : !!user.avatar) && (
                <button 
                  onClick={handleDeletePhoto}
                  disabled={isUploadingAvatar}
                  className="text-red-500 hover:text-red-600 disabled:opacity-50 hover:bg-red-50 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Hapus Foto
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields for Profile Info */}
        <form onSubmit={handleUpdateProfile} className="space-y-5 pt-4 border-t border-outline-variant/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name input length verified */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant block ml-1">Nama Lengkap</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap (mis: Fanra)"
                maxLength={50}
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold" 
              />
              <p className="text-[11px] text-on-surface-variant ml-1 font-medium">Batas panjang nama Anda adalah di antara 3 hingga 50 karakter.</p>
            </div>
            
            {/* Permanent Username input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant block ml-1">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">@</span>
                <input 
                  type="text" 
                  value={username}
                  disabled
                  title="Username bersifat permanen"
                  className="w-full pl-8 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/60 font-semibold text-sm text-on-surface-variant/80 rounded-xl cursor-not-allowed select-none outline-none" 
                />
              </div>
              <p className="text-[11px] text-on-surface-variant ml-1 font-medium">Username bersifat permanen dan tidak dapat diubah lagi.</p>
            </div>

          </div>

          {/* Email input disabled without Verified tag badge */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant block ml-1">Alamat Email</label>
            <input 
              type="email" 
              value={user.email} 
              disabled 
              title="Email terverifikasi tidak dapat diubah"
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/60 font-semibold text-sm text-on-surface-variant/80 rounded-xl cursor-not-allowed select-none outline-none" 
            />
            <p className="text-[11px] text-on-surface-variant ml-1 font-medium">Alamat email login Anda telah paten dan tidak dapat diganti dengan akun lain.</p>
          </div>

          <div className="pt-3 flex justify-end">
            <button 
              type="submit"
              disabled={isUpdatingProfile || (fullName.trim() === (user.username || '').trim() && pendingAvatar === null) || fullName.trim().length < 3}
              className="bg-primary hover:bg-primary/95 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 text-sm font-bold transition-all active:scale-95 shadow-md shadow-primary/20 rounded-xl cursor-pointer flex items-center gap-2"
            >
              {isUpdatingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              Perbarui Profil
            </button>
          </div>

        </form>
      </section>

      {/* KEAMANAN & PASSWORD SECTION INLINE */}
      <section className="bg-white border border-outline-variant/60 p-6 md:p-8 shadow-sm rounded-2xl space-y-6">
        <div>
          <h2 className="font-bold text-lg text-on-surface flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Keamanan & Password
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Ganti atau update password Anda secara berkala demi privasi keamanan sistem bot.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 border-t border-outline-variant/40">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant block ml-1">Password Saat Ini</label>
            <div className="relative">
              <input 
                type={showOldPassword ? "text" : "password"} 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan sandi saat ini"
                className="w-full pl-4 pr-12 py-2.5 bg-surface-bright border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface transition-all active:scale-95 cursor-pointer"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant block ml-1">Password Baru</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan sandi baru (min 6 karakter)"
                  className="w-full pl-4 pr-12 py-2.5 bg-surface-bright border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface transition-all active:scale-95 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Dynamic Segmented Pasword Strength Meter */}
              {newPassword && (() => {
                const strength = getPasswordStrength(newPassword);
                return (
                  <div className="mt-2 space-y-1.5 px-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-bold">Kekuatan Sandi:</span>
                      <span className={strength.textClass}>{strength.label}</span>
                    </div>
                    <div className="flex h-1.5 w-full bg-slate-100 rounded-full overflow-hidden gap-1">
                      <div className={cn("h-full transition-all duration-300 rounded-full w-1/4", strength.score >= 1 ? strength.color : "bg-slate-200")} />
                      <div className={cn("h-full transition-all duration-300 rounded-full w-1/4", strength.score >= 2 ? strength.color : "bg-slate-200")} />
                      <div className={cn("h-full transition-all duration-300 rounded-full w-1/4", strength.score >= 3 ? strength.color : "bg-slate-200")} />
                      <div className={cn("h-full transition-all duration-300 rounded-full w-1/4", strength.score >= 4 ? strength.color : "bg-slate-200")} />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant block ml-1">Konfirmasi Password Baru</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi sandi baru"
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold"
              />

              {/* Instant Match Indicator Check */}
              {newPassword && confirmPassword && (
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-extrabold px-1 animate-fadeIn">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      Sandi Baru Cocok ✔
                    </span>
                  ) : (
                    <span className="text-red-500 bg-red-50 border border-red-150/50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                      Konfirmasi Sandi Belum Cocok ✘
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-on-surface-variant ml-1 font-medium">Syarat: Kata sandi baru wajib berukuran antara 6 sampai 32 karakter dan tidak boleh mirip dengan kata sandi sebelumnya.</p>

          <div className="pt-2 flex justify-end">
            <button 
              type="submit"
              disabled={isUpdatingPassword || oldPassword.trim() === '' || newPassword.trim() === '' || confirmPassword.trim() === ''}
              className="bg-primary hover:bg-primary/95 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 text-xs font-bold hover:shadow-md transition-all active:scale-95 rounded-xl cursor-pointer flex items-center gap-2"
            >
              {isUpdatingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Perbarui Password
            </button>
          </div>
        </form>
      </section>

      {/* SESI LOGIN AKTIF SYNCED SECTION */}
      <section className="bg-white border border-outline-variant/60 p-6 md:p-8 shadow-sm rounded-2xl space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg text-on-surface flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Sesi Login Aktif
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Berikut adalah perangkat riil yang baru-baru ini mengakses akun Anda.</p>
          </div>
          <button 
            type="button"
            onClick={fetchSessionsList} 
            disabled={isLoadingSessions}
            className="text-[11px] font-bold text-primary hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1 cursor-pointer select-none"
          >
            {isLoadingSessions && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
            Refresh Sesi
          </button>
        </div>

        <div className="space-y-4 pt-2 border-t border-outline-variant/40">
          {isLoadingSessions && sessionsList.length === 0 ? (
            <div className="py-6 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Memuat sesi login aktif...
            </div>
          ) : sessionsList.length === 0 ? (
            <div className="py-6 text-center text-xs text-on-surface-variant font-medium">
              Tidak ada sesi login lain yang tercatat.
            </div>
          ) : (
            <div className="space-y-3.5">
              {sessionsList.map((sess, idx) => {
                const isCurrent = idx === 0; // The sorted newest session is generally current
                const deviceMeta = getDeviceIconAndMeta(sess);
                return (
                  <div key={sess.id || idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-outline-variant/40 rounded-xl bg-surface/15 hover:bg-surface/25 transition-all gap-4 shadow-sm">
                    <div className="flex gap-3.5">
                      <div className="mt-1 bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        {deviceMeta.isMobile ? (
                          <Smartphone className={cn("w-5 h-5", deviceMeta.iconColor)} />
                        ) : deviceMeta.isTablet ? (
                          <Smartphone className={cn("w-5 h-5 rotate-90", deviceMeta.iconColor)} />
                        ) : (
                          <Laptop className={cn("w-5 h-5", deviceMeta.iconColor)} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-on-surface">
                            {sess.deviceName}
                          </p>
                          {isCurrent && (
                            <span className="text-[9.5px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-black uppercase">
                              Perangkat Ini
                            </span>
                          )}
                          <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase", deviceMeta.labelColor)}>
                            {deviceMeta.osLabel}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-semibold mt-1">
                          IP: <span className="font-mono text-slate-600 font-bold">{sess.ip}</span> • Lokasi: <span className="text-slate-700 font-bold">{sess.location || "Jakarta, Indonesia"}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          Diakses terakhir: {formatDate(sess.loginAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="self-end sm:self-center flex items-center gap-3">
                      {isCurrent ? (
                        <span className="px-3 py-1 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/50 rounded-full uppercase select-none tracking-wider flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          ONLINE
                        </span>
                      ) : (
                        <button 
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin mencabut izin akses dan memutuskan sesi perangkat ${sess.deviceName} (${sess.ip}) ini?`)) {
                              handleTerminateSession(sess.id);
                            }
                          }}
                          className="text-xs text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 cursor-pointer shadow-sm shadow-red-50 bg-white"
                        >
                          Cabut Akses Sesi
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* BAHASA INLINE SECTION */}
      <section className="bg-white border border-outline-variant/60 p-6 md:p-8 shadow-sm rounded-2xl space-y-6">
        <div>
          <h2 className="font-bold text-lg text-on-surface flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Bahasa / Language
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Pilih bahasa favorit Anda untuk antarmuka dasbor FanraBot.</p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-outline-variant/40">
          <div 
            onClick={() => {
              setActiveLang('id');
              triggerToast('Bahasa diubah ke Bahasa Indonesia.');
            }}
            className={cn(
              "px-4 py-2 border rounded-xl flex items-center gap-2 cursor-pointer transition-all text-xs font-semibold select-none",
              activeLang === 'id' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-outline-variant hover:bg-gray-50"
            )}
          >
            <span className="text-base">🇮🇩</span>
            <span className="text-on-surface">Bahasa Indonesia</span>
            {activeLang === 'id' && (
              <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center ml-1 shrink-0">
                <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
              </div>
            )}
          </div>

          <div 
            onClick={() => {
              triggerToast('English language is currently under translation phase.', 'error');
            }}
            className="px-4 py-2 border border-outline-variant/60 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all cursor-not-allowed opacity-75 text-xs font-semibold select-none"
          >
            <span className="text-base">🇺🇸</span>
            <span className="text-on-surface-variant text-slate-500">English (US)</span>
            <span className="text-[8px] font-black tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase shrink-0">Soon</span>
          </div>
        </div>
      </section>

      {/* DANGER ZONE SECTION */}
      <section className="bg-red-50/20 border border-red-200/50 p-6 md:p-8 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-bold text-lg">Zona Berbahaya</h3>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed max-w-3xl">
          Tindakan di bawah ini bersifat permanen. Menghapus akun akan mengakibatkan hilangnya semua data bot WhatsApp, riwayat log perpesanan, dan konfigurasi auto-pilot AI automation yang telah didesain. Harap berhati-hati.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          
          {/* Double Confirmation Logout Button */}
          <button 
            onClick={handleLogoutAction}
            className={cn(
              "font-bold text-xs px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 max-w-full sm:max-w-xs cursor-pointer",
              logoutConfirmState === 'idle' 
                ? "bg-white border border-outline-variant hover:bg-surface-container-high hover:border-outline text-on-surface shadow-sm" 
                : "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200 animate-pulse"
            )}
          >
            <LogOut className="w-4 h-4" />
            <span>{logoutConfirmState === 'idle' ? "Logout Akun" : "Konfirm: Klik Sekali Lagi Untuk Keluar"}</span>
          </button>

          {/* Double Confirmation Permanent Delete Button */}
          <button 
            onClick={handleDeleteAccountAction}
            className={cn(
              "font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer",
              deleteConfirmState === 'idle' 
                ? "bg-red-50 border border-red-200/60 text-red-600 hover:bg-red-50/80" 
                : "bg-red-700 text-white hover:bg-red-850 animate-pulse"
            )}
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleteConfirmState === 'idle' ? "Delete Account Permanently" : "HAPUS PERMANEN: Klik Sekali Lagi Sekarang!"}</span>
          </button>

        </div>
      </section>

    </div>
  );
}
