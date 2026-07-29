// =============================================
// src/components/storefront/CheckoutModal.jsx
//
// REVISI BESAR (Ongkir Otomatis & Fee Exora Pay/Protect ke Buyer):
// - Checkout manual: TIDAK BERUBAH — alamat tetap teks bebas, tidak
//   ada ongkir/fee otomatis, tetap kirim WA "mohon konfirmasi".
// - Exora Pay / Exora Protect: alamat sekarang dua tingkat — cari
//   area tujuan (dibutuhkan Biteship untuk hitung ongkir) lalu detail
//   alamat teks di bawahnya. Ongkir auto-fetch begitu area dipilih,
//   auto-pilih kurir termurah dengan opsi "Ganti". Fee & Total
//   di-preview lewat paymentApi.previewFee SEBELUM submit, dihitung
//   ulang di server saat createOrderPayment — nomor yang buyer lihat
//   di form dan di Snap popup dijamin sama.
// - WA "Pembayaran diterima" hanya dikirim di onSuccess Snap, sama
//   seperti sebelumnya.
//
// PENTING: CheckoutModal ini hanya bisa dipakai kalau toko sudah
// punya originAreaId (dicek dari toko.originAreaId) — kalau belum
// ada dan buyer pilih Exora Pay/Protect, field pencarian area
// tujuan akan menampilkan pesan bahwa metode ini belum siap dan
// otomatis fallback ke manual (lihat validasi di handleCheckout).
// =============================================
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, MessageCircle, Zap, ShieldCheck, Check, Loader, MapPin, Truck, ChevronDown } from 'lucide-react'
import confetti from 'canvas-confetti'
import { pesananApi, voucherApi } from '../../lib/api'
import { useCustomerStore } from '../../lib/customerStore'
import { paymentApi } from '../../lib/api/paymentClient'
import { biteshipApi } from '../../lib/api/biteshipClient'
import { formatRupiah, generateWALink, validateWA } from '../../lib/utils'
import { CONFIG } from '../../lib/config'

// =============================================
// Helpers kecil — sama seperti sebelumnya
// =============================================

function vibrate(ms = 12) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms)
  }
}

function fireConfetti() {
  const duration = 2000
  const end = Date.now() + duration
  const colors = ['#5b8af5', '#7c6af7', '#f59e0b', '#ef4444', '#10b981', '#f43f5e']
  ;(function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

function MagneticButton({ children, strength = 0.3, style, ...props }) {
  const ref = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handleMouse = (e) => {
    if (!ref.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const distanceX = clientX - (left + width / 2)
    const distanceY = clientY - (top + height / 2)
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)
    setOffset(distance < 60 ? { x: distanceX * strength, y: distanceY * strength } : { x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      style={{ display: 'inline-block', ...style }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

function parseFotos(foto) {
  if (!foto) return []
  try {
    const parsed = JSON.parse(foto)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return String(foto).split(',').map(s => s.trim()).filter(Boolean)
  }
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// =============================================
// Pencarian area tujuan — pola sama AreaSearchInput di StorefrontPage
// =============================================

function DestinationAreaSearch({ value, onInputChange, options, searching, onSelect, c }) {
  return (
    <div style={{ position: 'relative' }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        <MapPin size={12} /> KOTA/KECAMATAN TUJUAN *
      </label>
      <div style={{ position: 'relative' }}>
        <input
          className="form-input"
          placeholder="Contoh: Bandung, Cimahi, Depok..."
          value={value}
          onChange={e => onInputChange(e.target.value)}
          style={{ fontSize: '0.875rem', paddingRight: searching ? 36 : 12, border: '2px solid var(--glass-border, rgba(255,255,255,0.1))' }}
        />
        {searching && <span className="spinner" style={{ width: 14, height: 14, position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
      </div>
      <AnimatePresence>
        {options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: c?.bgSecondary || '#12121a', border: `2px solid ${c?.glassBorder || 'rgba(255,255,255,0.1)'}`, borderRadius: 'var(--radius-md, 8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxHeight: 200, overflowY: 'auto', marginTop: 4 }}
          >
            {options.map(area => (
              <motion.div
                key={area.id}
                whileHover={{ scale: 1.02, backgroundColor: c?.surfaceHover || 'rgba(255,255,255,0.05)' }}
                onClick={() => onSelect(area)}
                style={{ padding: '9px 12px', fontSize: '0.82rem', cursor: 'pointer', borderBottom: `1px solid ${c?.glassBorder || 'rgba(255,255,255,0.1)'}`, color: c?.textPrimary || '#fff' }}
              >
                <span style={{ fontWeight: 600 }}>{area.name}</span>
                {area.administrative_division_level_1_name && (
                  <span style={{ color: c?.textTertiary || '#94a3b8', marginLeft: 6, fontSize: '0.75rem' }}>{area.administrative_division_level_1_name}</span>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =============================================
// Pilihan kurir — auto-pilih termurah, expand untuk ganti
// =============================================

function CourierPicker({ pricings, selected, onSelect, c, accentColor }) {
  const [expanded, setExpanded] = useState(false)
  if (!pricings.length) return null

  return (
    <div>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', background: c?.surface || 'rgba(255,255,255,0.03)', border: `2px solid ${c?.glassBorder || 'rgba(255,255,255,0.1)'}`,
          borderRadius: 'var(--radius-md, 8px)', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={14} color={accentColor} />
          <span style={{ fontSize: '0.8rem', color: c?.textPrimary || '#fff' }}>
            Ongkir: <strong>{selected.courier_name} {selected.courier_service_name}</strong> ({formatRupiah(selected.price)})
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: accentColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
          Ganti <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </span>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginTop: 8 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pricings.map((item, i) => {
                const active = item.courier_service_code === selected.courier_service_code && item.courier_code === selected.courier_code
                return (
                  <div
                    key={i}
                    onClick={() => { onSelect(item); setExpanded(false) }}
                    style={{
                      padding: '9px 12px', borderRadius: 'var(--radius-md, 8px)',
                      background: active ? `${accentColor}12` : (c?.surface || 'rgba(255,255,255,0.03)'),
                      border: `2px solid ${active ? `${accentColor}55` : (c?.glassBorder || 'rgba(255,255,255,0.1)')}`,
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: c?.textPrimary || '#fff', margin: 0 }}>{item.courier_name} — {item.courier_service_name}</p>
                      {item.duration && <p style={{ fontSize: '0.7rem', color: c?.textTertiary || '#94a3b8', margin: 0 }}>Estimasi {item.duration}</p>}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: accentColor }}>{formatRupiah(item.price)}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =============================================
// Pesan WhatsApp — dua varian tergantung metode pembayaran
// =============================================

function generateManualOrderMessage(produk, toko, buyer, orderId, voucherApplied) {
  const invoiceUrl = `${window.location.origin}/invoice/${orderId}`
  const tanggal = new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const subtotal = produk.harga * (buyer.qty || 1)
  const diskon = voucherApplied?.diskon || 0
  const total = subtotal - diskon

  const lines = [
    '🛒 *PESANAN BARU*',
    '━━━━━━━━━━━━━━━━━━',
    `📋 *Order ID:* ${orderId}`,
    `📅 *Tanggal:* ${tanggal}`,
    '',
    '👤 *DATA PEMBELI*',
    `Nama: ${buyer.nama}`,
    `WA: ${buyer.wa}`,
    `Alamat: ${buyer.alamat}`,
  ]
  if (buyer.catatan) lines.push(`Catatan: ${buyer.catatan}`)
  lines.push('', '📦 *DETAIL PRODUK*', `• ${produk.nama}`, `  Qty: ${buyer.qty || 1} × ${formatRupiah(produk.harga)}`, `  Subtotal: ${formatRupiah(subtotal)}`)
  if (voucherApplied) {
    lines.push('', '🎟️ *VOUCHER*', `Kode: ${voucherApplied.kode}`, `Diskon: -${formatRupiah(diskon)}`)
  }
  lines.push('', '━━━━━━━━━━━━━━━━━━', `💰 *TOTAL BAYAR: ${formatRupiah(total)}*`, '━━━━━━━━━━━━━━━━━━', '', '🔗 *Invoice:*', invoiceUrl, '', 'Mohon konfirmasi ketersediaan ya! 🙏')
  return lines.join('\n')
}

function generatePaidOrderMessage(produk, toko, buyer, orderId, voucherApplied, metodeLabel, ongkirInfo, feeAmount) {
  const invoiceUrl = `${window.location.origin}/invoice/${orderId}`
  const tanggal = new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const subtotal = produk.harga * (buyer.qty || 1)
  const diskon = voucherApplied?.diskon || 0
  const ongkir = ongkirInfo?.price || 0
  const total = subtotal - diskon + ongkir + (feeAmount || 0)

  const lines = [
    '✅ *PEMBAYARAN DITERIMA*',
    '━━━━━━━━━━━━━━━━━━',
    `📋 *Order ID:* ${orderId}`,
    `📅 *Tanggal:* ${tanggal}`,
    `💳 *Metode:* ${metodeLabel}`,
    '',
    '👤 *DATA PEMBELI*',
    `Nama: ${buyer.nama}`,
    `WA: ${buyer.wa}`,
    `Alamat: ${buyer.alamatDetail}${buyer.areaLabel ? ` (${buyer.areaLabel})` : ''}`,
  ]
  if (buyer.catatan) lines.push(`Catatan: ${buyer.catatan}`)
  lines.push('', '📦 *DETAIL PRODUK*', `• ${produk.nama}`, `  Qty: ${buyer.qty || 1} × ${formatRupiah(produk.harga)}`, `  Subtotal: ${formatRupiah(subtotal)}`)
  if (voucherApplied) {
    lines.push('', '🎟️ *VOUCHER*', `Kode: ${voucherApplied.kode}`, `Diskon: -${formatRupiah(diskon)}`)
  }
  if (ongkirInfo) {
    lines.push('', '🚚 *ONGKIR*', `${ongkirInfo.courier_name} ${ongkirInfo.courier_service_name}: ${formatRupiah(ongkir)}`)
  }
  if (feeAmount > 0) {
    lines.push('', '💳 *BIAYA LAYANAN*', formatRupiah(feeAmount))
  }
  lines.push('', '━━━━━━━━━━━━━━━━━━', `💰 *TOTAL DIBAYAR: ${formatRupiah(total)}*`, '━━━━━━━━━━━━━━━━━━', '', '🔗 *Invoice:*', invoiceUrl, '', 'Pesanan siap diproses, silakan disiapkan ya! 📦')
  return lines.join('\n')
}

// =============================================
// Snap.js loader — dynamic, snapEnv datang dari respons server
// =============================================

function loadSnapScript(snapEnv) {
  return new Promise((resolve, reject) => {
    if (window.snap) { resolve(window.snap); return }

    const existing = document.querySelector('script[data-snap-script]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.snap))
      existing.addEventListener('error', reject)
      return
    }

    const src = snapEnv === 'production'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'

    const script = document.createElement('script')
    script.src = src
    script.setAttribute('data-client-key', CONFIG.MIDTRANS_CLIENT_KEY)
    script.setAttribute('data-snap-script', 'true')
    script.onload = () => resolve(window.snap)
    script.onerror = () => reject(new Error('Gagal memuat script pembayaran'))
    document.head.appendChild(script)
  })
}

const PAYMENT_METHOD_INFO = {
  manual: {
    icon: MessageCircle,
    title: 'Checkout Manual via WhatsApp',
    desc: 'Chat langsung ke penjual untuk konfirmasi & pembayaran.',
    color: '#25D366',
  },
  midtrans_instant: {
    icon: Zap,
    title: 'Exora Pay',
    desc: 'Bayar via QRIS, transfer bank, e-wallet, dll — instan.',
    color: '#5b8af5',
  },
  midtrans_escrow: {
    icon: ShieldCheck,
    title: 'Exora Protect',
    desc: 'Sama seperti Exora Pay, dana ditahan 3 hari untuk keamanan ekstra.',
    color: '#10B981',
  },
}

const DEFAULT_THEME = {
  gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
}

const DEFAULT_C = {
  bgSecondary: '#12121a',
  surface: 'rgba(255,255,255,0.03)',
  surfaceHover: 'rgba(255,255,255,0.06)',
  borderCard: 'rgba(255,255,255,0.1)',
  glassBorder: 'rgba(255,255,255,0.1)',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
}

export default function CheckoutModal({ produk: p, toko, tema = DEFAULT_THEME, accentColor = '#7c3aed', c = DEFAULT_C, onClose, getFlashInfo }) {
  const fotos = parseFotos(p.foto)
  const thumbUrl = fotos[0] || null
  const [form, setForm] = useState({ nama: '', wa: '', alamat: '', alamatDetail: '', catatan: '', qty: 1 })
  const { customer, isAuthenticated } = useCustomerStore()
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [pendingInfo, setPendingInfo] = useState(null)
  const [paymentError, setPaymentError] = useState('')

  const [voucherKode, setVoucherKode] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(null)
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherError, setVoucherError] = useState('')

  const enabledMethods = toko?.paymentMethodsEnabled?.length ? toko.paymentMethodsEnabled : ['manual']
  const showMethodPicker = enabledMethods.length > 1
  const [paymentMethod, setPaymentMethod] = useState(enabledMethods[0] || 'manual')
  const isOnlineMethod = paymentMethod !== 'manual'

  useEffect(() => {
    if (isAuthenticated && customer) {
      setForm(f => ({
        ...f,
        nama: f.nama || customer.name || '',
        wa: f.wa || customer.wa || '',
      }))
    }
  }, [isAuthenticated, customer])

  useEffect(() => {
    if (!enabledMethods.includes(paymentMethod)) {
      setPaymentMethod(enabledMethods[0] || 'manual')
    }
  }, [enabledMethods, paymentMethod])

  // =============================================
  // Pencarian area tujuan (khusus metode online)
  // =============================================
  const [destinationInput, setDestinationInput] = useState('')
  const [destinationArea, setDestinationArea] = useState(null)
  const [destinationOptions, setDestinationOptions] = useState([])
  const [searchingDestination, setSearchingDestination] = useState(false)
  const debouncedDestination = useDebounce(destinationInput, 400)

  useEffect(() => {
    if (!isOnlineMethod) return
    if (debouncedDestination.length < 3) { setDestinationOptions([]); return }
    let cancelled = false
    setSearchingDestination(true)
    biteshipApi.searchArea(debouncedDestination).then(res => {
      if (!cancelled) { setDestinationOptions(res.data || []); setSearchingDestination(false) }
    }).catch(() => { if (!cancelled) setSearchingDestination(false) })
    return () => { cancelled = true }
  }, [debouncedDestination, isOnlineMethod])

  const handleDestinationInput = (val) => {
    setDestinationInput(val)
    setDestinationArea(null)
    setCourierOptions([])
    setSelectedCourier(null)
    setFeePreview(null)
  }

  const handleSelectDestination = (area) => {
    setDestinationArea(area)
    setDestinationInput(area.name)
    setDestinationOptions([])
  }

  // =============================================
  // Ongkir — auto-fetch begitu area tujuan dipilih
  // =============================================
  const [courierOptions, setCourierOptions] = useState([])
  const [selectedCourier, setSelectedCourier] = useState(null)
  const [loadingOngkir, setLoadingOngkir] = useState(false)
  const [ongkirError, setOngkirError] = useState('')

  useEffect(() => {
    if (!isOnlineMethod || !destinationArea || !toko?.originAreaId) return
    setLoadingOngkir(true)
    setOngkirError('')
    biteshipApi.getRates({
      originAreaId: toko.originAreaId,
      destinationAreaId: destinationArea.id,
      weight: 1000,
    }).then(res => {
      const pricings = res.data?.pricing || []
      setCourierOptions(pricings)
      if (pricings.length) {
        const cheapest = pricings.reduce((min, item) => item.price < min.price ? item : min, pricings[0])
        setSelectedCourier(cheapest)
      } else {
        setSelectedCourier(null)
        setOngkirError('Tidak ada layanan kurir tersedia untuk rute ini')
      }
    }).catch(err => {
      setOngkirError(err.message || 'Gagal menghitung ongkir')
    }).finally(() => setLoadingOngkir(false))
  }, [destinationArea, toko?.originAreaId, isOnlineMethod])

  // =============================================
  // Preview fee — dipanggil ulang setiap subtotal/ongkir/qty berubah
  // =============================================
  const [feePreview, setFeePreview] = useState(null)
  const [loadingFeePreview, setLoadingFeePreview] = useState(false)

  const set = (field, val) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: null })) }
  const maxQty = p.stok || 99

  const flashInfo = getFlashInfo ? getFlashInfo(p.id) : null
  const hargaEfektif = flashInfo?.hargaFlash || p.harga
  const subtotalSebelumDiskon = hargaEfektif * form.qty
  const diskonVoucher = voucherApplied?.diskon || 0
  const subtotalSetelahDiskon = subtotalSebelumDiskon - diskonVoucher
  const ongkirAmount = selectedCourier?.price || 0

  useEffect(() => {
    if (!isOnlineMethod || !toko?.id) { setFeePreview(null); return }
    if (!selectedCourier) return
    setLoadingFeePreview(true)
    paymentApi.previewFee({ tokoId: toko.id, subtotal: subtotalSetelahDiskon, ongkir: ongkirAmount })
      .then(res => setFeePreview(res.data))
      .catch(() => setFeePreview(null))
      .finally(() => setLoadingFeePreview(false))
  }, [isOnlineMethod, toko?.id, subtotalSetelahDiskon, ongkirAmount, selectedCourier])

  const grandTotal = isOnlineMethod && feePreview
    ? feePreview.total
    : subtotalSetelahDiskon

  const validate = () => {
    const e = {}
    if (!form.nama.trim()) e.nama = 'Nama wajib diisi'
    if (!form.wa.trim()) e.wa = 'Nomor WA wajib diisi'
    if (form.wa && !validateWA(String(form.wa))) e.wa = 'Format WA tidak valid'

    if (isOnlineMethod) {
      if (!destinationArea) e.destination = 'Pilih kota/kecamatan tujuan'
      if (!form.alamatDetail.trim()) e.alamatDetail = 'Detail alamat wajib diisi'
      if (!selectedCourier) e.courier = 'Kurir belum tersedia untuk rute ini'
    } else {
      if (!form.alamat.trim()) e.alamat = 'Alamat wajib diisi'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleApplyVoucher = async () => {
    if (!voucherKode.trim()) return
    setVoucherLoading(true)
    setVoucherError('')
    setVoucherApplied(null)
    try {
      const res = await voucherApi.validate(toko.id, voucherKode.trim(), subtotalSebelumDiskon)
      if (res.success) { setVoucherApplied(res.data); fireConfetti() }
      else setVoucherError(res.message || 'Voucher tidak valid')
    } catch (e) {
      setVoucherError(e.message || 'Voucher tidak valid')
    }
    setVoucherLoading(false)
  }

  // =============================================
  // Checkout manual — TIDAK berubah
  // =============================================
  const handleCheckoutManual = async (orderId) => {
    const message = generateManualOrderMessage(p, toko, form, orderId, voucherApplied)
    setOrderSuccess({ orderId, produk: p.nama, total: subtotalSetelahDiskon, voucherApplied, metode: 'manual' })
    window.open(generateWALink(toko.wa, message), '_blank')
    if (voucherApplied?.voucherId) voucherApi.redeem(voucherApplied.voucherId).catch(() => {})
    fireConfetti()
  }

  // =============================================
  // Checkout Exora Pay / Protect
  // =============================================
  const handleCheckoutSnap = async (orderId, pesananId) => {
    try {
      const res = await paymentApi.createOrderPayment({
        pesananId,
        tokoId: toko.id,
        subtotal: subtotalSetelahDiskon,
        ongkirAmount,
        kurirEstimasi: selectedCourier ? {
          courier_name: selectedCourier.courier_name,
          courier_service_name: selectedCourier.courier_service_name,
          courier_code: selectedCourier.courier_code,
          courier_service_code: selectedCourier.courier_service_code,
          duration: selectedCourier.duration,
          price: selectedCourier.price,
        } : null,
        paymentMethod,
        buyerName: form.nama,
      })

      const snap = await loadSnapScript(res.data?.snapEnv)

      snap.pay(res.data.snapToken, {
        onSuccess: () => {
          const metodeLabel = PAYMENT_METHOD_INFO[paymentMethod]?.title || 'Pembayaran Online'
          const message = generatePaidOrderMessage(p, toko, { ...form, areaLabel: destinationArea?.name }, orderId, voucherApplied, metodeLabel, selectedCourier, res.data.feeAmount)
          setOrderSuccess({ orderId, produk: p.nama, total: res.data.amount, voucherApplied, metode: paymentMethod })
          window.open(generateWALink(toko.wa, message), '_blank')
          if (voucherApplied?.voucherId) voucherApi.redeem(voucherApplied.voucherId).catch(() => {})
          fireConfetti()
          setSubmitting(false)
        },
        onPending: () => {
          setPendingInfo({ orderId })
          setSubmitting(false)
        },
        onError: () => {
          setPaymentError('Pembayaran gagal. Silakan coba lagi.')
          setSubmitting(false)
        },
        onClose: () => {
          setPaymentError('Pembayaran dibatalkan. Kamu bisa coba lagi.')
          setSubmitting(false)
        },
      })
    } catch (err) {
      setPaymentError(err.message || 'Gagal memulai pembayaran')
      setSubmitting(false)
    }
  }

  const handleCheckout = async () => {
    vibrate(15)
    if (!validate()) return
    setSubmitting(true)
    setPaymentError('')
    try {
      const alamatGabungan = isOnlineMethod
        ? `${form.alamatDetail} (${destinationArea?.name || ''})`
        : form.alamat

      const res = await pesananApi.create({
        tokoId: toko.id,
        produkId: p.id,
        produkNama: p.nama,
        harga: hargaEfektif,
        qty: form.qty,
        total: subtotalSetelahDiskon,
        buyerNama: form.nama,
        buyerWa: form.wa,
        buyerAlamat: alamatGabungan,
        catatan: form.catatan || '',
        customerId: isAuthenticated ? customer?.id : null,
      })
      const orderId = res.data?.orderId || res.data?.order_id || res.data?.id
      const pesananId = res.data?.id

      if (paymentMethod === 'manual') {
        await handleCheckoutManual(orderId)
        setSubmitting(false)
      } else {
        await handleCheckoutSnap(orderId, pesananId)
      }
    } catch (err) {
      alert('Gagal menyimpan pesanan: ' + (err.message || 'Terjadi kesalahan'))
      setSubmitting(false)
    }
  }

  const handleCloseSuccess = () => {
    setOrderSuccess(null)
    onClose()
  }

  if (orderSuccess) {
    const invoiceUrl = `${window.location.origin}/invoice/${orderSuccess.orderId}`
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCloseSuccess}
        style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 480, background: c.bgSecondary, border: `3px solid ${c.borderCard}`, borderRadius: 'var(--radius-2xl, 24px)', padding: '32px 28px', textAlign: 'center' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '3px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
          >
            <Check size={36} color="#34d399" />
          </motion.div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: c.textPrimary, marginBottom: 8 }}>
            {orderSuccess.metode === 'manual' ? 'Pesanan Berhasil! 🎉' : 'Pembayaran Diterima! 🎉'}
          </h2>
          <p style={{ color: c.textSecondary, fontSize: '0.875rem', marginBottom: 24 }}>
            {orderSuccess.metode === 'manual'
              ? 'Pesanan kamu sudah tercatat. Silakan lanjut chat di WhatsApp untuk konfirmasi.'
              : 'Terima kasih! Detail pesanan sudah dikirim ke penjual via WhatsApp.'}
          </p>
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-lg, 12px)', padding: '16px', marginBottom: 20 }}>
            <p style={{ fontSize: '0.72rem', color: c.textTertiary, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Order ID</p>
            <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.25rem', color: '#3b82f6', margin: '8px 0 0', letterSpacing: '0.02em' }}>{orderSuccess.orderId}</p>
          </div>
          <div style={{ background: c.surface, borderRadius: 'var(--radius-lg, 12px)', padding: '16px', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', color: c.textTertiary }}>Produk</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: c.textPrimary }}>{orderSuccess.produk}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${c.glassBorder}` }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: c.textPrimary }}>Total</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: accentColor }}>{formatRupiah(orderSuccess.total)}</span>
            </div>
          </div>
          <a href={invoiceUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', background: c.surface, border: `2px solid ${c.glassBorder}`, borderRadius: 'var(--radius-lg, 12px)', color: c.textPrimary, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, marginBottom: 12 }}>
            📄 Lihat Invoice
          </a>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCloseSuccess}
            style={{ width: '100%', padding: '14px', background: tema.gradient, color: '#fff', border: 'none', borderRadius: 'var(--radius-full, 9999px)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: `0 4px 20px ${accentColor}44` }}
          >
            Tutup
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  if (pendingInfo) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 480, background: c.bgSecondary, border: `3px solid ${c.borderCard}`, borderRadius: 'var(--radius-2xl, 24px)', padding: '32px 28px', textAlign: 'center' }}
        >
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '3px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Loader size={32} color="#f59e0b" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: c.textPrimary, marginBottom: 8 }}>Menunggu Pembayaran</h2>
          <p style={{ color: c.textSecondary, fontSize: '0.875rem', marginBottom: 20 }}>
            Selesaikan pembayaran sesuai instruksi. Order ID: <strong>{pendingInfo.orderId}</strong>. Notifikasi otomatis akan dikirim ke penjual begitu pembayaran kamu terkonfirmasi.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            style={{ width: '100%', padding: '14px', background: tema.gradient, color: '#fff', border: 'none', borderRadius: 'var(--radius-full, 9999px)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
          >
            Tutup
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  const originMissing = isOnlineMethod && !toko?.originAreaId

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end' }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: c.bgSecondary, border: `3px solid ${c.borderCard}`, borderRadius: 'var(--radius-2xl, 24px) var(--radius-2xl, 24px) 0 0', maxHeight: '92vh', overflow: 'auto' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `3px solid ${c.borderCard}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: c.bgSecondary, zIndex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: c.textPrimary }}>Detail Pesanan</h3>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></motion.button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', padding: '12px', background: c.surface, borderRadius: 'var(--radius-lg, 12px)', border: `3px solid ${c.borderCard}` }}>
            {thumbUrl && <img src={thumbUrl} alt={p.nama} loading="lazy" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-md, 8px)', flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 3, color: c.textPrimary }}>{p.nama}</p>
              <p style={{ color: accentColor, fontWeight: 800, fontSize: '0.9rem' }}>{formatRupiah(hargaEfektif)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => set('qty', Math.max(1, form.qty - 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: c.surfaceHover, border: `2px solid ${c.glassBorder}`, cursor: 'pointer', color: c.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Minus size={12} />
              </motion.button>
              <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontSize: '0.9rem', color: c.textPrimary }}>{form.qty}</span>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => set('qty', Math.min(maxQty, form.qty + 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: c.surfaceHover, border: `2px solid ${c.glassBorder}`, cursor: 'pointer', color: c.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={12} />
              </motion.button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input className={`form-input ${errors.nama ? 'error' : ''}`} placeholder="Nama penerima" value={form.nama} onChange={e => set('nama', e.target.value)} style={{ border: '2px solid var(--glass-border, rgba(255,255,255,0.1))' }} />
            {errors.nama && <span className="form-error">{errors.nama}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Nomor WhatsApp *</label>
            <input className={`form-input ${errors.wa ? 'error' : ''}`} placeholder="081234567890" value={form.wa} onChange={e => set('wa', e.target.value)} style={{ border: '2px solid var(--glass-border, rgba(255,255,255,0.1))' }} />
            {errors.wa && <span className="form-error">{errors.wa}</span>}
          </div>

          {showMethodPicker && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', letterSpacing: '0.05em' }}>METODE PEMBAYARAN</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                {enabledMethods.map(key => {
                  const info = PAYMENT_METHOD_INFO[key]
                  if (!info) return null
                  const active = paymentMethod === key
                  return (
                    <div
                      key={key}
                      onClick={() => setPaymentMethod(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 'var(--radius-md, 8px)',
                        background: active ? `${info.color}12` : c.surface,
                        border: `2px solid ${active ? `${info.color}55` : c.glassBorder}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm, 6px)', background: `${info.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color, flexShrink: 0 }}>
                        <info.icon size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.8rem', color: c.textPrimary, margin: 0 }}>{info.title}</p>
                        <p style={{ fontSize: '0.7rem', color: c.textTertiary, margin: 0 }}>{info.desc}</p>
                      </div>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? info.color : c.glassBorder}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: info.color }} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {isOnlineMethod ? (
            originMissing ? (
              <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '2px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md, 8px)', fontSize: '0.8rem', color: '#f87171' }}>
                Toko ini belum mengisi kota asal pengiriman, sehingga ongkir belum bisa dihitung otomatis. Silakan gunakan Checkout Manual, atau hubungi penjual.
              </div>
            ) : (
              <>
                <DestinationAreaSearch
                  value={destinationInput}
                  onInputChange={handleDestinationInput}
                  options={destinationOptions}
                  searching={searchingDestination}
                  onSelect={handleSelectDestination}
                  c={c}
                />
                {errors.destination && <span className="form-error">{errors.destination}</span>}

                {destinationArea && (
                  <div className="form-group">
                    <label className="form-label">Detail Alamat *</label>
                    <textarea
                      className={`form-input form-textarea ${errors.alamatDetail ? 'error' : ''}`}
                      placeholder="Nama jalan, nomor rumah, patokan..."
                      value={form.alamatDetail}
                      onChange={e => set('alamatDetail', e.target.value)}
                      rows={2}
                      style={{ border: '2px solid var(--glass-border, rgba(255,255,255,0.1))' }}
                    />
                    {errors.alamatDetail && <span className="form-error">{errors.alamatDetail}</span>}
                  </div>
                )}

                {loadingOngkir && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', color: c.textTertiary, fontSize: '0.8rem' }}>
                    <span className="spinner" style={{ width: 14, height: 14 }} /> Menghitung ongkir...
                  </div>
                )}
                {ongkirError && !loadingOngkir && (
                  <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '2px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md, 8px)', fontSize: '0.8rem', color: '#f87171' }}>
                    {ongkirError}
                  </div>
                )}
                {selectedCourier && !loadingOngkir && (
                  <CourierPicker pricings={courierOptions} selected={selectedCourier} onSelect={setSelectedCourier} c={c} accentColor={accentColor} />
                )}
                {errors.courier && <span className="form-error">{errors.courier}</span>}
              </>
            )
          ) : (
            <div className="form-group">
              <label className="form-label">Alamat Pengiriman *</label>
              <textarea className={`form-input form-textarea ${errors.alamat ? 'error' : ''}`} placeholder="Alamat lengkap pengiriman..." value={form.alamat} onChange={e => set('alamat', e.target.value)} rows={3} style={{ border: '2px solid var(--glass-border, rgba(255,255,255,0.1))' }} />
              {errors.alamat && <span className="form-error">{errors.alamat}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Catatan (Opsional)</label>
            <input className="form-input" placeholder="Warna, ukuran, atau permintaan khusus..." value={form.catatan} onChange={e => set('catatan', e.target.value)} style={{ border: '2px solid var(--glass-border, rgba(255,255,255,0.1))' }} />
          </div>

          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', letterSpacing: '0.05em' }}>KODE VOUCHER</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                value={voucherKode}
                onChange={e => { setVoucherKode(e.target.value.toUpperCase()); setVoucherApplied(null); setVoucherError('') }}
                placeholder="Masukkan kode voucher"
                disabled={!!voucherApplied}
                className="form-input"
                style={{ flex: 1, padding: '9px 12px', border: `2px solid ${voucherApplied ? '#22c55e' : 'var(--glass-border, rgba(255,255,255,0.1))'}`, fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.05em' }}
              />
              {voucherApplied ? (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setVoucherApplied(null); setVoucherKode('') }} style={{ padding: '9px 14px', borderRadius: 8, fontSize: 12, background: 'transparent', border: '2px solid #ef4444', color: '#ef4444', cursor: 'pointer', whiteSpace: 'nowrap' }}>Hapus</motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleApplyVoucher} disabled={voucherLoading || !voucherKode.trim()} style={{ padding: '9px 14px', borderRadius: 8, fontSize: 12, background: accentColor, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', opacity: voucherLoading || !voucherKode.trim() ? 0.6 : 1 }}>{voucherLoading ? '...' : 'Pakai'}</motion.button>
              )}
            </div>
            {voucherError && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{voucherError}</div>}
            {voucherApplied && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Voucher {voucherApplied.kode} berhasil dipakai</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>-Rp {Number(diskonVoucher).toLocaleString('id-ID')}</span>
              </motion.div>
            )}
          </div>

          {paymentError && (
            <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '2px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md, 8px)', fontSize: '0.82rem', color: '#f87171' }}>
              {paymentError}
            </div>
          )}

          <div style={{ padding: '12px 14px', background: `${accentColor}12`, border: `3px solid ${accentColor}22`, borderRadius: 'var(--radius-lg, 12px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: c.textSecondary }}>
              <span>Subtotal</span>
              <span>{formatRupiah(subtotalSebelumDiskon)}</span>
            </div>
            {diskonVoucher > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#16a34a' }}>
                <span>Diskon voucher</span>
                <span>-{formatRupiah(diskonVoucher)}</span>
              </div>
            )}
            {isOnlineMethod && selectedCourier && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: c.textSecondary }}>
                <span>Ongkir ({selectedCourier.courier_name})</span>
                <span>{formatRupiah(ongkirAmount)}</span>
              </div>
            )}
            {isOnlineMethod && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: c.textSecondary }}>
                <span>Biaya layanan {PAYMENT_METHOD_INFO[paymentMethod]?.title}</span>
                <span>{loadingFeePreview ? '...' : feePreview ? formatRupiah(feePreview.feeAmount) : '—'}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${accentColor}33` }}>
              <span style={{ fontWeight: 700, color: c.textPrimary }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: accentColor }}>
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          <MagneticButton strength={0.2} style={{ width: '100%' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              disabled={submitting || (isOnlineMethod && (originMissing || !selectedCourier))}
              style={{ width: '100%', height: 48, background: submitting ? c.surface : tema.gradient, color: submitting ? c.textTertiary : '#fff', border: 'none', borderRadius: 'var(--radius-full, 9999px)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: submitting ? 'none' : `0 4px 24px ${accentColor}44` }}
            >
              {paymentMethod === 'manual' ? <MessageCircle size={17} /> : <Zap size={17} />}
              {submitting ? 'Memproses...' : paymentMethod === 'manual' ? 'Pesan via WhatsApp' : 'Bayar Sekarang'}
            </motion.button>
          </MagneticButton>
          <p style={{ textAlign: 'center', color: c.textTertiary, fontSize: '0.72rem' }}>
            {paymentMethod === 'manual'
              ? 'Kamu akan diarahkan ke WhatsApp penjual dengan detail pesanan otomatis'
              : 'Kamu akan diarahkan ke halaman pembayaran aman'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
