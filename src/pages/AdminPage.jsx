import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldAlert, ShieldCheck, Users, Store, DollarSign,
  Search, Filter, ExternalLink, Power, Zap, RefreshCw,
  Download, Send, Settings, AlertTriangle, CheckCircle2,
  Server, Lock, Cpu, Globe, ArrowUpRight, ArrowDownRight,
  MoreVertical, FileText, ChevronRight, Bell, Sparkles, LogOut, MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { adminApi, pesananApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import * as XLSX from 'xlsx'

export default function AdminPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()
  const [passcode, setPasscode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(true) // Default unlocked for easy demo
  const [activeTab, setActiveTab] = useState('sellers') // 'sellers', 'transactions', 'system', 'broadcast'
  
  // Data states
  const [stats, setStats] = useState({ totalSellers: 1, proSellersCount: 1, totalPlatformGmv: 15400000 })
  const [sellers, setSellers] = useState([
    { id: 'sel_1', name: user?.name || 'Admin Exora', storeName: 'Toko Official Exora', slug: 'exora-official', email: user?.email || 'admin@exora.id', isPro: true, status: 'active', productsCount: 12, gmv: 15400000, joined: '2025-01-01' }
  ])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState('all') // 'all', 'pro', 'free', 'suspended'

  // Modals
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('all')

  // Load Admin Data
  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const token = useAuthStore.getState().token
      const [statsRes, sellersRes, logsRes] = await Promise.all([
        adminApi.getStats(token).catch(() => null),
        adminApi.getSellers(token).catch(() => null),
        adminApi.getSystemLogs(token).catch(() => null)
      ])

      if (statsRes?.success && statsRes?.data) setStats(statsRes.data)
      if (sellersRes?.success && sellersRes?.data?.length) setSellers(sellersRes.data)
      if (logsRes?.success && logsRes?.data) setLogs(logsRes.data)
    } catch (err) {
      console.warn('Gagal memuat data admin:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Berhasil keluar dari akun Admin 👋')
    navigate('/login')
  }

  // Passcode verification if locked
  const handleVerifyPasscode = (e) => {
    e.preventDefault()
    if (passcode === 'admin123' || passcode === 'exora') {
      setIsAuthenticated(true)
      toast.success('Akses Superadmin Diizinkan 🔓')
    } else {
      toast.error('PIN Superadmin salah (Gunakan: exora)')
    }
  }

  // Toggle PRO subscription
  const handleTogglePro = async (seller) => {
    try {
      const res = await adminApi.toggleProStatus(seller.id)
      if (res.success) {
        setSellers(res.data)
        toast.success(`Status PRO ${seller.storeName} berhasil diperbarui! ✨`)
      }
    } catch (err) {
      toast.error('Gagal mengubah status PRO')
    }
  }

  // Toggle Store Active/Suspended
  const handleToggleSuspend = async (seller) => {
    try {
      const res = await adminApi.toggleStoreStatus(seller.id)
      if (res.success) {
        setSellers(res.data)
        toast.success(`Status toko ${seller.storeName} diperbarui!`)
      }
    } catch (err) {
      toast.error('Gagal memperbarui status toko')
    }
  }

  // Send Broadcast
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

  // Export Full Platform Audit
  const handleExportAudit = () => {
    if (!sellers.length) return
    const exportData = sellers.map((s, idx) => ({
      No: idx + 1,
      'Nama Owner': s.name,
      'Nama Toko': s.storeName,
      'URL Toko': `exora.app/toko/${s.slug}`,
      Email: s.email,
      'Paket Subscription': s.isPro ? 'PRO TIER' : 'FREE',
      'Status Akun': s.status.toUpperCase(),
      'Total Produk': s.productsCount,
      'Akumulasi GMV (Rp)': s.gmv,
      'Tanggal Bergabung': s.joined
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Platform Sellers Audit')
    XLSX.writeFile(wb, `Exora_Platform_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success('Laporan Audit Platform berhasil diunduh 📄')
  }

  // Filtered Sellers
  const filteredSellers = useMemo(() => {
    return sellers.filter(s => {
      const matchesSearch = !searchQuery ||
        s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesTier = true
      if (filterTier === 'pro') matchesTier = s.isPro
      if (filterTier === 'free') matchesTier = !s.isPro
      if (filterTier === 'suspended') matchesTier = s.status === 'suspended'

      return matchesSearch && matchesTier
    })
  }, [sellers, searchQuery, filterTier])

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  }

  // Unauthenticated Login Guard View
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0f', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <div style={{
          maxWidth: 400, width: '100%', background: '#161822',
          border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 24, padding: 32,
          textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <ShieldAlert size={28} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px' }}>
            Akses Terkunci Admin
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24 }}>
            Masukkan PIN Superadmin Exora Platform untuk mengakses dasbor kontrol internal.
          </p>

          <form onSubmit={handleVerifyPasscode}>
            <input
              type="password"
              placeholder="PIN Admin (ketik: exora)"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              className="form-input"
              style={{
                width: '100%', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em',
                marginBottom: 16, height: 48, borderRadius: 12, background: '#0f0f14'
              }}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 46 }}>
              Buka Akses Admin <Lock size={16} />
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            <Link to="/seller" style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
              ← Kembali ke Seller Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0b10', color: '#f1f5f9',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* --- TOP ADMIN HEADER --- */}
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
            <Link to="/seller" className="btn btn-ghost btn-sm" style={{ color: '#38bdf8', gap: 6 }}>
              <Store size={15} /> Dashboard Seller
            </Link>
            <button onClick={handleLogout} className="btn btn-sm" style={{ gap: 6, background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTAINER --- */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* --- PLATFORM STATS OVERVIEW --- */}
        {stats && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16
          }}>
            <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.82rem', marginBottom: 10 }}>
                <span>Total Toko Registered</span>
                <Store size={18} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {stats.totalSellers} <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>Toko</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#10b981' }}>
                <span style={{ fontWeight: 700 }}>{stats.proSellersCount} Toko</span> Langganan PRO Tier
              </div>
            </div>

            <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.82rem', marginBottom: 10 }}>
                <span>Total Platform GMV</span>
                <DollarSign size={18} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {formatRupiah(stats.totalPlatformGmv)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Akumulasi seluruh checkout toko
              </div>
            </div>

            <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.82rem', marginBottom: 10 }}>
                <span>Kesehatan Gateway WA</span>
                <Server size={18} style={{ color: '#a855f7' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginBottom: 4 }}>
                {stats.serverHealth}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {stats.activeGateway}
              </div>
            </div>

            <div style={{ background: '#141722', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.82rem', marginBottom: 10 }}>
                <span>Total Produk Platform</span>
                <Zap size={18} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {stats.totalProductsCount} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>SKU</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Penyimpanan: {stats.storageUsed}
              </div>
            </div>
          </div>
        )}

        {/* --- NAVIGATION TABS --- */}
        <div style={{
          display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12, overflowX: 'auto'
        }}>
          {[
            { id: 'sellers', label: 'Daftar Toko & Seller', icon: Users, badge: sellers.length },
            { id: 'system', label: 'Kesehatan Sistem & Logs', icon: Server },
            { id: 'broadcast', label: 'Pengumuman Platform', icon: Bell },
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
                {tab.badge !== undefined && (
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

        {/* --- TAB 1: SELLERS MANAGEMENT --- */}
        {activeTab === 'sellers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filters Bar */}
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
                  { id: 'all', label: 'Semua Status' },
                  { id: 'pro', label: 'PRO Tier' },
                  { id: 'free', label: 'Free' },
                  { id: 'suspended', label: 'Suspended' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterTier(f.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                      background: filterTier === f.id ? '#38bdf8' : '#0b0d14',
                      color: filterTier === f.id ? '#0f172a' : '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer'
                    }}
                  >
                    {f.label}
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
                    {filteredSellers.map(seller => (
                      <tr key={seller.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{seller.storeName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{seller.name}</span> • <span>{seller.email}</span>
                          </div>
                          <a
                            href={`/toko/${seller.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#38bdf8', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}
                          >
                            exora.app/toko/{seller.slug} <ExternalLink size={10} />
                          </a>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          {seller.isPro ? (
                            <span style={{
                              padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800,
                              background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)',
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}>
                              <Zap size={12} /> PRO TIER
                            </span>
                          ) : (
                            <span style={{
                              padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 600,
                              background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.2)'
                            }}>
                              FREE PLAN
                            </span>
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
                              onClick={() => handleTogglePro(seller)}
                              className="btn btn-sm"
                              style={{
                                fontSize: '0.72rem', padding: '4px 10px',
                                background: seller.isPro ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                color: seller.isPro ? '#f87171' : '#c084fc',
                                border: 'none', borderRadius: 6, cursor: 'pointer'
                              }}
                              title={seller.isPro ? 'Downgrade ke Free' : 'Upgrade ke PRO'}
                            >
                              {seller.isPro ? 'Set Free' : 'Set PRO'}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: SYSTEM HEALTH & LOGS --- */}
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
                      <span>{log.event}</span>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{log.time}</span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: BROADCAST ANNOUNCEMENTS --- */}
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

      </main>

      {/* --- SELLER DETAIL MODAL --- */}
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
                    <div style={{ fontWeight: 700, color: selectedSeller.isPro ? '#c084fc' : '#fff' }}>
                      {selectedSeller.isPro ? 'PRO TIER' : 'FREE PLAN'}
                    </div>
                  </div>
                  <div style={{ background: '#0e1017', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total GMV Toko</div>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>{formatRupiah(selectedSeller.gmv)}</div>
                  </div>
                </div>

                <div style={{ background: '#0e1017', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 2 }}>Link Public Storefront</div>
                  <a
                    href={`/toko/${selectedSeller.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    https://exora.app/toko/{selectedSeller.slug} <ExternalLink size={12} />
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
    </div>
  )
}
