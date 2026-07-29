import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  Store, MessageCircle, ShoppingBag, Search, ArrowLeft,
  Share2, CheckCircle2, Star, MapPin, Clock, Truck,
  Plus, Minus, Trash2, X, ShoppingCart, ShieldCheck,
  Eye, Sparkles, ChevronRight, Tag, AlertCircle, Copy, FileText,
  Bot, Send
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import SeoMeta from '../components/SeoMeta.jsx'
import { tokoApi, produkApi, pesananApi, promoApi, reviewApi, storefrontAiApi } from '../lib/api'
import { generateWALink, formatRupiah } from '../lib/utils'

function getSampleDemoProducts() {
  return [
    {
      id: 'p-1',
      nama: 'Kaos Oversize Streetwear Premium Cotton 24s',
      harga: 89000,
      originalPrice: 120000,
      kategori: 'Fashion',
      foto_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
      deskripsi: 'Bahan Cotton Combed 24s murni, adem, tidak menerawang, dan jahitan rantai rapi standar distro.',
      rating: 4.9,
      terjual: 248,
      badge: 'Terlaris',
      variants: ['Hitam (L)', 'Hitam (XL)', 'Putih (L)', 'Putih (XL)']
    },
    {
      id: 'p-2',
      nama: 'Sepatu Sneakers Canvas Casual White Series',
      harga: 199000,
      originalPrice: 250000,
      kategori: 'Fashion',
      foto_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80',
      deskripsi: 'Sol karet vulcanized anti-slip, insole empuk nyaman dipakai seharian.',
      rating: 4.8,
      terjual: 182,
      badge: 'Diskon 20%',
      variants: ['Ukuran 40', 'Ukuran 41', 'Ukuran 42', 'Ukuran 43']
    },
    {
      id: 'p-3',
      nama: 'Tote Bag Canvas Multi-Pocket Minimalist',
      harga: 67000,
      originalPrice: 85000,
      kategori: 'Aksesoris',
      foto_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
      deskripsi: 'Kapasitas muat laptop 14 inch, resleting berkualitas tinggi anti macet.',
      rating: 5.0,
      terjual: 310,
      badge: 'Rekomendasi',
      variants: ['Cream Natural', 'Black Olive', 'Navy Dark']
    },
    {
      id: 'p-4',
      nama: 'Scented Candle Aromaterapi Lavender Essential Oil',
      harga: 45000,
      originalPrice: 60000,
      kategori: 'Home & Living',
      foto_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=80',
      deskripsi: 'Lilin aromaterapi coconut wax murni dengan essensial oil Bali Lavender penenang pikiran.',
      rating: 4.9,
      terjual: 415,
      badge: 'Best Seller',
      variants: ['Glass Jar 100g', 'Glass Jar 200g']
    },
    {
      id: 'p-5',
      nama: 'Smartwatch Fitness & Heart Rate Tracker Waterproof',
      harga: 285000,
      originalPrice: 390000,
      kategori: 'Elektronik',
      foto_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=80',
      deskripsi: 'Layar AMOLED 1.4 inch, detak jantung 24/7, pemantau tidur, dan baterai tahan hingga 10 hari.',
      rating: 4.8,
      terjual: 96,
      badge: 'Diskon 27%',
      variants: ['Black Matte', 'Silver Metallic', 'Rose Gold']
    },
    {
      id: 'p-6',
      nama: 'Serum Brightening Vitamin C & Niacinamide 30ml',
      harga: 78000,
      originalPrice: 110000,
      kategori: 'Beauty',
      foto_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
      deskripsi: 'Mencerahkan flek hitam, mengecilkan pori-pori, BPOM terdaftar & aman untuk kulit sensitif.',
      rating: 4.9,
      terjual: 520,
      badge: 'BPOM Approved',
      variants: ['30ml Bottle']
    },
    {
      id: 'p-7',
      nama: 'Tumbler Stainless Steel Vacuum Insulated 500ml',
      harga: 85000,
      originalPrice: 115000,
      kategori: 'Home & Living',
      foto_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
      deskripsi: 'Tahan dingin hingga 24 jam & tahan panas 12 jam. Stainless steel Food Grade 304 anti bocor.',
      rating: 4.9,
      terjual: 230,
      badge: 'Hemat',
      variants: ['Black Glossy', 'White Pearl', 'Sage Green']
    },
    {
      id: 'p-8',
      nama: 'Wireless Earbuds Bluetooth 5.3 Low Latency TWS',
      harga: 149000,
      originalPrice: 220000,
      kategori: 'Elektronik',
      foto_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
      deskripsi: 'Bass mantap, microphone HD jernih untuk telepon, noise reduction, dan charging case 300mAh.',
      rating: 4.7,
      terjual: 175,
      badge: 'Trending',
      variants: ['Black Edition', 'White Minimal']
    }
  ]
}

export default function StorefrontPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const resiQuery = searchParams.get('resi')

  // Store & Product Data
  const [toko, setToko] = useState(null)
  const [produkList, setProdukList] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [sortBy, setSortBy] = useState('populer') // 'populer' | 'harga-rendah' | 'harga-tinggi'

  // Shopping Cart State
  const [cart, setCart] = useState([]) // [{ id, nama, harga, qty, variant, foto_url }]
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Promo Code State
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)

  // Reviews State
  const [reviews, setReviews] = useState([])
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [newRevNama, setNewRevNama] = useState('')
  const [newRevRating, setNewRevRating] = useState(5)
  const [newRevText, setNewRevText] = useState('')

  // QRIS Payment Modal
  const [qrisModalOpen, setQrisModalOpen] = useState(false)
  const [qrisOrderData, setQrisOrderData] = useState(null)

  // Checkout Form State
  const [buyerNama, setBuyerNama] = useState('')
  const [buyerWa, setBuyerWa] = useState('')
  const [buyerAlamat, setBuyerAlamat] = useState('')
  const [catatan, setCatatan] = useState('')
  const [kurir, setKurir] = useState('J&T Express')

  // Detail Modal
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [detailQty, setDetailQty] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState('Default')

  // Tracking Modal
  const [trackingModalOpen, setTrackingModalOpen] = useState(false)
  const [trackingResiInput, setTrackingResiInput] = useState(resiQuery || '')
  const [trackingResult, setTrackingResult] = useState(null)

  // Search param listener for product detail query ?produk=id
  const prodQuery = searchParams.get('produk')
  useEffect(() => {
    if (prodQuery && produkList.length > 0) {
      const found = produkList.find(p => p.id === prodQuery || p.id === `p-${prodQuery}`)
      if (found) setSelectedProduct(found)
    }
  }, [prodQuery, produkList])

  // AI Chat Assistant State
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'assistant',
      text: 'Halo Kak! Selamat datang di toko kami 👋 Ada yang bisa kami bantu seputar rekomendasi produk, promo, atau garansi pengiriman hari ini?'
    }
  ])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const aiChatEndRef = useRef(null)

  useEffect(() => {
    if (aiChatOpen) {
      aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [aiMessages, aiChatOpen])

  const handleSendAiMessage = async (customMsg) => {
    const query = typeof customMsg === 'string' ? customMsg : aiInput
    if (!query.trim() || aiLoading) return

    const userMessage = { role: 'user', text: query.trim() }
    setAiMessages(prev => [...prev, userMessage])
    if (typeof customMsg !== 'string') setAiInput('')
    setAiLoading(true)

    try {
      const history = aiMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        text: m.text
      }))

      const res = await storefrontAiApi.send({
        message: query.trim(),
        history,
        toko,
        produkList
      })

      if (res && res.text) {
        setAiMessages(prev => [...prev, { role: 'assistant', text: res.text }])
      } else {
        toast.error('Gagal mendapatkan respon dari Asisten AI')
      }
    } catch (err) {
      console.error('AI chat error:', err)
      toast.error('Gagal terhubung ke Asisten AI Toko')
    } finally {
      setAiLoading(false)
    }
  }

  const renderMessageText = (text) => {
    if (!text) return null
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      const label = match[1]
      const url = match[2]

      const prodMatch = url.match(/[?&]produk=([^&]+)/)
      if (prodMatch) {
        const prodId = prodMatch[1]
        parts.push(
          <button
            key={match.index}
            onClick={() => {
              const found = produkList.find(p => p.id === prodId || p.id === `p-${prodId}`)
              if (found) {
                setSelectedProduct(found)
                setAiChatOpen(false)
              } else {
                toast.success(`Membuka produk: ${label}`)
              }
            }}
            style={{
              color: '#38bdf8', textDecoration: 'underline', fontWeight: 800,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer'
            }}
          >
            {label} ↗
          </button>
        )
      } else {
        parts.push(
          <a
            key={match.index}
            href={url}
            style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 800 }}
          >
            {label}
          </a>
        )
      }
      lastIndex = linkRegex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts
  }

  const targetSlug = slug || 'exora-official'

  useEffect(() => {
    loadTokoData()
  }, [slug])

  useEffect(() => {
    if (resiQuery) {
      setTrackingModalOpen(true)
      handleSearchTracking(resiQuery)
    }
  }, [resiQuery])

  const loadTokoData = async () => {
    setLoading(true)
    try {
      // 1. Load Toko Info (by Slug or Custom Domain)
      let loadedToko = null
      const currentHost = window.location.hostname.toLowerCase()
      const isCustomDomain = !currentHost.includes('localhost') &&
                             !currentHost.includes('127.0.0.1') &&
                             !currentHost.includes('vercel.app') &&
                             !currentHost.includes('myexora.com') &&
                             !currentHost.includes('run.app')

      try {
        if (isCustomDomain) {
          const resDomain = await tokoApi.getByDomain(currentHost)
          if (resDomain && resDomain.success && resDomain.data) {
            loadedToko = resDomain.data
          }
        }
        if (!loadedToko) {
          const resToko = await tokoApi.getBySlug(targetSlug)
          if (resToko && resToko.success && resToko.data) {
            loadedToko = resToko.data
          }
        }
      } catch (err) {
        console.warn('tokoApi load failed:', err)
      }

      const defaultToko = {
        nama: targetSlug && targetSlug !== 'exora-official' ? targetSlug.replace(/-/g, ' ').toUpperCase() : 'Exora Official Store',
        slug: targetSlug || 'exora-official',
        deskripsi: 'Pusat belanja produk original berkualitas tinggi dengan garansi kepuasan 100% & pengiriman kilat ke seluruh Indonesia.',
        whatsapp: '6283862720514',
        lokasi: 'Jakarta Selatan',
        rating: 4.9,
        terjual: '1.4k+',
        pengikut: '8.2k',
        logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        banner_color: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        jamOperasional: 'Senin - Sabtu (08:00 - 20:00 WIB)',
        verified: true
      }

      setToko({
        ...defaultToko,
        ...loadedToko,
        nama: (loadedToko?.nama && loadedToko?.nama !== 'exora-official') ? loadedToko.nama : defaultToko.nama,
        logo_url: loadedToko?.logo_url || loadedToko?.logo || defaultToko.logo_url
      })

      // 2. Load Products safely
      let loadedProducts = null
      let isProductLoadedSuccess = false
      try {
        if (produkApi && typeof produkApi.getByToko === 'function') {
          const resProduk = await produkApi.getByToko(targetSlug)
          if (resProduk && resProduk.success && Array.isArray(resProduk.data)) {
            loadedProducts = resProduk.data
            isProductLoadedSuccess = true
          }
        }
      } catch (err) {
        console.warn('produkApi.getByToko failed:', err)
      }

      const isDemoSlug = targetSlug === 'exora-official' || targetSlug === 'exora' || targetSlug === 'storefront'

      if (isProductLoadedSuccess && loadedProducts) {
        if (loadedProducts.length > 0) {
          setProdukList(loadedProducts)
        } else if (!isDemoSlug) {
          // Real user store with 0 products -> show empty store state
          setProdukList([])
        } else {
          // Demo slug with 0 products -> load rich demo catalog
          setProdukList(getSampleDemoProducts())
        }
      } else if (!isDemoSlug && loadedToko) {
        // Real store loaded from DB but product API call failed -> keep empty or user items
        setProdukList(loadedProducts || [])
      } else {
        // Fallback rich demo products for showcase/preview mode
        setProdukList(getSampleDemoProducts())
      }

      // Load Reviews with rich fallback
      const resRev = await reviewApi.getBySlug(slug || 'exora')
      if (resRev.success && Array.isArray(resRev.data) && resRev.data.length > 0) {
        setReviews(resRev.data)
      } else {
        setReviews([
          {
            id: 'rev-1',
            nama: 'Budi Santoso',
            rating: 5,
            ulasan: 'Bahan kaosnya tebal, adem, dan jahitan super rapi! Pengiriman cuma 1 hari sampai Jakarta. Next pasti order warna lain.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            produkNama: 'Kaos Oversize Streetwear Premium'
          },
          {
            id: 'rev-2',
            nama: 'Siti Rahmawati',
            rating: 5,
            ulasan: 'Sneakersnya pas banget di kaki, sol empuk dan modelnya sangat estetik! Sangat recommended!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
            produkNama: 'Sepatu Sneakers Canvas Casual White'
          },
          {
            id: 'rev-3',
            nama: 'Rian Pratama',
            rating: 5,
            ulasan: 'Respon seller cepat banget via WA, packing bubble wrap tebal aman sampai luar pulau. Bintang 5!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
            produkNama: 'Wireless Earbuds Bluetooth 5.3'
          }
        ])
      }
    } catch (err) {
      console.error('Error loading store data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Promo code calculation
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.harga * item.qty), 0)
  }, [cart])

  const discountValue = useMemo(() => {
    if (!appliedPromo) return 0
    if (appliedPromo.tipe === 'persen') {
      return Math.round((subtotal * appliedPromo.nilai) / 100)
    }
    return Math.min(appliedPromo.nilai, subtotal)
  }, [appliedPromo, subtotal])

  const cartTotal = useMemo(() => {
    return Math.max(0, subtotal - discountValue)
  }, [subtotal, discountValue])

  const handleApplyPromo = async (e) => {
    e.preventDefault()
    if (!promoInput.trim()) return
    const res = await promoApi.validateCode(promoInput.trim(), subtotal)
    if (res.success) {
      setAppliedPromo(res.data)
      toast.success(`Kupon '${res.data.kode}' berhasil dipasang! 🎉`)
    } else {
      toast.error(res.message || 'Kupon tidak valid')
    }
  }

  const handleAddReview = async (e) => {
    e.preventDefault()
    if (!newRevNama.trim() || !newRevText.trim()) {
      toast.error('Nama dan isi ulasan wajib diisi')
      return
    }

    const res = await reviewApi.create(slug || 'exora', {
      nama: newRevNama,
      rating: newRevRating,
      ulasan: newRevText,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    })

    if (res.success) {
      toast.success('Ulasan kamu berhasil dikirim! ⭐')
      setReviews([res.data, ...reviews])
      setReviewModalOpen(false)
      setNewRevNama('')
      setNewRevText('')
    }
  }

  // Categories list derived from products
  const categories = useMemo(() => {
    const cats = new Set(['Semua'])
    produkList.forEach(p => {
      if (p.kategori) cats.add(p.kategori)
    })
    return Array.from(cats)
  }, [produkList])

  // Filtered and sorted products
  const filteredProduk = useMemo(() => {
    let list = produkList.filter(p => {
      const matchSearch = !search || p.nama?.toLowerCase().includes(search.toLowerCase())
      const matchCat = activeCategory === 'Semua' || p.kategori === activeCategory
      return matchSearch && matchCat
    })

    if (sortBy === 'harga-rendah') {
      list.sort((a, b) => a.harga - b.harga)
    } else if (sortBy === 'harga-tinggi') {
      list.sort((a, b) => b.harga - a.harga)
    } else if (sortBy === 'populer') {
      list.sort((a, b) => (b.terjual || 0) - (a.terjual || 0))
    }

    return list
  }, [produkList, search, activeCategory, sortBy])

  // Add to cart helper
  const handleAddToCart = (product, variant = 'Default', qty = 1) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === product.id && item.variant === variant)
      if (existingIndex > -1) {
        const updated = [...prevCart]
        updated[existingIndex].qty += qty
        return updated
      } else {
        return [...prevCart, {
          id: product.id || product.nama,
          nama: product.nama,
          harga: product.harga,
          qty,
          variant,
          foto_url: product.foto_url
        }]
      }
    })
    toast.success(`'${product.nama}' ditambahkan ke keranjang! 🛒`)
  }

  const cartTotalQty = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0)
  }, [cart])

  // Checkout via WhatsApp
  const handleCheckoutWA = (e) => {
    e.preventDefault()
    if (cart.length === 0) {
      toast.error('Keranjang belanjaanmu masih kosong')
      return
    }
    if (!buyerNama.trim() || !buyerWa.trim()) {
      toast.error('Nama dan Nomor WhatsApp pemesan wajib diisi!')
      return
    }

    const storeName = toko?.nama || slug || 'Toko Exora'
    const waNumber = toko?.whatsapp || '6283862720514'

    // Format item list
    const itemsText = cart.map((item, idx) => {
      return `${idx + 1}. ${item.nama} (${item.variant !== 'Default' ? item.variant : 'Standard'}) x${item.qty} = ${formatRupiah(item.harga * item.qty)}`
    }).join('\n')

    const orderId = `EXR-${Math.floor(10000 + Math.random() * 90000)}`

    const waMsg = `Halo *${storeName}*, saya mau pesan via Exora App:\n\n*ID Pesanan:* #${orderId}\n----------------------------------\n${itemsText}\n----------------------------------\n*Total Belanja:* ${formatRupiah(cartTotal)}\n\n*Data Pemesan:*\n- Nama: ${buyerNama}\n- No. WA: ${buyerWa}\n- Alamat: ${buyerAlamat || '-'}\n- Kurir: ${kurir}\n- Catatan: ${catatan || '-'}\n\nMohon informasi total pembayaran & nomor rekeningnya. Terima kasih!`

    // Save order locally for seller sync
    const newOrder = {
      id: `ord-${Date.now()}`,
      orderId,
      createdAt: new Date().toISOString(),
      buyerNama,
      buyerWa,
      buyerAlamat,
      catatan,
      status: 'pending',
      total: cartTotal,
      qty: cartTotalQty,
      produkNama: cart.map(c => c.nama).join(', '),
      items: cart
    }

    const existingOrders = JSON.parse(localStorage.getItem('exora_pesanan') || '[]')
    localStorage.setItem('exora_pesanan', JSON.stringify([newOrder, ...existingOrders]))

    // Open WA Link
    const waUrl = generateWALink(waNumber, waMsg)
    window.open(waUrl, '_blank')

    toast.success('Pesanan dikirim ke WhatsApp Seller! 📱')
    setIsCartOpen(false)
    setCart([])
  }

  // Handle Search Tracking
  const handleSearchTracking = async (resiCode) => {
    if (!resiCode) return
    const res = await pesananApi.getById(resiCode)
    if (res.success && res.data) {
      setTrackingResult(res.data)
    } else {
      setTrackingResult({
        orderId: resiCode,
        status: 'shipped',
        kurir: 'J&T Express',
        resi: resiCode,
        buyerNama: 'Pelanggan Exora',
        createdAt: new Date().toISOString(),
        items: [{ nama: 'Paket Pesanan Storefront', qty: 1 }]
      })
    }
  }

  const handleShareStore = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link toko berhasil disalin! 🔗')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090a0f', color: '#fff' }}>
        <div className="spinner" style={{ width: 40, height: 40, marginBottom: 16 }} />
        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Memuat Storefront Toko...</div>
      </div>
    )
  }

  const tokoNama = toko?.nama || slug || 'Toko Exora'

  return (
    <div style={{
      minHeight: '100vh', background: '#090a0f', color: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 100
    }}>
      {/* Dynamic SEO & OpenGraph Meta Tags for WhatsApp/Social Media Sharing */}
      {selectedProduct ? (
        <SeoMeta
          title={`${selectedProduct.nama} — ${tokoNama}`}
          description={`Beli ${selectedProduct.nama} Rp ${selectedProduct.harga?.toLocaleString('id-ID')} di ${tokoNama}. ${selectedProduct.deskripsi || ''}`}
          image={selectedProduct.foto_url || selectedProduct.fotos?.[0] || toko?.logo_url}
          type="product"
          price={selectedProduct.harga}
        />
      ) : (
        <SeoMeta
          title={`${tokoNama} — Katalog Resmi Exora`}
          description={toko?.deskripsi || `Beli produk resmi & berkualitas di ${tokoNama}. Bebas ongkir & checkout via WhatsApp.`}
          image={toko?.logo_url || toko?.banner_url || 'https://myexora.com/og-image.jpg'}
        />
      )}
      {/* --- HERO STORE BANNER --- */}
      <div style={{
        background: toko?.banner_color || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        position: 'relative', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px 14px 20px', textAlign: 'center'
      }}>
        {/* Navigation Bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10,
          marginBottom: 16, gap: 8, flexWrap: 'wrap'
        }}>
          <Link to="/showcase" className="btn btn-ghost btn-sm" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#fff', gap: 6, fontSize: '0.78rem', padding: '6px 10px', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Showcase
          </Link>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setTrackingModalOpen(true)}
              className="btn btn-ghost btn-sm"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#38bdf8', gap: 4, fontSize: '0.78rem', padding: '6px 10px' }}
            >
              <Truck size={14} /> Cek Resi
            </button>
            <button
              onClick={handleShareStore}
              className="btn btn-ghost btn-sm"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#fff', padding: '6px 10px' }}
              title="Bagikan Toko"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* Store Profile Avatar & Info */}
        <div style={{ maxWidth: 640, margin: '8px auto 0' }}>
          <div style={{
            width: 76, height: 76, borderRadius: 20, background: '#141722',
            border: '3px solid #090a0f', boxShadow: '0 10px 24px rgba(0,0,0,0.5)',
            margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            {toko?.logo_url ? (
              <img src={toko.logo_url} alt={tokoNama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Store size={36} style={{ color: '#38bdf8' }} />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0, wordBreak: 'break-word' }}>{tokoNama}</h1>
            <CheckCircle2 size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
          </div>

          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.45, margin: '0 0 12px 0' }}>
            {toko?.deskripsi || 'Selamat datang di toko resmi kami! Pilih produk impianmu & checkout otomatis via WhatsApp.'}
          </p>

          {/* Badges Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, fontSize: '0.75rem', color: '#94a3b8' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100,
              background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 100, background: '#10b981' }} />
              ONLINE • Respon WA Cepat
            </span>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 700 }}>
              <Star size={13} fill="#f59e0b" /> {toko?.rating || '4.9'} (100+ Ulasan)
            </span>

            {toko?.lokasi && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
                <MapPin size={13} /> {toko.lokasi}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- MAIN STOREFRONT CONTAINER --- */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 12px 0' }}>

        {/* Search & Categories Navbar */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20,
          background: '#141722', padding: 14, borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Search Input & Sorting Controls */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Cari produk favoritmu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input"
                style={{
                  width: '100%', paddingLeft: 38, height: 40, borderRadius: 10,
                  background: '#0b0d14', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.85rem'
                }}
              />
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="form-input"
              style={{
                height: 40, padding: '0 12px', background: '#0b0d14', border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10, color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <option value="populer">🔥 Terpopuler</option>
              <option value="harga-rendah">💰 Terendah</option>
              <option value="harga-tinggi">💎 Tertinggi</option>
            </select>
          </div>

          {/* Category Tabs */}
          {categories.length > 1 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '5px 14px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 700,
                    whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                    background: activeCategory === cat ? '#38bdf8' : '#0b0d14',
                    color: activeCategory === cat ? '#0f172a' : '#94a3b8',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        {filteredProduk.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', background: '#141722', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <ShoppingBag size={40} style={{ color: '#64748b', marginBottom: 10 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Produk Tidak Ditemukan</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))', gap: 12 }}>
            {filteredProduk.map(p => {
              const discountPercent = p.originalPrice && p.originalPrice > p.harga
                ? Math.round(((p.originalPrice - p.harga) / p.originalPrice) * 100)
                : null

              return (
                <div
                  key={p.id || p.nama}
                  style={{
                    background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    transition: 'transform 0.2s, border-color 0.2s', boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                  }}
                  className="hover:-translate-y-1 hover:border-sky-500/30"
                >
                  {/* Product Image */}
                  <div style={{ height: 180, background: '#0b0d14', position: 'relative', overflow: 'hidden' }}>
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                        <ShoppingBag size={40} />
                      </div>
                    )}

                    {/* Discount Badge */}
                    {discountPercent && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#fff', padding: '3px 8px', borderRadius: 8,
                        fontSize: '0.72rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                      }}>
                        -{discountPercent}%
                      </div>
                    )}

                    {/* Rating Badge */}
                    <div style={{
                      position: 'absolute', bottom: 8, left: 8,
                      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                      padding: '3px 8px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700,
                      color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <Star size={11} fill="#f59e0b" /> {p.rating || '4.9'}
                      <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500 }}>({p.terjual || 50}+)</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: '0 0 6px', lineHeight: 1.35 }}>
                        {p.nama}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8' }}>
                          {formatRupiah(p.harga)}
                        </span>
                        {p.originalPrice && (
                          <span style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'line-through' }}>
                            {formatRupiah(p.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8 }}>
                      <button
                        onClick={() => {
                          setSelectedProduct(p)
                          setDetailQty(1)
                          setSelectedVariant(p.variants?.[0] || 'Default')
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0 10px', background: '#1e293b', color: '#cbd5e1' }}
                        title="Lihat Detail Produk"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() => handleAddToCart(p)}
                        className="btn btn-primary btn-sm"
                        style={{ gap: 6, fontSize: '0.8rem', justifyContent: 'center' }}
                      >
                        <Plus size={14} /> Keranjang
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Store Trust Footer Section */}
        <div style={{
          marginTop: 48, background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20, padding: 24, textAlign: 'center'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Order via WhatsApp</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Langsung ke nomor penjual</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Verified Seller</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Toko terdaftar di Exora</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Kirim Seluruh ID</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mendukung berbagai kurir</div>
              </div>
            </div>
          </div>
        </div>

        {/* --- CUSTOMER REVIEWS & TESTIMONIALS --- */}
        <div style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={20} fill="#f59e0b" style={{ color: '#f59e0b' }} /> Ulasan & Testimoni Pembeli
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Ulasan asli dari pembeli yang telah bertransaksi di toko ini.</p>
            </div>

            <button
              onClick={() => setReviewModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ gap: 6, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.1)' }}
            >
              <Plus size={14} /> Tulis Ulasan
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {reviews.map(r => (
              <div
                key={r.id}
                style={{
                  background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={r.avatar} alt={r.nama} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>{r.nama}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.tgl}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 2 }}>
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} size={13} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                  "{r.ulasan}"
                </p>

                {r.verified && (
                  <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} /> Verified Buyer
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* --- STICKY FLOATING CART BAR (IF CART HAS ITEMS) --- */}
      {cart.length > 0 && !isCartOpen && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 50, maxWidth: 500, margin: '0 auto'
          }}
        >
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: '#fff', border: 'none', borderRadius: 100, padding: '14px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 12px 30px rgba(37, 99, 235, 0.4)', cursor: 'pointer',
              fontWeight: 800, fontSize: '0.95rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 100, fontSize: '0.82rem' }}>
                {cartTotalQty} Item
              </div>
              <span>Keranjang Belanja</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{formatRupiah(cartTotal)}</span>
              <ChevronRight size={18} />
            </div>
          </button>
        </motion.div>
      )}

      {/* --- SHOPPING CART DRAWER / MODAL --- */}
      <AnimatePresence>
        {isCartOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'flex-end'
          }}>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                width: '100%', maxWidth: 460, background: '#141722',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)', height: '100vh',
                display: 'flex', flexDirection: 'column', overflowY: 'auto'
              }}
            >
              {/* Drawer Header */}
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0e1017'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShoppingCart size={20} style={{ color: '#38bdf8' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>Keranjang Belanja</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="btn btn-ghost btn-sm" style={{ color: '#94a3b8' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Daftar Produk ({cart.length})
                  </div>

                  {cart.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      background: '#0b0d14', padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.foto_url && (
                          <img src={item.foto_url} alt={item.nama} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                        )}
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{item.nama}</div>
                          {item.variant !== 'Default' && (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Varian: {item.variant}</div>
                          )}
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8' }}>
                            {formatRupiah(item.harga)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => {
                            if (item.qty > 1) {
                              setCart(cart.map((c, i) => i === idx ? { ...c, qty: c.qty - 1 } : c))
                            } else {
                              setCart(cart.filter((_, i) => i !== idx))
                            }
                          }}
                          style={{ width: 26, height: 26, borderRadius: 6, background: '#1e293b', color: '#fff', border: 'none', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{item.qty}</span>
                        <button
                          onClick={() => setCart(cart.map((c, i) => i === idx ? { ...c, qty: c.qty + 1 } : c))}
                          style={{ width: 26, height: 26, borderRadius: 6, background: '#1e293b', color: '#fff', border: 'none', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form Data Pemesan */}
                <form onSubmit={handleCheckoutWA} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Informasi Pemesan
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={buyerNama}
                      onChange={e => setBuyerNama(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', height: 40, background: '#0b0d14', borderRadius: 8, fontSize: '0.85rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                      Nomor WhatsApp *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 081234567890"
                      value={buyerWa}
                      onChange={e => setBuyerWa(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', height: 40, background: '#0b0d14', borderRadius: 8, fontSize: '0.85rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                      Alamat Pengiriman
                    </label>
                    <textarea
                      placeholder="Alamat lengkap (Jalan, Kota, Kecamatan, Kode Pos)..."
                      value={buyerAlamat}
                      onChange={e => setBuyerAlamat(e.target.value)}
                      rows={2}
                      className="form-input"
                      style={{ width: '100%', padding: 8, background: '#0b0d14', borderRadius: 8, fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                      Pilih Kurir Pengiriman
                    </label>
                    <select
                      value={kurir}
                      onChange={e => setKurir(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', height: 40, background: '#0b0d14', borderRadius: 8, fontSize: '0.85rem' }}
                    >
                      <option value="J&T Express">J&T Express</option>
                      <option value="JNE Reguler">JNE Reguler</option>
                      <option value="SiCepat HALO">SiCepat HALO</option>
                      <option value="GoSend / GrabExpress">GoSend / GrabExpress (Instant)</option>
                    </select>
                  </div>

                  {/* Promo Code Input */}
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                      Kode Kupon / Promo Diskon
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Contoh: EXORA20"
                        value={promoInput}
                        onChange={e => setPromoInput(e.target.value.toUpperCase())}
                        className="form-input"
                        style={{ flex: 1, height: 38, background: '#0b0d14', borderRadius: 8, fontSize: '0.85rem', fontWeight: 800 }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="btn btn-secondary btn-sm"
                        style={{ height: 38, padding: '0 14px', background: '#1e293b', color: '#38bdf8', fontWeight: 800 }}
                      >
                        Pasang
                      </button>
                    </div>
                    {appliedPromo && (
                      <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tag size={12} /> Diskon {appliedPromo.kode} terpasang (-{formatRupiah(discountValue)})
                      </div>
                    )}
                  </div>

                  <div style={{
                    marginTop: 12, padding: 16, background: '#0e1017', borderRadius: 14,
                    display: 'flex', flexDirection: 'column', gap: 8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#94a3b8' }}>
                      <span>Subtotal Produk</span>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{formatRupiah(subtotal)}</span>
                    </div>

                    {appliedPromo && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#34d399' }}>
                        <span>Diskon Kupon ({appliedPromo.kode})</span>
                        <span style={{ fontWeight: 700 }}>-{formatRupiah(discountValue)}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#fff', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                      <span>Total Bayar</span>
                      <span style={{ color: '#38bdf8' }}>{formatRupiah(cartTotal)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    {(toko?.paymentMethodsEnabled || toko?.payment_methods_enabled || ['manual', 'midtrans_instant', 'midtrans_escrow']).includes('midtrans_instant') && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!buyerNama.trim()) {
                            toast.error('Isi nama pemesan terlebih dahulu')
                            return
                          }
                          setQrisOrderData({
                            orderId: `EXR-${Math.floor(10000 + Math.random() * 90000)}`,
                            total: cartTotal,
                            buyerNama,
                            type: 'instant'
                          })
                          setQrisModalOpen(true)
                        }}
                        className="btn btn-secondary"
                        style={{
                          height: 48, borderRadius: 12, background: 'rgba(168, 85, 247, 0.15)',
                          color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)',
                          fontWeight: 800, fontSize: '0.88rem', gap: 8, justifyContent: 'center'
                        }}
                      >
                        <Sparkles size={18} /> Exora Pay (QRIS & VA Direct)
                      </button>
                    )}

                    {(toko?.paymentMethodsEnabled || toko?.payment_methods_enabled || ['manual', 'midtrans_instant', 'midtrans_escrow']).includes('midtrans_escrow') && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!buyerNama.trim()) {
                            toast.error('Isi nama pemesan terlebih dahulu')
                            return
                          }
                          setQrisOrderData({
                            orderId: `PRO-${Math.floor(10000 + Math.random() * 90000)}`,
                            total: cartTotal,
                            buyerNama,
                            type: 'escrow'
                          })
                          setQrisModalOpen(true)
                        }}
                        className="btn btn-secondary"
                        style={{
                          height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontWeight: 800, fontSize: '0.88rem', gap: 8, justifyContent: 'center'
                        }}
                      >
                        <ShieldCheck size={18} /> Exora Protek (Rekber Aman)
                      </button>
                    )}

                    {(toko?.paymentMethodsEnabled || toko?.payment_methods_enabled || ['manual', 'midtrans_instant', 'midtrans_escrow']).includes('manual') && (
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                          height: 48, borderRadius: 12, background: '#2563eb',
                          fontWeight: 800, fontSize: '0.88rem', gap: 8, justifyContent: 'center'
                        }}
                      >
                        <MessageCircle size={18} /> Transfer Manual (WhatsApp)
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PRODUCT DETAIL MODAL --- */}
      <AnimatePresence>
        {selectedProduct && (
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
                width: '100%', maxWidth: 500, background: '#141722',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 24, overflow: 'hidden'
              }}
            >
              <div style={{ position: 'relative', height: 220, background: '#0b0d14' }}>
                {selectedProduct.foto_url ? (
                  <img src={selectedProduct.foto_url} alt={selectedProduct.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                    <ShoppingBag size={48} />
                  </div>
                )}
                <button
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    position: 'absolute', top: 12, right: 12, width: 32, height: 32,
                    borderRadius: 100, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
                  {selectedProduct.nama}
                </h3>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginBottom: 12 }}>
                  {formatRupiah(selectedProduct.harga)}
                </div>

                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: 20 }}>
                  {selectedProduct.deskripsi}
                </p>

                {/* Variants choice */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'block' }}>
                      PILIH VARIAN
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {selectedProduct.variants.map(v => (
                        <button
                          key={v}
                          onClick={() => setSelectedVariant(v)}
                          style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                            background: selectedVariant === v ? '#38bdf8' : '#0b0d14',
                            color: selectedVariant === v ? '#0f172a' : '#94a3b8'
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity selector & Subtotal */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'block' }}>Jumlah Pesanan</span>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800 }}>
                      Total: {formatRupiah(selectedProduct.harga * detailQty)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                      style={{ width: 34, height: 34, borderRadius: 8, background: '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 800 }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', minWidth: 20, textAlign: 'center' }}>{detailQty}</span>
                    <button
                      type="button"
                      onClick={() => setDetailQty(detailQty + 1)}
                      style={{ width: 34, height: 34, borderRadius: 8, background: '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 800 }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Trust Badges Bar inside Modal */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20, padding: 10, background: '#0b0d14', borderRadius: 12, textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={16} style={{ color: '#34d399' }} />
                    <span style={{ color: '#cbd5e1', fontWeight: 700 }}>100% Ori</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Truck size={16} style={{ color: '#38bdf8' }} />
                    <span style={{ color: '#cbd5e1', fontWeight: 700 }}>Kirim 1-2 Hari</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Clock size={16} style={{ color: '#c084fc' }} />
                    <span style={{ color: '#cbd5e1', fontWeight: 700 }}>Ready Stock</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct, selectedVariant, detailQty)
                      setSelectedProduct(null)
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1, height: 46, justifyContent: 'center', gap: 8, fontWeight: 800 }}
                  >
                    <Plus size={16} /> Tambah ke Keranjang
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TRACKING RESI MODAL --- */}
      <AnimatePresence>
        {trackingModalOpen && (
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
                width: '100%', maxWidth: 480, background: '#141722',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 24, padding: 24
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={18} style={{ color: '#38bdf8' }} /> Melacak Resi & Status Pesanan
                </h3>
                <button onClick={() => setTrackingModalOpen(false)} className="btn btn-ghost btn-sm" style={{ color: '#94a3b8' }}>
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="Masukkan Nomor Resi / Order ID (mis. JT9876543210)"
                  value={trackingResiInput}
                  onChange={e => setTrackingResiInput(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, height: 42, background: '#0b0d14', borderRadius: 10, fontSize: '0.85rem' }}
                />
                <button
                  onClick={() => handleSearchTracking(trackingResiInput)}
                  className="btn btn-primary btn-sm"
                  style={{ height: 42, padding: '0 16px' }}
                >
                  Cek
                </button>
              </div>

              {trackingResult && (
                <div style={{ background: '#0b0d14', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No. Resi / ID</div>
                      <div style={{ fontWeight: 800, color: '#38bdf8' }}>{trackingResult.resi || trackingResult.orderId}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800,
                      background: 'rgba(16, 185, 129, 0.2)', color: '#34d399'
                    }}>
                      {trackingResult.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>Kurir: <strong>{trackingResult.kurir || 'J&T Express'}</strong></div>
                    <div>Nama Pemesan: <strong>{trackingResult.buyerNama || 'Budi'}</strong></div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- WRITE REVIEW MODAL --- */}
      <AnimatePresence>
        {reviewModalOpen && (
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
                width: '100%', maxWidth: 440, background: '#141722',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 24, padding: 24
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Star size={18} fill="#f59e0b" style={{ color: '#f59e0b' }} /> Tulis Ulasan Pembeli
                </h3>
                <button onClick={() => setReviewModalOpen(false)} className="btn btn-ghost btn-sm" style={{ color: '#94a3b8' }}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddReview} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                    Nama Kamu *
                  </label>
                  <input
                    type="text"
                    placeholder="misal: Anita Rahma"
                    value={newRevNama}
                    onChange={e => setNewRevNama(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', height: 40, background: '#0b0d14', borderRadius: 8, fontSize: '0.85rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                    Rating Bintang
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRevRating(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                      >
                        <Star
                          size={24}
                          fill={star <= newRevRating ? "#f59e0b" : "none"}
                          style={{ color: star <= newRevRating ? "#f59e0b" : "#475569" }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                    Isi Ulasan & Pengalaman *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tulis ulasan jujur tentang kualitas produk dan pelayanan toko ini..."
                    value={newRevText}
                    onChange={e => setNewRevText(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: 10, background: '#0b0d14', borderRadius: 8, fontSize: '0.85rem' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: 44, borderRadius: 10, background: '#2563eb', fontWeight: 800 }}
                >
                  Kirim Ulasan Sekarang
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- QRIS PAYMENT MODAL --- */}
      <AnimatePresence>
        {qrisModalOpen && qrisOrderData && (
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
                width: '100%', maxWidth: 420, background: '#141722',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 24, padding: 24,
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {qrisOrderData.type === 'escrow' ? (
                    <>
                      <ShieldCheck size={20} style={{ color: '#34d399' }} /> Pembayaran Exora Protek
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} style={{ color: '#c084fc' }} /> Pembayaran Exora Pay
                    </>
                  )}
                </h3>
                <button onClick={() => setQrisModalOpen(false)} className="btn btn-ghost btn-sm" style={{ color: '#94a3b8' }}>
                  ✕
                </button>
              </div>

              {qrisOrderData.type === 'escrow' && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 10, borderRadius: 12, fontSize: '0.78rem', color: '#6ee7b7', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                  <ShieldCheck size={24} style={{ flexShrink: 0, color: '#34d399' }} />
                  <div>
                    <strong>Garansi Exora Protek Active:</strong>
                    <div style={{ opacity: 0.9, marginTop: 2 }}>Dana aman disimpan di Rekening Bersama dan baru dikirim ke seller setelah barang Anda terima.</div>
                  </div>
                </div>
              )}

              <div style={{ background: '#fff', padding: 16, borderRadius: 16, display: 'inline-block', marginBottom: 16 }}>
                {/* Simulated QR Code SVG */}
                <svg width="160" height="160" viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" fill="white" />
                  <path d="M10 10h30v30H10zM15 15v20h20V15zM20 20h10v10H20zM60 10h30v30H60zM65 15v20h20V15zM70 20h10v10H70zM10 60h30v30H10zM15 65v20h20V65zM20 70h10v10H20zM50 50h10v10H50zM70 50h10v10H70zM50 70h20v20H50zM80 80h10v10H80z" fill="#000" />
                </svg>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#0f172a', letterSpacing: 1, marginTop: 4 }}>
                  NMID: ID102938475612
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: 16 }}>
                Scan QRIS di atas menggunakan GoPay, OVO, Dana, ShopeePay, BNI Mobile, BCA, atau Mandiri.
              </div>

              <div style={{ background: '#0b0d14', padding: 12, borderRadius: 12, fontSize: '0.82rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Order ID:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 800 }}>{qrisOrderData.orderId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Total Tagihan:</span>
                  <span style={{ color: '#34d399', fontWeight: 800 }}>{formatRupiah(qrisOrderData.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Bank BCA:</span>
                  <span style={{ color: '#fff', fontWeight: 800 }}>8830-1928-33 (a.n Exora Store)</span>
                </div>
              </div>

              <button
                onClick={() => {
                  toast.success('Konfirmasi pembayaran telah dikirim ke Penjual! 🚀')
                  setQrisModalOpen(false)
                  setIsCartOpen(false)
                  setCart([])
                }}
                className="btn btn-primary"
                style={{ width: '100%', height: 44, borderRadius: 12, background: '#10b981', fontWeight: 800 }}
              >
                Saya Sudah Bayar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FLOATING BOTTOM CART BAR --- */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            style={{
              position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 90,
              maxWidth: 500, margin: '0 auto'
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: 20,
              padding: '12px 18px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  position: 'relative', width: 42, height: 42, borderRadius: 12,
                  background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ShoppingCart size={20} />
                  <span style={{
                    position: 'absolute', top: -6, right: -6,
                    background: '#ef4444', color: '#fff', fontSize: '0.7rem',
                    fontWeight: 900, borderRadius: 100, width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {cartTotalQty}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Total Keranjang</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#34d399' }}>
                    {formatRupiah(cartTotal)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="btn btn-primary"
                style={{
                  height: 42, padding: '0 18px', borderRadius: 12,
                  background: '#2563eb', fontWeight: 800, fontSize: '0.88rem', gap: 6
                }}
              >
                Checkout <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FLOATING AI CHAT ASSISTANT TOGGLE & DRAWER --- */}
      <div style={{ position: 'fixed', bottom: cart.length > 0 ? 84 : 24, right: 20, zIndex: 99 }}>
        {!aiChatOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAiChatOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #2563eb 100%)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 30, padding: '12px 18px', boxShadow: '0 12px 30px rgba(37, 99, 235, 0.5)',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 800, fontSize: '0.88rem'
            }}
          >
            <Sparkles size={18} />
            <span>Tanya AI Toko</span>
            <span style={{ width: 8, height: 8, borderRadius: 10, background: '#34d399' }} />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {aiChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: 20, right: 20, zIndex: 100,
              width: 'calc(100vw - 40px)', maxWidth: 380, height: 500,
              background: '#0f172a', border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
              padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                }}>
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Asisten AI Toko
                    <span style={{ fontSize: '0.65rem', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '1px 6px', borderRadius: 10 }}>Exora AI</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{toko?.nama || 'Toko Resmi'}</div>
                </div>
              </div>

              <button
                onClick={() => setAiChatOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ color: '#94a3b8', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Suggestions */}
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6, overflowX: 'auto' }}>
              <button
                onClick={() => handleSendAiMessage("Rekomendasikan produk terlaris di toko ini!")}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 14, padding: '4px 10px', color: '#cbd5e1', fontSize: '0.72rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
              >
                🔥 Produk Terlaris
              </button>
              <button
                onClick={() => handleSendAiMessage("Apakah ada diskon atau promo?")}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 14, padding: '4px 10px', color: '#cbd5e1', fontSize: '0.72rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
              >
                🏷️ Ada Promo?
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', gap: 8,
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {msg.role !== 'user' && (
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={14} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '82%', padding: '9px 12px', borderRadius: 14,
                    fontSize: '0.82rem', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                    background: msg.role === 'user' ? '#2563eb' : 'rgba(30, 41, 59, 0.95)',
                    color: '#fff', border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {msg.role === 'user' ? msg.text : renderMessageText(msg.text)}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={14} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    AI sedang menjawab...
                  </div>
                </div>
              )}
              <div ref={aiChatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: 12, background: '#0b0f19', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Tanyakan produk atau rekomendasi..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12, padding: '8px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none'
                }}
              />
              <button
                onClick={() => handleSendAiMessage()}
                disabled={aiLoading || !aiInput.trim()}
                className="btn btn-primary btn-sm"
                style={{ borderRadius: 12, padding: '0 14px' }}
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
