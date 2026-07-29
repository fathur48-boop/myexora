import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Store, ExternalLink, Search, Star, MapPin,
  CheckCircle2, Zap, Sparkles, ShoppingBag, Eye, Share2,
  Filter, Tag, MessageCircle, Clock, ShieldCheck, ChevronRight,
  Radio, Heart, Repeat2, MessageSquare, Send
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import SeoMeta from '../components/SeoMeta.jsx'
import { useStreamStore } from '../lib/store'

const DEMO_STORES = [
  {
    name: 'Rina Handmade & Craft',
    slug: 'rina-handmade',
    badge: 'PRO',
    category: 'Craft & Lifestyle',
    location: 'Bandung, Jawa Barat',
    rating: 4.9,
    ordersCount: '180+',
    desc: 'Kerajinan tangan khas Indonesia, tas anyaman bambu premium, dan aksesoris kayu handmade buatan perajin lokal.',
    img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    owner: 'Rina Kartika',
    whatsapp: '6283862720514',
    products: [
      { name: 'Tas Anyaman Anyelir', price: 'Rp 145.000', img: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=200&auto=format&fit=crop&q=80' },
      { name: 'Gantungan Kunci Kayu Jati', price: 'Rp 25.000', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&auto=format&fit=crop&q=80' },
      { name: 'Vas Bunga Seramik Handmade', price: 'Rp 89.000', img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&auto=format&fit=crop&q=80' }
    ]
  },
  {
    name: 'Kopi Kenangan Mantan',
    slug: 'kopi-mantan',
    badge: 'STARTER',
    category: 'Kuliner & Kopi',
    location: 'Jakarta Selatan',
    rating: 4.8,
    ordersCount: '420+',
    desc: 'Anak senja & biji kopi arabika pilihan roasted fresh harian. Pesan cold brew & matcha latte favoritmu langsung sampai.',
    img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
    owner: 'Arya Senja',
    whatsapp: '6283862720514',
    products: [
      { name: 'Kopi Susu Mantan 1 Liter', price: 'Rp 85.000', img: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=200&auto=format&fit=crop&q=80' },
      { name: 'Matcha Uji Premium Bottle', price: 'Rp 38.000', img: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200&auto=format&fit=crop&q=80' },
      { name: 'Beans Arabika Gayo 250g', price: 'Rp 75.000', img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&auto=format&fit=crop&q=80' }
    ]
  },
  {
    name: 'Aroma Lilin Aromaterapi',
    slug: 'aroma-lilin',
    badge: 'PRO',
    category: 'Craft & Lifestyle',
    location: 'Bali',
    rating: 5.0,
    ordersCount: '310+',
    desc: 'Lilin aromaterapi coconut wax buatan tangan dengan essensial oil murni Bali Lavender & Vanilla Woods.',
    img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    owner: 'Ketut Sugi',
    whatsapp: '6283862720514',
    products: [
      { name: 'Scented Candle Bali Lavender', price: 'Rp 65.000', img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=200&auto=format&fit=crop&q=80' },
      { name: 'Reed Diffuser Sweet Vanilla', price: 'Rp 95.000', img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200&auto=format&fit=crop&q=80' }
    ]
  },
  {
    name: 'KicksZone Sneakers Original',
    slug: 'kickszone',
    badge: 'PRO',
    category: 'Fashion & Style',
    location: 'Surabaya, Jawa Timur',
    rating: 4.9,
    ordersCount: '520+',
    desc: 'Pusat sneakers authentic 100% original, streetwear apparel, dan perawatan khusus sepatu berkualitas terpercaya.',
    img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    owner: 'Budi Santoso',
    whatsapp: '6283862720514',
    products: [
      { name: 'Air Jordan 1 Low Retro', price: 'Rp 1.850.000', img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=200&auto=format&fit=crop&q=80' },
      { name: 'Sneakers Cleaner Set', price: 'Rp 89.000', img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&auto=format&fit=crop&q=80' }
    ]
  },
  {
    name: 'Fashionku Hijab Official',
    slug: 'fashionku',
    badge: 'FREE',
    category: 'Fashion & Style',
    location: 'Yogyakarta',
    rating: 4.7,
    ordersCount: '95+',
    desc: 'Hijab segi empat voal motif eksklusif, pashmina silk lembut, dan gamis syari kekinian nyaman seharian.',
    img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    owner: 'Siti Rahma',
    whatsapp: '6283862720514',
    products: [
      { name: 'Hijab Voal Premium Motif', price: 'Rp 45.000', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&auto=format&fit=crop&q=80' },
      { name: 'Pashmina Inner Silk Rayon', price: 'Rp 55.000', img: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=200&auto=format&fit=crop&q=80' }
    ]
  },
  {
    name: 'Dapur Mama Snack & Kue',
    slug: 'dapurmama',
    badge: 'FREE',
    category: 'Kuliner & Kopi',
    location: 'Semarang, Jawa Tengah',
    rating: 4.8,
    ordersCount: '140+',
    desc: 'Snack tradisional renyah, sus kering cokelat lumer, dan kue kering lebaran resep asli keluarga tanpa pengawet.',
    img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    owner: 'Dewi Lestari',
    whatsapp: '6283862720514',
    products: [
      { name: 'Sus Kering Cokelat Lumer 250g', price: 'Rp 28.000', img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&auto=format&fit=crop&q=80' },
      { name: 'Nastar Keju Wijsman Jar', price: 'Rp 85.000', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80' }
    ]
  }
]

const CATEGORIES = [
  'Semua Kategori',
  'Fashion & Style',
  'Kuliner & Kopi',
  'Craft & Lifestyle',
]

export default function ShowcasePage() {
  const [mainTab, setMainTab] = useState('stream') // 'stream' or 'stores'
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori')
  const [selectedTier, setSelectedTier] = useState('all') // 'all', 'pro', 'starter', 'free'
  const [previewStore, setPreviewStore] = useState(null)

  const { feed } = useStreamStore()

  // Filter stream posts
  const filteredPosts = useMemo(() => {
    if (!feed) return []
    return feed.filter(p => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.teks?.toLowerCase().includes(q) ||
        p.toko?.nama?.toLowerCase().includes(q) ||
        p.toko?.slug?.toLowerCase().includes(q) ||
        p.hashtags?.some(h => h.toLowerCase().includes(q))
      )
    })
  }, [feed, search])

  // Filter stores
  const filteredStores = useMemo(() => {
    return DEMO_STORES.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.toLowerCase().includes(search.toLowerCase()) ||
        s.desc.toLowerCase().includes(search.toLowerCase()) ||
        s.location.toLowerCase().includes(search.toLowerCase())

      const matchCat = selectedCategory === 'Semua Kategori' || s.category === selectedCategory

      let matchTier = true
      if (selectedTier === 'pro') matchTier = s.badge === 'PRO'
      if (selectedTier === 'starter') matchTier = s.badge === 'STARTER'
      if (selectedTier === 'free') matchTier = s.badge === 'FREE'

      return matchSearch && matchCat && matchTier
    })
  }, [search, selectedCategory, selectedTier])

  const handleCopyLink = (slug) => {
    const url = `${window.location.origin}/toko/${slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link toko berhasil disalin! 🔗')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090a0f',
      color: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: 80
    }}>
      <SeoMeta
        title="Exora Showcase — Temukan Toko Online Kreatif Indonesia"
        description="Jelajahi katalog toko & produk lokal terbaik di Exora Showcase. Beli langsung via WhatsApp tanpa komisi platform."
        image="https://myexora.com/og-image.jpg"
      />
      {/* Top Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(8, 8, 10, 0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/" className="btn btn-ghost btn-sm" style={{ color: '#a1a1aa', padding: '6px 12px' }}>
              <ArrowLeft size={16} /> Beranda
            </Link>
            <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.12)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, background: '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <Store size={18} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f4f4f6' }}>Exora Showcase</span>
            </div>
          </div>

          <Link to="/login" className="btn btn-primary btn-sm" style={{ gap: 6, background: '#2563eb', color: '#fff', border: 'none' }}>
            <Sparkles size={15} /> Buat Toko Gratis
          </Link>
        </div>
      </nav>

      {/* Hero Header Section */}
      <section style={{
        position: 'relative', overflow: 'hidden', padding: '60px 24px 40px',
        textAlign: 'center', background: '#08080a'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
            borderRadius: 100, background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)',
            color: '#60a5fa', fontSize: '0.82rem', fontWeight: 700, marginBottom: 20
          }}>
            <ShieldCheck size={15} /> DIRECTORY TOKO OFFICIAL EXORA
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800, lineHeight: 1.15,
            marginBottom: 16, color: '#ffffff', letterSpacing: '-0.02em'
          }}>
            Jelajahi Toko Online <br />
            <span style={{ color: '#3b82f6' }}>
              Terpercaya & Terverifikasi
            </span>
          </h1>

          <p style={{ color: '#a1a1aa', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 32 }}>
            Temukan produk fashion lokal, kopi pilihan, kerajinan tangan, hingga kuliner favorit. Transaksi langsung ke WhatsApp penjual tanpa komisi platform.
          </p>

          {/* Stats Bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16,
            background: '#14141a', border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 20, padding: 20
          }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>120+ Toko</div>
              <div style={{ fontSize: '0.78rem', color: '#71717a' }}>Aktif di Seluruh Indonesia</div>
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>Rp 24.8M+</div>
              <div style={{ fontSize: '0.78rem', color: '#71717a' }}>Total GMV Transaksi</div>
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>99.9%</div>
              <div style={{ fontSize: '0.78rem', color: '#71717a' }}>Respon WhatsApp Cepat</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Filters */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Main Tab Switcher */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setMainTab('stream')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
              borderRadius: 14, fontSize: '0.9rem', fontWeight: 700, border: 'none', cursor: 'pointer',
              background: mainTab === 'stream' ? '#2563eb' : '#14141a',
              color: mainTab === 'stream' ? '#fff' : '#a1a1aa',
              boxShadow: mainTab === 'stream' ? '0 4px 16px rgba(37, 99, 235, 0.3)' : 'none',
              transition: 'all 0.2s', flex: '1 1 200px', maxWidth: 300, justifyContent: 'center'
            }}
          >
            <Radio size={18} className={mainTab === 'stream' ? 'animate-pulse' : ''} />
            Live Stream Showcase ({filteredPosts.length})
          </button>

          <button
            onClick={() => setMainTab('stores')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
              borderRadius: 14, fontSize: '0.9rem', fontWeight: 700, border: 'none', cursor: 'pointer',
              background: mainTab === 'stores' ? '#2563eb' : '#14141a',
              color: mainTab === 'stores' ? '#fff' : '#a1a1aa',
              boxShadow: mainTab === 'stores' ? '0 4px 16px rgba(37, 99, 235, 0.3)' : 'none',
              transition: 'all 0.2s', flex: '1 1 200px', maxWidth: 300, justifyContent: 'center'
            }}
          >
            <Store size={18} />
            Directory Toko Official ({filteredStores.length})
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32,
          background: '#14141a', padding: 20, borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              <input
                type="text"
                placeholder={mainTab === 'stream' ? "Cari postingan produk, hashtag (#ProdukBaru, #CariReseller), atau toko..." : "Cari toko, produk, lokasi (mis. Bandung, Kopi, Hijab)..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input"
                style={{
                  width: '100%', paddingLeft: 44, height: 46, borderRadius: 12,
                  background: '#0e0e12', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.9rem', color: '#f4f4f6'
                }}
              />
            </div>

            {/* Tier Filters */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'all', label: 'Semua Tier' },
                { id: 'pro', label: '⭐ PRO Verified' },
                { id: 'starter', label: '⚡ Starter' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTier(t.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: selectedTier === t.id ? '#2563eb' : '#0e0e12',
                    color: selectedTier === t.id ? '#ffffff' : '#a1a1aa',
                    transition: 'all 0.2s'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600,
                  whiteSpace: 'nowrap', border: '1px solid', cursor: 'pointer',
                  background: selectedCategory === cat ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                  borderColor: selectedCategory === cat ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedCategory === cat ? '#60a5fa' : '#a1a1aa',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT 1: LIVE STREAM SHOWCASE */}
        {mainTab === 'stream' && (
          <div>
            {filteredPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#141722', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Radio size={48} style={{ color: '#64748b', marginBottom: 12 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>Belum Ada Postingan Stream</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Jadilah seller pertama yang memposting produk baru di Exora Stream!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
                {filteredPosts.map(post => {
                  const tokoSlug = post.shopLink?.slug || post.toko?.slug || 'exora-official'
                  const tokoNama = post.toko?.nama || 'Toko Exora'
                  const isPro = post.toko?.pro

                  return (
                    <div
                      key={post.id}
                      style={{
                        background: '#141722',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 20,
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        transition: 'transform 0.2s, border-color 0.2s'
                      }}
                      className="hover:-translate-y-1 hover:border-sky-500/30"
                    >
                      <div>
                        {/* Header Seller Info */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800,
                              overflow: 'hidden', flexShrink: 0
                            }}>
                              {post.toko?.logo ? (
                                <img src={post.toko.logo} alt={tokoNama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                tokoNama.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>{tokoNama}</span>
                                {isPro && <CheckCircle2 size={14} color="#38bdf8" />}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>@{tokoSlug}</span>
                            </div>
                          </div>

                          {/* Post Type Badge */}
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: 100,
                            background: post.postType === 'produk_baru' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                            color: post.postType === 'produk_baru' ? '#38bdf8' : '#c084fc',
                            border: `1px solid ${post.postType === 'produk_baru' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`
                          }}>
                            {post.postType === 'produk_baru' ? '🔥 Produk Baru' : post.postType === 'cari_reseller' ? '🤝 Cari Reseller' : '📦 Stream Update'}
                          </span>
                        </div>

                        {/* Post Body Text */}
                        <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: 14, whiteSpace: 'pre-line' }}>
                          {post.teks}
                        </p>

                        {/* Photos Grid */}
                        {post.foto && post.foto.length > 0 && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: post.foto.length > 1 ? '1fr 1fr' : '1fr',
                            gap: 8,
                            marginBottom: 16,
                            borderRadius: 14,
                            overflow: 'hidden'
                          }}>
                            {post.foto.map((imgUrl, i) => (
                              <img
                                key={i}
                                src={imgUrl}
                                alt="Gambar Produk"
                                style={{ width: '100%', height: post.foto.length > 1 ? 140 : 220, objectFit: 'cover', borderRadius: 8 }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                            {post.hashtags.map((h, idx) => (
                              <span key={idx} style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>{h}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.78rem', color: '#94a3b8' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Heart size={14} color="#f43f5e" fill="#f43f5e" /> {post.likesCount || 0}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Repeat2 size={14} color="#10b981" /> {post.repostsCount || 0}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <a
                            href={`/toko/${tokoSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '6px 12px', gap: 4, textDecoration: 'none' }}
                          >
                            <Store size={13} /> Buka Toko
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 2: STORE CARDS GRID */}
        {mainTab === 'stores' && (
          <div>
            {filteredStores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#141722', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Store size={48} style={{ color: '#64748b', marginBottom: 12 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>Toko Tidak Ditemukan</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Coba gunakan kata kunci pencarian atau kategori lain.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
            {filteredStores.map(s => (
              <div
                key={s.slug}
                style={{
                  background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.2s, border-color 0.2s', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}
                className="hover:-translate-y-1 hover:border-sky-500/30"
              >
                {/* Store Header Banner */}
                <div style={{ height: 90, background: s.banner, position: 'relative', padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#fff',
                    display: 'inline-flex', alignItems: 'center', gap: 4
                  }}>
                    <Tag size={12} /> {s.category}
                  </span>

                  <span style={{
                    padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800,
                    background: s.badge === 'PRO' ? '#a855f7' : s.badge === 'STARTER' ? '#38bdf8' : '#64748b',
                    color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    {s.badge} TIER
                  </span>
                </div>

                {/* Store Body Info */}
                <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Avatar & Title */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <img
                      src={s.img}
                      alt={s.name}
                      style={{
                        width: 60, height: 60, borderRadius: 18, objectFit: 'cover',
                        border: '3px solid #141722', boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                        marginTop: -28, flexShrink: 0, position: 'relative', zIndex: 2
                      }}
                    />
                    <div style={{ flex: 1, paddingTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#fff', lineHeight: 1.3 }}>
                          {s.name}
                        </h3>
                        {s.badge === 'PRO' && <CheckCircle2 size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginTop: 2 }}>exora.app/toko/{s.slug}</span>
                    </div>
                  </div>

                  {/* Rating & Location Meta */}
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 700 }}>
                      <Star size={13} fill="#f59e0b" /> {s.rating}
                    </span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
                      <MapPin size={13} /> {s.location}
                    </span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>
                      {s.ordersCount} Pesanan
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: 16, flex: 1 }}>
                    {s.desc}
                  </p>

                  {/* Product Thumbnails Preview */}
                  {s.products && s.products.length > 0 && (
                    <div style={{ background: '#0b0d14', padding: 10, borderRadius: 12, marginBottom: 16 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Produk Unggulan Toko
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {s.products.map((p, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#141722', padding: 6, borderRadius: 8, flex: 1, minWidth: 0 }}>
                            <img src={p.img} alt={p.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>{p.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                    <button
                      onClick={() => setPreviewStore(s)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: 6, fontSize: '0.8rem', background: '#1e293b' }}
                    >
                      <Eye size={14} /> Quick View
                    </button>

                    <a
                      href={`/toko/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ gap: 6, fontSize: '0.8rem', textDecoration: 'none', justifyContent: 'center' }}
                    >
                      Kunjungi Toko <ExternalLink size={13} />
                    </a>

                    <button
                      onClick={() => handleCopyLink(s.slug)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0 10px', color: '#94a3b8' }}
                      title="Salin Link Toko"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

        {/* CTA Banner Section */}
        <div style={{
          marginTop: 60, background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)',
          border: '1px solid rgba(129, 140, 248, 0.3)', borderRadius: 24, padding: '40px 32px',
          textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <span style={{
              padding: '6px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.15)',
              color: '#a7f3d0', fontSize: '0.8rem', fontWeight: 800, display: 'inline-block', marginBottom: 14
            }}>
              🚀 GABUNG JUTAAN SELLER INDONESIA
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: 12 }}>
              Ingin Toko Onlinemu Tampil Cantik & Otomatis Seperti Ini?
            </h2>
            <p style={{ color: '#c7d2fe', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
              Buat website katalog jualan WhatsApp dalam 30 detik tanpa perlu koding. Gratis selamanya dengan fitur lengkap!
            </p>
            <Link to="/login" className="btn btn-primary btn-lg" style={{ gap: 8, background: '#38bdf8', color: '#0f172a', fontWeight: 800 }}>
              Buat Toko Sekarang <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick View Store Modal */}
      <AnimatePresence>
        {previewStore && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 540, background: '#141722',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
              }}
            >
              {/* Modal Banner */}
              <div style={{ height: 110, background: previewStore.banner, position: 'relative', padding: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setPreviewStore(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 100, background: 'rgba(0,0,0,0.5)',
                    border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <img
                    src={previewStore.img}
                    alt={previewStore.name}
                    style={{
                      width: 68, height: 68, borderRadius: 20, border: '4px solid #141722',
                      objectFit: 'cover', marginTop: -32, flexShrink: 0, position: 'relative', zIndex: 2
                    }}
                  />
                  <div style={{ flex: 1, paddingTop: 10 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.25 }}>{previewStore.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>{previewStore.owner} • {previewStore.location}</div>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: 20 }}>
                  {previewStore.desc}
                </p>

                <div style={{ background: '#0b0d14', padding: 16, borderRadius: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShoppingBag size={15} style={{ color: '#38bdf8' }} /> Katalog Unggulan ({previewStore.products?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {previewStore.products?.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#141722', padding: 10, borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={p.img} alt={p.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{p.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 800 }}>{p.price}</div>
                          </div>
                        </div>
                        <a
                          href={`/toko/${previewStore.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#38bdf8', fontSize: '0.78rem' }}
                        >
                          Beli <ChevronRight size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <a
                    href={`/toko/${previewStore.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center', height: 46 }}
                  >
                    Kunjungi Full Storefront <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
