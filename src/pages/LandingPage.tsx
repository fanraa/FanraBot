import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Network, 
  QrCode, 
  BarChart3, 
  ShieldCheck, 
  Cpu,
  Layers,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // If already authenticated, skip landing page and proceed to dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-background selection:bg-primary/10 overflow-x-hidden"
    >
      {/* Navigation */}
      <nav className="fixed top-0 w-full h-16 bg-white/80 backdrop-blur-md border-b border-outline z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          {/* Logo tanpa box background solid, langsung png style */}
          <img 
            src="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578024/file_0000000030647209b33b695fffe52c90_gi9rwf.png" 
            alt="FanraBot Logo" 
            className="h-9 w-auto object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <span className="text-xl font-bold tracking-tight text-[#111827] font-brand tracking-[-0.03em] select-none">FanraBot</span>
        </div>
        
        {/* Menu links disederhanakan/dihapus sesuai permintaan user */}
        
        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-sm font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/95 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg transition-all shadow-sm active:scale-95 btn-shine-effect"
          >
            Masuk
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto">
          
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-on-surface mb-6 leading-tight"
          >
            Bangun bot WhatsApp <span className="text-primary">pintar dengan AI.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-lg text-on-surface-variant mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Integrasikan berbagai provider AI (Gemini, ChatGPT, Groq) ke WhatsApp Anda dengan mudah. Otomatisasi bisnis Anda dalam hitungan menit.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/95 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-md active:scale-95 btn-shine-effect text-center text-base"
            >
              Mulai Sekarang
            </Link>
          </motion.div>

          {/* Screenshot Preview with elegant entry rise effect */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-outline border-b-0"
          >
            <img 
              src="https://images.pexels.com/photos/6019019/pexels-photo-6019019.jpeg" 
              alt="Dashboard Preview" 
              className="w-full aspect-[16/9] object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
          </motion.div>
        </div>
      </section>

      {/* Features with Staggered Scroll Reveal animation */}
      <section id="fitur" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUpVariants}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-on-surface mb-4">Fitur Utama</h2>
            <p className="text-on-surface-muted max-w-xl mx-auto">Segala yang Anda butuhkan untuk mengelola bot WhatsApp bertenaga AI dalam satu dashboard.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <FeatureCard 
              iconUrl="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578139/4_clveob.png"
              title="Obrolan AI"
              description="Balasan natural dan cerdas berdasarkan konteks percakapan menggunakan LLM modern."
            />
            <FeatureCard 
              iconUrl="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578137/7_i0lipk.png"
              title="Otomatisasi WhatsApp"
              description="Jadwal pesan, auto-reply, dan alur kerja kustom tanpa perlu stand by 24 jam."
            />
            <FeatureCard 
              iconUrl="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578151/8_hvpvsc.png"
              title="Multi Provider AI"
              description="Gunakan Gemini, Groq, OpenAI, atau Ollama Lokal sebagai otak bot Anda."
            />
            <FeatureCard 
              iconUrl="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578149/9_vvfanp.png"
              title="Koneksi QR & Pairing"
              description="Metode koneksi yang mudah dan stabil, persis seperti WhatsApp Web."
            />
            <FeatureCard 
              iconUrl="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578150/6_geeqn6.png"
              title="Analitik Bot"
              description="Pantau penggunaan token, jumlah pesan, dan performa bot secara real-time."
            />
            <FeatureCard 
              iconUrl="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578143/5_flggof.png"
              title="Keamanan Akun"
              description="Data terenkripsi dan sistem proteksi untuk menjaga nomor Anda tetap aman."
            />
          </motion.div>
        </div>
      </section>

      {/* Cara Kerja Section */}
      <section id="cara-kerja" className="py-24 px-6 md:px-12 bg-surface-subtle">
        <div className="max-w-5xl mx-auto">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUpVariants}
            className="text-3xl font-bold text-on-surface text-center mb-16"
          >
            Tiga Langkah Mudah
          </motion.h2>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Step number="1" title="Masukan API Key" description="Hubungkan provider AI favorit Anda (misalnya Gemini) dengan memasukan API Key ke dashboard." />
            <Step number="2" title="Scan QR Code" description="Hubungkan nomor WhatsApp Anda dengan memindai kode QR yang muncul di dashboard FanraBot." />
            <Step number="3" title="Atur Persona & Aktifkan" description="Tentukan kepribadian bot Anda, atur prompt sistem, dan bot siap melayani pelanggan Anda." />
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUpVariants}
            className="text-3xl font-bold text-center mb-16"
          >
            Pertanyaan Umum
          </motion.h2>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="space-y-4"
          >
            <FAQItem 
              question="Apakah aman untuk nomor WhatsApp saya?" 
              answer="Ya, kami menggunakan sistem yang dirancang untuk mengikuti batas normal penggunaan WhatsApp agar nomor Anda terhindar dari pemblokiran." 
              isOpen={openFaqIndex === 0}
              onToggle={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}
            />
            <FAQItem 
              question="Provider AI apa saja yang didukung?" 
              answer="Saat ini kami mendukung Google Gemini, OpenAI, Claude, Groq, OpenRouter, dan instalasi Ollama lokal." 
              isOpen={openFaqIndex === 1}
              onToggle={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}
            />
            <FAQItem 
              question="Bisakah saya menggunakan custom nomor?" 
              answer="Tentu, Anda bisa menghubungkan nomor WhatsApp pribadi atau bisnis apa pun melalui scan QR." 
              isOpen={openFaqIndex === 2}
              onToggle={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}
            />
            <FAQItem 
              question="Apakah bot ini bisa aktif 24 jam nonstop?" 
              answer="Ya! FanraBot berjalan sepenuhnya di cloud server kami, sehingga asisten AI Anda tetap aktif melayani obrolan pelanggan selama 24 jam nonstop tanpa perlu ponsel Anda dalam keadaan aktif atau terhubung internet." 
              isOpen={openFaqIndex === 3}
              onToggle={() => setOpenFaqIndex(openFaqIndex === 3 ? null : 3)}
            />
            <FAQItem 
              question="Bagaimana cara mengatur cara bicara atau kepribadian bot?" 
              answer="Sangat mudah! Anda cukup mengunjungi tab 'Bot Settings' di dalam dashboard. Di sana Anda bisa mengisi 'System Prompt' (instruksi utama bot) untuk mengajari bot menjadi CS ramah, agen penjualan tangguh, admin formal, atau asisten santai sesuai citra bisnis Anda." 
              isOpen={openFaqIndex === 4}
              onToggle={() => setOpenFaqIndex(openFaqIndex === 4 ? null : 4)}
            />
            <FAQItem 
              question="Apakah didukung balasan pesan otomatis berbasis kata kunci (command)?" 
              answer="Tentu saja! Selain respon pintar ditenagai AI, Anda dapat membuat Command kustom di menu 'Bot Commands'. Bila pengguna menulis command seperti /price, /bantuan, atau /info, bot akan mengirimkan balasan instan yang instan dan informatif." 
              isOpen={openFaqIndex === 5}
              onToggle={() => setOpenFaqIndex(openFaqIndex === 5 ? null : 5)}
            />
          </motion.div>
        </div>
      </section>

      {/* Footer - Optimized to center on mobile and dynamically output current year */}
      <footer className="py-12 border-t border-outline px-6 md:px-12 bg-surface-subtle">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-3">
              <img 
                src="https://res.cloudinary.com/dew39kqhy/image/upload/v1780578024/file_0000000030647209b33b695fffe52c90_gi9rwf.png" 
                alt="FanraBot Logo" 
                className="h-8 w-auto object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
              <span className="text-xl font-bold tracking-tight text-[#111827] font-brand tracking-[-0.03em] select-none">FanraBot</span>
            </div>
            <p className="text-xs text-on-surface-muted max-w-xs mt-1">
              Platform Aliansi AI dan Otomatisasi WhatsApp mandiri.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-on-surface-muted font-medium">
            <a href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-primary transition-colors">Kontak</a>
          </div>
          
          <p className="text-sm text-on-surface-muted">
            © {new Date().getFullYear()} FanraBot AI. Dibuat dengan presisi.
          </p>
        </div>
      </footer>
    </motion.div>
  );
}

// Sub-components
function FeatureCard({ iconUrl, title, description }: { iconUrl: string, title: string, description: string }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      variants={cardVariants}
      className="p-8 border border-outline rounded-2xl bg-white hover:border-primary/20 hover:shadow-lg transition-all group duration-300"
    >
      <img 
        src={iconUrl} 
        alt={title} 
        className="w-12 h-12 object-contain mb-6 group-hover:scale-105 transition-transform duration-300" 
        referrerPolicy="no-referrer"
      />
      <h3 className="text-lg font-bold mb-3 text-on-surface">{title}</h3>
      <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  const stepVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      variants={stepVariants}
      className="flex flex-col gap-4 p-5 rounded-xl bg-white border border-outline/40 hover:shadow-md transition-all duration-300 text-center items-center h-full"
    >
      <div className="w-9 h-9 shrink-0 bg-primary text-white font-bold rounded-full flex items-center justify-center text-sm shadow ring-4 ring-primary/10">
        {number}
      </div>
      <div>
        <h4 className="text-base font-bold mb-1.5 text-on-surface">{title}</h4>
        <p className="text-on-surface-muted leading-relaxed text-xs max-w-xs mx-auto">{description}</p>
      </div>
    </motion.div>
  );
}

function FAQItem({ 
  question, 
  answer, 
  isOpen, 
  onToggle 
}: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onToggle: () => void; 
}) {
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      variants={itemVariants}
      className="border border-outline rounded bg-surface-subtle overflow-hidden transition-all duration-200 shadow-sm hover:border-outline-variant"
    >
      <button 
        onClick={onToggle}
        className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-on-surface hover:text-primary transition-colors focus:outline-none cursor-pointer"
      >
        <span className="text-sm md:text-base font-semibold">{question}</span>
        <ChevronDown className={cn(
          "w-5 h-5 transition-transform duration-300 shrink-0 text-on-surface-muted",
          isOpen && "rotate-180 text-primary"
        )} />
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="faq-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 pt-1 text-sm text-on-surface-variant leading-relaxed border-t border-outline/30">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
