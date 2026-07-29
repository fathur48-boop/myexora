import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package, Search, Clock, CheckCircle2, Truck, MessageCircle,
  ExternalLink, RefreshCw, Phone, Store, ChevronRight, ShoppingBag, AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { pesananApi } from '../lib/api'
import { formatRupiah, formatDateTime, PESANAN_STATUS, generateWALink } from '../lib/utils'

export default function PesananSayaPage() {
  const navigate = useNavigate()
  const savedWa = localStorage.getItem('exora_buyer_wa') || ''

  const [waInput, setWaInput] = useState(savedWa)
  const [activeWa, setActiveWa] = useState(savedWa)
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'active', 'done'
  const [searchQuery, setSearchQuery] = useState('')

  const fetchBuyerOrders = async (waToFetch = activeWa) => {
    if (!waToFetch) return
    setLoading(true)

    let apiOrders = []
    try {
      const res = await pesananApi.getByWa(waToFetch)
      if (res && res.success && Array.isArray(res.data)) {
        apiOrders = res.data
      }
    } catch (err) {
      console.log('Error fetching buyer orders from API:', err?.message)
    }

    // Combine with locally cached recent orders in localStorage if any
    let localOrders = []
    try {
      const savedLocal = localStorage.getItem('exora_recent_orders')
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal)
        const cleanWaInput = waToFetch.replace(/\D/g, '')
        localOrders = parsed.filter(o => {
          const oWa = (o.buyerWa || '').replace(/\D/g, '')
          return oWa && cleanWaInput && (oWa.includes(cleanWaInput) || cleanWaInput.includes(oWa))
        })
      }
    } catch (e) {
      // ignore
    }

    // Merge and deduplicate by orderId / id
    const mergedMap = new Map()
    localOrders.forEach(o => mergedMap.set(o.orderId || o.id, o))
    apiOrders.forEach(o => mergedMap.set(o.orderId || o.id, o))

    const finalOrders = Array.from(mergedMap.values())
    setOrders(finalOrders)
    setLoading(false)
  }

  useEffect(() => {
    if (activeWa) {
      fetchBuyerOrders(activeWa)
    }
  }, [activeWa])

  const handleSaveWa = (e) => {
    e.preventDefault()
    const clean = waInput.trim()
    if (!clean) {
      toast.error('Masukkan nomor WhatsApp kamu')
      return
    }
    localStorage.setItem('exora_buyer_wa', clean)
    setActiveWa(clean)
    toast.success('Nomor WhatsApp tersimpan!')
    fetchBuyerOrders(clean)
  }

  const handleClearWa = () => {
    localStorage.removeItem('exora_buyer_wa')
    setActiveWa('')
    setOrders([])
    toast.success('Sesi WhatsApp dibersihkan')
  }

  // Filter orders by tab and search query
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Tab filter
      if (activeTab === 'active' && (o.status === 'done' || o.status === 'cancel')) return false
      if (activeTab === 'done' && o.status !== 'done') return false

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const orderId = (o.orderId || o.id || '').toLowerCase()
        const storeName = (o.toko?.nama || '').toLowerCase()
        const productName = (o.produkNama || '').toLowerCase()
        return orderId.includes(q) || storeName.includes(q) || productName.includes(q)
      }
      return true
    })
  }, [orders, activeTab, searchQuery])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #090a0f)',
      color: '#fff',
      paddingBottom: 60
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        background: 'rgba(20, 23, 34, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: '1.2rem' }}>
          <span style={{
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>E</span>
          EXORA <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: 'rgba(168, 85, 247, 0.15)' }}>Buyer Hub</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/lacak-pesanan" style={{
            fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
            background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            <Search size={15} /> Quick Order Tracker
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 960, margin: '28px auto 0', padding: '0 20px' }}>
        
        {/* Banner Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px', color: '#fff' }}>
            Portal Pesanan Saya
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: 0 }}>
            Pantau seluruh riwayat transaksi belanja kamu di berbagai toko online Exora dalam satu dashboard terpusat.
          </p>
        </div>

        {/* WhatsApp Identification Bar */}
        <div style={{
          background: '#141722',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: 20,
          marginBottom: 28,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          {!activeWa ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Phone size={20} color="#22c55e" />
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                  Hubungkan Nomor WhatsApp Pembeli
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 16 }}>
                Masukkan nomor WhatsApp yang kamu gunakan saat checkout untuk menampilkan seluruh pesanan kamu secara otomatis.
              </p>
              
              <form onSubmit={handleSaveWa} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={waInput}
                  onChange={e => setWaInput(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 240,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#090a0f',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#22c55e',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Buka Pesanan Saya
                </button>
              </form>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: 'rgba(34, 197, 94, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Phone size={20} color="#22c55e" />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>PESANAN UNTUK WHATSAPP</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#22c55e' }}>{activeWa}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => fetchBuyerOrders(activeWa)}
                  disabled={loading}
                  style={{
                    padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem',
                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>

                <button
                  onClick={handleClearWa}
                  style={{
                    padding: '8px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.8rem',
                    fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Ganti Nomor WA
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Tabs & Search */}
        {activeWa && (
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 12, marginBottom: 20
            }}>
              {/* Tab Selector */}
              <div style={{
                display: 'flex', gap: 6, background: '#141722', padding: 4, borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto', maxWidth: '100%'
              }}>
                <button
                  onClick={() => setActiveTab('all')}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                    whiteSpace: 'nowrap',
                    background: activeTab === 'all' ? '#a855f7' : 'transparent', color: activeTab === 'all' ? '#fff' : '#94a3b8'
                  }}
                >
                  Semua ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                    whiteSpace: 'nowrap',
                    background: activeTab === 'active' ? '#38bdf8' : 'transparent', color: activeTab === 'active' ? '#fff' : '#94a3b8'
                  }}
                >
                  Diproses / Dikirim
                </button>
                <button
                  onClick={() => setActiveTab('done')}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                    whiteSpace: 'nowrap',
                    background: activeTab === 'done' ? '#10b981' : 'transparent', color: activeTab === 'done' ? '#fff' : '#94a3b8'
                  }}
                >
                  Selesai
                </button>
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Cari Order ID / Toko..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px', borderRadius: 12, background: '#141722',
                    border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Orders List Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <RefreshCw size={32} className="animate-spin" style={{ color: '#a855f7', marginBottom: 12 }} />
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Memuat riwayat pesanan kamu...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px', background: '#141722',
                borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <ShoppingBag size={48} style={{ color: '#64748b', marginBottom: 12 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>
                  Tidak Ada Pesanan Ditemukan
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: 400, margin: '0 auto 20px' }}>
                  {searchQuery ? 'Tidak ada pesanan yang cocok dengan kata kunci pencarian.' : 'Belum ada transaksi dengan nomor WhatsApp ini.'}
                </p>
                <Link to="/showcase" className="btn btn-primary" style={{ fontSize: '0.88rem' }}>
                  Jelajahi Toko & Produk
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredOrders.map(order => {
                  const statusCfg = PESANAN_STATUS[order.status] || PESANAN_STATUS.pending
                  const orderId = order.orderId || order.id
                  const storeName = order.toko?.nama || 'Toko Exora'
                  const storeSlug = order.toko?.slug || 'exora-official'

                  return (
                    <div
                      key={orderId}
                      style={{
                        background: '#141722',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 20,
                        padding: 20,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        transition: 'border-color 0.2s'
                      }}
                      className="hover:border-purple-500/30"
                    >
                      {/* Top Store Header */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 14
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800,
                            fontSize: '0.85rem'
                          }}>
                            {order.toko?.logo ? <img src={order.toko.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : storeName.charAt(0)}
                          </div>
                          <div>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>{storeName}</span>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 8 }}>• {formatDateTime(order.createdAt)}</span>
                          </div>
                        </div>

                        <span style={{
                          fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: 100,
                          background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}30`
                        }}>
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Item Details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 800, marginBottom: 4 }}>
                            {orderId}
                          </div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                            {order.produkNama || 'Pesanan Produk'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Jumlah: {order.qty || 1} barang
                          </div>

                          {order.kurir && (
                            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Truck size={14} color="#38bdf8" /> {order.kurir} {order.resi && `(${order.resi})`}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Belanja</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#22c55e' }}>
                            {formatRupiah(order.total)}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingTop: 12, borderTop: '1px dashed rgba(255,255,255,0.08)'
                      }}>
                        <Link
                          to={`/toko/${storeSlug}`}
                          target="_blank"
                          style={{ fontSize: '0.8rem', color: '#a855f7', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Store size={14} /> Kunjungi Toko
                        </Link>

                        <div style={{ display: 'flex', gap: 8 }}>
                          {order.toko?.wa && (
                            <a
                              href={generateWALink(order.toko.wa, `Halo Kak, mau menanyakan pesanan saya ${orderId}`)}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: '6px 12px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.15)',
                                border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', fontSize: '0.8rem',
                                fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <MessageCircle size={14} /> Chat Seller
                            </a>
                          )}

                          <button
                            onClick={() => navigate(`/lacak-pesanan?orderId=${orderId}&wa=${activeWa}`)}
                            style={{
                              padding: '6px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                              border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 800,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Search size={14} /> Lacak Detail <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
