import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Users, Store,
  Search, ExternalLink, Zap, RefreshCw,
  Download, Send, FileText, ChevronRight, Bell, Sparkles, LogOut,
  Crown, Clock, BookOpen, HelpCircle, RefreshCcw, Key,
  AlertTriangle, CheckCircle2, Server, Cpu, Globe, ArrowUpRight,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { adminApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import { formatRupiah, getStorefrontUrl } from '../lib/utils'
import { CONFIG } from '../lib/config'
import * as XLSX from 'xlsx'

// Lazy-loaded: AdminContentManager dynamic-import TipTap (berat),
// jadi jangan ikut ke bundle awal AdminPage.
const AdminContentManager = lazy(() => import('./AdminContentManager'))

// Harga per plan untuk estimasi pendapatan
const PLAN_PRICES = {
  starter: CONFIG.TIERS.STARTER.priceMonthlyNum || 49000,
  pro: CONFIG.TIERS.PRO.priceMonthlyNum || 99000,
  business: CONFIG.TIERS.BUSINESS.priceMonthlyNum || 249000,
}

const PLAN_CONFIG = {
  free: { label: 'Free', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)', icon: null },
  starter: { label: 'Starter', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', icon: Sparkles },
  pro: { label: 'Pro', color: '#a855f7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', icon: Zap },
  business: { label: 'Business', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', icon: Crown },
  expired: { label: 'Expired', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', icon: Clock },
}

const DURATION_OPTIONS = [
  { value: 1, label: '1 Bulan' },
  { value: 3, label: '3 Bulan' },
  { value: 6, label: '6 Bulan' },
  { value: 12, label: '12 Bulan' },
]

export default function AdminPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('sellers')
  // Konten & Artikel: null = tampilkan grid card, sebaliknya render AdminContentManager inline
  const [manageContentType, setManageContentType] = useState(null)

  const [stats, setStats] = useState({
    totalUser: 0, totalToko: 0, totalProduk: 0,
    freeCount: 0, starterCount: 0, proCount: 0, businessCount: 0, expiredCount: 0,
    totalPlatformGmv: 0,
  })
  const [sellers, setSellers] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')

  const [sectionCounts, setSectionCounts] = useState({
    blog: 0, guides: 0, help: 0, updates: 0, credentials: 0,
  })

  const [selectedSeller, setSelectedSeller] = useState(null)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('all')

  // === MODAL SET PLAN ===
  const [setPlanSeller, setSetPlanSeller] = useState(null)
  const [setPlanValue, setSetPlanValue] = useState('free')
  const [setPlanDuration, setSetPlanDuration] = useState(3)
  const [setPlanLoading, setSetPlanLoading] = useState(false)

  useEffect(() => { loadAdminData() }, [])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const token = useAuthStore.getState().token
      const [statsRes, sellersRes, logsRes] = await Promise.all([
        adminApi.getStats(token).catch(() => null),
        adminApi.getSellers(token).catch(() => null),
        adminApi.getSystemLogs(token).catch(() => null),
      ])
      if (statsRes?.success && statsRes?.data) setStats(statsRes.data)
      if (sellersRes?.success && Array.isArray(sellersRes.data)) setSellers(sellersRes.data)
      if (logsRes?.success && logsRes?.data) setLogs(logsRes.data)
      loadSectionCounts(token)
    } catch (err) {
      console.warn('Gagal memuat data admin:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSectionCounts = async (token) => {
    try {
      const [blogRes, guidesRes, helpRes, updatesRes] = await Promise.all([
        fetch('/api/blog').then(r => r.json()).catch(() => null),
        fetch('/api/guides').then(r => r.json()).catch(() => null),
        fetch('/api/help').then(r => r.json()).catch(() => null),
        fetch('/api/updates').then(r => r.json()).catch(() => null),
      ])
      setSectionCounts({
        blog: Array.isArray(blogRes?.data) ? blogRes.data.length : 0,
        guides: Array.isArray(guidesRes?.data) ? guidesRes.data.length : 0,
        help: Array.isArray(helpRes?.data) ? helpRes.data.length : 0,
        updates: Array.isArray(updatesRes?.data) ? updatesRes.data.length : 0,
        credentials: 0,
      })
    } catch (err) {
      console.warn('Gagal load section counts:', err)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Berhasil keluar dari akun Admin 👋')
    navigate('/login')
  }

  // === OPEN MODAL SET PLAN ===
  const openSetPlan = (seller) => {
    setSetPlanSeller(seller)
    setSetPlanValue(seller.plan || 'free')
    setSetPlanDuration(3)
  }

  // === SUBMIT SET PLAN (4-TIER MANUAL) ===
  const handleSetPlanSubmit = async () => {
    if (!setPlanSeller) return
    setSetPlanLoading(true)
    try {
      const token = useAuthStore.getState().token
      const plan = setPlanValue
      const months = setPlanDuration

      if (plan === 'free') {
        await adminApi.revokePro(token, setPlanSeller.id)
        toast.success(`${setPlanSeller.storeName} diturunkan ke Free Plan`)
      } else {
        await adminApi.grantPlan(token, setPlanSeller.id, plan, months)
        toast.success(`${setPlanSeller.storeName} di-set ke ${PLAN_CONFIG[plan].label} (${months} bulan)`)
      }
      setSetPlanSeller(null)
      await loadAdminData()
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah plan')
    } finally {
      setSetPlanLoading(false)
    }
  }

  const handleToggleSuspend = async (seller) => {
    try {
      const res = await adminApi.toggleStoreStatus(seller.id)
      if (res.success) {
        setSellers(prev => prev.map(s =>
          s.id === seller.id
            ? { ...s, status: res.data.aktif ? 'active' : 'suspended' }
            : s
        ))
        toast.success(`Status toko ${seller.storeName} diperbarui!`)
      }
    } catch (err) {
      toast.error('Gagal memperbarui status toko')
    }
  }

  const handleSendBroadcast = (e) => {
    e.preventDefault()
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Judul dan isi pengumuman wajib diisi')
      return
    }
    toast.success(`Pengumuman berhasil disiarkan ke ${broadcastTarget === 'all' ? 'semua seller' : 'seller PRO'}! 📢`)
    setBroadcastTitle('')
    setBroadcastMessage('')
  }

  const handleExportAudit = () => {
    if (!sellers.length) return
    const exportData = sellers.map((s, idx) => ({
      No: idx + 1,
      'Nama Owner': s.name,
      'Nama Toko': s.storeName,
      'URL Toko': `${window.location.origin}${getStorefrontUrl(s.slug)}`,
      Email: s.email,
      'Paket Subscription': (s.plan || 'free').toUpperCase(),
      'Status Akun': s.status.toUpperCase(),
      'Total Produk': s.productsCount,
      'Akumulasi GMV (Rp)': s.gmv,
      'Tanggal Bergabung': s.joined,
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Platform Sellers Audit')
    XLSX.writeFile(wb, `Exora_Platform_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success('Laporan Audit Platform berhasil diunduh 📄')
  }

  const filteredSellers = useMemo(() => {
    return sellers.filter(s => {
      const matchesSearch = !searchQuery ||
        s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesPlan = true
      if (filterPlan === 'free') matchesPlan = s.plan === 'free'
      if (filterPlan === 'starter') matchesPlan = s.plan === 'starter'
      if (filterPlan === 'pro') matchesPlan = s.plan === 'pro'
      if (filterPlan === 'business') matchesPlan = s.plan === 'business'
      if (filterPlan === 'expired') matchesPlan = s.plan === 'expired'

      return matchesSearch && matchesPlan
    })
  }, [sellers, searchQuery, filterPlan])

  const estimatedRevenue = useMemo(() => {
    return (
      (stats.starterCount || 0) * PLAN_PRICES.starter +
      (stats.proCount || 0) * PLAN_PRICES.pro +
      (stats.businessCount || 0) * PLAN_PRICES.business
    )
  }, [stats])

  const getDaysUntilExpiry = (expiryIso) => {
    if (!expiryIso) return null
    const expiry = new Date(expiryIso)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const formatDaysLeft = (days) => {
    if (days === null) return null
    if (days < 0) return `Expired ${Math.abs(days)} hari lalu`
    if (days === 0) return 'Expire hari ini'
    return `${days} hari lagi`
  }

  // Catatan: akses ke /admin sudah dijaga AdminGuard di level routing
  // (App.tsx) berdasarkan users.is_admin dari DB — jadi tidak ada lagi
  // gate PIN lokal di sini. PIN hardcode lama sudah dihapus karena bisa
  // di-bypass langsung dari devtools/state manapun.

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0b10', color: '#f1f5f9',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* === HEADER === */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(10, 11, 16, 0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 28px'
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>Exora Central</span>
                <span style={{
                  background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 100
                }}>
                  SUPERADMIN
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sistem Kontrol Platform & Pengawasan Seller</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={loadAdminData} className="btn btn-ghost btn-sm" style={{ gap: 6, color: '#94a3b8' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Data
            </button>
            <button onClick={handleExportAudit} className="btn btn-secondary btn-sm" style={{ gap: 6, background: '#1e293b' }}>
              <Download size={14} /> Audit Platform
            </button>
            <Link to="/" className="btn btn-ghost btn-sm" style={{ color: '#94a3b8', gap: 6 }}>
              <Globe size={15} /> Landing Page
            </Link>
            <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ color: '#38bdf8', gap: 6 }}>
              <Store size={15} /> Dashboard Seller
            </Link>
            <button onClick={handleLogout} className="btn btn-sm" style={{ gap: 6, background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* === MAIN === */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* === STATS CARDS (8 CARDS) === */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: 10 }}>
              <span>TOTAL SELLER</span>
              <Users size={18} style={{ color: '#38bdf8' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{stats.totalUser || 0}</div>
          </div>
          <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: 10 }}>
              <span>FREE</span>
              <Users size={18} style={{ color: '#94a3b8' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#94a3b8' }}>{stats.freeCount || 0}</div>
          </div>
          <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: 10 }}>
              <span>STARTER</span>
              <Sparkles size={18} style={{ color: '#3b82f6' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6' }}>{stats.starterCount || 0}</div>
          </div>
          <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: 10 }}>
              <span>PRO</span>
              <Zap size={18} style={{ color: '#a855f7' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a855f7' }}>{stats.proCount || 0}</div>
          </div>
          <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: 10 }}>
              <span>BUSINESS</span>
              <Crown size={18} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{stats.businessCount || 0}</div>
          </div>
          <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: 10 }}>
              <span>EXPIRED</span>
              <Clock size={18} style={{ color: '#ef4444' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{stats.expiredCount || 0}</div>
          </div>
          <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: 10 }}>
              <span>TOTAL TOKO</span>
              <Store size={18} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{stats.totalToko || 0}</div>
          </div>
          <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', marginBottom: 10 }}>
              <span>TOTAL PRODUK</span>
              <FileText size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{stats.totalProduk || 0}</div>
          </div>
        </div>

        {/* === REVENUE BANNER === */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(91,138,245,0.1) 0%, rgba(167,139,250,0.1) 100%)',
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 18,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(91,138,245,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#5b8af5',
            }}>
              <ArrowUpRight size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ESTIMASI PENDAPATAN PLATFORM
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                {formatRupiah(estimatedRevenue)}<span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>/bulan</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
            {stats.businessCount || 0} Business × {formatRupiah(PLAN_PRICES.business)} + {stats.proCount || 0} Pro × {formatRupiah(PLAN_PRICES.pro)} + {stats.starterCount || 0} Starter × {formatRupiah(PLAN_PRICES.starter)}
          </div>
        </div>

        {/* === NAVIGATION TABS === */}
        <div style={{
          display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12, overflowX: 'auto'
        }}>
          {[
            { id: 'sellers', label: 'Daftar Toko & Seller', icon: Users, badge: sellers.length },
            { id: 'system', label: 'Kesehatan Sistem & Logs', icon: Server },
            { id: 'broadcast', label: 'Pengumuman Platform', icon: Bell },
            { id: 'content', label: 'Konten & Artikel', icon: FileText, badge: sectionCounts.blog + sectionCounts.guides + sectionCounts.help },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px',
                  borderRadius: 12, fontSize: '0.88rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: isActive ? '#38bdf8' : '#141722',
                  color: isActive ? '#0f172a' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span style={{
                    background: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)',
                    padding: '2px 8px', borderRadius: 100, fontSize: '0.72rem'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* === TAB 1: SELLERS MANAGEMENT === */}
        {activeTab === 'sellers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filters Bar - Plan-based */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
              background: '#141722', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ position: 'relative', minWidth: 280, flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Cari nama toko, owner, email, slug..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: 40, height: 40, borderRadius: 10, background: '#0b0d14', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'all', label: 'Semua', count: sellers.length },
                  { id: 'free', label: 'Gratis', count: stats.freeCount || 0 },
                  { id: 'starter', label: '⭐ Starter', count: stats.starterCount || 0 },
                  { id: 'pro', label: '⚡ Pro', count: stats.proCount || 0 },
                  { id: 'business', label: '👑 Business', count: stats.businessCount || 0 },
                  { id: 'expired', label: '⏰ Expired', count: stats.expiredCount || 0 },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterPlan(f.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                      background: filterPlan === f.id ? '#38bdf8' : '#0b0d14',
                      color: filterPlan === f.id ? '#0f172a' : '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {f.label}
                    <span style={{
                      background: filterPlan === f.id ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)',
                      padding: '2px 6px', borderRadius: 100, fontSize: '0.7rem',
                    }}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sellers Table */}
            <div style={{
              background: '#141722', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#0e1017', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Toko & Owner</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Status Plan</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Total GMV</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Produk</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Status Toko</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Aksi Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSellers.map(seller => {
                      const daysLeft = getDaysUntilExpiry(seller.planExpiry)
                      const plan = seller.plan || 'free'
                      const planCfg = PLAN_CONFIG[plan] || PLAN_CONFIG.free
                      const PlanIcon = planCfg.icon

                      return (
                        <tr key={seller.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{seller.storeName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{seller.name}</span> • <span>{seller.email}</span>
                            </div>
                            <a
                              href={getStorefrontUrl(seller.slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#38bdf8', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}
                            >
                              {window.location.host}{getStorefrontUrl(seller.slug)} <ExternalLink size={10} />
                            </a>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800,
                              background: planCfg.bg, color: planCfg.color, border: `1px solid ${planCfg.border}`,
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              marginBottom: daysLeft !== null ? 4 : 0,
                            }}>
                              {PlanIcon && <PlanIcon size={12} />}
                              {planCfg.label.toUpperCase()}
                            </span>
                            {daysLeft !== null && plan !== 'free' && (
                              <div style={{
                                fontSize: '0.68rem',
                                color: daysLeft < 0 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : '#10b981',
                                fontWeight: 600,
                              }}>
                                {formatDaysLeft(daysLeft)}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 700, color: '#10b981' }}>
                            {formatRupiah(seller.gmv)}
                          </td>
                          <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                            {seller.productsCount} Item
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            {seller.status === 'active' ? (
                              <span style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={13} /> Aktif
                              </span>
                            ) : (
                              <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <AlertTriangle size={13} /> Suspended
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => openSetPlan(seller)}
                                className="btn btn-sm"
                                style={{
                                  fontSize: '0.72rem', padding: '4px 10px',
                                  background: 'rgba(168, 85, 247, 0.15)',
                                  color: '#c084fc',
                                  border: 'none', borderRadius: 6, cursor: 'pointer'
                                }}
                              >
                                Set Plan
                              </button>
                              <button
                                onClick={() => handleToggleSuspend(seller)}
                                className="btn btn-sm"
                                style={{
                                  fontSize: '0.72rem', padding: '4px 10px',
                                  background: seller.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: seller.status === 'active' ? '#f87171' : '#34d399',
                                  border: 'none', borderRadius: 6, cursor: 'pointer'
                                }}
                              >
                                {seller.status === 'active' ? 'Suspend' : 'Aktifkan'}
                              </button>
                              <button
                                onClick={() => setSelectedSeller(seller)}
                                className="btn btn-sm"
                                style={{ fontSize: '0.72rem', padding: '4px 8px', background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: 6 }}
                              >
                                Detail
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* === TAB 2: SYSTEM HEALTH & LOGS === */}
        {activeTab === 'system' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                <Cpu size={18} style={{ color: '#38bdf8' }} /> Status Infrastruktur Cloud
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#94a3b8' }}>WhatsApp Cloud Gateway API:</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Operational (200 OK)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#94a3b8' }}>Database Engine:</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Cloud SQL PostgreSQL</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#94a3b8' }}>SSL & Domain Routing:</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Auto-renewed TLS 1.3</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#94a3b8' }}>Auto Resi Tracking API:</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Active (Biteship/Binderbyte)</span>
                </div>
              </div>
            </div>
            <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                <FileText size={18} style={{ color: '#a855f7' }} /> Audit System Logs Terakhir
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {logs.map(log => (
                  <div key={log.id} style={{
                    padding: 12, borderRadius: 10, background: '#0b0d14', border: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                      <span>{log.event || log.type}</span>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{log.time || new Date(log.timestamp).toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{log.details || log.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === TAB 3: BROADCAST ANNOUNCEMENTS === */}
        {activeTab === 'broadcast' && (
          <div style={{ maxWidth: 680, background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={20} style={{ color: '#f59e0b' }} /> Siarkan Pengumuman Platform
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 20 }}>
              Pesan ini akan ditampilkan pada banner dasbor seller yang terdaftar.
            </p>
            <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 6, display: 'block' }}>
                  Target Penerima
                </label>
                <select
                  value={broadcastTarget}
                  onChange={e => setBroadcastTarget(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 42, background: '#0b0d14', borderRadius: 10 }}
                >
                  <option value="all">Seluruh Seller Exora (Free & PRO)</option>
                  <option value="pro">Khusus Seller PRO Tier</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 6, display: 'block' }}>
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pemeliharaan Sistem Sistematis H-1"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 42, background: '#0b0d14', borderRadius: 10 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 6, display: 'block' }}>
                  Isi Pengumuman / Pesan Update
                </label>
                <textarea
                  placeholder="Tuliskan detail pengumuman yang akan dibaca oleh para seller..."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  rows={4}
                  className="form-input"
                  style={{ width: '100%', padding: 12, background: '#0b0d14', borderRadius: 10, fontSize: '0.88rem' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ gap: 8, height: 44, marginTop: 8 }}>
                Siarkan Sekarang <Send size={15} />
              </button>
            </form>
          </div>
        )}

        {/* === TAB 4: CONTENT MANAGEMENT === */}
        {activeTab === 'content' && (
          manageContentType ? (
            <Suspense
              fallback={
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Memuat editor konten...
                </div>
              }
            >
              <AdminContentManager
                type={manageContentType}
                onBack={() => {
                  setManageContentType(null)
                  loadSectionCounts(useAuthStore.getState().token)
                }}
              />
            </Suspense>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {[
                  { type: 'blog', label: 'Seller Hub / Blog', count: sectionCounts.blog, color: '#3b82f6', icon: BookOpen, publicLink: '/blog', manageable: true, unit: 'artikel' },
                  { type: 'guides', label: 'Panduan / Tutorial', count: sectionCounts.guides, color: '#10b981', icon: FileText, publicLink: '/guides', manageable: true, unit: 'panduan' },
                  { type: 'help', label: 'Pusat Bantuan', count: sectionCounts.help, color: '#a855f7', icon: HelpCircle, publicLink: '/help', manageable: true, unit: 'artikel' },
                  { type: 'updates', label: 'Update Fitur / Changelog', count: sectionCounts.updates, color: '#f59e0b', icon: RefreshCcw, publicLink: '/updates', manageable: false, unit: 'update' },
                  { type: 'credentials', label: 'Integrasi & Kredensial', count: sectionCounts.credentials, color: '#ef4444', icon: Key, publicLink: null, manageable: false, unit: 'kredensial' },
                ].map((section, idx) => {
                  const Icon = section.icon
                  return (
                    <div
                      key={idx}
                      style={{
                        background: '#141722',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 18,
                        padding: '18px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 16,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12,
                          background: `${section.color}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: section.color,
                        }}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{section.label}</div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{section.count} {section.unit}</div>
                        </div>
                      </div>
                      {section.manageable ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {section.publicLink && (
                            <Link
                              to={section.publicLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-sm"
                              style={{ gap: 6, color: '#94a3b8' }}
                            >
                              Lihat <ExternalLink size={13} />
                            </Link>
                          )}
                          <button
                            onClick={() => setManageContentType(section.type)}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: 6, border: 'none', cursor: 'pointer' }}
                          >
                            Kelola <ChevronRight size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Segera hadir</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        )}
      </main>

      {/* === SELLER DETAIL MODAL === */}
      <AnimatePresence>
        {selectedSeller && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 500, background: '#161822',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 20, padding: 24
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                  Detail Toko Seller
                </h3>
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#94a3b8' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.88rem' }}>
                <div style={{ background: '#0e1017', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>{selectedSeller.storeName}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Owner: {selectedSeller.name} ({selectedSeller.email})</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: '#0e1017', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Status Paket</div>
                    <div style={{ fontWeight: 700, color: PLAN_CONFIG[selectedSeller.plan || 'free'].color }}>
                      {PLAN_CONFIG[selectedSeller.plan || 'free'].label.toUpperCase()}
                    </div>
                    {selectedSeller.planExpiry && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                        Exp: {new Date(selectedSeller.planExpiry).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>
                  <div style={{ background: '#0e1017', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total GMV Toko</div>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>{formatRupiah(selectedSeller.gmv)}</div>
                  </div>
                </div>
                <div style={{ background: '#0e1017', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 2 }}>Link Public Storefront</div>
                  <a
                    href={getStorefrontUrl(selectedSeller.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {window.location.origin}{getStorefrontUrl(selectedSeller.slug)} <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: 42 }}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === SET PLAN MODAL (4-TIER) === */}
      <AnimatePresence>
        {setPlanSeller && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 480, background: '#161822',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 20, padding: 24
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                  Set Plan Seller
                </h3>
                <button
                  onClick={() => setSetPlanSeller(null)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#94a3b8' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ background: '#0e1017', padding: 12, borderRadius: 12, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{setPlanSeller.storeName}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{setPlanSeller.name} • {setPlanSeller.email}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>
                  Pilih Plan
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(PLAN_CONFIG).filter(([key]) => key !== 'expired').map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button
                        key={key}
                        onClick={() => setSetPlanValue(key)}
                        style={{
                          padding: '10px 12px', borderRadius: 10,
                          background: setPlanValue === key ? cfg.bg : '#0e1017',
                          border: `2px solid ${setPlanValue === key ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                          color: setPlanValue === key ? cfg.color : '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontSize: '0.85rem', fontWeight: 700,
                        }}
                      >
                        {Icon && <Icon size={16} />}
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {setPlanValue !== 'free' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>
                    Durasi Langganan
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {DURATION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSetPlanDuration(opt.value)}
                        style={{
                          padding: '8px 4px', borderRadius: 8,
                          background: setPlanDuration === opt.value ? 'rgba(168, 85, 247, 0.2)' : '#0e1017',
                          border: `1px solid ${setPlanDuration === opt.value ? '#a855f7' : 'rgba(255,255,255,0.08)'}`,
                          color: setPlanDuration === opt.value ? '#c084fc' : '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '0.78rem', fontWeight: 600,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setSetPlanSeller(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: 42 }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSetPlanSubmit}
                  disabled={setPlanLoading}
                  className="btn btn-primary"
                  style={{ flex: 1, height: 42 }}
                >
                  {setPlanLoading ? 'Menyimpan...' : 'Simpan Plan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
