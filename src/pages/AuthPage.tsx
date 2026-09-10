import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bot, 
  User, 
  Lock, 
  Mail, 
  BadgeCheck, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  RefreshCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

type AuthState = 'login' | 'register' | 'otp' | 'forgot-request' | 'forgot-otp' | 'forgot-new-password';

export default function AuthPage({ initialMode = 'login' }: { initialMode?: AuthState }) {
  const [state, setState] = useState<AuthState>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  
  // Register States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterEmailTouched, setIsRegisterEmailTouched] = useState(false);
  
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginEmailTouched, setIsLoginEmailTouched] = useState(false);
  
  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotEmailTouched, setIsForgotEmailTouched] = useState(false);
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const [forgotTimer, setForgotTimer] = useState(60);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Modals / Popups for Terms and Privacy
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  // Common Notification Message States
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  const resolveApiUrl = (endpoint: string, targetEmailForLog?: string) => {
    let base = API_BASE;
    if (base === 'undefined' || base === '/') {
      base = '';
    } else if (base.endsWith('/')) {
      base = base.slice(0, -1);
    }
    
    let cleanEndpoint = endpoint;
    if (!cleanEndpoint.startsWith('/')) {
      cleanEndpoint = '/' + cleanEndpoint;
    }
    
    const url = `${base}${cleanEndpoint}`;
    
    if (endpoint.includes('send-otp')) {
      console.log("[AUTH] send otp url:", url);
    } else {
      console.log("[AUTH] RESOLVED URL:", url);
    }
    
    if (targetEmailForLog) {
      console.log("[AUTH] Request body:", { email: targetEmailForLog });
    }
    
    return url;
  };

  // Keep API_URL aligned for compatibility or direct usage with resolveApiUrl
  const API_URL = (API_BASE && API_BASE !== 'undefined' && API_BASE !== '/') ? API_BASE : '';

  const WEB3FORMS_KEY = "03576fb1-4bad-42c8-8994-1ba8d49397c0";

  // Email validation regex helper
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isLoginEmailInvalid = isLoginEmailTouched && loginEmail.length > 0 && !emailRegex.test(loginEmail);
  const isRegisterEmailInvalid = isRegisterEmailTouched && email.length > 0 && !emailRegex.test(email);
  const isForgotEmailInvalid = isForgotEmailTouched && forgotEmail.length > 0 && !emailRegex.test(forgotEmail);

  // Input sanitization to prevent injection
  const sanitizeText = (val: string) => {
    return val.replace(/[<>'"`;]/g, '');
  };

  // Malicious hacker payloads check (XSS, SQL Injection, dynamic program code protection)
  const isMaliciousInput = (val: string) => {
    const lower = val.toLowerCase();
    return (
      lower.includes('<script') || 
      lower.includes('javascript:') || 
      lower.includes('onload=') || 
      lower.includes('onerror=') || 
      lower.includes('select ') || 
      lower.includes('union ') || 
      lower.includes('delete ') || 
      lower.includes('drop ') ||
      lower.includes('eval(') ||
      lower.includes('&& ') ||
      lower.includes('|| ') ||
      lower.includes('process.env')
    );
  };

  // Redirect to dashboard automatically if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Timers for OTP countdowns
  useEffect(() => {
    let interval: any;
    if (state === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state, timer]);

  useEffect(() => {
    let interval: any;
    if (state === 'forgot-otp' && forgotTimer > 0) {
      interval = setInterval(() => setForgotTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state, forgotTimer]);

  // Handle locking background scroll when modal popup is active
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeModal]);

  // Reset notifications + passwords on state transition
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    setShowPassword(false);
    setShowLoginPassword(false);
    setShowNewPassword(false);

    if (state === 'forgot-request') {
      setForgotEmail('');
      setIsForgotEmailTouched(false);
    } else if (state === 'forgot-otp') {
      setForgotOtp(['', '', '', '', '', '']);
      setForgotTimer(60);
    } else if (state === 'forgot-new-password') {
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginEmailTouched(true);
    if (!emailRegex.test(loginEmail)) {
      setErrorMessage('Format email belum valid.');
      return;
    }

    if (isMaliciousInput(loginEmail) || isMaliciousInput(loginPassword)) {
      setErrorMessage('Input tidak diperbolehkan mengandung kode berbahaya!');
      return;
    }

    setIsLoading(false);
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const url = resolveApiUrl('/api/auth/login');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login gagal.');
      }

      // Save token & user to localStorage
      localStorage.setItem('token', data.token || '');
      localStorage.setItem('user', JSON.stringify(data.user || {}));

      setSuccessMessage('Login sukses! Mengalihkan...');
      setTimeout(() => {
        setIsLoading(false);
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Kesalahan koneksi ke server.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const url = resolveApiUrl('/api/auth/google');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login Google gagal.');
      }

      localStorage.setItem('token', data.token || '');
      localStorage.setItem('user', JSON.stringify(data.user || {}));
      
      setSuccessMessage('Login Google sukses! Mengalihkan...');
      setTimeout(() => {
        setIsLoading(false);
        navigate('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      setErrorMessage(error.message || 'Gagal login menggunakan akun Google.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisterEmailTouched(true);
    if (!emailRegex.test(email)) {
      setErrorMessage('Format email belum valid.');
      return;
    }

    if (isMaliciousInput(username) || isMaliciousInput(email) || isMaliciousInput(password)) {
      setErrorMessage('Input tidak diperbolehkan mengandung kode berbahaya!');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // 1. Check if email already exists via backend
      const checkUrl = resolveApiUrl('/api/auth/check-email');
      const checkRes = await fetch(checkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        throw new Error(checkData.error || 'Email sudah tidak dapat dipakai.');
      }

      // 2. Clear old state and call backend to generate and dispatch OTP
      sessionStorage.removeItem('pending_reg');
      
      const sendOtpUrl = resolveApiUrl('/api/auth/send-otp', email.trim().toLowerCase());
      const sRes = await fetch(sendOtpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          username: username.trim(),
          type: 'register'
        })
      });

      const sData = await sRes.json();

      if (!sRes.ok) {
        throw new Error(sData.error || 'Gagal mengirimkan email kode verifikasi OTP.');
      }

      // 3. Save pending registration data in sessionStorage
      sessionStorage.setItem('pending_reg', JSON.stringify({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        expiredAt: sData.expiredAt
      }));

      // Task 7: Log target OTP email
      console.log(`OTP target email: ${email.trim().toLowerCase()}`);

      setSuccessMessage('Kode verifikasi OTP berhasil dikirim ke email!');
      setTimeout(() => {
        setIsLoading(false);
        setState('otp');
        setTimer(60);
      }, 800);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Gagal memulai pendaftaran.');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some(v => !v)) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const otpCode = otp.join('');

    try {
      // 1. Load pending registration from sessionStorage
      const pendingStr = sessionStorage.getItem('pending_reg');
      if (!pendingStr) {
        throw new Error('Data pendaftaran tidak ditemukan. Silakan isi form kembali.');
      }

      const pendingData = JSON.parse(pendingStr);

      // 2. Validate expiration
      if (Date.now() > pendingData.expiredAt) {
        throw new Error('Kode OTP telah kedaluarsa. Silakan kirim ulang kode baru.');
      }

      // 3. Verify OTP code securely with the backend
      const verifyUrl = resolveApiUrl('/api/auth/verify-otp');
      const vRes = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingData.email,
          otp: otpCode
        })
      });

      const vData = await vRes.json();

      if (!vRes.ok) {
        throw new Error(vData.error || 'Kode OTP tidak cocok atau tidak sesuai.');
      }

      // 4. Submit active registration securely to backend
      const registerUrl = resolveApiUrl('/api/auth/register-direct');
      const res = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: pendingData.username,
          email: pendingData.email,
          password: pendingData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan akun baru di server.');
      }

      // Clean up verification state
      sessionStorage.removeItem('pending_reg');

      // Save token and user details to local storage
      localStorage.setItem('token', data.token || '');
      localStorage.setItem('user', JSON.stringify(data.user || {}));

      setSuccessMessage('Verifikasi Sukses! Selamat datang di FanraBot.');
      setTimeout(() => {
        setIsLoading(false);
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Verifikasi gagal.');
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // 1. Read details from sessionStorage
      const pendingStr = sessionStorage.getItem('pending_reg');
      if (!pendingStr) {
        throw new Error('Data pendaftaran Anda hilang. Silakan buat akun kembali.');
      }

      const pendingData = JSON.parse(pendingStr);

      // 2. Call backend to dispatch code directly to target email
      const url = resolveApiUrl('/api/auth/send-otp', pendingData.email);
      const sRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingData.email,
          username: pendingData.username,
          type: 'register'
        })
      });

      const sData = await sRes.json();

      if (!sRes.ok) {
        throw new Error(sData.error || 'Gagal mengirim ulang email kode OTP.');
      }

      // 3. Update sessionStorage
      sessionStorage.setItem('pending_reg', JSON.stringify({
        ...pendingData,
        expiredAt: sData.expiredAt
      }));

      // Task 7: Log target OTP email
      console.log(`OTP target email: ${pendingData.email}`);

      setSuccessMessage('Kode OTP baru telah dikirim langsung ke email!');
      setTimer(60);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Terjadi kesalahan.');
    }
  };

  // --- FORGOT PASSWORD WORKFLOW CODES ---
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotEmailTouched(true);
    if (!emailRegex.test(forgotEmail)) {
      setErrorMessage('Format email belum valid.');
      return;
    }
    
    if (isMaliciousInput(forgotEmail)) {
      setErrorMessage('Input tidak diperbolehkan mengandung kode berbahaya!');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // 1. Check if email exists via the backend endpoint
      const checkUrl = resolveApiUrl('/api/auth/check-email-registered');
      const checkRes = await fetch(checkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() })
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        throw new Error(checkData.error || 'Email tidak terdaftar.');
      }

      // 2. Clear old reset state and call backend to generate and dispatch OTP
      sessionStorage.removeItem('pending_reset');

      const url = resolveApiUrl('/api/auth/send-otp', forgotEmail.trim().toLowerCase());
      const sRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          username: checkData.username || 'User',
          type: 'forgot'
        })
      });

      const sData = await sRes.json();

      if (!sRes.ok) {
        throw new Error(sData.error || 'Gagal mengirimkan email pemulihan/OTP.');
      }

      // 3. Save pending reset metadata to sessionStorage
      sessionStorage.setItem('pending_reset', JSON.stringify({
        email: forgotEmail.trim().toLowerCase(),
        expiredAt: sData.expiredAt
      }));

      // Task 7: Log target OTP email
      console.log(`OTP target email: ${forgotEmail.trim().toLowerCase()}`);

      setSuccessMessage('Kode verifikasi OTP berhasil dikirim ke email!');
      setTimeout(() => {
        setIsLoading(false);
        setState('forgot-otp');
        setForgotTimer(60);
      }, 800);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Kesalahan memproses permintaan.');
    }
  };

  const handleForgotOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...forgotOtp];
    newOtp[index] = value.substring(value.length - 1);
    setForgotOtp(newOtp);

    if (value && index < 5) {
      forgotOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotOtp.some(v => !v)) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const otpCode = forgotOtp.join('');

    try {
      const pendingStr = sessionStorage.getItem('pending_reset');
      if (!pendingStr) {
        throw new Error('Data verifikasi tidak ditemukan. Silakan ulangi pengajuan.');
      }

      const pendingData = JSON.parse(pendingStr);

      if (Date.now() > pendingData.expiredAt) {
        throw new Error('Kode OTP telah kedaluarsa. Silakan kirim ulang kode baru.');
      }

      // Verify input with the server-side API securely
      const verifyUrl = resolveApiUrl('/api/auth/verify-otp');
      const vRes = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingData.email,
          otp: otpCode
        })
      });

      const vData = await vRes.json();

      if (!vRes.ok) {
        throw new Error(vData.error || 'Kode OTP salah atau tidak cocok.');
      }

      setSuccessMessage('Kode OTP valid! Silakan masukkan kata sandi baru.');
      setTimeout(() => {
        setIsLoading(false);
        setState('forgot-new-password');
      }, 800);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Verifikasi OTP gagal.');
    }
  };

  const handleResendForgotOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const pendingStr = sessionStorage.getItem('pending_reset');
      if (!pendingStr) {
        throw new Error('Data pengajuan tidak ditemukan. Silakan isi form kembali.');
      }

      const pendingData = JSON.parse(pendingStr);

      // Call backend to send the email securely
      const url = resolveApiUrl('/api/auth/send-otp', pendingData.email);
      const sRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingData.email,
          username: 'User',
          type: 'forgot'
        })
      });

      const sData = await sRes.json();

      if (!sRes.ok) {
        throw new Error(sData.error || 'Gagal mengirim ulang email kode OTP.');
      }

      sessionStorage.setItem('pending_reset', JSON.stringify({
        ...pendingData,
        expiredAt: sData.expiredAt
      }));

      // Task 7: Log target OTP email
      console.log(`OTP target email: ${pendingData.email}`);

      setSuccessMessage('Kode OTP baru telah dikirim langsung ke email!');
      setForgotTimer(60);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Terjadi kesalahan.');
    }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setErrorMessage('Kedua kolom password wajib diisi.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Kata sandi harus minimal 8 karakter.');
      return;
    }

    if (isMaliciousInput(newPassword) || isMaliciousInput(confirmPassword)) {
      setErrorMessage('Input tidak diperbolehkan mengandung kode berbahaya!');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const pendingStr = sessionStorage.getItem('pending_reset');
      if (!pendingStr) {
        throw new Error('Data sesi pemulihan hilang. Silakan mulai ulang kembali.');
      }
      const pendingData = JSON.parse(pendingStr);

      const updateUrl = resolveApiUrl('/api/auth/update-password');
      const res = await fetch(updateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingData.email,
          password: newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui sandi baru.');
      }

      // Cleanup reset password state
      sessionStorage.removeItem('pending_reset');

      setSuccessMessage('Kata sandi berhasil diubah! Mengalihkan ke login...');
      setTimeout(() => {
        setIsLoading(false);
        setState('login');
      }, 1500);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Gagal menyimpan sandi.');
    }
  };

  // Automated submissions for OTP verification fields when filled
  useEffect(() => {
    if (state === 'otp' && otp.every(v => v !== '')) {
      const e = { preventDefault: () => {} } as React.FormEvent;
      handleVerify(e);
    }
  }, [otp]);

  useEffect(() => {
    if (state === 'forgot-otp' && forgotOtp.every(v => v !== '')) {
      const e = { preventDefault: () => {} } as React.FormEvent;
      handleVerifyForgotOtp(e);
    }
  }, [forgotOtp]);

  return (
    <div className="min-h-screen flex bg-background selection:bg-primary/10 transition-colors duration-300">
      
      {/* Left Side: Branding / Value Prop (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 bg-surface-subtle flex-col justify-between p-12 lg:p-20 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>
        
        {/* Brand Header */}
        <Link to="/" className="relative z-10 flex items-center gap-3">
          <img 
            src="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578024/file_0000000030647209b33b695fffe52c90_gi9rwf.png" 
            alt="FanraBot Logo" 
            className="h-10 w-auto object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <span className="text-2xl font-bold tracking-tight text-[#111827] font-brand tracking-[-0.03em] select-none">FanraBot</span>
        </Link>

        {/* Value Prop & Illustration */}
        <div className="relative z-10 flex flex-col gap-8 max-w-xl">
          <h1 className="text-5xl xl:text-6xl font-bold text-on-surface leading-[1.1] tracking-tight font-brand">
            Orkestrasi AI <br/> <span className="text-primary">Tanpa Batas</span>
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed opacity-80">
            Bangun, kelola, dan otomatiskan interaksi WhatsApp Anda dengan tingkat presisi dan efisiensi tinggi. FanraBot dirancang untuk alur kerja yang kompleks dan performa maksimal.
          </p>

          {/* Abstract Illustration */}
          <div className="mt-8 w-full h-[320px] rounded border border-outline bg-white overflow-hidden relative shadow-xl">
             <img 
               alt="AI Orchestration" 
               className="w-full h-full object-cover opacity-90"
               src="https://images.pexels.com/photos/6019019/pexels-photo-6019019.jpeg" 
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* Footer / Trust */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-3">
             {[1, 2, 3].map(i => (
               <div key={i} className="w-9 h-9 rounded-full border border-white overflow-hidden">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="User" referrerPolicy="no-referrer" />
               </div>
             ))}
             <div className="w-9 h-9 rounded bg-white border border-white flex items-center justify-center text-[10px] font-bold text-on-surface-variant">10k+</div>
          </div>
          <span className="text-xs font-medium text-on-surface-variant/70">Tim produktif menggunakan FanraBot</span>
        </div>
      </div>

      {/* Right Side: Forms Area */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 bg-white relative">
        {/* Mobile Brand Header */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
          <img 
            src="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578024/file_0000000030647209b33b695fffe52c90_gi9rwf.png" 
            alt="FanraBot Logo" 
            className="h-10 w-auto object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <span className="text-2xl font-bold tracking-tight text-[#111827] font-brand tracking-[-0.03em] select-none">FanraBot</span>
        </div>

        <div className="w-full max-w-sm mx-auto overflow-hidden">
          {/* Back button on DESKTOP ONLY */}
          {!['otp', 'forgot-otp', 'forgot-new-password'].includes(state) && (
            <Link 
              to="/" 
              className="hidden lg:inline-flex items-center gap-2 text-sm font-semibold text-on-surface-muted hover:text-[#111827] transition-colors mb-8"
            >
              <img 
                src="https://cdn-icons-png.flaticon.com/128/9643/9643115.png" 
                alt="Exit Icon" 
                className="w-4 h-4 object-contain shrink-0" 
                referrerPolicy="no-referrer"
              />
              Ke Beranda
            </Link>
          )}

          <AnimatePresence mode="wait">
            
            {/* 1. LOGIN MODE */}
            {state === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center lg:text-left space-y-2">
                  <h2 className="text-3xl font-bold text-on-surface tracking-tight">Masuk Ke Akun</h2>
                  <p className="text-sm text-on-surface-variant">Masukkan kredensial Anda untuk melanjutkan.</p>
                </div>

                {errorMessage && (
                  <p className="text-xs font-medium text-red-600 text-center lg:text-left">
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p className="text-xs font-medium text-green-600 text-center lg:text-left">
                    {successMessage}
                  </p>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className={cn(
                          "w-4 h-4 transition-colors",
                          isLoginEmailInvalid ? "text-red-500" : "text-on-surface-muted group-focus-within:text-primary"
                        )} />
                      </div>
                      <input 
                        type="email"
                        maxLength={100}
                        value={loginEmail}
                        onBlur={() => setIsLoginEmailTouched(true)}
                        onChange={(e) => setLoginEmail(sanitizeText(e.target.value))}
                        className={cn(
                          "w-full pl-11 pr-4 py-3 bg-surface-subtle border text-sm outline-none transition-all rounded focus:bg-white focus:ring-2",
                          isLoginEmailInvalid 
                            ? "border-red-500 focus:ring-red-100 focus:border-red-600 text-red-900" 
                            : "border-outline focus:ring-primary/20 focus:border-primary"
                        )}
                        placeholder="nama@perusahaan.com"
                        required
                      />
                    </div>
                    {isLoginEmailInvalid && (
                      <p className="text-[11px] text-red-500 font-medium">Format email tidak valid</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-on-surface">Password</label>
                      <button 
                        type="button" 
                        onClick={() => setState('forgot-request')}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Lupa Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-on-surface-muted group-focus-within:text-primary transition-colors" />
                      </div>
                      <input 
                        type={showLoginPassword ? "text" : "password"}
                        maxLength={32}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 bg-surface-subtle border border-outline rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none" 
                        placeholder="••••••••"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-muted hover:text-on-surface select-none cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    disabled={isLoading}
                    className="w-full py-3 bg-primary text-white font-bold rounded shadow-lg shadow-primary/15 hover:bg-primary/95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Masuk</>}
                  </button>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-outline"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-on-surface-muted">atau</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-3 bg-white border border-outline text-on-surface font-semibold rounded hover:bg-surface-subtle transition-all flex items-center justify-center gap-2 group disabled:opacity-70 active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Masuk dengan Google
                  </button>
                </form>

                <div className="text-center pt-2 space-y-4">
                  <p className="text-sm text-on-surface-variant font-medium">
                    Belum punya akun?{' '}
                    <button onClick={() => setState('register')} className="text-primary font-bold hover:underline cursor-pointer">Daftar</button>
                  </p>

                  {/* Exit to homepage button: shown bottom on MOBILE ONLY */}
                  <div className="block lg:hidden pt-2">
                    <Link 
                      to="/" 
                      className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-muted hover:text-[#111827] transition-colors justify-center mx-auto"
                    >
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/9643/9643115.png" 
                        alt="Exit Icon" 
                        className="w-3.5 h-3.5 object-contain shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      Ke Beranda
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. REGISTER MODE */}
            {state === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center lg:text-left space-y-2">
                  <h2 className="text-3xl font-bold text-on-surface tracking-tight">Buat Akun</h2>
                  <p className="text-sm text-on-surface-variant">Daftarkan diri Anda untuk memulai.</p>
                </div>

                {errorMessage && (
                  <p className="text-xs font-medium text-red-600 text-center lg:text-left">
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p className="text-xs font-medium text-green-600 text-center lg:text-left">
                    {successMessage}
                  </p>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-on-surface">Username</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-on-surface-muted group-focus-within:text-primary transition-colors" />
                      </div>
                      <input 
                        type="text"
                        maxLength={40}
                        value={username}
                        onChange={(e) => setUsername(sanitizeText(e.target.value))}
                        className="w-full pl-11 pr-4 py-3 bg-surface-subtle border border-outline rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none" 
                        placeholder="johndoe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-on-surface">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className={cn(
                          "w-4 h-4 transition-colors",
                          isRegisterEmailInvalid ? "text-red-500" : "text-on-surface-muted group-focus-within:text-primary"
                        )} />
                      </div>
                      <input 
                        type="email"
                        maxLength={100}
                        value={email}
                        onBlur={() => setIsRegisterEmailTouched(true)}
                        onChange={(e) => {
                          const cleanVal = sanitizeText(e.target.value);
                          setEmail(cleanVal);
                          sessionStorage.removeItem('pending_reg');
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          setOtp(['', '', '', '', '', '']);
                          setErrorMessage('');
                          setSuccessMessage('');
                        }}
                        className={cn(
                          "w-full pl-11 pr-4 py-3 bg-surface-subtle border text-sm outline-none transition-all rounded focus:bg-white focus:ring-2",
                          isRegisterEmailInvalid 
                            ? "border-red-500 focus:ring-red-100 focus:border-red-600 text-red-900" 
                            : "border-outline focus:ring-primary/20 focus:border-primary"
                        )}
                        placeholder="nama@perusahaan.com"
                        required
                      />
                    </div>
                    {isRegisterEmailInvalid && (
                      <p className="text-[11px] text-red-500 font-medium">Format email tidak valid</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-on-surface">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-on-surface-muted group-focus-within:text-primary transition-colors" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        maxLength={32}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 bg-surface-subtle border border-outline rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none" 
                        placeholder="••••••••"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-muted hover:text-on-surface select-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 py-1">
                    <input 
                      type="checkbox" 
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-outline text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
                    />
                    <label htmlFor="terms" className="text-xs font-semibold text-on-surface-variant cursor-pointer select-none leading-relaxed">
                      Saya setuju dengan{' '}
                      <button 
                        type="button" 
                        onClick={() => setActiveModal('terms')} 
                        className="text-primary hover:underline font-bold cursor-pointer"
                      >
                        Syarat Ketentuan
                      </button>{' '}
                      dan{' '}
                      <button 
                        type="button" 
                        onClick={() => setActiveModal('privacy')} 
                        className="text-primary hover:underline font-bold cursor-pointer"
                      >
                        Kebijakan Privasi
                      </button>.
                    </label>
                  </div>

                  <button 
                    disabled={isLoading || !agreedToTerms}
                    className="w-full py-3 bg-primary text-white font-bold rounded shadow-lg shadow-primary/15 hover:bg-primary/95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Kirim Kode OTP</>}
                  </button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-outline"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-on-surface-muted">atau</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-3 bg-white border border-outline text-on-surface font-semibold rounded hover:bg-surface-subtle transition-all flex items-center justify-center gap-2 group disabled:opacity-70 active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Daftar dengan Google
                  </button>
                </form>

                <div className="text-center pt-2 space-y-4">
                  <p className="text-sm text-on-surface-variant font-medium">
                    Sudah punya akun?{' '}
                    <button onClick={() => setState('login')} className="text-primary font-bold hover:underline cursor-pointer">Masuk</button>
                  </p>

                  {/* Exit to homepage button: shown bottom on MOBILE ONLY */}
                  <div className="block lg:hidden pt-2">
                    <Link 
                      to="/" 
                      className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-muted hover:text-[#111827] transition-colors justify-center mx-auto"
                    >
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/9643/9643115.png" 
                        alt="Exit Icon" 
                        className="w-3.5 h-3.5 object-contain shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      Ke Beranda
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. REGISTER OTP VERIFICATION MODE */}
            {state === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center">
                  <div className="text-center lg:text-left w-full space-y-2">
                    <h2 className="text-3xl font-bold text-on-surface tracking-tight">Verifikasi OTP</h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      Masukkan 6 digit kode yang dikirim ke <br/> <span className="font-bold text-on-surface">{email || 'email Anda'}</span>
                    </p>
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-xs font-medium text-red-600 text-center lg:text-left">
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p className="text-xs font-medium text-green-600 text-center lg:text-left">
                    {successMessage}
                  </p>
                )}

                <form onSubmit={handleVerify} className="space-y-8">
                  <div className="flex justify-between gap-1.5 md:gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={digit}
                        ref={(el) => (otpRefs.current[i] = el)}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otp[i] && i > 0) {
                            otpRefs.current[i - 1]?.focus();
                          }
                        }}
                        className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold border border-outline rounded focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all bg-surface-subtle outline-none"
                      />
                    ))}
                  </div>

                  <button 
                    disabled={isLoading || otp.some(v => !v)}
                    className="w-full py-3 bg-primary text-white font-bold rounded shadow-lg shadow-primary/15 hover:bg-primary/95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verifikasi & Lanjutkan</>}
                  </button>
                </form>

                <div className="text-center space-y-4">
                  {timer > 0 ? (
                    <p className="text-sm text-on-surface-variant font-medium">
                      Kirim ulang kode dalam <span className="text-primary font-bold">{timer}s</span>
                    </p>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm font-bold text-primary hover:underline flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      <RefreshCcw className="w-4 h-4" /> Kirim Ulang Kode
                    </button>
                  )}

                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={() => setState('register')} 
                      className="text-xs font-bold text-on-surface-muted hover:text-primary flex items-center gap-2 transition-colors mx-auto cursor-pointer"
                    >
                      ✕ Kembali ke Daftar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. FORGOT PASSWORD: EMAIL REQUEST MODE */}
            {state === 'forgot-request' && (
              <motion.div
                key="forgot-request"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center lg:text-left space-y-2">
                  <h2 className="text-3xl font-bold text-on-surface tracking-tight">Lupa Sandi?</h2>
                  <p className="text-sm text-on-surface-variant">Masukkan email Anda untuk menerima kode OTP pemulihan sandi baru.</p>
                </div>

                {errorMessage && (
                  <p className="text-xs font-medium text-red-600 text-center lg:text-left">
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p className="text-xs font-medium text-green-600 text-center lg:text-left">
                    {successMessage}
                  </p>
                )}

                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Email Pemulihan</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className={cn(
                          "w-4 h-4 transition-colors",
                          isForgotEmailInvalid ? "text-red-500" : "text-on-surface-muted group-focus-within:text-primary"
                        )} />
                      </div>
                      <input 
                        type="email"
                        maxLength={100}
                        value={forgotEmail}
                        onBlur={() => setIsForgotEmailTouched(true)}
                        onChange={(e) => {
                          const cleanVal = sanitizeText(e.target.value);
                          setForgotEmail(cleanVal);
                          sessionStorage.removeItem('pending_reset');
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          setForgotOtp(['', '', '', '', '', '']);
                          setErrorMessage('');
                          setSuccessMessage('');
                        }}
                        className={cn(
                          "w-full pl-11 pr-4 py-3 bg-surface-subtle border text-sm outline-none transition-all rounded focus:bg-white focus:ring-2",
                          isForgotEmailInvalid 
                            ? "border-red-500 focus:ring-red-100 focus:border-red-600 text-red-900" 
                            : "border-outline focus:ring-primary/20 focus:border-primary"
                        )}
                        placeholder="nama@perusahaan.com"
                        required
                      />
                    </div>
                    {isForgotEmailInvalid && (
                      <p className="text-[11px] text-red-500 font-medium">Format email tidak valid</p>
                    )}
                  </div>

                  <button 
                    disabled={isLoading}
                    className="w-full py-3 bg-primary text-white font-bold rounded shadow-lg shadow-primary/15 hover:bg-primary/95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Kirim Kode OTP</>}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => setState('login')} 
                    className="text-sm font-bold text-primary hover:underline cursor-pointer"
                  >
                    Kembali Ke Login
                  </button>
                </div>
              </motion.div>
            )}

            {/* 5. FORGOT PASSWORD: OTP VERIFICATION MODE */}
            {state === 'forgot-otp' && (
              <motion.div
                key="forgot-otp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center lg:text-left space-y-2">
                  <h2 className="text-3xl font-bold text-on-surface tracking-tight">Verifikasi Sandi</h2>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Masukkan 6 digit kode pemulihan yang dikirim ke <br/> <span className="font-bold text-on-surface">{forgotEmail}</span>
                  </p>
                </div>

                {errorMessage && (
                  <p className="text-xs font-medium text-red-600 text-center lg:text-left">
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p className="text-xs font-medium text-green-600 text-center lg:text-left">
                    {successMessage}
                  </p>
                )}

                <form onSubmit={handleVerifyForgotOtp} className="space-y-8">
                  <div className="flex justify-between gap-1.5 md:gap-2">
                    {forgotOtp.map((digit, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={digit}
                        ref={(el) => (forgotOtpRefs.current[i] = el)}
                        onChange={(e) => handleForgotOtpChange(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !forgotOtp[i] && i > 0) {
                            forgotOtpRefs.current[i - 1]?.focus();
                          }
                        }}
                        className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold border border-outline rounded focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all bg-surface-subtle outline-none"
                      />
                    ))}
                  </div>

                  <button 
                    disabled={isLoading || forgotOtp.some(v => !v)}
                    className="w-full py-3 bg-primary text-white font-bold rounded shadow-lg shadow-primary/15 hover:bg-primary/95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verifikasi Kode</>}
                  </button>
                </form>

                <div className="text-center space-y-4">
                  {forgotTimer > 0 ? (
                    <p className="text-sm text-on-surface-variant font-medium">
                      Kirim ulang kode dalam <span className="text-primary font-bold">{forgotTimer}s</span>
                    </p>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleResendForgotOtp}
                      className="text-sm font-bold text-primary hover:underline flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      <RefreshCcw className="w-4 h-4" /> Kirim Ulang Kode
                    </button>
                  )}

                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={() => setState('forgot-request')} 
                      className="text-xs font-bold text-on-surface-muted hover:text-primary flex items-center gap-2 transition-colors mx-auto cursor-pointer"
                    >
                      ✕ Ubah Email Pemulihan
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. FORGOT PASSWORD: NEW PASSWORD SETUP MODE */}
            {state === 'forgot-new-password' && (
              <motion.div
                key="forgot-new-password"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center lg:text-left space-y-2">
                  <h2 className="text-3xl font-bold text-on-surface tracking-tight">Sandi Baru</h2>
                  <p className="text-sm text-on-surface-variant">Buat kata sandi baru yang aman untuk akun FanraBot Anda.</p>
                </div>

                {errorMessage && (
                  <p className="text-xs font-medium text-red-600 text-center lg:text-left">
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p className="text-xs font-medium text-green-600 text-center lg:text-left">
                    {successMessage}
                  </p>
                )}

                <form onSubmit={handleSaveNewPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Kata Sandi Baru</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-on-surface-muted group-focus-within:text-primary transition-colors" />
                      </div>
                      <input 
                        type={showNewPassword ? "text" : "password"}
                        maxLength={32}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 bg-surface-subtle border border-outline rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none" 
                        placeholder="Minimal 8 karakter"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-muted hover:text-on-surface select-none cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Konfirmasi Kata Sandi Baru</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-on-surface-muted group-focus-within:text-primary transition-colors" />
                      </div>
                      <input 
                        type="password"
                        maxLength={32}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        
                        // Strict Copy & Paste Protection + No eye-toggle icon as requested
                        onCopy={(e) => e.preventDefault()}
                        onPaste={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        
                        className="w-full pl-11 pr-4 py-3 bg-surface-subtle border border-outline rounded text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none select-none" 
                        placeholder="Masukkan kembali kata sandi"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    disabled={isLoading}
                    className="w-full py-3 bg-primary text-white font-bold rounded shadow-lg shadow-primary/15 hover:bg-primary/95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Simpan Sandi Baru</>}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
          
          {/* Shared Terms Footer */}
          <div className="mt-12 pt-6 border-t border-outline/50 text-center">
            <p className="text-[11px] md:text-xs text-on-surface-muted leading-relaxed font-medium">
              Dengan melanjutkan, Anda menyetujui{' '}
              <button 
                type="button" 
                onClick={() => setActiveModal('terms')} 
                className="underline hover:text-primary font-semibold cursor-pointer"
              >
                Syarat Ketentuan
              </button>{' '}
              dan{' '}
              <button 
                type="button" 
                onClick={() => setActiveModal('privacy')} 
                className="underline hover:text-primary font-semibold cursor-pointer"
              >
                Kebijakan Privasi
              </button>{' '}
              kami.
            </p>
          </div>
        </div>
      </div>

      {/* --- SIMPLE DIALOG MODAL (POPUP) WITHOUT COMPLEX FRAMEWORK ANIMATIONS OR ICONS --- */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)} // Closes popup when area outside is clicked
        >
          <div 
            className="bg-white rounded p-6 max-w-sm w-full border border-outline text-left shadow-xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // Prevents closing when body of popup is clicked
          >
            {activeModal === 'terms' ? (
              <>
                <h3 className="text-lg font-bold text-[#111827] font-brand">Syarat & Ketentuan FanraBot</h3>
                <div className="text-xs text-on-surface-variant leading-relaxed space-y-3 font-sans">
                  <p>
                    <strong>1. Definisi Layanan:</strong> FanraBot adalah sistem orkestrasi WhatsApp & kecerdasan buatan (AI) terintegrasi demi kenyamanan otomatisasi tim.
                  </p>
                  <p>
                    <strong>2. Penggunaan Akun:</strong> Anda bertanggung jawab penuh untuk mengamankan kredensial pemulihan akun Anda agar terhindar dari pemakaian tidak sah.
                  </p>
                  <p>
                    <strong>3. Larangan Aktivitas:</strong> Dilarang keras menyebarkan spam ilegal, menyabotase nomor kontak atau melayangkan upaya program merusak/hack.
                  </p>
                  <p>
                    <strong>4. Kebijakan Update:</strong> Kami berhak menyetel performa SaaS dan memutakhirkan modul fungsional tanpa pemberitahuan guna stabilisasi server.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-[#111827] font-brand">Kebijakan Privasi FanraBot</h3>
                <div className="text-xs text-on-surface-variant leading-relaxed space-y-3 font-sans">
                  <p>
                    <strong>1. Data Yang Dikumpulkan:</strong> Kami merekam data nama pengguna, enkripsi kata sandi, dan alamat email Anda murni untuk kebutuhan kelola akun.
                  </p>
                  <p>
                    <strong>2. Keamanan Kredensial:</strong> Seluruh identitas akun Anda dienkripsi berlapis dan diletakkan di dalam penyimpanan web Firebase Firestore Cloud.
                  </p>
                  <p>
                    <strong>3. Pembatasan Pihak Ketiga:</strong> Kami berkomitmen penuh untuk menjamin tidak menjual, membagi, atau membocorkan data bisnis privat Anda ke pihak luar.
                  </p>
                  <p>
                    <strong>4. Hak Akses:</strong> Anda berhak mengubah data kata sandi Anda sewaktu-waktu lewat alur reset sandi untuk menjamin kedaulatan informasi Anda.
                  </p>
                </div>
              </>
            )}
            
            {/* Plain "Keluar" button without boxes, icons, or complex animations as requested */}
            <button 
              type="button"
              onClick={() => setActiveModal(null)}
              className="text-sm font-semibold text-center text-on-surface hover:text-[#dc2626] font-brand cursor-pointer focus:outline-none transition-colors border-t border-outline/50 pt-2.5 mt-1 select-none"
            >
              Keluar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
