import React, { useState, useRef } from 'react'
import { Image as ImageIcon, X, Loader, Lock, Sparkles, Zap, Crown } from 'lucide-react'
import { compressImage } from '../lib/utils'
import { streamApi } from '../lib/api'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const MAX_PHOTOS = {
  free: 2,
  starter: 3,
  pro: 5,
  business: 5,
}

const TIER_INFO = {
  free: { name: 'Gratis', next: 'starter', icon: null, color: 'var(--text-tertiary)' },
  starter: { name: 'Starter', next: 'pro', icon: Sparkles, color: '#3B82F6' },
  pro: { name: 'Pro', next: 'business', icon: Zap, color: '#a78bfa' },
  business: { name: 'Business', next: null, icon: Crown, color: '#10B981' },
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function StreamImageUpload({ value = [], onChange, tokenObj, disabled, plan = 'free' }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()
  
  const userPlan = (plan || 'free').toLowerCase()
  const maxPhotos = MAX_PHOTOS[userPlan] ?? MAX_PHOTOS.free
  const canAddMore = value.length < maxPhotos
  const tierInfo = TIER_INFO[userPlan] || TIER_INFO.free

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, maxPhotos - value.length)
    if (!files.length) return

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} lebih dari 5MB`)
        continue
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} bukan file gambar`)
        continue
      }
    }

    const validFiles = files.filter(f => f.size <= MAX_SIZE && f.type.startsWith('image/'))
    if (!validFiles.length) return

    setUploading(true)
    try {
      const uploadedUrls = []
      for (const file of validFiles) {
        const compressed = await compressImage(file, 600, 0.6)
        const fileBase64 = await fileToBase64(compressed)
        const res = await streamApi.uploadImage(tokenObj, {
          fileBase64,
          fileName: file.name,
          contentType: compressed.type || file.type,
        })
        uploadedUrls.push(res.data.url)
      }
      onChange([...value, ...uploadedUrls])
      toast.success(`${uploadedUrls.length} foto berhasil diupload`)
    } catch (err) {
      toast.error('Gagal upload foto: ' + (err.message || 'Terjadi kesalahan'))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = (index) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          {value.length}/{maxPhotos} foto
        </span>
        {(userPlan === 'free' || userPlan === 'starter') && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', color: userPlan === 'free' ? '#3B82F6' : '#a78bfa',
            background: userPlan === 'free' ? 'rgba(59,130,246,0.1)' : 'rgba(167,139,250,0.1)',
            padding: '2px 8px', borderRadius: 'var(--radius-full, 9999px)',
            border: `1px solid ${userPlan === 'free' ? 'rgba(59,130,246,0.2)' : 'rgba(167,139,250,0.2)'}`,
          }}>
            <Lock size={10} />
            Maks {maxPhotos} foto · <Link to="/dashboard/upgrade" style={{ color: userPlan === 'free' ? '#3B82F6' : '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Upgrade {tierInfo.next === 'starter' ? 'Starter' : 'Pro'}</Link>
          </span>
        )}
        {(userPlan === 'pro' || userPlan === 'business') && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', color: tierInfo.color,
            background: `${tierInfo.color}20`,
            padding: '2px 8px', borderRadius: 'var(--radius-full, 9999px)',
            border: `1px solid ${tierInfo.color}40`,
          }}>
            {tierInfo.icon && <tierInfo.icon size={10} />}
            {maxPhotos} foto per post
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {value.map((url, index) => (
          <div key={url + index} style={{
            position: 'relative',
            width: 100, height: 100,
            borderRadius: 'var(--radius-lg, 12px)',
            overflow: 'hidden',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          }}>
            <img
              src={url}
              alt={`Foto ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 22, height: 22,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {canAddMore && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              width: 100, height: 100,
              borderRadius: 'var(--radius-lg, 12px)',
              border: '1px dashed var(--glass-border, rgba(255,255,255,0.2))',
              background: 'var(--surface, rgba(255,255,255,0.02))',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 6,
              cursor: uploading ? 'default' : 'pointer',
              color: 'var(--text-tertiary, #94a3b8)',
            }}
          >
            {uploading ? (
              <Loader size={18} style={{ animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <>
                <ImageIcon size={18} />
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Tambah</span>
              </>
            )}
          </button>
        )}

        {!canAddMore && (userPlan === 'free' || userPlan === 'starter') && (
          <div style={{
            width: 100, height: 100,
            borderRadius: 'var(--radius-lg, 12px)',
            border: `1px dashed ${userPlan === 'free' ? 'rgba(59,130,246,0.3)' : 'rgba(167,139,250,0.3)'}`,
            background: userPlan === 'free' ? 'rgba(59,130,246,0.04)' : 'rgba(167,139,250,0.04)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 4, opacity: 0.7,
          }}>
            <Lock size={16} color={userPlan === 'free' ? '#3B82F6' : '#a78bfa'} />
            <span style={{ fontSize: '0.6rem', color: userPlan === 'free' ? '#3B82F6' : '#a78bfa', fontWeight: 600 }}>
              Upgrade
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
      />

      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary, #94a3b8)', marginTop: 8 }}>
        JPG, PNG, WEBP — maks 5MB per foto
      </p>
    </div>
  )
}
