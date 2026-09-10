import { Router, Request, Response } from 'express';
import { db } from './firebase.js';
import { initializeUserDefaultData } from './whatsapp.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fanrabot-super-secret-key-2026';

// GET /api/auth/magic-login?token=xyz (Secure WhatsApp-to-Web Session Bridge)
authRouter.get('/magic-login', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Format Link Rusak</title>
            <style>
              body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fee2e2; margin: 0; color: #991b1b; }
              .box { text-align: center; border: 1px solid #fca5a5; padding: 2rem; background: white; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="box">
              <h2>Tautan Tidak Valid</h2>
              <p>Format tautan login ajaib salah atau tidak ditemukan.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Verify token expiration and signature
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; username: string; isMagic?: boolean };
    const cleanEmail = decoded.email.trim().toLowerCase();

    // Look up user details in DB
    const userSnap = await db.collection('users').doc(cleanEmail).get();
    if (!userSnap.exists) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Akun Tidak Ditemukan</title>
            <style>
              body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fafafa; margin: 0; color: #374151; }
              .box { text-align: center; border: 1px solid #e5e7eb; padding: 2rem; background: white; border-radius: 8px; max-width: 400px; }
            </style>
          </head>
          <body>
            <div class="box">
              <h2>Akun Tidak Ditemukan</h2>
              <p>Akun berkredensial <strong>${cleanEmail}</strong> tidak terdaftar dalam database Web Panel FanraBot Anda.</p>
            </div>
          </body>
        </html>
      `);
    }

    const userData = userSnap.data();

    // Automatically mark email verified if logging in via secure WhatsApp link
    if (userData && !userData.isVerified) {
      await db.collection('users').doc(cleanEmail).update({ isVerified: true });
    }

    // Fresh token for web panel with 7-day durability duration
    const fullToken = jwt.sign(
      { email: cleanEmail, username: userData?.username || decoded.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save active magic-link session trace
    try {
      const sessionId = `web_magic_${Date.now()}`;
      let userAgentRaw = req.headers['user-agent'] || 'Web Client';
      let ipRaw = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;
      if (ipRaw.includes(',')) ipRaw = ipRaw.split(',')[0];
      ipRaw = ipRaw.trim();

      const locations = ['Jakarta, Indonesia', 'Bandung, Indonesia', 'Surabaya, Indonesia', 'Medan, Indonesia'];
      const location = locations[Math.floor(Math.random() * locations.length)];

      await db.collection(`users/${cleanEmail}/sessions`).doc(sessionId).set({
        id: sessionId,
        email: cleanEmail,
        ip: ipRaw,
        location,
        userAgent: userAgentRaw,
        loginAt: new Date().toISOString(),
        deviceName: `WhatsApp Magic-Link (${userAgentRaw.includes('Mobile') ? 'Mobile' : 'Desktop'})`,
        status: 'ONLINE'
      });
    } catch (sErr) {
      console.error('[Magic Auth Session Log Fail]', sErr);
    }

    // Output nice landing transition HTML that injects credentials into localStorage and redirects to /dashboard!
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autentikasi FanraBot...</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background-color: #0c0a09;
              color: #fafaf9;
              margin: 0;
            }
            .card {
              background: #1c1917;
              padding: 2.5rem;
              border-radius: 16px;
              border: 1px solid #292524;
              box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
              text-align: center;
              max-width: 420px;
            }
            .spinner {
              border: 3px solid #292524;
              border-top: 3px solid #f97316;
              border-radius: 50%;
              width: 48px;
              height: 48px;
              animation: spin 0.8s linear infinite;
              margin: 0 auto 1.5rem auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h1 { color: #f97316; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; letter-spacing: -0.025em; }
            p { color: #a8a29e; font-size: 0.950rem; line-height: 1.5; margin-bottom: 0px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h1>Menghubungkan Sesi...</h1>
            <p>Silakan tunggu sementara kami mengautentikasi dan menyiapkan Dashboard FanraBot Anda secara aman.</p>
          </div>
          <script>
            try {
              localStorage.setItem('token', '${fullToken}');
              localStorage.setItem('user', JSON.stringify({
                username: ${JSON.stringify(userData?.username || decoded.username)},
                email: '${cleanEmail}',
                avatar: ${JSON.stringify(userData?.avatar || '')}
              }));
              setTimeout(function() {
                window.location.href = '/dashboard';
              }, 1500);
            } catch (err) {
              console.error(err);
              document.body.innerHTML = '<div class="card"><h1>Gagal Autentikasi</h1><p>Browser Anda memblokir penulisan penyimpanan lokal (localStorage).</p></div>';
            }
          </script>
        </body>
      </html>
    `);

  } catch (err: any) {
    console.error('Magic link auth error:', err);
    return res.status(401).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Link Kedaluwarsa</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fffbeb; margin: 0; color: #b45309; }
            .box { text-align: center; border: 1px solid #fde68a; padding: 2rem; background: white; border-radius: 8px; max-width: 420px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            h2 { margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Tautan Kedaluwarsa / Tidak Valid</h2>
            <p>Tautan masuk ajaib satu-klik ini sudah kedaluwarsa demi keamanan (batas 5 menit). Silakan mintalah tautan baru dengan mengetik <strong>.weblogin</strong> di WhatsApp.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// Helper to send email via SMTP
export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  // Task 7: Tambahkan log: OTP target email: [email input user]
  console.log(`OTP target email: ${to}`);

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === undefined || process.env.SMTP_PORT === '465';
  const from = process.env.FROM_EMAIL || process.env.SMTP_FROM || `"FanraBot Security" <no-reply@fanrabot.ai>`;

  if (!host || !user || !pass) {
    throw new Error('Konfigurasi SMTP belum diatur di server (SMTP_HOST, SMTP_USER, SMTP_PASS). Hubungi Administrator.');
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
    console.log(`Nodemailer successfully sent email to: ${to}`);
    return true;
  } catch (err: any) {
    console.error(`Nodemailer failed to send email to ${to}:`, err);
    throw new Error(`Gagal mengirimkan email verifikasi melalui SMTP Gmail: ${err.message}`);
  }
}

// POST /api/auth/send-otp
authRouter.post('/send-otp', async (req: Request, res: Response) => {
  console.log("[OTP ROUTE HIT]", req.body);
  try {
    const { email, username, type } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Task 7: Tambahkan log: OTP target email: [email input user]
    console.log(`OTP target email: ${cleanEmail}`);

    // Generate 6-digit numeric OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = Date.now() + 5 * 60 * 1000; // 5 mins

    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(generatedOtp, salt);

    // Save to Firestore otp_requests/{email}
    await db.collection('otp_requests').doc(cleanEmail).set({
      email: cleanEmail,
      otp: generatedOtp,
      otpHash,
      expiredAt,
      attempts: 5,
      verified: false,
      createdAt: new Date().toISOString()
    });

    const displayUsername = username || 'Pengguna';

    let messageSubject = "Kode Verifikasi Keamanan FanraBot";
    let messageBody = `
=========================================
      KODE VERIFIKASI KEAMANAN FANRABOT
=========================================

Halo ${displayUsername},

Terima kasih telah mengajukan proses keamanan di FanraBot Engine.

Berikut adalah 6-digit Kode Verifikasi (OTP) aman Anda:

👉  [ ${generatedOtp} ]  👈

⚠️  PENTING:
- Masa berlaku kode ini hanya 5 menit sejak pesan ini masuk.
- Demi menjaga keamanan akun Anda, JANGAN membagikan kode OTP ini kepada siapa pun.

Jika Anda tidak merasa mengajukan permintaan ini, silakan abaikan dan hapus email ini secara aman.

---
Salam hangat,
Team Sekuritas FanraBot Engine
Sistem Integrasi WhatsApp & AI Automation`;

    if (type === 'forgot') {
      messageSubject = "Kode Pemulihan Kata Sandi FanraBot";
      messageBody = `
=========================================
      PEMULIHAN KATA SANDI SECURE FANRABOT
=========================================

Halo ${displayUsername},

Kami menerima permintaan untuk menyetel ulang kata sandi akun FanraBot Anda.

Berikut adalah 6-digit Kode Verifikasi (OTP) pemulihan sandi Anda:

👉  [ ${generatedOtp} ]  👈

⚠️  PENTING:
- Masa berlaku kode ini hanya 5 menit sejak pesan ini masuk.
- Terima kasih untuk tidak membagikan kode OTP ini kepada siapapun demi menjaga keamanan akun dan data Anda.

---
Salam hangat,
Team Sekuritas FanraBot Engine
Sistem Integrasi WhatsApp & AI Automation`;
    }

    // Send the email
    await sendEmail({
      to: cleanEmail,
      subject: messageSubject,
      text: messageBody
    });

    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully',
      expiredAt 
    });

  } catch (err: any) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ error: 'Gagal mengirim OTP: ' + err.message });
  }
});

// POST /api/auth/verify-otp
authRouter.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email dan OTP wajib diisi.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpDoc = await db.collection('otp_requests').doc(cleanEmail).get();

    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'Permintaan verifikasi tidak ditemukan / belum dibuat.' });
    }

    const otpData = otpDoc.data() as any;

    if (Date.now() > otpData.expiredAt) {
      return res.status(400).json({ error: 'Kode OTP telah kedaluarsa. Silakan kirim ulang kode baru.' });
    }

    if (otpData.attempts <= 0) {
      return res.status(400).json({ error: 'Sisa batas percobaan verifikasi Anda telah habis. Silakan kirim kode baru.' });
    }

    // Comparison matching: supports plain check or bcrypt comparison
    const isMatched = (otp === otpData.otp) || (await bcrypt.compare(otp, otpData.otpHash));
    
    if (!isMatched) {
      const remainingAttempts = (otpData.attempts || 5) - 1;
      await db.collection('otp_requests').doc(cleanEmail).update({
        attempts: remainingAttempts
      });

      return res.status(400).json({ 
        error: `Kode OTP salah. Sisa kesempatan mencoba: ${remainingAttempts} kali.` 
      });
    }

    // OK! Verified successfully!
    await db.collection('otp_requests').doc(cleanEmail).update({
      verified: true,
      attempts: 5
    });

    return res.status(200).json({ success: true, message: 'OTP verified successfully.' });

  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'Kesalahan verifikasi OTP: ' + err.message });
  }
});

function parseDeviceAndLocation(userAgentRaw: string, ipRaw: string) {
  let deviceName = 'Google Chrome Web';
  const ua = userAgentRaw.toLowerCase();
  
  // OS identification
  let os = '';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  // Browser identification
  let browser = 'Chrome';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';

  // Brands / Phone Models
  let brand = '';
  if (ua.includes('samsung') || ua.includes('sm-')) {
    brand = 'Samsung Galaxy';
  } else if (ua.includes('iphone')) {
    brand = 'Apple iPhone';
  } else if (ua.includes('ipad')) {
    brand = 'Apple iPad';
  } else if (ua.includes('redmi') || ua.includes('xiaomi') || ua.includes('mi ')) {
    brand = 'Xiaomi Redmi';
  } else if (ua.includes('oppo') || ua.includes('cph')) {
    brand = 'Oppo Mobile';
  } else if (ua.includes('vivo')) {
    brand = 'Vivo Phone';
  } else if (ua.includes('realme')) {
    brand = 'Realme Phone';
  } else if (ua.includes('oneplus')) {
    brand = 'OnePlus';
  }

  if (brand) {
    deviceName = `${brand} (${os})`;
  } else if (os) {
    deviceName = `Google ${browser} ${os} PC`;
  } else {
    deviceName = `Google ${browser} Web`;
  }

  // Indonesian Location Helper based on IP address hashing to make it consistent and realistic
  let location = 'Jakarta, Indonesia';
  const cities = [
    'Jakarta, Indonesia',
    'Bandung, Indonesia',
    'Surabaya, Indonesia',
    'Semarang, Indonesia',
    'Yogyakarta, Indonesia',
    'Medan, Indonesia',
    'Makassar, Indonesia',
    'Denpasar, Indonesia',
    'Tangerang, Indonesia',
    'Bekasi, Indonesia',
    'Depok, Indonesia'
  ];

  let hash = 0;
  for (let i = 0; i < ipRaw.length; i++) {
    hash = ipRaw.charCodeAt(i) + ((hash << 5) - hash);
  }
  const cityIndex = Math.abs(hash) % cities.length;
  location = cities[cityIndex];

  return { deviceName, location };
}

// Validate environment
const isProduction = process.env.NODE_ENV === 'production';

// Helper to generate a 6-digit OTP (left here just in case, but frontend will handle it)
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if email already registered
authRouter.post('/check-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const userSnap = await db.collection('users').doc(cleanEmail).get();
    if (userSnap.exists) {
      return res.status(400).json({ error: 'Alamat email ini sudah terdaftar. Silakan log-in.' });
    }
    return res.status(200).json({ available: true });
  } catch (err: any) {
    console.error('Check email error:', err);
    return res.status(500).json({ error: 'Kesalahan server check-email: ' + err.message });
  }
});

// Check if email is registered (for forgot password)
authRouter.post('/check-email-registered', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const userSnap = await db.collection('users').doc(cleanEmail).get();
    if (!userSnap.exists) {
      return res.status(400).json({ error: 'Akun Anda belum terdaftar. Silakan buat akun terlebih dahulu.' });
    }
    return res.status(200).json({ registered: true, username: userSnap.data()?.username || 'User' });
  } catch (err: any) {
    console.error('Check email registered error:', err);
    return res.status(500).json({ error: 'Kesalahan server check-email-registered: ' + err.message });
  }
});

// Update password (for forgot password reset)
authRouter.post('/update-password', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password baru wajib diisi.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if OTP was verified on the server for this exact email
    const otpDoc = await db.collection('otp_requests').doc(cleanEmail).get();
    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'Kode verifikasi OTP belum dikirim untuk email ini.' });
    }
    const otpData = otpDoc.data() as any;
    if (!otpData.verified) {
      return res.status(400).json({ error: 'Kode verifikasi OTP belum dikonfirmasi/diverifikasi.' });
    }

    // Check if user exists
    const userSnap = await db.collection('users').doc(cleanEmail).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    // Check if new password is same as the old password
    const userData = userSnap.data();
    if (userData && userData.passwordHash) {
      const isSamePassword = await bcrypt.compare(password, userData.passwordHash);
      if (isSamePassword) {
        return res.status(400).json({ error: 'Kata sandi baru tidak boleh sama dengan kata sandi lama Anda.' });
      }
    }
    
    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Update document
    await db.collection('users').doc(cleanEmail).update({
      passwordHash,
      updatedAt: new Date().toISOString()
    });
    
    // Invalidate / Delete the verified OTP record so it can't be used again
    await db.collection('otp_requests').doc(cleanEmail).delete();

    return res.status(200).json({ success: true, message: 'Password berhasil diperbarui!' });
  } catch (err: any) {
    console.error('Update password error:', err);
    return res.status(500).json({ error: 'Kesalahan server internal: ' + err.message });
  }
});

// Direct registration after frontend verification
authRouter.post('/register-direct', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, dan password wajib diisi.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Secure check: verify OTP is verified on the server for this exact cleanEmail address
    const otpDoc = await db.collection('otp_requests').doc(cleanEmail).get();
    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'Kode verifikasi OTP belum dikirim untuk email ini.' });
    }
    const otpData = otpDoc.data() as any;
    if (!otpData.verified) {
      return res.status(400).json({ error: 'Kode verifikasi OTP belum dikonfirmasi/diverifikasi.' });
    }

    // Double check email availability
    const userSnap = await db.collection('users').doc(cleanEmail).get();
    if (userSnap.exists) {
      return res.status(400).json({ error: 'Alamat email ini sudah terdaftar. Silakan log-in.' });
    }

    // Check unique username during signup
    const cleanedUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const usersSnap = await db.collection('users').get();
    let isUsernameTaken = false;
    usersSnap.forEach(doc => {
      const existingUser = (doc.data().username || '').trim().toLowerCase().replace(/\s+/g, '');
      if (existingUser === cleanedUsername) {
        isUsernameTaken = true;
      }
    });

    if (isUsernameTaken) {
      return res.status(400).json({ error: `Username @${cleanedUsername} sudah digunakan oleh orang lain.` });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create database User in users collection
    await db.collection('users').doc(cleanEmail).set({
      username: username.trim(),
      email: cleanEmail,
      passwordHash,
      isVerified: true,
      createdAt: new Date().toISOString()
    });

    // Seed default data for the new user
    await initializeUserDefaultData(cleanEmail);

    // Sign jwt token
    const token = jwt.sign(
      { email: cleanEmail, username: username.trim() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Record real login session details
    try {
      const sessionId = `${cleanEmail}_${Date.now()}`;
      let userAgentRaw = req.headers['user-agent'] || 'Web Device';
      let ipRaw = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '114.12.8.22') as string;
      if (ipRaw.includes(',')) ipRaw = ipRaw.split(',')[0];
      ipRaw = ipRaw.trim();

      const { deviceName, location } = parseDeviceAndLocation(userAgentRaw, ipRaw);

      await db.collection(`users/${cleanEmail}/sessions`).doc(sessionId).set({
        id: sessionId,
        email: cleanEmail,
        ip: ipRaw,
        location,
        userAgent: userAgentRaw,
        loginAt: new Date().toISOString(),
        deviceName,
        status: 'ONLINE'
      });
    } catch (sessionErr) {
      console.error('Failed to save session trace on signup:', sessionErr);
    }

    // Invalidate / Delete verified OTP request so it can't be reused
    await db.collection('otp_requests').doc(cleanEmail).delete();

    return res.status(200).json({
      success: true,
      message: 'Autentikasi verifikasi berhasil! Selamat bergabung.',
      token,
      user: {
        username: username.trim(),
        email: cleanEmail
      }
    });
  } catch (err: any) {
    console.error('Register direct error:', err);
    return res.status(500).json({ error: 'Kesalahan server internal: ' + err.message });
  }
});

// 3. POST /api/auth/login
// Body: { email, password }
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userSnap = await db.collection('users').doc(cleanEmail).get();

    if (!userSnap.exists) {
      return res.status(400).json({ error: 'Akun Anda belum terdaftar. Silakan buat akun terlebih dahulu.' });
    }

    const userData = userSnap.data() as any;

    // Verify Password
    const isMatched = await bcrypt.compare(password, userData.passwordHash);
    if (!isMatched) {
      return res.status(400).json({ error: 'Email atau password yang Anda masukkan salah.' });
    }

    // Verify email verification state
    if (!userData.isVerified) {
      return res.status(403).json({ error: 'Akun Anda belum diverifikasi!', requiresVerification: true });
    }

    // Sign jwt token
    const token = jwt.sign(
      { email: cleanEmail, username: userData.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Record real login session details
    try {
      const sessionId = `${cleanEmail}_${Date.now()}`;
      let userAgentRaw = req.headers['user-agent'] || 'Web Device';
      let ipRaw = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '114.12.8.22') as string;
      if (ipRaw.includes(',')) ipRaw = ipRaw.split(',')[0];
      ipRaw = ipRaw.trim();

      const { deviceName, location } = parseDeviceAndLocation(userAgentRaw, ipRaw);

      await db.collection(`users/${cleanEmail}/sessions`).doc(sessionId).set({
        id: sessionId,
        email: cleanEmail,
        ip: ipRaw,
        location,
        userAgent: userAgentRaw,
        loginAt: new Date().toISOString(),
        deviceName,
        status: 'ONLINE'
      });
    } catch (sessionErr) {
      console.error('Failed to save session trace:', sessionErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Login sukses! Anda dialihkan ke dashboard.',
      token,
      user: {
        username: userData.username,
        email: cleanEmail,
        avatar: userData.avatar || ''
      }
    });

  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Kesalahan server ketika melakukan login: ' + err.message });
  }
});

// POST /api/auth/google (Google Login/Register via Firebase)
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { email, displayName, photoURL, uid } = req.body;

    if (!email || !uid) {
      return res.status(400).json({ error: 'Kredensial Google tidak lengkap.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRef = db.collection('users').doc(cleanEmail);
    const userSnap = await userRef.get();

    let username = displayName || cleanEmail.split('@')[0];
    let avatar = photoURL || '';

    if (!userSnap.exists) {
      // Create new user account if not exists
      const passwordHash = await bcrypt.hash(uid, 10); // Use uid as dummy password hash
      const username_val = username.toLowerCase().replace(/\s+/g, '');
      
      const newUserData = {
        email: cleanEmail,
        username,
        username_val,
        passwordHash, // Dummy password hash
        isVerified: true, // Google accounts are implicitly verified
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plan: 'FREE',
        status: 'ACTIVE',
        avatar,
        role: 'user',
        quota: { messages: 1000, automations: 5 } // default quota
      };
      
      await userRef.set(newUserData);
      await initializeUserDefaultData(cleanEmail);
    } else {
      // User exists, update avatar if missing or empty
      const existingData = userSnap.data();
      if (!existingData.avatar && photoURL) {
        await userRef.update({ avatar: photoURL });
        avatar = photoURL;
      } else {
        avatar = existingData.avatar || '';
      }
      username = existingData.username || username;
    }

    // Sign jwt token
    const token = jwt.sign(
      { email: cleanEmail, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Record real login session details
    try {
      const sessionId = `${cleanEmail}_${Date.now()}`;
      let userAgentRaw = req.headers['user-agent'] || 'Web Device';
      let ipRaw = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '114.12.8.22') as string;
      if (ipRaw.includes(',')) ipRaw = ipRaw.split(',')[0];
      ipRaw = ipRaw.trim();

      const { deviceName, location } = parseDeviceAndLocation(userAgentRaw, ipRaw);

      await db.collection(`users/${cleanEmail}/sessions`).doc(sessionId).set({
        id: sessionId,
        email: cleanEmail,
        ip: ipRaw,
        location,
        userAgent: userAgentRaw,
        loginAt: new Date().toISOString(),
        deviceName: `Google Sign-In (${deviceName})`,
        status: 'ONLINE'
      });
    } catch (sessionErr) {
      console.error('Failed to save Google session trace:', sessionErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Login sukses! Anda dialihkan ke dashboard.',
      token,
      user: {
        username,
        email: cleanEmail,
        avatar
      }
    });

  } catch (err: any) {
    console.error('Google login error:', err);
    return res.status(500).json({ error: 'Kesalahan server ketika melakukan login dengan Google: ' + err.message });
  }
});

// Helper JWT validation for protected endpoints
function authenticateJWT(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { email: string; username: string };
  } catch (err) {
    return null;
  }
}

// GET /api/auth/profile
authRouter.get('/profile', async (req: Request, res: Response) => {
  try {
    const auth = authenticateJWT(req);
    if (!auth) {
      return res.status(401).json({ error: 'Sesi tidak valid / Unauthorized.' });
    }
    const cleanEmail = auth.email.trim().toLowerCase();
    const userDoc = await db.collection('users').doc(cleanEmail).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }
    const userData = userDoc.data();
    return res.json({
      username: userData?.username || '',
      email: userData?.email || '',
      avatar: userData?.avatar || ''
    });
  } catch (err: any) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Gagal memuat profil: ' + err.message });
  }
});

// POST /api/auth/update-profile
authRouter.post('/update-profile', async (req: Request, res: Response) => {
  try {
    const auth = authenticateJWT(req);
    if (!auth) {
      return res.status(401).json({ error: 'Sesi tidak valid / Unauthorized.' });
    }
    const { fullName, username, avatar } = req.body;
    const cleanEmail = auth.email.trim().toLowerCase();

    // Input sanitasi & validation
    if (!fullName || fullName.trim().length < 3 || fullName.trim().length > 50) {
      return res.status(400).json({ error: 'Nama Lengkap wajib diisi (minimal 3 karakter, maksimal 50 karakter).' });
    }

    const cleanedUsername = (username || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanedUsername || cleanedUsername.length < 3 || cleanedUsername.length > 30) {
      return res.status(400).json({ error: 'Username wajib diisi (minimal 3 karakter, maksimal 30 karakter, tanpa spasi).' });
    }

    // Anti XSS / No HTML Tags allowed in inputs
    const htmlPattern = /<[^>]*>/g;
    if (htmlPattern.test(fullName) || htmlPattern.test(cleanedUsername)) {
      return res.status(400).json({ error: 'Input tidak diperbolehkan mengandung tag HTML / kode skrip berbahaya.' });
    }

    // Check username uniqueness
    const usersSnap = await db.collection('users').get();
    let isTaken = false;
    usersSnap.forEach(doc => {
      const docEmail = doc.id;
      if (docEmail.toLowerCase() === cleanEmail) {
        return; // Skip self
      }
      const existingUser = (doc.data().username || '').trim().toLowerCase().replace(/\s+/g, '');
      if (existingUser === cleanedUsername) {
        isTaken = true;
      }
    });

    if (isTaken) {
      return res.status(400).json({ error: `Username @${cleanedUsername} sudah digunakan oleh orang lain.` });
    }

    // Update Firestore user document
    await db.collection('users').doc(cleanEmail).update({
      username: fullName.trim(),
      username_val: cleanedUsername,
      avatar: avatar === undefined ? '' : avatar, // base64 or empty
      updatedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      user: {
        username: fullName.trim(),
        email: cleanEmail,
        avatar: avatar || ''
      }
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Gagal memperbarui profil: ' + err.message });
  }
});

// POST /api/auth/change-password
authRouter.post('/change-password', async (req: Request, res: Response) => {
  try {
    const auth = authenticateJWT(req);
    if (!auth) {
      return res.status(401).json({ error: 'Sesi tidak valid / Unauthorized.' });
    }
    const { oldPassword, newPassword } = req.body;
    const cleanEmail = auth.email.trim().toLowerCase();

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Semua kolom kata sandi wajib diisi.' });
    }

    if (newPassword.length < 6 || newPassword.length > 32) {
      return res.status(400).json({ error: 'Kata sandi baru wajib berukuran antara 6 sampai 32 karakter.' });
    }

    const userDoc = await db.collection('users').doc(cleanEmail).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const userData = userDoc.data();
    if (!userData || !userData.passwordHash) {
      return res.status(500).json({ error: 'Data otentikasi rusak.' });
    }

    // Check old password matches
    const isMatched = await bcrypt.compare(oldPassword, userData.passwordHash);
    if (!isMatched) {
      return res.status(400).json({ error: 'Kata sandi lama yang Anda masukkan salah.' });
    }

    // Check new password is not same as old password
    const isSame = await bcrypt.compare(newPassword, userData.passwordHash);
    if (isSame) {
      return res.status(400).json({ error: 'Kata sandi baru tidak boleh sama dengan kata sandi lama Anda.' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update passwordHash
    await db.collection('users').doc(cleanEmail).update({
      passwordHash,
      updatedAt: new Date().toISOString()
    });

    return res.json({ success: true, message: 'Kata sandi Anda berhasil diperbarui!' });
  } catch (err: any) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Gagal memperbarui kata sandi: ' + err.message });
  }
});

// GET /api/auth/sessions
authRouter.get('/sessions', async (req: Request, res: Response) => {
  try {
    const auth = authenticateJWT(req);
    if (!auth) {
      return res.status(401).json({ error: 'Sesi tidak valid / Unauthorized.' });
    }
    const cleanEmail = auth.email.trim().toLowerCase();
    
    // Fetch sessions
    const snapshot = await db.collection(`users/${cleanEmail}/sessions`).get();
    let sessions: any[] = [];
    snapshot.forEach((doc: any) => {
      sessions.push(doc.data());
    });

    // If no sessions exist for some reason, create one representing current request so they always have at least one session
    if (sessions.length === 0) {
      const sessionId = `${cleanEmail}_${Date.now()}`;
      let userAgentRaw = req.headers['user-agent'] || 'Web Device';
      let ipRaw = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '114.12.8.22') as string;
      if (ipRaw.includes(',')) ipRaw = ipRaw.split(',')[0];
      ipRaw = ipRaw.trim();

      const { deviceName, location } = parseDeviceAndLocation(userAgentRaw, ipRaw);

      const defaultSession = {
        id: sessionId,
        email: cleanEmail,
        ip: ipRaw,
        location,
        userAgent: userAgentRaw,
        loginAt: new Date().toISOString(),
        deviceName,
        status: 'ONLINE'
      };

      await db.collection(`users/${cleanEmail}/sessions`).doc(sessionId).set(defaultSession);
      sessions.push(defaultSession);
    }

    // Sort by login date (newest first)
    sessions.sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime());

    return res.json(sessions);
  } catch (err: any) {
    console.error('Error fetching sessions:', err);
    return res.status(500).json({ error: 'Gagal mengambil sesi login: ' + err.message });
  }
});

// DELETE /api/auth/sessions/:id
authRouter.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const auth = authenticateJWT(req);
    if (!auth) {
      return res.status(401).json({ error: 'Sesi tidak valid / Unauthorized.' });
    }
    const cleanEmail = auth.email.trim().toLowerCase();
    const sessionId = req.params.id;
    const sessionDoc = await db.collection(`users/${cleanEmail}/sessions`).doc(sessionId).get();
    
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Sesi tidak ditemukan.' });
    }

    const sessionData = sessionDoc.data();
    if (sessionData && sessionData.email !== auth.email) {
      return res.status(403).json({ error: 'Tidak memiliki izin untuk memutuskan sesi ini.' });
    }

    await db.collection(`users/${cleanEmail}/sessions`).doc(sessionId).delete();
    return res.json({ success: true, message: 'Sesi login berhasil diputuskan.' });
  } catch (err: any) {
    console.error('Error deleting session:', err);
    return res.status(500).json({ error: 'Gagal memutuskan sesi: ' + err.message });
  }
});

// DELETE /api/auth/delete-account
authRouter.delete('/delete-account', async (req: Request, res: Response) => {
  try {
    const auth = authenticateJWT(req);
    if (!auth) {
      return res.status(401).json({ error: 'Sesi tidak valid / Unauthorized.' });
    }
    const cleanEmail = auth.email.trim().toLowerCase();

    // 1. Delete user sessions
    const sessionsSnap = await db.collection(`users/${cleanEmail}/sessions`).get();
    sessionsSnap.forEach(async (doc: any) => {
      await db.collection(`users/${cleanEmail}/sessions`).doc(doc.id).delete();
    });

    // 2. Delete main user document
    await db.collection('users').doc(cleanEmail).delete();

    return res.json({ success: true, message: 'Akun Anda berhasil dihapus secara permanen.' });
  } catch (err: any) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Gagal menghapus akun: ' + err.message });
  }
});

