import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Save, Store, User, Bot, Upload, X, Lock, Wallet, Zap, ShieldCheck, MessageCircle, Palette, LayoutGrid, LayoutList, Star, ChevronDown } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import DashboardLayout from '../components/seller/DashboardLayout'
import { Alert } from '../components/ui'
import { useAuthStore, useTokoStore } from '../lib/store'
import { tokoApi, tokoInfoApi, voucherApi } from '../lib/api'
import { biteshipApi } from '../lib/api/biteshipClient'
import { validateWA, getStorefrontUrl, isPro, getTierLevel, getPlanDisplayName, compressImage, safeFetchJson } from '../lib/utils'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const CLOUDINARY_CLOUD = 'dgplz1pd0'
const CLOUDINARY_PRESET = 'tokoku'

async function uploadLogoToCloudinary(file) {
  const compressed = await compressImage(file, 400, 0.85)
  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('upload_preset', CLOUDINARY_PRESET)
  formData.append('folder', 'tokoku/logos')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Upload logo gagal')
  const data = await safeFetchJson(res)
  return data.secure_url
}

export default function SettingsPage() {
  const { user, token } = useAuthStore()
  const tokenObj = token
  const { toko, setToko, load: loadToko } = useTokoStore()

  const [tab, setTab] = useState('toko')
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)
  const [tokoLoading, setTokoLoading] = useState(true)

  // 4-tier logic
  const tierLevel = getTierLevel(user?.plan)
  const planName = getPlanDisplayName(user?.plan)
  const canAccessProFeatures = tierLevel >= 2

  // Voucher state
  const [vouchers, setVouchers] = useState([])
  const [vouchersLoading, setVouchersLoading] = useState(true)
  const [showVoucherForm, setShowVoucherForm] = useState(false)
  const [voucherKode, setVoucherKode] = useState('')
  const [voucherTipe, setVoucherTipe] = useState('persen')
  const [voucherNilai, setVoucherNilai] = useState('')
  const [voucherMinBelanja, setVoucherMinBelanja] = useState('')
  const [voucherMaksDiskon, setVoucherMaksDiskon] = useState('')
  const [voucherKuota, setVoucherKuota] = useState('')
  const [voucherBerlakuSampai, setVoucherBerlakuSampai] = useState('')
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherError, setVoucherError] = useState('')

  useEffect(() => {
    let active = true
    setTokoLoading(true)
    loadToko(token).finally(() => {
      if (active) setTokoLoading(false)
    })
    return () => { active = false }
  }, [token])

  const loadVouchers = async () => {
    setVouchersLoading(true)
    try {
      const res = await voucherApi.getMine(token)
      if (res.success && Array.isArray(res.data)) {
        setVouchers(res.data)
      }
    } catch (e) {
      console.error('Gagal memuat voucher:', e)
    }
    setVouchersLoading(false)
  }

  useEffect(() => {
    if (token) loadVouchers()
  }, [token])

  const handleVoucherSubmit = async () => {
    if (!voucherKode.trim()) { setVoucherError('Kode voucher wajib diisi'); return }
    if (!voucherNilai || isNaN(voucherNilai)) { setVoucherError('Nilai voucher tidak valid'); return }
    if (voucherTipe === 'persen' && Number(voucherNilai) > 100) {
      setVoucherError('Persentase maksimal 100%'); return
    }
    setVoucherLoading(true)
    setVoucherError('')
    try {
      const payload = {
        kode: voucherKode.trim().toUpperCase(),
        tipe: voucherTipe,
        nilai: Number(voucherNilai),
        minBelanja: voucherMinBelanja ? Number(voucherMinBelanja) : null,
        maksDiskon: voucherMaksDiskon ? Number(voucherMaksDiskon) : null,
        kuota: voucherKuota ? Number(voucherKuota) : null,
        berlakuSampai: voucherBerlakuSampai ? new Date(voucherBerlakuSampai).toISOString() : null,
      }
      // Tidak ada catch{} di sini — kalau backend nolak (misal requirePro,
      // kode duplikat), errornya harus nyampe ke catch di bawah, bukan
      // ditelen diam-diam sambil tetap nampilin toast sukses.
      const res = await voucherApi.create(token, payload)
      // Pakai voucher hasil dari server (punya id asli dari DB), bukan
      // objek lokal — supaya delete nanti ngirim id yang bener-bener match.
      if (res?.data) {
        setVouchers(prev => [res.data, ...prev])
      } else {
        await loadVouchers()
      }
      setShowVoucherForm(false)
      setVoucherKode('')
      setVoucherNilai('')
      setVoucherMinBelanja('')
      setVoucherMaksDiskon('')
      setVoucherKuota('')
      setVoucherBerlakuSampai('')
      toast.success('Voucher berhasil dibuat!')
    } catch (e) {
      setVoucherError(e.message || 'Gagal membuat voucher')
    }
    setVoucherLoading(false)
  }

  const handleDeleteVoucher = async (voucherId) => {
    if (!confirm('Hapus voucher ini?')) return
    try {
      // Kalau ini gagal (misal id nggak match / network error), JANGAN
      // hapus dari state lokal — biar seller tau voucher-nya masih aktif.
      await voucherApi.delete(token, voucherId)
      setVouchers(prev => prev.filter(v => v.id !== voucherId))
      toast.success('Voucher dihapus')
    } catch (e) {
      toast.error(e.message || 'Gagal menghapus voucher, coba lagi')
    }
  }

  const generateKode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const kode = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setVoucherKode(kode)
  }

  const TABS = [
    { key: 'toko', label: 'Info Toko', icon: Store },
    { key: 'tampilan', label: 'Tampilan', icon: Palette },
    { key: 'pembayaran', label: 'Pembayaran', icon: Wallet },
    { key: 'asisten', label: 'Asisten AI', icon: Bot },
    { key: 'profil', label: 'Profil', icon: User },
  ]

  const activeTabData = TABS.find(t => t.key === tab) || TABS[0]

  return (
    <DashboardLayout title="Pengaturan Toko">
      <style>{`
        .settings-nav-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px;
          background: var(--bg-card, rgba(255, 255, 255, 0.03));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl, 14px);
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .settings-nav-tabs::-webkit-scrollbar {
          display: none;
        }
        .settings-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-lg, 10px);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .settings-tab-btn.active {
          background: var(--accent-gradient, linear-gradient(135deg, #7c3aed, #6366f1));
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        .settings-tab-btn:hover:not(.active) {
          background: var(--surface-hover, rgba(255, 255, 255, 0.06));
          color: var(--text-primary);
        }
        .settings-content {
          width: 100%;
        }
      `}</style>

      {/* Horizontal Header Tabs for Desktop & Mobile */}
      <div className="settings-nav-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`settings-tab-btn ${tab === t.key ? 'active' : ''}`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {tab !== 'profil' && tokoLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
          </div>
        )}

        {tab !== 'profil' && !tokoLoading && !toko && (
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
            <Store size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Kamu belum punya toko</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Buat toko terlebih dahulu sebelum mengatur info toko, tampilan, pembayaran, atau asisten AI.
            </p>
          </div>
        )}

        {!tokoLoading && (toko || tab === 'profil') && (
          <>
            {tab === 'toko' && <TokoSettings tokenObj={tokenObj} toko={toko} setToko={setToko} canAccessProFeatures={canAccessProFeatures} />}
            {tab === 'tampilan' && <TampilanSettings tokenObj={tokenObj} toko={toko} setToko={setToko} canAccessProFeatures={canAccessProFeatures} />}
            {tab === 'pembayaran' && <PaymentMethodSettings tokenObj={tokenObj} toko={toko} setToko={setToko} />}
            {tab === 'asisten' && <AsistenSettings tokenObj={tokenObj} toko={toko} />}
            {tab === 'profil' && <ProfilSettings user={user} planName={planName} tierLevel={tierLevel} />}
          </>
        )}

          {tab === 'toko' && toko && !tokoLoading && (
            <div style={{ marginTop: 32 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🎟️ Voucher & Kupon Diskon
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Buat kode diskon spesial untuk pembeli di toko kamu
                  </div>
                </div>
                <button
                  onClick={() => { setShowVoucherForm(true); setVoucherError('') }}
                  style={{
                    padding: '8px 16px', borderRadius: 100,
                    background: 'var(--accent)', color: '#fff',
                    border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  + Buat Voucher
                </button>
              </div>

              {vouchers.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '28px 16px',
                  background: 'var(--surface)', borderRadius: 12,
                  border: '1px dashed var(--glass-border)',
                  color: 'var(--text-secondary)', fontSize: 13,
                }}>
                  Belum ada voucher. Klik tombol di atas untuk membuat kupon diskon pertama kamu.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {vouchers.map(v => {
                    const expired = v.berlakuSampai && new Date(v.berlakuSampai) < new Date()
                    const habis = v.kuota && v.terpakai >= v.kuota
                    return (
                      <div key={v.id} style={{
                        background: 'var(--surface)', border: '1px solid var(--glass-border)',
                        borderRadius: 12, padding: '14px 16px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        opacity: expired || habis ? 0.6 : 1,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontFamily: 'monospace', fontWeight: 700, fontSize: 15,
                              color: 'var(--accent)', letterSpacing: '0.08em',
                            }}>
                              {v.kode}
                            </span>
                            {expired && (
                              <span style={{ fontSize: 10, color: 'var(--danger)', background: 'color-mix(in srgb, var(--danger) 15%, transparent)', padding: '2px 6px', borderRadius: 4 }}>Kadaluarsa</span>
                            )}
                            {habis && !expired && (
                              <span style={{ fontSize: 10, color: 'var(--warning)', background: 'color-mix(in srgb, var(--warning) 15%, transparent)', padding: '2px 6px', borderRadius: 4 }}>Kuota Habis</span>
                            )}
                          </div>

                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            Diskon {v.tipe === 'persen'
                              ? `${v.nilai}%${v.maksDiskon ? ` (maks Rp ${Number(v.maksDiskon).toLocaleString('id-ID')})` : ''}`
                              : `Rp ${Number(v.nilai).toLocaleString('id-ID')}`
                            }
                            {v.minBelanja ? ` · Min. Belanja Rp ${Number(v.minBelanja).toLocaleString('id-ID')}` : ''}
                          </div>

                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'flex', gap: 12 }}>
                            {v.kuota && (
                              <span>Terpakai: {v.terpakai || 0}/{v.kuota}</span>
                            )}
                            {v.berlakuSampai && (
                              <span>Berlaku s/d: {new Date(v.berlakuSampai).toLocaleDateString('id-ID')}</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteVoucher(v.id)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, fontSize: 12,
                            background: 'transparent', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                            color: 'var(--danger)', cursor: 'pointer', marginLeft: 12, flexShrink: 0,
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {showVoucherForm && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}>
                  <div style={{
                    background: 'var(--bg-secondary)', borderRadius: '20px 20px 0 0',
                    padding: '24px 20px 32px', width: '100%', maxWidth: 480,
                    maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--glass-border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Buat Voucher Diskon</div>
                      <button onClick={() => setShowVoucherForm(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
                    </div>

                    {voucherError && (
                      <div style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                        {voucherError}
                      </div>
                    )}

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>KODE VOUCHER *</label>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <input
                          value={voucherKode}
                          onChange={e => setVoucherKode(e.target.value.toUpperCase())}
                          placeholder="cth: HEMAT20"
                          style={{
                            flex: 1, padding: '9px 12px',
                            background: 'var(--surface)', border: '1px solid var(--glass-border)',
                            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
                            fontFamily: 'monospace', letterSpacing: '0.05em',
                          }}
                        />
                        <button
                          onClick={generateKode}
                          style={{
                            padding: '9px 14px', borderRadius: 8, fontSize: 12,
                            background: 'var(--surface)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >Acak Kode</button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>TIPE DISKON *</label>
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {[{ key: 'persen', label: '% Persentase' }, { key: 'nominal', label: 'Rp Nominal' }].map(t => (
                          <button
                            key={t.key}
                            onClick={() => setVoucherTipe(t.key)}
                            style={{
                              flex: 1, padding: '9px', borderRadius: 8, fontSize: 13,
                              background: voucherTipe === t.key ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface)',
                              border: `1px solid ${voucherTipe === t.key ? 'var(--accent)' : 'var(--glass-border)'}`,
                              color: voucherTipe === t.key ? 'var(--accent)' : 'var(--text-secondary)',
                              cursor: 'pointer', fontWeight: voucherTipe === t.key ? 600 : 400,
                            }}
                          >{t.label}</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                        NILAI DISKON * {voucherTipe === 'persen' ? '(%)' : '(Rp)'}
                      </label>
                      <input
                        type="number"
                        value={voucherNilai}
                        onChange={e => setVoucherNilai(e.target.value)}
                        placeholder={voucherTipe === 'persen' ? 'cth: 20' : 'cth: 15000'}
                        max={voucherTipe === 'persen' ? 100 : undefined}
                        style={{
                          width: '100%', marginTop: 4, padding: '9px 12px',
                          background: 'var(--surface)', border: '1px solid var(--glass-border)',
                          borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>MIN. BELANJA (Rp)</label>
                        <input
                          type="number"
                          value={voucherMinBelanja}
                          onChange={e => setVoucherMinBelanja(e.target.value)}
                          placeholder="opsional"
                          style={{
                            width: '100%', marginTop: 4, padding: '9px 12px',
                            background: 'var(--surface)', border: '1px solid var(--glass-border)',
                            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
                          }}
                        />
                      </div>
                      {voucherTipe === 'persen' && (
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>MAKS. DISKON (Rp)</label>
                          <input
                            type="number"
                            value={voucherMaksDiskon}
                            onChange={e => setVoucherMaksDiskon(e.target.value)}
                            placeholder="opsional"
                            style={{
                              width: '100%', marginTop: 4, padding: '9px 12px',
                              background: 'var(--surface)', border: '1px solid var(--glass-border)',
                              borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>KUOTA PEMAKAIAN</label>
                        <input
                          type="number"
                          value={voucherKuota}
                          onChange={e => setVoucherKuota(e.target.value)}
                          placeholder="opsional"
                          style={{
                            width: '100%', marginTop: 4, padding: '9px 12px',
                            background: 'var(--surface)', border: '1px solid var(--glass-border)',
                            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>BERLAKU SAMPAI</label>
                        <input
                          type="date"
                          value={voucherBerlakuSampai}
                          onChange={e => setVoucherBerlakuSampai(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                          style={{
                            width: '100%', marginTop: 4, padding: '9px 12px',
                            background: 'var(--surface)', border: '1px solid var(--glass-border)',
                            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleVoucherSubmit}
                      disabled={voucherLoading}
                      style={{
                        width: '100%', padding: '12px', borderRadius: 100,
                        background: 'var(--accent)', color: '#fff',
                        border: 'none', fontSize: 14, fontWeight: 700,
                        cursor: voucherLoading ? 'not-allowed' : 'pointer',
                        opacity: voucherLoading ? 0.7 : 1,
                      }}
                    >
                      {voucherLoading ? 'Membuat...' : 'Buat Voucher'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
  )
}

function PaymentMethodSettings({ tokenObj, toko, setToko }) {
  const [enabled, setEnabled] = useState(['manual', 'midtrans_instant', 'midtrans_escrow'])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (toko?.paymentMethodsEnabled) {
      setEnabled(toko.paymentMethodsEnabled)
    }
  }, [toko])

  const hasOriginArea = !!toko?.originAreaId

  const toggleMethod = (method) => {
    if (method !== 'manual' && !hasOriginArea) {
      toast.error('Isi Kota Asal Pengiriman di tab Info Toko dulu')
      return
    }
    setEnabled(prev => prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method])
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (toko?.id) {
        await tokoApi.update(tokenObj, toko.id, { payment_methods_enabled: enabled })
      }
      setToko({ ...toko, paymentMethodsEnabled: enabled })
      toast.success('Metode pembayaran diperbarui!')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  const METHODS = [
    {
      key: 'manual',
      icon: MessageCircle,
      title: 'Checkout Manual via WhatsApp',
      desc: 'Buyer chat langsung ke WA kamu untuk konfirmasi & bayar. Cara paling sederhana, selalu aktif.',
      locked: true,
      color: '#25D366',
    },
    {
      key: 'midtrans_instant',
      icon: Zap,
      title: 'Exora Pay (QRIS & Transfer Direct)',
      desc: 'Buyer bayar via Exora Pay (QRIS, GoPay, BCA/Mandiri Virtual Account). Dana langsung masuk ke dompet begitu sukses.',
      locked: false,
      color: '#5b8af5',
    },
    {
      key: 'midtrans_escrow',
      icon: ShieldCheck,
      title: 'Exora Protect (Escrow H+3)',
      desc: 'Sama seperti Instant, tapi dana ditahan 3 hari setelah pesanan selesai untuk perlindungan ekstra buyer & seller.',
      locked: false,
      color: '#10B981',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>
          Metode Pembayaran Toko
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '20px' }}>
          Pilih metode pembayaran yang ingin kamu tawarkan ke buyer. Pembeli dapat memilih salah satu dari metode aktif saat checkout.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {METHODS.map(m => {
            const active = enabled.includes(m.key)
            const isLockedByOrigin = m.key !== 'manual' && !hasOriginArea
            return (
              <div
                key={m.key}
                onClick={() => !m.locked && toggleMethod(m.key)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '16px', borderRadius: 'var(--radius-lg)',
                  background: active ? `${m.color}12` : 'var(--surface)',
                  border: `2px solid ${active ? `${m.color}44` : 'var(--glass-border)'}`,
                  cursor: m.locked ? 'default' : isLockedByOrigin ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)',
                  opacity: m.locked ? 0.85 : isLockedByOrigin ? 0.5 : 1,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
                  background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: m.color,
                }}>
                  <m.icon size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{m.title}</p>
                    {m.locked && <Lock size={11} color="var(--text-tertiary)" />}
                    {isLockedByOrigin && <Lock size={11} color="var(--warning)" />}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.desc}</p>
                  {isLockedByOrigin && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--warning)', marginTop: 4 }}>
                      Isi Kota Asal Pengiriman di tab Info Toko untuk mengaktifkan
                    </p>
                  )}
                </div>
                {!m.locked && (
                  <div style={{
                    width: 40, height: 22, borderRadius: 'var(--radius-full)', flexShrink: 0,
                    background: active ? m.color : 'var(--glass-border)',
                    position: 'relative', transition: 'background var(--transition-fast)',
                    opacity: isLockedByOrigin ? 0.5 : 1,
                  }}>
                    <div style={{
                      position: 'absolute', top: 2, left: active ? 20 : 2,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      transition: 'left var(--transition-fast)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                )}
                {m.locked && (
                  <div style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-full)', flexShrink: 0,
                    background: `${m.color}18`, color: m.color, fontSize: '0.68rem', fontWeight: 700,
                  }}>
                    Selalu Aktif
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: 16, padding: '10px 14px', background: 'rgba(91,138,245,0.08)',
          border: '1px solid rgba(91,138,245,0.2)', borderRadius: 'var(--radius-md)',
          fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6,
        }}>
          💡 Fitur ini gratis untuk semua plan. Ada potongan biaya layanan otomatis untuk tiap transaksi yang berhasil lewat Exora Pay.
        </div>
      </div>

      <button onClick={handleSave} className="btn btn-primary" disabled={loading} style={{ width: 'fit-content' }}>
        {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><Save size={15} /> Simpan Perubahan</>}
      </button>
    </div>
  )
}

function LogoUpload({ value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadLogoToCloudinary(file)
      onChange(url)
      toast.success('Logo berhasil diupload')
    } catch (err) {
      toast.error('Gagal upload logo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: disabled || uploading,
  })

  const handleRemove = (e) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {value ? (
          <>
            <img
              src={value}
              alt="Logo toko"
              style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: '1px solid var(--glass-border)' }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 20, height: 20,
                  background: 'var(--danger)',
                  border: 'none', borderRadius: '50%',
                  cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={11} />
              </button>
            )}
          </>
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-tertiary)',
          }}>
            <Store size={28} />
          </div>
        )}
      </div>

      <div
        {...getRootProps()}
        style={{
          flex: 1,
          padding: '12px 16px',
          border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-lg)',
          background: isDragActive ? 'rgba(91,138,245,0.05)' : 'var(--surface)',
          cursor: (disabled || uploading) ? 'not-allowed' : 'pointer',
          opacity: (disabled || uploading) ? 0.6 : 1,
          transition: 'all var(--transition-fast)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <><span className="spinner" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Mengupload...</span></>
        ) : (
          <>
            <Upload size={15} color="var(--text-tertiary)" />
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {isDragActive ? 'Lepaskan file di sini' : value ? 'Ganti logo toko' : 'Upload logo toko'}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                JPG, PNG, WEBP — maks 5MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AsistenSettings({ tokenObj, toko }) {
  const [form, setForm] = useState({
    faq: 'Q: Berapa lama pengiriman pesanan?\nA: Pesanan dikirim H+1 setelah pembayaran terkonfirmasi.\n\nQ: Bisakah COD atau bayar di tempat?\nA: Bisa via fitur Exora Pay & Pengiriman Biteship Kurir.',
    garansi: 'Garansi retur 100% jika produk yang diterima cacat, rusak, atau salah ukuran. Sertakan video unboxing saat klaim.',
    policy: 'Pengiriman dilakukan setiap hari kerja Senin - Sabtu pukul 08:00 - 17:00 WIB.',
    infoLain: 'Grosir & Reseller welcome dengan penawaran harga spesial!',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tokenObj) return
    tokoInfoApi.get(tokenObj).then(res => {
      if (res.data) setForm({
        faq: res.data.faq || form.faq,
        garansi: res.data.garansi || form.garansi,
        policy: res.data.policy || form.policy,
        infoLain: res.data.infoLain || form.infoLain,
      })
    }).catch((err) => console.error('Gagal memuat bank data asisten AI:', err))
  }, [tokenObj])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSave = async () => {
    setLoading(true)
    try {
      await tokoInfoApi.update(tokenObj, form)
      toast.success('Bank data AI toko berhasil disimpan!')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>
          🤖 Bank Data Asisten AI
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '20px' }}>
          Data ini menjadi pengetahuan dasar bagi Asisten AI Exora untuk menjawab pertanyaan pembeli secara otomatis di halaman toko kamu.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Pertanyaan Umum (FAQ)</label>
            <textarea
              className="form-input form-textarea"
              rows={4}
              placeholder="cth: Q: Apakah ada diskon? A: Ada, untuk pembelian di atas 3 pcs."
              value={form.faq}
              onChange={e => set('faq', e.target.value)}
            />
            <span className="form-hint">Daftar pertanyaan dan jawaban yang sering ditanyakan pembeli</span>
          </div>

          <div className="form-group">
            <label className="form-label">Kebijakan Garansi</label>
            <textarea
              className="form-input form-textarea"
              rows={3}
              placeholder="cth: Garansi 7 hari barang rusak atau tidak sesuai foto."
              value={form.garansi}
              onChange={e => set('garansi', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kebijakan Toko & Pengiriman</label>
            <textarea
              className="form-input form-textarea"
              rows={3}
              placeholder="cth: Tidak menerima retur kecuali barang cacat produksi."
              value={form.policy}
              onChange={e => set('policy', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Informasi Tambahan Toko</label>
            <textarea
              className="form-input form-textarea"
              rows={3}
              placeholder="cth: Pengiriman setiap hari Senin-Sabtu jam 10.00-15.00."
              value={form.infoLain}
              onChange={e => set('infoLain', e.target.value)}
            />
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn btn-primary" disabled={loading} style={{ width: 'fit-content' }}>
        {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><Save size={15} /> Simpan Perubahan</>}
      </button>
    </div>
  )
}

function TokoSettings({ tokenObj, toko, setToko, canAccessProFeatures }) {
  const [form, setForm] = useState({
    nama: toko?.nama || '',
    deskripsi: toko?.deskripsi || '',
    wa: toko?.wa || '',
    customDomain: toko?.customDomain || '',
    musik: toko?.musik || '',
    video: toko?.video || '',
    pengumuman: toko?.pengumuman || '',
    logo: toko?.logo || '',
    originAreaId: toko?.originAreaId || '',
    originAreaLabel: toko?.originAreaLabel || '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const [originInput, setOriginInput] = useState(toko?.originAreaLabel || '')
  const [originOptions, setOriginOptions] = useState([])
  const [searchingOrigin, setSearchingOrigin] = useState(false)
  const originSearchTimeout = useRef(null)

  useEffect(() => {
    if (toko) {
      setForm({
        nama: toko.nama || '',
        deskripsi: toko.deskripsi || '',
        wa: String(toko.wa || ''),
        customDomain: toko.customDomain || '',
        musik: toko.musik || '',
        video: toko.video || '',
        pengumuman: toko.pengumuman || '',
        logo: toko.logo || '',
        originAreaId: toko.originAreaId || '',
        originAreaLabel: toko.originAreaLabel || '',
      })
      setOriginInput(toko.originAreaLabel || '')
    }
  }, [toko])

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const [originSearchError, setOriginSearchError] = useState('')

  const handleOriginInput = (val) => {
    setOriginInput(val)
    setOriginOptions([])
    setOriginSearchError('')
    if (form.originAreaId) {
      set('originAreaId', '')
      set('originAreaLabel', '')
    }
    clearTimeout(originSearchTimeout.current)
    if (val.length >= 3) {
      setSearchingOrigin(true)
      originSearchTimeout.current = setTimeout(async () => {
        try {
          const res = await biteshipApi.searchArea(val)
          setOriginOptions(res.data || [])
        } catch (err) {
          // Jangan nyodorin data hardcode seolah itu hasil pencarian asli —
          // ID area yang salah bisa bikin kalkulasi ongkir Biteship keliru.
          setOriginOptions([])
          setOriginSearchError('Gagal mencari area, coba lagi atau ketik ulang')
          console.error('Gagal cari area origin:', err)
        }
        setSearchingOrigin(false)
      }, 400)
    }
  }

  const handleSelectOrigin = (area) => {
    set('originAreaId', area.id)
    set('originAreaLabel', area.name)
    setOriginInput(area.name)
    setOriginOptions([])
  }

  const validate = () => {
    const e = {}
    if (!form.nama.trim()) e.nama = 'Nama toko wajib diisi'
    if (!form.wa.trim()) e.wa = 'Nomor WA wajib diisi'
    if (form.wa && !validateWA(form.wa)) e.wa = 'Format nomor WA tidak valid'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      if (toko?.id) {
        await tokoApi.update(tokenObj, toko.id, form)
      }
      setToko({ ...toko, ...form })
      toast.success('Pengaturan toko berhasil disimpan!')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>
          Logo & Identity Toko
        </h3>
        <LogoUpload
          value={form.logo}
          onChange={(url) => set('logo', url)}
        />
        <span className="form-hint" style={{ marginTop: 10, display: 'block' }}>
          Tampil sebagai identitas resmi di header toko & postingan Stream
        </span>
      </div>

      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>
          Informasi Utama Toko
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Nama Toko *</label>
            <input className={`form-input ${errors.nama ? 'error' : ''}`} value={form.nama} onChange={e => set('nama', e.target.value)} maxLength={50} />
            {errors.nama && <span className="form-error">{errors.nama}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">URL Storefront</label>
            <input className="form-input" value={getStorefrontUrl(toko.slug)} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Nomor WhatsApp Resmi *</label>
            <input className={`form-input ${errors.wa ? 'error' : ''}`} placeholder="081234567890" value={form.wa} onChange={e => set('wa', e.target.value)} />
            {errors.wa && <span className="form-error">{errors.wa}</span>}
            <span className="form-hint">Pembeli akan langsung menghubungi nomor ini saat checkout manual</span>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Kota Asal Pengiriman (Kecamatan / Kota)</label>
            <input
              className="form-input"
              placeholder="Contoh: Jakarta Selatan, Bandung..."
              value={originInput}
              onChange={e => handleOriginInput(e.target.value)}
              style={{ paddingRight: searchingOrigin ? 36 : 12 }}
            />
            {searchingOrigin && <span className="spinner" style={{ width: 14, height: 14, position: 'absolute', right: 12, top: 38 }} />}
            {originOptions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                maxHeight: 200, overflowY: 'auto', marginTop: 4,
              }}>
                {originOptions.map(area => (
                  <div
                    key={area.id}
                    onClick={() => handleSelectOrigin(area)}
                    style={{ padding: '9px 12px', fontSize: '0.82rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)' }}
                  >
                    <span style={{ fontWeight: 600 }}>{area.name}</span>
                    {area.administrative_division_level_1_name && (
                      <span style={{ color: 'var(--text-tertiary)', marginLeft: 6, fontSize: '0.75rem' }}>{area.administrative_division_level_1_name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <span className="form-hint">
              Wajib diisi agar Exora Pay & kalkulator ongkir Biteship bekerja secara presisi
            </span>
            {originSearchError && <span className="form-error">{originSearchError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Musik Latar Toko (URL YouTube)</label>
            <input
              className="form-input"
              placeholder="cth: https://www.youtube.com/watch?v=5qap5aO4i9A"
              value={form.musik}
              onChange={e => set('musik', e.target.value)}
            />
            <span className="form-hint">Tombol 🎵 muncul di halaman toko agar pembeli bisa mendengarkan audio saat melihat katalog</span>
          </div>

          <div className="form-group">
            <label className="form-label">Video Profil Toko (URL YouTube)</label>
            <input
              className="form-input"
              placeholder="cth: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              value={form.video}
              onChange={e => set('video', e.target.value)}
            />
            <span className="form-hint">Video perkenalan produk atau tur toko yang disematkan di storefront</span>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi Singkat Toko</label>
            <textarea className="form-input form-textarea" value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)} rows={3} maxLength={300} />
            <span className="form-hint">{form.deskripsi.length}/300 karakter</span>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>
          📢 Banner Pengumuman Toko
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '16px' }}>
          Tampil mencolok di bagian atas halaman toko. Sangat efektif untuk pesan promo atau jadwal pengiriman.
        </p>
        <div className="form-group">
          <textarea
            className="form-input form-textarea"
            rows={2}
            placeholder="cth: Promo Gajian! Diskon 20% untuk semua produk minggu ini 🎉"
            value={form.pengumuman}
            onChange={e => set('pengumuman', e.target.value)}
            maxLength={150}
          />
          <span className="form-hint">{form.pengumuman.length}/150 karakter</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              🌐 Custom Domain Toko
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Hubungkan domain milikmu sendiri (seperti <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>tokokamu.com</code>) ke toko Exora kamu.
            </p>
          </div>
          <span className="badge badge-pro" style={{ flexShrink: 0 }}>⭐ Fitur Pro & Bisnis</span>
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Domain Kustom Kamu</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              placeholder="cth: tokokamu.com atau shop.tokokamu.com"
              value={form.customDomain}
              onChange={e => set('customDomain', e.target.value.toLowerCase().trim().replace(/^https?:\/\//, ''))}
            />
          </div>
          <span className="form-hint">Ketik domain tanpa http:// atau https://</span>
        </div>

        {form.customDomain && (
          <div style={{
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              📌 Langkah Setting DNS di Registrar / Provider Domain Kamu:
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Masuk ke menu <b>DNS Management</b> provider domain kamu (seperti cPanel / Cloudflare / Provider Domain tempat kamu beli domain) dan tambahkan DNS Record berikut:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '80px 100px 1fr 60px', alignItems: 'center', gap: 8,
                background: 'var(--surface-color, rgba(0,0,0,0.2))', padding: '8px 12px', borderRadius: 6, fontSize: '0.78rem',
                fontFamily: 'monospace'
              }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Tipe</span>
                <span style={{ color: 'var(--text-tertiary)' }}>Host / Name</span>
                <span style={{ color: '#38BDF8', fontWeight: 600 }}>Value / Target</span>
                <span></span>
              </div>

              {/* A Record for Apex Domain */}
              <div style={{
                display: 'grid', gridTemplateColumns: '80px 100px 1fr 60px', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 6, fontSize: '0.78rem',
                fontFamily: 'monospace'
              }}>
                <span style={{ color: '#EAB308', fontWeight: 700 }}>A Record</span>
                <span style={{ color: 'var(--text-primary)' }}>@</span>
                <span style={{ color: '#22C55E', fontWeight: 700 }}>76.76.21.21</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                  onClick={() => { navigator.clipboard.writeText('76.76.21.21'); toast.success('IP Vercel disalin!') }}
                >
                  Salin
                </button>
              </div>

              {/* CNAME Record for Subdomain or WWW */}
              <div style={{
                display: 'grid', gridTemplateColumns: '80px 100px 1fr 60px', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 6, fontSize: '0.78rem',
                fontFamily: 'monospace'
              }}>
                <span style={{ color: '#3B82F6', fontWeight: 700 }}>CNAME</span>
                <span style={{ color: 'var(--text-primary)' }}>{form.customDomain.includes('.') && !form.customDomain.startsWith('www.') ? form.customDomain.split('.')[0] : 'www'}</span>
                <span style={{ color: '#22C55E', fontWeight: 700 }}>cname.vercel-dns.com</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                  onClick={() => { navigator.clipboard.writeText('cname.vercel-dns.com'); toast.success('CNAME Vercel disalin!') }}
                >
                  Salin
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 12, lineHeight: 1.5 }}>
              ⚡ <b>Proses Otomatis SSL:</b> Setelah DNS tersimpan, SSL (HTTPS) dan sertifikat keamanan akan aktif otomatis oleh sistem Vercel dalam 5–15 menit.
            </p>
          </div>
        )}
      </div>

      <button onClick={handleSave} className="btn btn-primary" disabled={loading} style={{ width: 'fit-content' }}>
        {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><Save size={15} /> Simpan Perubahan</>}
      </button>
    </div>
  )
}

function TampilanSettings({ tokenObj, toko, setToko, canAccessProFeatures }) {
  const [tema, setTema] = useState(toko?.tema || 'default')
  const [layoutTemplate, setLayoutTemplate] = useState(toko?.layoutTemplate || 'classic')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (toko) {
      setTema(toko.tema || 'default')
      setLayoutTemplate(toko.layoutTemplate || 'classic')
    }
  }, [toko])

  const handleSave = async () => {
    setLoading(true)
    try {
      if (toko?.id) {
        await tokoApi.update(tokenObj, toko.id, { tema, layout_template: layoutTemplate })
      }
      setToko({ ...toko, tema, layoutTemplate })
      toast.success('Tampilan toko berhasil diperbarui!')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  const TEMA_OPTIONS = [
    { key: 'default', label: 'Default Exora', preview: ['#5b8af5', '#7c6af7'] },
    { key: 'emerald', label: 'Emerald Green', preview: ['#10b981', '#059669'], pro: false },
    { key: 'sunset', label: 'Sunset Orange', preview: ['#f59e0b', '#ef4444'], pro: false },
    { key: 'rose', label: 'Rose Pink', preview: ['#f43f5e', '#ec4899'], pro: false },
  ]

  const LAYOUT_OPTIONS = [
    { key: 'classic', label: 'Classic Grid', icon: LayoutGrid, desc: 'Grid produk rapi & simetris, sangat baik untuk variasi produk banyak', pro: false },
    { key: 'hero', label: 'Featured Banner Hero', icon: Star, desc: 'Sorotan produk terlaris di bagian paling atas dengan efek estetik', pro: false },
    { key: 'list', label: 'Compact List View', icon: LayoutList, desc: 'Tampilan daftar baris, sangat cocok untuk katalog spesifikasi detail', pro: false },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>Tema Warna Toko</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '20px' }}>
          Pilih palet warna yang menggambarkan estetika brand dan toko kamu.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
          {TEMA_OPTIONS.map(t => (
            <button
              key={t.key}
              onClick={() => setTema(t.key)}
              style={{
                padding: '14px 12px', borderRadius: 'var(--radius-lg)',
                border: `2px solid ${tema === t.key ? 'var(--accent)' : 'var(--glass-border)'}`,
                background: tema === t.key ? 'var(--surface-active)' : 'var(--surface)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                {t.preview.map((c, i) => (
                  <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>Layout Template Storefront</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '20px' }}>
          Atur tata letak penyajian produk di halaman toko kamu untuk kenyamanan pembeli.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {LAYOUT_OPTIONS.map(l => (
            <button
              key={l.key}
              onClick={() => setLayoutTemplate(l.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 'var(--radius-lg)',
                border: `2px solid ${layoutTemplate === l.key ? 'var(--accent)' : 'var(--glass-border)'}`,
                background: layoutTemplate === l.key ? 'var(--surface-active)' : 'var(--surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 'var(--radius-md)', flexShrink: 0,
                background: layoutTemplate === l.key ? 'var(--accent-gradient-soft)' : 'var(--surface-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: layoutTemplate === l.key ? 'var(--accent)' : 'var(--text-tertiary)',
              }}>
                <l.icon size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {l.label}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{l.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} className="btn btn-primary" disabled={loading} style={{ width: 'fit-content' }}>
        {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><Save size={15} /> Simpan Perubahan</>}
      </button>
    </div>
  )
}

function ProfilSettings({ user, planName, tierLevel }) {
  const displayUser = user || {
    name: 'Seller Exora Official',
    email: 'bahlil.99909@gmail.com',
    picture: null
  }

  const getBadgeClass = () => {
    if (tierLevel >= 3) return 'badge-business'
    if (tierLevel >= 2) return 'badge-pro'
    if (tierLevel >= 1) return 'badge-starter'
    return 'badge-free'
  }

  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>
        Profil & Status Akun
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        {displayUser.picture ? (
          <img src={displayUser.picture} alt={displayUser.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div className="avatar avatar-xl" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
            {displayUser.name?.[0] || 'E'}
          </div>
        )}
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{displayUser.name}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{displayUser.email}</p>
          <span className={`badge ${getBadgeClass()}`} style={{ marginTop: 8, display: 'inline-block' }}>
            Plan Aktif: {planName || 'Free'}
          </span>
        </div>
      </div>
      <Alert type="info">
        Data profil tersinkronisasi dengan akun Google kamu. Foto & nama dapat diperbarui melalui akun Google utama.
      </Alert>
    </div>
  )
}
