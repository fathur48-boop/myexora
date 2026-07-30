import { create } from 'zustand'
import { streamApi, authApi } from './api/adminClient'

interface AuthState {
  user: any
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  init: () => void
  setAuth: (user: any, token: string | null) => void
  loginWithGoogle: (payload: { email: string; name: string; picture?: string; sub?: string; agreedToTerms?: boolean }) => Promise<void>
  updateUser: (updates: Record<string, any>) => void
  logout: () => void
}

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('exora_user') || 'null')
  } catch {
    return null
  }
}

const getStoredToken = () => {
  try {
    return localStorage.getItem('exora_token') || null
  } catch {
    return null
  }
}

const initUser = getStoredUser()
const initToken = getStoredToken()

export const useAuthStore = create<AuthState>((set) => ({
  user: initUser,
  token: initToken,
  isAuthenticated: !!(initUser || initToken),
  isLoading: false,
  init: () => {
    const user = getStoredUser()
    const token = getStoredToken()
    set({ user, token, isAuthenticated: !!(user || token), isLoading: false })
  },
  setAuth: (user, token) => {
    if (user) localStorage.setItem('exora_user', JSON.stringify(user))
    else localStorage.removeItem('exora_user')
    if (token) localStorage.setItem('exora_token', token || '')
    else localStorage.removeItem('exora_token')
    set({ user, token, isAuthenticated: !!(user || token) })
  },
  loginWithGoogle: async (payload) => {
    const res = await authApi.loginWithGoogle({
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub || 'google_' + Date.now(),
      agreedToTerms: payload.agreedToTerms !== false,
    })
    if (!res?.data?.token || !res?.data?.user) {
      throw new Error('Login gagal: respons server tidak valid')
    }
    const user = res.data.user
    const token = res.data.token
    localStorage.setItem('exora_user', JSON.stringify(user))
    localStorage.setItem('exora_token', token)
    set({ user, token, isAuthenticated: true })
  },
  updateUser: (updates) => {
    set((state) => {
      const newUser = state.user ? { ...state.user, ...updates } : null
      if (newUser) localStorage.setItem('exora_user', JSON.stringify(newUser))
      return { user: newUser, isAuthenticated: !!(newUser || state.token) }
    })
  },
  logout: () => {
    localStorage.removeItem('exora_user')
    localStorage.removeItem('exora_token')
    localStorage.removeItem('exora_toko')
    localStorage.removeItem('exora_customer_user')
    localStorage.removeItem('exora_customer_token')
    set({ user: null, token: null, isAuthenticated: false })
  }
}))

interface TokoState {
  toko: any
  isLoading: boolean
  setToko: (toko: any) => void
  load: (token?: string) => Promise<void>
  updateToko: (updates: Record<string, any>) => void
}

export const useTokoStore = create<TokoState>((set) => ({
  toko: JSON.parse(localStorage.getItem('exora_toko') || 'null'),
  isLoading: false,
  setToko: (toko) => {
    if (toko) localStorage.setItem('exora_toko', JSON.stringify(toko))
    else localStorage.removeItem('exora_toko')
    set({ toko })
  },
  load: async () => {
    set({ isLoading: true })
    try {
      const stored = localStorage.getItem('exora_toko')
      if (stored) {
        set({ toko: JSON.parse(stored), isLoading: false })
      } else {
        const mockToko = { id: 'toko-1', nama: 'Toko Saya', slug: 'tokosaya' }
        localStorage.setItem('exora_toko', JSON.stringify(mockToko))
        set({ toko: mockToko, isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
  updateToko: (updates) => {
    set((state) => {
      const newToko = state.toko ? { ...state.toko, ...updates } : null
      if (newToko) localStorage.setItem('exora_toko', JSON.stringify(newToko))
      return { toko: newToko }
    })
  }
}))

interface ProdukState {
  produk: any[]
  isLoading: boolean
  load: (token?: string) => Promise<void>
  add: (p: any) => void
  update: (id: string, updates: Record<string, any>) => void
  remove: (id: string) => void
}

export const useProdukStore = create<ProdukState>((set) => ({
  produk: JSON.parse(localStorage.getItem('exora_produk') || '[]'),
  isLoading: false,
  load: async () => {
    set({ isLoading: true })
    try {
      const stored = localStorage.getItem('exora_produk')
      if (stored) {
        set({ produk: JSON.parse(stored), isLoading: false })
      } else {
        const initialProduk = [
          { id: '1', nama: 'Kaos Oversize Premium', harga: 89000, hargaCoret: 120000, hpp: 45000, kategori: 'Pakaian', stok: 15, aktif: true, foto: '["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500"]' },
          { id: '2', nama: 'Sepatu Sneakers Canvas', harga: 199000, hargaCoret: 250000, hpp: 110000, kategori: 'Sepatu', stok: 8, aktif: true, foto: '["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500"]' }
        ]
        localStorage.setItem('exora_produk', JSON.stringify(initialProduk))
        set({ produk: initialProduk, isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
  add: (p) => {
    set((state) => {
      const newProduk = [p, ...state.produk]
      localStorage.setItem('exora_produk', JSON.stringify(newProduk))
      return { produk: newProduk }
    })
  },
  update: (id, updates) => {
    set((state) => {
      const newProduk = state.produk.map(p => p.id === id ? { ...p, ...updates } : p)
      localStorage.setItem('exora_produk', JSON.stringify(newProduk))
      return { produk: newProduk }
    })
  },
  remove: (id) => {
    set((state) => {
      const newProduk = state.produk.filter(p => p.id !== id)
      localStorage.setItem('exora_produk', JSON.stringify(newProduk))
      return { produk: newProduk }
    })
  }
}))

export { useCustomerStore } from './customerStore'

interface StreamState {
  feed: any[]
  feedLoading: boolean
  activeTag: string | null
  searchQuery: string
  postDetail: any | null
  postDetailLoading: boolean
  dmThreads: any[]
  dmMessages: any[]
  activeThreadId: string | null
  notifs: any[]
  unreadNotifCount: number
  loadFeed: (tokenObj: any, params?: any) => Promise<void>
  setActiveTag: (tag: string | null) => void
  setSearchQuery: (query: string) => void
  loadPostDetail: (tokenObj: any, postId: string) => Promise<void>
  clearPostDetail: () => void
  addReply: (tokenObj: any, data: any) => Promise<void>
  toggleLike: (tokenObj: any, data: any) => Promise<void>
  toggleRepost: (tokenObj: any, data: any) => Promise<void>
  toggleBookmark: (tokenObj: any, data: any) => Promise<void>
  deletePost: (tokenObj: any, postId: string) => Promise<void>
  createPost: (tokenObj: any, data: any) => Promise<void>
  loadDmThreads: (tokenObj: any) => Promise<void>
  openDmThread: (tokenObj: any, data: any) => Promise<string>
  setActiveThreadId: (id: string | null) => void
  loadDmMessages: (tokenObj: any, threadId: string) => Promise<void>
  sendDmMessage: (tokenObj: any, data: any) => Promise<void>
  clearDmThread: () => void
  loadNotifs: (tokenObj: any) => Promise<void>
  markNotifsRead: (tokenObj: any) => Promise<void>
}

export const MOCK_STREAM_POSTS = [
  {
    id: 'mock_stream_1',
    toko: {
      id: 'toko_batik',
      nama: 'Batik Nusantara Official',
      slug: 'batik-nusantara',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      pro: true,
    },
    teks: 'Koleksi Kemeja Batik Solo Premium Katun Primishima Halus edisi terbatas awal bulan ini resmi rilis! Siap kirim ke seluruh Indonesia dengan garansi retur & gratis ongkir. Hubungi admin atau klik toko untuk order! 🇮🇩',
    postType: 'produk_baru',
    foto: [
      'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80'
    ],
    shopLink: { slug: 'batik-nusantara', nama: 'Batik Nusantara' },
    hashtags: ['#ProdukBaru', '#BatikSolo', '#FashionLokal'],
    likesCount: 48,
    repostsCount: 12,
    repliesCount: 5,
    liked: false,
    reposted: false,
    bookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    previewReplies: [
      {
        id: 'rep_1',
        toko: { id: 'toko_buyer_1', nama: 'Toko Kebaya Anggun', slug: 'kebaya-anggun', logo: null, pro: false },
        teks: 'Bisa ambil grosir min 12 pcs kak? Beda harga ga?',
        likesCount: 3,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        liked: false,
        replies: []
      }
    ]
  },
  {
    id: 'mock_stream_2',
    toko: {
      id: 'toko_kopi',
      nama: 'Kopi Nusantara Roastery',
      slug: 'kopi-nusantara',
      logo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80',
      pro: true,
    },
    teks: 'Open order Biji Kopi Arabika Gayo Single Origin Grade 1 Medium Roast 1kg untuk para owner coffee shop & reseller Exora! Stok terbatas 50kg minggu ini. Hubungi via DM untuk katalog harga grosir special! ☕️✨',
    postType: 'supplier_info',
    foto: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80'
    ],
    shopLink: { slug: 'kopi-nusantara', nama: 'Kopi Nusantara Roastery' },
    hashtags: ['#SupplierInfo', '#KopiGayo', '#GrosirKopi'],
    likesCount: 89,
    repostsCount: 24,
    repliesCount: 12,
    liked: true,
    reposted: false,
    bookmarked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    previewReplies: []
  },
  {
    id: 'mock_stream_3',
    toko: {
      id: 'toko_skincare',
      nama: 'GlowUp Skincare ID',
      slug: 'glowup-skincare',
      logo: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80',
      pro: false,
    },
    teks: 'Dicari 15 Reseller & Dropshipper Produk Serum Brightening Centella Asiatica BPOM resmi! Margin hingga 35%, disediakan konten promosi & bahan jualan harian. Klik DM atau hubungi WA toko kami ya sis! 🤝🌱',
    postType: 'cari_reseller',
    foto: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80'
    ],
    shopLink: { slug: 'glowup-skincare', nama: 'GlowUp Skincare' },
    hashtags: ['#CariReseller', '#SkincareBPOM', '#BisnisOnline'],
    likesCount: 112,
    repostsCount: 31,
    repliesCount: 18,
    liked: false,
    reposted: true,
    bookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    previewReplies: []
  },
  {
    id: 'mock_stream_4',
    toko: {
      id: 'toko_sneakers',
      nama: 'Sneakerhead ID',
      slug: 'sneakerhead-id',
      logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80',
      pro: true,
    },
    teks: 'Alhamdulillah 250 pasang Running Shoes Local Brand habis terkirim dalam flash sale hari ini! Terima kasih semua buyer & mitra seller Exora yang sudah order. Pengiriman malam ini via Biteship! 👟📦',
    postType: 'penjualan',
    foto: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80'
    ],
    shopLink: { slug: 'sneakerhead-id', nama: 'Sneakerhead ID' },
    hashtags: ['#Penjualan', '#LocalBrand', '#ExoraStream'],
    likesCount: 156,
    repostsCount: 45,
    repliesCount: 8,
    liked: false,
    reposted: false,
    bookmarked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    previewReplies: []
  }
]

export const MOCK_DM_THREADS = [
  {
    id: 'thread_kopi',
    toko: {
      id: 'toko_kopi',
      nama: 'Kopi Nusantara Roastery',
      slug: 'kopi-nusantara',
      logo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80',
      pro: true
    },
    lastMessage: 'Katalog harga grosir Kopi Gayo 1kg siap dikirim via J&T/Biteship ya kak 🚚',
    unread: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'thread_rina',
    toko: {
      id: 'toko_rina',
      nama: 'Rina Handmade & Craft',
      slug: 'rina-handmade',
      logo: '/rina.png',
      pro: true
    },
    lastMessage: 'Sudah tersetting diskon 10% buat bundling aksesoris kayu ya sis 👍',
    unread: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'thread_buyer',
    toko: {
      id: 'buyer_budi',
      nama: 'Budi Santoso (Pembeli)',
      slug: 'budi-santoso',
      logo: '/budi.png',
      pro: false
    },
    lastMessage: 'Kak pesanan EXR-88492 kemeja batik warna biru ready kirim hari ini?',
    unread: 2,
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  }
]

export const MOCK_DM_MESSAGES: Record<string, any[]> = {
  thread_kopi: [
    { id: 'm1', teks: 'Halo Kak! Salam sesama seller Exora. Tertarik ambil sampel Biji Kopi Gayo Single Origin?', isMine: false, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: 'm2', teks: 'Halo kak! Boleh minta pricelist grosir min 10kg?', isMine: true, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'm3', teks: 'Siap kak! Harga grosir Rp 120.000/kg (min 10kg). Katalog harga grosir Kopi Gayo 1kg siap dikirim via J&T/Biteship ya kak ', isMine: false, createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() }
  ],
  thread_rina: [
    { id: 'm4', teks: 'Sis, mau kolaborasi cross-promo produk di Stream Exora pekan ini?', isMine: false, createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
    { id: 'm5', teks: 'Wah menarik tuh sis! Gimana konsepnya?', isMine: true, createdAt: new Date(Date.now() - 1000 * 60 * 100).toISOString() },
    { id: 'm6', teks: 'Sudah tersetting diskon 10% buat bundling aksesoris kayu ya sis 👍', isMine: false, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() }
  ],
  thread_buyer: [
    { id: 'm7', teks: 'Permisi kak, mau tanya ukuran L Batik Solo LD-nya berapa cm ya?', isMine: false, createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString() },
    { id: 'm8', teks: 'Ukuran L LD 108cm kak, bahan primishima halus adem.', isMine: true, createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString() },
    { id: 'm9', teks: 'Kak pesanan EXR-88492 kemeja batik warna biru ready kirim hari ini?', isMine: false, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
  ]
}

export const MOCK_NOTIFS = [
  {
    id: 'n_order_1',
    type: 'order',
    actor: { nama: 'Budi Santoso', logo: '/budi.png' },
    postExcerpt: 'Pesanan Baru EXR-88492 — Total Rp 189.000',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isRead: false,
  },
  {
    id: 'n_like_1',
    type: 'like',
    actor: { nama: 'Sari Craft & Fashion', logo: '/sari.png' },
    postExcerpt: 'Koleksi Kemeja Batik Solo Premium...',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    isRead: false,
  },
  {
    id: 'n_dm_1',
    type: 'dm',
    actor: { nama: 'Rina Handmade & Craft', logo: '/rina.png' },
    refThreadId: 'thread_rina',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isRead: true,
  },
  {
    id: 'n_reply_1',
    type: 'reply',
    actor: { nama: 'Toko Kebaya Anggun', logo: null },
    postExcerpt: 'Bisa ambil grosir min 12 pcs kak? Beda harga ga?',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    isRead: true,
  }
]

export const useStreamStore = create<StreamState>((set, get) => ({
  feed: MOCK_STREAM_POSTS,
  feedLoading: false,
  activeTag: null,
  searchQuery: '',
  postDetail: null,
  postDetailLoading: false,
  dmThreads: MOCK_DM_THREADS,
  dmMessages: [],
  activeThreadId: null,
  notifs: MOCK_NOTIFS,
  unreadNotifCount: 2,
  loadFeed: async (tokenObj, params = {}) => {
    set({ feedLoading: true })
    try {
      const res = await streamApi.getFeed(tokenObj, { tag: get().activeTag, search: get().searchQuery, ...params })
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        set({ feed: res.data, feedLoading: false })
      } else {
        let filtered = MOCK_STREAM_POSTS
        const tag = params.tag || get().activeTag
        const search = params.search || get().searchQuery
        if (tag) {
          filtered = filtered.filter(p => p.hashtags?.includes(tag) || p.postType === tag)
        }
        if (search) {
          filtered = filtered.filter(p => p.teks.toLowerCase().includes(search.toLowerCase()) || p.toko?.nama.toLowerCase().includes(search.toLowerCase()))
        }
        set({ feed: filtered, feedLoading: false })
      }
    } catch {
      set({ feed: MOCK_STREAM_POSTS, feedLoading: false })
    }
  },
  setActiveTag: (tag) => set({ activeTag: tag }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  loadPostDetail: async (tokenObj, postId) => {
    set({ postDetailLoading: true })
    try {
      const res = await streamApi.getPostDetail(tokenObj, postId)
      if (res && res.success && res.data) {
        set({ postDetail: res.data, postDetailLoading: false })
      } else {
        const found = get().feed.find(p => p.id === postId) || MOCK_STREAM_POSTS.find(p => p.id === postId)
        set({ postDetail: found || null, postDetailLoading: false })
      }
    } catch {
      const found = get().feed.find(p => p.id === postId) || MOCK_STREAM_POSTS.find(p => p.id === postId)
      set({ postDetail: found || null, postDetailLoading: false })
    }
  },
  clearPostDetail: () => set({ postDetail: null }),
  addReply: async (tokenObj, data) => {
    try {
      await streamApi.addReply(tokenObj, data)
    } catch {}
    const newReply = {
      id: 'rep_' + Date.now(),
      postId: data.postId,
      parentReplyId: data.parentReplyId || null,
      toko: { id: 'me', nama: 'Toko Saya', slug: 'toko-saya', logo: null, pro: true },
      teks: data.teks,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      liked: false,
      replies: []
    }
    set((state) => {
      const updatedFeed = state.feed.map(p => {
        if (p.id === data.postId) {
          return {
            ...p,
            repliesCount: (p.repliesCount || 0) + 1,
            previewReplies: [...(p.previewReplies || []), newReply]
          }
        }
        return p
      })
      let updatedDetail = state.postDetail
      if (state.postDetail?.id === data.postId) {
        updatedDetail = {
          ...state.postDetail,
          repliesCount: (state.postDetail.repliesCount || 0) + 1,
          replies: [...(state.postDetail.replies || []), newReply]
        }
      }
      return { feed: updatedFeed, postDetail: updatedDetail }
    })
  },
  toggleLike: async (tokenObj, data) => {
    try {
      await streamApi.toggleLike(tokenObj, data)
    } catch {}
    set((state) => {
      const updatedFeed = state.feed.map(p => {
        if (p.id === data.targetId) {
          const liked = !p.liked
          return {
            ...p,
            liked,
            likesCount: liked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
          }
        }
        return p
      })
      let updatedDetail = state.postDetail
      if (state.postDetail?.id === data.targetId) {
        const liked = !state.postDetail.liked
        updatedDetail = {
          ...state.postDetail,
          liked,
          likesCount: liked ? state.postDetail.likesCount + 1 : Math.max(0, state.postDetail.likesCount - 1)
        }
      }
      return { feed: updatedFeed, postDetail: updatedDetail }
    })
  },
  toggleRepost: async (tokenObj, data) => {
    try {
      await streamApi.toggleRepost(tokenObj, data)
    } catch {}
    set((state) => {
      const updatedFeed = state.feed.map(p => {
        if (p.id === data.postId) {
          const reposted = !p.reposted
          return {
            ...p,
            reposted,
            repostsCount: reposted ? p.repostsCount + 1 : Math.max(0, p.repostsCount - 1)
          }
        }
        return p
      })
      return { feed: updatedFeed }
    })
  },
  toggleBookmark: async (tokenObj, data) => {
    try {
      await streamApi.toggleBookmark(tokenObj, data)
    } catch {}
    set((state) => {
      const updatedFeed = state.feed.map(p => {
        if (p.id === data.postId) {
          return { ...p, bookmarked: !p.bookmarked }
        }
        return p
      })
      return { feed: updatedFeed }
    })
  },
  deletePost: async (tokenObj, postId) => {
    try {
      await streamApi.deletePost(tokenObj, postId)
    } catch {}
    set((state) => ({
      feed: state.feed.filter(p => p.id !== postId),
      postDetail: state.postDetail?.id === postId ? null : state.postDetail
    }))
  },
  createPost: async (tokenObj, data) => {
    let createdFromApi = null
    try {
      const res = await streamApi.createPost(tokenObj, data)
      if (res && res.data) createdFromApi = res.data
    } catch {}
    const newPost = createdFromApi || {
      id: 'post_' + Date.now(),
      toko: {
        id: 'me',
        nama: 'Toko Saya',
        slug: 'toko-saya',
        logo: null,
        pro: true,
      },
      teks: data.teks,
      postType: data.postType || 'produk_baru',
      foto: data.foto || [],
      shopLink: { slug: 'toko-saya', nama: 'Toko Saya' },
      hashtags: data.teks?.match(/#\w+/g) || ['#ExoraStream'],
      likesCount: 0,
      repostsCount: 0,
      repliesCount: 0,
      liked: false,
      reposted: false,
      bookmarked: false,
      createdAt: new Date().toISOString(),
      previewReplies: []
    }
    set((state) => ({
      feed: [newPost, ...state.feed]
    }))
  },
  loadDmThreads: async (tokenObj) => {
    try {
      const res = await streamApi.getDmThreads(tokenObj)
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        set({ dmThreads: res.data })
        return
      }
    } catch {}
    if (get().dmThreads.length === 0) {
      set({ dmThreads: MOCK_DM_THREADS })
    }
  },
  openDmThread: async (tokenObj, data) => {
    try {
      const res = await streamApi.openDmThread(tokenObj, data)
      if (res && res.success && res.threadId) {
        set({ activeThreadId: res.threadId })
        return res.threadId
      }
    } catch {}
    // Fallback local thread
    let existing = get().dmThreads.find(t => t.toko?.id === data.otherTokoId || t.id === data.otherTokoId)
    if (!existing) {
      existing = {
        id: 'thread_' + Date.now(),
        toko: { id: data.otherTokoId || 'other', nama: 'Mitra Seller Exora', slug: 'mitra-exora', logo: null, pro: true },
        lastMessage: 'Percakapan baru dimulai',
        unread: 0,
        updatedAt: new Date().toISOString()
      }
      set((state) => ({ dmThreads: [existing, ...state.dmThreads] }))
    }
    set({ activeThreadId: existing.id })
    return existing.id
  },
  setActiveThreadId: (id) => set({ activeThreadId: id }),
  loadDmMessages: async (tokenObj, threadId) => {
    try {
      const res = await streamApi.getDmMessages(tokenObj, threadId)
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        set({ dmMessages: res.data })
        return
      }
    } catch {}
    const local = MOCK_DM_MESSAGES[threadId] || [
      { id: 'm0', teks: 'Halo! Ada yang bisa kami bantu seputar produk atau kerja sama seller?', isMine: false, createdAt: new Date().toISOString() }
    ]
    set({ dmMessages: local })
  },
  sendDmMessage: async (tokenObj, data) => {
    try {
      await streamApi.sendDmMessage(tokenObj, data)
    } catch {}
    const newMsg = {
      id: 'm_' + Date.now(),
      teks: data.teks,
      isMine: true,
      createdAt: new Date().toISOString()
    }
    set((state) => {
      const updatedMessages = [...state.dmMessages, newMsg]
      const updatedThreads = state.dmThreads.map(t => {
        if (t.id === data.threadId) {
          return { ...t, lastMessage: data.teks, updatedAt: new Date().toISOString(), unread: 0 }
        }
        return t
      })
      MOCK_DM_MESSAGES[data.threadId] = updatedMessages
      return { dmMessages: updatedMessages, dmThreads: updatedThreads }
    })
  },
  clearDmThread: () => set({ activeThreadId: null, dmMessages: [] }),
  loadNotifs: async (tokenObj) => {
    try {
      const res = await streamApi.getNotifications(tokenObj)
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const unread = res.data.filter((n: any) => !n.isRead).length
        set({ notifs: res.data, unreadNotifCount: unread })
        return
      }
    } catch {}
    if (get().notifs.length === 0) {
      set({ notifs: MOCK_NOTIFS, unreadNotifCount: 2 })
    }
  },
  markNotifsRead: async (tokenObj) => {
    try {
      await streamApi.markNotificationsRead(tokenObj)
    } catch {}
    set((state) => ({
      notifs: state.notifs.map(n => ({ ...n, isRead: true })),
      unreadNotifCount: 0,
    }))
  }
}))
