import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  MessageSquare, 
  Calendar, 
  UserPlus, 
  Link2Off, 
  ShieldAlert, 
  PhoneOff, 
  Key,
  Info,
  Settings,
  Check,
  Loader2,
  X,
  FileText,
  Smile,
  Download,
  Image,
  QrCode,
  Link,
  Music,
  Shrink,
  Sparkles,
  Languages,
  RefreshCw,
  Star,
  Sword
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LoadingView } from '../components/LoadingView';

interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'textarea';
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
}

const FEATURE_FIELDS: Record<string, SettingField[]> = {
  autoReply: [
    { key: 'aiResponsePrefix', label: 'Prefix Balasan AI', type: 'text', placeholder: '✨ FanraBot: ' },
    { key: 'aiResponseDelay', label: 'Delay Balasan (Detik)', type: 'number', min: 0 }
  ],
  translateEnabled: [
    { key: 'translateDefaultLang', label: 'Default Target Language', type: 'select', options: [
      { value: 'en', label: 'Inggris (EN)' },
      { value: 'id', label: 'Indonesia (ID)' },
      { value: 'ja', label: 'Jepang (JA)' },
      { value: 'ko', label: 'Korea (KO)' }
    ]},
    { key: 'translateShowOriginal', label: 'Tampilkan Teks Asli', type: 'toggle' }
  ],
  autoTranslateEnabled: [
    { key: 'autoTranslateTargetLang', label: 'Target Language', type: 'select', options: [
      { value: 'en', label: 'Inggris (EN)' },
      { value: 'id', label: 'Indonesia (ID)' },
      { value: 'ja', label: 'Jepang (JA)' },
      { value: 'ko', label: 'Korea (KO)' }
    ]},
    { key: 'autoTranslateScope', label: 'Scope', type: 'select', options: [
      { value: 'group', label: 'Hanya Grup' },
      { value: 'private', label: 'Hanya Private' },
      { value: 'all', label: 'Grup & Private' }
    ]},
    { key: 'autoTranslateMode', label: 'Mode', type: 'select', options: [
      { value: 'foreign_only', label: 'Hanya Bahasa Asing' },
      { value: 'all_messages', label: 'Semua Pesan Masuk' }
    ]},
    { key: 'autoTranslateShowOriginal', label: 'Tampilkan Teks Asli', type: 'toggle' }
  ],
  ocrEnabled: [
    { key: 'ocrTranslate', label: 'Auto Translate Hasil OCR', type: 'toggle' }
  ],
  naturalToolsEnabled: [
    { key: 'naturalWakeWord', label: 'Wake Word', type: 'text', placeholder: 'fanra' },
    { key: 'naturalPrivateNoWakeWord', label: 'Aktif di Private Tanpa Wake Word', type: 'toggle' },
    { key: 'naturalAiFallback', label: 'AI Intent Fallback', type: 'toggle' }
  ],
  aggressiveAI: [
    { key: 'aggressiveAITarget', label: 'Target', type: 'select', options: [
      { value: 'group', label: 'Hanya Grup' },
      { value: 'private', label: 'Hanya Private' },
      { value: 'all', label: 'Grup & Private' }
    ]},
    { key: 'aggressiveAIInterval', label: 'Minimal Jeda Antar Balasan (Detik)', type: 'number', min: 1 },
    { key: 'aggressiveAIResponseMode', label: 'Mode Respons', type: 'select', options: [
      { value: 'casual', label: 'Santai' },
      { value: 'formal', label: 'Formal' },
      { value: 'fast', label: 'Cepat' }
    ]},
    { key: 'aggressiveAIMinMessages', label: 'Batas Minimal Pesan Chat untuk Chime-In', type: 'number', min: 1 },
    { key: 'aggressiveAIProbability', label: 'Probabilitas Respons Agresif (%)', type: 'number', min: 1 },
    { key: 'aggressiveAILanguage', label: 'Bahasa Respons Agresif', type: 'select', options: [
      { value: 'auto', label: 'Sesuai Obrolan (Auto / Detect)' },
      { value: 'en', label: 'Selalu Bahasa Inggris (English Only)' }
    ]}
  ],
  adminToolsEnabled: [
    { key: 'adminAuthOnly', label: 'Access', type: 'select', options: [
      { value: 'admin', label: 'Admin Only' },
      { value: 'owner', label: 'Owner Only' }
    ]},
    { key: 'adminSilentFail', label: 'Silent Fail', type: 'toggle' },
    { key: 'adminToolsAlert', label: 'Reply for Unauthorized Access (Empty to disable)', type: 'textarea' }
  ],
  antiLinkEnabled: [
    { key: 'antiLinkAction', label: 'Action', type: 'select', options: [
      { value: 'delete', label: 'Delete' },
      { value: 'warn', label: 'Warn' },
      { value: 'kick', label: 'Kick' }
    ]},
    { key: 'antiLinkFilterScope', label: 'Bekerja Untuk (Target Proteksi)', type: 'select', options: [
      { value: 'everyone', label: 'Semua Orang (Hapus Semua Link)' },
      { value: 'except_admin', label: 'Kecuali Admin (Hapus Non-Admin Saja)' },
      { value: 'except_owner_bot', label: 'Kecuali Owner & Bot (Admin Tetap Dihapus)' }
    ]},
    { key: 'antiLinkWhitelist', label: 'Whitelist Domain (Koma Terpisah)', type: 'text', placeholder: 'google.com, youtube.com' },
    { key: 'antiLinkAlert', label: 'Reply Warning Message (Empty to disable)', type: 'textarea' }
  ],
  antiSpamEnabled: [
    { key: 'spamLimitMessages', label: 'Limit Pesan', type: 'number', min: 1 },
    { key: 'spamLimitStickers', label: 'Limit Sticker', type: 'number', min: 1 },
    { key: 'spamWindowSeconds', label: 'Window Detik', type: 'number', min: 1 },
    { key: 'spamAction', label: 'Action', type: 'select', options: [
      { value: 'delete', label: 'Delete' },
      { value: 'warn', label: 'Warn' },
      { value: 'kick', label: 'Kick' }
    ]},
    { key: 'antiSpamAlert', label: 'Reply Warning Message (Empty to disable)', type: 'textarea' }
  ],
  antiBadWordEnabled: [
    { key: 'badWords', label: 'Daftar Kata (Koma Terpisah)', type: 'textarea' },
    { key: 'badWordAction', label: 'Action', type: 'select', options: [
      { value: 'delete', label: 'Delete' },
      { value: 'warn', label: 'Warn' },
      { value: 'kick', label: 'Kick' }
    ]},
    { key: 'badWordAlert', label: 'Reply Warning Message (Empty to disable)', type: 'textarea' }
  ],
  antiTagAllEnabled: [
    { key: 'antiTagAllAllowed', label: 'Diizinkan Untuk', type: 'select', options: [
      { value: 'admin_only', label: 'Admin Saja (Rekomendasi)' },
      { value: 'no_one', label: 'Tidak Ada (Semua Dilarang)' },
      { value: 'everyone', label: 'Semua Anggota' }
    ]},
    { key: 'antiTagAllThreshold', label: 'Limit Mention Massal Manual', type: 'number', min: 2, placeholder: 'Jumlah batasan memention secara manual (Default: 5)' },
    { key: 'antiTagAllAlert', label: 'Reply Warning Message (Empty to disable)', type: 'textarea' }
  ],
  autoStickerEnabled: [
    { key: 'stickerPackName', label: 'Pack Name', type: 'text' },
    { key: 'stickerPackAuthor', label: 'Pack Author', type: 'text' },
    { key: 'stickerCircle', label: 'Circle Crop', type: 'toggle' },
    { key: 'stickerQuality', label: 'Quality', type: 'select', options: [
      { value: '50%', label: 'Hemat (50%)' },
      { value: '80%', label: 'Seimbang (80%)' },
      { value: '100%', label: 'Murni (100%)' }
    ]}
  ],
  textStickerEnabled: [
    { key: 'textStickerFont', label: 'Font Style', type: 'select', options: [
      { value: 'Impact', label: 'Impact Meme' },
      { value: 'Arial', label: 'Arial Bold' },
      { value: 'Courier', label: 'Courier Mono' },
      { value: 'Pacifico', label: 'Pacifico font' }
    ]},
    { key: 'textStickerColor', label: 'Warna Tulisan Teks', type: 'text', placeholder: 'white' },
    { key: 'textStickerBgColor', label: 'Warna Latar (Background Color)', type: 'text', placeholder: 'transparent' },
    { key: 'textStickerAutoFit', label: 'Auto Fit Text', type: 'toggle' }
  ],
  stickerToolsEnabled: [
    { key: 'stickerToolsFormat', label: 'Output Format', type: 'select', options: [
      { value: 'PNG', label: 'PNG Transparan' },
      { value: 'JPG', label: 'JPG Solid' }
    ]},
    { key: 'stickerToolsResolution', label: 'Output Resolution', type: 'select', options: [
      { value: '256x256', label: 'Kecil (256x256)' },
      { value: '512x512', label: 'Standar (512x512)' },
      { value: '1024x1024', label: 'HD Detail (1024x1024)' }
    ]}
  ],
  removeBgEnabled: [
    { key: 'removeBgProvider', label: 'Provider Engine', type: 'select', options: [
      { value: 'default', label: 'Default Service' },
      { value: 'removebg', label: 'Remove.bg Official Key' }
    ]},
    { key: 'removeBgOverlay', label: 'Output Latar Belakang', type: 'select', options: [
      { value: 'transparent', label: 'Transparent' },
      { value: 'white', label: 'White' },
      { value: 'blur', label: 'Blur' }
    ]},
    { key: 'removeBgQuality', label: 'Quality', type: 'select', options: [
      { value: 'Standard', label: 'Standard Definition' },
      { value: 'High', label: 'High Definition (HD)' }
    ]}
  ],
  hdImageEnabled: [
    { key: 'hdScale', label: 'Scale Factor', type: 'select', options: [
      { value: '2x', label: 'Low-Detail (2x)' },
      { value: '4x', label: 'Ultra HD (4x)' }
    ]},
    { key: 'hdProvider', label: 'Upscaler Provider', type: 'select', options: [
      { value: 'default', label: 'Default Upscaler AI' },
      { value: 'replicate', label: 'Replicate Cloud' }
    ]},
    { key: 'hdPreserveFace', label: 'Preserve Face Closeups', type: 'toggle' }
  ],
  photoRestoreEnabled: [
    { key: 'photoRestoreRemoveNoise', label: 'Remove Noise', type: 'toggle' },
    { key: 'photoRestoreSharpen', label: 'Sharpen Edge Details', type: 'toggle' },
    { key: 'photoRestoreFaceEnhance', label: 'Face Enhance Reconstruction', type: 'toggle' }
  ],
  compressMediaEnabled: [
    { key: 'compressQuality', label: 'Image Quality', type: 'select', options: [
      { value: '50%', label: 'Hemat (50%)' },
      { value: '75%', label: 'Standar (75%)' },
      { value: '90%', label: 'Massa Maksimal (90%)' }
    ]},
    { key: 'compressVideoResolution', label: 'Video Resolution', type: 'select', options: [
      { value: '360p', label: '360p Mini' },
      { value: '480p', label: '480p Standar' },
      { value: '720p', label: '720p HD' }
    ]},
    { key: 'compressMaxOutputSize', label: 'Max Output Size (MB)', type: 'number', min: 10 }
  ],
  downloaderEnabled: [
    { key: 'downloaderMaxMg', label: 'Max File Size (MB)', type: 'number', min: 10 },
    { key: 'downloaderShowMetadata', label: 'Show Metadata Detail', type: 'toggle' },
    { key: 'downloaderHighRes', label: 'Prefer HD 1080p', type: 'toggle' }
  ],
  playMp3Enabled: [
    { key: 'playMp3Bitrate', label: 'Bitrate Audio', type: 'select', options: [
      { value: '128kbps', label: 'Hemat (128kbps)' },
      { value: '192kbps', label: 'Standar (192kbps)' },
      { value: '320kbps', label: 'Suara Jernih (320kbps)' }
    ]},
    { key: 'playMp3MaxDuration', label: 'Max Duration (Menit)', type: 'number', min: 1 },
    { key: 'playMp3SendAs', label: 'Kirim Berkas Sebagai', type: 'select', options: [
      { value: 'audio', label: 'Voice Note' },
      { value: 'document', label: 'Document File' }
    ]}
  ],
  musicRecognitionEnabled: [
    { key: 'musicRecProvider', label: 'Music Provider', type: 'select', options: [
      { value: 'AcrCloud', label: 'ACRCloud Engine' },
      { value: 'shazam', label: 'Shazam Alternate' }
    ]},
    { key: 'musicRecIncludeYoutube', label: 'Include YouTube link', type: 'toggle' },
    { key: 'musicRecIncludeSpotify', label: 'Include Spotify link', type: 'toggle' }
  ],
  pdfToolsEnabled: [
    { key: 'pdfToImgQuality', label: 'Image to PDF Quality', type: 'select', options: [
      { value: 'High', label: 'High Quality' },
      { value: 'Low', label: 'Low Quality' }
    ]},
    { key: 'pdfImgFormat', label: 'PDF to Image Format', type: 'select', options: [
      { value: 'PNG', label: 'PNG' },
      { value: 'JPG', label: 'JPG' }
    ]},
    { key: 'pdfMaxPages', label: 'Max Pages Allowed', type: 'number', min: 5 }
  ],
  fileInspectorEnabled: [
    { key: 'fileInspectorDetail', label: 'Show Metadata Detail', type: 'toggle' },
    { key: 'fileInspectorHash', label: 'Show Hash/Checksum', type: 'toggle' }
  ],
  qrToolsEnabled: [
    { key: 'qrColor', label: 'QR Paint Color', type: 'select', options: [
      { value: 'Black', label: 'Hitam Polos' },
      { value: 'Blue', label: 'Biru Navy' },
      { value: 'DarkGreen', label: 'Hijau Daun' }
    ]},
    { key: 'qrCorrection', label: 'Error Correction Level', type: 'select', options: [
      { value: 'L', label: 'Level L (7%)' },
      { value: 'M', label: 'Level M (15%)' },
      { value: 'Q', label: 'Level Q (25%)' },
      { value: 'H', label: 'Level H (30%)' }
    ]},
    { key: 'qrPadding', label: 'Padding Ketebalan QR', type: 'number', min: 0 }
  ],
  toUrlEnabled: [
    { key: 'toUrlHost', label: 'Layanan Provider Host', type: 'select', options: [
      { value: 'Catbox', label: 'Catbox.moe' },
      { value: 'fileio', label: 'File.io Auto Hapus' }
    ]},
    { key: 'toUrlExpiration', label: 'Expiration', type: 'select', options: [
      { value: 'Never', label: 'Permanen (Never)' },
      { value: '24h', label: '24 Jam' },
      { value: '7d', label: '7 Hari' }
    ]},
    { key: 'toUrlDirectOnly', label: 'Return Direct Link Only', type: 'toggle' }
  ],
  shortUrlEnabled: [
    { key: 'shortUrlProvider', label: 'Short URL Provider', type: 'select', options: [
      { value: 'TinyURL', label: 'TinyURL' },
      { value: 'IsGd', label: 'Is.gd' },
      { value: 'VGo', label: 'V.gd' }
    ]},
    { key: 'shortUrlCustomAlias', label: 'Kustom Alias', type: 'text', placeholder: 'promo-ramadhan' },
    { key: 'shortUrlDomain', label: 'Kustom Domain', type: 'text', placeholder: 'link.pribadi.com' },
    { key: 'shortUrlAutoCopy', label: 'Auto Copy Link', type: 'toggle' }
  ],
  broadcastEnabled: [
    { key: 'broadcastMessage', label: 'Message Text', type: 'textarea' },
    { key: 'broadcastTime', label: 'Time Schedule (Harian)', type: 'text', placeholder: '12:00' },
    { key: 'broadcastTarget', label: 'Target Scope', type: 'select', options: [
      { value: 'all', label: 'Semua Kontak Obrolan' },
      { value: 'group', label: 'Hanya Grup' },
      { value: 'private', label: 'Hanya Private' }
    ]}
  ],
  welcomeEnabled: [
    { key: 'welcomeMode', label: 'Versi Salam Penyambutan', type: 'select', options: [
      { value: 'text', label: 'Teks Biasa (Standard)' },
      { value: 'image', label: 'Kartu Gambar Kreatif (Aesthetic Banner)' }
    ]},
    { key: 'welcomeCardTheme', label: 'Tema Kartu Selamat Datang (Welcome Card Theme)', type: 'select', options: [
      { value: 'cosmic_neon', label: 'Cosmic Neon (Ungu-Pink Modern)' },
      { value: 'cyan_sea', label: 'Cyan Sea (Biru-Turquoise Bersinar)' },
      { value: 'sunset_purple', label: 'Sunset Purple (Malam Senja)' },
      { value: 'emerald_abyss', label: 'Emerald Abyss (Hijau Misterius)' },
      { value: 'dark_matrix', label: 'Dark Matrix (Hitam Hacker Retro)' },
      { value: 'royal_gold', label: 'Royal Gold (Emas Mewah & Elit)' }
    ]},
    { key: 'welcomeCardQuote', label: 'Deklarasi Quote Kartu Gambar', type: 'text', placeholder: 'Semoga harimu menyenangkan dan mari berkembang bersama!' },
    { key: 'welcomeMessage', label: 'Salam Selamat Datang / Caption', type: 'textarea', placeholder: 'Gunakan @user untuk menyebut anggota baru, @group untuk nama grup.' },
    { key: 'welcomeNewContactsOnly', label: 'Only New Contact', type: 'toggle' },
    { key: 'welcomeDelaySeconds', label: 'Delay Seconds Sebelum Kirim', type: 'number', min: 0 }
  ],
  antiCallEnabled: [
    { key: 'antiCallMessage', label: 'Pemberitahuan Penolakan Telepon', type: 'textarea', placeholder: 'Ketik pesan pemberitahuan yang dikirim otomatis saat menolak panggilan.' }
  ],
  antiRaidEnabled: [
    { key: 'antiRaidAction', label: 'Tindakan Sanksi Pelaku', type: 'select', options: [
      { value: 'demote', label: 'Demote (Turun Admin - Sangat Aman)' },
      { value: 'kick', label: 'Kick (Keluarkan Sanksi Keras)' }
    ]},
    { key: 'antiRaidMode', label: 'Mode Proteksi Raid', type: 'select', options: [
      { value: 'admin_only', label: 'Lindungi Admin Saja (Rekomendasi)' },
      { value: 'all', label: 'Lindungi Semua Anggota (Sangat Ketat)' }
    ]},
    { key: 'antiRaidNotify', label: 'Notifikasi Grup Aktif', type: 'toggle' }
  ],
  antiVirtexEnabled: [
    { key: 'antiVirtexLength', label: 'Batas Karakter Minimum Teks Virtex', type: 'number', min: 1000, placeholder: 'Standard: 8000' }
  ],
  keywordResponseEnabled: [
    { key: 'keywordFuzzyMatch', label: 'Fuzzy Match Sebagian kata', type: 'toggle' },
    { key: 'keywordCaseSensitive', label: 'Case Sensitive Huruf', type: 'toggle' }
  ],
  rpgEnabled: [
    { key: 'rpgStartingCoins', label: 'Emas Awal (Starting Coins)', type: 'number', min: 0, placeholder: 'Default: 100' },
    { key: 'rpgTowerCooldown', label: 'Tower Cooldown (Detik Rest Cooldown)', type: 'number', min: 1, placeholder: 'Default: 15' },
    { key: 'rpgDuelCooldown', label: 'Duel Cooldown (Detik Rest Cooldown)', type: 'number', min: 1, placeholder: 'Default: 10' }
  ]
};

const FEATURE_DETAILS: Record<string, { commands: string[]; usage: string; mediaNote?: string }> = {
  autoReply: {
    commands: ['ai on', 'ai off', 'auto ai on', 'auto ai off'],
    usage: 'Aktifkan fitur ini agar asisten AI membalas pesan obrolan masuk secara otomatis menggunakan kecerdasan pintar (Gemini AI).',
  },
  translateEnabled: {
    commands: ['/tr id', '/tr en', '/translate id', '/translate en', 'fanra terjemahkan ini', 'fanra translate this', 'fanra ubah ke bahasa inggris', 'fanra ubah ke bahasa indonesia'],
    usage: 'Gunakan command dengan me-reply pesan teks yang ingin diterjemahkan, atau tulis teks setelah command (contoh: /tr en Halo dunia).',
  },
  autoTranslateEnabled: {
    commands: ['autotranslate on', 'autotranslate off', 'auto translate on', 'auto translate off', 'fanra aktifkan terjemahan otomatis', 'fanra matikan terjemahan otomatis'],
    usage: 'Aktifkan agar setiap masuk pesan dalam bahasa asing di grup atau chat pribadi otomatis langsung diterjemahkan ke bahasa pilihan.',
  },
  ocrEnabled: {
    commands: ['/ocr', '.ocr', '/readtext', 'fanra baca tulisan ini', 'fanra baca teks di gambar ini', 'fanra extract text from image'],
    usage: 'Kirim gambar/foto yang berisi teks tulis tangan atau cetak, atau reply gambar dengan menuliskan command.',
    mediaNote: 'Memerlukan reply atau caption sebuah berkas Gambar.',
  },
  naturalToolsEnabled: {
    commands: ['naturaltools on', 'naturaltools off', 'wakeword fanra', 'fanra aktifkan perintah natural', 'fanra matikan perintah natural'],
    usage: 'Gunakan bahasa santai sehari-hari untuk memerintahkan bot melakukan berbagai aksi tanpa command kaku.',
  },
  aggressiveAI: {
    commands: ['aggressive on', 'aggressive off', 'mode agresif on', 'mode agresif off', 'fanra aktifkan mode agresif', 'fanra matikan mode agresif'],
    usage: 'Bila aktif, asisten akan proaktif menanggapi obrolan grup/pribadi tanpa perlu di-tag atau dipanggil secara eksplisit.',
  },
  adminToolsEnabled: {
    commands: ['/open', '/close', '/linkgroup', '/revoke', '/kick', '/delete', '/promote', '/demote', 'fanra buka grup', 'fanra tutup grup', 'fanra kirim link grup', 'fanra reset link grup', 'fanra kick dia', 'fanra hapus pesan ini', 'fanra jadikan admin', 'fanra turunkan admin'],
    usage: 'Gunakan perintah di atas di dalam grup untuk mengelola hak akses kelompok, kontrol pesan, atau mengeluarkan anggota.',
  },
  antiLinkEnabled: {
    commands: ['antilink on', 'antilink off'],
    usage: 'Bot akan melacak seluruh pesan di grup dan otomatis menghapus pesan yang mengandung tautan/link mencurigakan.',
  },
  antiSpamEnabled: {
    commands: ['antispam on', 'antispam off'],
    usage: 'Bot membatasi jumlah pesan beruntun yang dikirim dalam hitungan detik untuk mencegah server lumpuh.',
  },
  antiBadWordEnabled: {
    commands: ['antibadword on', 'antibadword off'],
    usage: 'Bot memantau kata-kata kotor di grup dan otomatis menghapus pesan kasar/toksik demi kenyamanan anggota.',
  },
  antiTagAllEnabled: {
    commands: ['antitagall on', 'antitagall off'],
    usage: 'Melindungi grup dari mention brutal massal. Bot akan otomatis menghapus pesan memention semua peserta grup secara brutal dan memberi peringatan keras.',
  },
  antiCallEnabled: {
    commands: ['anticall on', 'anticall off'],
    usage: 'Secara otomatis menolak setiap panggilan masuk (suara & video) ke nomor asisten WhatsApp ini, lalu membalas dengan pemberitahuan tertulis yang ramah.',
  },
  antiRaidEnabled: {
    commands: ['antiraid on', 'antiraid off'],
    usage: 'Proteksi grup aktif otomatis! Melindungi grup dari admin nakal yang melakukan pembersihan massal (raid) dengan demote atau kick admin/peserta lain. Bot akan memulihkan jabatan korban dan mencopot (atau mengeluarkan) admin penyerang.',
  },
  antiVirtexEnabled: {
    commands: ['antivirtex on', 'antivirtex off'],
    usage: 'Melindungi grup dari serangan teks perusak (virtex) / blank spam karakter aneh. Bot otomatis mendeteksi dan menghapus seketika pesan berbahaya tersebut.',
  },
  openGroupEnabled: {
    commands: ['/open', 'open group', 'buka grup', 'fanra buka grup'],
    usage: 'Membuka setelan kirim pesan grup agar seluruh peserta dapat mengirim pesan kembali.',
  },
  closeGroupEnabled: {
    commands: ['/close', 'close group', 'tutup grup', 'fanra tutup grup'],
    usage: 'Menutup setelan kirim grup agar hanya admin yang diperbolehkan mengirim pesan.',
  },
  linkGroupEnabled: {
    commands: ['/linkgroup', 'link group', 'link grup', 'fanra kirim link grup'],
    usage: 'Mengambil dan menampilkan tautan/link undangan aktif dari WhatsApp Grup bersangkutan.',
  },
  revokeGroupLinkEnabled: {
    commands: ['/revoke', 'revoke link', 'tarik link', 'fanra reset link grup'],
    usage: 'Menarik/mereset tautan undangan grup yang lama dan membuat tautan undangan baru.',
  },
  promoteEnabled: {
    commands: ['/promote @user', 'promote ', 'jadikan admin', 'fanra jadikan admin'],
    usage: 'Mempromosikan seorang peserta biasa menjadi administrator grup WA dengan me-mention atau mereply pesan.',
  },
  demoteEnabled: {
    commands: ['/demote @user', 'demote ', 'turunkan admin', 'fanra turunkan admin'],
    usage: 'Menurunkan status administrator grup menjadi anggota biasa dengan me-mention atau mereply pesan.',
  },
  kickEnabled: {
    commands: ['/kick @user', 'kick ', 'kick dia', 'fanra kick dia'],
    usage: 'Mengeluarkan peserta tertentu keluar dari grup WhatsApp dengan me-mention user atau me-reply.',
  },
  deleteMessageEnabled: {
    commands: ['/delete', '/del', 'delete', 'del', 'fanra hapus pesan ini'],
    usage: 'Menghapus pesan anggota lain di grup. Caranya dengan memberikan reply perintah /delete ke arah pesan yang dituju.',
  },
  autoStickerEnabled: {
    commands: ['/s', '.sticker', '/sticker', 'fanra jadikan ini stiker', 'fanra buat sticker dari gambar ini', 'fanra make this sticker'],
    usage: 'Kirim gambar/foto ke chat, bot akan otomatis memproses konversi gambar tersebut menjadi stiker WhatsApp instan.',
    mediaNote: 'Memerlukan kiriman berkas Gambar.',
  },
  textStickerEnabled: {
    commands: ['/sg teks', '/stikerteks teks', '/textsticker teks', 'fanra buat stiker teks', 'fanra jadikan tulisan ini stiker', 'fanra make text sticker'],
    usage: 'Kirim perintah diikuti dengan baris kata-kata untuk dicetak menjadi stiker teks Pinterest yang elegan.',
  },
  stickerToolsEnabled: {
    commands: ['/toimg', '/toimage', '.sticker2img', 'fanra ubah stiker jadi gambar', 'fanra convert sticker to image'],
    usage: 'Reply stiker WhatsApp yang masuk dengan command ini untuk mengubahnya kembali menjadi berkas gambar PNG.',
    mediaNote: 'Memerlukan reply suatu Stiker.',
  },
  removeBgEnabled: {
    commands: ['/removebg', '/rmbg', '.bgremove', 'fanra hapus background', 'fanra remove background', 'fanra jadikan transparan'],
    usage: 'Kirim atau reply gambar dengan perintah ini untuk melenyapkan latar belakang secara detail.',
    mediaNote: 'Memerlukan kiriman atau reply berkas Gambar.',
  },
  hdImageEnabled: {
    commands: ['/hd', '/upscale', '/enhance', 'fanra jadikan hd', 'fanra perjelas gambar ini', 'fanra enhance this image'],
    usage: 'Kirim atau reply gambar buram dengan perintah ini untuk membesarkan resolusi dan menjernihkannya.',
    mediaNote: 'Memerlukan kiriman atau reply berkas Gambar.',
  },
  photoRestoreEnabled: {
    commands: ['/restore', '/fixphoto', '/repairphoto', 'fanra perbaiki foto ini', 'fanra restore foto lama ini', 'fanra fix this photo'],
    usage: 'Reply foto lama yang rusak, pudar, atau tergores untuk direstorasi kualitasnya menggunakan AI.',
    mediaNote: 'Memerlukan kiriman atau reply berkas Gambar.',
  },
  compressMediaEnabled: {
    commands: ['/compress', '/kompres', 'fanra kompres file ini', 'fanra kecilkan ukuran video ini', 'fanra compress this media'],
    usage: 'Kirim atau reply berkas gambar/video dengan perintah ini untuk mengecilkan ukuran data berkas.',
    mediaNote: 'Memerlukan kiriman berkas Gambar atau Video.',
  },
  downloaderEnabled: {
    commands: ['/download link', '/dl link', 'fanra download video ini', 'fanra unduh link ini', 'fanra download this link'],
    usage: 'Cukup kirimkan tautan sosmed seperti TikTok, IG, FB, X, YT, atau Pinterest ke bot untuk pengunduhan otomatis.',
  },
  playMp3Enabled: {
    commands: ['/play judul lagu', '/song judul lagu', '/music judul lagu', 'fanra putar lagu', 'fanra carikan lagu', 'fanra download lagu ini'],
    usage: 'Ketik perintah diikuti judul lagu atau penyanyi untuk mencari dan mengirimkan berkas audio MP3.',
  },
  musicRecognitionEnabled: {
    commands: ['/shazam', '/findsong', '/whatmusic', 'fanra lagu apa ini', 'fanra cari judul lagu ini', 'fanra what song is this'],
    usage: 'Reply potongan berkas rekaman suara, video, atau audio singkat dengan perintah ini untuk dideteksi judulnya.',
    mediaNote: 'Memerlukan reply berkas Audio, Video, atau Voice Note.',
  },
  pdfToolsEnabled: {
    commands: ['/topdf', '/pdftoimg', '/pdf', '/pdfinfo', 'fanra jadikan pdf', 'fanra ubah pdf ke gambar', 'fanra ganti nama pdf', 'fanra cek info pdf ini'],
    usage: 'Reply atau kirim dokumen PDF untuk konversi (/pdftoimg), info (/pdfinfo), dan ubah nama file (/pdf namabaru). Atau kirim gambar dengan /topdf.',
    mediaNote: 'Memerlukan reply atau lampiran berkas PDF atau Gambar.',
  },
  fileInspectorEnabled: {
    commands: ['/fileinfo', '/infofile', 'fanra info file ini', 'fanra detail file ini', 'fanra show file details'],
    usage: 'Reply kiriman berkas dokumen (zip, doc, pdf, dll.) dengan perintah ini untuk membedah metadatanya.',
    mediaNote: 'Memerlukan reply ke suatu berkas Dokumen/Media.',
  },
  qrToolsEnabled: {
    commands: ['/qr teks', '/readqr', 'fanra buat qr', 'fanra baca qr ini', 'fanra generate qr code'],
    usage: 'Ketik /qr diikuti tulisan untuk membuat kode QR, atau reply gambar kode QR dengan perintah /readqr.',
  },
  qrGeneratorEnabled: {
    commands: ['/qr teks', 'fanra buat qr', 'fanra generate qr code'],
    usage: 'Ketik perintah diikuti dengan baris teks atau tautan alamat web untuk dicetak menjadi kode QR.',
  },
  qrReaderEnabled: {
    commands: ['/readqr', 'fanra baca qr ini'],
    usage: 'Reply kiriman foto/gambar kode QR dengan menuliskan perintah ini untuk membaca isi teksnya.',
    mediaNote: 'Memerlukan reply atau caption berkas Gambar Kode QR.',
  },
  toUrlEnabled: {
    commands: ['/tourl', '/upload', '/url', 'fanra jadikan link', 'fanra upload file ini', 'fanra turn this into url'],
    usage: 'Reply atau kirim berkas gambar/video/dokumen apa saja dengan perintah ini untuk diubah menjadi link hosting umum.',
    mediaNote: 'Memerlukan berkas dokumen atau media.',
  },
  shortUrlEnabled: {
    commands: ['/shorturl link', '/short link', '/tinyurl link', 'fanra pendekkan link ini', 'fanra buat shortlink', 'fanra shorten this url'],
    usage: 'Ketik perintah diikuti tautan web yang panjang untuk diubah menjadi ringkas.',
  },
  broadcastEnabled: {
    commands: ['broadcast on', 'broadcast off'],
    usage: 'Kirim pesan siaran massal terjadwal otomatis kepada pelanggan terdaftar Anda.',
  },
  welcomeEnabled: {
    commands: ['welcome on', 'welcome off'],
    usage: 'Bot akan otomatis mengirim pesan salam pembuka ramah menyapa setiap ada nomor kontak baru yang menghubungi Anda.',
  },
  keywordResponseEnabled: {
    commands: ['keyword on', 'keyword off'],
    usage: 'Mengizinkan respon balasan cepat secara otomatis ketika mendeteksi penulisan kata kunci (keyword) pemicu.',
  },
  rpgEnabled: {
    commands: ['/rpg', '/status', '/shop', '/buy', '/equip', '/duel', '/accept', '/tower', '/raid', '/raid attack'],
    usage: 'Mengizinkan pengguna bermain game RPG interaktif (melihat profil HP/Coins, membeli gear di shop, memanjat menara monster, menantang PvP duel, dan bertempur melawan raid boss jam-jaman).',
  },
};

export default function AutomationPage() {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // States for Advanced Configuration Modals
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [tempSettings, setTempSettings] = useState<Record<string, any>>({});
  
  // Track toggle locks individually per key
  const [lockedFeatures, setLockedFeatures] = useState<Record<string, boolean>>({});
  const [isOcrSupported, setIsOcrSupported] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/whatsapp/config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }

      const statusRes = await fetch('/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIsOcrSupported(statusData.isOcrSupported !== false);
        setStats(statusData.analytics || null);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message, type: 'success' }
    }));
  };

  const handleToggle = async (key: string) => {
    if (!config) return;
    
    // Cooldown check for toggles - 3 seconds delay to avoid toggling spasms INDIVIDUALLY per key
    if (lockedFeatures[key]) {
      showToast(`Harap tunggu 3 detik untuk merubah status ${getFeatureDisplayName(key)} lagi!`);
      return;
    }
    
    setLockedFeatures(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setLockedFeatures(prev => ({ ...prev, [key]: false }));
    }, 3000);

    const currentVal = !!config.settings[key];
    const updatedSettings = {
      ...config.settings,
      [key]: !currentVal
    };

    // If key is adminToolsEnabled, sync all sub-features of the suite in sync
    if (key === 'adminToolsEnabled') {
      const subKeys = [
        'openGroupEnabled', 'closeGroupEnabled', 'linkGroupEnabled', 'revokeGroupLinkEnabled',
        'promoteEnabled', 'demoteEnabled', 'kickEnabled', 'deleteMessageEnabled'
      ];
      subKeys.forEach(k => {
        updatedSettings[k] = !currentVal;
      });
    }

    // If key is qrToolsEnabled, sync its sub-features
    if (key === 'qrToolsEnabled') {
      updatedSettings['qrGeneratorEnabled'] = !currentVal;
      updatedSettings['qrReaderEnabled'] = !currentVal;
    }

    // Alleviate legacy twin-key inconsistencies directly on toggle:
    if (key === 'aggressiveAI') updatedSettings['aggressiveAiMode'] = !currentVal;
    if (key === 'autoReply') updatedSettings['autoReplyEnabled'] = !currentVal;
    if (key === 'translateEnabled') updatedSettings['translateManualEnabled'] = !currentVal;
    if (key === 'antiBadWordEnabled') updatedSettings['antiBadwordEnabled'] = !currentVal;
    if (key === 'stickerToolsEnabled') updatedSettings['stickerToImageEnabled'] = !currentVal;
    if (key === 'hdImageEnabled') updatedSettings['hdUpscalerEnabled'] = !currentVal;
    if (key === 'removeBgEnabled') updatedSettings['removeBackgroundEnabled'] = !currentVal;

    const updatedConfig = {
      ...config,
      settings: updatedSettings
    };
    
    // Optimistic UI update
    setConfig(updatedConfig);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        showToast(`Fitur ${getFeatureDisplayName(key)} berhasil dirubah statusnya!`);
      } else {
        showToast(`Gagal memperbarui status fitur.`);
        fetchConfig();
      }
    } catch (err) {
      console.error('Error updating toggle:', err);
      showToast(`Kesalahan koneksi ke server.`);
      fetchConfig();
    }
  };

  const handleConfigure = (featureKey: string) => {
    setEditingFeature(featureKey);
    const s = config?.settings || {};
    
    // Prepare temporary settings with realistic system defaults based on schema keys
    const defaults: Record<string, any> = {
      aiResponsePrefix: "✨ FanraBot: ",
      aiResponseDelay: 0,
      aiDefaultProvider: "gemini",
      aiMaxReplyLength: 500,

      translateDefaultLang: "en",
      translateShowOriginal: true,

      autoTranslateTargetLang: "en",
      autoTranslateScope: "group",
      autoTranslateMode: "foreign_only",
      autoTranslateShowOriginal: false,

      ocrLang: "ind",
      ocrTranslate: false,

      naturalWakeWord: "fanra",
      naturalPrivateNoWakeWord: true,
      naturalAiFallback: false,

      aggressiveAITarget: "group",
      aggressiveAIInterval: 5,
      aggressiveAIResponseMode: "casual",
      aggressiveAIMinMessages: 3,
      aggressiveAIProbability: 15,
      aggressiveAILanguage: "auto",

      adminAuthOnly: "admin",
      adminSilentFail: false,
      adminToolsAlert: "Sorry, this command can only be executed by Group Admins!",

      antiLinkAction: "delete",
      antiLinkBlockAdmin: false,
      antiLinkWhitelist: "google.com, youtube.com",
      antiLinkAlert: "⚠️ Group rules violation! Links are not allowed.",

      spamLimitMessages: 5,
      spamLimitStickers: 10,
      spamWindowSeconds: 3,
      spamAction: "delete",
      antiSpamAlert: "⚠️ Please do not spam! You have been warned.",

      badWords: "anjing, babi, bangsat, keparat, bajingan, kontol, memek, asu, dancok, peler, patek, tolol, goblok, bangsadd",
      badWordAction: "delete",
      badWordAlert: "⚠️ Inappropriate language detected. Please be respectful.",

      antiTagAllAllowed: "admin_only",
      antiTagAllThreshold: 5,
      antiTagAllAlert: "⚠️ Mass mentioning is not allowed!",

      stickerPackName: "FanraBot Sticker",
      stickerPackAuthor: "https://fanrabot.ai",
      stickerCircle: false,
      stickerQuality: "80%",

      textStickerFont: "Impact",
      textStickerColor: "white",
      textStickerBgColor: "transparent",
      textStickerAutoFit: true,

      stickerToolsFormat: "PNG",
      stickerToolsResolution: "512x512",

      removeBgProvider: "default",
      removeBgOverlay: "transparent",
      removeBgQuality: "Standard",

      hdScale: "2x",
      hdProvider: "default",
      hdPreserveFace: true,

      photoRestoreRemoveNoise: true,
      photoRestoreSharpen: true,
      photoRestoreFaceEnhance: true,

      compressQuality: "75%",
      compressVideoResolution: "480p",
      compressMaxOutputSize: 20,

      downloaderMaxMg: 50,
      downloaderShowMetadata: true,
      downloaderHighRes: false,

      playMp3Bitrate: "192kbps",
      playMp3MaxDuration: 10,
      playMp3SendAs: "audio",

      musicRecProvider: "AcrCloud",
      musicRecIncludeYoutube: true,
      musicRecIncludeSpotify: true,

      pdfToImgQuality: "High",
      pdfImgFormat: "PNG",
      pdfMaxPages: 30,

      fileInspectorDetail: true,
      fileInspectorHash: false,

      qrColor: "Black",
      qrCorrection: "M",
      qrPadding: 2,

      toUrlHost: "Catbox",
      toUrlExpiration: "Never",
      toUrlDirectOnly: true,

      shortUrlProvider: "TinyURL",
      shortUrlCustomAlias: "",
      shortUrlDomain: "",
      shortUrlAutoCopy: true,

      broadcastMessage: "Hello! Thank you for choosing FanraBot. Contact us if you need anything.",
      broadcastTime: "12:00",
      broadcastTarget: "all",

      welcomeMode: "image",
      welcomeCardTheme: "cosmic_neon",
      welcomeCardQuote: "Semoga harimu menyenangkan dan mari berkembang bersama!",
      welcomeMessage: "Hello! Welcome to our group. How can we help you today?",
      welcomeNewContactsOnly: false,
      welcomeDelaySeconds: 3,

      antiCallMessage: "Hello! Unfortunately, we cannot accept calls at the moment. Please send us a text message.",

      antiRaidAction: "demote",
      antiRaidMode: "admin_only",
      antiRaidNotify: true,

      antiVirtexLength: 8000,
      keywordCaseSensitive: false,
    };

    const initialSettings: Record<string, any> = {};
    for (const key of Object.keys(defaults)) {
      initialSettings[key] = s[key] !== undefined ? s[key] : defaults[key];
    }
    
    setTempSettings({
      ...s,
      ...initialSettings
    });
  };

  const handleSaveAdvanced = async (feature: string) => {
    if (!config) return;
    if (isSaving) return;
    setIsSaving(true);
    
    const updatedSettings = { 
      ...config.settings,
      ...tempSettings
    };

    // Alleviate legacy twin-key inconsistencies directly on save advanced:
    if (updatedSettings['aggressiveAI'] !== undefined) updatedSettings['aggressiveAiMode'] = updatedSettings['aggressiveAI'];
    if (updatedSettings['autoReply'] !== undefined) updatedSettings['autoReplyEnabled'] = updatedSettings['autoReply'];
    if (updatedSettings['translateEnabled'] !== undefined) updatedSettings['translateManualEnabled'] = updatedSettings['translateEnabled'];
    if (updatedSettings['antiBadWordEnabled'] !== undefined) updatedSettings['antiBadwordEnabled'] = updatedSettings['antiBadWordEnabled'];
    if (updatedSettings['stickerToolsEnabled'] !== undefined) updatedSettings['stickerToImageEnabled'] = updatedSettings['stickerToolsEnabled'];
    if (updatedSettings['hdImageEnabled'] !== undefined) updatedSettings['hdUpscalerEnabled'] = updatedSettings['hdImageEnabled'];
    if (updatedSettings['removeBgEnabled'] !== undefined) updatedSettings['removeBackgroundEnabled'] = updatedSettings['removeBgEnabled'];

    const updatedConfig = {
      ...config,
      settings: updatedSettings
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        setConfig(updatedConfig);
        showToast(`Konfigurasi lanjut berhasil disimpan!`);
        setEditingFeature(null);
      } else {
        showToast(`Gagal menyimpan konfigurasi.`);
      }
    } catch (err) {
      console.error('Error saving advanced config:', err);
      showToast(`Kesalahan koneksi saat menyimpan.`);
    } finally {
      setIsSaving(false);
    }
  };

  const getFeatureDisplayName = (key: string) => {
    switch (key) {
      case 'autoReply': return 'Auto Reply';
      case 'translateEnabled': return 'Translate';
      case 'autoTranslateEnabled': return 'Auto Translate';
      case 'ocrEnabled': return 'OCR Reader';
      case 'naturalToolsEnabled': return 'Natural Language Tools';
      case 'aggressiveAI': return 'Aggressive AI Mode';
      case 'adminToolsEnabled': return 'Group Admin Tools';
      case 'antiLinkEnabled': return 'Anti-link';
      case 'antiSpamEnabled': return 'Anti-spam';
      case 'antiBadWordEnabled': return 'Anti-badword';
      case 'antiTagAllEnabled': return 'Anti-TagAll / Mention-Brutal';
      case 'antiCallEnabled': return 'Anti-Call (Penolak Telepon)';
      case 'antiRaidEnabled': return 'Anti-Raid Admin Protector';
      case 'antiVirtexEnabled': return 'Anti-Virtex / Spam Blank';
      case 'openGroupEnabled': return 'Open Group';
      case 'closeGroupEnabled': return 'Close Group';
      case 'linkGroupEnabled': return 'Link Group';
      case 'revokeGroupLinkEnabled': return 'Revoke Link Group';
      case 'promoteEnabled': return 'Promote Member';
      case 'demoteEnabled': return 'Demote Member';
      case 'kickEnabled': return 'Kick Member';
      case 'deleteMessageEnabled': return 'Delete Message';
      case 'autoStickerEnabled': return 'Sticker Otomatis';
      case 'textStickerEnabled': return 'Sticker Teks Meme';
      case 'stickerToolsEnabled': return 'Sticker Tools';
      case 'removeBgEnabled': return 'Remove Background';
      case 'hdImageEnabled': return 'AI Upscaler HD';
      case 'photoRestoreEnabled': return 'AI Photo Restore Pro';
      case 'compressMediaEnabled': return 'Compress Media';
      case 'downloaderEnabled': return 'Universal Downloader';
      case 'playMp3Enabled': return 'Play MP3';
      case 'musicRecognitionEnabled': return 'Music Recognition';
      case 'pdfToolsEnabled': return 'PDF Tools';
      case 'fileInspectorEnabled': return 'File Inspector';
      case 'qrToolsEnabled': return 'QR Tools';
      case 'qrGeneratorEnabled': return 'QR Generator';
      case 'qrReaderEnabled': return 'QR Reader';
      case 'toUrlEnabled': return 'To URL';
      case 'shortUrlEnabled': return 'Short URL';
      case 'broadcastEnabled': return 'Jadwal Broadcast';
      case 'welcomeEnabled': return 'Welcome Message';
      case 'keywordResponseEnabled': return 'Respon Keyword';
      default: return 'Otomatisasi';
    }
  };

  const getIsActive = (key: string) => {
    if (!config || !config.settings) return false;
    const s = config.settings;
    const val = s[key];
    if (val === undefined) {
      if ([
        'broadcastEnabled', 
        'antiLinkEnabled', 
        'antiBadWordEnabled', 
        'autoStickerEnabled', 
        'adminToolsEnabled',
        'autoTranslateEnabled',
        'openGroupEnabled',
        'closeGroupEnabled',
        'linkGroupEnabled',
        'revokeGroupLinkEnabled',
        'promoteEnabled',
        'demoteEnabled',
        'kickEnabled',
        'deleteMessageEnabled',
      ].includes(key)) {
        return false;
      }
      return true;
    }
    return !!val;
  };

  const handlePinToggle = async (key: string) => {
    if (!config) return;
    const s = config.settings || {};
    const pinned = s.pinnedAutomationFeatures || [];
    const isCurrentlyPinned = pinned.includes(key);
    const updatedPinned = isCurrentlyPinned
      ? pinned.filter((f: string) => f !== key)
      : [...pinned, key];
      
    const updatedSettings = {
      ...config.settings,
      pinnedAutomationFeatures: updatedPinned
    };
    const updatedConfig = {
      ...config,
      settings: updatedSettings
    };
    
    setConfig(updatedConfig);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedConfig)
      });
      if (!res.ok) {
        fetchConfig();
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
      fetchConfig();
    }
  };

  const allFeatures = [
    // 1. AI & Language
    {
      key: 'autoReply',
      icon: <MessageSquare className="w-4 h-4 text-sky-500" />,
      title: 'Auto Reply',
      desc: 'Balas chat secara otomatis menggunakan kecerdasan pintar Gemini AI sesuai preferensi Anda.',
      category: 'ai_language'
    },
    {
      key: 'translateEnabled',
      icon: <Languages className="w-4 h-4 text-indigo-500" />,
      title: 'Translate',
      desc: 'Terjemahkan pesan secara manual ke beberapa bahasa asing tanpa token AI.',
      category: 'ai_language'
    },
    {
      key: 'autoTranslateEnabled',
      icon: <Languages className="w-4 h-4 text-violet-500" />,
      title: 'Auto Translate',
      desc: 'Terjemahkan otomatis pesan bahasa asing di chat grup atau private secara real-time.',
      category: 'ai_language'
    },
    {
      key: 'ocrEnabled',
      icon: <FileText className="w-4 h-4 text-purple-500" />,
      title: 'OCR Reader',
      desc: 'Deteksi dan ekstrak setiap tulisan cetak dari file gambar/foto secara local.',
      category: 'ai_language',
      statusBadge: !isOcrSupported && "Not Installed"
    },
    {
      key: 'naturalToolsEnabled',
      icon: <Sparkles className="w-4 h-4 text-sky-500" />,
      title: 'Natural Language Tools',
      desc: 'Eksekusi instruksi dan perintah asisten menggunakan percakapan bahasa alami manusia.',
      category: 'ai_language'
    },
    {
      key: 'aggressiveAI',
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      title: 'Aggressive AI Mode',
      desc: 'Bila aktif, asisten AI proaktif menjawab obrolan di grup WhatsApp tanpa dipanggil kaku.',
      category: 'ai_language'
    },

    // 2. Moderasi Grup
    {
      key: 'adminToolsEnabled',
      icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
      title: 'Group Admin Tools',
      desc: 'Kumpulan instruksi kelola grup untuk membantu kepengurusan administrasi WhatsApp Grup.',
      category: 'group_moderation'
    },
    {
      key: 'antiLinkEnabled',
      icon: <Link2Off className="w-4 h-4 text-teal-500" />,
      title: 'Anti-link',
      desc: 'Hapus otomatis kiriman pesan yang mengandung link/tautan berbahaya di WhatsApp Grup.',
      category: 'group_moderation'
    },
    {
      key: 'antiSpamEnabled',
      icon: <ShieldAlert className="w-4 h-4 text-amber-500" />,
      title: 'Anti-spam',
      desc: 'Proteksi spam cerdas grup WA. Mengatur delay, kick flood, dan block spammer.',
      category: 'group_moderation'
    },
    {
      key: 'antiBadWordEnabled',
      icon: <X className="w-4 h-4 text-red-500" />,
      title: 'Anti-badword',
      desc: 'Deteksi dan hapus otomatis kiriman pesan kasar / toksik di WhatsApp grup.',
      category: 'group_moderation'
    },
    {
      key: 'antiTagAllEnabled',
      icon: <ShieldAlert className="w-4 h-4 text-pink-500" />,
      title: 'Anti-TagAll / Mention Brutal',
      desc: 'Lindungi grup dari mention bising non-admin. Bot otomatis menghapus pesan @everyone/@all dan memperingatkan pelaku.',
      category: 'group_moderation'
    },
    {
      key: 'antiCallEnabled',
      icon: <PhoneOff className="w-4 h-4 text-red-400" />,
      title: 'Anti-Call (Penolak Telepon)',
      desc: 'Bot otomatis menolak setiap panggilan telepon/video masuk, lalu mengirim pesan pemberitahuan ramah.',
      category: 'group_moderation'
    },
    {
      key: 'antiRaidEnabled',
      icon: <ShieldAlert className="w-4 h-4 text-emerald-500" />,
      title: 'Anti-Raid Admin Protector',
      desc: 'Melindungi grup dari admin nakal yang sengaja demote admin lain atau kick massal. Bot otomatis menurunkan jabatan pelaku dan memulihkan korban.',
      category: 'group_moderation'
    },
    {
      key: 'antiVirtexEnabled',
      icon: <ShieldAlert className="w-4 h-4 text-orange-500" />,
      title: 'Anti-Virtex / Spam Blank',
      desc: 'Proteksi grup dari pesan blank character panjang (virus text) yang merusak atau membuat macet WhatsApp.',
      category: 'group_moderation'
    },


    // 3. Media & Sticker
    {
      key: 'autoStickerEnabled',
      icon: <Smile className="w-4 h-4 text-sky-500" />,
      title: 'Sticker Otomatis',
      desc: 'Ubah secara otomatis seluruh kiriman pesan gambar menjadi stiker WhatsApp.',
      category: 'media_sticker'
    },
    {
      key: 'textStickerEnabled',
      icon: <Smile className="w-4 h-4 text-amber-500" />,
      title: 'Sticker Teks Meme',
      desc: 'Ubah tulisan kata dari command menjadi stiker teks Pinterest hitam putih.',
      category: 'media_sticker'
    },
    {
      key: 'stickerToolsEnabled',
      icon: <Image className="w-4 h-4 text-indigo-500" />,
      title: 'Sticker Tools',
      desc: 'Konversi stiker WhatsApp kembali menjadi gambar biasa berformat PNG.',
      category: 'media_sticker'
    },
    {
      key: 'removeBgEnabled',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
      title: 'Remove Background',
      desc: 'Hapus background gambar/foto secara cerdas dan jadikan PNG transparan via /removebg.',
      category: 'media_sticker'
    },
    {
      key: 'hdImageEnabled',
      icon: <Sparkles className="w-4 h-4 text-sky-500" />,
      title: 'AI Upscaler HD',
      desc: 'Tingkatkan kualitas dan resolusi gambar menjadi tajam dan berkualitas HD.',
      category: 'media_sticker'
    },
    {
      key: 'photoRestoreEnabled',
      icon: <RefreshCw className="w-4 h-4 text-rose-500" />,
      title: 'AI Photo Restore Pro',
      desc: 'Perbaiki foto kuno, rusak, blur, atau penuh noise menjadi jernih kembali.',
      category: 'media_sticker'
    },
    {
      key: 'compressMediaEnabled',
      icon: <Shrink className="w-4 h-4 text-cyan-500" />,
      title: 'Compress Media',
      desc: 'Kompres ukuran gambar atau video berbitrate tinggi ke minimalis via /compress.',
      category: 'media_sticker'
    },

    // 4. Downloader & Music
    {
      key: 'downloaderEnabled',
      icon: <Download className="w-4 h-4 text-emerald-500" />,
      title: 'Universal Downloader',
      desc: 'Unduh video/foto dari TikTok, IG, YT, FB, X, dan Pinterest otomatis dari chat.',
      category: 'downloader_music'
    },
    {
      key: 'playMp3Enabled',
      icon: <Music className="w-4 h-4 text-pink-500" />,
      title: 'Play MP3',
      desc: 'Cari dan download audio musik MP3 secara instan dari YouTube.',
      category: 'downloader_music'
    },
    {
      key: 'musicRecognitionEnabled',
      icon: <Music className="w-4 h-4 text-amber-500" />,
      title: 'Music Recognition',
      desc: 'Cari judul lagu, penyanyi, album, dan link media sosial dari klip audio/video.',
      category: 'downloader_music'
    },

    // 5. PDF & Document
    {
      key: 'pdfToolsEnabled',
      icon: <FileText className="w-4 h-4 text-emerald-500" />,
      title: 'PDF Tools',
      desc: 'Ubah gambar ke PDF, PDF ke gambar, atau periksa metadata lengkap dari file PDF.',
      category: 'pdf_doc'
    },
    {
      key: 'fileInspectorEnabled',
      icon: <Info className="w-4 h-4 text-teal-500" />,
      title: 'File Inspector',
      desc: 'Bedah metadata, resolusi, durasi, dan format various file di obrolan.',
      category: 'pdf_doc'
    },

    // 6. Utility Tools
    {
      key: 'qrToolsEnabled',
      icon: <QrCode className="w-4 h-4 text-amber-500" />,
      title: 'QR Tools',
      desc: 'Pengelolaan deteksi dan generasi QR melalui chat whatsapp secara interaktif.',
      category: 'utilities'
    },

    {
      key: 'toUrlEnabled',
      icon: <Link className="w-4 h-4 text-teal-500" />,
      title: 'To URL',
      desc: 'Ubah berkas media menjadi tautan link hosting (Catbox) melalui command /tourl.',
      category: 'utilities'
    },
    {
      key: 'shortUrlEnabled',
      icon: <Link className="w-4 h-4 text-violet-500" />,
      title: 'Short URL',
      desc: 'Ubah tautan web yang amat panjang menjadi ringkas dan mudah dibagikan.',
      category: 'utilities'
    },

    // 7. Fitur Bisnis
    {
      key: 'broadcastEnabled',
      icon: <Calendar className="w-4 h-4 text-violet-500" />,
      title: 'Jadwal Broadcast',
      desc: 'Kirim pesan massal ke pelanggan Anda pada waktu yang telah ditentukan secara berkala.',
      category: 'business'
    },
    {
      key: 'welcomeEnabled',
      icon: <UserPlus className="w-4 h-4 text-rose-500" />,
      title: 'Welcome Message',
      desc: 'Kirim kiriman pesan pembuka ramah secara otomatis untuk setiap nomor baru.',
      category: 'business'
    },
    {
      key: 'keywordResponseEnabled',
      icon: <Key className="w-4 h-4 text-indigo-500" />,
      title: 'Respon Keyword',
      desc: 'Eksekusi balasan instan cepat berdasarkan kecocokan kata kunci Commands.',
      category: 'business'
    },
    {
      key: 'rpgEnabled',
      icon: <Sword className="w-4 h-4 text-rose-500" />,
      title: 'RPG Arena Game',
      desc: 'Aktifkan petualangan RPG di WhatsApp! Leveling, status, pertokoan shop, pvp duel, panjat menara, dan raid boss mingguan.',
      category: 'game_rpg'
    }
  ];

  const categories = [
    { id: 'ai_language', label: 'AI & Language', icon: '🤖' },
    { id: 'group_moderation', label: 'Moderasi Grup', icon: '🛡️' },
    { id: 'media_sticker', label: 'Media & Sticker', icon: '🎨' },
    { id: 'downloader_music', label: 'Downloader & Music', icon: '🎵' },
    { id: 'pdf_doc', label: 'PDF & Document', icon: '📄' },
    { id: 'utilities', label: 'Utility Tools', icon: '⚙️' },
    { id: 'business', label: 'Fitur Bisnis', icon: '📢' },
    { id: 'game_rpg', label: 'Game & RPG', icon: '⚔️' }
  ];

  const s = config?.settings || {};
  const pinnedKeys = s.pinnedAutomationFeatures || [];
  const pinnedFeatures = allFeatures.filter(f => pinnedKeys.includes(f.key));

  if (isLoading) {
    return <LoadingView message="Memuat status otomatisasi bot..." />;
  }

  const modalFields = editingFeature ? FEATURE_FIELDS[editingFeature] : undefined;
  const modalDetails = editingFeature ? FEATURE_DETAILS[editingFeature] : undefined;

  return (
    <div className="space-y-8 relative text-on-surface">


      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">Otomatisasi</h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Kelola aturan respons otomatis, pencegah spam, filter tautan, dan salam penyambutan.</p>
        </div>
      </div>

      {/* 4 Elegan Info Cards Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Total Respon WA</span>
          </div>
          <span className="text-xl font-semibold text-slate-800 tracking-tight">{stats?.pesanTerkirim ?? 0}</span>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Respon AI Saja</span>
          </div>
          <span className="text-xl font-semibold text-slate-800 tracking-tight">{stats?.aiRespons ?? 0}</span>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg shrink-0">
              <Download className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Downloader</span>
          </div>
          <span className="text-xl font-semibold text-slate-800 tracking-tight">{stats?.downloaderHariIni ?? 0}</span>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <Image className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Media Diproses</span>
          </div>
          <span className="text-xl font-semibold text-slate-800 tracking-tight">{stats?.mediaDiproses ?? 0}</span>
        </div>
      </div>

      {/* Starred Favorite Panel */}
      {pinnedFeatures.length > 0 && (
        <div className="space-y-4 bg-amber-50/50 border border-amber-100 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-amber-700">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span className="text-xs font-semibold">Fitur Favorit Anda</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pinnedFeatures.map(f => (
              <AutomationCard 
                key={`pinned-${f.key}`}
                icon={f.icon}
                title={f.title}
                desc={f.desc}
                isActive={getIsActive(f.key)}
                onToggle={() => handleToggle(f.key)}
                onConfigure={f.key !== 'adminToolsEnabled' && FEATURE_FIELDS[f.key] ? () => handleConfigure(f.key) : undefined}
                isPinned={true}
                onPinToggle={() => handlePinToggle(f.key)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Categorized decks */}
      <div className="space-y-8">
        {categories.map(cat => {
          const catFeatures = allFeatures.filter(f => f.category === cat.id);
          return (
            <div key={cat.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-base">{cat.icon}</span>
                <h2 className="text-xs font-semibold text-slate-700">
                  {cat.label}
                  <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                    {catFeatures.length}
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {catFeatures.map(f => {
                  const isPinned = pinnedKeys.includes(f.key);
                  return (
                    <AutomationCard 
                      key={f.key}
                      icon={f.icon}
                      title={f.title}
                      desc={f.desc}
                      isActive={getIsActive(f.key)}
                      onToggle={() => handleToggle(f.key)}
                      onConfigure={f.key !== 'adminToolsEnabled' && FEATURE_FIELDS[f.key] ? () => handleConfigure(f.key) : undefined}
                      isPinned={isPinned}
                      onPinToggle={() => handlePinToggle(f.key)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info group */}
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex gap-3 text-xs text-slate-500">
         <Info className="w-4 h-4 shrink-0 text-blue-500" />
         <p className="leading-relaxed">
           Beberapa fitur otomatisasi memerlukan asisten WhatsApp Anda dijadikan sebagai admin di dalam WhatsApp Grup agar bot bisa melacak dan menghapus percakapan (seperti fitur anti-link).
         </p>
      </div>

      {/* Dynamic Advanced Configuration Modal Panel */}
      {editingFeature && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Konfigurasi Lanjut</h3>
                <p className="text-[11px] text-slate-500 capitalize mt-0.5">
                  {getFeatureDisplayName(editingFeature)}
                </p>
              </div>
              <button 
                onClick={() => setEditingFeature(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scroll Body */}
            <div className="p-4 space-y-5 overflow-y-auto flex-1 text-xs custom-scrollbar">
              {/* Active Status Header Block */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="font-medium text-slate-700">Status Fitur Saat Ini</span>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-md",
                    getIsActive(editingFeature) ? "bg-green-50 text-green-700" : "bg-slate-200 text-slate-600"
                  )}>
                    {getIsActive(editingFeature) ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <button
                    onClick={() => handleToggle(editingFeature)}
                    className="text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Beralih
                  </button>
                </div>
              </div>

              {/* Dynamic Settings Fields section */}
              <div>
                {FEATURE_DETAILS[editingFeature] && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-600 mb-4 space-y-2">
                    <p>{FEATURE_DETAILS[editingFeature].usage}</p>
                    {FEATURE_DETAILS[editingFeature].commands && FEATURE_DETAILS[editingFeature].commands.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-700">Supported Commands: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {FEATURE_DETAILS[editingFeature].commands.map(cmd => (
                            <span key={cmd} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm text-[10px] text-slate-700 font-mono">
                              {cmd}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {FEATURE_DETAILS[editingFeature].mediaNote && (
                       <p className="text-amber-600 flex items-center gap-1 mt-1">
                         <Info className="w-3 h-3" /> {FEATURE_DETAILS[editingFeature].mediaNote}
                       </p>
                    )}
                  </div>
                )}
                
                <h4 className="text-[10px] text-slate-500 mb-2">Pengaturan Fitur</h4>
                {modalFields && modalFields.length > 0 ? (
                  <div className="space-y-3">
                    {modalFields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[10px] text-slate-500 ml-1">{field.label}</label>
                        
                        {field.type === 'text' && (
                          <input 
                            type="text"
                            value={tempSettings[field.key] || ""}
                            onChange={(e) => setTempSettings({ ...tempSettings, [field.key]: e.target.value })}
                            placeholder={field.placeholder}
                            className="w-full text-xs border border-slate-200 px-3 py-2 rounded-lg bg-white focus:outline-none focus:border-slate-300 transition-colors"
                          />
                        )}

                        {field.type === 'number' && (
                          <input 
                            type="number"
                            min={field.min ?? 0}
                            value={tempSettings[field.key] ?? 0}
                            onChange={(e) => setTempSettings({ ...tempSettings, [field.key]: parseInt(e.target.value) || 0 })}
                            className="w-full text-xs border border-slate-200 px-3 py-2 rounded-lg bg-white focus:outline-none focus:border-slate-300 transition-colors"
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea 
                            rows={3}
                            value={tempSettings[field.key] || ""}
                            onChange={(e) => setTempSettings({ ...tempSettings, [field.key]: e.target.value })}
                            placeholder={field.placeholder}
                            className="w-full text-xs border border-slate-200 px-3 py-2 rounded-lg bg-white focus:outline-none focus:border-slate-300 transition-colors font-mono resize-y"
                          />
                        )}

                        {field.type === 'select' && (
                          <select 
                            value={tempSettings[field.key] || ""}
                            onChange={(e) => setTempSettings({ ...tempSettings, [field.key]: e.target.value })}
                            className="w-full text-xs border border-slate-200 px-3 py-2 rounded-lg bg-white focus:outline-none focus:border-slate-300 transition-colors cursor-pointer"
                          >
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}

                        {field.type === 'toggle' && (
                          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                            <span className="text-[11px] text-slate-600">Aktifkan parameter</span>
                            <button 
                              type="button"
                              onClick={() => setTempSettings({ ...tempSettings, [field.key]: !tempSettings[field.key] })}
                              className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 focus:outline-none select-none"
                              style={{ backgroundColor: tempSettings[field.key] ? '#0f172a' : '#e2e8f0' }}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition duration-205 ease-in-out mt-[1.5px] ml-[1.5px]",
                                  tempSettings[field.key] ? "translate-x-3" : "translate-x-0"
                                )}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
                    Fitur ini tidak memerlukan konfigurasi tambahan.
                  </p>
                )}
              </div>

              {/* Economy & Limitation Generic Settings (Applies to all features except group moderation, auto reply, auto translate, and natural language tools) */}
              {/* Removed Economy & Limitation section by developer request */}
            </div>

            {/* Modal Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setEditingFeature(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-all"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={() => handleSaveAdvanced(editingFeature)}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AutomationCard({ icon, title, desc, isActive, onToggle, onConfigure, isPinned, onPinToggle }: any) {
  return (
    <div className={cn(
      "bg-[#FAFAFA] border rounded-xl p-4 transition-all duration-300 flex flex-col justify-between h-[120px] relative group",
      isActive ? "border-slate-200" : "border-slate-100 opacity-80"
    )}>
      {/* Top section: Icon, Title, Pin, Toggle */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center shrink-0 w-6 h-6">
            {icon && React.cloneElement(icon, { className: "w-4 h-4 text-slate-600" })}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-semibold text-slate-800 text-[13px] leading-tight truncate">
              {title}
            </h3>
            {onPinToggle && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPinToggle();
                }}
                className={cn(
                  "hover:scale-110 active:scale-95 transition-all cursor-pointer focus:outline-none shrink-0",
                  isPinned ? "text-amber-400" : "text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-400"
                )}
                title={isPinned ? "Lepas dari Favorit" : "Sematkan ke Favorit"}
              >
                <Star className={cn("w-3 h-3", isPinned ? "fill-amber-400 text-amber-400" : "")} />
              </button>
            )}
          </div>
        </div>
        
        {/* Toggle Switch */}
        <button 
          type="button"
          onClick={onToggle} 
          className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none select-none"
          style={{ backgroundColor: isActive ? '#0f172a' : '#e2e8f0' }}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-[1.5px] ml-[1.5px]",
              isActive ? "translate-x-3" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Description */}
      <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-2 mt-2">
        {desc}
      </p>

      {/* Bottom section: Config button & Active Status badge */}
      <div className="flex items-center justify-between mt-auto pt-3">
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded-md select-none",
          isActive ? "bg-slate-100 text-slate-600" : "text-slate-400"
        )}>
          {isActive ? 'Aktif' : 'Nonaktif'}
        </span>
        
        {onConfigure && (
          <button 
            type="button"
            onClick={onConfigure}
            className="text-[10px] font-medium flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
          >
            <Settings className="w-3 h-3" />
            <span>Configure</span>
          </button>
        )}
      </div>
    </div>
  );
}
