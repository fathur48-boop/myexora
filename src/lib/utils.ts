import { CONFIG } from './config'

export const PESANAN_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu', color: 'warning' },
  confirmed: { label: 'Dikonfirmasi', color: 'accent' },
  processing: { label: 'Diproses', color: 'accent' },
  shipped: { label: 'Dikirim', color: 'accent' },
  done: { label: 'Selesai', color: 'success' },
  cancelled: { label: 'Dibatalkan', color: 'danger' },
}

export function formatDateTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRupiah(number?: number | null): string {
  if (number === null || number === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number)
}

export function parsePlanString(val?: any): string {
  if (!val) return 'free'
  if (typeof val === 'string') return val
  if (typeof val === 'object' && val !== null) {
    if (typeof val.plan === 'string') return val.plan
    if (typeof val.plan === 'object' && val.plan !== null) return parsePlanString(val.plan)
    if (typeof val.name === 'string' && ['free', 'starter', 'pro', 'business'].includes(val.name.toLowerCase())) return val.name
    if (typeof val.id === 'string' && ['free', 'starter', 'pro', 'business'].includes(val.id.toLowerCase())) return val.id
    if (typeof val.tier === 'string') return val.tier
  }
  return String(val)
}

export function getTierLevel(plan?: any): number {
  const p = parsePlanString(plan).toLowerCase()
  if (p === 'business') return 3
  if (p === 'pro') return 2
  if (p === 'starter') return 1
  return 0
}

export function getPlanDisplayName(plan?: any): string {
  const p = parsePlanString(plan).toLowerCase()
  if (p === 'business') return 'Business'
  if (p === 'pro') return 'Pro'
  if (p === 'starter') return 'Starter'
  return 'Free'
}

export function isPro(plan?: any): boolean {
  return getTierLevel(plan) >= 2
}

export function getProductLimit(plan?: any): number {
  const level = getTierLevel(plan)
  if (level >= 3) return -1 // Unlimited for Business
  if (level === 2) return 250 // Pro
  if (level === 1) return 50 // Starter
  return 10 // Free
}

export function truncate(str?: string, length: number = 30): string {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function generateWALink(phone?: string, message?: string): string {
  const cleanPhone = (phone || '').replace(/\D/g, '')
  const encoded = encodeURIComponent(message || '')
  return `https://wa.me/${cleanPhone}?text=${encoded}`
}

export function getInitials(name?: string): string {
  if (!name) return 'EX'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function getStorefrontUrl(slug?: string): string {
  if (!slug) return '#'
  return `/toko/${slug}`
}

export async function compressImage(file: File, maxWidth = 800, quality = 0.78): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const elem = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        elem.width = width
        elem.height = height
        const ctx = elem.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        // Convert to WebP format for high compression under 100KB
        ctx.canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else resolve(file)
          },
          'image/webp',
          quality
        )
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Automatically inject Cloudinary auto-format (f_auto) and quality (q_auto) parameters
 * for maximum performance on mobile browsers.
 */
export function getOptimizedCloudinaryUrl(url?: string, width = 800): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com')) return url
  if (url.includes('f_auto') || url.includes('q_auto')) return url
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`)
}

export function validateWA(phone?: string): boolean {
  if (!phone) return false
  const clean = phone.replace(/\D/g, '')
  return clean.length >= 9 && clean.length <= 15
}

export function generateUpgradeMessage(user?: any, toko?: any, targetPlan?: string): string {
  const planName = getPlanDisplayName(targetPlan)
  return `Halo Admin Exora, saya ingin mengajukan upgrade plan.

Detail Akun:
- Nama: ${user?.name || '-'}
- Email: ${user?.email || '-'}
- Nama Toko: ${toko?.nama || '-'}
- Slug Toko: ${toko?.slug || '-'}
- Target Plan: ${planName}

Mohon instruksi pembayaran selengkapnya. Terima kasih!`
}

export async function safeFetchJson(res: Response): Promise<any> {
  const text = await res.text()
  if (!text || text.trim() === '') {
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText || 'Gagal terhubung ke server'}`)
    }
    return { success: true }
  }
  try {
    return JSON.parse(text)
  } catch (err) {
    if (!res.ok) {
      throw new Error(text || `HTTP Error ${res.status}`)
    }
    throw new Error(`Respons server tidak valid: ${text.slice(0, 100)}`)
  }
}
