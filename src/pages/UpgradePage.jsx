import React, { useState, useEffect } from 'react'
import { Check, MessageCircle, Zap, ArrowLeft, Crown, Sparkles, X, QrCode, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../components/seller/DashboardLayout'
import { useAuthStore, useTokoStore } from '../lib/store'
import { generateUpgradeMessage, generateWALink, getTierLevel, getPlanDisplayName, formatRupiah } from '../lib/utils'
import { CONFIG, PLAN_FEATURES } from '../lib/config'
import { paymentApi } from '../lib/api/paymentClient'
import toast from 'react-hot-toast'

function RocketAnimation({ show }) {
  if (!show) return null

  const rockets = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 50,
    y: Math.random() * -100 - 20,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.3,
    duration: 1.5 + Math.random() * 1,
  }))

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden',
    }}>
      {rockets.map(rocket => (
        <motion.div
          key={rocket.id}
          initial={{
            x: '-50%',
            y: '-50%',
            scale: 0,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: `${rocket.x}vw`,
            y: `${rocket.y}vh`,
            scale: [0, 2, 1],
            opacity: [1, 1, 0],
            rotate: rocket.rotation,
          }}
          transition={{
            duration: rocket.duration,
            delay: rocket.delay,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
          }}
        >
          🚀
        </motion.div>
      ))}
    </div>
  )
}

function PaymentModal({ isOpen, onClose, plan, billingCycle = '3month', onSuccess }) {
  const { user, updateUser } = useAuthStore()
  const { toko } = useTokoStore()

  const [paymentMethod, setPaymentMethod] = useState(null)
  const [paymentData, setPaymentData] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [countdown, setCountdown] = useState(0)
  const [showRocket, setShowRocket] = useState(false)

  const is3Month = billingCycle === '3month'
  const durationMonths = is3Month ? 3 : 1

  const tierInfo = plan ? CONFIG.TIERS[plan.toUpperCase()] : null
  const displayPrice = tierInfo
    ? (is3Month ? tierInfo.price3Month : tierInfo.priceMonthly)
    : 'Rp 0'
  const totalPrice = tierInfo
    ? (is3Month ? formatRupiah(tierInfo.total3MonthNum) : tierInfo.priceMonthly)
    : 'Rp 0'

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod(null)
      setPaymentData(null)
      setPaymentStatus('idle')
      setCountdown(0)
      setShowRocket(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (paymentStatus === 'pending' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setPaymentStatus('expired')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [paymentStatus, countdown])

  useEffect(() => {
    if (paymentStatus === 'pending' && paymentData?.paymentId) {
      const pollInterval = setInterval(async () => {
        try {
          const res = await paymentApi.checkPaymentStatus(paymentData.paymentId)
          if (res.success) {
            setPaymentStatus(res.data.status)

            if (res.data.status === 'paid') {
              clearInterval(pollInterval)
              setShowRocket(true)

              updateUser({
                plan: plan,
                planExpiry: res.data.planExpiry || new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
              })

              toast.success(`Selamat! Plan ${getPlanDisplayName(plan)} (${durationMonths} Bulan) aktif! 🚀`)

              setTimeout(() => {
                onSuccess()
                onClose()
              }, 3000)
            }
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 5000)

      return () => clearInterval(pollInterval)
    }
  }, [paymentStatus, paymentData, plan, durationMonths, onSuccess, onClose, updateUser])

  const handleCreatePayment = async () => {
    setPaymentStatus('loading')
    try {
      const res = await paymentApi.createUpgradePayment({
        targetPlan: plan,
        durationMonths
      })

      if (res.success) {
        setPaymentData(res.data)
        setPaymentStatus('pending')
        setCountdown(30 * 60)
      } else {
        toast.error(res.message || 'Gagal membuat pembayaran')
        setPaymentStatus('idle')
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan')
      setPaymentStatus('idle')
    }
  }

  const handleManualPayment = () => {
    const cycleText = is3Month ? 'Paket 3 Bulan (Hemat 20%)' : 'Paket Bulanan'
    const msg = `Halo Admin Exora, saya ingin mengajukan upgrade plan.

Detail Akun:
- Nama: ${user?.name || '-'}
- Email: ${user?.email || '-'}
- Nama Toko: ${toko?.nama || '-'}
- Slug Toko: ${toko?.slug || '-'}
- Target Plan: ${getPlanDisplayName(plan)} (${cycleText})
- Total Tagihan: ${totalPrice}

Mohon instruksi pembayaran selengkapnya. Terima kasih!`
    window.open(generateWALink(CONFIG.ADMIN_WA, msg), '_blank')
    onClose()
  }

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="glass-card"
          style={{
            width: '100%',
            maxWidth: 480,
            padding: 'clamp(20px, 4vw, 32px)',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
            }}
          >
            <X size={16} />
          </button>

          {paymentStatus === 'idle' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--accent-gradient-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Zap size={28} color="var(--accent)" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>
                  Upgrade ke {getPlanDisplayName(plan)}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 4 }}>
                  {PLAN_FEATURES[plan]?.price}
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
                  Pilih metode pembayaran yang kamu inginkan
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod('dana')}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '14px',
                    gap: 10,
                  }}
                >
                  <QrCode size={18} />
                  Bayar via DANA (Otomatis)
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleManualPayment}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '14px',
                    gap: 10,
                  }}
                >
                  <MessageCircle size={18} />
                  Bayar Manual via WA
                </motion.button>
              </div>

              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                marginTop: 16,
                lineHeight: 1.5,
              }}>
                💡 Pembayaran otomatis via DANA lebih cepat dan plan langsung aktif
              </p>
            </>
          )}

          {paymentStatus === 'loading' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Membuat transaksi...
              </p>
            </div>
          )}

          {paymentStatus === 'pending' && paymentData && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>
                  Scan QR Code DANA
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
                  Total: <strong style={{ color: 'var(--accent)' }}>{formatRupiah(price)}</strong>
                </p>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: countdown < 300 ? 'rgba(239,68,68,0.1)' : 'var(--surface)',
                  border: `1px solid ${countdown < 300 ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--radius-full)',
                  marginBottom: 16,
                }}>
                  <Clock size={14} color={countdown < 300 ? 'var(--danger)' : 'var(--text-tertiary)'} />
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: countdown < 300 ? 'var(--danger)' : 'var(--text-secondary)',
                    fontFamily: 'monospace',
                  }}>
                    {formatCountdown(countdown)}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#fff',
                padding: 20,
                borderRadius: 'var(--radius-lg)',
                marginBottom: 16,
                textAlign: 'center',
              }}>
                <div style={{
                  width: 200,
                  height: 200,
                  margin: '0 auto',
                  background: 'repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                }}>
                  📱
                </div>
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: 12 }}>
                  QR Code Mock (Nanti diganti QR asli dari DANA)
                </p>
              </div>

              <div style={{
                padding: 12,
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                lineHeight: 1.5,
              }}>
                <strong>Payment ID:</strong> {paymentData.paymentId.slice(0, 8)}...
                <br />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Status akan terupdate otomatis setelah pembayaran
                </span>
              </div>
            </>
          )}

          {paymentStatus === 'paid' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(52,211,153,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Check size={40} color="var(--success)" />
              </motion.div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>
                Pembayaran Berhasil! 🚀
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Plan <strong>{getPlanDisplayName(plan)}</strong> sudah aktif.
                <br />
                Selamat menikmati fitur premium!
              </p>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <X size={32} color="var(--danger)" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>
                Pembayaran Gagal
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
                Silakan coba lagi atau hubungi admin
              </p>
              <button
                onClick={() => setPaymentStatus('idle')}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {paymentStatus === 'expired' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(245,158,11,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Clock size={32} color="var(--warning)" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>
                Pembayaran Kedaluwarsa
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
                Waktu pembayaran telah habis
              </p>
              <button
                onClick={handleCreatePayment}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Buat Transaksi Baru
              </button>
            </div>
          )}
        </motion.div>

        <RocketAnimation show={showRocket} />
      </motion.div>
    </AnimatePresence>
  )
}

export default function UpgradePage() {
  const { user } = useAuthStore()
  const { toko } = useTokoStore()
  const currentTierLevel = getTierLevel(user?.plan)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [billingCycle, setBillingCycle] = useState('3month') // 'monthly' | '3month'

  const handleUpgradeClick = (plan) => {
    setSelectedPlan(plan)
    setModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    window.location.reload()
  }

  const is3Month = billingCycle === '3month'

  if (currentTierLevel >= 3) {
    return (
      <DashboardLayout title="Upgrade Plan">
        <div style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
          <div className="glass-card" style={{ padding: '48px 32px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👑</div>
            <h2 className="text-heading" style={{ marginBottom: 12 }}>Kamu sudah Business!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6, textAlign: 'left' }}>
              Kamu sudah menikmati semua fitur Business. Terima kasih sudah mendukung Exora!
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 24, textAlign: 'left' }}>
              Business aktif hingga:{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>
                {user?.planExpiry ? new Date(user.planExpiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Selamanya'}
              </strong>
            </p>
            <Link to="/dashboard" className="btn btn-secondary">
              <ArrowLeft size={14} /> Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Upgrade Plan">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{
          textAlign: 'center', marginBottom: '28px',
          padding: 'clamp(24px, 4vw, 36px) clamp(16px, 4vw, 24px)',
          background: 'linear-gradient(135deg, rgba(91,138,245,0.08) 0%, rgba(167,139,250,0.08) 100%)',
          borderRadius: 'var(--radius-2xl)', border: '1px solid rgba(167,139,250,0.15)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: 'var(--radius-full)',
            background: 'var(--accent-gradient-soft)', border: '1px solid rgba(167,139,250,0.2)',
            marginBottom: '16px',
          }}>
            <Zap size={13} color="var(--accent-3)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-3)', letterSpacing: '0.04em' }}>
              4 TIER LENGKAP BISNIS ONLINE
            </span>
          </div>
          <h1 className="text-display gradient-text" style={{
            fontSize: 'clamp(1.2rem, 4vw, 2.2rem)',
            marginBottom: 10,
          }}>
            Waktunya bisnis kamu naik level
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6, fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', textAlign: 'center' }}>
            Pilih paket yang pas untuk skala toko kamu. Makin panjang langganan, makin hemat!
          </p>

          {/* Toggle Billing Cycle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--surface-color, rgba(255,255,255,0.05))',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255,255,255,0.1)',
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
                background: !is3Month ? 'var(--accent-gradient)' : 'transparent',
                color: !is3Month ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: !is3Month ? '0 2px 10px rgba(124,58,237,0.3)' : 'none',
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
                background: is3Month ? 'var(--accent-gradient)' : 'transparent',
                color: is3Month ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: is3Month ? '0 2px 10px rgba(124,58,237,0.3)' : 'none',
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>

          {/* 1. Paket Free / Gratis */}
          <div className="glass-card" style={{ padding: '24px', opacity: currentTierLevel === 0 ? 1 : 0.75, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Free Gratis</span>
                {currentTierLevel === 0 && (
                  <span className="badge badge-free">Aktif</span>
                )}
              </div>

              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', marginBottom: 2 }}>
                Rp 0
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginBottom: 16 }}>Selamanya gratis</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 20 }}>
                {PLAN_FEATURES.free.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Check size={14} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-secondary" disabled style={{ width: '100%', opacity: 0.6 }}>
              {currentTierLevel === 0 ? 'Paket Aktif Saat Ini' : 'Paket Dasar'}
            </button>
          </div>

          {/* 2. Paket Starter */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.04) 100%)',
            border: currentTierLevel === 1 ? '2px solid #3B82F6' : '1px solid rgba(59,130,246,0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#3B82F6' }}>Starter</span>
                {currentTierLevel === 1 ? (
                  <span className="badge" style={{ background: '#3B82F6', color: '#fff' }}>Aktif</span>
                ) : (
                  <span style={{
                    background: 'rgba(59,130,246,0.15)', color: '#3B82F6',
                    fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  }}>
                    PEMULA
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', margin: 0, display: 'inline-block' }}>
                  {is3Month ? PLAN_FEATURES.starter.price3Month : PLAN_FEATURES.starter.priceMonthly}
                </p>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginLeft: 4 }}>/ bulan</span>
              </div>

              {is3Month ? (
                <p style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600, marginBottom: 16 }}>
                  Tagihan Rp 117.000 / 3 bulan (Hemat 20%)
                </p>
              ) : (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: 16 }}>
                  Bayar bulanan tanpa komitmen
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 20 }}>
                {PLAN_FEATURES.starter.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Check size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {currentTierLevel === 1 ? (
              <button className="btn" disabled style={{ width: '100%', background: '#3B82F6', color: '#fff' }}>
                Paket Aktif
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgradeClick('starter')}
                className="btn"
                style={{ width: '100%', justifyContent: 'center', background: '#3B82F6', color: '#fff' }}
              >
                <Zap size={15} /> Upgrade Starter
              </motion.button>
            )}
          </div>

          {/* 3. Paket Pro (BEST VALUE) */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(167,139,250,0.1) 100%)',
            border: currentTierLevel === 2 ? '2px solid var(--accent)' : '2px solid var(--accent)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            boxShadow: '0 8px 30px rgba(124,58,237,0.18)',
          }}>
            <div style={{
              position: 'absolute', top: -11, right: 16, background: 'var(--accent-gradient)',
              color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '3px 10px',
              borderRadius: 'var(--radius-full)', letterSpacing: '0.03em'
            }}>
              ⭐ PALING POPULER
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent-3)' }}>Pro</span>
                {currentTierLevel === 2 && (
                  <span className="badge badge-pro">Aktif</span>
                )}
              </div>

              <div style={{ marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', margin: 0, display: 'inline-block' }}>
                  {is3Month ? PLAN_FEATURES.pro.price3Month : PLAN_FEATURES.pro.priceMonthly}
                </p>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginLeft: 4 }}>/ bulan</span>
              </div>

              {is3Month ? (
                <p style={{ color: 'var(--accent-3)', fontSize: '0.75rem', fontWeight: 600, marginBottom: 16 }}>
                  Tagihan Rp 237.000 / 3 bulan (Hemat 20%)
                </p>
              ) : (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: 16 }}>
                  Bayar bulanan tanpa komitmen
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 20 }}>
                {PLAN_FEATURES.pro.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Check size={14} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {currentTierLevel === 2 ? (
              <button className="btn btn-primary" disabled style={{ width: '100%' }}>
                Paket Aktif
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgradeClick('pro')}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Zap size={16} /> Upgrade ke Pro
              </motion.button>
            )}
          </div>

          {/* 4. Paket Bisnis */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)',
            border: currentTierLevel >= 3 ? '2px solid #10B981' : '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Crown size={18} color="#10B981" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10B981' }}>Bisnis</span>
                </div>
                {currentTierLevel >= 3 ? (
                  <span className="badge" style={{ background: '#10B981', color: '#fff' }}>Aktif</span>
                ) : (
                  <span style={{
                    background: 'rgba(16,185,129,0.15)', color: '#10B981',
                    fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  }}>
                    ENTERPRISE
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', margin: 0, display: 'inline-block' }}>
                  {is3Month ? PLAN_FEATURES.business.price3Month : PLAN_FEATURES.business.priceMonthly}
                </p>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginLeft: 4 }}>/ bulan</span>
              </div>

              {is3Month ? (
                <p style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600, marginBottom: 16 }}>
                  Tagihan Rp 597.000 / 3 bulan (Hemat 20%)
                </p>
              ) : (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: 16 }}>
                  Bayar bulanan tanpa komitmen
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 20 }}>
                {PLAN_FEATURES.business.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Check size={14} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {currentTierLevel >= 3 ? (
              <button className="btn" disabled style={{ width: '100%', background: '#10B981', color: '#fff' }}>
                Paket Aktif
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgradeClick('business')}
                className="btn"
                style={{ width: '100%', justifyContent: 'center', background: '#10B981', color: '#fff' }}
              >
                <Crown size={15} /> Upgrade Bisnis
              </motion.button>
            )}
          </div>

        </div>

        <div className="glass-card" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '20px', textAlign: 'center', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>
            Cara upgrade
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            {[
              { step: '1', title: 'Pilih plan', desc: 'Klik tombol upgrade pada plan yang diinginkan' },
              { step: '2', title: 'Pilih metode bayar', desc: 'Pilih QRIS / E-Wallet (otomatis) atau WA manual' },
              { step: '3', title: 'Bayar', desc: 'Scan QR atau transfer sesuai instruksi' },
              { step: '4', title: 'Akun diaktifkan', desc: 'Fitur langsung aktif setelah pembayaran' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff',
                  margin: '0 auto 10px', fontSize: '0.9rem',
                }}>
                  {s.step}
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>{s.title}</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', lineHeight: 1.5, textAlign: 'center' }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Butuh bantuan atau kustomisasi khusus? Hubungi admin langsung:
            </p>
            <a href={generateWALink(CONFIG.ADMIN_WA, 'Halo Admin Exora, saya butuh bantuan untuk upgrade plan.')} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', maxWidth: 360, justifyContent: 'center' }}>
              <MessageCircle size={15} /> Chat Admin WhatsApp
            </a>
          </div>
        </div>

        <PaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          plan={selectedPlan}
          billingCycle={billingCycle}
          onSuccess={handlePaymentSuccess}
        />

      </div>
    </DashboardLayout>
  )
}
