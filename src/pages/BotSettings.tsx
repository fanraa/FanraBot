import React, { useState, useEffect } from 'react';
import { 
  User, 
  Terminal, 
  Save,
  Hash,
  Loader2,
  CheckCircle2,
  Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LoadingView } from '../components/LoadingView';

// Boxy but slightly rounded CustomToggle (rounded-md/rounded-sm)
const CustomToggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
  <button 
    type="button"
    onClick={onToggle}
    className={cn(
      "w-10 h-5 rounded-md transition-all relative p-1 shrink-0 cursor-pointer",
      active ? "bg-primary" : "bg-outline/30"
    )}
  >
    <div className={cn(
      "w-3 h-3 rounded-sm bg-white transition-all shadow-sm",
      active ? "translate-x-5" : "translate-x-0"
    )} />
  </button>
);

export default function BotSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Default values
  const DEFAULTS = {
    botName: "FanraBot Assistant",
    languageStyle: "casual",
    autoReply: true,
    groupReply: false,
    privateReply: true,
    blockedNumbers: "",
    aiMemory: true,
    typingEffect: true,
    ownerNumber: "628123456789",
    excludeKeywords: "promo, diskon, stop",
    commandPrefix: "/",
    botTemperament: "ramah",
    defaultLanguage: "en",
    errorDelayMinutes: 5
  };

  // States
  const [botName, setBotName] = useState("FanraBot");
  const [languageStyle, setLanguageStyle] = useState("casual");
  const [autoReply, setAutoReply] = useState(DEFAULTS.autoReply);
  const [groupReply, setGroupReply] = useState(DEFAULTS.groupReply);
  const [privateReply, setPrivateReply] = useState(DEFAULTS.privateReply);
  const [blockedNumbers, setBlockedNumbers] = useState(DEFAULTS.blockedNumbers);
  const [aiMemory, setAiMemory] = useState(DEFAULTS.aiMemory);
  const [typingEffect, setTypingEffect] = useState(DEFAULTS.typingEffect);
  const [ownerNumber, setOwnerNumber] = useState(DEFAULTS.ownerNumber);
  const [excludeKeywords, setExcludeKeywords] = useState(DEFAULTS.excludeKeywords);
  const [commandPrefix, setCommandPrefix] = useState(DEFAULTS.commandPrefix);
  const [botTemperament, setBotTemperament] = useState("fanra");
  const [defaultLanguage, setDefaultLanguage] = useState(DEFAULTS.defaultLanguage);
  const [errorDelayMinutes, setErrorDelayMinutes] = useState(DEFAULTS.errorDelayMinutes);

  // Menu Preview Settings States
  const [menuBannerUrl, setMenuBannerUrl] = useState("");
  const [menuSourceUrl, setMenuSourceUrl] = useState("");
  const [menuTitle, setMenuTitle] = useState("FanraBot Menu");
  const [menuDescription, setMenuDescription] = useState("Smart WhatsApp Assistant");

  useEffect(() => {
    if (botTemperament === 'fanra') {
      setLanguageStyle('casual');
    } else {
      setLanguageStyle('formal');
    }
  }, [botTemperament]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || {};
        
        setBotName("FanraBot"); // Always locked to FanraBot
        
        let savedStyle = settings.languageStyle || "casual";
        setLanguageStyle(savedStyle);

        setAutoReply(settings.hasOwnProperty('autoReply') ? settings.autoReply : DEFAULTS.autoReply);
        setGroupReply(settings.hasOwnProperty('groupReply') ? settings.groupReply : DEFAULTS.groupReply);
        setPrivateReply(settings.hasOwnProperty('privateReply') ? settings.privateReply : DEFAULTS.privateReply);
        setBlockedNumbers(settings.blockedNumbers || DEFAULTS.blockedNumbers);
        setAiMemory(settings.hasOwnProperty('aiMemory') ? settings.aiMemory : DEFAULTS.aiMemory);
        setTypingEffect(settings.hasOwnProperty('typingEffect') ? settings.typingEffect : DEFAULTS.typingEffect);
        setOwnerNumber(settings.ownerNumber || DEFAULTS.ownerNumber);
        setExcludeKeywords(settings.excludeKeywords || DEFAULTS.excludeKeywords);
        setCommandPrefix(settings.commandPrefix || DEFAULTS.commandPrefix);
        
        // Normalize botTemperament to either normal or fanra
        let temp = settings.botTemperament || "fanra";
        if (temp !== "fanra") {
          temp = "normal";
        }
        setBotTemperament(temp);
        
        setDefaultLanguage(settings.defaultLanguage || DEFAULTS.defaultLanguage);
        setErrorDelayMinutes(settings.hasOwnProperty('errorDelayMinutes') ? parseInt(settings.errorDelayMinutes, 10) : DEFAULTS.errorDelayMinutes);

        const mp = data.menuPreview || {};
        setMenuBannerUrl(mp.bannerUrl || "");
        setMenuSourceUrl(mp.sourceUrl || "");
        setMenuTitle(mp.title || "FanraBot Menu");
        setMenuDescription(mp.description || "Smart WhatsApp Assistant");
      }
    } catch (err) {
      console.error('Error fetching configuration:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep handlers for compatibility but locked values
  const handleBotNameChange = (val: string) => {
    // Locked to FanraBot
    setBotName("FanraBot");
  };

  const handleOwnerNumberChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '').substring(0, 15);
    setOwnerNumber(clean);
  };

  const handleBlockedNumbersChange = (val: string) => {
    const clean = val.replace(/[^0-9,\s]/g, '').substring(0, 200);
    setBlockedNumbers(clean);
  };

  const handleCommandPrefixChange = (val: string) => {
    const clean = val.replace(/[a-zA-Z0-9\s]/g, '').substring(0, 2);
    setCommandPrefix(clean);
  };

  const handleErrorDelayMinutesChange = (val: string) => {
    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
    setErrorDelayMinutes(isNaN(parsed) ? 1 : Math.max(1, Math.min(parsed, 1440)));
  };

  const handleExcludeKeywordsChange = (val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9,\s\-]/g, '').substring(0, 150);
    setExcludeKeywords(clean);
  };

  const handleSave = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const resGet = await fetch('/api/whatsapp/config');
      const currentConfig = resGet.ok ? await resGet.json() : {};
      const oldSettings = currentConfig.settings || {};

      // Merge perfectly with current settings to prevent resetting anti-link & anti-badwords features
      const updatedSettings = {
        ...oldSettings,
        botName: botName.trim(),
        languageStyle,
        autoReply,
        groupReply,
        privateReply,
        blockedNumbers: blockedNumbers.trim(),
        aiMemory,
        typingEffect,
        ownerNumber: ownerNumber.trim(),
        excludeKeywords: excludeKeywords.trim(),
        commandPrefix: commandPrefix.trim(),
        botTemperament,
        defaultLanguage,
        errorDelayMinutes: Number(errorDelayMinutes)
      };

      const newConfig = {
        ...currentConfig,
        settings: updatedSettings,
        menuPreview: {
          bannerUrl: menuBannerUrl.trim(),
          sourceUrl: menuSourceUrl.trim(),
          title: menuTitle.trim(),
          description: menuDescription.trim()
        }
      };

      const resPost = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });

      if (resPost.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Gagal menyimpan setelan bot ke server.');
      }
    } catch (err) {
      console.error('Error saving config settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingView message="Memuat setelan bot..." />;
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto pb-24 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-on-surface">Penyetelan Bot</h1>
          <p className="text-xs md:text-sm text-on-surface-muted opacity-80">Konfigurasi variabel kepribadian AI dan aturan respon server Baileys Anda.</p>
        </div>
        <div>
          <button 
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary/95 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Setelan
          </button>
        </div>
      </div>

      <AnimatePresence>
        {saveSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 border border-green-200 text-green-900 rounded-md text-xs font-normal flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Setelan bot berhasil diupdate & diaktifkan di server WhatsApp Baileys!
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TOP SECTION: Two boxes with exactly identical height on desktop (flex-stretch) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* BOX 1: Identitas & Kepribadian Bot */}
          <div className="bg-white border border-outline rounded-lg p-6 md:p-8 space-y-6 shadow-sm flex flex-col justify-start">
            <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2 border-b border-outline/30 pb-3">
              <User className="w-5 h-5 text-primary" /> Identitas & Kepribadian Bot
            </h3>

            <div className="space-y-5">
              {/* Permanent FanraBot Avatar */}
              <div className="flex items-center gap-4 border-b border-outline/20 pb-4 mb-2">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-outline bg-surface-muted flex items-center justify-center shadow-inner shrink-0">
                  <img 
                    src="https://res.cloudinary.com/dew39kqhy/image/upload/v1780652500/ChatGPT_Image_5_Jun_2026_16.39.34_w0d124.png"
                    alt="FanraBot Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">FanraBot Profile</h4>
                  <p className="text-[10px] text-on-surface-muted">Avatar & identitas bot bersifat permanen</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Nama Tampilan Bot</label>
                <input 
                  type="text" 
                  value="FanraBot"
                  disabled
                  placeholder="FanraBot"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-semibold text-on-surface/70 outline-none cursor-not-allowed opacity-80"
                  required
                />
                <p className="text-[10px] text-on-surface-muted ml-1">Nama identitas bot terkunci secara permanen sebagai <strong>FanraBot</strong>.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Sifat / Kepribadian Bot</label>
                <select 
                  value={botTemperament}
                  onChange={(e) => setBotTemperament(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-normal outline-none focus:border-primary/60 cursor-pointer"
                >
                  <option value="normal">Normal</option>
                  <option value="fanra">Fanra</option>
                </select>
                <p className="text-[10px] text-on-surface-muted ml-1">
                  {botTemperament === "fanra" 
                    ? "Fanra: Santai, akrab, dan mengikuti gaya Fanra." 
                    : "Normal: Sopan, singkat, jelas, dan natural."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Bahasa Utama</label>
                <select 
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-normal outline-none focus:border-primary/60 cursor-pointer"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">Bahasa Inggris (English)</option>
                </select>
              </div>
            </div>
          </div>

          {/* BOX 2: Pengaturan Respon */}
          <div className="bg-white border border-outline rounded-lg p-6 md:p-8 space-y-6 shadow-sm flex flex-col justify-start">
            <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2 border-b border-outline/30 pb-3">
              <Terminal className="w-5 h-5 text-primary" /> Pengaturan Respon
            </h3>

            <div className="divide-y divide-outline/25 space-y-4">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h4 className="text-xs font-semibold text-on-surface">Auto-Reply Aktif</h4>
                  <p className="text-[10px] text-on-surface-muted">Balas otomatis pesan masuk secara cerdas</p>
                </div>
                <CustomToggle active={autoReply} onToggle={() => setAutoReply(!autoReply)} />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-xs font-semibold text-on-surface">Respon Chat Pribadi</h4>
                  <p className="text-[10px] text-on-surface-muted">Balas otomatis pesan pribadi (1-on-1)</p>
                </div>
                <CustomToggle active={privateReply} onToggle={() => setPrivateReply(!privateReply)} />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-xs font-semibold text-on-surface">Respon di Grup</h4>
                  <p className="text-[10px] text-on-surface-muted">Respon pesan dari grup-grup WA yang diikuti</p>
                </div>
                <CustomToggle active={groupReply} onToggle={() => setGroupReply(!groupReply)} />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-xs font-semibold text-on-surface">Ingatan Percakapan</h4>
                  <p className="text-[10px] text-on-surface-muted">Aktifkan memori riwayat chat AI (kontekstual)</p>
                </div>
                <CustomToggle active={aiMemory} onToggle={() => setAiMemory(!aiMemory)} />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-xs font-semibold text-on-surface">Efek Mengetik</h4>
                  <p className="text-[10px] text-on-surface-muted">Simulasikan status 'sedang mengetik' di WhatsApp</p>
                </div>
                <CustomToggle active={typingEffect} onToggle={() => setTypingEffect(!typingEffect)} />
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: PARAMETER TEKNIS (FULL WIDTH) */}
        <div className="bg-white border border-outline rounded-lg p-6 md:p-8 space-y-5 shadow-sm w-full">
          <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2 border-b border-outline/30 pb-3">
            <Hash className="w-5 h-5 text-primary" /> Parameter Teknis Keamanan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Nomor Owner HP Admin</label>
                <input 
                  type="text" 
                  value={ownerNumber}
                  onChange={(e) => handleOwnerNumberChange(e.target.value)}
                  placeholder="Contoh: 628123456789"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-normal outline-none font-mono focus:border-primary/60"
                  required
                />
                <p className="text-[10px] text-on-surface-muted ml-1">Hanya angka. Nomor ini memiliki kendali penuh command admin.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Awalan Perintah (Prefix Command)</label>
                <input 
                  type="text" 
                  value={commandPrefix}
                  onChange={(e) => handleCommandPrefixChange(e.target.value)}
                  placeholder="Contoh: / atau !"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-semibold outline-none font-mono text-center focus:border-primary/60"
                  maxLength={2}
                  required
                />
                <p className="text-[10px] text-on-surface-muted ml-1">Maksimal 2 simbol khusus (tanpa huruf/angka/spasi).</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Delay Respon Error AI (Menit)</label>
                <input 
                  type="number" 
                  value={errorDelayMinutes}
                  onChange={(e) => handleErrorDelayMinutesChange(e.target.value)}
                  placeholder="Contoh: 5"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-semibold outline-none font-mono focus:border-primary/60"
                  min={1}
                  max={1440}
                  required
                />
                <p className="text-[10px] text-on-surface-muted ml-1">Maksimal jeda pesan "wait.." agar tidak terkirim berkali-kali saat AI eror.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Daftar Nomor Terblokir (Ignore List)</label>
                <input 
                  type="text" 
                  value={blockedNumbers}
                  onChange={(e) => handleBlockedNumbersChange(e.target.value)}
                  placeholder="Contoh: 6289999999, 6281111111"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-normal outline-none font-mono focus:border-primary/60"
                />
                <p className="text-[10px] text-on-surface-muted ml-1">Nomor terdaftar tidak akan pernah dibalas oleh AI. Pisahkan dengan tanda koma.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Kata Kunci Abaikan (Batal Balas)</label>
                <input 
                  type="text" 
                  value={excludeKeywords}
                  onChange={(e) => handleExcludeKeywordsChange(e.target.value)}
                  placeholder="Contoh: stop, promo, spam"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-normal outline-none focus:border-primary/60"
                />
                <p className="text-[10px] text-on-surface-muted ml-1 font-normal">Pesan yang mengandung kata kunci ini diabaikan otomatis. Pisahkan dengan tanda koma.</p>
              </div>
            </div>
          </div>
        </div>

        {/* NEW BOX: MENU PREVIEW SETTINGS */}
        <div id="menu-preview-settings-card" className="bg-white border border-outline rounded-lg p-6 md:p-8 space-y-5 shadow-sm w-full">
          <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2 border-b border-outline/30 pb-3">
            <Image className="w-5 h-5 text-primary" /> Menu Preview Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Menu Banner Image URL</label>
                <input 
                  type="url" 
                  value={menuBannerUrl}
                  onChange={(e) => setMenuBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-normal outline-none focus:border-primary/60"
                />
                <p className="text-[10px] text-on-surface-muted ml-1">Harus diawali http:// atau https://. Digunakan sebagai gambar banner di atas command /menu.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Menu Click URL / Source URL</label>
                <input 
                  type="url" 
                  value={menuSourceUrl}
                  onChange={(e) => setMenuSourceUrl(e.target.value)}
                  placeholder="https://your-dashboard.com"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-normal outline-none focus:border-primary/60"
                />
                <p className="text-[10px] text-on-surface-muted ml-1 font-normal">Harus diawali http:// atau https://. Link yang akan dibuka saat banner menu diklik.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Menu Title</label>
                <input 
                  type="text" 
                  value={menuTitle}
                  onChange={(e) => setMenuTitle(e.target.value)}
                  placeholder="FanraBot Menu"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-normal outline-none focus:border-primary/60"
                />
                <p className="text-[10px] text-on-surface-muted ml-1">Judul yang akan tampil pada banner externalAdReply.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-muted font-medium ml-1">Menu Description</label>
                <input 
                  type="text" 
                  value={menuDescription}
                  onChange={(e) => setMenuDescription(e.target.value)}
                  placeholder="Smart WhatsApp Assistant"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-outline rounded-md text-xs font-normal outline-none focus:border-primary/60"
                />
                <p className="text-[10px] text-on-surface-muted ml-1">Deskripsi singkat di bawah judul banner.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
