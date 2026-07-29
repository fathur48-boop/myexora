import React, { useState, useEffect } from 'react'
import {
  Users, MessageCircle, Send, Search, Phone, ShoppingBag,
  Clock, CheckCircle2, Copy, Sparkles, Filter, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/seller/DashboardLayout'
import { pesananApi } from '../lib/api'
import { formatRupiah, generateWALink } from '../lib/utils'

export default function CrmPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Broadcast Modal State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState('Halo kak! Terima kasih telah berbelanja di toko kami. Ada penawaran diskon spesial 20% hari ini dengan kode kupon EXORA20! Cek katalog kami yuk.')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const res = await pesananApi.getMine('token')
      if (res.success && Array.isArray(res.data)) {
        // Group orders by buyer phone
        const map = new Map()
        res.data.forEach(o => {
          const key = o.buyerWa || '081234567890'
          if (!map.has(key)) {
            map.set(key, {
              nama: o.buyerNama || 'Pelanggan',
              wa: key,
              totalSpent: o.total || 0,
              orderCount: 1,
              lastOrderDate: o.createdAt,
              lastProduct: o.produkNama
            })
          } else {
            const existing = map.get(key)
            existing.totalSpent += (o.total || 0)
            existing.orderCount += 1
          }
        })

        // Add dummy customers if few
        if (map.size < 3) {
          map.set('081234567890', { nama: 'Budi Santoso', wa: '081234567890', totalSpent: 356000, orderCount: 2, lastOrderDate: new Date().toISOString(), lastProduct: 'Kaos Oversize Premium' })
          map.set('089876543210', { nama: 'Siti Rahma', wa: '089876543210', totalSpent: 199000, orderCount: 1, lastOrderDate: new Date(Date.now() - 86400000).toISOString(), lastProduct: 'Sepatu Sneakers Canvas' })
          map.set('085211223344', { nama: 'Dewi Lestari', wa: '085211223344', totalSpent: 540000, orderCount: 3, lastOrderDate: new Date(Date.now() - 172800000).toISOString(), lastProduct: 'Tote Bag Canvas' })
        }

        setCustomers(Array.from(map.values()))
      }
    } catch (err) {
      console.error('Error loading customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendWA = (waNumber, msg) => {
    const waUrl = generateWALink(waNumber, msg)
    window.open(waUrl, '_blank')
    toast.success('Membuka WhatsApp Web / App...')
  }

  const filteredCustomers = customers.filter(c =>
    c.nama.toLowerCase().includes(search.toLowerCase()) || c.wa.includes(search)
  )

  return (
    <DashboardLayout title="Manajemen Pelanggan & WA Broadcast">
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.15))',
          border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 20, padding: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Users size={22} style={{ color: '#34d399' }} />
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>Database Pelanggan & WA CRM</h1>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: 0 }}>
              Kelola daftar pembeli setia, riwayat transaksi, dan kirim pesan broadcast promosi langsung ke WhatsApp mereka.
            </p>
          </div>

          <button
            onClick={() => setBroadcastModalOpen(true)}
            className="btn btn-primary"
            style={{ gap: 8, height: 44, padding: '0 20px', fontSize: '0.9rem', fontWeight: 800, background: '#10b981' }}
          >
            <Send size={18} /> Broadcast WA Spesial
          </button>
        </div>

        {/* Customer Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 4 }}>TOTAL PELANGGAN</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>{customers.length} Orang</div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 4 }}>TOTAL TRANSAKSI</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>
              {customers.reduce((sum, c) => sum + c.orderCount, 0)} Pesanan
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 4 }}>LTV RATA-RATA</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc' }}>
              {formatRupiah(customers.length ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0)}
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Cari nama atau nomor WhatsApp..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 40, width: '100%', height: 42, borderRadius: 12 }}
            />
          </div>
        </div>

        {/* Customers Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-tertiary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 20px' }}>Pelanggan</th>
                  <th style={{ padding: '16px 20px' }}>Nomor WA</th>
                  <th style={{ padding: '16px 20px' }}>Total Pesanan</th>
                  <th style={{ padding: '16px 20px' }}>Total Belanja</th>
                  <th style={{ padding: '16px 20px' }}>Aksi Direct WA</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {c.nama.charAt(0)}
                        </div>
                        <div>
                          <div>{c.nama}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>{c.lastProduct}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', color: '#cbd5e1' }}>{c.wa}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 800, fontSize: '0.78rem' }}>
                        {c.orderCount} Order
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 800, color: '#34d399' }}>
                      {formatRupiah(c.totalSpent)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button
                        onClick={() => {
                          setSelectedCustomer(c)
                          setBroadcastModalOpen(true)
                        }}
                        className="btn btn-sm btn-secondary"
                        style={{ gap: 6, color: '#34d399', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)' }}
                      >
                        <MessageCircle size={14} /> Kirim Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {broadcastModalOpen && (
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
                width: '100%', maxWidth: 480, background: '#141722',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 24, padding: 24
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageCircle size={18} style={{ color: '#34d399' }} /> Kirim WhatsApp Pesan Promosi
                </h3>
                <button onClick={() => setBroadcastModalOpen(false)} className="btn btn-ghost btn-sm" style={{ color: '#94a3b8' }}>
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  Pesan WhatsApp Template
                </label>
                <textarea
                  rows={5}
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: 12, background: '#0b0d14', borderRadius: 12, fontSize: '0.85rem', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setBroadcastMsg('Halo kak! Ada barang baru yang mendarat hari ini di toko kami. Buka katalog sekarang yuk!')}
                  className="btn btn-xs btn-ghost"
                  style={{ background: '#0b0d14', color: '#94a3b8', fontSize: '0.75rem' }}
                >
                  + Produk Baru
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastMsg('Halo kak! Pesanan kemarin sudah kami kemas rapi dan siap dikirim. Terima kasih kepercayaan kamu!')}
                  className="btn btn-xs btn-ghost"
                  style={{ background: '#0b0d14', color: '#94a3b8', fontSize: '0.75rem' }}
                >
                  + Update Pesanan
                </button>
              </div>

              <button
                onClick={() => {
                  const phone = selectedCustomer ? selectedCustomer.wa : '6283862720514'
                  handleSendWA(phone, broadcastMsg)
                  setBroadcastModalOpen(false)
                }}
                className="btn btn-primary"
                style={{ width: '100%', height: 46, borderRadius: 12, background: '#10b981', fontWeight: 800, gap: 8 }}
              >
                <Send size={16} /> Kirim ke WhatsApp {selectedCustomer ? selectedCustomer.nama : 'Pelanggan'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
