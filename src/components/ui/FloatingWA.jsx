import React from 'react'
import { MessageCircle } from 'lucide-react'
import { CONFIG } from '../../lib/config'

export default function FloatingWA() {
  const waUrl = `https://wa.me/${CONFIG.ADMIN_WA}?text=${encodeURIComponent('Halo Admin Exora, saya mau bertanya tentang platform Exora.')}`

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat WhatsApp Admin"
      className="floating-wa-btn"
      style={{
        position: 'fixed',
        bottom: 80,
        right: 18,
        zIndex: 90,
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: '#25D366',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(37, 211, 102, 0.45)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <MessageCircle size={24} />
    </a>
  )
}
