import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Download, Share } from 'lucide-react'

function isIos() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

// show: kontrol dari luar kapan popup ini boleh muncul.
// Contoh: <InstallPrompt show={isLoggedIn} /> — biar cuma nongol abis user login.
export default function InstallPrompt({ show = true }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [platform, setPlatform] = useState(null) // 'chrome' | 'ios' | 'firefox'
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Kalau udah keinstall, jangan munculin apa-apa
    if (isInStandaloneMode()) return

    // Event beforeinstallprompt di-capture sedini mungkin lewat inline script
    // di index.html (sebelum React sempet mount), disimpen di window.__exoraInstallEvent.
    // Ini nutup race condition dimana event fired duluan sebelum listener React kepasang.
    if (window.__exoraInstallEvent) {
      setDeferredPrompt(window.__exoraInstallEvent)
      setPlatform('chrome')
    }

    const handleInstallReady = () => {
      if (window.__exoraInstallEvent) {
        setDeferredPrompt(window.__exoraInstallEvent)
        setPlatform('chrome')
      }
    }
    window.addEventListener('exora-install-ready', handleInstallReady)

    if (isIos()) {
      setPlatform('ios')
    } else if (navigator.userAgent.toLowerCase().includes('firefox')) {
      setPlatform('firefox')
    }

    return () => {
      window.removeEventListener('exora-install-ready', handleInstallReady)
    }
  }, [])

  // Baru ditampilin kalau: parent bilang boleh (show), platform ke-detect,
  // dan (khusus chrome) prompt-nya emang ada.
  useEffect(() => {
    if (!show) {
      setVisible(false)
      return
    }
    if (isInStandaloneMode()) return
    if (platform === 'chrome' && deferredPrompt) {
      setVisible(true)
    } else if (platform === 'ios' || platform === 'firefox') {
      setVisible(true)
    }
  }, [show, platform, deferredPrompt])

  const handleInstallClick = async () => {
    if (platform === 'chrome' && deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted' || outcome === 'dismissed') {
        setVisible(false)
        setDeferredPrompt(null)
        window.__exoraInstallEvent = null
      }
      return
    }
    // iOS & Firefox gak ada native prompt, cuma toggle instruksi
  }

  const handleDismiss = () => {
    // Sengaja gak nyimpen dismiss ke localStorage lagi,
    // biar prompt selalu muncul tiap kali dibuka ulang.
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            right: '16px',
            maxWidth: '420px',
            margin: '0 auto',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '16px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Install Exora App
            </div>

            {platform === 'chrome' && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Akses lebih cepat, langsung dari home screen kamu.
              </div>
            )}

            {platform === 'ios' && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Tap <Share size={14} style={{ verticalAlign: 'middle' }} /> lalu pilih "Add to Home Screen".
              </div>
            )}

            {platform === 'firefox' && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Buka menu browser (⋮) lalu pilih "Install" atau "Add to Home Screen".
              </div>
            )}

            {platform === 'chrome' && (
              <button
                onClick={handleInstallClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Download size={14} />
                Install
              </button>
            )}
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Tutup"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
