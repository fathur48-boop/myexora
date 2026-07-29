import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Package, MessageCircle, Zap, Check, Store,
  BarChart2, Shield, ChevronDown, Music, Video, Megaphone, Bot, Sun, Moon,
  Sparkles, Crown, Server, Lock, Smartphone, Globe, Database, Download,
  Building2, QrCode, Wallet, ShoppingBag, Tablet, Laptop, Monitor
} from 'lucide-react'
import { CONFIG, PLAN_FEATURES } from '../lib/config'
import { useTheme } from '../lib/useTheme'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import FloatingWA from '../components/ui/FloatingWA'

const SHOW_VIDEO_SECTION = false

const DEMO_VIDEOS = [
  {
    url: 'https://vyrbwyvyabyhuirivvml.supabase.co/storage/v1/object/public/landing-videos/video_2026-07-19_21-56-58.mp4',
    thumbnail: 'https://vyrbwyvyabyhuirivvml.supabase.co/storage/v1/object/public/landing-videos/ChatGPT%20Image%20Jul%2015,%202026,%2006_39_21%20PM.png',
    title: 'Demo Bikin Toko dalam 2 Menit',
  },
  {
    url: 'https://xxxxx.supabase.co/storage/v1/object/public/landing-videos/demo2.mp4',
    thumbnail: 'https://xxxxx.supabase.co/storage/v1/object/public/landing-videos/demo2-thumb.jpg',
    title: 'Cara Checkout via WhatsApp',
  },
]

function isIosDevice() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function useInstallPrompt() {
  const [ready, setReady] = useState(!!(typeof window !== 'undefined' && window.__exoraInstallEvent))
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (isStandaloneMode()) {
      setInstalled(true)
      return
    }
    const handleReady = () => setReady(true)
    window.addEventListener('exora-install-ready', handleReady)
    return () => window.removeEventListener('exora-install-ready', handleReady)
  }, [])

  const promptInstall = async () => {
    const evt = window.__exoraInstallEvent
    if (evt) {
      evt.prompt()
      const { outcome } = await evt.userChoice
      if (outcome === 'accepted' || outcome === 'dismissed') {
        window.__exoraInstallEvent = null
        setReady(false)
      }
      return true
    }
    return false
  }

  return { ready, installed, promptInstall, isIos: isIosDevice() }
}

function InstallAppButton({ variant = 'secondary', className = '' }) {
  const { installed, promptInstall, isIos } = useInstallPrompt()
  const [showIosHint, setShowIosHint] = useState(false)

  if (installed) return null

  const handleClick = async () => {
    const handled = await promptInstall()
    if (!handled) {
      setShowIosHint(true)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <MagneticButton>
        <button
          onClick={handleClick}
          className={`btn btn-${variant} btn-lg ${className}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <Download size={16} /> Install App
        </button>
      </MagneticButton>

      <AnimatePresence>
        {showIosHint && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-tertiary, var(--bg-surface))',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '14px 16px',
              width: 260,
              zIndex: 50,
              fontSize: '0.82rem',
              lineHeight: 1.5,
              textAlign: 'left',
            }}
          >
            {isIos ? (
              <>Tap ikon <b>Share</b> di browser, lalu pilih <b>"Add to Home Screen"</b>.</>
            ) : (
              <>Buka menu browser (⋮) lalu pilih <b>"Install app"</b> atau <b>"Add to Home Screen"</b>.</>
            )}
            <button
              onClick={() => setShowIosHint(false)}
              style={{
                display: 'block', marginTop: 8, background: 'none', border: 'none',
                color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', padding: 0,
                fontSize: '0.8rem',
              }}
            >
              Oke, mengerti
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ScrollProgressBar({ progress }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '3px',
        background: ACCENT_GRADIENT,
        width: `${progress}%`,
        zIndex: 101,
        transition: 'width 0.1s ease-out',
        boxShadow: '0 0 10px rgba(55, 138, 221, 0.5)',
      }}
    />
  )
}

function MagneticButton({ children, strength = 0.35, radius = 60, style, className, ...props }) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e) => {
    if (!ref.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    const distanceX = clientX - centerX
    const distanceY = clientY - centerY
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

    if (distance < radius) {
      setPosition({ x: distanceX * strength, y: distanceY * strength })
    } else {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      style={{ display: 'inline-block', ...style }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const FEATURES = [
  { icon: Store, title: 'Toko Online Instan', desc: 'Buat toko dalam hitungan menit, tanpa coding. Langsung online dan siap menerima pesanan.' },
  { icon: MessageCircle, title: 'Checkout via WhatsApp', desc: 'Buyer langsung chat WA kamu. Tidak perlu payment gateway rumit.' },
  { icon: Package, title: 'Manajemen Produk Fleksibel', desc: 'Upload 2-5 foto per produk (tergantung plan), atur harga, stok, diskon, dan kategori dengan mudah.' },
  { icon: Video, title: 'Multimedia Toko', desc: 'Upload video demo produk, audio penjelasan, atau musik background. Buyer lebih percaya karena bisa lihat & dengar langsung. Gratis untuk semua seller.' },
  { icon: Megaphone, title: 'Pengumuman Toko', desc: 'Tampilkan pengumuman teks, audio, atau video di tokomu — info diskon, jadwal operasional, atau promosi lainnya.' },
  { icon: Bot, title: 'Asisten AI', desc: '3 AI siap bantu: jawab pertanyaan pembeli di tokomu, kasih insight performa otomatis di Analitik, dan bantu buyer cari produk di Showcase.' },
  { icon: BarChart2, title: 'Analytics & Insight', desc: 'Pantau performa toko dengan grafik revenue, produk terlaris, dan insight AI otomatis. Tersedia mulai paket Starter.' },
  { icon: Shield, title: 'Aman & Terpercaya', desc: 'Login dengan Google, data tersimpan aman di infrastruktur Google.' },
  { icon: Zap, title: 'Gratis Selamanya', desc: 'Paket gratis tanpa batas waktu. Upgrade ke Starter atau Pro kalau butuh lebih.' },
]

const WHY_EXORA = [
  { icon: Zap, text: 'Bikin toko online dalam 2 menit, tanpa coding atau developer.' },
  { icon: MessageCircle, text: 'Checkout langsung masuk WA-mu — nggak perlu belajar dashboard rumit.' },
  { icon: Bot, text: 'AI jawab pertanyaan pembeli otomatis, walau kamu lagi sibuk packing.' },
]

const FAQ = [
  { q: 'Apakah benar-benar gratis?', a: 'Ya! Paket Free gratis selamanya tanpa batas waktu. Kamu bisa buka toko dan memajang hingga 10 produk secara instan tanpa biaya apapun.' },
  { q: 'Apa saja paket pilihan di Exora?', a: 'Tersedia 4 paket: Free (Rp 0 - 10 Produk), Starter (Rp 49rb/bln - 50 Produk & Analitik), Pro (Rp 99rb/bln - 250 Produk, Custom Domain .com & AIRA AI Business Advisor), serta Business (Rp 249rb/bln - Unlimited Produk, Multi Admin & Otomatisasi Resi).' },
  { q: 'Bagaimana cara pakai Custom Domain milik sendiri (.com)?', a: 'Paket Pro dan Business dapat menghubungkan domain milik sendiri (seperti tokokamu.com yang dibeli di provider domain pilihanmu). Tinggal arahkan DNS A Record ke 76.76.21.21 & CNAME ke cname.vercel-dns.com. SSL HTTPS aktif otomatis!' },
  { q: 'Bagaimana cara checkout pembeli?', a: 'Pembeli klik "Beli via WhatsApp" di toko kamu, lalu langsung terhubung ke WhatsApp kamu dengan draft pesan order lengkap berisi daftar item, total harga, dan format alamat.' },
  { q: 'Apa itu AIRA AI Business Advisor?', a: 'Asisten AI pintar khusus paket Pro & Bisnis yang menganalisis penjualan kamu, memberi rekomendasi stok produk, strategi promo, hingga copywriting deskripsi produk otomatis.' },
  { q: 'Foto produk disimpan di mana?', a: 'Foto disimpan di Supabase Cloud Storage milik Exora, teroptimasi cepat dan aman tanpa perlu bayar biaya hosting terpisah.' },
  { q: 'Bagaimana cara bayar dan upgrade paket?', a: 'Kamu bisa bayar via Transfer Bank (BCA, Mandiri, BRI, BNI), QRIS, E-Wallet (GoPay, DANA, OVO), atau Indomaret/Alfamart. Bebas pilih paket langganan bulanan atau 3 bulanan hemat 20%!' },
  { q: 'Apakah ada komisi dari setiap transaksi penjualan?', a: 'TIDAK ADA. 100% uang penjualan masuk langsung ke rekening/E-Wallet milik seller. Exora tidak mengambil komisi per transaksi.' },
]

const PAYMENT_METHODS = [
  { icon: Building2, name: 'Transfer Bank', desc: 'BCA, BNI, BRI, Mandiri', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { icon: QrCode, name: 'QRIS', desc: 'Scan & bayar instan', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { icon: Wallet, name: 'E-Wallet', desc: 'DANA, OVO, GoPay, ShopeePay', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  { icon: Store, name: 'Alfamart', desc: 'Bayar di gerai terdekat', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { icon: ShoppingBag, name: 'Indomaret', desc: 'Bayar di gerai terdekat', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
]

const DEVICES = [
  { icon: Smartphone, name: 'Smartphone', desc: 'Android dan iOS', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { icon: Tablet, name: 'Tablet', desc: 'iPad dan Android Tablet', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { icon: Laptop, name: 'Laptop', desc: 'Windows dan MacOS', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  { icon: Monitor, name: 'Desktop', desc: 'Semua Browser Modern', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
]

const TECH_GOOGLE = [
  { 
    icon: Server, 
    title: 'Google Cloud Infrastructure', 
    desc: 'Data tersimpan aman di infrastruktur cloud Google dengan redundansi tinggi.',
    color: '#4285F4'
  },
  { 
    icon: Lock, 
    title: 'SSL Encryption & Data Protection', 
    desc: 'Semua data terenkripsi dengan SSL/TLS. Privasi seller dan buyer terjamin.',
    color: '#34A853'
  },
]

const TECH_SUPABASE = [
  { 
    icon: Database, 
    title: 'Supabase Realtime Database', 
    desc: 'Database PostgreSQL yang cepat dan scalable. Sinkronisasi data toko secara real-time.',
    color: '#3ECF8E'
  },
  { 
    icon: Smartphone, 
    title: 'Fast & Mobile Optimized', 
    desc: 'Loading cepat dan responsive di semua perangkat. Buyer bisa belanja dari mana saja.',
    color: '#EA4335'
  },
]

const NAVY = '#0C447C'
const MID = '#185FA5'
const BLUE = '#378ADD'
const ACCENT_GRADIENT = `linear-gradient(90deg, ${NAVY}, ${BLUE})`

const THEMES = {
  light: {
    bgPage: '#ffffff',
    bgNav: 'rgba(255,255,255,0.85)',
    bgNavScrolled: 'rgba(255,255,255,0.85)',
    bgSurface: '#f7f7f7',
    bgCard: '#ffffff',
    border: '#ececec',
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textTertiary: '#6a6a6a',
    textMuted: '#8a8a8a',
    accentSoftBg: 'rgba(55,138,221,0.1)',
    accentSoftBorder: 'rgba(55,138,221,0.3)',
    accentGlow1: 'rgba(55,138,221,0.12)',
    accentGlow2: 'rgba(12,68,124,0.08)',
    proGlowBg: 'rgba(251,191,36,0.15)',
    proGlowBorder: 'rgba(251,191,36,0.35)',
    proGlowText: '#92400e',
    shadowColored: '0 30px 80px rgba(12,68,124,0.12)',
    btnSecondaryBg: '#ffffff',
    btnSecondaryBorder: '#e2e2e2',
    btnSecondaryText: '#1a1a1a',
    iconBg: 'rgba(55,138,221,0.1)',
    pricingProBg: 'linear-gradient(135deg, rgba(55,138,221,0.08) 0%, rgba(12,68,124,0.06) 100%)',
    pricingProBorder: 'rgba(55,138,221,0.35)',
    pricingStarterBg: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(91,138,245,0.04) 100%)',
    pricingStarterBorder: 'rgba(59,130,246,0.3)',
    chromeBg: '#f7f7f7',
  },
  dark: {
    bgPage: '#050508',
    bgNav: 'rgba(5,5,8,0.88)',
    bgNavScrolled: 'rgba(5,5,8,0.88)',
    bgSurface: '#121216',
    bgCard: '#141418',
    border: 'rgba(255,255,255,0.09)',
    textPrimary: '#f5f5f7',
    textSecondary: '#d1d1d6',
    textTertiary: '#a8a8b0',
    textMuted: '#8a8a91',
    accentSoftBg: 'rgba(55,138,221,0.16)',
    accentSoftBorder: 'rgba(55,138,221,0.35)',
    accentGlow1: 'rgba(55,138,221,0.18)',
    accentGlow2: 'rgba(55,138,221,0.08)',
    proGlowBg: 'rgba(251,191,36,0.18)',
    proGlowBorder: 'rgba(251,191,36,0.4)',
    proGlowText: '#fbbf24',
    shadowColored: '0 30px 80px rgba(55,138,221,0.18)',
    btnSecondaryBg: '#15151c',
    btnSecondaryBorder: 'rgba(255,255,255,0.12)',
    btnSecondaryText: '#f5f5f7',
    iconBg: 'rgba(55,138,221,0.16)',
    pricingProBg: 'linear-gradient(135deg, rgba(55,138,221,0.16) 0%, rgba(55,138,221,0.06) 100%)',
    pricingProBorder: 'rgba(55,138,221,0.4)',
    pricingStarterBg: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(91,138,245,0.04) 100%)',
    pricingStarterBorder: 'rgba(59,130,246,0.35)',
    chromeBg: '#1a1a22',
  },
}

const ExoraIcon = () => {
  const [imgError, setImgError] = useState(false)
  if (!imgError) {
    return (
      <img
        src="/exora.png"
        alt="Exora"
        onError={() => setImgError(true)}
        style={{ width: 28, height: 28, objectFit: 'contain' }}
      />
    )
  }
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="xGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={NAVY} />
          <stop offset="50%" stopColor={MID} />
          <stop offset="100%" stopColor={BLUE} />
        </linearGradient>
      </defs>
      <path d="M10 10 L42 50 L10 90 H32 L50 65 L68 90 H90 L58 50 L90 10 H68 L50 35 L32 10 Z" fill="url(#xGrad)" />
    </svg>
  )
}

const PJS = "'Plus Jakarta Sans', sans-serif"

function useScrollAnimation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return { ref, isInView }
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
}

const fadeUpStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    }
  }
}

function FiturSection({ theme }) {
  const { ref, isInView } = useScrollAnimation()
  const c = THEMES[theme]
  const accent = theme === 'light' ? NAVY : BLUE

  return (
    <section id="fitur" className="section-pad" style={{ padding: '64px 0' }}>
      <div className="container">
        <motion.div
          ref={ref}
          variants={fadeUpStagger}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <motion.div variants={fadeUpVariant} style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', marginBottom: 8, color: c.textPrimary }}>
              Semua yang kamu butuhkan
            </h2>
            <p style={{ fontFamily: PJS, color: c.textTertiary, textAlign: 'center' }}>
              Fitur lengkap, gratis, tanpa ribet.
            </p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUpVariant}
                className="glass-card hover-lift"
                style={{ padding: '24px' }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: c.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14, color: accent,
                }}>
                  <f.icon size={20} />
                </div>
                <h3 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: c.textPrimary }}>{f.title}</h3>
                <p className="landing-body-text" style={{ fontFamily: PJS, color: c.textTertiary, fontSize: '0.875rem', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function PricingSection({ theme }) {
  const { ref, isInView } = useScrollAnimation()
  const c = THEMES[theme]
  const accent = theme === 'light' ? NAVY : BLUE
  const [billingCycle, setBillingCycle] = useState('3month')
  const is3Month = billingCycle === '3month'

  return (
    <section id="harga" className="section-pad" style={{ padding: '64px 0' }}>
      <div className="container">
        <motion.div
          ref={ref}
          variants={fadeUpStagger}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <motion.div variants={fadeUpVariant} style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', marginBottom: 8, color: c.textPrimary }}>
              Pilih Paket Yang Cocok
            </h2>
            <p style={{ fontFamily: PJS, color: c.textTertiary, textAlign: 'center', marginBottom: 20 }}>Mulai gratis, upgrade kapan saja sesuai kebutuhan bisnismu.</p>

            {/* Toggle Billing */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: c.bgSurface,
              padding: '4px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${c.border}`,
              gap: '4px',
            }}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className="btn"
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: !is3Month ? ACCENT_GRADIENT : 'transparent',
                  color: !is3Month ? '#fff' : c.textSecondary,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Bulanan
              </button>
              <button
                onClick={() => setBillingCycle('3month')}
                className="btn"
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: is3Month ? ACCENT_GRADIENT : 'transparent',
                  color: is3Month ? '#fff' : c.textSecondary,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                Langganan 3 Bulan
                <span style={{
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                }}>
                  Hemat 20% 🔥
                </span>
              </button>
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', maxWidth: 1140, margin: '0 auto' }}>
            
            {/* Free */}
            <motion.div variants={fadeUpVariant} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-free" style={{ marginBottom: 12 }}>Free Gratis</span>
                <p style={{ fontFamily: PJS, fontWeight: 800, fontSize: '2rem', marginBottom: 2, color: c.textPrimary }}>Rp 0</p>
                <p style={{ fontFamily: PJS, color: c.textMuted, fontSize: '0.82rem', marginBottom: 16 }}>Selamanya gratis</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 24 }}>
                  {PLAN_FEATURES.free.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Check size={14} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontFamily: PJS, fontSize: '0.82rem', color: c.textSecondary, textAlign: 'left' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Mulai Gratis</Link>
            </motion.div>

            {/* Starter */}
            <motion.div
              variants={fadeUpVariant}
              style={{
                background: c.pricingStarterBg,
                border: `1.5px solid ${c.pricingStarterBorder}`,
                borderRadius: 'var(--radius-xl)', padding: '24px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontFamily: PJS, fontSize: '0.72rem', fontWeight: 800, color: '#3B82F6', background: 'rgba(59,130,246,0.15)', padding: '3px 10px', borderRadius: '999px', display: 'inline-block', marginBottom: 12 }}>
                  PEMULA
                </span>
                
                <p style={{ fontFamily: PJS, fontWeight: 800, fontSize: '2rem', marginBottom: 2, color: c.textPrimary }}>
                  {is3Month ? PLAN_FEATURES.starter.price3Month : PLAN_FEATURES.starter.priceMonthly}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: c.textMuted }}> / bln</span>
                </p>
                
                <p style={{ fontFamily: PJS, color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600, marginBottom: 16 }}>
                  {is3Month ? 'Tagihan Rp 117rb / 3 bulan (Hemat 20%)' : 'Bayar bulanan'}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 24 }}>
                  {PLAN_FEATURES.starter.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Check size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontFamily: PJS, fontSize: '0.82rem', color: c.textSecondary, textAlign: 'left' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Link to="/login" className="btn" style={{ width: '100%', justifyContent: 'center', background: '#3B82F6', color: '#fff' }}>
                Mulai Starter <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              variants={fadeUpVariant}
              style={{
                background: c.pricingProBg,
                border: `2px solid ${c.pricingProBorder}`,
                borderRadius: 'var(--radius-xl)', padding: '24px',
                boxShadow: '0 8px 30px rgba(124,58,237,0.18)',
                position: 'relative',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              <div style={{
                position: 'absolute', top: -11, right: 16, background: ACCENT_GRADIENT,
                color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '3px 10px',
                borderRadius: 'var(--radius-full)', letterSpacing: '0.03em'
              }}>
                ⭐ PALING POPULER
              </div>

              <div>
                <span style={{ fontFamily: PJS, fontSize: '0.72rem', fontWeight: 800, color: accent, background: c.accentSoftBg, padding: '3px 10px', borderRadius: '999px', display: 'inline-block', marginBottom: 12, marginTop: 4 }}>
                  PRO BEST VALUE
                </span>
                
                <p style={{ fontFamily: PJS, fontWeight: 800, fontSize: '2rem', marginBottom: 2, color: c.textPrimary }}>
                  {is3Month ? PLAN_FEATURES.pro.price3Month : PLAN_FEATURES.pro.priceMonthly}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: c.textMuted }}> / bln</span>
                </p>
                
                <p style={{ fontFamily: PJS, color: accent, fontSize: '0.75rem', fontWeight: 600, marginBottom: 16 }}>
                  {is3Month ? 'Tagihan Rp 237rb / 3 bulan (Hemat 20%)' : 'Bayar bulanan'}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 24 }}>
                  {PLAN_FEATURES.pro.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Check size={14} color={accent} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontFamily: PJS, fontSize: '0.82rem', color: c.textSecondary, textAlign: 'left' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Pilih Paket Pro <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Business */}
            <motion.div
              variants={fadeUpVariant}
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)',
                border: '1.5px solid rgba(16,185,129,0.3)',
                borderRadius: 'var(--radius-xl)', padding: '24px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontFamily: PJS, fontSize: '0.72rem', fontWeight: 800, color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '3px 10px', borderRadius: '999px', display: 'inline-block', marginBottom: 12 }}>
                  ENTERPRISE
                </span>
                
                <p style={{ fontFamily: PJS, fontWeight: 800, fontSize: '2rem', marginBottom: 2, color: c.textPrimary }}>
                  {is3Month ? PLAN_FEATURES.business.price3Month : PLAN_FEATURES.business.priceMonthly}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: c.textMuted }}> / bln</span>
                </p>
                
                <p style={{ fontFamily: PJS, color: '#10B981', fontSize: '0.75rem', fontWeight: 600, marginBottom: 16 }}>
                  {is3Month ? 'Tagihan Rp 597rb / 3 bulan (Hemat 20%)' : 'Bayar bulanan'}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 24 }}>
                  {PLAN_FEATURES.business.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Check size={14} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontFamily: PJS, fontSize: '0.82rem', color: c.textSecondary, textAlign: 'left' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Link to="/login" className="btn" style={{ width: '100%', justifyContent: 'center', background: '#10B981', color: '#fff' }}>
                Pilih Bisnis <ArrowRight size={14} />
              </Link>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </section>
  )
}

function TeknologiSection({ theme, title, subtitle, features }) {
  const { ref, isInView } = useScrollAnimation()
  const c = THEMES[theme]

  return (
    <section className="section-pad" style={{ padding: '64px 0' }}>
      <div className="container">
        <motion.div
          ref={ref}
          variants={fadeUpStagger}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <motion.div variants={fadeUpVariant} style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: 8, color: c.textPrimary }}>
              {title}
            </h2>
            <p style={{ fontFamily: PJS, color: c.textTertiary, textAlign: 'center' }}>
              {subtitle}
            </p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: 800, margin: '0 auto' }}>
            {features.map((tech, i) => (
              <motion.div
                key={tech.title}
                variants={fadeUpVariant}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="glass-card"
                style={{ padding: '28px 24px', textAlign: 'center' }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `${tech.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: tech.color,
                }}>
                  <tech.icon size={28} />
                </div>
                <h3 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, color: c.textPrimary }}>{tech.title}</h3>
                <p style={{ fontFamily: PJS, color: c.textTertiary, fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function CTASection({ theme }) {
  const { ref, isInView } = useScrollAnimation()
  const c = THEMES[theme]

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{
        textAlign: 'center',
        padding: '80px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="anim-blob" style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 300,
        background: 'radial-gradient(ellipse, rgba(91,138,245,0.1) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.6 }}
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: c.textPrimary,
            letterSpacing: '-0.03em',
            marginBottom: 12,
          }}
        >
          Mulai gratis sekarang
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ color: c.textSecondary, fontSize: '0.95rem', marginBottom: 32 }}
        >
          Setup 2 menit · Tidak perlu kartu kredit · Upgrade kapan saja
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link to="/login">
            <MagneticButton>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="anim-pulse-accent btn btn-primary btn-lg"
                style={{
                  padding: '14px 40px',
                  borderRadius: 100,
                  background: ACCENT_GRADIENT,
                  color: '#fff',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Buka Toko Gratis <ArrowRight size={16} />
              </motion.button>
            </MagneticButton>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  
  const { theme, toggleTheme } = useTheme()
  const c = THEMES[theme]
  const accent = theme === 'light' ? NAVY : BLUE

  useEffect(() => {
    const fn = () => {
      const scrollY = window.scrollY
      setScrolled(scrollY > 30)
      
      const scrollTotal = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollTotal > 0 ? (scrollY / scrollTotal) * 100 : 0
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="landing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ minHeight: '100vh', fontFamily: PJS, background: c.bgPage, transition: 'background 0.25s ease', overflowX: 'hidden' }}>
          <style>{`
            .landing-body-text { text-align: left; }
            .landing-center { text-align: center; }
            .btn-primary {
              background: ${ACCENT_GRADIENT} !important;
              color: #ffffff !important;
              border: none !important;
            }
            .btn-secondary {
              background: ${c.btnSecondaryBg} !important;
              color: ${c.btnSecondaryText} !important;
              border: 1px solid ${c.btnSecondaryBorder} !important;
            }
            .btn-ghost {
              color: ${c.textPrimary} !important;
            }
            .glass-card {
              background: ${c.bgCard} !important;
              border: 1px solid ${c.border} !important;
            }
            .theme-toggle-btn:hover { transform: scale(1.06); }

            .payment-heading {
              font-size: clamp(1.4rem, 4vw, 2.2rem) !important;
              line-height: 1.2;
            }

            .device-card {
              min-height: 180px;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }

            @media (max-width: 600px) {
              .section-pad { padding-top: 36px !important; padding-bottom: 36px !important; }
              .hero-pad { padding-top: 80px !important; padding-bottom: 20px !important; }
              .cta-pad { padding: 28px 16px !important; }
              .heading-sm { font-size: 1.3rem !important; }
              .heading-display { font-size: 1.5rem !important; white-space: normal !important; }
              .nav-cta-primary { display: none !important; }
              .hide-mobile { display: none !important; }
              
              .browser-mockup-products {
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)) !important;
                gap: 8px !important;
              }
              
              .payment-grid { 
                grid-template-columns: repeat(2, 1fr) !important; 
                gap: 12px !important; 
              }
              .payment-card { 
                padding: 16px !important; 
                max-width: none !important; 
              }
              .payment-icon { 
                width: 50px !important; 
                height: 50px !important; 
                margin-bottom: 8px !important; 
              }
              .payment-title { 
                font-size: 0.9rem !important; 
                margin-bottom: 4px !important; 
              }
              .payment-desc { 
                font-size: 0.75rem !important; 
              }

              .footer-grid { 
                grid-template-columns: repeat(2, 1fr) !important; 
                gap: 18px 12px !important; 
                margin-bottom: 20px !important;
              }
              .footer-col-brand {
                grid-column: 1 / -1 !important;
                border-bottom: 1px solid ${c.border};
                padding-bottom: 12px !important;
                margin-bottom: 4px !important;
              }
              .footer-col {
                padding-bottom: 0 !important;
                border-bottom: none !important;
              }
              .footer-col h4 {
                font-size: 0.8rem !important;
                margin-bottom: 6px !important;
              }
              .footer-col a {
                font-size: 0.76rem !important;
              }
              .footer-col div {
                gap: 5px !important;
              }
              .footer-col h4 {
                font-size: 0.9rem !important;
                margin-bottom: 8px !important;
              }
              .footer-col div {
                gap: 6px !important;
              }
              .footer-col a {
                font-size: 0.85rem !important;
              }
            }
          `}</style>

          <ScrollProgressBar progress={scrollProgress} />

          {/* Navbar */}
          <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            padding: '0 16px',
            background: scrolled ? c.bgNavScrolled : 'transparent',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            borderBottom: scrolled ? `1px solid ${c.border}` : '1px solid transparent',
            transition: 'all 0.3s ease',
            height: 58,
            display: 'flex', alignItems: 'center',
          }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0, width: '100%' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
                <ExoraIcon />
                <span style={{ fontFamily: PJS, fontWeight: 800, fontSize: '1.15rem', color: c.textPrimary, letterSpacing: '0', whiteSpace: 'nowrap', wordBreak: 'normal' }}>EXORA</span>
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                  aria-label={theme === 'light' ? 'Ganti ke tema gelap' : 'Ganti ke tema terang'}
                  title={theme === 'light' ? 'Tema gelap' : 'Tema terang'}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', border: `1px solid ${c.border}`,
                    background: c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: c.textSecondary, transition: 'transform 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                </button>
                <Link to="/showcase" className="btn btn-ghost btn-sm" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '6px 10px', textDecoration: 'none' }}>Produk</Link>
                <Link to="/login" className="btn btn-ghost btn-sm hide-mobile" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', textDecoration: 'none' }}>Masuk</Link>
                
                <MagneticButton className="nav-cta-primary">
                  <Link to="/login" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}>
                    Buka Toko Gratis
                    <ArrowRight size={14} />
                  </Link>
                </MagneticButton>
              </div>
            </div>
          </nav>

          {/* Hero */}
          <section className="hero-pad" style={{ paddingTop: 110, paddingBottom: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <motion.div
              className="anim-blob"
              style={{
                position: 'absolute',
                top: '-120px',
                left: '-100px',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(91,138,245,0.15) 0%, transparent 70%)',
                filter: 'blur(60px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            <motion.div
              className="anim-blob-2"
              style={{
                position: 'absolute',
                bottom: '-80px',
                right: '-80px',
                width: '420px',
                height: '420px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
                filter: 'blur(60px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            <div className="container-sm" style={{ animation: 'fadeIn 0.7s ease', position: 'relative', zIndex: 1 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '6px 14px', borderRadius: 'var(--radius-full)',
                  background: c.accentSoftBg,
                  border: `1px solid ${c.accentSoftBorder}`,
                  marginBottom: '18px', gap: 6, maxWidth: '100%', flexWrap: 'wrap'
                }}>
                  <Zap size={13} color={accent} style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: PJS, fontSize: '0.72rem', fontWeight: 700, color: accent, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                    GRATIS • TANPA CODING • LANGSUNG ONLINE
                  </span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: PJS, fontWeight: 800,
                  fontSize: 'clamp(2.6rem, 10vw, 7.5rem)',
                  marginBottom: '6px', letterSpacing: '-0.02em',
                  color: c.textPrimary, lineHeight: 1.05,
                  wordBreak: 'normal', overflowWrap: 'normal'
                }}
              >
                EXORA
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: PJS, fontSize: 'clamp(0.95rem, 2.5vw, 1.3rem)', fontWeight: 700,
                  color: accent,
                  marginBottom: '10px',
                }}
              >
                Start. Sell. Scale.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: PJS, fontSize: 'clamp(0.88rem, 2vw, 1.05rem)',
                  color: c.textTertiary, lineHeight: 1.5, marginBottom: '28px',
                  maxWidth: 420, margin: '0 auto 28px',
                  textAlign: 'center',
                }}
              >
                WebApp Toko + AI Assistant + WA Checkout
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
              >
                <MagneticButton>
                  <Link to="/login" className="btn btn-primary btn-lg">
                    Buka Toko Gratis <ArrowRight size={16} />
                  </Link>
                </MagneticButton>

                <InstallAppButton variant="secondary" />

                <a href="#fitur" className="btn btn-secondary btn-lg">Lihat Fitur</a>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: PJS, fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                  color: c.textMuted, marginTop: 40,
                  maxWidth: 380, margin: '40px auto 0',
                  textAlign: 'center',
                }}
              >
                Baru diluncurkan — jadi salah satu seller pertama yang ngebentuk Exora dari awal.
              </motion.p>
            </div>

            {/* Browser Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="anim-float"
              style={{ marginTop: 24, padding: '0 16px', position: 'relative', zIndex: 1, maxWidth: '100%', boxSizing: 'border-box' }}
            >
              <div style={{
                width: '100%',
                maxWidth: 800, margin: '0 auto',
                background: `linear-gradient(135deg, ${c.accentGlow1} 0%, ${c.accentGlow2} 100%)`,
                border: `1px solid ${c.border}`,
                borderRadius: 'var(--radius-2xl)', padding: '3px',
                boxShadow: c.shadowColored,
                boxSizing: 'border-box',
              }}>
                <div style={{ background: c.bgCard, borderRadius: 'calc(var(--radius-2xl) - 3px)', overflow: 'hidden' }}>
                  <div style={{ background: c.chromeBg, borderBottom: `1px solid ${c.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['#f87171', '#fbbf24', '#34d399'].map(cc => (
                        <div key={cc} style={{ width: 10, height: 10, borderRadius: '50%', background: cc, opacity: 0.8 }} />
                      ))}
                    </div>
                    <div style={{
                      flex: 1, maxWidth: 300, margin: '0 auto',
                      background: c.bgCard, border: `1px solid ${c.border}`,
                      borderRadius: 'var(--radius-full)', padding: '4px 12px',
                      fontSize: '0.72rem', color: c.textMuted, textAlign: 'center', fontFamily: PJS,
                    }}>myexora.com/rina-handmade</div>
                  </div>
                  <div style={{ padding: '20px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 16 }}>
                      <img 
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" 
                        alt="Rina Handmade" 
                        style={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} 
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontFamily: PJS, fontWeight: 800, color: c.textPrimary, fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rina Handmade</p>
                        <p style={{ fontFamily: PJS, fontSize: '0.75rem', color: c.textMuted, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>✨ Produk handmade berkualitas</p>
                      </div>
                      <span className="badge badge-pro" style={{ marginLeft: 'auto', flexShrink: 0 }}>⭐ Pro</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                      {[
                        { name: 'Tote Bag Batik', price: 'Rp 49.000', img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=80' },
                        { name: 'Lilin Aromaterapi', price: 'Rp 39.000', img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&auto=format&fit=crop&q=80' },
                        { name: 'Matcha Latte', price: 'Rp 29.000', img: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80' },
                      ].map(p => (
                        <div key={p.name} className="glass-card" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ width: '100%', height: 90, overflow: 'hidden', background: c.bgSurface }}>
                            <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ padding: '8px 10px' }}>
                            <p style={{ fontFamily: PJS, fontSize: '0.75rem', fontWeight: 700, margin: '0 0 2px 0', color: c.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                            <p style={{ fontFamily: PJS, fontSize: '0.72rem', color: accent, fontWeight: 800, margin: 0 }}>{p.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {SHOW_VIDEO_SECTION && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginTop: 28, padding: '0 16px', position: 'relative', zIndex: 1 }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                  maxWidth: 800,
                  margin: '0 auto',
                }}>
                  {DEMO_VIDEOS.map((v) => (
                    <div
                      key={v.url}
                      className="glass-card"
                      style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-xl)', textAlign: 'left' }}
                    >
                      <video
                        src={v.url}
                        poster={v.thumbnail}
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls
                        preload="metadata"
                        style={{ width: '100%', display: 'block', aspectRatio: '16/9', background: '#000' }}
                      />
                      <div style={{ padding: '12px 16px' }}>
                        <p style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.85rem', color: c.textPrimary, margin: 0 }}>
                          {v.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </section>

          <FiturSection theme={theme} />

          <PricingSection theme={theme} />

          {/* Metode Pembayaran */}
          <section className="section-pad" style={{ padding: '64px 0' }}>
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6 }}
              >
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <h2 className="text-heading heading-sm payment-heading" style={{ fontFamily: PJS, marginBottom: 8, color: c.textPrimary }}>
                    Metode Pembayaran
                  </h2>
                  <p style={{ fontFamily: PJS, color: c.textTertiary, textAlign: 'center' }}>
                    Terima pembayaran dari pembeli dengan berbagai metode populer di Indonesia
                  </p>
                </div>
                <div className="payment-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', maxWidth: 900, margin: '0 auto' }}>
                  {PAYMENT_METHODS.map((p, i) => (
                    <motion.div
                      key={p.name}
                      className="payment-card glass-card"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      whileHover={{ y: -4 }}
                      style={{ padding: '24px 16px', textAlign: 'center', width: '100%' }}
                    >
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: p.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 14px',
                      }}>
                        <p.icon size={28} style={{ color: p.color }} />
                      </div>
                      <h3 className="payment-title" style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.98rem', marginBottom: 6, color: c.textPrimary }}>{p.name}</h3>
                      <p className="payment-desc" style={{ fontFamily: PJS, color: c.textTertiary, fontSize: '0.8rem', margin: 0 }}>{p.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Perangkat */}
          <section className="section-pad" style={{ padding: '64px 0' }}>
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6 }}
              >
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <p style={{ fontFamily: PJS, fontSize: '0.82rem', fontWeight: 700, color: c.accent, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>
                    KOMPATIBILITAS
                  </p>
                  <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: 8, color: c.textPrimary }}>
                    Berjalan di Semua Perangkat
                  </h2>
                  <p style={{ fontFamily: PJS, color: c.textTertiary, textAlign: 'center' }}>
                    Akses dari browser manapun, kapanpun
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', maxWidth: 700, margin: '0 auto' }}>
                  {DEVICES.map((d, i) => (
                    <motion.div
                      key={d.name}
                      className="device-card glass-card"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      whileHover={{ y: -4 }}
                      style={{ padding: '24px 16px', textAlign: 'center' }}
                    >
                      <div style={{
                        width: 58,
                        height: 58,
                        borderRadius: 16,
                        background: d.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 14px',
                      }}>
                        <d.icon size={28} style={{ color: d.color }} />
                      </div>
                      <h3 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: c.textPrimary }}>{d.name}</h3>
                      <p style={{ fontFamily: PJS, color: c.textTertiary, fontSize: '0.82rem', margin: 0 }}>{d.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Why Exora */}
          <section className="section-pad" style={{ padding: '56px 0' }}>
            <div className="container">
              <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 36, color: c.textPrimary }}>
                Kenapa seller pilih Exora
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {WHY_EXORA.map((w, i) => (
                  <div key={i} className="glass-card" style={{ padding: '22px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: c.iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 14, color: accent,
                    }}>
                      <w.icon size={18} />
                    </div>
                    <p className="landing-body-text" style={{ fontFamily: PJS, color: c.textPrimary, fontSize: '0.9rem', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>"{w.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <TeknologiSection 
            theme={theme} 
            title="Ditenagai Google Cloud" 
            subtitle="Infrastruktur kelas dunia untuk keamanan dan keandalan toko kamu"
            features={TECH_GOOGLE} 
          />

          <TeknologiSection 
            theme={theme} 
            title="Database & Performa Tinggi" 
            subtitle="Didukung Supabase untuk kecepatan dan skalabilitas maksimal"
            features={TECH_SUPABASE} 
          />

          {/* FAQ */}
          <section className="section-pad" style={{ padding: '56px 0' }}>
            <div className="container-sm">
              <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 36, color: c.textPrimary }}>
                Pertanyaan umum
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {FAQ.map((f, i) => (
                  <div key={i} className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 0 }}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{
                        width: '100%', padding: '16px 18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'transparent', border: 'none', cursor: 'pointer', color: c.textPrimary,
                        fontFamily: PJS, fontWeight: 600, fontSize: '0.92rem', textAlign: 'left', gap: '12px',
                      }}
                    >
                      {f.q}
                      <ChevronDown size={16} color={c.textMuted} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '12px 18px 16px', borderTop: `1px solid ${c.border}` }}>
                            <p className="landing-body-text" style={{ fontFamily: PJS, color: c.textTertiary, fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>
                              {f.a}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <CTASection theme={theme} />

          {/* Footer */}
          <footer className="main-footer" style={{ borderTop: `1px solid ${c.border}`, padding: '40px 20px 20px', color: c.textMuted }}>
            <div className="container footer-grid" style={{ padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '32px', marginBottom: '32px' }}>
              
              <div className="footer-col footer-col-brand">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 16 }}>
                  <ExoraIcon />
                  <span style={{ fontFamily: PJS, fontWeight: 800, fontSize: '1.1rem', color: c.textPrimary }}>EXORA</span>
                </div>
                <p style={{ fontFamily: PJS, fontSize: '0.875rem', lineHeight: 1.6, color: c.textSecondary, margin: 0 }}>
                  Platform toko online Indonesia. Buka toko gratis, terima pesanan via WhatsApp.
                </p>
              </div>

              <div className="footer-col">
                <h4 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.95rem', color: c.textPrimary, marginBottom: 16 }}>Produk</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <a href="#fitur" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Fitur</a>
                  <a href="#harga" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Harga</a>
                  <Link to="/login" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Mulai Gratis</Link>
                </div>
              </div>

              <div className="footer-col">
                <h4 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.95rem', color: c.textPrimary, marginBottom: 16 }}>Belajar</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link to="/academy" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Akademi Seller</Link>
                  <Link to="/guides" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Panduan Lengkap</Link>
                  <Link to="/stories" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Kisah Sukses</Link>
                  <Link to="/blog" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Seller Hub</Link>
                </div>
              </div>

              <div className="footer-col">
                <h4 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.95rem', color: c.textPrimary, marginBottom: 16 }}>Pembeli</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link to="/lacak-pesanan" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Lacak Pesanan</Link>
                  <Link to="/pesanan-saya" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Pesanan Saya</Link>
                  <Link to="/showcase" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Showcase Toko</Link>
                </div>
              </div>

              <div className="footer-col">
                <h4 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.95rem', color: c.textPrimary, marginBottom: 16 }}>Bantuan</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link to="/blog" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Blog & Tips</Link>
                  <Link to="/updates" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Update Fitur</Link>
                </div>
              </div>

              <div className="footer-col">
                <h4 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.95rem', color: c.textPrimary, marginBottom: 16 }}>Legal</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link to="/syarat-layanan" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Syarat Layanan</Link>
                  <Link to="/kebijakan-privasi" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>Kebijakan Privasi</Link>
                </div>
              </div>

              <div className="footer-col">
                <h4 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.95rem', color: c.textPrimary, marginBottom: 16 }}>Kontak</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <a href="mailto:support@myexora.com" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>
                    support@myexora.com
                  </a>
                  <a href={`https://wa.me/${CONFIG.ADMIN_WA}`} target="_blank" rel="noreferrer" style={{ color: c.textSecondary, textDecoration: 'none', fontSize: '0.875rem' }}>
                    0838-6272-0514
                  </a>
                </div>
              </div>
            </div>

            <div style={{
              borderTop: `1px solid ${c.border}`,
              paddingTop: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: '0.82rem',
            }}>
              <p style={{ fontFamily: PJS, margin: 0 }}>© 2026 Exora. Platform toko online Indonesia.</p>
              <p style={{ fontFamily: PJS, margin: 0 }}>Made with ❤️ in Indonesia</p>
            </div>
          </footer>

        </div>

        <FloatingWA />

      </motion.div>
    </AnimatePresence>
  )
}
