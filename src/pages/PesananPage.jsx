import React, { useEffect, useRef, useState } from 'react'
import { ShoppingBag, MessageCircle, ChevronDown, Search, Download, Truck, Share2, Printer, FileText, Package, Check } from 'lucide-react'
import DashboardLayout from '../components/seller/DashboardLayout'
import { EmptyState } from '../components/ui'
import RocketLaunch from '../components/ui/RocketLaunch'
import { useAuthStore } from '../lib/store'
import { pesananApi } from '../lib/api'
import { formatRupiah, formatDateTime, generateWALink, PESANAN_STATUS } from '../lib/utils'
import { CONFIG } from '../lib/config'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const STATUS_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'confirmed', label: 'Dikonfirmasi' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'done', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
]

const KURIR_LIST = [
  'J&T Express', 'JNE', 'SiCepat', 'Anteraja', 'Ninja Xpress',
  'Lion Parcel', 'Pos Indonesia', 'Tiki', 'SAP Express', 'Lainnya',
]

const STATUS_KETERANGAN = {
  pending: 'Pesanan kamu sudah kami terima, segera kami proses ya!',
  confirmed: 'Pesanan kamu sudah kami konfirmasi, sedang diproses!',
  processing: 'Pesanan kamu sedang kami proses, mohon ditunggu ya!',
  shipped: 'Pesanan kamu sudah dikirim, segera cek resi pengiriman ya!',
  done: 'Pesanan kamu sudah selesai, terima kasih sudah berbelanja!',
  cancelled: 'Mohon maaf, pesanan kamu dibatalkan. Silakan hubungi kami untuk info lebih lanjut.',
}

function generatePesananWAMessage(p, tokoSlug) {
  const statusLabel = PESANAN_STATUS[p.status] ? PESANAN_STATUS[p.status].label : p.status
  const keterangan = STATUS_KETERANGAN[p.status] || ''
  const invoiceUrl = `${window.location.origin}/invoice/${p.orderId || p.id}`

  const lines = [
    'Halo ' + p.buyerNama + ', berikut info pesanan kamu:',
    '',
  ]

  if (p.orderId) {
    lines.push(`📋 *Order ID: ${p.orderId}*`)
    lines.push('')
  }

  lines.push('*' + p.produkNama + '*')
  lines.push('Qty: ' + p.qty)
  lines.push('Total: ' + formatRupiah(p.total))
  lines.push('Alamat: ' + p.buyerAlamat)

  if (p.catatan) lines.push('Catatan: ' + p.catatan)

  lines.push('')
  lines.push('Status: *' + statusLabel + '*')
  if (keterangan) lines.push(keterangan)

  lines.push('')
  lines.push('🔗 *Lihat invoice:*')
  lines.push(invoiceUrl)

  return lines.join('\n')
}

function generateShippingWAMessage(p, kurir, resi, tokoSlug) {
  const trackUrl = CONFIG.APP_URL + '/r/' + resi
  const invoiceUrl = `${window.location.origin}/invoice/${p.orderId || p.id}`

  const lines = [
    'Halo ' + p.buyerNama + ', pesanan kamu sudah kami kirim! 🚚',
    '',
  ]

  if (p.orderId) {
    lines.push(`📋 *Order ID: ${p.orderId}*`)
    lines.push('')
  }

  lines.push('*' + p.produkNama + '* x' + p.qty)
  lines.push('Total: ' + formatRupiah(p.total))
  lines.push('')
  lines.push('Info Pengiriman:')
  lines.push('Kurir: *' + kurir + '*')
  lines.push('No. Resi: *' + resi + '*')
  lines.push('')
  lines.push('🔍 Lacak pesananmu di sini:')
  lines.push(trackUrl)
  lines.push('')
  lines.push('🧾 Lihat invoice:')
  lines.push(invoiceUrl)
  lines.push('')
  lines.push('Terima kasih sudah berbelanja 🙏')

  return lines.join('\n')
}

function exportToExcel(pesanan) {
  if (!pesanan.length) {
    toast.error('Tidak ada data untuk diekspor')
    return
  }

  const rows = pesanan.map(function(p) {
    const produkList = p.items && p.items.length
      ? p.items.map(function(i) { return i.nama + ' x' + i.qty }).join('; ')
      : (p.produkNama + ' x' + p.qty)

    return {
      'Order ID': p.orderId || '',
      'ID Pesanan': p.id || '',
      'Tanggal': formatDateTime(p.createdAt),
      'Nama Pembeli': p.buyerNama || '',
      'WA Pembeli': p.buyerWa || '',
      'Alamat': p.buyerAlamat || '',
      'Catatan': p.catatan || '',
      'Produk': produkList,
      'Total': p.total || 0,
      'Status': PESANAN_STATUS[p.status] ? PESANAN_STATUS[p.status].label : (p.status || ''),
      'Kurir': p.kurir || '',
      'Resi': p.resi || '',
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)

  ws['!cols'] = [
    { wch: 18 }, { wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
    { wch: 30 }, { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 18 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pesanan')

  XLSX.writeFile(wb, 'pesanan-' + new Date().toISOString().slice(0, 10) + '.xlsx')
  toast.success('Data berhasil diekspor!')
}

// Custom dropdown status — ganti native <select> biar stylingnya konsisten
// (dark/glass) dan gak numpang ke picker bawaan OS.
function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = PESANAN_STATUS[value] || {}

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const dotColorFor = (colorKey) => colorKey === 'success' ? 'var(--success)'
    : colorKey === 'warning' ? 'var(--warning)'
    : colorKey === 'danger' ? 'var(--danger)'
    : 'var(--accent)'

   const handleToggle = () => setOpen(o => !o)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleToggle}
        className="btn btn-sm"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)',
          border: `1px solid ${open ? 'var(--accent)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontSize: '0.78rem',
          height: 34,
          padding: '6px 10px 6px 12px',
          cursor: 'pointer',
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: dotColorFor(current.color),
        }} />
        <span>{current.label || value}</span>
        <ChevronDown
          size={13}
          style={{
            color: 'var(--text-tertiary)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 4px)',
          right: 0, zIndex: 100,
          minWidth: 180,
          maxHeight: 260,
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {Object.entries(PESANAN_STATUS).map(([key, val]) => {
            const selected = key === value
            return (
              <button
                key={key}
                type="button"
                onClick={() => { onChange(key); setOpen(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  background: selected ? 'rgba(91,138,245,0.1)' : 'transparent',
                  border: 'none',
                  color: selected ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: '0.82rem', fontWeight: selected ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--surface-hover)' }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: dotColorFor(val.color),
                }} />
                <span style={{ flex: 1 }}>{val.label}</span>
                {selected && <Check size={14} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PesananPage() {
  const { user, token } = useAuthStore()
  const tokenObj = token
  const [pesanan, setPesanan] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  // === ROCKET LAUNCH STATE (CONFETTI) ===
  const [showRocket, setShowRocket] = useState(false)
  const [rocketKey, setRocketKey] = useState(0)

  useEffect(() => {
    if (token) loadPesanan()
    else setIsLoading(false)
  }, [token])

  const loadPesanan = async () => {
    setIsLoading(true)
    try {
      const res = await pesananApi.getMine(tokenObj)
      setPesanan(res.data || [])
    } catch (err) {
      toast.error('Gagal memuat pesanan')
    } finally {
      setIsLoading(false)
    }
  }

  // === ROCKET TRIGGER HELPER ===
  const triggerRocket = () => {
    setRocketKey(prev => prev + 1)
    setShowRocket(true)
    setTimeout(() => setShowRocket(false), 2500)
  }

  const handleStatusChange = async (pesananId, status) => {
    try {
      await pesananApi.updateStatus(tokenObj, pesananId, status)
      setPesanan(ps => ps.map(p => p.id === pesananId ? { ...p, status } : p))

      // Trigger confetti untuk shipped & done
      if (status === 'shipped' || status === 'done') {
        triggerRocket()
      }

      if (status === 'shipped') {
        toast.success('Pesanan berhasil dikirim! 🚀')
      } else if (status === 'done') {
        toast.success('Pesanan selesai! Terima kasih 🎉')
      } else {
        toast.success('Status diperbarui')
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  const filtered = pesanan.filter(p => {
    const matchTab = activeTab === 'all' || p.status === activeTab
    const matchSearch = !search ||
      (p.buyerNama && p.buyerNama.toLowerCase().includes(search.toLowerCase())) ||
      (p.orderId && p.orderId.toLowerCase().includes(search.toLowerCase())) ||
      (p.id && p.id.includes(search))
    return matchTab && matchSearch
  })

  return (
    <DashboardLayout
      title="Pesanan"
      subtitle={pesanan.filter(p => p.status === 'pending').length + ' menunggu konfirmasi'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: 4, flex: 1 }}>
            {STATUS_TABS.map(t => {
              const count = t.key === 'all' ? pesanan.length : pesanan.filter(p => p.status === t.key).length
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="btn btn-sm"
                  style={{
                    flexShrink: 0,
                    background: activeTab === t.key ? 'var(--surface-active)' : 'var(--surface)',
                    color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: '1px solid ' + (activeTab === t.key ? 'var(--glass-border-hover)' : 'var(--glass-border)'),
                    borderRadius: 'var(--radius-full)',
                    gap: 6,
                  }}
                >
                  {t.label}
                  {count > 0 && (
                    <span style={{
                      background: activeTab === t.key ? 'var(--accent)' : 'var(--surface-hover)',
                      color: activeTab === t.key ? '#fff' : 'var(--text-tertiary)',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700,
                    }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => exportToExcel(filtered)}
            className="btn btn-secondary btn-sm"
            style={{ flexShrink: 0, gap: 6 }}
            disabled={filtered.length === 0}
          >
            <Download size={14} />
            Export Excel
          </button>
        </div>

        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Cari nama pembeli / Order ID / ID pesanan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={28} />}
            title={search ? 'Pesanan tidak ditemukan' : activeTab !== 'all' ? 'Tidak ada pesanan ' + (STATUS_TABS.find(t => t.key === activeTab) || {}).label : 'Belum ada pesanan'}
            description={activeTab === 'all' ? 'Pesanan dari pembeli akan muncul di sini' : 'Coba tab lain'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(p => (
              <PesananCard
                key={p.id}
                pesanan={p}
                tokenObj={tokenObj}
                onStatusChange={handleStatusChange}
                setPesanan={setPesanan}
                onRocketTrigger={triggerRocket}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confetti Animation */}
      <RocketLaunch key={rocketKey} show={showRocket} duration={2500} />
    </DashboardLayout>
  )
}

function PesananCard({ pesanan: p, tokenObj, onStatusChange, setPesanan, onRocketTrigger }) {
  const [expanded, setExpanded] = useState(false)
  const [kurirOpen, setKurirOpen] = useState(false)
  const [kurir, setKurir] = useState(KURIR_LIST[0])
  const [resi, setResi] = useState('')
  const [sendingKurir, setSendingKurir] = useState(false)
  const statusCfg = PESANAN_STATUS[p.status] || PESANAN_STATUS.pending

  const dotColor = statusCfg.color === 'success' ? 'var(--success)'
    : statusCfg.color === 'warning' ? 'var(--warning)'
    : statusCfg.color === 'danger' ? 'var(--danger)'
    : 'var(--accent)'

  const tokoSlug = p.tokoSlug || p.tokoId || ''
  const waMessage = generatePesananWAMessage(p, tokoSlug)

  const handleKirim = async () => {
    if (!resi.trim()) {
      toast.error('Nomor resi wajib diisi')
      return
    }
    setSendingKurir(true)
    try {
      await pesananApi.updateStatus(tokenObj, p.id, 'shipped', kurir, resi)
      setPesanan(ps => ps.map(x => x.id === p.id ? { ...x, status: 'shipped', kurir, resi } : x))
      const msg = generateShippingWAMessage(p, kurir, resi, tokoSlug)
      window.open(generateWALink(p.buyerWa, msg), '_blank')
      setKurirOpen(false)

      // Trigger confetti animation
      if (onRocketTrigger) onRocketTrigger()
      toast.success('Status dikirim & WA terkirim! 🚀')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSendingKurir(false)
    }
  }

  const handleCekResi = () => {
    if (!p.resi) {
      toast.error('Nomor resi belum tersedia')
      return
    }
    window.open(`/r/${p.resi}`, '_blank')
  }

  const handleShareInvoice = () => {
    const invoiceUrl = `${window.location.origin}/invoice/${p.orderId || p.id}`
    navigator.clipboard.writeText(invoiceUrl)
    toast.success('Link invoice disalin ke clipboard!')
  }

  const handlePrintInvoice = () => {
    window.open(`/invoice/${p.orderId || p.id}?print=true`, '_blank')
  }

  const canShip = p.status !== 'shipped' && p.status !== 'done' && p.status !== 'cancelled'

  return (
    <div className="glass-card" style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)' }}>
      {/* Header card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: dotColor,
          boxShadow: '0 0 6px ' + dotColor,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.buyerNama || 'Pembeli'}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            {p.orderId ? (
              <>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{p.orderId}</span>
                {' · '}
              </>
            ) : null}
            {'#' + (p.id ? p.id.slice(-8) : '-') + ' · ' + formatDateTime(p.createdAt)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span className={'badge badge-' + statusCfg.color} style={{ fontSize: '0.68rem' }}>{statusCfg.label}</span>
          <button onClick={() => setExpanded(!expanded)} className="btn btn-ghost btn-icon btn-sm">
            <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 8, paddingLeft: 18 }}>
        <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.9rem' }}>{formatRupiah(p.total)}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.produkNama ? (p.produkNama + ' x' + p.qty) : ((p.items ? p.items.length : 0) + ' item')}
        </p>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--glass-border)' }}>

          {/* Order ID Badge */}
          {p.orderId && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 12,
              fontSize: '0.82rem',
            }}>
              <FileText size={14} color="var(--accent)" />
              <span style={{ color: 'var(--text-secondary)' }}>Order ID:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>{p.orderId}</span>
            </div>
          )}

          {/* Produk detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 14 }}>
            {p.items && p.items.length > 0 ? (
              p.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.foto && (
                      <img src={item.foto} alt={item.nama} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                    )}
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.nama}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{'x ' + item.qty}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, flexShrink: 0 }}>{formatRupiah(item.harga * item.qty)}</p>
                </div>
              ))
            ) : p.produkNama ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.produkNama}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{'x ' + p.qty}</p>
                </div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>{formatRupiah(p.total)}</p>
              </div>
            ) : null}
          </div>

          {/* Info buyer */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: 12, fontSize: '0.82rem' }}>
            <p style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Nama: </span>{p.buyerNama}
            </p>
            <p style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>WA: </span>{p.buyerWa}
            </p>
            {p.buyerAlamat && (
              <p style={{ marginBottom: 4 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Alamat: </span>{p.buyerAlamat}
              </p>
            )}
            {p.catatan && (
              <p style={{ marginBottom: 0 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Catatan: </span>{p.catatan}
              </p>
            )}
            {p.resi && (
              <p style={{ marginBottom: 0, marginTop: 4 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Resi: </span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>{p.kurir} — {p.resi}</span>
              </p>
            )}
          </div>

          {/* Action icons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href={generateWALink(p.buyerWa, waMessage)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-icon btn-sm"
              title="Chat via WA"
            >
              <MessageCircle size={15} />
            </a>

            <button
              onClick={handleShareInvoice}
              className="btn btn-secondary btn-icon btn-sm"
              title="Share Invoice"
            >
              <Share2 size={15} />
            </button>

            <button
              onClick={handlePrintInvoice}
              className="btn btn-secondary btn-icon btn-sm"
              title="Print Invoice"
            >
              <Printer size={15} />
            </button>

            {p.resi && (
              <button
                onClick={handleCekResi}
                className="btn btn-secondary btn-icon btn-sm"
                title="Cek Resi"
                style={{
                  background: 'rgba(6,182,212,0.1)',
                  border: '1px solid rgba(6,182,212,0.3)',
                  color: '#0891b2',
                }}
              >
                <Package size={15} />
              </button>
            )}

            {p.status !== 'done' && p.status !== 'cancelled' && (
              <StatusDropdown
                value={p.status}
                onChange={(newStatus) => onStatusChange(p.id, newStatus)}
              />
            )}

            {canShip && (
              <button
                onClick={() => setKurirOpen(!kurirOpen)}
                className="btn btn-icon btn-sm"
                title="Input kurir & resi"
                style={{
                  background: kurirOpen ? 'var(--accent-gradient)' : 'var(--surface)',
                  border: '1px solid var(--glass-border)',
                  color: kurirOpen ? '#fff' : 'var(--text-secondary)',
                }}
              >
                <Truck size={15} />
              </button>
            )}
          </div>

          {/* Form kurir & resi */}
          {kurirOpen && canShip && (
            <div style={{
              marginTop: 12, padding: '14px',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <div className="form-group">
                <label className="form-label">Kurir</label>
                <select
                  className="form-input form-select"
                  value={kurir}
                  onChange={e => setKurir(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {KURIR_LIST.map(k => (
                    <option key={k} value={k} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{k}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nomor Resi</label>
                <input
                  className="form-input"
                  placeholder="cth: JT1234567890"
                  value={resi}
                  onChange={e => setResi(e.target.value)}
                />
              </div>
              <button
                onClick={handleKirim}
                disabled={sendingKurir || !resi.trim()}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', gap: 6 }}
              >
                <Truck size={14} />
                {sendingKurir ? 'Menyimpan...' : 'Simpan & Kirim WA'}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
