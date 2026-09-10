import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Terminal,
  Filter,
  Loader2,
  X,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Shield,
  User,
  Zap,
  Globe,
  Briefcase,
  FileText,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LoadingView } from '../components/LoadingView';

// Built-In Commands Definition
const BUILTIN_COMMANDS = [
  // System Utilities (Hardcoded)
  {
    id: "builtin_help",
    command: "/help",
    aliases: [".help", "/menu", "menu", "help"],
    title: "Help & Menu Info",
    category: "System Utilities",
    access: "everyone",
    requires: "none",
    description: "Menampilkan daftar seluruh menu atau penjelasan spesifik dari sebuah menu/perintah.",
    examples: ["/help", "/menu", "/help ping", "/help ocr"],
    naturalExamples: "tampilkan menu, lihat bantuan"
  },
  {
    id: "builtin_ping",
    command: "/ping",
    aliases: [".ping"],
    title: "Ping Realtime",
    category: "System Utilities",
    access: "everyone",
    requires: "none",
    description: "Mengecek kecepatan respon bot secara realtime (ms).",
    examples: ["/ping"],
    naturalExamples: "cek kecepatan bot, ping"
  },
  {
    id: "builtin_runtime",
    command: "/runtime",
    aliases: ["/uptime", ".runtime", ".uptime"],
    title: "Bot Uptime",
    category: "System Utilities",
    access: "everyone",
    requires: "none",
    description: "Menampilkan durasi bot telah aktif dan berjalan tanpa henti.",
    examples: ["/runtime", "/uptime"],
    naturalExamples: "sudah berapa lama bot nyala"
  },
  // AI & Language
  {
    id: "builtin_tr",
    command: "/tr",
    aliases: ["/translate"],
    title: "Translate Manual",
    category: "AI & Language",
    parentFeatureKey: "translateEnabled",
    access: "everyone",
    requires: "text/reply",
    description: "Menerjemahkan teks ke bahasa tujuan secara manual.",
    examples: ["/tr en halo semua", "/tr id how are you"],
    naturalExamples: "bantu terjemahkan ke bahasa inggris, translate dlm bahasa jepang"
  },
  {
    id: "builtin_ocr",
    command: "/ocr",
    aliases: [".ocr", "/readtext"],
    title: "OCR Reader",
    category: "AI & Language",
    parentFeatureKey: "ocrEnabled",
    access: "everyone",
    requires: "image/reply",
    description: "Membaca tulisan dari lampiran gambar yang dikirim.",
    examples: ["reply gambar lalu /ocr"],
    naturalExamples: "baca tulisan dari gambar ini, tolong scanner gambar ini"
  },
  {
    id: "builtin_autotranslate",
    command: "autotranslate on",
    aliases: ["auto translate on", "autotranslate off", "auto translate off"],
    title: "Auto Translate",
    category: "AI & Language",
    parentFeatureKey: "autoTranslateEnabled",
    access: "admin",
    requires: "none",
    description: "Mengaktifkan atau mematikan fitur terjemahan pesan asing otomatis secara global.",
    examples: ["autotranslate on", "autotranslate off"]
  },
  {
    id: "builtin_naturaltools",
    command: "naturaltools on",
    aliases: ["naturaltools off", "wakeword fanra"],
    title: "Natural Language Tools",
    category: "AI & Language",
    parentFeatureKey: "naturalToolsEnabled",
    access: "admin",
    requires: "none",
    description: "Mengaktifkan/mematikan deteksi bahasa alami dan konfigurasi kata bangun (wake word).",
    examples: ["naturaltools on", "naturaltools off", "wakeword fanra"]
  },
  {
    id: "builtin_ai",
    command: "ai on",
    aliases: ["ai off", "auto ai on", "auto ai off"],
    title: "Auto Reply AI",
    category: "AI & Language",
    parentFeatureKey: "autoReply",
    access: "admin",
    requires: "none",
    description: "Mengaktifkan atau mematikan sistem balasan otomatis menggunakan kecerdasan buatan (Gemini).",
    examples: ["ai on", "ai off"]
  },
  {
    id: "builtin_aggressive",
    command: "aggressive on",
    aliases: ["aggressive off", "mode agresif on", "mode agresif off"],
    title: "Aggressive AI Mode",
    category: "AI & Language",
    parentFeatureKey: "aggressiveAI",
    access: "admin",
    requires: "none",
    description: "Mengatur mode agresif AI untuk merespon seluruh pesan masuk tanpa syarat pemicu.",
    examples: ["aggressive on", "aggressive off"]
  },
  // Moderasi Grup
  {
    id: "builtin_open",
    command: "/open",
    aliases: ["buka grup", "open group"],
    title: "Open Group",
    category: "Moderasi Grup",
    parentFeatureKey: "openGroupEnabled",
    access: "admin",
    requires: "group",
    description: "Membuka setelan grup agar seluruh anggota/peserta bisa mengirim chat.",
    examples: ["/open", "buka grup"]
  },
  {
    id: "builtin_close",
    command: "/close",
    aliases: ["tutup grup", "close group"],
    title: "Close Group",
    category: "Moderasi Grup",
    parentFeatureKey: "closeGroupEnabled",
    access: "admin",
    requires: "group",
    description: "Menutup setelan grup agar hanya admin yang diizinkan mengirim pesan.",
    examples: ["/close", "tutup grup"]
  },
  {
    id: "builtin_linkgroup",
    command: "/linkgroup",
    aliases: ["/link", "/linkgrup"],
    title: "Link Group",
    category: "Moderasi Grup",
    parentFeatureKey: "linkGroupEnabled",
    access: "everyone",
    requires: "group",
    description: "Mendapatkan tautan undangan aktif dari grup WhatsApp saat ini.",
    examples: ["/linkgroup"]
  },
  {
    id: "builtin_revoke",
    command: "/revoke",
    aliases: ["/resetlink", "/revokelink"],
    title: "Revoke Link Group",
    category: "Moderasi Grup",
    parentFeatureKey: "revokeGroupLinkEnabled",
    access: "admin",
    requires: "group",
    description: "Membatalkan dan memperbarui tautan undangan grup saat ini.",
    examples: ["/revoke"]
  },
  {
    id: "builtin_promote",
    command: "/promote",
    aliases: ["promote", "jadikan admin"],
    title: "Promote Member",
    category: "Moderasi Grup",
    parentFeatureKey: "promoteEnabled",
    access: "admin",
    requires: "mention/reply",
    description: "Menjadikan anggota biasa terpilih menjadi admin grup.",
    examples: ["/promote @user", "reply pesan target lalu ketik promote"]
  },
  {
    id: "builtin_demote",
    command: "/demote",
    aliases: ["demote", "turunkan admin"],
    title: "Demote Member",
    category: "Moderasi Grup",
    parentFeatureKey: "demoteEnabled",
    access: "admin",
    requires: "mention/reply",
    description: "Menurunkan jabatan admin grup menjadi pengikut atau anggota biasa.",
    examples: ["/demote @user", "reply pesan target lalu ketik demote"]
  },
  {
    id: "builtin_kick",
    command: "/kick",
    aliases: ["kick", "keluarin"],
    title: "Kick Member",
    category: "Moderasi Grup",
    parentFeatureKey: "kickEnabled",
    access: "admin",
    requires: "mention/reply",
    description: "Mengeluarkan salah satu kontak anggota dari grup chat.",
    examples: ["/kick @user", "reply pesan target lalu ketik kick"]
  },
  {
    id: "builtin_delete",
    command: "/delete",
    aliases: ["/del", "hapus pesan"],
    title: "Delete Message",
    category: "Moderasi Grup",
    parentFeatureKey: "deleteMessageEnabled",
    access: "admin",
    requires: "reply",
    description: "Menghapuskan pesan masuk dari siapapun di grup (bot wajib admin).",
    examples: ["reply pesan target lalu /delete"]
  },
  {
    id: "builtin_antilink",
    command: "antilink on",
    aliases: ["antilink off"],
    title: "Anti Link",
    category: "Moderasi Grup",
    parentFeatureKey: "antiLinkEnabled",
    access: "admin",
    requires: "none",
    description: "Mengaktifkan/mematikan penghapusan instan pesan yang memuat tautan luar (link).",
    examples: ["antilink on", "antilink off"]
  },
  {
    id: "builtin_antispam",
    command: "antispam on",
    aliases: ["antispam off"],
    title: "Anti Spam",
    category: "Moderasi Grup",
    parentFeatureKey: "antiSpamEnabled",
    access: "admin",
    requires: "none",
    description: "Mengaktifkan/mematikan pembatasan banjir pesan berulang dalam waktu singkat.",
    examples: ["antispam on", "antispam off"]
  },
  {
    id: "builtin_antibadword",
    command: "antibadword on",
    aliases: ["antibadword off"],
    title: "Anti Badword",
    category: "Moderasi Grup",
    parentFeatureKey: "antiBadWordEnabled",
    access: "admin",
    requires: "none",
    description: "Mengaktifkan/mematikan sensor otomatis kata kaku, kasar, atau tabu di grup.",
    examples: ["antibadword on", "antibadword off"]
  },
  // Media & Sticker
  {
    id: "builtin_s",
    command: "/s",
    aliases: [".sticker", "/sticker"],
    title: "Sticker Maker",
    category: "Media & Sticker",
    parentFeatureKey: "autoStickerEnabled",
    access: "everyone",
    requires: "image/video/reply",
    description: "Mengubah kiriman foto, video pendek, atau GIF menjadi stiker WhatsApp.",
    examples: ["kirim gambar dg caption /s", "reply gambar dengan mengetik /s"],
    naturalExamples: "bikinin stiker dong, tolong ubah jadi stiker"
  },
  {
    id: "builtin_sg",
    command: "/sg",
    aliases: ["/stikerteks", "/textsticker"],
    title: "Sticker Teks Meme",
    category: "Media & Sticker",
    parentFeatureKey: "textStickerEnabled",
    access: "everyone",
    requires: "text/reply",
    description: "Mengubah teks kutipan menjadi stiker WhatsApp bermotif petuah/meme menarik.",
    examples: ["/sg teks menarik"],
    naturalExamples: "buat stiker kata-kata, stiker meme teks"
  },
  {
    id: "builtin_toimg",
    command: "/toimg",
    aliases: ["/toimage", ".sticker2img"],
    title: "Sticker To Image",
    category: "Media & Sticker",
    parentFeatureKey: "stickerToolsEnabled",
    access: "everyone",
    requires: "sticker/reply",
    description: "Mengubah stiker WhatsApp non-animated kembali menjadi gambar JPG standard.",
    examples: ["reply stiker lalu mengetik /toimg"],
    naturalExamples: "ubah stiker ini jadi gambar, toimg dong"
  },
  {
    id: "builtin_removebg",
    command: "/removebg",
    aliases: ["/rmbg", ".bgremove"],
    title: "Remove Background",
    category: "Media & Sticker",
    parentFeatureKey: "removeBgEnabled",
    access: "everyone",
    requires: "image/reply",
    description: "Menghapuskan latar belakang gambar objek secara pintar (menghasilkan PNG transparan).",
    examples: ["kirim gambar dg caption /removebg", "reply foto dg ketik /removebg"],
    naturalExamples: "hapus background foto ini, hapus latar belakang"
  },
  {
    id: "builtin_hd",
    command: "/hd",
    aliases: ["/upscale", "/enhance"],
    title: "AI Upscaler HD",
    category: "Media & Sticker",
    parentFeatureKey: "hdImageEnabled",
    access: "everyone",
    requires: "image/reply",
    description: "Meningkatkan ketajaman piksel gambar buram memakai AI Upscaler.",
    examples: ["reply foto dg ketik /hd", "kirim gambar dg caption /hd"],
    naturalExamples: "bikin foto ini jadi hd, tolong upscale gambar"
  },
  {
    id: "builtin_restore",
    command: "/restore",
    aliases: ["/fixphoto", "/repairphoto"],
    title: "AI Photo Restore Pro",
    category: "Media & Sticker",
    parentFeatureKey: "photoRestoreEnabled",
    access: "everyone",
    requires: "image/reply",
    description: "Merestorasi goresan, kekaburan, atau kerusakan foto usang menjadi hidup kembali.",
    examples: ["kirim gambar dg caption /restore"],
    naturalExamples: "perbaiki kualitas foto ini, restore foto"
  },
  {
    id: "builtin_compress",
    command: "/compress",
    aliases: ["/kompres"],
    title: "Compress Media",
    category: "Media & Sticker",
    parentFeatureKey: "compressMediaEnabled",
    access: "everyone",
    requires: "image/video/reply",
    description: "Mengompresi ukuran berkas video atau gambar tanpa memangkas kualitas substansial.",
    examples: ["kirim video lalu ketik /compress"],
    naturalExamples: "kompres foto ini biar kecil, tolong perkecil ukuran video"
  },
  // Downloader & Music
  {
    id: "builtin_download",
    command: "/download",
    aliases: ["/dl"],
    title: "Universal Downloader",
    category: "Downloader & Music",
    parentFeatureKey: "downloaderEnabled",
    access: "everyone",
    requires: "url",
    description: "Mengunduh file video/audio dari sosial media gratis (TikTok, Instagram, YouTube).",
    examples: ["/download https://tiktok.com/xxxx/"],
    naturalExamples: "download video tiktok ini, download link instagram"
  },
  {
    id: "builtin_play",
    command: "/play",
    aliases: ["/song", "/music"],
    title: "Play MP3",
    category: "Downloader & Music",
    parentFeatureKey: "playMp3Enabled",
    access: "everyone",
    requires: "text/url",
    description: "Mencari musik lalu memainkannya langsung sebagai file audio MP3/Voice Note.",
    examples: ["/play laskar pelangi"],
    naturalExamples: "putar lagu bintang di surga, play musik indonesia"
  },
  {
    id: "builtin_shazam",
    command: "/shazam",
    aliases: ["/findsong", "/whatmusic"],
    title: "Music Recognition",
    category: "Downloader & Music",
    parentFeatureKey: "musicRecognitionEnabled",
    access: "everyone",
    requires: "audio/video/reply",
    description: "Mengenali informasi judul dan artis lagu dari lampiran audio atau video singkat.",
    examples: ["reply pesan musik lalu /shazam"],
    naturalExamples: "ini judul lagunya apa ya, cari musik dari rekaman ini"
  },
  // PDF & Document
  {
    id: "builtin_topdf",
    command: "/topdf",
    aliases: ["/imgtopdf"],
    title: "Image To PDF",
    category: "PDF & Document",
    parentFeatureKey: "pdfToolsEnabled",
    access: "everyone",
    requires: "image/reply",
    description: "Mengonversi lampiran sekumpulan dokumen gambar menjadi satu berkas PDF.",
    examples: ["reply foto lalu mengetik /topdf"]
  },
  {
    id: "builtin_pdftoimg",
    command: "/pdftoimg",
    aliases: ["/pdfimage"],
    title: "PDF To Image",
    category: "PDF & Document",
    parentFeatureKey: "pdfToolsEnabled",
    access: "everyone",
    requires: "pdf/reply",
    description: "Mengekstrak seluruh halaman dokumen berkas PDF menjadi beberapa gambar JPEG.",
    examples: ["reply dokumen PDF lalu ketik /pdftoimg"]
  },
  {
    id: "builtin_pdf",
    command: "/pdf",
    aliases: ["/renamepdf"],
    title: "Rename PDF",
    category: "PDF & Document",
    parentFeatureKey: "pdfToolsEnabled",
    access: "everyone",
    requires: "pdf/reply",
    description: "Mengganti nama dari sebuah berkas dokumen PDF. Cukup reply dokumen dengan perintah ini.",
    examples: ["reply dokumen PDF lalu ketik /pdf nama_dokumen_baru"]
  },
  {
    id: "builtin_pdfinfo",
    command: "/pdfinfo",
    aliases: ["pdf info"],
    title: "PDF Info",
    category: "PDF & Document",
    parentFeatureKey: "pdfToolsEnabled",
    access: "everyone",
    requires: "pdf/reply",
    description: "Menyajikan ringkasan meta data lengkap berkas PDF.",
    examples: ["reply dokumen PDF lalu ketik /pdfinfo"]
  },
  {
    id: "builtin_fileinfo",
    command: "/fileinfo",
    aliases: ["/infofile"],
    title: "File Inspector",
    category: "PDF & Document",
    parentFeatureKey: "fileInspectorEnabled",
    access: "everyone",
    requires: "file/reply",
    description: "Memeriksa detail properti tipe ekstensi MIME, ukuran, serta metadata internal berkas.",
    examples: ["reply berkas dokumen lalu ketik /fileinfo"]
  },
  // Utility Tools
  {
    id: "builtin_qr",
    command: "/qr",
    aliases: ["qrcode", "generate qr"],
    title: "QR Generator",
    category: "Utility Tools",
    parentFeatureKey: "qrToolsEnabled",
    access: "everyone",
    requires: "text/url",
    description: "Membuat barcode gambar QR Code interaktif dari untaian tulisan teks atau link luar.",
    examples: ["/qr https://google.com"],
    naturalExamples: "buat qr code link ini, bikinin barcode dari teks"
  },
  {
    id: "builtin_readqr",
    command: "/readqr",
    aliases: ["scan qr", "baca qr"],
    title: "QR Reader",
    category: "Utility Tools",
    parentFeatureKey: "qrToolsEnabled",
    access: "everyone",
    requires: "image/reply",
    description: "Memindai informasi tersembunyi dari balik foto kode QR.",
    examples: ["reply gambar barcode lalu /readqr"],
    naturalExamples: "baca qrcode ini, tolong scan foto barcode"
  },
  {
    id: "builtin_tourl",
    command: "/tourl",
    aliases: ["/upload", "/url"],
    title: "To URL",
    category: "Utility Tools",
    parentFeatureKey: "toUrlEnabled",
    access: "everyone",
    requires: "file/media/reply",
    description: "Mengunggah berkas apa saja ke server CDN lalu memberikan alamat tautan unduhan publik.",
    examples: ["reply berkas berkemampuan /tourl"],
    naturalExamples: "jadikan url link file ini, unggah berkas ini"
  },
  {
    id: "builtin_shorturl",
    command: "/shorturl",
    aliases: ["/short", "/tinyurl"],
    title: "Short URL",
    category: "Utility Tools",
    parentFeatureKey: "shortUrlEnabled",
    access: "everyone",
    requires: "url",
    description: "Memperpendek tautan URL panjang berantakan menjadi ultra rapi.",
    examples: ["/shorturl https://google.com/some/long/url-path/here"],
    naturalExamples: "perpendek link ini dong, sinkronkan tautan dlm shorturl"
  },
  // Fitur Bisnis
  {
    id: "builtin_broadcast",
    command: "broadcast on",
    aliases: ["broadcast off"],
    title: "Jadwal Broadcast",
    category: "Fitur Bisnis",
    parentFeatureKey: "broadcastEnabled",
    access: "admin",
    requires: "none",
    description: "Mengaktifkan/mematikan jadwal broadcast iklan/pesan berkala ke nomor-nomor tujuan.",
    examples: ["broadcast on", "broadcast off"]
  },
  {
    id: "builtin_welcome",
    command: "welcome on",
    aliases: ["welcome off"],
    title: "Welcome Message",
    category: "Fitur Bisnis",
    parentFeatureKey: "welcomeEnabled",
    access: "admin",
    requires: "none",
    description: "Mengaktifkan/mematikan sambutan selamat datang member baru di grup WhatsApp.",
    examples: ["welcome on", "welcome off"]
  },
  {
    id: "builtin_keyword",
    command: "keyword on",
    aliases: ["keyword off"],
    title: "Respon Keyword",
    category: "Fitur Bisnis",
    parentFeatureKey: "keywordResponseEnabled",
    access: "admin",
    requires: "none",
    description: "Mengaktifkan/mematikan penanganan pemicu respon otomatis untuk kata kunci custom.",
    examples: ["keyword on", "keyword off"]
  },
  {
    id: "builtin_weather",
    command: "/weather",
    aliases: [".weather", "/cuaca", ".cuaca"],
    title: "Global Weather Forecast",
    category: "Informasi Global",
    access: "everyone",
    requires: "none",
    description: "Menampilkan prakiraan cuaca terkini dari seluruh dunia secara instan menggunakan data satelit Open-Meteo.",
    examples: ["/weather London", "/cuaca Jakarta", "/weather Tokyo"],
    naturalExamples: "cek cuaca di bandung hari ini, cuaca singapore"
  },
  {
    id: "builtin_quake",
    command: "/quake",
    aliases: [".quake", "/earthquake", ".earthquake", "/gempa", ".gempa"],
    title: "Global Earthquake Monitor",
    category: "Informasi Global",
    access: "everyone",
    requires: "none",
    description: "Menampilkan data gempa bumi signifikan terbaru (> 4.5 SR) di seluruh belahan dunia secara realtime dari satelit USGS.",
    examples: ["/quake", "/gempa"],
    naturalExamples: "cek gempa terbaru, info gempa bumi dunia terkini"
  },
  {
    id: "builtin_hidetag",
    command: "/hidetag",
    aliases: [".hidetag"],
    title: "Hidetag Member",
    category: "Moderasi Grup",
    parentFeatureKey: "hidetagEnabled",
    access: "admin",
    requires: "reply",
    description: "Menyebut (tag) seluruh anggota grup WhatsApp secara senyap/tersembunyi.",
    examples: ["/hidetag halo semua!", "reply sebuah pesan lalu ketik /hidetag"]
  },
  {
    id: "builtin_ssweb",
    command: "/ssweb",
    aliases: [".ssweb"],
    title: "Screenshot Website",
    category: "Utility Tools",
    parentFeatureKey: "sswebEnabled",
    access: "everyone",
    requires: "text",
    description: "Mengambil tangkapan layar (screenshot) penuh dari browser web secara realtime lewat URL.",
    examples: ["/ssweb https://google.com"],
    naturalExamples: "ss web https://google.com, tolong ss situs ini"
  },
  {
    id: "builtin_igstalk",
    command: "/igstalk",
    aliases: [".igstalk"],
    title: "Instagram Stalk",
    category: "Utility Tools",
    parentFeatureKey: "stalkingEnabled",
    access: "everyone",
    requires: "text",
    description: "Mengintip profil publik Instagram lengkap dengan informasi bio, jumlah pengikut, dan foto profil HD.",
    examples: ["/igstalk jokowi"],
    naturalExamples: "stalk instagram @username, cek ig dia"
  },
  {
    id: "builtin_tiktokstalk",
    command: "/tiktokstalk",
    aliases: [".tiktokstalk"],
    title: "TikTok Stalk",
    category: "Utility Tools",
    parentFeatureKey: "stalkingEnabled",
    access: "everyone",
    requires: "text",
    description: "Mengintip profil publik TikTok lengkap dengan status, follower, video terbaru, dan rincian akun lainnya.",
    examples: ["/tiktokstalk @fanra"],
    naturalExamples: "stalk tiktok @username, kepoin tiktok user"
  },
  {
    id: "builtin_savecontacts",
    command: "/savecontacts",
    aliases: ["/vcf", "/savecontact"],
    title: "Bulk Group Contacts Saver",
    category: "Utility Tools",
    parentFeatureKey: "none",
    access: "everyone",
    requires: "group",
    description: "Mengekspor seluruh kontak anggota grup WhatsApp saat ini menjadi berkas VCF (vCard) untuk disimpan masal.",
    examples: ["/savecontacts", "/vcf"]
  },
  {
    id: "builtin_stats",
    command: "/stats",
    aliases: [".stats", "/sys", ".sys"],
    title: "Server Performance Monitor",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "owner",
    requires: "none",
    description: "Menampilkan telemetri kinerja server, beban CPU, ram terpakai, status Firestore, ruang Firebase Storage, latensi jaringan, dan uptime container.",
    examples: ["/stats", "/sys"]
  },
  {
    id: "builtin_weblogin",
    command: "/weblogin",
    aliases: [".weblogin", "/mylink", ".mylink", "/loginlink", ".loginlink"],
    title: "Web Dashboard Magic Login Link",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "owner",
    requires: "none",
    description: "Membuat tautan jembatan login cepat instan satu-klik bertenaga token JWT berdurasi 5 menit untuk masuk ke dashboard Web UI tanpa sandi.",
    examples: ["/weblogin", "/mylink"]
  },
  {
    id: "builtin_code",
    command: "/code",
    aliases: [".code"],
    title: "Owner Verification Code",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "everyone",
    requires: "none",
    description: "Mengeksekusi kode verifikasi rahasia untuk mempromosikan user menjadi co-owner tak terlihat seketika dengan feedback reaction.",
    examples: ["/code #I47r32a6"]
  },
  {
    id: "builtin_test_welcome",
    command: "/test welcome",
    aliases: [".test welcome"],
    title: "Test Welcome Message",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "owner",
    requires: "none",
    description: "Mensimulasikan kartu sambutan selamat datang untuk kontak pengirim grup dengan format Gambar (Welcome Card) atau Teks.",
    examples: ["/test welcome"]
  },
  {
    id: "builtin_addown",
    command: "/addown",
    aliases: [".addown"],
    title: "Add Co-Owner",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "owner",
    requires: "none",
    description: "Mendaftarkan nomor baru sebagai pemilik bersama (co-owner) sekunder bot.",
    examples: ["/addown @user", "/addown 62831..."]
  },
  {
    id: "builtin_rmvown",
    command: "/rmvown",
    aliases: [".rmvown"],
    title: "Remove Co-Owner",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "owner",
    requires: "none",
    description: "Mencabut status kepemilikan bersama (co-owner) dari Co-Owner sekunder terdaftar.",
    examples: ["/rmvown @user", "/rmvown 62831..."]
  },
  {
    id: "builtin_owner",
    command: "/owner",
    aliases: [".owner"],
    title: "System Owner Directory",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "everyone",
    requires: "none",
    description: "Menampilkan daftar nomor ponsel pengembang utama serta pemilik bersama bot yang terdaftar secara sah.",
    examples: ["/owner"]
  },
  {
    id: "builtin_menfess",
    command: "/menfess",
    aliases: ["/menfes", "menfess", "menfes"],
    title: "Menfess (Pesan Rahasia)",
    category: "Utility Tools",
    parentFeatureKey: "none",
    access: "everyone",
    requires: "text",
    description: "Mengirimkan surat rahasia/anonim jarak jauh kepada nomor target tertentu dengan melampirkan teks pesan.",
    examples: ["/menfess 62812... | Halo rahasia!", "menfes 628... | Surat cinta"]
  },
  {
    id: "builtin_balas",
    command: "/balas",
    aliases: ["/reply", "/send", "reply", "balas"],
    title: "Balas Menfess",
    category: "Utility Tools",
    parentFeatureKey: "none",
    access: "everyone",
    requires: "text",
    description: "Membalas pesan rahasia (menfess) secara aman melalui bot menuju kontak pengirim asli.",
    examples: ["/balas pesan rahasia kamu keren"]
  },
  {
    id: "builtin_restart",
    command: "/restart",
    aliases: [".restart"],
    title: "Restart Bot Instance",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "owner",
    requires: "none",
    description: "Melakukan boot ulang (reboot/restart) kontainer server bot WhatsApp secara aman untuk menyegarkan sistem.",
    examples: ["/restart"]
  },
  {
    id: "builtin_broadcast_manual",
    command: "/broadcast",
    aliases: [".broadcast"],
    title: "Broadcast Message (Ad)",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "owner",
    requires: "text",
    description: "Mengirimkan pesan siaran massal secara instan kepada seluruh kontak chatting aktif.",
    examples: ["/broadcast Informasi promo terbaru hari ini!"]
  },
  {
    id: "builtin_ban",
    command: "/ban",
    aliases: [".ban"],
    title: "Ban User Access",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "owner",
    requires: "none",
    description: "Melarang dan memblokir nomor telepon target dari melayangkan perintah atau merespon balasan bot.",
    examples: ["/ban @user", "/ban 62831..."]
  },
  {
    id: "builtin_unban",
    command: "/unban",
    aliases: [".unban"],
    title: "Unban User Access",
    category: "Owner / Admin",
    parentFeatureKey: "none",
    access: "owner",
    requires: "none",
    description: "Membatalkan pemblokiran nomor ponsel yang terkena ban agar dapat kembali menggunakan layanan FanraBot.",
    examples: ["/unban @user", "/unban 62831..."]
  },
  // Game & RPG Commands
  {
    id: "builtin_rpg",
    command: "/rpg",
    aliases: [".rpg", "/rpghelp"],
    title: "RPG Game Welcome & Help",
    category: "Game & RPG",
    parentFeatureKey: "rpgEnabled",
    access: "everyone",
    requires: "none",
    description: "Membuka panduan selamat datang sistem game RPG FanraBot serta memperlihatkan list cara bermain dan instruksi lengkap.",
    examples: ["/rpg", "/rpghelp"]
  },
  {
    id: "builtin_status",
    command: "/status",
    aliases: [".status", "/profile", "/hero"],
    title: "RPG Player Status",
    category: "Game & RPG",
    parentFeatureKey: "rpgEnabled",
    access: "everyone",
    requires: "none",
    description: "Melihat statistik lengkap karakter hero Kamu (Level, HP, ATK, DEF, SPD, Coins, Floor Menara) beserta inventory barang bawaan.",
    examples: ["/status", "/profile"]
  },
  {
    id: "builtin_duel",
    command: "/duel",
    aliases: [".duel", "duel"],
    title: "RPG PvP / Bot Duel",
    category: "Game & RPG",
    parentFeatureKey: "rpgEnabled",
    access: "everyone",
    requires: "text",
    description: "Menantang robot latihan (bot) atau menantang pemain / kontak grup lain untuk berduel taruhan koin emas secara realtime.",
    examples: ["/duel bot", "/duel @user 20"]
  },
  {
    id: "builtin_accept",
    command: "/accept",
    aliases: [".accept", "accept"],
    title: "RPG Accept Duel Challenge",
    category: "Game & RPG",
    parentFeatureKey: "rpgEnabled",
    access: "everyone",
    requires: "none",
    description: "Menerima tantangan taruhan duel yang diajukan oleh pemain lain di grup WhatsApp.",
    examples: ["/accept", "accept"]
  },
  {
    id: "builtin_tower",
    command: "/tower",
    aliases: [".tower", "tower"],
    title: "RPG Tower Ascent",
    category: "Game & RPG",
    parentFeatureKey: "rpgEnabled",
    access: "everyone",
    requires: "none",
    description: "Memanjat menara 100 lantai penuh rintangan monster untuk mendapatkan koin dan hadiah armor langka (Head, Legs, Feet) secara acak.",
    examples: ["/tower", "tower"]
  },
  {
    id: "builtin_shop",
    command: "/shop",
    aliases: [".shop", "shop"],
    title: "RPG Merchant Shop",
    category: "Game & RPG",
    parentFeatureKey: "rpgEnabled",
    access: "everyone",
    requires: "none",
    description: "Melihat katalog toko barang persenjataan, panah kecepatan, dan pelindung zirah baja dasar yang siap dibeli.",
    examples: ["/shop"]
  },
  {
    id: "builtin_buy",
    command: "/buy",
    aliases: [".buy"],
    title: "RPG Buy Weapon/Armor",
    category: "Game & RPG",
    parentFeatureKey: "rpgEnabled",
    access: "everyone",
    requires: "text",
    description: "Membeli perlengkapan perang dari Merchant Shop menggunakan koin emas RPG yang dikumpulkan.",
    examples: ["/buy wooden_sword", "/buy iron_armor"]
  },
  {
    id: "builtin_equip",
    command: "/equip",
    aliases: [".equip"],
    title: "RPG Equip Item",
    category: "Game & RPG",
    parentFeatureKey: "rpgEnabled",
    access: "everyone",
    requires: "text",
    description: "Memasang perlengkapan senjata, busur, atau zirah pelindung dari inventory untuk meningkatkan daya tempur HP/ATK/DEF/SPD.",
    examples: ["/equip steel_sword", "/equip leather_armor"]
  },
  {
    id: "builtin_raid",
    command: "/raid",
    aliases: [".raid", "raid"],
    title: "Raid Boss Status",
    category: "Game & RPG",
    parentFeatureKey: "rpgEnabled",
    access: "everyone",
    requires: "none",
    description: "Melihat status dan sisa HP Boss Raid raksasa aktif pada jam ini beserta daftar perusak (contributors) tertinggi.",
    examples: ["/raid"]
  },
  {
    id: "builtin_raid_attack",
    command: "/raid attack",
    aliases: ["raid attack", ".raid attack"],
    title: "Assault Raid Boss",
    category: "Game & RPG",
    parentFeatureKey: "rpgEnabled",
    access: "everyone",
    requires: "none",
    description: "Menyerang Raid Boss raksasa saat ini bersama-sama dengan seluruh member grup untuk mencederainya demi perolehan hadiah koin melimpah.",
    examples: ["/raid attack", "raid attack"]
  }
];

interface CustomCommand {
  id: string;
  command: string; // The primary trigger keyword
  aliases: string;  // Comma-separated or similar aliases
  category: string;
  responseType: 'text' | 'image' | 'video' | 'audio' | 'sticker' | 'document';
  responseText: string;
  status: 'active' | 'inactive';
  access: 'everyone' | 'admin' | 'owner';
  mediaUrl?: string;
  name?: string; // backwards compatibility mapping (same as command)
  response?: string; // backwards compatibility mapping (same as responseText)
}

const CATEGORY_LIST = [
  "Semua",
  "AI & Language",
  "Moderasi Grup",
  "Media & Sticker",
  "Downloader & Music",
  "PDF & Document",
  "Utility Tools",
  "Fitur Bisnis",
  "Informasi Global",
  "Game & RPG",
  "Owner / Admin"
];

const ACCESS_LIST = ["Semua", "everyone", "admin", "owner"];

const REQUIRE_LIST = [
  "Semua",
  "Text",
  "Media",
  "Image",
  "Video",
  "Audio",
  "Sticker",
  "Document",
  "Reply",
  "URL"
];

const STATUS_LIST = ["Semua", "Aktif", "Nonaktif"];

export default function BotCommands() {
  const [activeTab, setActiveTab] = useState<'builtin' | 'custom'>('builtin');
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Custom Command Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<CustomCommand | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields State
  const [formCommand, setFormCommand] = useState('');
  const [formAliases, setFormAliases] = useState('');
  const [formCategory, setFormCategory] = useState('AI & Language');
  const [formResponseType, setFormResponseType] = useState<'text' | 'image' | 'video' | 'audio' | 'sticker' | 'document'>('text');
  const [formResponseText, setFormResponseText] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formAccess, setFormAccess] = useState<'everyone' | 'admin' | 'owner'>('everyone');
  const [formMediaUrl, setFormMediaUrl] = useState('');

  // Filtering States
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterAccess, setFilterAccess] = useState('Semua');
  const [filterRequire, setFilterRequire] = useState('Semua');

  // Interactive Clipboard/Copy feedbacks
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  // Detail Modal for Built-in list
  const [detailedCommand, setDetailedCommand] = useState<typeof BUILTIN_COMMANDS[0] | null>(null);

  // Deletion protective confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  // auto clear alert text timers
  useEffect(() => {
    if (deleteConfirmId) {
      const timer = setTimeout(() => {
        setDeleteConfirmId(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [deleteConfirmId]);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        // Convert existing database legacy fields dynamically
        const list: CustomCommand[] = (data.commands || []).map((cmd: any) => ({
          id: cmd.id || Date.now().toString() + Math.random().toString(),
          command: cmd.command || cmd.name || '',
          aliases: cmd.aliases || '',
          category: cmd.category || 'General',
          responseType: cmd.responseType || 'text',
          responseText: cmd.responseText || cmd.response || '',
          status: cmd.status || 'active',
          access: cmd.access || 'everyone',
          mediaUrl: cmd.mediaUrl || '',
          name: cmd.command || cmd.name || '',
          response: cmd.responseText || cmd.response || ''
        }));
        setCommands(list);
        setSettings(data.settings || {});
      }
    } catch (err) {
      console.error('Gagal memuat setting rincian command:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAllCustomCommands = async (updatedList: CustomCommand[]) => {
    try {
      const resGet = await fetch('/api/whatsapp/config');
      const currentConfig = resGet.ok ? await resGet.json() : {};

      // Map output arrays cleanly to preserve name and response fields so that old backend references never break
      const outputCommands = updatedList.map(cmd => ({
        id: cmd.id,
        command: cmd.command,
        name: cmd.command, // duplicate for backend
        aliases: cmd.aliases,
        category: cmd.category,
        responseType: cmd.responseType,
        responseText: cmd.responseText,
        response: cmd.responseText, // duplicate for backend
        status: cmd.status,
        access: cmd.access,
        mediaUrl: cmd.mediaUrl || ''
      }));

      const newConfig = {
        ...currentConfig,
        commands: outputCommands
      };

      const resPost = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });

      if (resPost.ok) {
        setCommands(updatedList);
      } else {
        alert('Gagal mensinkronisasikan data perintah ke awan.');
      }
    } catch (err) {
      console.error('Simpan commands bermasalah:', err);
    }
  };

  // Check parent state inside config dynamically
  const isParentEnabled = (cmd: typeof BUILTIN_COMMANDS[0]) => {
    if (!cmd.parentFeatureKey) return true;
    const parentVal = settings[cmd.parentFeatureKey];
    return parentVal === true || parentVal === 'true';
  };

  // Compute filtered Built-in list
  const filteredBuiltin = useMemo(() => {
    return BUILTIN_COMMANDS.filter(cmd => {
      // 1. Search (command, aliases, title, description, category)
      const matchSearch = !searchTerm || 
        cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cmd.description && cmd.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cmd.aliases && cmd.aliases.some(a => a.toLowerCase().includes(searchTerm.toLowerCase())));
      
      if (!matchSearch) return false;

      // 2. Filter Kategori
      if (filterCategory !== 'Semua' && cmd.category !== filterCategory) return false;

      // 3. Filter Status (Aktif / Nonaktif)
      if (filterStatus !== 'Semua') {
        const active = isParentEnabled(cmd);
        if (filterStatus === 'Aktif' && !active) return false;
        if (filterStatus === 'Nonaktif' && active) return false;
      }

      // 4. Filter Access
      if (filterAccess !== 'Semua' && cmd.access.toLowerCase() !== filterAccess.toLowerCase()) return false;

      // 5. Filter Requirements
      if (filterRequire !== 'Semua') {
        const reqStr = cmd.requires.toLowerCase();
        const searchReq = filterRequire.toLowerCase();
        if (searchReq === 'media') {
          // If media, match either image, video, audio, sticker or file
          if (!reqStr.includes('image') && !reqStr.includes('video') && !reqStr.includes('audio') && !reqStr.includes('sticker') && !reqStr.includes('media') && !reqStr.includes('file') && !reqStr.includes('pdf')) {
            return false;
          }
        } else if (searchReq === 'document') {
          if (!reqStr.includes('document') && !reqStr.includes('file') && !reqStr.includes('pdf')) {
            return false;
          }
        } else {
          if (!reqStr.includes(searchReq)) return false;
        }
      }

      return true;
    });
  }, [searchTerm, filterCategory, filterStatus, filterAccess, filterRequire, settings]);

  // Compute filtered Custom list
  const filteredCustom = useMemo(() => {
    return commands.filter(cmd => {
      const matchSearch = !searchTerm || 
        cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.responseText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cmd.aliases && cmd.aliases.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterCategory !== 'Semua' && cmd.category !== filterCategory) return false;

      if (filterStatus !== 'Semua') {
        const isAct = cmd.status === 'active';
        if (filterStatus === 'Aktif' && !isAct) return false;
        if (filterStatus === 'Nonaktif' && isAct) return false;
      }

      if (filterAccess !== 'Semua' && cmd.access.toLowerCase() !== filterAccess.toLowerCase()) return false;

      return true;
    });
  }, [commands, searchTerm, filterCategory, filterStatus, filterAccess]);

  const toggleCustomStatusCommand = async (id: string) => {
    const updated = commands.map(cmd => {
      if (cmd.id === id) {
        return {
          ...cmd,
          status: (cmd.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive'
        };
      }
      return cmd;
    });
    await saveAllCustomCommands(updated);
  };

  const handleCustomDeleteClick = async (id: string) => {
    if (deleteConfirmId === id) {
      const updated = commands.filter(cmd => cmd.id !== id);
      await saveAllCustomCommands(updated);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
    }
  };

  const openCustomModal = (cmd: CustomCommand | null = null) => {
    setEditingCommand(cmd);
    setErrorMsg(null);
    if (cmd) {
      setFormCommand(cmd.command);
      setFormAliases(cmd.aliases || '');
      setFormCategory(cmd.category || 'AI & Language');
      setFormResponseType(cmd.responseType || 'text');
      setFormResponseText(cmd.responseText || '');
      setFormStatus(cmd.status || 'active');
      setFormAccess(cmd.access || 'everyone');
      setFormMediaUrl(cmd.mediaUrl || '');
    } else {
      setFormCommand('');
      setFormAliases('');
      setFormCategory('AI & Language');
      setFormResponseType('text');
      setFormResponseText('');
      setFormStatus('active');
      setFormAccess('everyone');
      setFormMediaUrl('');
    }
    setIsModalOpen(true);
  };

  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCommand = formCommand.trim().replace(/\s+/g, '');
    const cleanAliases = formAliases.trim();
    const cleanCategory = formCategory;
    const cleanResponseText = formResponseText.trim();
    const cleanMediaUrl = formMediaUrl.trim();

    if (!cleanCommand) {
      setErrorMsg('Pemicu utama perintah wajib diisi!');
      return;
    }

    let finalCommand = cleanCommand;
    // ensure command has standard symbol trigger if custom, or let user set it, but we enforce slash/exclam/period or normal triggers
    if (!/^[/\.!#a-zA-Z0-9_-]/i.test(finalCommand)) {
      setErrorMsg('Pemicu perintah utama harus dimulai dengan karakter sah (huruf, angka, /, !, ., #).');
      return;
    }

    if (finalCommand.length > 40) {
      setErrorMsg('Pemicu perintah terlalu panjang! Maksimal 40 karakter.');
      return;
    }

    if (!cleanResponseText && formResponseType === 'text') {
      setErrorMsg('Respon tulisan utama tidak boleh kosong jika memilih tipe teks.');
      return;
    }

    // Check duplicate commands against standard builtin trigger to prevent collision
    const isCollisionWithBuiltIn = BUILTIN_COMMANDS.some(b => 
      b.command.toLowerCase() === finalCommand.toLowerCase() ||
      (b.aliases && b.aliases.some(al => al.toLowerCase() === finalCommand.toLowerCase()))
    );

    if (isCollisionWithBuiltIn) {
      setErrorMsg(`Trigger "${finalCommand}" conflicts with a FanraBot built-in command.`);
      return;
    }

    // Check duplicate custom triggers
    const isDuplicateCustom = commands.some(c => 
      c.command.toLowerCase() === finalCommand.toLowerCase() && 
      (!editingCommand || c.id !== editingCommand.id)
    );

    if (isDuplicateCustom) {
      setErrorMsg(`Pemicu "${finalCommand}" sudah terdaftar pada custom command lain.`);
      return;
    }

    if (isSaving) return;
    setIsSaving(true);
    let updated: CustomCommand[];

    const finalObj: CustomCommand = {
      id: editingCommand ? editingCommand.id : Date.now().toString() + Math.floor(Math.random() * 100).toString(),
      command: finalCommand,
      aliases: cleanAliases,
      category: cleanCategory,
      responseType: formResponseType,
      responseText: cleanResponseText,
      status: formStatus,
      access: formAccess,
      mediaUrl: cleanMediaUrl,
      // map to name/response for backend backwards-compatibility
      name: finalCommand,
      response: cleanResponseText
    };

    if (editingCommand) {
      updated = commands.map(cmd => cmd.id === editingCommand.id ? finalObj : cmd);
    } else {
      updated = [...commands, finalObj];
    }

    try {
      await saveAllCustomCommands(updated);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mengamankan berkas perintah kustom.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyCommandText = (cmdText: string) => {
    navigator.clipboard.writeText(cmdText);
    setCopiedCommand(cmdText);
    setTimeout(() => {
      setCopiedCommand(null);
    }, 2000);
  };

  if (isLoading && commands.length === 0) {
    return <LoadingView message="Sinkronisasi Pusat Perintah..." />;
  }

  return (
    <div id="bot-commands-root" className="space-y-6 max-w-6xl mx-auto pb-20 px-4 md:px-0">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-slate-700 tracking-tight flex items-center gap-2">
            Perintah Bot <span className="text-xs text-slate-400 font-normal">({commands.length + BUILTIN_COMMANDS.length})</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            FanraBot WhatsApp Command Management Center.
          </p>
        </div>
        
        {activeTab === 'custom' && (
          <div className="flex shrink-0">
            <button 
              id="btn-create-command"
              onClick={() => openCustomModal(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Custom
            </button>
          </div>
        )}
      </div>

      {/* Main Tabs Layout & Minimalist Search/Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Tabs */}
        <div className="w-full md:w-auto bg-slate-50 border border-slate-100 p-1 rounded-xl flex items-center select-none">
          <button 
            id="tab-btn-builtin"
            onClick={() => setActiveTab('builtin')}
            className={cn(
              "flex-1 md:flex-none px-6 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
              activeTab === 'builtin' 
                ? "bg-white text-slate-800 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-700 border border-transparent"
            )}
          >
            Built-in ({BUILTIN_COMMANDS.length})
          </button>
          <button 
            id="tab-btn-custom"
            onClick={() => setActiveTab('custom')}
            className={cn(
              "flex-1 md:flex-none px-6 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
              activeTab === 'custom' 
                ? "bg-white text-slate-800 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-700 border border-transparent"
            )}
          >
            Custom ({commands.length})
          </button>
        </div>
        
        {/* Search & Filter */}
        <div className="w-full md:w-auto flex items-center gap-2 relative">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              id="filter-search-input"
              type="text" 
              placeholder="Cari command..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-300 transition-colors"
            />
          </div>
          
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "p-2 bg-white border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-slate-500 relative",
              isFilterOpen ? "border-slate-300 bg-slate-50" : "border-slate-200"
            )}
            title="Filter"
          >
            <Filter className="w-4 h-4" />
            {(filterCategory !== 'Semua' || filterStatus !== 'Semua' || filterAccess !== 'Semua' || filterRequire !== 'Semua') && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            )}
          </button>

          {/* Popover Filter (Positioned absolute) */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-[280px] bg-white border border-slate-100 shadow-lg rounded-xl p-4 z-50 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-700">Filter</span>
                  <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Category Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500">Kategori</label>
                  <select 
                    id="filter-category-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border-none rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
                  >
                    {CATEGORY_LIST.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500">Status Fitur</label>
                  <select 
                    id="filter-status-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border-none rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
                  >
                    {STATUS_LIST.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Access Rights Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500">Akses</label>
                  <select 
                    id="filter-access-select"
                    value={filterAccess}
                    onChange={(e) => setFilterAccess(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border-none rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
                  >
                    {ACCESS_LIST.map(acc => (
                      <option key={acc} value={acc}>{acc === 'Semua' ? 'Semua' : acc === 'everyone' ? 'Semua Orang' : acc}</option>
                    ))}
                  </select>
                </div>

                {/* Requirements Filter - ONLY for Built-in Tab */}
                {activeTab === 'builtin' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500">Persyaratan</label>
                    <select 
                      id="filter-require-select"
                      value={filterRequire}
                      onChange={(e) => setFilterRequire(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border-none rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
                    >
                      {REQUIRE_LIST.map(req => (
                        <option key={req} value={req}>{req}</option>
                      ))}
                    </select>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RENDER TAB 1: BUILT-IN COMMANDS */}
      {activeTab === 'builtin' && (
        <>
          {filteredBuiltin.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-xl p-16 text-center space-y-4">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-slate-700 text-sm">Tidak ada perintah ditemukan</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">Silakan ubah kata kunci atau filter pencarian.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBuiltin.map((cmd) => {
                const active = isParentEnabled(cmd);
                const isHybrid = !!cmd.naturalExamples;
                
                return (
                  <div 
                    key={cmd.id} 
                    id={`builtin-card-${cmd.id}`}
                    className={cn(
                      "bg-[#FAFAFA] border rounded-xl p-4 space-y-3 flex flex-col justify-between transition-colors",
                      active ? "border-slate-200 hover:border-slate-300" : "border-slate-100 opacity-70"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-slate-700 leading-tight">
                          {cmd.title}
                        </h3>
                        {/* Status Label */}
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[10px] whitespace-nowrap",
                          active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {active ? 'Aktif' : 'Nonaktif'}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {cmd.description}
                      </p>

                      {/* Type Label */}
                      <div className="pt-1">
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] rounded-md font-medium inline-block",
                          isHybrid ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {isHybrid ? "Hybrid" : "Command"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        id={`btn-detail-builtin-${cmd.id}`}
                        onClick={() => setDetailedCommand({ ...cmd, isHybrid })}
                        className="w-full py-1.5 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-600 border border-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat Detail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* RENDER TAB 2: CUSTOM COMMANDS */}
      {activeTab === 'custom' && (
        <>
          {filteredCustom.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-xl p-16 text-center space-y-4">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-slate-700 text-sm">Tidak ada perintah custom ditemukan</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">Tekan tombol 'Tambah Custom' untuk membuat perintah.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredCustom.map((cmd) => (
                <div 
                  key={cmd.id} 
                  id={`custom-card-${cmd.id}`}
                  className={cn(
                    "bg-[#FAFAFA] border rounded-xl p-4 space-y-3 flex flex-col justify-between transition-colors",
                    cmd.status === 'inactive' ? "opacity-75 border-slate-100" : "border-slate-200"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-semibold text-sm text-slate-700 leading-tight truncate">
                          {cmd.command}
                        </h3>
                      </div>

                      {/* Interactive toggle block */}
                      <button 
                        id={`btn-toggle-custom-${cmd.id}`}
                        onClick={() => toggleCustomStatusCommand(cmd.id)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors border cursor-pointer",
                          cmd.status === 'active' 
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        {cmd.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {cmd.responseText || `[Response ${cmd.responseType}]`}
                    </p>

                    {/* Badge */}
                    <div className="pt-1">
                       <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-md font-medium inline-block">
                         Custom Command
                       </span>
                    </div>
                  </div>

                  {/* Actions toolbars */}
                  <div className="flex items-center justify-between pt-2">
                    <button 
                      id={`btn-edit-custom-${cmd.id}`}
                      onClick={() => openCustomModal(cmd)}
                      className="p-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      id={`btn-delete-custom-${cmd.id}`}
                      onClick={() => handleCustomDeleteClick(cmd.id)}
                      onMouseLeave={() => setDeleteConfirmId(null)}
                      className={cn(
                        "p-1.5 px-3 text-[11px] font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-colors border",
                        deleteConfirmId === cmd.id 
                          ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                          : "bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 border-slate-200 hover:border-red-100"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {deleteConfirmId === cmd.id ? 'Yakin?' : 'Hapus'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* BUILT-IN COMMAND DETAIL MODAL / DRAWER */}
      <AnimatePresence>
        {detailedCommand && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[200]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-sm text-slate-800">
                    Detail {detailedCommand.title}
                  </h3>
                </div>
                <button 
                  id="btn-close-builtin-detail"
                  onClick={() => setDetailedCommand(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* Main command & Status */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded border select-none",
                      isParentEnabled(detailedCommand)
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {isParentEnabled(detailedCommand) ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="font-mono text-base font-semibold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit select-all">
                    {detailedCommand.command}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {detailedCommand.description}
                  </p>
                </div>

                {/* Aliases */}
                {detailedCommand.aliases && detailedCommand.aliases.length > 0 && (
                  <div>
                    <h4 className="text-[10px] text-slate-500 mb-1.5">Alias / Sinonim</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {detailedCommand.aliases.map(al => (
                        <span key={al} className="font-mono text-xs px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 rounded select-all">
                          {al}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata Row */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Tingkat Akses</span>
                    <span className="font-medium text-slate-700">
                      {detailedCommand.access === 'everyone' ? 'Semua Orang' : detailedCommand.access}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Berkas / Media</span>
                    <span className="font-medium text-slate-700">
                      {detailedCommand.requires}
                    </span>
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h4 className="text-[10px] text-slate-500 mb-1.5">Contoh Command Langsung</h4>
                  <div className="space-y-1.5">
                    {detailedCommand.examples.map(ex => (
                      <div key={ex} className="p-2 bg-slate-50 border border-slate-100 rounded-lg font-mono text-xs text-slate-600 select-all leading-tight">
                        {ex}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Natural Examples */}
                {detailedCommand.naturalExamples && (
                  <div>
                    <h4 className="text-[10px] text-slate-500 mb-1.5">Bahasa Alami (Hybrid AI)</h4>
                    <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg text-xs text-purple-800 italic font-medium leading-relaxed">
                      "{detailedCommand.naturalExamples}"
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0 select-none">
                <button 
                  id="btn-copy-modal-builtin"
                  onClick={() => copyCommandText(detailedCommand.command)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copiedCommand === detailedCommand.command ? (
                    <><Check className="w-3.5 h-3.5 text-green-500" /> Tersalin</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5 text-slate-400" /> Salin Command</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM COMMAND CREATOR / EDITOR MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[200] overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl p-5 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-sm text-slate-800">
                    {editingCommand ? 'Edit Perintah Custom' : 'Tambah Perintah Custom'}
                  </h3>
                </div>
                <button 
                  id="btn-close-custom-modal"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-fadeIn shrink-0">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveCustom} className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Command Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Pemicu Utama (Command)*</label>
                    <input 
                      id="form-command-input"
                      type="text" 
                      placeholder="Contoh: /harga atau !diskon" 
                      value={formCommand}
                      onChange={(e) => {
                        // Space-trimmed, custom triggers
                        setFormCommand(e.target.value.replace(/\s+/g, '').slice(0, 40));
                        setErrorMsg(null);
                      }}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none tracking-wide focus:ring-1 focus:ring-primary/10 transition-all font-mono"
                    />
                    <p className="text-[9px] text-slate-400 pl-1 font-medium">Diawali alfabet, angka, / , ! atau pembatas lainnya.</p>
                  </div>

                  {/* Aliases */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 ml-1">Alias (Opsional)</label>
                    <input 
                      id="form-aliases-input"
                      type="text" 
                      placeholder="Pisahkan koma, contoh: /price,!tagihan" 
                      value={formAliases}
                      onChange={(e) => {
                        setFormAliases(e.target.value.slice(0, 100));
                        setErrorMsg(null);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-300 transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 ml-1">Kategori Perintah</label>
                    <select 
                      id="form-category-select"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none cursor-pointer"
                    >
                      {CATEGORY_LIST.filter(cat => cat !== 'Semua').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="General">General</option>
                    </select>
                  </div>

                  {/* Access Level */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 ml-1">Hak Akses</label>
                    <select 
                      id="form-access-select"
                      value={formAccess}
                      onChange={(e: any) => setFormAccess(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none cursor-pointer"
                    >
                      <option value="everyone">Semua Orang</option>
                      <option value="admin">Hanya Admin Grup</option>
                      <option value="owner">Hanya Pemilik Bot</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Response Type Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 ml-1">Jenis Repon</label>
                    <select 
                      id="form-responsetype-select"
                      value={formResponseType}
                      onChange={(e: any) => setFormResponseType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none cursor-pointer"
                    >
                      <option value="text">Teks Normal</option>
                      <option value="image">Gambar / Foto</option>
                      <option value="video">Format Video</option>
                      <option value="audio">Format Audio / Suara</option>
                      <option value="sticker">Stiker WhatsApp</option>
                      <option value="document">Dokumen / PDF File</option>
                    </select>
                  </div>

                  {/* Status Toggle */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 ml-1">Status Awal</label>
                    <select 
                      id="form-status-select"
                      value={formStatus}
                      onChange={(e: any) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none cursor-pointer"
                    >
                      <option value="active">Active (Menyala)</option>
                      <option value="inactive">Inactive (Mati)</option>
                    </select>
                  </div>
                </div>

                {/* Media URL (Conditionally shown) */}
                {formResponseType !== 'text' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="text-[10px] text-slate-500 ml-1">Media-URL Tautan</label>
                    <input 
                      id="form-mediaurl-input"
                      type="url" 
                      placeholder="https://images.com/sample.jpg" 
                      value={formMediaUrl}
                      onChange={(e) => setFormMediaUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-300 transition-colors font-mono"
                    />
                  </div>
                )}

                {/* Response Text Area */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] text-slate-500">Pesan Balasan</label>
                    <span className="text-[9px] text-slate-400">{formResponseText.length}/1000</span>
                  </div>
                  <textarea 
                    id="form-responsetext-textarea"
                    rows={4}
                    placeholder="Masukkan teks balasan otomatis..." 
                    value={formResponseText}
                    onChange={(e) => {
                      setFormResponseText(e.target.value.slice(0, 1000));
                      setErrorMsg(null);
                    }}
                    required={formResponseType === 'text'}
                    maxLength={1000}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-300 transition-colors leading-relaxed resize-y"
                  />
                </div>

                {/* Actions row */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    id="btn-form-cancel"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    id="btn-form-submit"
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
