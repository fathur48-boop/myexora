import React, { useState, useEffect } from 'react'
import {
  Tag, Plus, Trash2, CheckCircle2, Clock, Zap, Percent, DollarSign,
  AlertCircle, Copy, Share2, Sparkles, Gift, Search, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/seller/DashboardLayout'
import { promoApi, flashSaleApi } from '../lib/api'
import { formatRupiah } from '../lib/utils'

export default function PromoPage() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal Create Promo
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [kode, setKode] = useState('')
  const [tipe, setTipe] = useState('persen') // 'persen' | 'nominal'
  const [nilai, setNilai] = useState('')
  const [minBelanja, setMinBelanja] = useState('50000')
  const [kuota, setKuota] = useState('100')

  // Search filter
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadPromos()
  }, [])

  const loadPromos = async () => {
    setLoading(true)
    try {
      const res = await promoApi.getMine()
      if (res.success && Array.isArray(res.data)) {
        setPromos(res.data)
      }
    } catch (err) {
      console.error('Error loading promos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePromo = async (e) => {
    e.preventDefault()
    if (!kode.trim() || !nilai) {
      toast.error('Kode promo dan Nilai Diskon wajib diisi!')
      return
    }

    try {
      const res = await promoApi.create('token', {
        kode: kode.trim().toUpperCase(),
        tipe,
        nilai: Number(nilai),
        minBelanja: Number(minBelanja) || 0,
        kuota: Number(kuota) || 100
      })

      if (res.success) {
        toast.success(`Voucher '${kode.toUpperCase()}' berhasil dibuat! 🎉`)
        setIsModalOpen(false)
        setKode('')
        setNilai('')
        loadPromos()
      }
    } catch (err) {
      toast.error('Gagal membuat voucher promo')
    }
  }

  const handleDeletePromo = async (id) => {
    if (confirm('Apakah kamu yakin ingin menghapus voucher promo ini?')) {
      await promoApi.delete('token', id)
      toast.success('Voucher berhasil dihapus')
      loadPromos()
    }
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success(`Kode '${code}' disalin ke clipboard! 📋`)
  }

  const filteredPromos = promos.filter(p => p.kode.toLowerCase().includes(search.toLowerCase()))

  return (
    <DashboardLayout title="Kupon & Voucher Promo">
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Banner Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(168, 85, 247, 0.15))',
          border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 20, padding: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Tag size={22} style={{ color: '#38bdf8' }} />
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>Voucher Promo & Diskon Toko</h1>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: 0 }}>
              Tingkatkan omzet penjualan hingga 3x lipat dengan menawarkan kupon promo spesial untuk pembeli WhatsApp.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ gap: 8, height: 44, padding: '0 20px', fontSize: '0.9rem', fontWeight: 800 }}
          >
            <Plus size={18} /> Buat Kupon Baru
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 4 }}>TOTAL VOUCHER</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{promos.length} Kupon</div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 4 }}>VOUCHER AKTIF</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>
              {promos.filter(p => p.status === 'aktif').length} Aktif
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 4 }}>TOTAL DITEBUS PEMBELI</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc' }}>
              {promos.reduce((sum, p) => sum + (p.terpakai || 0), 0)} Kali
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Cari kode kupon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 40, width: '100%', height: 42, borderRadius: 12 }}
            />
          </div>
          <button onClick={loadPromos} className="btn btn-secondary" style={{ height: 42, padding: '0 16px', gap: 6 }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Promos Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Memuat data voucher...</div>
        ) : filteredPromos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
            <Tag size={48} style={{ color: '#64748b', marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Belum Ada Kupon Promo</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Klik tombol "Buat Kupon Baru" untuk menambah promo diskon.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {filteredPromos.map(p => (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                  borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden'
                }}
              >
                {/* Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800,
                    background: p.status === 'aktif' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: p.status === 'aktif' ? '#34d399' : '#f87171'
                  }}>
                    {p.status.toUpperCase()}
                  </span>

                  <button
                    onClick={() => handleDeletePromo(p.id)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}
                    title="Hapus Voucher"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Voucher Code Box */}
                <div style={{
                  background: 'rgba(56, 189, 248, 0.08)', border: '1px dashed #38bdf8',
                  borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center',
                  justify: 'space-between', marginBottom: 16
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Kode Kupon</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8', letterSpacing: 1 }}>{p.kode}</div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(p.kode)}
                    className="btn btn-sm btn-ghost"
                    style={{ color: '#fff', background: 'rgba(255,255,255,0.1)' }}
                  >
                    <Copy size={14} /> Salin
                  </button>
                </div>

                {/* Details */}
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>Diskon: <strong style={{ color: '#fff' }}>{p.tipe === 'persen' ? `${p.nilai}%` : formatRupiah(p.nilai)}</strong></div>
                  <div>Min. Belanja: <strong style={{ color: '#fff' }}>{formatRupiah(p.minBelanja)}</strong></div>
                  <div>Terpakai: <strong style={{ color: '#38bdf8' }}>{p.terpakai} / {p.kuota} Kuota</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal Create Promo */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 460, background: '#141722',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 24, padding: 24
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag size={20} style={{ color: '#38bdf8' }} /> Buat Kupon Diskon Baru
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm" style={{ color: '#94a3b8' }}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePromo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 6, display: 'block' }}>
                    Kode Kupon (kapital, tanpa spasi) *
                  </label>
                  <input
                    type="text"
                    placeholder="misal: DISKON20, EXORA10"
                    value={kode}
                    onChange={e => setKode(e.target.value.toUpperCase())}
                    className="form-input"
                    style={{ width: '100%', height: 42, background: '#0b0d14', borderRadius: 10, fontSize: '0.9rem', fontWeight: 800 }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 6, display: 'block' }}>
                      Tipe Diskon
                    </label>
                    <select
                      value={tipe}
                      onChange={e => setTipe(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', height: 42, background: '#0b0d14', borderRadius: 10, fontSize: '0.85rem' }}
                    >
                      <option value="persen">Persentase (%)</option>
                      <option value="nominal">Nominal Rupiah (Rp)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 6, display: 'block' }}>
                      Nilai Diskon *
                    </label>
                    <input
                      type="number"
                      placeholder={tipe === 'persen' ? 'misal: 15' : 'misal: 10000'}
                      value={nilai}
                      onChange={e => setNilai(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', height: 42, background: '#0b0d14', borderRadius: 10, fontSize: '0.85rem' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 6, display: 'block' }}>
                      Min. Belanja (Rp)
                    </label>
                    <input
                      type="number"
                      placeholder="misal: 50000"
                      value={minBelanja}
                      onChange={e => setMinBelanja(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', height: 42, background: '#0b0d14', borderRadius: 10, fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 6, display: 'block' }}>
                      Kuota Kupon
                    </label>
                    <input
                      type="number"
                      placeholder="misal: 100"
                      value={kuota}
                      onChange={e => setKuota(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', height: 42, background: '#0b0d14', borderRadius: 10, fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: 46, borderRadius: 12, background: '#2563eb', fontWeight: 800, marginTop: 8 }}
                >
                  Simpan Voucher Promo
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
