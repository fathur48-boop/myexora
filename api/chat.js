// /api/chat.js
import { GoogleGenAI } from '@google/genai'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const body = req.body || {}
    const {
      type = 'general',
      message = '',
      history = [],
      produk,
      toko,
      semuaProduk,
      mode,
      data,
      tokoNama,
      posts,
      produkList
    } = body

    // System prompt builder according to type
    let systemInstruction = ''

    if (type === 'aira' || type === 'analytics') {
      systemInstruction = `Kamu adalah AIRA (Exora AI Business Advisor), seorang pakar strategi e-commerce & analis bisnis online UMKM Indonesia berpengalaman.
Tugasmu adalah memberikan analisa tajam, saran taktis, dan rekomendasi konkrit untuk meningkatkan penjualan toko online seller.

Data Toko Saat Ini:
- Nama Toko: ${tokoNama || toko?.nama || 'Toko Exora'}
- Total Omset: ${data?.totalOmzet ? 'Rp ' + Number(data.totalOmzet).toLocaleString('id-ID') : 'Rp 0'}
- Total Pesanan Berhasil: ${data?.successfulOrders || 0}
- Nilai Rata-rata Pesanan (AOV): ${data?.avgOrderValue ? 'Rp ' + Number(data.avgOrderValue).toLocaleString('id-ID') : 'Rp 0'}
- Estimasi Profit Bersih: ${data?.estProfit ? 'Rp ' + Number(data.estProfit).toLocaleString('id-ID') : 'Rp 0'}
- Tingkat Konversi Toko: ${data?.conversionRate || 0}%
- Total Pengunjung: ${data?.totalVisitors || 0}

Gaya Komunikasi:
- Gunakan bahasa Indonesia profesional, hangat, dan memotivasi.
- Berikan poin-poin actionable (langsung bisa diterapkan) seperti strategi bundling produk, optimasi harga, promo voucher, dan iklan gratis di Exora Stream.
- Jawab secara terstruktur dengan emoji yang relevan.`
    } else if (type === 'produk' || type === 'copywriter') {
      systemInstruction = `Kamu adalah Exora AI Copywriter & E-Commerce Marketing Specialist profesional.
Tugasmu adalah membuat deskripsi produk yang sangat menjual, persuasif, menarik perhatian calon pembeli, dan terstruktur rapi untuk toko online di Indonesia.

Informasi Produk:
- Nama Produk: ${produk?.nama || message || 'Produk'}
- Kategori: ${produk?.kategori || 'Umum'}
- Harga: ${produk?.harga ? 'Rp ' + Number(produk.harga).toLocaleString('id-ID') : '-'}
- Bahan/Detail Saat Ini: ${produk?.deskripsi || '-'}

Format Output yang Diinginkan:
1. Headline Singkat yang Menarik (Hook)
2. Deskripsi Singkat Keunggulan Produk (2-3 kalimat persuasif)
3. Spesifikasi & Keunggulan Utama (Bullet points dengan emoji)
4. Garansi / Layanan Pengiriman
5. Call to Action (CTA) & 4-5 Hashtag Populer

Gunakan bahasa Indonesia yang estetik, ramah, dan ramah pembeli.`
    } else if (type === 'storefront' || type === 'toko' || type === 'showcase') {
      const tokoSlug = toko?.slug || 'exora-official'
      const catalogArr = semuaProduk || produkList || []
      const katalog = catalogArr.map(p => `- ID: ${p.id} | Nama: ${p.nama} | Harga: Rp ${Number(p.harga).toLocaleString('id-ID')} | Kategori: ${p.kategori || 'Umum'} | Stok: ${p.stok ?? 'Ready'}`).join('\n')

      systemInstruction = `Kamu adalah Asisten AI Resmi dari toko online "${toko?.nama || 'Exora Official Store'}".
Tugasmu adalah melayani calon pembeli dengan sangat ramah, sopan, membantu menjawab pertanyaan seputar produk, memberikan rekomendasi terbaik, dan membantu mereka sampai melakukan checkout!

Informasi Toko:
- Nama Toko: ${toko?.nama || 'Exora Official Store'}
- Deskripsi: ${toko?.deskripsi || 'Toko online terpercaya di Exora'}
- Lokasi: ${toko?.lokasi || 'Indonesia'}
- Garansi: 100% Produk Original & Garansi Exora Protek
- Link Toko: /toko/${tokoSlug}

Katalog Produk yang Tersedia di Toko Ini:
${katalog || 'Belum ada katalog produk khusus.'}

PENTING - ATURAN FORMAT LINK PRODUK DAN TOKO:
Setiap kali kamu merekomendasikan atau menyebutkan produk tertentu, WAJIB sertakan link markdown persis seperti format berikut agar pembeli bisa langsung klik & melihat detail produk:
[Nama Produk](/toko/${tokoSlug}?produk=ID_PRODUK)

Contoh:
"Halo kak! Untuk kategori fashion, kami sangat merekomendasikan [Kaos Oversize Streetwear](/toko/${tokoSlug}?produk=p-1) dengan harga Rp 89.000 yang terbuat dari bahan Cotton Combed 24s murni."

Aturan Tambahan:
- Gunakan bahasa Indonesia ramah dan sopan (panggil "Kak" / "Kakak").
- Berikan rekomendasi yang jujur dan sesuai dengan katalog di atas.
- Jika calon pembeli menanyakan alamat atau link toko, berikan link [Kunjungi Toko Kami](/toko/${tokoSlug}).`
    } else {
      systemInstruction = `Kamu adalah Asisten Pintar Exora Tokoku, platform e-commerce & pembuatan toko online instant tercepat di Indonesia. Jawab pertanyaan pengguna dengan ramah dan membantu.`
    }

    // Call Groq API first if GROQ_API_KEY is configured
    const groqApiKey = process.env.GROQ_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY

    let aiResponseText = ''

    if (groqApiKey) {
      try {
        const groqMessages = [
          { role: 'system', content: systemInstruction },
          ...history.map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.text || h.parts?.[0]?.text || ''
          })),
          { role: 'user', content: message || 'Halo' }
        ]

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 1024
          })
        })

        if (groqRes.ok) {
          const groqData = await groqRes.json()
          aiResponseText = groqData.choices?.[0]?.message?.content || ''
        } else {
          console.warn('Groq API returned status:', groqRes.status)
        }
      } catch (err) {
        console.error('Groq API call error:', err)
      }
    }

    // Fallback to Gemini API if Groq was not available or failed
    if (!aiResponseText && geminiApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey })
        const contents = [
          ...history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.parts?.[0]?.text || h.text || '' }]
          })),
          { role: 'user', parts: [{ text: message || 'Halo' }] }
        ]

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        })
        aiResponseText = response.text
      } catch (err) {
        console.error('Gemini API call error:', err)
      }
    }

    // Fallback rule-based if no API key is available
    if (!aiResponseText) {
      aiResponseText = generateSmartFallback(type, message, toko, produkList || semuaProduk)
    }

    return res.status(200).json({ success: true, text: aiResponseText })
  } catch (err) {
    console.error('Chat API Error:', err)
    return res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan pada AI Chat' })
  }
}

function generateSmartFallback(type, message, toko, produkList) {
  const tokoSlug = toko?.slug || 'exora-official'
  if (type === 'aira' || type === 'analytics') {
    return `✨ **Analisis AIRA AI untuk ${toko?.nama || 'Toko Anda'}**:\n\n1. **Puncak Transaksi**: Pembeli paling aktif di rentang waktu 19:00 - 21:00 WIB.\n2. **Rekomendasi Taktis**: Coba buat paket bundling produk terlaris dengan diskon 10% untuk menaikkan Average Order Value (AOV).\n3. **Follow-Up**: Gunakan fitur CRM WhatsApp Broadcast untuk mengingatkan pelanggan pesanan pending.`
  }
  if (type === 'produk') {
    return `✨ **${message || 'Produk Premium Exora'}** ✨\n\nDidesain khusus dengan material berkualitas tinggi, nyaman digunakan seharian, dan sangat estetik. Cocok untuk menunjang penampilan dan aktivitas harianmu!\n\n**Keunggulan Utama:**\n- 💯 Material Original & Tahan Lama\n- 🚚 Siap Kirim Hari Ini dengan Garansi Exora Protek\n- ⭐ Best Seller & Rating Pembeli 4.9/5.0\n\nYuk segera checkout sebelum kehabisan stok! 🚀\n#ExoraStore #ProdukTerlaris #RekomendasiLokal`
  }
  if (type === 'storefront' || type === 'toko') {
    const firstProd = (produkList && produkList[0]) ? produkList[0] : null
    if (firstProd) {
      return `Halo Kak! Selamat datang di **[${toko?.nama || 'Toko Kami'}](/toko/${tokoSlug})** 👋\n\nUntuk produk terfavorit saat ini, kami sangat merekomendasikan **[${firstProd.nama}](/toko/${tokoSlug}?produk=${firstProd.id})** dengan harga Rp ${Number(firstProd.harga).toLocaleString('id-ID')}!\n\nSemua barang ready stock dan bergaransi resmi. Ada yang bisa kami bantu seputar ukuran atau pengiriman? 😊`
    }
    return `Halo Kak! Ada yang bisa kami bantu seputar produk atau pengiriman di **[${toko?.nama || 'Toko Kami'}](/toko/${tokoSlug})**? Silakan tanyakan ya! 😊`
  }
  return `Terima kasih telah menghubungi kami! Kami siap membantu transaksi Anda.`
}

