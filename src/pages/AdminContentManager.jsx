import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, BookOpen, HelpCircle, Plus, Edit2, Trash2, Search,
  Upload, X, Save, ArrowLeft, Image as ImageIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { adminApi, streamApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import { formatDateTime } from '../lib/utils'

// TipTap Editor Component
function RichTextEditor({ value, onChange, placeholder }) {
  const [editor, setEditor] = useState(null)

  useEffect(() => {
    // Dynamic import TipTap
    import('@tiptap/react').then(({ useEditor }) => {
      import('@tiptap/starter-kit').then(({ StarterKit }) => {
        import('@tiptap/extension-link').then(({ Link }) => {
          import('@tiptap/extension-image').then(({ Image }) => {
            const editorInstance = useEditor({
              extensions: [
                StarterKit,
                Link.configure({ openOnClick: false }),
                Image,
              ],
              content: value || '',
              onUpdate: ({ editor }) => {
                onChange(editor.getHTML())
              },
            })
            setEditor(editorInstance)
          })
        })
      })
    })

    return () => {
      if (editor) editor.destroy()
    }
  }, [])

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || '')
    }
  }, [value])

  if (!editor) {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={10}
        className="form-input form-textarea"
        style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
      />
    )
  }

  return (
    <div style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px 12px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap',
      }}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
          H3
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          • List
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          1. List
        </ToolbarButton>
        <ToolbarButton onClick={() => {
          const url = window.prompt('URL:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }} active={editor.isActive('link')}>
          🔗 Link
        </ToolbarButton>
        <ToolbarButton onClick={() => {
          const url = window.prompt('Image URL:')
          if (url) editor.chain().focus().setImage({ src: url }).run()
        }}>
          🖼️ Image
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()}>
          Clear
        </ToolbarButton>
      </div>
      {/* Editor Content */}
      <div
        onClick={() => editor.chain().focus().run()}
        style={{
          padding: '16px',
          minHeight: '300px',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          outline: 'none',
        }}
        dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
      />
    </div>
  )
}

function ToolbarButton({ onClick, active, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: '6px',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: '1px solid var(--glass-border)',
        cursor: 'pointer',
        fontSize: '0.78rem',
        fontWeight: active ? 700 : 500,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// Image Upload Component
function CoverImageUpload({ value, onChange, tokenObj }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = React.useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File terlalu besar (maks 5MB)')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1]
        const res = await streamApi.uploadImage(tokenObj, {
          fileBase64: base64,
          fileName: file.name,
          contentType: file.type,
        })
        onChange(res.data.url)
        toast.success('Cover image berhasil diupload')
      }
      reader.readAsDataURL(file)
    } catch (err) {
      toast.error('Gagal upload image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      {value && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={value}
            alt="Cover"
            style={{
              width: '120px',
              height: '80px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
            }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--danger)',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div style={{ flex: 1 }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: uploading ? 'var(--surface)' : 'var(--accent-gradient-soft)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {uploading ? (
            <>
              <span className="spinner" style={{ width: 14, height: 14 }} />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={14} />
              {value ? 'Ganti Cover' : 'Upload Cover Image'}
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
          JPG, PNG, WEBP — maks 5MB
        </p>
      </div>
    </div>
  )
}

// Main Content Manager Component
export default function AdminContentManager({ type = 'blog', onBack }) {
  const { token } = useAuthStore()
  const tokenObj = token
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const TYPE_CONFIG = {
    blog: {
      label: 'Blog Posts',
      icon: FileText,
      color: '#3b82f6',
      api: {
        list: '/api/blog',
        create: adminApi.createBlogPost,
        update: adminApi.updateBlogPost,
        delete: adminApi.deleteBlogPost,
      },
      fields: ['title', 'slug', 'excerpt', 'cover_image', 'category', 'content'],
    },
    guides: {
      label: 'Panduan / Tutorial',
      icon: BookOpen,
      color: '#10b981',
      api: {
        list: '/api/guides',
        create: adminApi.createGuide,
        update: adminApi.updateGuide,
        delete: adminApi.deleteGuide,
      },
      fields: ['title', 'slug', 'summary', 'icon', 'content'],
    },
    help: {
      label: 'Pusat Bantuan',
      icon: HelpCircle,
      color: '#a855f7',
      api: {
        list: '/api/help',
        create: adminApi.createHelpArticle,
        update: adminApi.updateHelpArticle,
        delete: adminApi.deleteHelpArticle,
      },
      fields: ['title', 'slug', 'category', 'content'],
    },
  }

  const config = TYPE_CONFIG[type]
  const Icon = config.icon

  useEffect(() => {
    loadItems()
  }, [type])

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(config.api.list)
      const data = await res.json()
      if (data.success) {
        setItems(data.data || [])
      }
    } catch (err) {
      console.error('Failed to load items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus artikel ini?')) return
    try {
      await config.api.delete(token, id)
      setItems(items.filter(item => item.id !== id))
      toast.success('Artikel berhasil dihapus')
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus artikel')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleCreate = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  const filteredItems = items.filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      item.title?.toLowerCase().includes(q) ||
      item.slug?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: `${config.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: config.color,
            }}>
              <Icon size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {config.label}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: 0 }}>
                {items.length} artikel
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-gradient)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={16} />
          Buat Artikel Baru
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          placeholder="Cari artikel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '40px' }}
        />
      </div>

      {/* Items List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
          Memuat...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--glass-border)',
        }}>
          <Icon size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
            Belum Ada Artikel
          </h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginBottom: '20px' }}>
            {search ? 'Tidak ada artikel yang cocok dengan pencarian' : 'Mulai buat artikel pertama kamu'}
          </p>
          {!search && (
            <button
              onClick={handleCreate}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 700,
              }}
            >
              <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Buat Artikel Pertama
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  {item.cover_image && type === 'blog' && (
                    <img
                      src={item.cover_image}
                      alt=""
                      style={{
                        width: '48px',
                        height: '32px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  <span>/{item.slug}</span>
                  {item.category && <span>• {item.category}</span>}
                  {item.published_at && <span>• {formatDateTime(item.published_at)}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => handleEdit(item)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-gradient-soft)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {showForm && (
          <ContentFormModal
            type={type}
            config={config}
            item={editingItem}
            tokenObj={tokenObj}
            onClose={() => {
              setShowForm(false)
              setEditingItem(null)
            }}
            onSave={async (data) => {
              try {
                if (editingItem) {
                  await config.api.update(token, editingItem.id, data)
                  toast.success('Artikel berhasil diperbarui')
                } else {
                  await config.api.create(token, data)
                  toast.success('Artikel berhasil dibuat')
                }
                setShowForm(false)
                setEditingItem(null)
                loadItems()
              } catch (err) {
                toast.error(err.message || 'Gagal menyimpan artikel')
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Form Modal Component
function ContentFormModal({ type, config, item, tokenObj, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    slug: item?.slug || '',
    excerpt: item?.excerpt || item?.summary || '',
    content: item?.content || '',
    cover_image: item?.cover_image || '',
    category: item?.category || (type === 'blog' ? 'Tips' : 'FAQ'),
    icon: item?.icon || 'BookOpen',
    published_at: item?.published_at || new Date().toISOString().slice(0, 16),
  })
  const [saving, setSaving] = useState(false)

  const set = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }))
  }

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Judul wajib diisi')
      return
    }
    if (!formData.slug.trim()) {
      toast.error('Slug wajib diisi')
      return
    }
    if (!formData.content.trim()) {
      toast.error('Konten wajib diisi')
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            {item ? 'Edit Artikel' : 'Buat Artikel Baru'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Judul *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  set('title', e.target.value)
                  if (!item) set('slug', generateSlug(e.target.value))
                }}
                placeholder="Judul artikel..."
                className="form-input"
                required
              />
            </div>

            {/* Slug */}
            <div className="form-group">
              <label className="form-label">Slug (URL) *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="contoh: cara-membuat-toko-online"
                className="form-input"
                style={{ fontFamily: 'monospace' }}
                required
              />
              <span className="form-hint">Akan menjadi: /{type}/{formData.slug}</span>
            </div>

            {/* Cover Image (Blog only) */}
            {type === 'blog' && (
              <div className="form-group">
                <label className="form-label">Cover Image</label>
                <CoverImageUpload
                  value={formData.cover_image}
                  onChange={(url) => set('cover_image', url)}
                  tokenObj={tokenObj}
                />
              </div>
            )}

            {/* Excerpt/Summary */}
            {(type === 'blog' || type === 'guides') && (
              <div className="form-group">
                <label className="form-label">{type === 'blog' ? 'Excerpt' : 'Summary'}</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => set('excerpt', e.target.value)}
                  placeholder="Deskripsi singkat artikel..."
                  rows={3}
                  className="form-input form-textarea"
                  maxLength={type === 'blog' ? 300 : 200}
                />
                <span className="form-hint">{formData.excerpt.length}/{type === 'blog' ? 300 : 200} karakter</span>
              </div>
            )}

            {/* Category */}
            {(type === 'blog' || type === 'help') && (
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="form-input"
                >
                  {type === 'blog' ? (
                    <>
                      <option value="Tips">Tips</option>
                      <option value="Tutorial">Tutorial</option>
                      <option value="News">News</option>
                      <option value="Case Study">Case Study</option>
                    </>
                  ) : (
                    <>
                      <option value="FAQ">FAQ</option>
                      <option value="Cara Pakai">Cara Pakai</option>
                      <option value="Pembayaran">Pembayaran</option>
                      <option value="Pengiriman">Pengiriman</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Icon (Guides only) */}
            {type === 'guides' && (
              <div className="form-group">
                <label className="form-label">Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => set('icon', e.target.value)}
                  className="form-input"
                >
                  <option value="BookOpen">📖 BookOpen</option>
                  <option value="Store">🏪 Store</option>
                  <option value="ShoppingBag">️ ShoppingBag</option>
                  <option value="CreditCard">💳 CreditCard</option>
                  <option value="Truck">🚚 Truck</option>
                  <option value="Settings">⚙️ Settings</option>
                </select>
              </div>
            )}

            {/* Content (Rich Text Editor) */}
            <div className="form-group">
              <label className="form-label">Konten *</label>
              <RichTextEditor
                value={formData.content}
                onChange={(html) => set('content', html)}
                placeholder="Tulis konten artikel di sini..."
              />
            </div>

            {/* Published At */}
            <div className="form-group">
              <label className="form-label">Tanggal Publish</label>
              <input
                type="datetime-local"
                value={formData.published_at?.slice(0, 16)}
                onChange={(e) => set('published_at', new Date(e.target.value).toISOString())}
                className="form-input"
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-md)',
                  background: saving ? 'var(--surface)' : 'var(--accent-gradient)',
                  border: 'none',
                  color: saving ? 'var(--text-tertiary)' : '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {saving ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {item ? 'Perbarui' : 'Publikasikan'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}
