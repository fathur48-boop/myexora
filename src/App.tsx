import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './lib/store.js'
import AdminGuard, { isAdminEmail } from './lib/AdminGuard.jsx'
// Pages
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProdukPage from './pages/ProdukPage.jsx'
import PesananPage from './pages/PesananPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import UpgradePage from './pages/UpgradePage.jsx'
import StorefrontPage from './pages/StorefrontPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import RedirectResi from './pages/RedirectResi.jsx'
import StreamPage from './components/seller/StreamPage.jsx' 
import ShowcasePage from './pages/ShowcasePage.jsx'
import LivePage from './pages/LivePage.jsx'
import LiveViewerPage from './pages/LiveViewerPage.jsx'
import InvoicePage from './pages/InvoicePage.jsx'
import BlogPage from './pages/BlogPage.jsx'
import GuidesPage from './pages/GuidesPage.jsx'
import { CONFIG } from './lib/config.js'
import HelpPage from './pages/HelpPage.jsx'
import UpdatesPage from './pages/UpdatesPage.jsx'
import ComingSoonPage from './pages/ComingSoonPage.jsx'

// ✅ TAMBAHKAN 2 IMPORT INI
import SyaratLayananPage from './pages/SyaratLayananPage.jsx'
import KebijakanPrivasiPage from './pages/KebijakanPrivasiPage.jsx'
import CrmPage from './pages/CrmPage.jsx'
import PromoPage from './pages/PromoPage.jsx'
import LacakPesananPage from './pages/LacakPesananPage.jsx'
import PesananSayaPage from './pages/PesananSayaPage.jsx'

// ✅ Install prompt PWA
import InstallPrompt from './components/InstallPrompt.jsx'

const ExoraIcon = () => {
  const [imgError, setImgError] = useState(false)
  if (!imgError) {
    return (
      <img
        src="/exora.png"
        alt="Exora"
        onError={() => setImgError(true)}
        style={{ width: 36, height: 36, objectFit: 'contain' }}
      />
    )
  }
  return (
    <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="xGradLoader" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M10 10 L42 50 L10 90 H32 L50 65 L68 90 H90 L58 50 L90 10 H68 L50 35 L32 10 Z" fill="url(#xGradLoader)" />
    </svg>
  )
}

// Route Guards
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <AppLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <AppLoader />
  if (isAuthenticated) {
    // Admin gak perlu ke /dashboard (yang minta bikin toko dulu)
    return <Navigate to={isAdminEmail(user?.email) ? '/admin' : '/dashboard'} replace />
  }
  return <>{children}</>
}

function AppLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{
        animation: 'pulse 1.5s ease-in-out infinite',
        filter: 'drop-shadow(0 0 20px rgba(91,138,245,0.5))',
      }}>
        <ExoraIcon />
      </div>
      <div className="spinner" />
    </div>
  )
}

// PageWrapper untuk animasi transisi halaman
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function usePageViewTracking() {
  const location = useLocation()
  useEffect(() => {
    if (!CONFIG?.GA_MEASUREMENT_ID || typeof (window as any).gtag !== 'function') return
    ;(window as any).gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [location.pathname, location.search])
}

export default function App() {
  const init = useAuthStore(s => s.init)
  const location = useLocation()
  usePageViewTracking() 

  useEffect(() => {
    init()
  }, [init])

  return (
    <>
      <div className="bg-mesh">
        <div className="bg-mesh-mid" />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'hot-toast-custom',
          duration: 3500,
          style: {
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      />

      {/* ✅ Install prompt PWA, muncul di semua halaman termasuk landing page */}
      <InstallPrompt />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
          <Route path="/login" element={<PublicRoute><PageWrapper><LoginPage /></PageWrapper></PublicRoute>} />
          
          {/* ✅ TAMBAHKAN 2 ROUTE INI - HARUS SEBELUM /:slug */}
          <Route path="/syarat-layanan" element={<PageWrapper><SyaratLayananPage /></PageWrapper>} />
          <Route path="/kebijakan-privasi" element={<PageWrapper><KebijakanPrivasiPage /></PageWrapper>} />

          {/* Redirect resi → toko */}
          <Route path="/r/:resi" element={<PageWrapper><RedirectResi /></PageWrapper>} />

          {/* Private (seller) & Shortcuts - MUST BE DECLARED BEFORE /:slug */}
          <Route path="/dashboard" element={<PrivateRoute><PageWrapper><DashboardPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/produk" element={<PrivateRoute><PageWrapper><ProdukPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/pesanan" element={<PrivateRoute><PageWrapper><PesananPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/stream" element={<PrivateRoute><PageWrapper><StreamPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/analytics" element={<PrivateRoute><PageWrapper><AnalyticsPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/crm" element={<PrivateRoute><PageWrapper><CrmPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/promo" element={<PrivateRoute><PageWrapper><PromoPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/settings" element={<PrivateRoute><PageWrapper><SettingsPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/live" element={<PrivateRoute><PageWrapper><LivePage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/upgrade" element={<PrivateRoute><PageWrapper><UpgradePage /></PageWrapper></PrivateRoute>} />

          {/* Shortcut redirects to dashboard */}
          <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
          <Route path="/produk" element={<Navigate to="/dashboard/produk" replace />} />
          <Route path="/pesanan" element={<Navigate to="/dashboard/pesanan" replace />} />
          <Route path="/stream" element={<Navigate to="/dashboard/stream" replace />} />
          <Route path="/crm" element={<Navigate to="/dashboard/crm" replace />} />
          <Route path="/promo" element={<Navigate to="/dashboard/promo" replace />} />
          <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />

          {/* Storefront & Public */}
          <Route path="/lacak-pesanan" element={<PageWrapper><LacakPesananPage /></PageWrapper>} />
          <Route path="/lacak" element={<Navigate to="/lacak-pesanan" replace />} />
          <Route path="/pesanan-saya" element={<PageWrapper><PesananSayaPage /></PageWrapper>} />
          <Route path="/my-orders" element={<Navigate to="/pesanan-saya" replace />} />

          <Route path="/showcase" element={<PageWrapper><ShowcasePage /></PageWrapper>} />
          <Route path="/storefront" element={<PageWrapper><StorefrontPage /></PageWrapper>} />
          <Route path="/invoice/:orderId" element={<InvoicePage />} />
          <Route path="/:slug/live" element={<PageWrapper><LiveViewerPage /></PageWrapper>} />
          <Route path="/:slug" element={<PageWrapper><StorefrontPage /></PageWrapper>} />
          <Route path="/academy" element={<PageWrapper><ComingSoonPage title="Akademi Seller" /></PageWrapper>} />
          <Route path="/stories" element={<PageWrapper><ComingSoonPage title="Kisah Sukses" /></PageWrapper>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminGuard><PageWrapper><AdminPage /></PageWrapper></AdminGuard>} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/guides/:slug" element={<GuidesPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/help/:slug" element={<HelpPage />} />
          <Route path="/updates" element={<UpdatesPage />} />

          {/* 404 */}
          <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
