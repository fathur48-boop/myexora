import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, Sparkles, Wand2 } from 'lucide-react'
import { Modal } from '../ui/index.jsx'
import ImageUpload from './ImageUpload.jsx'
import { produkApi, copywriterApi } from '../../lib/api'
import { useAuthStore, useProdukStore } from '../../lib/store'
import { KATEGORI_LIST } from '../../lib/categories'
import toast from 'react-hot-toast'

const INITIAL = {
  nama: '', deskripsi: '', harga: '', hargaCoret: '', hpp: '',
  stok: '', kategori: '', berat: '', fotos: [], aktif: true,
}

const STEPS = [
  { id: 1, label: 'Info Produk' },
  { id: 2, label: 'Harga & Stok' },
  { id: 3, label: 'Mode Jualan' },
]

// Custom dropdown
function KategoriSelect({ value, onChange, error }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'var(--surface)',
          border: `1px solid ${error ? 'var(--danger)' : open ? 'var(--accent)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-md)',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          outline: 'none',
        }}
      >
        <span>{value || '— Pilih Kategori —'}</span>
        <ChevronDown
          size={16}
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
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          maxHeight: 280,
          overflowY: 'auto',
          animation: 'fadeIn 0.1s ease',
        }}>
          {KATEGORI_LIST.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => { onChange(k); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: value === k ? 'rgba(91,138,245,0.1)' : 'transparent',
                border: 'none',
                color: value === k ? 'var(--accent)' : 'var(--text-primary)',
                fontSize: '0.875rem', fontWeight: value === k ? 600 : 400,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (value !== k) e.currentTarget.style.background = 'var(--surface-hover)' }}
              onMouseLeave={e => { if (value !== k) e.currentTarget.style.background = 'transparent' }}
            >
              {k}
              {value === k && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Step indicator — clickable saat mode edit
function StepIndicator({ current, onJump, isEdit, isMobile }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6, marginBottom: 20 }}>
      {STEPS.map((s, idx) => {
        const active = s.id === current
        const done = s.id < current
        const clickable = isEdit
        const showLabel = !isMobile || active
        return (
          <React.Fragment key={s.id}>
            <button
              type="button"
              onClick={() => clickable && onJump(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8,
                background: 'none', border: 'none', padding: '4px 2px',
                cursor: clickable ? 'pointer' : 'default',
                minWidth: 0,
              }}
            >
              <div style={{
                width: isMobile ? 20 : 24, height: isMobile ? 20 : 24, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isMobile ? 10.5 : 12, fontWeight: 700,
                background: active || done ? 'var(--accent)' : 'var(--surface)',
                color: active || done ? '#fff' : 'var(--text-tertiary)',
                border: active || done ? 'none' : '1px solid var(--glass-border)',
                flexShrink: 0,
              }}>
                {done ? <Check size={isMobile ? 11 : 13} /> : s.id}
              </div>
              {showLabel && (
                <span style={{
                  fontSize: isMobile ? 11.5 : 12.5, fontWeight: active ? 700 : 500,
                  color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {s.label}
                </span>
              )}
            </button>
            {idx < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: 'var(--glass-border)', minWidth: isMobile ? 6 : 12 }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}

export default function ProdukForm({ isOpen, onClose, editData, onProductCreated }) {
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const isMobile = useIsMobile()

  // State tambahan untuk Flash Sale & Pre-order
  const [isFlashSale, setIsFlashSale] = useState(false)
  const [hargaFlash, setHargaFlash] = useState('')
  const [flashSaleUntil, setFlashSaleUntil] = useState('')
  const [isPreorder, setIsPreorder] = useState(false)
  const [preorderReadyDate, setPreorderReadyDate] = useState('')

  const { token, user } = useAuthStore()
  const tokenObj = token
  const { add, update } = useProdukStore()
  const isEdit = !!editData

  const getUserPlan = () => {
    if (!user?.plan) return 'free'
    const plan = user.plan.toLowerCase()
    const isExpired = user.planExpiry && new Date(user.planExpiry) <= new Date()

    if (isExpired) return 'free'
    if (plan === 'business') return 'business'
    if (plan === 'pro') return 'pro'
    if (plan === 'starter') return 'starter'
    return 'free'
  }

  const plan = getUserPlan()

  useEffect(() => {
    if (editData) {
      let fotos = []
      if (editData.foto) {
        try {
          const parsed = JSON.parse(editData.foto)
          fotos = Array.isArray(parsed) ? parsed : [parsed]
        } catch {
          fotos = String(editData.foto).split(',').map(s => s.trim()).filter(Boolean)
        }
      }

      setForm({
        nama: editData.nama || '',
        deskripsi: editData.deskripsi || '',
        harga: editData.harga?.toString() || '',
        hargaCoret: editData.hargaCoret?.toString() || '',
        hpp: editData.hpp?.toString() || '',
        stok: editData.stok?.toString() || '',
        kategori: editData.kategori || '',
        berat: editData.berat?.toString() || '',
        fotos,
        aktif: editData.aktif !== false,
      })

      setIsFlashSale(!!(editData?.hargaFlash && editData?.flashSaleUntil))
      setHargaFlash(editData?.hargaFlash?.toString() || '')
      setFlashSaleUntil(editData?.flashSaleUntil ? editData.flashSaleUntil.slice(0, 16) : '')
      setIsPreorder(editData?.isPreorder || false)
      setPreorderReadyDate(editData?.preorderReadyDate ? editData.preorderReadyDate.slice(0, 10) : '')
    } else {
      setForm(INITIAL)
      setIsFlashSale(false)
      setHargaFlash('')
      setFlashSaleUntil('')
      setIsPreorder(false)
      setPreorderReadyDate('')
    }
    setErrors({})
    setStep(1)
  }, [editData, isOpen])

  const [aiGenerating, setAiGenerating] = useState(false)

  const handleGenerateAiDescription = async () => {
    if (!form.nama) {
      toast.error('Isi Nama Produk terlebih dahulu agar AI bisa membuat deskripsi!')
      return
    }
    setAiGenerating(true)
    const toastId = toast.loading('Exora AI sedang membuat copywriting deskripsi produk...')
    try {
      const res = await copywriterApi.generate({
        nama: form.nama,
        kategori: form.kategori,
        harga: form.harga,
        deskripsi: form.deskripsi
      })
      if (res && res.text) {
        set('deskripsi', res.text)
        toast.success('Deskripsi produk berhasil dibuat dengan AI! 🚀', { id: toastId })
      } else {
        toast.error('Gagal membuat deskripsi AI', { id: toastId })
      }
    } catch (err) {
      console.error('AI copywriter error:', err)
      toast.error('Gagal terhubung ke AI Copywriter', { id: toastId })
    } finally {
      setAiGenerating(false)
    }
  }

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.nama.trim()) e.nama = 'Nama produk wajib diisi'
    if (!form.harga || isNaN(Number(form.harga)) || Number(form.harga) < 0) e.harga = 'Harga tidak valid'
    if (form.hpp && (isNaN(Number(form.hpp)) || Number(form.hpp) < 0)) e.hpp = 'HPP tidak valid'
    if (form.stok && (isNaN(Number(form.stok)) || Number(form.stok) < 0)) e.stok = 'Stok tidak valid'
    if (!form.kategori) e.kategori = 'Pilih kategori'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => setStep(s => Math.min(3, s + 1))
  const handleBack = () => setStep(s => Math.max(1, s - 1))
  const handleJumpStep = (target) => setStep(target)

  const handleSubmit = async () => {
    if (!validate()) return

    if (isFlashSale) {
      if (!hargaFlash || !flashSaleUntil) {
        toast.error('Isi harga flash dan tanggal berakhir flash sale')
        return
      }
      if (Number(hargaFlash) >= Number(form.harga)) {
        toast.error('Harga flash harus lebih kecil dari harga normal')
        return
      }
    }

    setLoading(true)
    try {
      const fotoStr = JSON.stringify(form.fotos)

      const payload = {
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim(),
        harga: Number(form.harga),
        hargaCoret: form.hargaCoret ? Number(form.hargaCoret) : null,
        hpp: form.hpp ? Number(form.hpp) : null,
        stok: form.stok ? Number(form.stok) : null,
        kategori: form.kategori,
        berat: form.berat ? Number(form.berat) : null,
        aktif: form.aktif,
        foto: fotoStr,
        hargaFlash: isFlashSale ? Number(hargaFlash) : null,
        flashSaleUntil: isFlashSale ? new Date(flashSaleUntil).toISOString() : null,
        isPreorder,
        preorderReadyDate: isPreorder && preorderReadyDate ? preorderReadyDate : null,
      }

      if (isEdit) {
        const res = await produkApi.update(tokenObj, editData.id, payload)
        update(editData.id, res.data || payload)
        toast.success('Produk berhasil diperbarui!')
      } else {
        const res = await produkApi.create(tokenObj, payload)
        const newProduct = res.data || { ...payload, id: Date.now().toString() }
        add(newProduct)
        if (onProductCreated) {
          onProductCreated()
        }

        toast.success('Produk berhasil ditambahkan! 🚀')
      }
      onClose()
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan produk')
    } finally {
      setLoading(false)
    }
  }

  const desktopFooter = (
    <>
      <button onClick={onClose} className="btn btn-secondary" disabled={loading}>Batal</button>
      <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
        {loading
          ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</>
          : isEdit ? 'Perbarui Produk' : 'Tambah Produk'
        }
      </button>
    </>
  )

  const mobileFooter = (
    <>
      {step === 1 && (
        <>
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>Batal</button>
          <button onClick={handleNext} className="btn btn-primary">Lanjut</button>
        </>
      )}
      {step === 2 && (
        <>
          <button onClick={handleBack} className="btn btn-secondary" disabled={loading}>Kembali</button>
          <button onClick={handleNext} className="btn btn-primary">Lanjut</button>
        </>
      )}
      {step === 3 && (
        <>
          <button onClick={handleBack} className="btn btn-secondary" disabled={loading}>Kembali</button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</>
              : isEdit ? 'Perbarui Produk' : 'Simpan Produk'
            }
          </button>
        </>
      )}
    </>
  )

  const footer = isMobile ? mobileFooter : desktopFooter

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
      size="lg"
      footer={footer}
    >
      {isMobile && (
        <StepIndicator current={step} onJump={handleJumpStep} isEdit={isEdit} isMobile={isMobile} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>

        {/* STEP 1: INFO PRODUK */}
        {(!isMobile || step === 1) && (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Foto Produk</label>
              <ImageUpload
                value={form.fotos}
                onChange={(urls) => set('fotos', urls)}
                plan={plan}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Nama Produk *</label>
              <input
                className={`form-input ${errors.nama ? 'error' : ''}`}
                placeholder="cth: Kaos Polos Premium"
                value={form.nama}
                onChange={e => set('nama', e.target.value)}
                maxLength={100}
              />
              {errors.nama && <span className="form-error">{errors.nama}</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Kategori *</label>
              <KategoriSelect
                value={form.kategori}
                onChange={(v) => set('kategori', v)}
                error={errors.kategori}
              />
              {errors.kategori && <span className="form-error">{errors.kategori}</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Deskripsi</label>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={aiGenerating}
                  className="btn btn-xs"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                    color: '#fff', border: 'none', borderRadius: 6, gap: 3, fontWeight: 700,
                    padding: '2px 8px', fontSize: '0.7rem', height: 'auto', minHeight: 'auto'
                  }}
                >
                  <Sparkles size={10} /> {aiGenerating ? 'Membuat...' : '✨ Buat Deskripsi AI'}
                </button>
              </div>
              <textarea
                className="form-input form-textarea"
                placeholder="Jelaskan detail produk, ukuran, material, dll..."
                value={form.deskripsi}
                onChange={e => set('deskripsi', e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <span className="form-hint">{form.deskripsi.length}/1000 karakter</span>
            </div>
          </>
        )}

        {/* STEP 2: HARGA & STOK */}
        {(!isMobile || step === 2) && (
          <>
            <div className="form-group">
              <label className="form-label">Harga (Rp) *</label>
              <input
                className={`form-input ${errors.harga ? 'error' : ''}`}
                type="number" placeholder="50000" min="0"
                value={form.harga}
                onChange={e => set('harga', e.target.value)}
              />
              {errors.harga && <span className="form-error">{errors.harga}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Harga Coret (Rp)</label>
              <input
                className="form-input"
                type="number" placeholder="75000 (opsional)" min="0"
                value={form.hargaCoret}
                onChange={e => set('hargaCoret', e.target.value)}
              />
              <span className="form-hint">Tampilkan harga sebelum diskon</span>
            </div>

            <div className="form-group">
              <label className="form-label">HPP (Rp)</label>
              <input
                className={`form-input ${errors.hpp ? 'error' : ''}`}
                type="number" placeholder="cth: 30000 (opsional)" min="0"
                value={form.hpp}
                onChange={e => set('hpp', e.target.value)}
              />
              {errors.hpp ? (
                <span className="form-error">{errors.hpp}</span>
              ) : (
                <span className="form-hint">Harga modal produk, dipakai untuk hitung profit — tidak tampil ke pembeli</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Stok</label>
              <input
                className={`form-input ${errors.stok ? 'error' : ''}`}
                type="number" placeholder="Kosongkan = tidak terbatas" min="0"
                value={form.stok}
                onChange={e => set('stok', e.target.value)}
              />
              {errors.stok && <span className="form-error">{errors.stok}</span>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Berat (gram)</label>
              <input
                className="form-input"
                type="number" placeholder="500" min="0"
                value={form.berat}
                onChange={e => set('berat', e.target.value)}
              />
            </div>
          </>
        )}

        {/* STEP 3: MODE JUALAN */}
        {(!isMobile || step === 3) && (
          <>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox" id="aktif"
                checked={form.aktif}
                onChange={e => set('aktif', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <label htmlFor="aktif" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Produk aktif (tampil di toko)
              </label>
            </div>

            {/* Flash Sale */}
            <div style={{
              gridColumn: '1 / -1',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                    ⚡ Flash Sale
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Harga spesial dengan countdown timer di toko
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={isFlashSale}
                    onChange={e => setIsFlashSale(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                  />
                </label>
              </div>

              {isFlashSale && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                      HARGA FLASH (Rp)
                    </label>
                    <input
                      type="number"
                      value={hargaFlash}
                      onChange={e => setHargaFlash(e.target.value)}
                      placeholder="cth: 45000"
                      className="form-input"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                      BERAKHIR PADA
                    </label>
                    <input
                      type="datetime-local"
                      value={flashSaleUntil}
                      onChange={e => setFlashSaleUntil(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="form-input"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pre-order */}
            <div style={{
              gridColumn: '1 / -1',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                    📦 Pre-order
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Terima pesanan sebelum stok ready
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={isPreorder}
                    onChange={e => setIsPreorder(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                  />
                </label>
              </div>

              {isPreorder && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                    ESTIMASI READY
                  </label>
                  <input
                    type="date"
                    value={preorderReadyDate}
                    onChange={e => setPreorderReadyDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="form-input"
                    style={{ marginTop: 4 }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
