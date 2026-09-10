# FanraBot UI Design System & Component Guidelines

Dokumen ini berisi spesifikasi desain visual, skema warna, tipografi, serta pola container (kotak/box) yang digunakan di dalam aplikasi FanraBot. Dokumen ini ditujukan sebagai referensi utama bagi AI Assistant agar dapat mereplikasi estetika antarmuka FanraBot secara konsisten dan presisi.

---

## 🎨 1. Skema Warna (Color System)
FanraBot menggunakan tema **Clean Light Mode** yang profesional, hangat, serta memiliki kontras tinggi untuk kenyamanan membaca.

| Token CSS | Kode Warna | Deskripsi / Penggunaan |
| :--- | :--- | :--- |
| `primary` | `#2563eb` | Warna aksen utama (biru terang), link, button utama, info aktif |
| `secondary` | `#5c5f60` | Warna teks tambahan / pendukung |
| `tertiary` | `#4e5566` | Elemen dekoratif minor |
| `background` | `#f9f9ff` | Latar belakang halaman dashboard utama (sangat bersih dengan bias biru sangat tipis) |
| `surface` | `#ffffff` | Latar belakang card, dropdown, dan container utama |
| `surface-subtle` | `#f9fafb` | Latar belakang tombol pudar, container dinamis ringan |
| `surface-muted` | `#f3f4f6` | Hover state untuk menu, bagian non-interaktif |
| `on-surface` | `#111827` | Warna teks utama (hitam arang pekat) |
| `outline` | `#e5e7eb` | Garis batas tipis default (border-light) |
| `outline-variant` | `#d1d5db` | Garis batas beraksen, input border default |

---

## ✍️ 2. Tipografi (Typography Match)
Aplikasi memadukan dua font khusus Google Fonts yang memberikan nuansa modern dan tech-forward:

1. **Brand Headings (`Outfit`)**:
   - Digunakan untuk Heading utama, judul modul besar, dan pancingan visual (branding).
   - *Kombinasi*: `font-brand font-semibold text-on-surface` atau `font-bold text-2xl`.
2. **General UI & Body (`Geist` / `Inter` fallback)**:
   - Digunakan untuk teks kontrol, parameter, deskripsi, dan elemen operasional.
   - *Kombinasi*: `font-sans text-xs md:text-sm text-on-surface-muted`.
3. **Data & Logs Code (`JetBrains Mono` / `Fira Code` fallback)**:
   - Digunakan khusus di logs diagnostic, nomor index, dan format waktu/metrik.
   - *Kombinasi*: `font-mono text-[11px] leading-relaxed`.

---

## 📦 3. Desain Kotak & Bento Grid (Card/Box Blueprint)
Ciri khas estetika "kotak-kotak" FanraBot memiliki struktur minimalis, presisi, bersudut halus (rounded), dan menggunakan outline super tipis tanpa bayangan yang berisik (no heavy shadow slop).

### A. Struktur Grid Parameter (Bento Cards - 4 Kolom)
Tampilan 4 kotak simetris rata yang membingkai pengaturan parameter (seperti pada modul Parameter Router).
* **Grid Layout**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch`
* **Card Element**:
  - Menggunakan latar belakang halus `bg-slate-50/50` atau `bg-surface-subtle`.
  - Border tipis `border border-outline` dengan radius sudut medium `rounded-md` (0.75rem).
  - Minimum height yang konsisten `min-h-[145px]` didukung flex layout `flex flex-col justify-between` agar elemen di dalam (judul dan kontrol) terdorong otomatis ke ujung yang seimbang.

**Template Kode Tailwind untuk Card Bento:**
```tsx
<div className="flex flex-col justify-between p-5 bg-slate-50/50 border border-outline rounded-md min-h-[145px]">
  <div>
    <h4 className="text-xs font-bold text-on-surface">Judul Parameter</h4>
    <p className="text-[10px] text-on-surface-muted mt-1.5 leading-relaxed">
      Deskripsi penjelasan parameter yang singkat, padat, dan informatif.
    </p>
  </div>
  <div className="flex justify-end mt-3 shrink-0">
    {/* Elemen Toggle Kanan Bawah */}
    <CustomToggle active={isActive} onToggle={handleToggle} />
  </div>
</div>
```

---

### B. Kotak List Item Interaktif (Row Box)
Format pembungkus item bertingkat dalam susunan baris (seperti baris AI provider, commands, dll.).
* **Outer Container**: Dibungkus di dalam card besar berlatar putih: `bg-white border border-outline rounded p-5 md:p-8 space-y-2.5 shadow-sm`.
* **Row Element**:
  - Border tipis `border border-outline rounded` (Default rounded/rounded-md).
  - Hover state halus `transition-all hover:bg-slate-50/50`.
  - Dipercantik dengan label index numerik clean tanpa background `font-mono text-xs font-bold text-slate-400 w-5`.
  - Ditambah thumbnail icon ber-shadow tipis: `border border-slate-100 p-1 bg-white rounded shadow-sm`.

**Template Kode Tailwind untuk Row Box:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white border border-outline rounded gap-3 sm:gap-4 transition-all hover:bg-slate-50/50">
  {/* Sisi Kiri: Index & Deskripsi */}
  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
    <div className="font-mono text-xs font-bold text-slate-400 shrink-0 select-none w-5">
      #1
    </div>
    <div className="w-8 h-8 sm:w-10 sm:h-10 border border-slate-100 p-1 flex items-center justify-center bg-white rounded shadow-sm shrink-0">
      <img src={logoUrl} className="w-5.5 h-5.5 object-contain" />
    </div>
    <div className="overflow-hidden min-w-0">
      <span className="font-bold text-xs sm:text-sm text-on-surface truncate">Nama Elemen</span>
      <p className="text-[10px] text-on-surface-muted mt-0.5 truncate">
        Deskripsi status ringkas sistem pendukung elemen.
      </p>
    </div>
  </div>
  {/* Sisi Kanan: Action Controller */}
  <div className="flex items-center gap-2">
    <button className="px-2.5 py-1 text-[10px] font-semibold border rounded bg-slate-50">
      Aksi
    </button>
  </div>
</div>
```

---

### C. Container Status Sesi Besar (Sesi WhatsApp Berhasil Terhubung)
Untuk kotak panel utama dengan efek megah dan rounded melengkung mewah:
* **Classes**: `bg-white border border-outline rounded-[2rem] p-6 md:p-8 space-y-6 shadow-sm`
* Gunakan elemen indikator denyut nadi hijau `animate-pulse` untuk menandakan aktivitas aktif.

---

## 🛠️ 4. Elemen Tambahan yang Konsisten
Agar estetika aplikasi tetap terjaga di setiap bagian, terapkan pula aturan berikut:

1. **Custom Scrollbar Kreatif & Tipis**:
   - Scrollbar tebal dinonaktifkan. Gunakan scrollbar tipis abu-abu transparan yang anggun:
     ```css
     ::-webkit-scrollbar {
       width: 6px;
       height: 6px;
     }
     ::-webkit-scrollbar-thumb {
       background: rgba(107, 114, 128, 0.15);
       border-radius: 9999px;
     }
     ::-webkit-scrollbar-thumb:hover {
       background: rgba(107, 114, 128, 0.3);
     }
     ```
2. **Pintu Masuk Terbuka (Transitions)**:
   - Hindari transisi patah-patah. Gunakan library `motion` atau properti transisi Tailwind bawaan: `transition-all duration-200 ease-out`.

---

AI Assistant yang membaca dokumen ini wajib mengikuti aturan struktur visual di atas saat membuat halaman baru maupun memodifikasi elemen kotak dekorasi di seluruh proyek FanraBot.
