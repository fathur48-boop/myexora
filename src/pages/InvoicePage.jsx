import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Printer, Share2, ArrowLeft, MessageCircle, CheckCircle2, Clock, Truck, FileText, Store } from 'lucide-react'
import { pesananApi } from '../lib/api'
import { formatRupiah, formatDateTime, generateWALink, PESANAN_STATUS } from '../lib/utils'
import toast from 'react-hot-toast'

export default function InvoicePage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [pesanan, setPesanan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const autoPrint = searchParams.get('print') === 'true'

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true)
      try {
        const res = await pesananApi.getById(id)
        if (res.success && res.data) {
          setPesanan(res.data)
        } else {
          setError('Invoice tidak ditemukan atau telah dihapus.')
        }
      } catch (err) {
        setError(err.message || 'Gagal memuat data invoice.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchInvoice()
    }
  }, [id])

  useEffect(() => {
    if (pesanan && autoPrint) {
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [pesanan, autoPrint])

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link invoice berhasil disalin!')
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-primary, #0f0f14)',
        color: 'var(--text-primary, #fff)', padding: 24,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Memuat Invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !pesanan) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 16,
        background: 'var(--bg-primary, #0f0f14)', color: 'var(--text-primary, #fff)',
        padding: 24, textAlign: 'center',
      }}>
        <FileText size={48} color="var(--text-tertiary)" />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Invoice Tidak Ditemukan</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 360, margin: 0, fontSize: 14 }}>
          {error || 'Nomor order tidak valid.'}
        </p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>
      </div>
    )
  }

  const statusCfg = PESANAN_STATUS[pesanan.status] || PESANAN_STATUS.pending
  const items = pesanan.items && pesanan.items.length > 0 
    ? pesanan.items 
    : [{ nama: pesanan.produkNama || 'Produk', qty: pesanan.qty || 1, harga: pesanan.total / (pesanan.qty || 1) }]

  const subtotal = items.reduce((acc, item) => acc + (item.harga * item.qty), 0)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0c10',
      color: '#f1f5f9',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-card {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
          .invoice-text-muted {
            color: #64748b !important;
          }
          .invoice-header-bg {
            background: #f8fafc !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .invoice-table-header {
            background: #f1f5f9 !important;
            color: #0f172a !important;
          }
        }
      `}</style>

      {/* Top Bar Navigation & Actions (No Print) */}
      <div className="no-print" style={{
        width: '100%', maxWidth: 720,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <Link to="/pesanan" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          <ArrowLeft size={15} /> Kembali
        </Link>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleShare} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
            <Share2 size={15} /> Bagikan
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
            <Printer size={15} /> Cetak / Download PDF
          </button>
        </div>
      </div>

      {/* Main Invoice Card */}
      <div className="invoice-card" style={{
        width: '100%', maxWidth: 720,
        background: '#161822',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
      }}>
        {/* Invoice Header */}
        <div className="invoice-header-bg" style={{
          padding: '28px 24px',
          background: 'linear-gradient(135deg, rgba(91, 138, 245, 0.12) 0%, rgba(26, 26, 36, 0.8) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Store size={22} color="var(--accent, #5b8af5)" />
              <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: '#fff' }}>
                Exora Store
              </span>
            </div>
            <div className="invoice-text-muted" style={{ fontSize: 13, color: 'var(--text-tertiary, #94a3b8)' }}>
              Platform Toko Online Serba Bisa
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 100,
              fontSize: 12, fontWeight: 700,
              background: statusCfg.color === 'success' ? 'rgba(34, 197, 94, 0.15)' : statusCfg.color === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(91, 138, 245, 0.15)',
              color: statusCfg.color === 'success' ? '#22c55e' : statusCfg.color === 'warning' ? '#f59e0b' : '#5b8af5',
              border: `1px solid ${statusCfg.color === 'success' ? '#22c55e' : statusCfg.color === 'warning' ? '#f59e0b' : '#5b8af5'}`,
              marginBottom: 8,
            }}>
              {statusCfg.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: '#fff' }}>
              {pesanan.orderId || pesanan.id}
            </div>
            <div className="invoice-text-muted" style={{ fontSize: 12, color: 'var(--text-tertiary, #94a3b8)', marginTop: 2 }}>
              Tanggal: {formatDateTime(pesanan.createdAt)}
            </div>
          </div>
        </div>

        {/* Invoice Info Grid */}
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div>
            <div className="invoice-text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary, #94a3b8)', letterSpacing: '0.05em', marginBottom: 6 }}>
              INFORMASI PEMBELI
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{pesanan.buyerNama}</div>
            <div className="invoice-text-muted" style={{ fontSize: 13, color: 'var(--text-secondary, #cbd5e1)' }}>WhatsApp: {pesanan.buyerWa}</div>
            {pesanan.buyerAlamat && (
              <div className="invoice-text-muted" style={{ fontSize: 13, color: 'var(--text-secondary, #cbd5e1)', marginTop: 4, lineHeight: 1.4 }}>
                Alamat: {pesanan.buyerAlamat}
              </div>
            )}
          </div>

          <div>
            <div className="invoice-text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary, #94a3b8)', letterSpacing: '0.05em', marginBottom: 6 }}>
              PENGIRIMAN & CATATAN
            </div>
            {pesanan.kurir ? (
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                <span className="invoice-text-muted" style={{ color: 'var(--text-tertiary, #94a3b8)' }}>Kurir: </span>
                <strong>{pesanan.kurir}</strong>
                {pesanan.resi && (
                  <div>
                    <span className="invoice-text-muted" style={{ color: 'var(--text-tertiary, #94a3b8)' }}>No. Resi: </span>
                    <strong style={{ color: '#22c55e', fontFamily: 'monospace' }}>{pesanan.resi}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="invoice-text-muted" style={{ fontSize: 13, color: 'var(--text-tertiary, #94a3b8)' }}>
                Belum dikirim
              </div>
            )}

            {pesanan.catatan && (
              <div style={{ fontSize: 13, marginTop: 8, fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                "{pesanan.catatan}"
              </div>
            )}
          </div>
        </div>

        {/* Table Item Orders */}
        <div style={{ padding: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr className="invoice-table-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-tertiary, #94a3b8)' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Produk</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Harga</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{item.nama}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{formatRupiah(item.harga)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>{formatRupiah(item.harga * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary, #cbd5e1)' }}>
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary, #cbd5e1)' }}>
                <span>Biaya Pengiriman</span>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>Gratis</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800,
                paddingTop: 12, marginTop: 4, borderTop: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--accent, #5b8af5)',
              }}>
                <span>Total Bayar</span>
                <span>{formatRupiah(pesanan.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px', background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary, #94a3b8)',
        }}>
          Terima kasih telah berbelanja! Simpan invoice ini sebagai bukti transaksi resmi.
        </div>
      </div>
    </div>
  )
}
