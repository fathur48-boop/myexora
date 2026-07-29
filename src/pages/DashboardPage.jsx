import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, DollarSign, TrendingUp, Users, ArrowUpRight,
  Copy, Check, ExternalLink, Package, Plus, Sparkles, Zap,
  Eye, AlertCircle, Clock, Truck, CheckCircle2, ChevronRight,
  BarChart2, Store, RefreshCw, Layers, Bell
} from 'lucide-react'
import DashboardLayout from '../components/seller/DashboardLayout'
import { useAuthStore, useTokoStore, useProdukStore } from '../lib/store'
import { pesananApi } from '../lib/api'
import { formatRupiah, formatDateTime, PESANAN_STATUS, isPro } from '../lib/utils'
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const { toko, load: loadToko } = useTokoStore()
  const { produk, load: loadProduk } = useProdukStore()
  const { permission, requestPermission } = useRealtimeNotifications(toko?.id)

  const [pesanan, setPesanan] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    loadToko(token)
    loadProduk(token)
    fetchPesanan()
  }, [token])

  const fetchPesanan = async () => {
    setLoading(true)
    try {
      const res = await pesananApi.getMine(token)
      if (res.success) {
        setPesanan(res.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculated Metrics
  const validPesanan = pesanan.filter(p => p.status !== 'cancelled')
  const totalOmset = validPesanan.reduce((sum, p) => sum + (p.total || 0), 0)

  // Profit calculation: Omset - HPP
  // Match item names or default HPP calculation
  const totalHPP = validPesanan.reduce((sum, p) => {
    if (p.items && p.items.length > 0) {
      return sum + p.items.reduce((iSum, item) => {
        const prod = produk.find(pr => pr.nama === item.nama)
        const hpp = prod && prod.hpp ? prod.hpp : item.harga * 0.5
        return iSum + (hpp * item.qty)
      }, 0)
    } else {
      const prod = produk.find(pr => pr.nama === p.produkNama)
      const hpp = prod && prod.hpp ? prod.hpp : (p.total || 0) * 0.5
      return sum + hpp
    }
  }, 0)

  const estimasiProfit = Math.max(0, totalOmset - totalHPP)

  const pendingCount = pesanan.filter(p => p.status === 'pending').length
  const processingCount = pesanan.filter(p => p.status === 'processing' || p.status === 'confirmed').length
  const shippedCount = pesanan.filter(p => p.status === 'shipped').length
  const doneCount = pesanan.filter(p => p.status === 'done').length

  const activeProducts = produk.filter(p => p.aktif !== false)
  const lowStockProducts = produk.filter(p => (p.stok || 0) <= 5)

  const tokoSlug = toko?.slug || 'tokosaya'
  const storeUrl = `${window.location.origin}/toko/${tokoSlug}`

  const handleCopyStoreUrl = () => {
    navigator.clipboard.writeText(storeUrl)
    setCopiedLink(true)
    toast.success('Link toko berhasil disalin!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // Parse product images
  const getProductImage = (p) => {
    if (!p || !p.foto) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'
    try {
      const parsed = JSON.parse(p.foto)
      return Array.isArray(parsed) && parsed[0] ? parsed[0] : p.foto
    } catch {
      return p.foto
    }
  }

  return (
    <DashboardLayout title="Dashboard Overview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>

        {/* Banner Welcome & Store Link */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(91, 138, 245, 0.15) 0%, rgba(30, 41, 59, 0.6) 100%)',
          border: '1px solid rgba(91, 138, 245, 0.3)',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Halo, {toko?.nama || user?.nama || 'Seller'}! 👋
              </h1>
              <span className={`badge ${isPro(user?.plan || user) ? 'badge-accent' : 'badge-secondary'}`} style={{ fontSize: '0.72rem' }}>
                {isPro(user?.plan || user) ? 'EXORA PRO' : 'STARTER'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Berikut ringkasan performa toko online kamu hari ini.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={requestPermission}
              className="btn btn-secondary btn-sm"
              style={{
                gap: 6,
                background: permission === 'granted' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                borderColor: permission === 'granted' ? 'rgba(34, 197, 94, 0.4)' : undefined,
                color: permission === 'granted' ? '#4ade80' : 'var(--text-primary)',
              }}
              title="Aktifkan Notifikasi Pop-up Pesanan di HP/Laptop"
            >
              <Bell size={14} />
              {permission === 'granted' ? 'Notif Aktif 🔔' : 'Aktifkan Push Notif'}
            </button>
            <Link
              to="/dashboard/analytics"
              className="btn btn-secondary btn-sm"
              style={{ gap: 6, background: 'rgba(255, 255, 255, 0.08)' }}
            >
              <BarChart2 size={14} /> Analitik
            </Link>
            <button
              onClick={handleCopyStoreUrl}
              className="btn btn-secondary btn-sm"
              style={{ gap: 6, background: 'rgba(255, 255, 255, 0.08)' }}
            >
              {copiedLink ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              {copiedLink ? 'Tersalin' : 'Salin Link Toko'}
            </button>
            <a
              href={`/toko/${tokoSlug}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
              style={{ gap: 6 }}
            >
              <ExternalLink size={14} /> Lihat Toko
            </a>
          </div>
        </div>

        {/* Quick Pending Alert Notice */}
        {pendingCount > 0 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={18} color="#f59e0b" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f59e0b' }}>
                Ada {pendingCount} pesanan baru menunggu konfirmasi dari kamu!
              </span>
            </div>
            <Link to="/pesanan?status=pending" className="btn btn-warning btn-sm" style={{ gap: 6 }}>
              Proses Pesanan Sekarang <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Stats Grid Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {/* Omset Card */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg, 12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                TOTAL OMSET
              </span>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DollarSign size={18} />
              </div>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {formatRupiah(totalOmset)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#22c55e' }}>
              <TrendingUp size={12} />
              <span>{validPesanan.length} transaksi berhasil</span>
            </div>
          </div>

          {/* Profit Card */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg, 12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                ESTIMASI PROFIT BERSIH
              </span>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'rgba(91, 138, 245, 0.15)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--accent)' }}>
              {formatRupiah(estimasiProfit)}
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Omset dikurangi HPP produk
            </div>
          </div>

          {/* Total Pesanan Card */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg, 12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                TOTAL PESANAN
              </span>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShoppingBag size={18} />
              </div>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {pesanan.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>pesanan</span>
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {pendingCount > 0 ? `${pendingCount} perlu diproses` : 'Semua terproses lancar'}
            </div>
          </div>

          {/* Total Produk Card */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg, 12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                PRODUK AKTIF
              </span>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package size={18} />
              </div>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              {activeProducts.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>produk</span>
            </p>
            <div style={{ fontSize: '0.75rem', color: lowStockProducts.length > 0 ? '#f59e0b' : 'var(--text-tertiary)' }}>
              {lowStockProducts.length > 0 ? `⚠️ ${lowStockProducts.length} stok menipis` : 'Stok produk aman'}
            </div>
          </div>
        </div>

        {/* Status Distribution Progress Bar */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg, 12px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={16} color="var(--accent)" /> Status Pesanan
            </h3>
            <Link to="/pesanan" style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Lihat Semua
            </Link>
          </div>

          {pesanan.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', margin: 0 }}>Belum ada transaksi pesanan.</p>
          ) : (
            <div>
              {/* Stacked Progress Bar */}
              <div style={{
                height: 12, borderRadius: 100, background: 'var(--surface)',
                overflow: 'hidden', display: 'flex', marginBottom: 16,
              }}>
                <div style={{ width: `${(pendingCount / pesanan.length) * 100}%`, background: '#f59e0b' }} title="Menunggu" />
                <div style={{ width: `${(processingCount / pesanan.length) * 100}%`, background: '#3b82f6' }} title="Diproses" />
                <div style={{ width: `${(shippedCount / pesanan.length) * 100}%`, background: '#a855f7' }} title="Dikirim" />
                <div style={{ width: `${(doneCount / pesanan.length) * 100}%`, background: '#22c55e' }} title="Selesai" />
              </div>

              {/* Status Legend */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ color: 'var(--text-tertiary)' }}>Menunggu:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{pendingCount}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                  <span style={{ color: 'var(--text-tertiary)' }}>Diproses:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{processingCount}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} />
                  <span style={{ color: 'var(--text-tertiary)' }}>Dikirim:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{shippedCount}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ color: 'var(--text-tertiary)' }}>Selesai:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{doneCount}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2 Column Layout: Recent Orders & Top Products */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

          {/* Pesanan Terbaru */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg, 12px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={16} color="var(--accent)" /> Pesanan Terbaru
              </h3>
              <Link to="/pesanan" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
                Kelola <ChevronRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 54, borderRadius: 8 }} />
                ))}
              </div>
            ) : pesanan.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-tertiary)' }}>
                <ShoppingBag size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p style={{ fontSize: '0.85rem', margin: 0 }}>Belum ada pesanan terdaftar</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {pesanan.slice(0, 5).map(p => {
                  const statusCfg = PESANAN_STATUS[p.status] || PESANAN_STATUS.pending
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/invoice/${p.orderId || p.id}`)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md, 8px)',
                        background: 'var(--surface)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'transform 0.15s, border-color 0.15s',
                      }}
                      className="hover-card"
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {p.buyerNama || 'Pembeli'}
                          </span>
                          <span className={`badge badge-${statusCfg.color}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {p.orderId ? `${p.orderId} · ` : ''}{p.produkNama ? `${p.produkNama} (x${p.qty})` : 'Item Pesanan'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--accent)' }}>
                          {formatRupiah(p.total)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          {formatDateTime(p.createdAt)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Produk Katalog Overview */}
          <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg, 12px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={16} color="var(--accent)" /> Katalog Produk
              </h3>
              <Link to="/produk" className="btn btn-primary btn-sm" style={{ gap: 4, padding: '4px 10px', fontSize: '0.78rem' }}>
                <Plus size={13} /> Tambah Produk
              </Link>
            </div>

            {produk.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-tertiary)' }}>
                <Package size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p style={{ fontSize: '0.85rem', margin: '0 0 12px' }}>Belum ada produk di toko kamu</p>
                <Link to="/produk" className="btn btn-secondary btn-sm">
                  + Tambah Produk Pertama
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {produk.slice(0, 5).map(p => {
                  const img = getProductImage(p)
                  const isLow = (p.stok || 0) <= 5
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md, 8px)',
                        background: 'var(--surface)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <img
                        src={img}
                        alt={p.nama}
                        style={{
                          width: 42, height: 42, borderRadius: 6,
                          objectFit: 'cover', flexShrink: 0,
                          background: 'var(--bg-secondary)',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {p.nama}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {p.kategori || 'Umum'} · Stok: <span style={{ color: isLow ? '#f59e0b' : 'var(--text-secondary)', fontWeight: isLow ? 700 : 400 }}>{p.stok || 0}</span>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', flexShrink: 0 }}>
                        {formatRupiah(p.harga)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
