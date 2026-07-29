export interface TierConfig {
  price: string
  priceNum?: number
  maxProducts: number
  maxPhotosPerProduct: number
}

export const CONFIG = {
  ADMIN_WA: '6283862720514',
  APP_NAME: 'Exora',
  APP_URL: 'https://myexora.com',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'mock_google_client_id.apps.googleusercontent.com',
  MIDTRANS_CLIENT_KEY: import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-mock',
  TIERS: {
    FREE: {
      price: 'Rp 0',
      priceNum: 0,
      maxProducts: 10,
      maxPhotosPerProduct: 2,
    },
    STARTER: {
      priceMonthly: 'Rp 49.000',
      priceMonthlyNum: 49000,
      price3Month: 'Rp 39.000',
      price3MonthNum: 39000,
      total3MonthNum: 117000,
      price: 'Rp 49.000',
      priceNum: 49000,
      maxProducts: 50,
      maxPhotosPerProduct: 4,
    },
    PRO: {
      priceMonthly: 'Rp 99.000',
      priceMonthlyNum: 99000,
      price3Month: 'Rp 79.000',
      price3MonthNum: 79000,
      total3MonthNum: 237000,
      price: 'Rp 99.000',
      priceNum: 99000,
      maxProducts: 250,
      maxPhotosPerProduct: 8,
    },
    BUSINESS: {
      priceMonthly: 'Rp 249.000',
      priceMonthlyNum: 249000,
      price3Month: 'Rp 199.000',
      price3MonthNum: 199000,
      total3MonthNum: 597000,
      price: 'Rp 249.000',
      priceNum: 249000,
      maxProducts: 999999,
      maxPhotosPerProduct: 99,
    }
  }
}

export const PLAN_FEATURES = {
  free: {
    price: 'Rp 0',
    features: [
      'Maksimal 10 Produk',
      'Upload 2 Foto per Produk',
      'Subdomain myexora.com/tokokamu',
      'Checkout Langsung via WhatsApp',
      'Fitur Audio-Video & Pengumuman Toko',
      '0% Komisi Transaksi',
    ]
  },
  starter: {
    priceMonthly: 'Rp 49.000',
    price3Month: 'Rp 39.000',
    price: 'Rp 49.000',
    features: [
      'Semua Fitur Gratis',
      'Maksimal 50 Produk & 4 Foto/Produk',
      'AIRA AI Business Advisor (10 query/hari)',
      '✨ AI Copywriter Deskripsi Produk',
      'Badge Verified Seller',
      'Statistik Ringkas Toko',
    ]
  },
  pro: {
    priceMonthly: 'Rp 99.000',
    price3Month: 'Rp 79.000',
    price: 'Rp 99.000',
    features: [
      'Semua Fitur Starter',
      'Maksimal 250 Produk & 8 Foto/Produk',
      'AIRA AI Business Advisor Unlimited',
      '🌐 Support Custom Domain Sendiri (.com)',
      '📊 Export Laporan Penjualan Excel / PDF',
      '📲 CRM WhatsApp Broadcast & Follow-Up',
      'Analitik Penjualan & Buyer Insights',
    ]
  },
  business: {
    priceMonthly: 'Rp 249.000',
    price3Month: 'Rp 199.000',
    price: 'Rp 249.000',
    features: [
      'Semua Fitur Pro',
      'Unlimited Produk & Foto',
      'Multi-Admin (Hingga 5 Staff Admin)',
      'Integrasi Ekspedisi & Resi Otomatis',
      'Custom Branding Checkout',
      'VIP Priority Support 24/7',
    ]
  }
}
