import { useEffect } from 'react'

/**
 * SeoMeta - Helper component to dynamically inject OpenGraph, Twitter,
 * and Document Meta tags for WhatsApp & Social Media Sharing previews.
 */
export default function SeoMeta({
  title = 'Exora — Solusi Toko Online Instant Terdepan',
  description = 'Buat toko online sendiri dalam 1 menit, langsung jualan di WhatsApp, Instagram & TikTok dengan Exora.',
  image = 'https://myexora.com/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : 'https://myexora.com',
  type = 'website',
  price,
  currency = 'IDR'
}) {
  useEffect(() => {
    // 1. Update Document Title
    const fullTitle = title.includes('Exora') ? title : `${title} | Exora`
    document.title = fullTitle

    // Helper to update or create meta tag
    const setMetaTag = (selector, attributeName, attributeValue, content) => {
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attributeName, attributeValue)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content || '')
    }

    // Standard Meta
    setMetaTag('meta[name="description"]', 'name', 'description', description)

    // OpenGraph
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', image)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', url)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', type)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Exora')

    // Optional Product Meta for OpenGraph
    if (price) {
      setMetaTag('meta[property="product:price:amount"]', 'property', 'product:price:amount', String(price))
      setMetaTag('meta[property="product:price:currency"]', 'property', 'product:price:currency', currency)
    }

    // Twitter Card
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image)
  }, [title, description, image, url, type, price, currency])

  return null
}
