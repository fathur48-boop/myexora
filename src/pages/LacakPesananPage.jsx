import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search, Package, Truck, CheckCircle2, Clock, MessageCircle,
  Copy, RefreshCw, ArrowLeft, ExternalLink, ShieldCheck, FileText, Store, MapPin, AlertCircle, Navigation
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { pesananApi } from '../lib/api'
import { biteshipApi } from '../lib/api/biteshipClient'
import { formatRupiah, formatDateTime, PESANAN_STATUS, generateWALink } from '../lib/utils'

// Demo Mock fallback if order is not found in database or for instant testing
const DEMO_ORDERS = {
  'EXR-88492': {
    id: 'ord_demo_1',
    orderId: 'EXR-88492',
    buyerNama: 'Budi Santoso',
    buyerWa: '081234567890',
    buyerAlamat: 'Jl. Merdeka No. 45, Bandung, Jawa Barat (40111)',
    produkNama: 'Kemeja Batik Modern Slimfit Premium',
    qty: 2,
    total: 350000,
    status: 'process', // pending, process, shipped, done, cancel
    kurir: 'J&T Express',
    resi: 'JT8829102931',
    catatan: 'Tolong kemas aman untuk kado ulang tahun.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    toko: {
      nama: 'Batik Trusmi Official',
      slug: 'batik-trusmi',
      wa: '6281234567890',
      logo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&auto=format&fit=crop&q=80'
    },
    items: [
      { nama: 'Kemeja Batik Modern Slimfit Premium (L)', qty: 2, harga: 175000 }
    ]
  },
  'EXR-99210': {
    id: 'ord_demo_2',
    orderId: 'EXR-99210',
    buyerNama: 'Siti Rahmawati',
    buyerWa: '085712345678',
    buyerAlamat: 'Jl. Sudirman No. 12, Jakarta Selatan',
    produkNama: 'Hijab Voal Premium Motif Series',
    qty: 3,
    total: 225000,
    status: 'shipped',
    kurir: 'JNE Reguler',
    resi: 'JNE991823001',
    catatan: 'Warna Dusty Pink & Sage Green',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    toko: {
      nama: 'Hijab Chic ID',
      slug: 'hijab-chic',
      wa: '6285712345678',
      logo: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100&auto=format&fit=crop&q=80'
    },
    items: [
      { nama: 'Hijab Voal Premium Motif Series', qty: 3, harga: 75000 }
    ]
  }
}

export default function LacakPesananPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialOrderId = searchParams.get('orderId') || searchParams.get('id') || ''
  const initialWa = searchParams.get('wa') || ''

  const [orderIdInput, setOrderIdInput] = useState(initialOrderId)
  const [waInput, setWaInput] = useState(initialWa)
  
  const [pesanan, setPesanan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [trackingData, setTrackingData] = useState(null)
  const [loadingTracking, setLoadingTracking] = useState(false)

  // Fetch live tracking from Biteship API when resi is present
  useEffect(() => {
    if (pesanan?.resi) {
      setLoadingTracking(true)
      biteshipApi.trackWaybill(pesanan.resi)
        .then(res => {
          if (res?.data) {
            setTrackingData(res.data)
          }
        })
        .catch(err => {
          console.log('Biteship tracking error:', err?.message)
        })
        .finally(() => {
          setLoadingTracking(false)
        })
    } else {
      setTrackingData(null)
    }
  }, [pesanan?.resi])

  const handleTrack = async (targetOrderId = orderIdInput, targetWa = waInput) => {
    const trimmedId = targetOrderId.trim().toUpperCase()
    if (!trimmedId) {
      toast.error('Masukkan Nomor Order terlebih dahulu')
      return
    }

    setLoading(true)
    setSearched(true)

    // Update query params in URL
    setSearchParams({ orderId: trimmedId, wa: targetWa })

    try {
      // 1. Try API backend call
      const res = await pesananApi.getByOrderId(trimmedId, targetWa)
      if (res && res.success && res.data) {
        setPesanan(res.data)
        toast.success('Data pesanan ditemukan!')
        setLoading(false)
        return
      }
    } catch (err) {
      console.log('API lookup error, checking demo orders:', err?.message)
    }

    // 2. Fallback to DEMO_ORDERS for easy testing
    if (DEMO_ORDERS[trimmedId]) {
      setPesanan(DEMO_ORDERS[trimmedId])
      toast.success('Data pesanan demo berhasil dimuat!')
    } else {
      // Check localStorage for saved checkout orders
      try {
        const savedLocal = localStorage.getItem('exora_recent_orders')
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal)
          const found = parsed.find(p => (p.orderId || p.id) === trimmedId)
          if (found) {
            setPesanan(found)
            toast.success('Data pesanan lokal ditemukan!')
            setLoading(false)
            return
          }
        }
      } catch (e) {
        // ignore
      }

      setPesanan(null)
      toast.error('Pesanan tidak ditemukan. Pastikan Nomor Order sudah benar.')
    }

    setLoading(false)
  }

  // Auto search on mount if orderId is in query param
  useEffect(() => {
    if (initialOrderId) {
      handleTrack(initialOrderId, initialWa)
    }
  }, [])

  // Live Auto Polling every 10 seconds if active
  useEffect(() => {
    let timer
    if (autoRefresh && pesanan && (pesanan.orderId || pesanan.id)) {
      timer = setInterval(() => {
        handleTrack(pesanan.orderId || pesanan.id, waInput)
      }, 10000)
    }
    return () => clearInterval(timer)
  }, [autoRefresh, pesanan, waInput])

  const copyResi = (resi) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(resi)
      toast.success('Nomor resi berhasil disalin!')
    }
  }

  // Calculate Stepper progress
  const getStepProgress = (status) => {
    switch (status) {
      case 'pending': return 1
      case 'process': return 2
      case 'shipped': return 3
      case 'done': return 4
      case 'cancel': return 0
      default: return 1
    }
  }

  const currentStep = pesanan ? getStepProgress(pesanan.status) : 0
  const statusCfg = pesanan ? (PESANAN_STATUS[pesanan.status] || PESANAN_STATUS.pending) : null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #090a0f)',
      color: '#fff',
      paddingBottom: 60
    }}>
      {/* Top Navbar */}
      <header style={{
        padding: '12px 16px',
        background: 'rgba(20, 23, 34, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: '1.1rem' }}>
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>E</span>
            EXORA <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: 'rgba(56, 189, 248, 0.15)' }}>Tracker</span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/pesanan-saya" style={{
            fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10,
            background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            <Package size={14} /> Pesanan Saya
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 840, margin: '20px auto 0', padding: '0 16px' }}>
        
        {/* Banner Title */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 1,
            padding: '4px 12px', borderRadius: 100, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)'
          }}>
            ⚡ Real-time Order Tracking
          </span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '10px 0 6px', color: '#fff' }}>
            Lacak Status Pesanan
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: 500, margin: '0 auto' }}>
            Masukkan Nomor Order dan WhatsApp untuk memantau pengiriman pesanan kamu.
          </p>
        </div>

        {/* Tracking Form Card */}
        <div style={{
          background: '#141722',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: '18px 16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          marginBottom: 24
        }}>
          <form onSubmit={e => { e.preventDefault(); handleTrack(); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  NOMOR ORDER / INVOICE *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Contoh: EXR-88492"
                    value={orderIdInput}
                    onChange={e => setOrderIdInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: '#090a0f',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  NOMOR WHATSAPP (OPSIONAL)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={waInput}
                  onChange={e => setWaInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: '#090a0f',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 24px rgba(56, 189, 248, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Memeriksa Data...
                </>
              ) : (
                <>
                  <Search size={18} /> Lacak Pesanan Sekarang
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Shortcuts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Coba Demo Order:</span>
            {Object.keys(DEMO_ORDERS).map(demoId => (
              <button
                key={demoId}
                onClick={() => {
                  setOrderIdInput(demoId)
                  setWaInput(DEMO_ORDERS[demoId].buyerWa)
                  handleTrack(demoId, DEMO_ORDERS[demoId].buyerWa)
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 100,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {demoId}
              </button>
            ))}
          </div>
        </div>

        {/* RESULTS SECTION */}
        {searched && (
          <div>
            {!pesanan ? (
              /* Not Found Card */
              <div style={{
                background: '#141722',
                borderRadius: 20,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: 32,
                textAlign: 'center'
              }}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
                  Pesanan Tidak Ditemukan
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 450, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  Pastikan kombinasi Nomor Order (misal <b>EXR-88492</b>) sudah benar. Jika baru checkout via WhatsApp, beri jeda beberapa menit agar seller memproses.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <Link to="/pesanan-saya" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                    Cek Pesanan Saya Lainnya
                  </Link>
                </div>
              </div>
            ) : (
              /* Found Order Details */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Header Info Box */}
                <div style={{
                  background: '#141722',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 20,
                  padding: 24,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>
                          {pesanan.orderId || pesanan.id}
                        </span>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: 100,
                          background: statusCfg?.bg || 'rgba(56, 189, 248, 0.15)',
                          color: statusCfg?.color || '#38bdf8',
                          border: `1px solid ${statusCfg?.color || '#38bdf8'}30`
                        }}>
                          {statusCfg?.label || pesanan.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} /> Tanggal Pesan: {formatDateTime(pesanan.createdAt)}
                      </div>
                    </div>

                    {/* Auto Refresh Toggle & Refresh Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => handleTrack(pesanan.orderId || pesanan.id, waInput)}
                        style={{
                          padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem',
                          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                      </button>

                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem',
                        color: autoRefresh ? '#38bdf8' : '#64748b', cursor: 'pointer', fontWeight: 600
                      }}>
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={e => setAutoRefresh(e.target.checked)}
                          style={{ accentColor: '#38bdf8' }}
                        />
                        Live Auto-Update (10s)
                      </label>
                    </div>
                  </div>

                  {/* STEPPER PROGRESS TIMELINE */}
                  <div style={{ padding: '20px 10px 10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, position: 'relative' }}>
                      
                      {/* Progress Line */}
                      <div style={{
                        position: 'absolute', top: 16, left: '10%', right: '10%', height: 3,
                        background: 'rgba(255,255,255,0.1)', zIndex: 1
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${((currentStep - 1) / 3) * 100}%`,
                          background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>

                      {/* Step 1 */}
                      <div style={{ textAlign: 'center', zIndex: 2, position: 'relative' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', margin: '0 auto 8px',
                          background: currentStep >= 1 ? '#38bdf8' : '#1e293b',
                          color: currentStep >= 1 ? '#fff' : '#64748b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.85rem',
                          boxShadow: currentStep >= 1 ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none'
                        }}>
                          1
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: currentStep >= 1 ? 800 : 500, color: currentStep >= 1 ? '#fff' : '#64748b' }}>
                          Pesanan Dibuat
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div style={{ textAlign: 'center', zIndex: 2, position: 'relative' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', margin: '0 auto 8px',
                          background: currentStep >= 2 ? '#38bdf8' : '#1e293b',
                          color: currentStep >= 2 ? '#fff' : '#64748b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.85rem',
                          boxShadow: currentStep >= 2 ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none'
                        }}>
                          2
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: currentStep >= 2 ? 800 : 500, color: currentStep >= 2 ? '#fff' : '#64748b' }}>
                          Dikonfirmasi
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div style={{ textAlign: 'center', zIndex: 2, position: 'relative' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', margin: '0 auto 8px',
                          background: currentStep >= 3 ? '#38bdf8' : '#1e293b',
                          color: currentStep >= 3 ? '#fff' : '#64748b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.85rem',
                          boxShadow: currentStep >= 3 ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none'
                        }}>
                          3
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: currentStep >= 3 ? 800 : 500, color: currentStep >= 3 ? '#fff' : '#64748b' }}>
                          Pengiriman
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div style={{ textAlign: 'center', zIndex: 2, position: 'relative' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', margin: '0 auto 8px',
                          background: currentStep >= 4 ? '#10b981' : '#1e293b',
                          color: currentStep >= 4 ? '#fff' : '#64748b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.85rem',
                          boxShadow: currentStep >= 4 ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none'
                        }}>
                          4
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: currentStep >= 4 ? 800 : 500, color: currentStep >= 4 ? '#fff' : '#64748b' }}>
                          Selesai
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Courier & Resi Box */}
                  {(pesanan.kurir || pesanan.resi) && (
                    <div style={{
                      marginTop: 20,
                      padding: 16,
                      borderRadius: 14,
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.2)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Truck size={24} color="#38bdf8" />
                          <div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>INFORMASI PENGIRIMAN</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                              {pesanan.kurir || 'Kurir Toko'} - <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{pesanan.resi || 'Menunggu Resi'}</span>
                            </div>
                          </div>
                        </div>

                        {pesanan.resi && (
                          <button
                            onClick={() => copyResi(pesanan.resi)}
                            style={{
                              padding: '6px 12px', borderRadius: 8, background: '#1e293b',
                              border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.78rem',
                              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                            }}
                          >
                            <Copy size={13} /> Salin Resi
                          </button>
                        )}
                      </div>

                      {/* Biteship Live Courier Timeline */}
                      {pesanan.resi && (
                        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Navigation size={14} /> Riwayat Perjalanan Kurir (Biteship API)
                          </div>

                          {loadingTracking ? (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '10px 0' }}>
                              <RefreshCw size={14} className="animate-spin inline mr-2" /> Menghubungkan ke server Biteship...
                            </div>
                          ) : trackingData?.history && trackingData.history.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 8 }}>
                              {trackingData.history.map((hist, idx) => (
                                <div key={idx} style={{ position: 'relative', paddingLeft: 18, borderLeft: '2px solid rgba(56, 189, 248, 0.4)' }}>
                                  <div style={{
                                    position: 'absolute', left: -5, top: 4, width: 8, height: 8, borderRadius: '50%',
                                    background: idx === 0 ? '#38bdf8' : '#64748b'
                                  }} />
                                  <div style={{ fontSize: '0.82rem', fontWeight: idx === 0 ? 800 : 500, color: idx === 0 ? '#fff' : '#cbd5e1' }}>
                                    {hist.note}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                                    {formatDateTime(hist.updated_at)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                              Status resi aktif. Paket sedang diproses oleh ekspedisi {pesanan.kurir || ''}.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
                  
                  {/* Left Column: Rincian Produk */}
                  <div style={{
                    background: '#141722',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 20,
                    padding: 20
                  }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Package size={18} color="#38bdf8" /> Rincian Barang
                    </h4>

                    {/* Items List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                      {(pesanan.items || [{ nama: pesanan.produkNama, qty: pesanan.qty, harga: pesanan.total / (pesanan.qty || 1) }]).map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          paddingBottom: 10, borderBottom: '1px dashed rgba(255,255,255,0.08)'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{item.nama}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{item.qty}x @ {formatRupiah(item.harga)}</div>
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>
                            {formatRupiah(item.harga * item.qty)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, fontSize: '1rem', fontWeight: 900 }}>
                      <span style={{ color: '#fff' }}>Total Pembayaran</span>
                      <span style={{ color: '#38bdf8' }}>{formatRupiah(pesanan.total)}</span>
                    </div>
                  </div>

                  {/* Right Column: Toko & Alamat */}
                  <div style={{
                    background: '#141722',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 20,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Store size={18} color="#a855f7" /> Penjual & Tujuan
                      </h4>

                      {/* Store Card */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
                        background: 'rgba(255,255,255,0.04)', marginBottom: 16
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800
                        }}>
                          {pesanan.toko?.logo ? <img src={pesanan.toko.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : pesanan.toko?.nama?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{pesanan.toko?.nama || 'Toko Official'}</div>
                          <Link to={`/toko/${pesanan.toko?.slug || ''}`} target="_blank" style={{ fontSize: '0.78rem', color: '#a855f7', textDecoration: 'none', fontWeight: 600 }}>
                            Kunjungi Toko <ExternalLink size={12} style={{ display: 'inline', marginLeft: 2 }} />
                          </Link>
                        </div>
                      </div>

                      {/* Address */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> ALAMAT PENGIRIMAN
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                          <b>{pesanan.buyerNama}</b> ({pesanan.buyerWa})<br />
                          {pesanan.buyerAlamat || 'Sesuai kesepakatan WhatsApp'}
                        </div>
                      </div>

                      {/* Catatan */}
                      {pesanan.catatan && (
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                          <b>Catatan:</b> "{pesanan.catatan}"
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                      {pesanan.toko?.wa && (
                        <a
                          href={generateWALink(
                            pesanan.toko.wa,
                            `Halo Kak ${pesanan.toko.nama}, saya mau tanya status pesanan ${pesanan.orderId || pesanan.id} atas nama ${pesanan.buyerNama}. Terimakasih!`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '12px', borderRadius: 12, background: '#22c55e', color: '#fff',
                            textDecoration: 'none', fontSize: '0.88rem', fontWeight: 800, textAlign: 'center',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          <MessageCircle size={18} /> Hubungi Penjual via WhatsApp
                        </a>
                      )}

                      <Link
                        to={`/invoice/${pesanan.id || pesanan.orderId}`}
                        target="_blank"
                        style={{
                          padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none',
                          fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                      >
                        <FileText size={16} /> Lihat / Cetak Invoice Resmi
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
