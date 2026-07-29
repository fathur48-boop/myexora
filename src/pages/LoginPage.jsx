import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import { CONFIG } from '../lib/config'
import { isAdminEmail } from '../lib/AdminGuard'
import toast from 'react-hot-toast'

const PJS = "'Plus Jakarta Sans', sans-serif"

const ExoraIcon = () => (
  <img 
    src="/icons/icon-512.png" 
    alt="Exora Logo" 
    style={{ 
      width: 64, 
      height: 64, 
      objectFit: 'contain' 
    }} 
  />
)

function PulseDots() {
  return (
    <>
      <style>{`
        @keyframes pulseDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
        .pulse-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg, #5b8af5, #7c6af7);
          animation: pulseDot 1.2s ease-in-out infinite;
        }
        .pulse-dot:nth-child(2) { animation-delay: 0.2s; }
        .pulse-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        <div className="pulse-dot" />
        <div className="pulse-dot" />
        <div className="pulse-dot" />
      </div>
    </>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const btnRef = useRef(null)

  useEffect(() => {
    const scriptId = 'google-gsi'
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script')
      s.id = scriptId
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = initGoogle
      document.head.appendChild(s)
    } else {
      initGoogle()
    }
  }, [])

  function initGoogle() {
    if (!window.google) return
    window.google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
    })
    if (btnRef.current) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 280,
      })
    }
  }

  async function handleCredential(response) {
    // Validasi checkbox - cek state DAN DOM
    if (!agreedToTerms) {
      const checkbox = document.querySelector('input[type="checkbox"]')
      if (!checkbox?.checked) {
        toast.error('Kamu harus menyetujui Syarat Layanan dan Kebijakan Privasi terlebih dahulu')
        return
      }
    }

    setLoading(true)
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      await loginWithGoogle({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub,
        agreedToTerms: true, // Kirim ke backend
      })
      toast.success(`Selamat datang, ${payload.name.split(' ')[0]}! 👋`)

      // Admin langsung ke panel admin, tanpa perlu bikin toko dulu
      navigate(isAdminEmail(payload.email) ? '/admin' : '/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login gagal, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      fontFamily: PJS,
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        animation: 'fadeInScale 0.4s ease',
      }}>
        {/* Card */}
        <div className="glass-card" style={{ padding: '48px 40px', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{
            width: 64, height: 64, borderRadius: '20px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
            boxShadow: '0 0 40px rgba(91,138,245,0.2)',
          }}>
            <ExoraIcon />
          </div>

          <h1 style={{ fontFamily: PJS, fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>
            Masuk ke EXORA
          </h1>
          <p style={{ fontFamily: PJS, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 36, lineHeight: 1.6, textAlign: 'center' }}>
            Login dengan akun Google untuk mulai membuka toko online kamu
          </p>

          {/* Checkbox Syarat Layanan */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              cursor: 'pointer',
              textAlign: 'left',
              padding: '12px',
              background: agreedToTerms ? 'rgba(91,138,245,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${agreedToTerms ? 'rgba(91,138,245,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12,
              transition: 'all 0.2s ease',
            }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{
                  marginTop: 3,
                  width: 18,
                  height: 18,
                  accentColor: '#5b8af5',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
              <span style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}>
                Saya setuju dengan{' '}
                <Link
                  to="/syarat-layanan"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#5b8af5',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  Syarat Layanan
                </Link>{' '}
                dan{' '}
                <Link
                  to="/kebijakan-privasi"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#5b8af5',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  Kebijakan Privasi
                </Link>{' '}
                Exora
              </span>
            </label>
            {!agreedToTerms && (
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                marginTop: 8,
                textAlign: 'center',
              }}>
                ⚠️ Centang checkbox di atas untuk melanjutkan login
              </p>
            )}
          </div>

          {/* Google button / Loading */}
          <div style={{
            position: 'relative',
            opacity: agreedToTerms ? 1 : 0.4,
            pointerEvents: agreedToTerms ? 'auto' : 'none',
            transition: 'opacity 0.3s ease',
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px' }}>
                <PulseDots />
                <p style={{ fontFamily: PJS, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Memproses login...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}>
                <div ref={btnRef} />
              </div>
            )}
          </div>

          <div className="divider" style={{ margin: '28px 0' }} />

          <p style={{ fontFamily: PJS, color: 'var(--text-tertiary)', fontSize: '0.78rem', lineHeight: 1.6, textAlign: 'center' }}>
            Data kamu aman dan tidak disebarkan.
            Kami hanya menggunakan informasi dasar dari akun Google kamu (nama, email, foto profil).
          </p>
        </div>

        {/* Back link */}
        <p style={{ fontFamily: PJS, textAlign: 'center', marginTop: 20, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
          <a href="/" style={{ color: 'var(--text-secondary)' }}>← Kembali ke beranda</a>
        </p>
      </div>
    </div>
  )
}
