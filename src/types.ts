export interface Product {
  id: string
  nama: string
  harga: number
  originalPrice?: number
  kategori?: string
  foto_url?: string
  deskripsi?: string
  stok?: number
  terjual?: number
  rating?: number
  variants?: string[]
  isDigital?: boolean
  linkDigital?: string
}

export interface CartItem {
  id: string
  nama: string
  harga: number
  originalPrice?: number
  qty: number
  variant?: string
  foto_url?: string
}

export interface PromoCoupon {
  id: string
  kode: string
  tipe: 'persen' | 'nominal'
  nilai: number
  minOrder: number
  sisaKupon: number
  tglKadaluarsa: string
  isAktif: boolean
}

export interface Customer {
  nama: string
  wa: string
  totalSpent: number
  orderCount: number
  lastOrderDate: string
  lastProduct?: string
}

export interface Review {
  id: string
  nama: string
  rating: number
  ulasan: string
  tgl: string
  verified?: boolean
  avatar?: string
}

export interface Order {
  id: string
  buyerNama: string
  buyerWa: string
  buyerAlamat?: string
  buyerKurir?: string
  produkNama: string
  variant?: string
  qty: number
  total: number
  status: 'pending' | 'dibayar' | 'dikirim' | 'selesai' | 'dibatalkan'
  createdAt: string
  resi?: string
}

export interface StoreConfig {
  namaToko: string
  slug: string
  waAdmin: string
  motto: string
  logoUrl?: string
  deskripsi?: string
}

export interface User {
  id: string
  email: string
  nama: string
  role: 'seller' | 'buyer' | 'admin'
  tokoSlug?: string
}
