import React, { useState, useEffect, useRef } from 'react'
import {
  Search, Heart, MessageCircle, Image as ImageIcon, X, Send, Bookmark,
  Repeat2, Bell, ChevronLeft, ChevronRight, Hash, Maximize2, Mail, Store, Lock, Loader, ChevronDown, ChevronUp,
  Trash2, ZoomIn,
} from 'lucide-react'
import DashboardLayout from '../components/seller/DashboardLayout'
import StreamImageUpload from './StreamImageUpload.jsx'
import { useRealtimeReplies } from '../hooks/useRealtimeReplies'
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications'
import { useAuthStore, useTokoStore, useStreamStore } from '../lib/store'
import { getStorefrontUrl, getInitials, getTierLevel } from '../lib/utils'
import { tokoApi } from '../lib/api/adminClient'
import { KATEGORI_LIST } from '../lib/categories'
import { useTheme } from '../lib/useTheme'
import toast from 'react-hot-toast'
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion'

const PJS = "'Plus Jakarta Sans', sans-serif"

// ================================================
// COLOR CONSTANTS
// ================================================
const NAVY = '#0C447C'
const BLUE = '#378ADD'

// ================================================
// SHARED DESKTOP-AWARE CONTAINER STYLES
// ================================================
function StreamStyles() {
  return (
    <style>{`
      .stream-container {
        max-width: 560px;
        margin: 0 auto;
      }
      @media (min-width: 1024px) {
        .stream-container {
          max-width: 720px;
        }
      }
      @media (min-width: 1440px) {
        .stream-container {
          max-width: 780px;
        }
      }
    `}</style>
  )
}

// ================================================
// CLOUDINARY HELPER
// ================================================
function cloudinaryMedium(url) {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', '/upload/q_60,w_800/')
}

function cloudinaryThumb(url) {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', '/upload/q_60,w_120,h_120,c_fill/')
}

const POST_TYPES = [
  { value: 'produk_baru', label: 'Produk baru', emoji: '🔥', hashtag: '#ProdukBaru', public: true },
  { value: 'cari_reseller', label: 'Cari reseller', emoji: '🤝', hashtag: '#CariReseller', public: false },
  { value: 'supplier_info', label: 'Supplier info', emoji: '📦', hashtag: '#SupplierInfo', public: false },
  { value: 'penjualan', label: 'Penjualan', emoji: '📈', hashtag: '#Penjualan', public: true },
  { value: 'cari_partner_live', label: 'Partner live', emoji: '🎥', hashtag: '#PartnerLive', public: false },
  { value: 'tips_jualan', label: 'Tips jualan', emoji: '💡', hashtag: '#TipsJualan', public: true },
]

// ================================================
// THEME TOKENS ENHANCED
// ================================================
const THEME_TOKENS = {
  light: {
    borderCard: '#111111',
    borderCardSoft: '#d1d5db',
    cardShadow: '0 2px 8px rgba(0,0,0,0.08)',
    hoverShadow: '0 12px 32px rgba(0,0,0,0.12)',
    bubbleBorderMine: '#111111',
    bubbleBorderOther: '#d1d5db',
  },
  dark: {
    borderCard: '#ffffff',
    borderCardSoft: 'rgba(255,255,255,0.25)',
    cardShadow: '0 2px 8px rgba(0,0,0,0.4)',
    hoverShadow: '0 12px 32px rgba(0,0,0,0.6)',
    bubbleBorderMine: '#ffffff',
    bubbleBorderOther: 'rgba(255,255,255,0.25)',
  },
}

// ================================================
// DELETE CONFIRM MODAL
// ================================================
function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360,
          background: 'var(--bg-secondary)',
          border: '3px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl)',
          padding: '28px 24px 24px',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-full)',
          background: 'rgba(239,68,68,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Trash2 size={22} color="var(--danger, #ef4444)" />
        </div>

        <h3 style={{ fontFamily: PJS, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Hapus post ini?
        </h3>
        <p style={{ fontFamily: PJS, fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: '0 0 24px', lineHeight: 1.6 }}>
          Post beserta semua komentar, like, dan repost-nya akan dihapus permanen.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-lg)',
              background: 'var(--surface)', border: '1px solid var(--glass-border)',
              fontFamily: PJS, fontSize: '0.84rem', fontWeight: 700,
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Batal
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-lg)',
              background: 'var(--danger, #ef4444)', border: 'none',
              fontFamily: PJS, fontSize: '0.84rem', fontWeight: 700,
              color: '#fff', cursor: 'pointer',
            }}
          >
            Hapus
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ================================================
// SKELETON LOADING
// ================================================
function SkeletonPost() {
  return (
    <div style={{
      border: '3px solid var(--glass-border)',
      borderRadius: '16px',
      padding: '14px 8px',
      marginBottom: '8px',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: 120, background: 'var(--surface)', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 12, width: 80, background: 'var(--surface)', borderRadius: 4, marginBottom: 10 }} />
          <div style={{ height: 12, background: 'var(--surface)', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 12, background: 'var(--surface)', borderRadius: 4, marginBottom: 8, width: '80%' }} />
          <div style={{ height: 200, background: 'var(--surface)', borderRadius: 8, marginTop: 10 }} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[60, 60, 60, 60].map((w, i) => (
              <div key={i} style={{ height: 14, width: w, background: 'var(--surface)', borderRadius: 4 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ================================================
// INLINE REPLY BOX
// ================================================
function InlineReplyBox({ target, onCancel, onSubmit }) {
  const [teks, setTeks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const taRef = useRef(null)

  useEffect(() => {
    taRef.current?.focus()
  }, [])

  const handleSubmit = async () => {
    if (!teks.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(teks.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        marginTop: 6, marginBottom: 10, padding: '10px 12px',
        background: 'var(--surface)', border: '2px solid var(--accent)',
        borderRadius: 'var(--radius-lg)',
      }}>
        {target?.parentTokoNama && (
          <p style={{ fontFamily: PJS, fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
            Membalas <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{target.parentTokoNama}</span>
          </p>
        )}
        <textarea
          ref={taRef}
          value={teks}
          onChange={e => setTeks(e.target.value)}
          placeholder="Tulis balasan..."
          rows={2}
          maxLength={500}
          onKeyDown={e => {
            if (e.key === 'Escape') onCancel()
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
          }}
          style={{
            width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)',
            fontSize: '0.83rem', lineHeight: 1.6, resize: 'none', outline: 'none', fontFamily: PJS,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontFamily: PJS, fontSize: '0.65rem', color: 'var(--text-tertiary)', marginRight: 'auto' }}>
            {teks.length}/500
          </span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              border: '2px solid var(--glass-border)', background: 'transparent',
              color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.76rem',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Batal
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!teks.trim() || submitting}
            style={{
              padding: '6px 16px', borderRadius: 'var(--radius-full)', border: 'none',
              background: teks.trim() && !submitting ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              color: teks.trim() && !submitting ? '#fff' : 'var(--text-tertiary)',
              fontFamily: PJS, fontSize: '0.76rem', fontWeight: 700,
              cursor: teks.trim() && !submitting ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Mengirim...' : 'Balas'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ================================================
// ROOT
// ================================================
export default function StreamPage() {
  const { user, token } = useAuthStore()
  const { toko, load: loadToko } = useTokoStore()
  const tokenObj = token

  const hasAccess = true

  const {
    feed, feedLoading, activeTag, searchQuery,
    postDetail, postDetailLoading,
    dmThreads, dmMessages, activeThreadId,
    notifs, unreadNotifCount,
    loadFeed, setActiveTag, setSearchQuery,
    loadPostDetail, clearPostDetail, addReply,
    toggleLike, toggleRepost, toggleBookmark,
    deletePost,
    loadDmThreads, openDmThread, setActiveThreadId, loadDmMessages, sendDmMessage, clearDmThread,
    loadNotifs, markNotifsRead,
  } = useStreamStore()

  const [view, setView] = useState('feed')
  const [searchMode, setSearchMode] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [composing, setComposing] = useState(false)
  const [replyTarget, setReplyTarget] = useState(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [expandedPosts, setExpandedPosts] = useState({})

  const {
    permission,
    requestPermission,
    triggerPushNotification,
    simulateIncomingOrder,
    unreadCount: realtimeUnread,
    markRead: realtimeMarkRead,
  } = useRealtimeNotifications(toko?.id)
  useRealtimeReplies(view === 'post-detail' ? postDetail?.id : null)

  const simulateIncomingDm = () => {
    triggerPushNotification({
      title: '✉️ Pesan Baru dari Rina Handmade',
      body: 'Sis, diskon 10% bundling aksesoris kayu sudah aktif ya! Boleh dicek 👍',
      type: 'dm',
      onClick: () => {
        openThread('thread_rina')
      }
    })
  }

  useEffect(() => {
    loadFeed(tokenObj, {})
    loadNotifs(tokenObj)
    if (!toko) loadToko(tokenObj)
  }, [])

  // Scroll progress
  useEffect(() => {
    const fn = () => {
      const scrollY = window.scrollY
      const scrollTotal = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollTotal > 0 ? (scrollY / scrollTotal) * 100 : 0
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const handleTag = (tag) => {
    setActiveTag(activeTag === tag ? null : tag)
    setSearchMode(false)
    setSearchInput('')
    loadFeed(tokenObj, { tag: activeTag === tag ? null : tag })
  }

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput)
    loadFeed(tokenObj, { search: searchInput })
  }

  const openPostDetail = async (postId) => {
    setView('post-detail')
    await loadPostDetail(tokenObj, postId)
  }

  const backToFeed = () => {
    setView('feed')
    clearPostDetail()
  }

  const openDm = async (otherTokoId) => {
    try {
      const threadId = await openDmThread(tokenObj, { otherTokoId })
      await loadDmMessages(tokenObj, threadId)
      setView('dm-thread')
      setNotifOpen(false)
    } catch (err) {
      toast.error(err.message || 'Gagal membuka percakapan')
    }
  }

  const openDmList = async () => {
    setView('dm-list')
    await loadDmThreads(tokenObj)
  }

  const openThread = async (threadId) => {
    setActiveThreadId(threadId)
    await loadDmMessages(tokenObj, threadId)
    setView('dm-thread')
  }

  const openNotif = async () => {
    setNotifOpen(v => !v)
    realtimeMarkRead()
    await loadNotifs(tokenObj)
    markNotifsRead(tokenObj)
  }

  const handleLike = (targetType, targetId) => {
    toggleLike(tokenObj, { targetType, targetId }).catch(err => toast.error(err.message))
  }

  const handleRepost = (postId) => {
    toggleRepost(tokenObj, { postId }).catch(err => toast.error(err.message))
  }

  const handleBookmark = (postId) => {
    toggleBookmark(tokenObj, { postId }).catch(err => toast.error(err.message))
  }

  const handleReply = (postId, parentReplyId, parentTokoNama) => {
    setReplyTarget(prev => {
      if (prev && prev.postId === postId && prev.parentReplyId === parentReplyId) return null
      return { postId, parentReplyId, parentTokoNama }
    })
  }

  const cancelReply = () => setReplyTarget(null)

  const handleCompose = () => {
    setComposing(true)
  }

  const handleDeletePost = (postId) => setDeleteTarget(postId)

  const confirmDelete = async () => {
    const postId = deleteTarget
    setDeleteTarget(null)
    try {
      await deletePost(tokenObj, postId)
      toast.success('Post berhasil dihapus')
      if (view === 'post-detail') setView('feed')
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus post')
    }
  }

  const handleSubmitReply = async (teks) => {
    try {
      await addReply(tokenObj, {
        postId: replyTarget.postId,
        parentReplyId: replyTarget.parentReplyId,
        teks,
      })
      setReplyTarget(null)
      toast.success('Balasan terkirim')
    } catch (err) {
      toast.error(err.message || 'Gagal membalas')
    }
  }

  const toggleExpandPost = (postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  // ── DM thread view ──
  if (view === 'dm-thread' && activeThreadId) {
    const thread = dmThreads.find(t => t.id === activeThreadId)
    return (
      <DashboardLayout>
        <DmThreadView
          thread={thread}
          messages={dmMessages}
          myTokoId={toko?.id}
          onBack={() => { setView('dm-list'); clearDmThread() }}
          onSend={(teks) => sendDmMessage(tokenObj, { threadId: activeThreadId, teks }).catch(err => toast.error(err.message))}
        />
      </DashboardLayout>
    )
  }

  // DM list view
  if (view === 'dm-list') {
    return (
      <DashboardLayout>
        <DmListView threads={dmThreads} onBack={backToFeed} onOpen={openThread} />
      </DashboardLayout>
    )
  }

  // ── Post detail view ──
  if (view === 'post-detail') {
    return (
      <DashboardLayout>
        <PostDetailView
          post={postDetail}
          loading={postDetailLoading}
          myTokoId={toko?.id}
          hasAccess={hasAccess}
          onBack={backToFeed}
          onLike={handleLike}
          onRepost={handleRepost}
          onBookmark={handleBookmark}
          onReply={handleReply}
          onDm={openDm}
          onTag={handleTag}
          onDelete={handleDeletePost}
          isExpanded={expandedPosts[postDetail?.id] || false}
          onToggleExpand={() => toggleExpandPost(postDetail?.id)}
          replyTarget={replyTarget}
          onCancelReply={cancelReply}
          onSubmitReply={handleSubmitReply}
        />
        {deleteTarget && (
          <DeleteConfirmModal
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </DashboardLayout>
    )
  }

  // ── Feed view (default) ──
  return (
    <DashboardLayout>
      <StreamStyles />
      <style>{`
        @media (min-width: 1024px) {
          .stream-sheet-overlay {
            padding-bottom: 40px;
          }
          .stream-sheet-panel {
            border-radius: var(--radius-2xl) !important;
          }
        }
      `}</style>

      <div className="stream-container">
        {/* Scroll Progress Bar */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '3px',
          background: 'var(--accent-gradient)',
          width: `${scrollProgress}%`,
          zIndex: 101,
          transition: 'width 0.1s ease-out',
          boxShadow: '0 0 10px var(--accent-glow, rgba(91,138,245,0.5))',
        }} />

        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'var(--bg-secondary)',
          backdropFilter: 'blur(16px)',
          borderBottom: '3px solid var(--glass-border)',
          marginBottom: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 52, gap: 10, padding: '0 4px' }}>
            {searchMode ? (
              <>
                <IconBtn onClick={() => { setSearchMode(false); setSearchInput('') }}><ChevronLeft size={20} /></IconBtn>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    autoFocus
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                    placeholder="Cari post, seller, #hashtag..."
                    style={{
                      width: '100%', background: 'var(--surface)', border: '2px solid var(--glass-border)',
                      borderRadius: 'var(--radius-lg)', padding: '8px 12px 8px 32px',
                      color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none',
                      fontFamily: PJS, boxSizing: 'border-box',
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <h1 style={{ flex: 1, fontFamily: PJS, fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Stream</h1>
                <IconBtn onClick={() => setSearchMode(true)}><Search size={15} /></IconBtn>
                <IconBtn onClick={openDmList}><Mail size={15} /></IconBtn>
                <div style={{ position: 'relative' }}>
                  <IconBtn onClick={openNotif} badge={unreadNotifCount + realtimeUnread}><Bell size={15} /></IconBtn>
                  {notifOpen && (
                    <NotifDropdown
                      notifs={notifs}
                      onClose={() => setNotifOpen(false)}
                      onOpenDm={(threadId) => { setNotifOpen(false); openThread(threadId) }}
                      onOpenPost={(postId) => { setNotifOpen(false); openPostDetail(postId) }}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {activeTag && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 8px 4px' }}
          >
            <Hash size={13} color="var(--accent)" />
            <span style={{ fontFamily: PJS, fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>{activeTag.replace('#', '')}</span>
            <button onClick={() => handleTag(activeTag)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={13} /></button>
          </motion.div>
        )}

        <PushNotificationBanner
          permission={permission}
          onRequestPermission={requestPermission}
          onSimulateOrder={simulateIncomingOrder}
          onSimulateDm={simulateIncomingDm}
        />

        <div style={{ paddingBottom: 100 }}>
          {feedLoading && (
            <div>
              {Array(3).fill(0).map((_, i) => <SkeletonPost key={i} />)}
            </div>
          )}
          {!feedLoading && feed.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center', padding: 40 }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 56, height: 56, borderRadius: '14px',
                  background: 'var(--accent-gradient-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', color: 'var(--accent)',
                  border: '2px solid var(--glass-border)',
                }}
              >
                <Store size={24} />
              </motion.div>
              <p style={{ color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.85rem', margin: 0 }}>
                Belum ada post di Stream.
              </p>
            </motion.div>
          )}
          {feed.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              myTokoId={toko?.id}
              hasAccess={hasAccess}
              onExpand={() => openPostDetail(post.id)}
              onLike={() => handleLike('post', post.id)}
              onRepost={() => handleRepost(post.id)}
              onBookmark={() => handleBookmark(post.id)}
              onReply={() => handleReply(post.id, null, post.toko?.nama)}
              onReplyToComment={(replyId, replyNama) => handleReply(post.id, replyId, replyNama)}
              onDm={() => openDm(post.toko?.id)}
              onTag={handleTag}
              onDelete={() => handleDeletePost(post.id)}
              isExpanded={expandedPosts[post.id] || false}
              onToggleExpand={() => toggleExpandPost(post.id)}
              replyTarget={replyTarget}
              onCancelReply={cancelReply}
              onSubmitReply={handleSubmitReply}
            />
          ))}
        </div>

        <motion.button
          onClick={handleCompose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed', bottom: 28, right: 28, width: 52, height: 52, borderRadius: 'var(--radius-full)',
            background: 'var(--accent-gradient)',
            border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px var(--accent-glow, rgba(91,138,245,0.4))',
            zIndex: 30,
          }}
        >
          <span style={{ color: '#fff', fontSize: 24, lineHeight: 1, marginTop: -2 }}>+</span>
        </motion.button>

        {composing && (
          <ComposeSheet
            tokenObj={tokenObj}
            feed={feed}
            plan={user?.plan || 'free'}
            onClose={() => setComposing(false)}
            onSubmit={async (data) => {
              try {
                await useStreamStore.getState().createPost(tokenObj, data)
                setComposing(false)
                toast.success('Post berhasil dibuat')
              } catch (err) {
                toast.error(err.message || 'Gagal membuat post')
              }
            }}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// ================================================
// POST CARD
// ================================================
function PostCard({ post, index, myTokoId, hasAccess, onExpand, onLike, onRepost, onBookmark, onReply, onReplyToComment, onDm, onTag, onDelete, isExpanded, onToggleExpand, replyTarget, onCancelReply, onSubmitReply }) {
  const t = post.toko
  const isMine = myTokoId != null && t?.id != null && String(t.id) === String(myTokoId)
  const previewReplies = post.previewReplies?.length
    ? post.previewReplies
    : (post.replies || []).slice(0, 2)
  const [commentsOpen, setCommentsOpen] = useState(false)

  const isReplyingToPost = !!(replyTarget && replyTarget.postId === post.id && !replyTarget.parentReplyId)

  useEffect(() => {
    if (isReplyingToPost) setCommentsOpen(true)
  }, [isReplyingToPost])

  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (isInView) controls.start('visible')
  }, [controls, isInView])

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      whileHover={{ y: -4 }}
      className="showcase-card"
      style={{
        border: '3px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '14px 8px 0',
        marginBottom: '8px',
        background: 'var(--bg-secondary)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <SellerAvatar toko={t} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <TokoNameLink toko={t} fontSize="0.875rem" />
            {t?.pro && <ProBadge />}
            <span style={{ fontFamily: PJS, fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
              {timeAgo(post.createdAt)}
            </span>
            {isMine && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                title="Hapus post"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', display: 'flex', padding: 4,
                  borderRadius: 'var(--radius-md)', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger, #ef4444)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <Trash2 size={14} />
              </motion.button>
            )}
          </div>
          <PostTypeBadge type={post.postType} />
          <PostText text={post.teks} onTag={onTag} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
          <PostImages images={post.foto} />
          {post.shopLink && <ShopLinkCard link={post.shopLink} />}
          <HashtagPills tags={post.hashtags} onTag={onTag} />
          <PostActions
            likesCount={post.likesCount} repostsCount={post.repostsCount} repliesCount={countReplies(previewReplies)}
            liked={post.liked} reposted={post.reposted} bookmarked={post.bookmarked}
            commentsOpen={commentsOpen}
            onLike={onLike} onRepost={onRepost} onBookmark={onBookmark} onReply={onReply}
            onToggleComments={() => setCommentsOpen(v => !v)}
            onDm={isMine ? null : onDm}
          />
        </div>
      </div>

      {commentsOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ paddingLeft: 52, paddingBottom: 4, overflow: 'hidden' }}
        >
          {previewReplies.length === 0 && !isReplyingToPost && (
            <p style={{ fontFamily: PJS, fontSize: '0.75rem', color: 'var(--text-tertiary)', padding: '8px 0' }}>
              Belum ada komentar.
            </p>
          )}

          {isReplyingToPost ? (
            <InlineReplyBox target={replyTarget} onCancel={onCancelReply} onSubmit={onSubmitReply} />
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReply}
              style={{
                display: 'block', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: PJS, fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600,
                padding: '4px 0 10px',
              }}
            >
              Tulis komentar
            </motion.button>
          )}

          {previewReplies.map(r => (
            <FeedReplyItem
              key={r.id}
              reply={r}
              postId={post.id}
              myTokoId={myTokoId}
              onReplyToComment={onReplyToComment}
              onDm={onDm}
              replyTarget={replyTarget}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
            />
          ))}
          {post.repliesCount > countReplies(previewReplies) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExpand}
              style={{
                display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                padding: '6px 0 10px', cursor: 'pointer',
                fontFamily: PJS, fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600,
              }}
            >
              Lihat {post.repliesCount - countReplies(previewReplies)} balasan lainnya →
            </motion.button>
          )}
          {post.repliesCount === 0 && <div style={{ height: 6 }} />}
        </motion.div>
      )}

      {!commentsOpen && <div style={{ height: 6 }} />}
    </motion.div>
  )
}

function FeedReplyItem({ reply, postId, myTokoId, depth = 0, onReplyToComment, onDm, replyTarget, onCancelReply, onSubmitReply }) {
  const t = reply.toko
  const hasChildren = (reply.replies || []).length > 0
  const isReplyingToThis = !!(replyTarget && replyTarget.parentReplyId === reply.id)

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', gap: 10, paddingTop: 8, paddingBottom: 4, marginLeft: depth > 0 ? 28 : 0 }}
      >
        <SellerAvatar toko={t} size={depth === 0 ? 28 : 24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <TokoNameLink toko={t} fontSize="0.78rem" />
            {t?.pro && <ProBadge small />}
            <span style={{ fontFamily: PJS, fontSize: '0.65rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{timeAgo(reply.createdAt)}</span>
          </div>
          <p style={{ fontFamily: PJS, fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{reply.teks}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onReplyToComment(reply.id, t?.nama)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: PJS, fontSize: '0.7rem', color: 'var(--accent)',
              fontWeight: 600, padding: '3px 0', marginTop: 2,
            }}
          >
            Balas
          </motion.button>

          {isReplyingToThis && (
            <InlineReplyBox target={replyTarget} onCancel={onCancelReply} onSubmit={onSubmitReply} />
          )}
        </div>
      </motion.div>
      {hasChildren && reply.replies.map(child => (
        <FeedReplyItem
          key={child.id}
          reply={child}
          postId={postId}
          myTokoId={myTokoId}
          depth={depth + 1}
          onReplyToComment={onReplyToComment}
          onDm={onDm}
          replyTarget={replyTarget}
          onCancelReply={onCancelReply}
          onSubmitReply={onSubmitReply}
        />
      ))}
    </div>
  )
}

// ================================================
// POST DETAIL VIEW
// ================================================
function PostDetailView({ post, loading, myTokoId, hasAccess, onBack, onLike, onRepost, onBookmark, onReply, onDm, onTag, onDelete, isExpanded, onToggleExpand, replyTarget, onCancelReply, onSubmitReply }) {
  const liveReplies = post?.replies || []

  if (loading || !post) {
    return (
      <div className="stream-container">
        <StreamStyles />
        <DetailHeader title="Post" onBack={onBack} />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader size={20} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
        </div>
      </div>
    )
  }

  const t = post.toko
  const isMine = myTokoId != null && t?.id != null && String(t.id) === String(myTokoId)
  const isReplyingToPost = !!(replyTarget && replyTarget.postId === post.id && !replyTarget.parentReplyId)

  return (
    <div className="stream-container">
      <StreamStyles />
      <DetailHeader title="Post" onBack={onBack} />

      <div style={{ padding: '14px 8px 0', display: 'flex', gap: 12 }}>
        <SellerAvatar toko={t} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <TokoNameLink toko={t} fontSize="0.9rem" fontWeight={800} />
            {t?.pro && <ProBadge />}
            <span style={{ fontFamily: PJS, fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{timeAgo(post.createdAt)}</span>
            {isMine && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(post.id)}
                title="Hapus post"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', display: 'flex', padding: 4,
                  borderRadius: 'var(--radius-md)', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger, #ef4444)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <Trash2 size={14} />
              </motion.button>
            )}
          </div>
          <PostTypeBadge type={post.postType} />
          <PostText text={post.teks} onTag={onTag} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
          <PostImages images={post.foto} />
          {post.shopLink && <ShopLinkCard link={post.shopLink} />}
          <HashtagPills tags={post.hashtags} onTag={onTag} />
          <div style={{ fontFamily: PJS, fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '10px 0', paddingBottom: 10, borderBottom: '2px solid var(--glass-border)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{post.likesCount}</strong> suka · <strong style={{ color: 'var(--text-secondary)' }}>{post.repostsCount}</strong> repost
          </div>
          <PostActions
            likesCount={post.likesCount} repostsCount={post.repostsCount} repliesCount={countReplies(liveReplies)}
            liked={post.liked} reposted={post.reposted} bookmarked={post.bookmarked}
            commentsOpen={true}
            onLike={() => onLike('post', post.id)}
            onRepost={() => onRepost(post.id)}
            onBookmark={() => onBookmark(post.id)}
            onReply={() => onReply(post.id, null, t?.nama)}
            onToggleComments={null}
            onDm={isMine ? null : () => onDm(t?.id)}
          />

          {isReplyingToPost && (
            <InlineReplyBox target={replyTarget} onCancel={onCancelReply} onSubmit={onSubmitReply} />
          )}
        </div>
      </div>

      <div style={{ paddingBottom: 100 }}>
        {liveReplies.map(r => (
          <ReplyThread
            key={r.id}
            reply={r}
            postId={post.id}
            depth={0}
            myTokoId={myTokoId}
            onLike={(replyId) => onLike('reply', replyId)}
            onReply={onReply}
            onDm={onDm}
            replyTarget={replyTarget}
            onCancelReply={onCancelReply}
            onSubmitReply={onSubmitReply}
          />
        ))}
      </div>
    </div>
  )
}

function ReplyThread({ reply, postId, depth, myTokoId, onLike, onReply, onDm, replyTarget, onCancelReply, onSubmitReply }) {
  const t = reply.toko
  const isMine = myTokoId != null && t?.id != null && String(t.id) === String(myTokoId)
  const hasChildren = (reply.replies || []).length > 0
  const isReplyingToThis = !!(replyTarget && replyTarget.parentReplyId === reply.id)

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', gap: 12, padding: `${depth === 0 ? 12 : 6}px 8px 0`, marginLeft: depth > 0 ? 32 : 0 }}
      >
        <SellerAvatar toko={t} size={depth === 0 ? 34 : 28} />
        <div style={{ flex: 1, minWidth: 0, paddingBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <TokoNameLink toko={t} fontSize={depth === 0 ? '0.82rem' : '0.78rem'} />
            {t?.pro && <ProBadge small />}
            <span style={{ fontFamily: PJS, fontSize: '0.65rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{timeAgo(reply.createdAt)}</span>
          </div>
          <p style={{ fontFamily: PJS, fontSize: depth === 0 ? '0.855rem' : '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{reply.teks}</p>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            <ActionBtn icon={<Heart size={13} fill={reply.liked ? 'var(--danger)' : 'none'} />} label={reply.likesCount} active={reply.liked} activeColor="var(--danger)" onClick={() => onLike(reply.id)} />
            <ActionBtn icon={<MessageCircle size={13} />} label="Balas" onClick={() => onReply(postId, reply.id, t?.nama)} />
            {!isMine && <ActionBtn icon={<Mail size={13} />} onClick={() => onDm(t?.id)} />}
          </div>

          {isReplyingToThis && (
            <InlineReplyBox target={replyTarget} onCancel={onCancelReply} onSubmit={onSubmitReply} />
          )}
        </div>
      </motion.div>
      {hasChildren && reply.replies.map(child => (
        <ReplyThread
          key={child.id}
          reply={child}
          postId={postId}
          depth={depth + 1}
          myTokoId={myTokoId}
          onLike={onLike}
          onReply={onReply}
          onDm={onDm}
          replyTarget={replyTarget}
          onCancelReply={onCancelReply}
          onSubmitReply={onSubmitReply}
        />
      ))}
    </div>
  )
}

// ================================================
// DM LIST + THREAD
// ================================================
function DmListView({ threads, onBack, onOpen }) {
  return (
    <div className="stream-container">
      <StreamStyles />
      <DetailHeader title="Pesan" onBack={onBack} />
      {threads.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.85rem', padding: 40 }}>
          Belum ada percakapan.
        </p>
      )}
      {threads.map(t => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => onOpen(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 8px',
            borderBottom: '2px solid var(--glass-border)', cursor: 'pointer',
            background: t.unread > 0 ? 'var(--accent-gradient-soft)' : 'transparent',
            transition: 'background 0.15s ease',
          }}
        >
          <SellerAvatar toko={t.toko} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontFamily: PJS, fontSize: '0.875rem', fontWeight: t.unread > 0 ? 800 : 600 }}>{t.toko?.nama}</span>
                {t.toko?.pro && <ProBadge />}
              </div>
            </div>
            <p style={{
              fontFamily: PJS, fontSize: '0.78rem', margin: 0,
              color: t.unread > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              fontWeight: t.unread > 0 ? 600 : 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{t.lastMessage}</p>
          </div>
          {t.unread > 0 && (
            <div style={{
              width: 20, height: 20, borderRadius: 'var(--radius-full)', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>{t.unread}</div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

// ================================================
// PUSH NOTIFICATION BANNER
// ================================================
function PushNotificationBanner({ permission, onRequestPermission, onSimulateOrder, onSimulateDm }) {
  const [closed, setClosed] = useState(false)
  if (closed) return null

  const isGranted = permission === 'granted'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        margin: '10px 4px 14px',
        padding: '12px 14px',
        background: 'linear-gradient(135deg, rgba(12,68,124,0.3) 0%, rgba(55,138,221,0.15) 100%)',
        border: '2px solid var(--accent)',
        borderRadius: 'var(--radius-xl)',
        position: 'relative',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#fff', flexShrink: 0
          }}>
            🔔
          </div>
          <div>
            <div style={{ fontFamily: PJS, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              Push Notifikasi Realtime
              {isGranted ? (
                <span style={{ fontSize: '0.65rem', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>Aktif ✅</span>
              ) : (
                <span style={{ fontSize: '0.65rem', background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>Belum Aktif</span>
              )}
            </div>
            <p style={{ fontFamily: PJS, fontSize: '0.74rem', color: 'var(--text-tertiary)', margin: '2px 0 0', lineHeight: 1.4 }}>
              Dapatkan nada chime & push notif otomatis saat ada pesanan baru masuk atau DM!
            </p>
          </div>
        </div>
        <button onClick={() => setClosed(true)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
        {!isGranted && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRequestPermission}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent-gradient)', border: 'none', color: '#fff',
              fontFamily: PJS, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Bell size={13} />
            Aktifkan Push Notif Browser
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSimulateOrder}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: 'var(--surface)', border: '1.5px solid var(--glass-border)', color: 'var(--text-primary)',
            fontFamily: PJS, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          🛒 Test Pesanan Masuk
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSimulateDm}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: 'var(--surface)', border: '1.5px solid var(--glass-border)', color: 'var(--text-primary)',
            fontFamily: PJS, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ✉️ Test DM Masuk
        </motion.button>
      </div>
    </motion.div>
  )
}

function DmThreadView({ thread, messages, myTokoId, onBack, onSend }) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef()
  const messagesContainerRef = useRef()
  const { theme } = useTheme()

  const QUICK_REPLIES = [
    'Siap Kirim Hari Ini 🚀',
    'Stok Ready Kak ✅',
    'Grosir Nego Boleh 🤝',
    'Kirim Alamat Lengkap ya 📍',
    'Garansi Retur 100% 🛡️'
  ]

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, isTyping])

  const send = (textToSend) => {
    const text = (textToSend || input).trim()
    if (!text) return
    onSend(text)
    if (!textToSend) setInput('')

    // Simulate instant auto-reply after 1.2s for interactive demo
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const replies = [
        'Siap kak, terima kasih banyak informasinya! Saya cek katalog tokonya dulu ya 👍',
        'Oke kak, siap kirim via Biteship kan ya? Terima kasih respon cepatnya!',
        'Wah mantap kak! Nanti saya kabari lagi setelah bayar pesanan ya 🛒'
      ]
      const autoReply = replies[Math.floor(Math.random() * replies.length)]
      MOCK_DM_MESSAGES[thread?.id] = [
        ...(MOCK_DM_MESSAGES[thread?.id] || messages),
        { id: 'm_auto_' + Date.now(), teks: autoReply, isMine: false, createdAt: new Date().toISOString() }
      ]
      // Force refresh messages locally
      useStreamStore.getState().loadDmMessages(null, thread?.id)
    }, 1200)
  }

  return (
    <div className="stream-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <StreamStyles />
      <DetailHeader title={thread?.toko?.nama || 'Pesan'} onBack={onBack} avatar={thread?.toko} />

      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          scrollBehavior: 'smooth',
          border: theme === 'dark'
            ? `4px solid ${THEME_TOKENS.dark.bubbleBorderMine}`
            : `3px solid ${NAVY}`,
        }}
      >
        {messages.map((m, i) => (
          <motion.div
            key={m.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            style={{ display: 'flex', justifyContent: m.isMine ? 'flex-end' : 'flex-start', gap: 8 }}
          >
            <div style={{
              maxWidth: '72%', padding: '10px 13px',
              borderRadius: m.isMine ? 'var(--radius-xl) var(--radius-xl) 4px var(--radius-xl)' : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 4px',
              background: m.isMine ? 'var(--accent-gradient)' : 'var(--surface)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              <p style={{ fontFamily: PJS, fontSize: '0.855rem', color: m.isMine ? '#fff' : 'var(--text-primary)', margin: 0, lineHeight: 1.55 }}>{m.teks}</p>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--surface)', borderRadius: 16, width: 'fit-content' }}>
            <Loader size={12} className="animate-spin" color="var(--accent)" />
            <span style={{ fontFamily: PJS, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{thread?.toko?.nama || 'Pengguna'} sedang mengetik...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Reply Chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 4px', borderTop: '1px solid var(--glass-border)' }}>
        {QUICK_REPLIES.map((chip) => (
          <motion.button
            key={chip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => send(chip)}
            style={{
              padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface)',
              border: '1px solid var(--glass-border)', color: 'var(--text-secondary)',
              fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
            }}
          >
            {chip}
          </motion.button>
        ))}
      </div>

      <div style={{
        padding: '10px 8px',
        borderTop: '2px solid var(--glass-border)',
        display: 'flex',
        gap: 8
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ketik pesan..."
          style={{
            flex: 1, background: 'var(--surface)', border: '2px solid var(--glass-border)',
            borderRadius: 'var(--radius-full)', padding: '10px 16px', color: 'var(--text-primary)',
            fontSize: '0.855rem', outline: 'none', fontFamily: PJS,
            transition: 'border-color 0.2s ease',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => send()}
          disabled={!input.trim()}
          style={{
            width: 38, height: 38, borderRadius: 'var(--radius-full)',
            background: input.trim() ? 'var(--accent-gradient)' : 'var(--surface)',
            border: '2px solid var(--glass-border)', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <Send size={14} color={input.trim() ? '#fff' : 'var(--text-tertiary)'} />
        </motion.button>
      </div>
    </div>
  )
}

// ================================================
// COMPOSE SHEET
// ================================================
function ComposeSheet({ tokenObj, feed, plan, onClose, onSubmit }) {
  const [teks, setTeks] = useState('')
  const [foto, setFoto] = useState([])
  const [postType, setPostType] = useState(null)
  const [kategori, setKategori] = useState('')
  const [kategoriOpen, setKategoriOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)
  const kategoriRef = useRef(null)

  const [mention, setMention] = useState({ active: false, query: '', startIndex: -1, results: [] })

  const selectedType = POST_TYPES.find(p => p.value === postType)
  const isPublic = !!selectedType?.public

  useEffect(() => {
    const handler = (e) => {
      if (kategoriRef.current && !kategoriRef.current.contains(e.target)) setKategoriOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = async () => {
    if (!teks.trim() || submitting) return
    if (isPublic && !kategori) {
      toast.error('Pilih kategori dulu buat post yang tampil di Showcase')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ teks: teks.trim(), foto, postType, kategori: isPublic ? kategori : null })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePostType = (pt) => {
    const prev = POST_TYPES.find(p => p.value === postType)
    let next = teks
    if (prev) next = next.replace(new RegExp(`\\s*${prev.hashtag}\\b`, 'i'), '').trim()
    if (postType === pt.value) {
      setPostType(null)
      setTeks(next)
      setKategori('')
    } else {
      setPostType(pt.value)
      setTeks(next ? `${next} ${pt.hashtag}` : pt.hashtag)
      if (!pt.public) setKategori('')
    }
  }

  const handleTextChange = (e) => {
    const val = e.target.value
    setTeks(val)

    const cursorPos = e.target.selectionStart
    const textBeforeCursor = val.substring(0, cursorPos)
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/)

    if (match) {
      const query = match[1]
      const startIndex = cursorPos - query.length - 1

      if (query.length >= 3) {
        tokoApi.search(query).then(res => {
          if (res.success) setMention({ active: true, query, startIndex, results: res.data })
        }).catch(() => {})
      } else {
        const allToko = feed.map(p => p.toko).filter(Boolean)
        const uniqueToko = [...new Map(allToko.map(t => [t.slug, t])).values()]
        const results = uniqueToko.filter(t =>
          t.slug.toLowerCase().includes(query.toLowerCase()) ||
          t.nama.toLowerCase().includes(query.toLowerCase())
        )
        setMention({ active: true, query, startIndex, results })
      }
    } else {
      setMention({ active: false, query: '', startIndex: -1, results: [] })
    }
  }

  const insertMention = (toko) => {
    const before = teks.substring(0, mention.startIndex)
    const after = teks.substring(mention.startIndex + mention.query.length + 1)
    const newText = `${before}@${toko.slug} ${after}`
    setTeks(newText)
    setMention({ active: false, query: '', startIndex: -1, results: [] })

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = before.length + toko.slug.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  return (
    <Sheet onClose={onClose} title="Buat Post">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {POST_TYPES.map(pt => (
          <motion.button
            key={pt.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePostType(pt)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 11px', borderRadius: 'var(--radius-full)',
              background: postType === pt.value ? 'var(--accent-gradient)' : 'var(--surface)',
              border: '2px solid var(--glass-border)',
              color: postType === pt.value ? '#fff' : 'var(--text-secondary)',
              fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>{pt.emoji}</span>{pt.label}
          </motion.button>
        ))}
      </div>
      {postType && (() => {
        const selected = POST_TYPES.find(p => p.value === postType)
        const isPublicBadge = selected?.public
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: isPublicBadge ? 'rgba(52,211,153,0.1)' : 'var(--surface)',
            border: `2px solid ${isPublicBadge ? 'rgba(52,211,153,0.3)' : 'var(--glass-border)'}`,
            borderRadius: 'var(--radius-md)', padding: '7px 11px', marginBottom: 12,
            fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600,
            color: isPublicBadge ? 'var(--success, #34d399)' : 'var(--text-tertiary)',
          }}>
            {isPublicBadge
              ? '🌐 Post ini tampil di Showcase publik — buyer non-login bisa lihat'
              : '🔒 Post ini cuma kelihatan sesama seller di komunitas'}
          </div>
        )
      })()}

      {isPublic && (
        <div style={{ marginBottom: 12 }} ref={kategoriRef}>
          <label style={{ fontFamily: PJS, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.03em', display: 'block', marginBottom: 6 }}>
            KATEGORI * <span style={{ fontWeight: 400 }}>(buat filter di Showcase)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setKategoriOpen(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', background: 'var(--surface)',
                border: `2px solid ${kategoriOpen ? 'var(--accent)' : 'var(--glass-border)'}`,
                borderRadius: 'var(--radius-md)',
                color: kategori ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontFamily: PJS, fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              <span>{kategori || '— Pilih Kategori —'}</span>
              <ChevronDown size={14} style={{ transform: kategoriOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>
            {kategoriOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
                background: 'var(--bg-secondary)', border: '2px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)', maxHeight: 220, overflowY: 'auto',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
              }}>
                {KATEGORI_LIST.map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { setKategori(k); setKategoriOpen(false) }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px',
                      background: kategori === k ? 'var(--accent-gradient-soft)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      fontFamily: PJS, fontSize: '0.82rem', fontWeight: kategori === k ? 700 : 400,
                      color: kategori === k ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={teks}
          onChange={handleTextChange}
          placeholder={'Bagikan tips, promo, update toko...\nGunakan #hashtag atau @slug-toko untuk mention'}
          rows={5}
          maxLength={500}
          style={{
            width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)',
            fontSize: '0.875rem', lineHeight: 1.65, resize: 'none', outline: 'none', fontFamily: PJS,
            boxSizing: 'border-box', marginBottom: 12,
          }}
        />

        {mention.active && mention.results.length > 0 && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 0, right: 0,
            background: 'var(--bg-secondary)', border: '2px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)', maxHeight: 200, overflowY: 'auto',
            zIndex: 10, boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
          }}>
            {mention.results.map(toko => (
              <motion.div
                key={toko.id}
                whileHover={{ background: 'var(--surface)' }}
                onClick={() => insertMention(toko)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)',
                }}
              >
                <SellerAvatar toko={toko} size={24} />
                <div>
                  <div style={{ fontFamily: PJS, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{toko.nama}</div>
                  <div style={{ fontFamily: PJS, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>@{toko.slug}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <StreamImageUpload
        value={foto}
        onChange={setFoto}
        tokenObj={tokenObj}
        disabled={submitting}
        plan={plan}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '2px solid var(--glass-border)' }}>
        <span style={{ fontFamily: PJS, fontSize: '0.7rem', color: teks.length > 450 ? 'var(--danger)' : 'var(--text-tertiary)' }}>{teks.length}/500</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={!teks.trim() || submitting}
          style={{
            padding: '9px 22px', borderRadius: 'var(--radius-full)', border: 'none',
            background: teks.trim() && !submitting ? 'var(--accent-gradient)' : 'var(--surface)',
            color: teks.trim() && !submitting ? '#fff' : 'var(--text-tertiary)',
            fontFamily: PJS, fontSize: '0.82rem', fontWeight: 700,
            cursor: teks.trim() && !submitting ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Mengirim...' : 'Post'}
        </motion.button>
      </div>
    </Sheet>
  )
}

// ================================================
// NOTIF DROPDOWN
// ================================================
function NotifDropdown({ notifs, onClose, onOpenDm, onOpenPost }) {
  const ICON = { like: '❤️', reply: '💬', repost: '🔁', dm: '✉️' }
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleClick = (n) => {
    if (n.type === 'dm' && n.refThreadId) return onOpenDm(n.refThreadId)
    if (n.refPostId) return onOpenPost(n.refPostId)
  }

  const labelFor = (n) => {
    const name = n.actor?.nama || 'Seller'
    switch (n.type) {
      case 'like': return n.postExcerpt ? `${name} menyukai postmu: "${n.postExcerpt}"` : `${name} menyukai postmu`
      case 'reply':
        if (n.replyExcerpt && n.postExcerpt) return `${name} membalas postmu "${n.postExcerpt}": "${n.replyExcerpt}"`
        if (n.replyExcerpt) return `${name} membalas: "${n.replyExcerpt}"`
        return `${name} membalas postmu`
      case 'repost': return n.postExcerpt ? `${name} merepost postmu: "${n.postExcerpt}"` : `${name} merepost postmu`
      case 'dm': return `${name} mengirim pesan baru`
      default: return name
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
        width: 320, maxWidth: '90vw', maxHeight: 420, overflowY: 'auto',
        background: 'var(--bg-secondary)', border: '2px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.35))',
        padding: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px 10px', borderBottom: '2px solid var(--glass-border)', marginBottom: 6 }}>
        <span style={{ fontFamily: PJS, fontSize: '0.85rem', fontWeight: 800 }}>Notifikasi</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 2 }}>
          <X size={14} />
        </button>
      </div>

      {notifs.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.8rem', padding: '20px 12px' }}>
          Belum ada notifikasi.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {notifs.map(n => (
          <motion.div
            key={n.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleClick(n)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              background: n.isRead ? 'transparent' : 'var(--accent-gradient-soft)',
              transition: 'background 0.15s ease',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{ICON[n.type] || '🔔'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: PJS, fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>{labelFor(n)}</p>
              <span style={{ fontFamily: PJS, fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{timeAgo(n.createdAt)}</span>
            </div>
            {!n.isRead && <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--accent)', flexShrink: 0 }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ================================================
// SHARED UI
// ================================================
function Sheet({ children, onClose, title }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="stream-sheet-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 700,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="stream-sheet-panel"
        style={{
          width: '100%', maxWidth: 560, margin: '0 auto',
          background: 'var(--bg-secondary)', border: '2px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
          padding: '18px 18px 28px', maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: PJS, fontSize: '0.95rem', fontWeight: 800 }}>{title}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              background: 'var(--surface)', border: '2px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-tertiary)',
            }}
          >
            <X size={14} />
          </motion.button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function DetailHeader({ title, onBack, avatar }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'var(--bg-secondary)', backdropFilter: 'blur(16px)',
      borderBottom: '3px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', height: 52, gap: 10, padding: '0 4px',
    }}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}
      >
        <ChevronLeft size={20} />
      </motion.button>
      {avatar && <SellerAvatar toko={avatar} size={28} />}
      <span style={{ fontFamily: PJS, fontSize: '1rem', fontWeight: 800 }}>{title}</span>
    </div>
  )
}

function SellerAvatar({ toko, size = 40 }) {
  const [isHovered, setIsHovered] = useState(false)

  if (toko?.logo) {
    return (
      <motion.img
        src={cloudinaryThumb(toko.logo)}
        alt={toko.nama}
        whileHover={{ scale: 1.1 }}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
          border: `2px solid ${isHovered ? 'var(--accent)' : 'var(--glass-border)'}`,
          transition: 'border-color 0.2s ease',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    )
  }
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      style={{
        width: size, height: size, borderRadius: '50%', background: 'var(--accent-gradient)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: PJS, fontSize: size * 0.32, fontWeight: 800, color: '#fff', flexShrink: 0,
        border: '2px solid var(--glass-border)',
      }}
    >
      {getInitials(toko?.nama)}
    </motion.div>
  )
}

function TokoNameLink({ toko, fontSize = '0.875rem', fontWeight = 800 }) {
  const url = toko?.slug ? getStorefrontUrl(toko.slug) : null
  const style = { fontFamily: PJS, fontSize, fontWeight, color: 'var(--text-primary)', textDecoration: 'none', cursor: url ? 'pointer' : 'default', transition: 'color 0.15s ease' }
  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" style={style}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
      >
        {toko?.nama || 'Toko'}
      </a>
    )
  }
  return <span style={style}>{toko?.nama || 'Toko'}</span>
}

function ProBadge({ small }) {
  return <span className="badge badge-pro" style={{ fontSize: small ? '0.55rem' : '0.6rem', padding: '1px 6px' }}>⭐ Pro</span>
}

function PostTypeBadge({ type }) {
  const meta = POST_TYPES.find(pt => pt.value === type)
  if (!meta) return null
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'var(--accent-gradient-soft)', border: '2px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)', padding: '3px 9px', marginBottom: 8,
        fontFamily: PJS, fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)',
      }}
    >
      <span>{meta.emoji}</span>{meta.label}
    </motion.span>
  )
}

function IconBtn({ children, onClick, badge }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        position: 'relative', background: 'var(--surface)', border: '2px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)', width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text-tertiary)',
      }}
    >
      {children}
      {badge > 0 && (
        <div style={{
          position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%',
          background: 'var(--danger, #ef4444)', border: '2px solid var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800, color: '#fff',
        }}>{badge}</div>
      )}
    </motion.button>
  )
}

function ActionBtn({ icon, label, active, activeColor, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
        cursor: 'pointer', color: active ? activeColor : 'var(--text-tertiary)',
        fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-md)',
        transition: 'color 0.15s ease',
      }}
    >
      {icon}{label !== undefined && label}
    </motion.button>
  )
}

function PostActions({ likesCount, repostsCount, repliesCount, liked, reposted, bookmarked, commentsOpen, onLike, onRepost, onBookmark, onReply, onToggleComments, onDm }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 4, marginBottom: 12 }}>
      <ActionBtn icon={<Heart size={15} fill={liked ? 'var(--danger)' : 'none'} />} label={likesCount} active={liked} activeColor="var(--danger)" onClick={onLike} />
      {onToggleComments ? (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleComments}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
            cursor: 'pointer', color: commentsOpen ? 'var(--accent)' : 'var(--text-tertiary)',
            fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-md)',
          }}
        >
          <MessageCircle size={15} />{repliesCount}
          {commentsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </motion.button>
      ) : (
        <ActionBtn icon={<MessageCircle size={15} />} label={repliesCount} onClick={onReply} />
      )}
      <ActionBtn icon={<Repeat2 size={15} />} label={repostsCount} active={reposted} activeColor="var(--success, #34d399)" onClick={onRepost} />
      {onDm && <ActionBtn icon={<Mail size={15} />} onClick={onDm} />}
      <div style={{ marginLeft: 'auto' }}>
        <ActionBtn icon={<Bookmark size={15} fill={bookmarked ? 'var(--accent)' : 'none'} />} active={bookmarked} activeColor="var(--accent)" onClick={onBookmark} />
      </div>
    </div>
  )
}

function PostText({ text, onTag, isExpanded, onToggleExpand }) {
  const MAX_CHARS = 200
  const teks = text || ''
  const shouldTruncate = teks.length > MAX_CHARS
  const displayText = isExpanded || !shouldTruncate ? teks : teks.slice(0, MAX_CHARS)

  const renderContent = (content) => {
    if (!content) return null
    const parts = content.split(/(@[a-z0-9-]+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@') && part.length > 1) {
        const slug = part.slice(1)
        return (
          <a
            key={i}
            href={getStorefrontUrl(slug)}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
            onMouseLeave={e => e.target.style.textDecoration = 'none'}
          >
            {part}
          </a>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div>
      <p style={{ fontFamily: PJS, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 5px', whiteSpace: 'pre-line' }}>
        {renderContent(displayText).map((node, i) => {
           if (typeof node.props?.children === 'string' && node.props.children.includes('#')) {
              const textParts = node.props.children.split(/(\s*#[\w-]+)/g)
              return textParts.map((tp, j) => {
                 if (tp.startsWith('#')) {
                    return <span key={`${i}-${j}`} style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onTag(tp)}>{tp}</span>
                 }
                 return <span key={`${i}-${j}`}>{tp}</span>
              })
           }
           return node
        })}
        {shouldTruncate && !isExpanded && '...'}
      </p>

      {shouldTruncate && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleExpand}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontFamily: PJS,
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 0 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {isExpanded ? (
            <>
              Lihat lebih sedikit
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              Lihat selengkapnya
              <ChevronDown size={14} />
            </>
          )}
        </motion.button>
      )}
    </div>
  )
}

function PostImages({ images }) {
  const [lightboxIdx, setLightboxIdx] = useState(null)
  if (!images?.length) return null

  return (
    <>
      {images.length === 1 ? (
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => setLightboxIdx(0)}
          style={{ position: 'relative', marginBottom: 10, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--glass-border)', background: 'var(--surface)', cursor: 'pointer' }}
        >
          <img src={cloudinaryMedium(images[0])} alt="" style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 480 }} />
          <ZoomBadge />
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 10, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--glass-border)', background: 'var(--surface)' }}>
          {images.map((img, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              onClick={() => setLightboxIdx(i)}
              style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
            >
              <img src={cloudinaryMedium(img)} alt="" style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 320, background: 'var(--surface)' }} />
              <ZoomBadge />
            </motion.div>
          ))}
        </div>
      )}
      {lightboxIdx !== null && <ImageLightbox images={images} index={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
    </>
  )
}

function ZoomBadge() {
  return (
    <div style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 'var(--radius-full)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <Maximize2 size={13} color="#fff" />
    </div>
  )
}

function ImageLightbox({ images, index, onClose }) {
  const [current, setCurrent] = useState(index)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % images.length)
      if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
      >
        <X size={18} color="#fff" />
      </motion.button>
      <motion.img
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        src={images[current]}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }}
      />
      {images.length > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + images.length) % images.length) }}
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} color="#fff" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); setCurrent(c => (c + 1) % images.length) }}
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronRight size={20} color="#fff" />
          </motion.button>
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontFamily: PJS, fontSize: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </motion.div>
  )
}

function ShopLinkCard({ link }) {
  return (
    <motion.a
      href={getStorefrontUrl(link.slug)}
      target="_blank"
      rel="noreferrer"
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      style={{
        width: '100%', marginBottom: 10, background: 'var(--surface)', border: '2px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none', boxSizing: 'border-box',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Store size={16} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: PJS, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{link.nama}</p>
        <p style={{ fontFamily: PJS, fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: 0 }}>{getStorefrontUrl(link.slug)}</p>
      </div>
      <motion.span
        animate={{ x: [0, 3, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        style={{ fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-gradient-soft)', padding: '4px 10px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
      >
        Kunjungi →
      </motion.span>
    </motion.a>
  )
}

function HashtagPills({ tags, onTag }) {
  if (!tags?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
      {tags.map(tag => (
        <motion.span
          key={tag}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onTag(tag)}
          style={{ fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', background: 'var(--accent-gradient-soft)', border: '2px solid var(--glass-border)', padding: '3px 9px', borderRadius: 'var(--radius-md)', display: 'inline-block' }}
        >
          {tag}
        </motion.span>
      ))}
    </div>
  )
}

// ================================================
// HELPERS
// ================================================
function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}dtk`
  if (diff < 3600) return `${Math.floor(diff / 60)}mnt`
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`
  return `${Math.floor(diff / 86400)}h`
}

function countReplies(replies) {
  if (!replies?.length) return 0
  return replies.reduce((sum, r) => sum + 1 + countReplies(r.replies), 0)
}
