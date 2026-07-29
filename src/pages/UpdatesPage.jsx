import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, Sparkles, TrendingUp, Bug, Calendar,
  ArrowRight, Send
} from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import toast from 'react-hot-toast'
import { CONFIG } from '../lib/config'

const PJS = "'Plus Jakarta Sans', sans-serif"
const NAVY = '#0C447C'
const BLUE = '#378ADD'
const ACCENT_GRADIENT = `linear-gradient(90deg, ${NAVY}, ${BLUE})`

const TYPE_CONFIG = {
  new: { label: 'Baru', emoji: '🟢', color: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
  improvement: { label: 'Peningkatan', emoji: '🔵', color: '#378ADD', bg: 'rgba(55,138,221,0.15)', border: 'rgba(55,138,221,0.3)' },
  fix: { label: 'Perbaikan Bug', emoji: '🟠', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
}

function useScrollAnimation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return { ref, isInView }
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
}

function ChangelogItem({ update, index }) {
  const { ref, isInView } = useScrollAnimation()
  const typeConfig = TYPE_CONFIG[update.type] || TYPE_CONFIG.new

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  return (
    <motion.article
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUpVariant}
      custom={index}
      className="glass-card"
      style={{
        padding: '24px',
        border: '1px solid var(--glass-border)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: PJS, fontSize: '0.72rem', fontWeight: 700,
          color: typeConfig.color,
          background: typeConfig.bg,
          border: `1px solid ${typeConfig.border}`,
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
        }}>
          {typeConfig.emoji} {typeConfig.label}
        </span>
        {update.version && (
          <span style={{
            fontFamily: PJS, fontSize: '0.75rem', fontWeight: 700,
            color: 'var(--text-tertiary)',
          }}>
            v{update.version}
          </span>
        )}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: PJS, fontSize: '0.75rem', color: 'var(--text-tertiary)',
          marginLeft: 'auto',
        }}>
          <Calendar size={12} /> {formatDate(update.release_date)}
        </span>
      </div>

      <h3 style={{
        fontFamily: PJS, fontWeight: 800,
        fontSize: '1.15rem', color: 'var(--text-primary)',
        margin: '0 0 12px 0', lineHeight: 1.3,
      }}>
        {update.title}
      </h3>

      <div
        className="update-content"
        dangerouslySetInnerHTML={{ __html: update.description }}
        style={{
          fontFamily: PJS, fontSize: '0.9rem', lineHeight: 1.7,
          color: 'var(--text-secondary)',
        }}
      />

      {update.image_url && (
        <div style={{
          marginTop: 16, borderRadius: 'var(--radius-lg)',
          overflow: 'hidden', border: '2px solid var(--glass-border)',
        }}>
          <img
            src={update.image_url}
            alt={update.title}
            style={{ width: '100%', display: 'block' }}
          />
        </div>
      )}
    </motion.article>
  )
}

import { safeFetchJson } from '../lib/utils'

export default function UpdatesPage() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpdates()
  }, [])

  const fetchUpdates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/updates')
      const json = await safeFetchJson(res)
      if (json.success) setUpdates(json.data || [])
    } catch (err) {
      toast.error('Gagal memuat update fitur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #050508)',
      fontFamily: PJS,
      transition: 'background 0.25s ease',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        .update-content h2 { font-size: 1.2rem; font-weight: 800; margin: 1em 0 0.6em 0; color: var(--text-primary); }
        .update-content h3 { font-size: 1.05rem; font-weight: 700; margin: 0.8em 0 0.5em 0; color: var(--text-primary); }
        .update-content p { margin: 0.6em 0; line-height: 1.7; }
        .update-content ul, .update-content ol { padding-left: 1.5em; margin: 0.6em 0; }
        .update-content li { margin: 0.2em 0; line-height: 1.6; }
        .update-content a { color: var(--accent, #378ADD); text-decoration: underline; font-weight: 600; }
        .update-content img { max-width: 100%; height: auto; border-radius: var(--radius-lg, 12px); margin: 1em 0; border: 2px solid var(--glass-border); }
        .update-content strong { font-weight: 800; color: var(--text-primary); }

        .updates-container {
          width: 100%;
          box-sizing: border-box;
          padding: 24px 16px 80px;
          margin: 0 auto;
          max-width: 680px;
        }

        @media (min-width: 900px) {
          .updates-container { max-width: 980px; }
        }
        @media (min-width: 1200px) {
          .updates-container { max-width: 1200px; }
        }
      `}</style>

      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--bg-header, rgba(11,11,16,0.85))',
        backdropFilter: 'blur(20px)',
        borderBottom: '3px solid var(--glass-border)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ fontFamily: PJS, fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Update Fitur <span style={{ color: 'var(--accent, #378ADD)' }}>Exora</span>
        </h1>
        <Link to="/" style={{
          background: ACCENT_GRADIENT, color: '#fff',
          padding: '8px 16px', borderRadius: 'var(--radius-full)',
          fontFamily: PJS, fontSize: '0.8rem', fontWeight: 700,
          textDecoration: 'none',
        }}>
          Buka Toko
        </Link>
      </div>

      <div className="updates-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <motion.div
            style={{
              width: 56, height: 56, borderRadius: '14px',
              background: 'var(--accent-gradient-soft, rgba(55,138,221,0.1))',
              border: '2px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: 'var(--accent, #378ADD)',
            }}
          >
            <Sparkles size={24} />
          </motion.div>
          <h2 style={{
            fontFamily: PJS, fontWeight: 800,
            fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
          }}>
            Catatan Rilis & Update Fitur
          </h2>
          <p style={{
            fontFamily: PJS, fontSize: '0.95rem',
            color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6,
          }}>
            Kami terus meningkatkan Exora untuk membantu kamu berjualan lebih baik
          </p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: '24px', height: 200 }}>
                <div style={{ height: 12, width: 80, background: 'var(--bg-secondary)', borderRadius: 4, marginBottom: 16 }} />
                <div style={{ height: 20, width: '90%', background: 'var(--bg-secondary)', borderRadius: 4, marginBottom: 12 }} />
                <div style={{ height: 12, width: '100%', background: 'var(--bg-secondary)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, width: '80%', background: 'var(--bg-secondary)', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Sparkles size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            <p style={{ fontFamily: PJS, color: 'var(--text-secondary)', fontWeight: 700 }}>
              Belum ada update fitur
            </p>
            <p style={{ fontFamily: PJS, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              Stay tuned untuk pembaruan menarik!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {updates.map((update, index) => (
              <ChangelogItem key={update.id} update={update} index={index} />
            ))}
          </div>
        )}

        {!loading && updates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card"
            style={{
              marginTop: 60, padding: '32px 24px',
              background: 'var(--accent-gradient-soft, rgba(55,138,221,0.1))',
              border: '1px solid var(--accent, #378ADD)',
              textAlign: 'center',
            }}
          >
            <TrendingUp size={32} style={{ margin: '0 auto 16px', color: 'var(--accent, #378ADD)' }} />
            <h3 style={{ fontFamily: PJS, fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Punya saran fitur baru?
            </h3>
            <p style={{ fontFamily: PJS, fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 24px 0' }}>
              Kami selalu terbuka untuk masukan dari seller
            </p>
            <a
              href={`https://wa.me/${CONFIG.ADMIN_WA}?text=${encodeURIComponent('Halo Admin Exora, saya punya saran fitur: ...')}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#25D366', color: '#fff',
                padding: '12px 24px', borderRadius: 'var(--radius-full)',
                fontFamily: PJS, fontWeight: 700, textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              <Send size={16} /> Kirim Saran via WhatsApp
            </a>
          </motion.div>
        )}
      </div>
    </div>
  )
}
