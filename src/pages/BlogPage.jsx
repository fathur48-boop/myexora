import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Search, Calendar, Clock, User, ArrowRight, Share2, MessageCircle,
  Sparkles, BookOpen, Tag, ChevronRight, ArrowLeft, Check, Copy,
  Bookmark, Heart, ThumbsUp, Send, TrendingUp, Store, Mail
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { CONFIG } from '../lib/config'

// --- SAMPLE BLOG DATA ---
const CATEGORIES = [
  { id: 'all', label: 'Semua Artikel' },
  { id: 'whatsapp', label: 'Strategi WhatsApp' },
  { id: 'tips', label: 'Tips E-Commerce' },
  { id: 'marketing', label: 'Marketing & Closing' },
  { id: 'panduan', label: 'Panduan Exora' },
  { id: 'kasus', label: 'Studi Kasus' },
]

const BLOG_POSTS = [
  {
    id: '1',
    slug: '5-trik-closing-whatsapp-otomatis-omset-naik-300-persen',
    title: '5 Trik Closing di WhatsApp Auto Laris: Omset Naik Hingga 300%',
    excerpt: 'Pelajari cara membalas chat calon pembeli di WhatsApp menggunakan pola kalimat terbukti closing tinggi tanpa terkesan memaksa.',
    category: 'whatsapp',
    categoryLabel: 'Strategi WhatsApp',
    readTime: '5 min baca',
    date: '24 Juli 2026',
    author: {
      name: 'Rian Pratama',
      role: 'Growth Specialist Exora',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    image: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800',
    featured: true,
    content: `
      <h2>Mengapa WhatsApp Masih Jadi Raja Sales di Indonesia?</h2>
      <p>Masyarakat Indonesia sangat menyukai interaksi personal saat berbelanja online. WhatsApp memberikan rasa aman dan sentuhan pribadi yang tidak bisa diberikan oleh sistem checkout marketplace biasa.</p>
      
      <h3>1. Gunakan Teknik 'Pilihan Terbatas'</h3>
      <p>Jangan tanya <em>"Jadi beli kak?"</em>. Pertanyaan ini memicu otak pembeli untuk bilang 'tidak'. Sebaliknya berikan 2 pilihan positif:</p>
      <blockquote style="border-left: 3px solid var(--accent); padding-left: 14px; margin: 16px 0; font-style: italic; color: var(--text-secondary);">
        "Kakak mau kirim warna Black atau Navy hari ini biar besok langsung sampai?"
      </blockquote>

      <h3>2. Kirimkan Katalog Form Instan</h3>
      <p>Calon pembeli malas mengetik alamat berulang kali. Menggunakan link katalog Exora, calon pembeli cukup memilih varian dan isi form, data langsung rapi masuk ke WhatsApp kamu tanpa typo.</p>

      <h3>3. Buat Scarcity (Kelangkaan) Realistis</h3>
      <p>Beri tahu pembeli jika stok varian favorit tersisa sedikit atau ada promo gratis ongkir terbatas untuk 5 pembeli pertama hari ini.</p>

      <h3>4. Follow Up H+1 Tanpa Terkesan Memaksa</h3>
      <p>Jika pembeli belum melakukan transfer, gunakan template ramah ini:</p>
      <div style="background: var(--surface); padding: 14px; border-radius: 8px; border: 1px solid var(--glass-border); margin: 14px 0; font-family: monospace; font-size: 0.85rem;">
        Halo Kak {Nama}, slot promo diskon 20% untuk paket {Produk} siap kami bungkus hari ini nih. Mau sekalian disisipkan bonus sticker eksklusifnya? 😊
      </div>

      <h3>5. Manfaatkan Resi Otomatis Sebagai Bukti Kepercayaan</h3>
      <p>Setelah pengiriman, langsung kirimkan link pelacakan resi Exora (exora.app/r/RESI). Pembeli bisa cek posisi paket secara real-time tanpa terus-menerus bertanya ke kamu.</p>
    `,
  },
  {
    id: '2',
    slug: 'cara-membuat-toko-online-whatsapp-tanpa-koding',
    title: 'Cara Membuat Toko Online WhatsApp Instan Kurang dari 5 Menit',
    excerpt: 'Panduan langkah demi langkah membangun katalog web profesional lengkap dengan checkout otomatis langsung ke WhatsApp seller.',
    category: 'panduan',
    categoryLabel: 'Panduan Exora',
    readTime: '4 min baca',
    date: '20 Juli 2026',
    author: {
      name: 'Siti Sarah',
      role: 'Head of Product',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    },
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    featured: false,
    content: `
      <h2>Mengapa Kamu Perlu Katalog Web Sendiri?</h2>
      <p>Menjual hanya lewat foto Instagram atau status WhatsApp membuat produk sulit dicari kembali oleh calon pembeli. Dengan Exora Storefront, semua produk rapi tersusun dalam satu link sederhana.</p>

      <h3>Langkah 1: Buat Akun & Tentukan Slug Toko</h3>
      <p>Daftar gratis di Exora dan pilih nama unik toko kamu, contohnya <code>exora.app/toko/fashionku</code>.</p>

      <h3>Langkah 2: Upload Produk & Harga</h3>
      <p>Masukkan foto produk, judul, deskripsi singkat, harga jual, dan stok. Kamu juga bisa mengisi HPP (Harga Pokok Penjualan) untuk mencatat profit bersih secara otomatis.</p>

      <h3>Langkah 3: Pasang Link di Bio Sosial Media</h3>
      <p>Salin link toko kamu dan tempelkan di Bio Instagram, TikTok, dan Profil WhatsApp Business kamu. Setiap ada yang bertanya harga, tinggal kirimkan link toko kamu!</p>
    `,
  },
  {
    id: '3',
    slug: 'studi-kasus-toko-sepatu-lokal-tembus-100juta-perbulan',
    title: 'Studi Kasus: Toko Sepatu Lokal Tembus Omset Rp100 Juta/Bulan Lewat Exora',
    excerpt: 'Simak kisah nyata bagaimana KicksZone merombak sistem order dari chat manual menjadi katalog Exora dan melipatgandakan efisiensi operasional.',
    category: 'kasus',
    categoryLabel: 'Studi Kasus',
    readTime: '7 min baca',
    date: '15 Juli 2026',
    author: {
      name: 'Budi Santoso',
      role: 'Owner KicksZone',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    image: 'https://images.unsplash.com/photo-1556742049-0a67568d0d9f?w=800',
    featured: false,
    content: `
      <h2>Tantangan Sebelum Menggunakan Exora</h2>
      <p>Dulu kami kewalahan membalas ratusan chat sehari hanya untuk menjawab "ukuran ini ready?", "harganya berapa?", atau menanyakan alamat pengiriman. Banyak calon pembeli kabur karena slow response.</p>

      <h2>Solusi: Checkout Terstruktur Exora</h2>
      <p>Kami memindahkan katalog produk kami ke Exora. Pembeli memilih ukuran sepatu, memasukkan alamat lengkap, dan sistem langsung membuat format pesan WhatsApp yang rapi.</p>

      <h3>Hasil yang Diraih:</h3>
      <ul>
        <li><strong>Waktu respon berkurang 80%:</strong> Admin hanya perlu mengonfirmasi pembayaran & pengiriman.</li>
        <li><strong>Omset naik dari Rp35 Juta ke Rp110 Juta/bulan.</strong></li>
        <li><strong>Tingkat kesalahan kirim alamat menjadi 0%</strong> karena diketik langsung oleh pembeli.</li>
      </ul>
    `,
  },
  {
    id: '4',
    slug: 'panduan-copywriting-deskripsi-produk-yang-menjual',
    title: 'Formula Copywriting Deskripsi Produk: Bikin Pembeli Langsung Kebelet Buy',
    excerpt: 'Jangan cuma tulis spesifikasi! Pelajari formula AIDA (Attention, Interest, Desire, Action) khusus deskripsi produk barang fisik.',
    category: 'marketing',
    categoryLabel: 'Marketing & Closing',
    readTime: '6 min baca',
    date: '10 Juli 2026',
    author: {
      name: 'Rian Pratama',
      role: 'Growth Specialist Exora',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
    featured: false,
    content: `
      <h2>Mengapa Banyak Orang Hanya Mengintip Tanpa Beli?</h2>
      <p>Kesalahan utama seller pemula adalah hanya menuliskan fitur/bahan tanpa menjelaskan <strong>manfaat emosional</strong> kepada pembeli.</p>

      <h3>Contoh Perbandingan:</h3>
      <p>❌ <em>Bahan: Cotton Combed 30s, Adem, Ukuran L.</em></p>
      <p>✅ <em>Bahan Cotton Combed 30s premium yang super lembut & adem di kulit. Gak bakal gerah meski dipakai beraktivitas seharian di bawah terik matahari. Potongan oversize-nya bikin penampilan kamu makin stylish & percaya diri!</em></p>

      <h3>Formula 4 Elemen Wajib:</h3>
      <ol>
        <li><strong>Hook / Headline Masalah:</strong> Sentuh keresahan utama calon pembeli.</li>
        <li><strong>Solusi Utama:</strong> Jelaskan bagaimana produk kamu menyelesaikan masalah itu.</li>
        <li><strong>Garansi / Keamanan:</strong> Beri garansi tukar size atau jaminan kualitas.</li>
        <li><strong>Call to Action (CTA):</strong> Arahkan untuk klik tombol beli sekarang.</li>
      </ol>
    `,
  },
  {
    id: '5',
    slug: '5-kesalahan-fatal-admin-whatsapp-online-shop',
    title: '5 Kesalahan Fatal Admin WA Online Shop yang Bikin Calon Pembeli Kabur',
    excerpt: 'Cek apakah tim customer service kamu masih melakukan kebiasaan buruk ini saat menangani pesanan di WhatsApp!',
    category: 'tips',
    categoryLabel: 'Tips E-Commerce',
    readTime: '4 min baca',
    date: '05 Juli 2026',
    author: {
      name: 'Siti Sarah',
      role: 'Head of Product',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    },
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    featured: false,
    content: `
      <h2>Detail Kecil yang Berdampak Besar pada Omset</h2>
      <p>Di bisnis online berbasis chat, kecepatan & keramahan adalah kunci kepercayaan utama.</p>
      
      <h3>1. Balasan Singkat & Kaku (Singkat = Judes)</h3>
      <p>Menjawab "Ready" atau "Gak ada" tanpa salam atau emoji terasa sangat dingin. Biasakan sapa nama pembeli dan gunakan nada bicara yang hangat.</p>

      <h3>2. Kirim Gambar Tanpa Harga</h3>
      <p>Memaksa pembeli bertanya "Harga berapa?" membuat gesekan tambahan (friction). Transparansi harga di awal justru membangun kepercayaan lebih cepat.</p>

      <h3>3. Tidak Menyimpan Kontak Pembeli</h3>
      <p>Setiap chat yang masuk adalah aset berharga! Simpan nomor pembeli agar kamu bisa membuat Broadcast Promo atau update Status WhatsApp di kemudian hari.</p>
    `,
  },
]

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeArticle, setActiveArticle] = useState(null)
  const [emailSubscribe, setEmailSubscribe] = useState('')
  const [likedArticles, setLikedArticles] = useState({})

  // Filter posts
  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    const matchesSearch = !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredPost = BLOG_POSTS.find(p => p.featured) || BLOG_POSTS[0]

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!emailSubscribe.trim() || !emailSubscribe.includes('@')) {
      toast.error('Masukkan email yang valid')
      return
    }
    toast.success('Terima kasih! Kamu telah berlangganan newsletter Exora 🎉')
    setEmailSubscribe('')
  }

  const handleToggleLike = (id) => {
    setLikedArticles(prev => {
      const isLiked = !!prev[id]
      if (!isLiked) toast.success('Artikel disimpan ke favorit!')
      return { ...prev, [id]: !isLiked }
    })
  }

  const handleShareArticle = (post) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + '/blog#' + post.slug)
      toast.success('Link artikel disalin ke clipboard!')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #0f0f14)',
      color: 'var(--text-primary, #fff)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* --- NAVBAR --- */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15, 15, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '14px 24px',
      }}>
        <div style={{
          maxWidth: 1140, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent-gradient, linear-gradient(135deg, #5b8af5, #a855f7))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}>
              <Store size={18} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.02em' }}>
              Exora <span style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>Blog</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)' }}>
              Beranda
            </Link>
            <Link to="/updates" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)' }}>
              Updates
            </Link>
            <Link to="/login" className="btn btn-primary btn-sm">
              Mulai Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section style={{
        padding: '60px 24px 40px',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 20%, rgba(91, 138, 245, 0.12) 0%, transparent 70%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 100,
            background: 'rgba(91, 138, 245, 0.12)', border: '1px solid rgba(91, 138, 245, 0.3)',
            color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, marginBottom: 16,
          }}>
            <Sparkles size={14} /> Pusat Edukasi & Strategi Bisnis
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800,
            lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 16,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #94A3B8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Wawasan & Tips Melejitkan Omset Toko Online
          </h1>

          <p style={{
            color: 'var(--text-secondary)', fontSize: '1.05rem',
            lineHeight: 1.6, marginBottom: 32, maxWidth: 620, margin: '0 auto 32px',
          }}>
            Temukan rahasia closing tinggi WhatsApp, strategi copywriting produk, dan panduan lengkap optimasi jualan online kamu.
          </p>

          {/* Search Bar */}
          <div style={{
            position: 'relative', maxWidth: 480, margin: '0 auto',
          }}>
            <Search size={18} style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Cari topik, tips WhatsApp, copywriting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                width: '100%', paddingLeft: 46, paddingRight: 16, height: 48,
                borderRadius: 100, background: 'var(--surface)',
                border: '1px solid var(--glass-border)', fontSize: '0.9rem',
                color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </div>
      </section>

      {/* --- FEATURED ARTICLE HERO CARD --- */}
      {!searchQuery && selectedCategory === 'all' && (
        <section style={{ padding: '0 24px 40px', maxWidth: 1140, margin: '0 auto' }}>
          <div
            onClick={() => setActiveArticle(featuredPost)}
            className="glass-card hover-card"
            style={{
              padding: '24px', borderRadius: 24, cursor: 'pointer',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 28, alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(22, 24, 34, 0.9) 0%, rgba(15, 15, 20, 0.9) 100%)',
              border: '1px solid rgba(91, 138, 245, 0.25)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{
              width: '100%', height: 280, borderRadius: 16, overflow: 'hidden',
              position: 'relative', background: 'var(--surface)',
            }}>
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span style={{
                position: 'absolute', top: 14, left: 14,
                padding: '4px 12px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700,
                background: 'rgba(91, 138, 245, 0.9)', color: '#fff', backdropFilter: 'blur(8px)',
              }}>
                ⭐ Artikel Utama
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span className="badge badge-accent" style={{ fontSize: '0.72rem' }}>
                  {featuredPost.categoryLabel}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} /> {featuredPost.readTime}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} /> {featuredPost.date}
                </span>
              </div>

              <h2 style={{
                fontSize: 'clamp(1.25rem, 3vw, 1.65rem)', fontWeight: 800,
                lineHeight: 1.3, marginBottom: 12, color: '#fff',
              }}>
                {featuredPost.title}
              </h2>

              <p style={{
                color: 'var(--text-secondary)', fontSize: '0.92rem',
                lineHeight: 1.6, marginBottom: 20,
              }}>
                {featuredPost.excerpt}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={featuredPost.author.avatar}
                    alt={featuredPost.author.name}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{featuredPost.author.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{featuredPost.author.role}</div>
                  </div>
                </div>

                <span className="btn btn-primary btn-sm" style={{ gap: 6 }}>
                  Baca Selengkapnya <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- CATEGORY TABS --- */}
      <section style={{ padding: '0 24px 32px', maxWidth: 1140, margin: '0 auto' }}>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8,
          borderBottom: '1px solid var(--glass-border)',
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="btn btn-sm"
              style={{
                flexShrink: 0,
                background: selectedCategory === cat.id ? 'var(--accent)' : 'var(--surface)',
                color: selectedCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                border: '1px solid ' + (selectedCategory === cat.id ? 'var(--accent)' : 'var(--glass-border)'),
                borderRadius: 100, fontSize: '0.82rem', padding: '6px 16px',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* --- ARTICLES GRID --- */}
      <section style={{ padding: '0 24px 60px', maxWidth: 1140, margin: '0 auto' }}>
        {filteredPosts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--surface)', borderRadius: 20,
            border: '1px dashed var(--glass-border)',
          }}>
            <BookOpen size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>Artikel Tidak Ditemukan</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              Coba kata kunci lain atau pilih kategori yang berbeda.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {filteredPosts.map(post => (
              <article
                key={post.id}
                onClick={() => setActiveArticle(post)}
                className="glass-card hover-card"
                style={{
                  borderRadius: 20, padding: 20, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--surface)',
                  border: '1px solid var(--glass-border)',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
              >
                <div style={{
                  width: '100%', height: 180, borderRadius: 12, overflow: 'hidden',
                  marginBottom: 16, background: 'var(--bg-secondary)', position: 'relative',
                }}>
                  <img
                    src={post.image}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span style={{
                    position: 'absolute', top: 10, left: 10,
                    padding: '4px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
                    background: 'rgba(15, 15, 20, 0.8)', color: '#fff', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {post.categoryLabel}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {post.date}</span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {post.readTime}</span>
                </div>

                <h3 style={{
                  fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.4,
                  marginBottom: 10, color: '#fff',
                }}>
                  {post.title}
                </h3>

                <p style={{
                  fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5,
                  marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {post.excerpt}
                </p>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 12, borderTop: '1px solid var(--glass-border)', marginTop: 'auto',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {post.author.name}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Baca <ChevronRight size={13} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* --- NEWSLETTER CTA SECTION --- */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1140, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(91, 138, 245, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          border: '1px solid rgba(91, 138, 245, 0.3)',
          borderRadius: 24, padding: '40px 24px', textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', margin: '0 auto 16px',
          }}>
            <Mail size={24} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8, color: '#fff' }}>
            Dapatkan Tips Jualan WhatsApp Setiap Minggu
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: 480, margin: '0 auto 24px' }}>
            Bergabung dengan 10.000+ pebisnis online yang menerima insight eksklusif & pola copywriting gratis langsung di inbox.
          </p>

          <form onSubmit={handleSubscribe} style={{
            display: 'flex', gap: 10, maxWidth: 460, margin: '0 auto', flexWrap: 'wrap',
          }}>
            <input
              type="email"
              placeholder="Masukkan alamat email kamu..."
              value={emailSubscribe}
              onChange={e => setEmailSubscribe(e.target.value)}
              className="form-input"
              style={{ flex: 1, minWidth: 240, height: 44, borderRadius: 10, background: 'var(--bg-primary)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ height: 44, gap: 6 }}>
              Langganan Gratis <Send size={14} />
            </button>
          </form>
        </div>
      </section>

      {/* --- ARTICLE READER MODAL --- */}
      <AnimatePresence>
        {activeArticle && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            padding: '40px 16px', overflowY: 'auto',
          }}>
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              style={{
                width: '100%', maxWidth: 760,
                background: '#161822',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 24, padding: '32px 28px',
                color: '#f1f5f9', position: 'relative',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              }}
            >
              {/* Back & Close header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 6 }}
                >
                  <ArrowLeft size={15} /> Kembali
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleToggleLike(activeArticle.id)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      gap: 6,
                      color: likedArticles[activeArticle.id] ? '#ef4444' : 'var(--text-secondary)',
                    }}
                  >
                    <Heart size={15} fill={likedArticles[activeArticle.id] ? '#ef4444' : 'none'} />
                    {likedArticles[activeArticle.id] ? 'Disimpan' : 'Favorit'}
                  </button>

                  <button
                    onClick={() => handleShareArticle(activeArticle)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: 6 }}
                  >
                    <Share2 size={15} /> Bagikan
                  </button>
                </div>
              </div>

              {/* Category & Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>
                  {activeArticle.categoryLabel}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {activeArticle.date} • {activeArticle.readTime}
                </span>
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800,
                lineHeight: 1.3, marginBottom: 20, color: '#fff',
              }}>
                {activeArticle.title}
              </h1>

              {/* Author Info */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingBottom: 20, marginBottom: 24,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <img
                  src={activeArticle.author.avatar}
                  alt={activeArticle.author.name}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>{activeArticle.author.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{activeArticle.author.role}</div>
                </div>
              </div>

              {/* Featured Image */}
              <div style={{
                width: '100%', height: 320, borderRadius: 16, overflow: 'hidden',
                marginBottom: 28, background: 'var(--surface)',
              }}>
                <img
                  src={activeArticle.image}
                  alt={activeArticle.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Article Content Body */}
              <div
                style={{
                  fontSize: '1rem', lineHeight: 1.8, color: '#cbd5e1',
                  display: 'flex', flexDirection: 'column', gap: 16,
                }}
                dangerouslySetInnerHTML={{ __html: activeArticle.content }}
              />

              {/* Article Footer CTA */}
              <div style={{
                marginTop: 40, paddingTop: 24,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(91, 138, 245, 0.08)',
                borderRadius: 16, padding: 24, textAlign: 'center',
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8, color: '#fff' }}>
                  Siap Bikin Toko Online WhatsApp Kamu Sendiri?
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Gunakan Exora secara gratis hari ini. Bikin katalog produk & terima checkout langsung ke WhatsApp tanpa komisi!
                </p>
                <Link to="/login" className="btn btn-primary" style={{ gap: 6 }}>
                  Coba Exora Gratis Sekarang <ArrowRight size={15} />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FOOTER --- */}
      <footer style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '32px 24px', textAlign: 'center',
        fontSize: '0.85rem', color: 'var(--text-tertiary)',
        background: 'rgba(15, 15, 20, 0.95)',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Store size={18} color="var(--accent)" />
            <span style={{ fontWeight: 700, color: '#fff' }}>Exora Blog</span>
            <span>© {new Date().getFullYear()} Exora Storefront.</span>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Beranda</Link>
            <Link to="/updates" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Updates</Link>
            <Link to="/showcase" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Showcase Toko</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
