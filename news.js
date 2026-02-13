// File: api/news.js
export default async function handler(req, res) {
    const category = req.query.category || 'energi';
    
    // API Key diambil dari variabel lingkungan Vercel (sangat rahasia)
    const PEXELS_KEY = process.env.PEXELS_API_KEY;

    // Konfigurasi Kategori
    const TRUSTED_SOURCES = "+AND+(site:kompas.com+OR+site:detik.com+OR+site:cnbcindonesia.com+OR+site:bisnis.com)";
    const TOPICS = {
        energi: { rss: `https://news.google.com/rss/search?q=(energi+terbarukan+OR+migas+OR+listrik)${TRUSTED_SOURCES}&hl=id&gl=ID&ceid=ID:id`, fallbackImages: ['https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=60'] },
        pangan: { rss: `https://news.google.com/rss/search?q=(ketahanan+pangan+OR+pertanian+OR+impor+beras)${TRUSTED_SOURCES}&hl=id&gl=ID&ceid=ID:id`, fallbackImages: ['https://images.unsplash.com/photo-1500937386664-56d1dfefcb0c?w=600&q=60'] },
        bencana: { rss: `https://news.google.com/rss/search?q=(bencana+alam+OR+tanah+longsor+OR+mitigasi+bencana)${TRUSTED_SOURCES}&hl=id&gl=ID&ceid=ID:id`, fallbackImages: ['https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=600&q=60'] },
        ekonomi: { rss: `https://news.google.com/rss/search?q=(ekonomi+makro+OR+saham+IHSG+OR+investasi+OR+bisnis)${TRUSTED_SOURCES}&hl=id&gl=ID&ceid=ID:id`, fallbackImages: ['https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=60'] },
        teknologi: { rss: `https://news.google.com/rss/search?q=(teknologi+OR+startup+OR+kecerdasan+buatan+OR+aplikasi)${TRUSTED_SOURCES}&hl=id&gl=ID&ceid=ID:id`, fallbackImages: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=60'] },
        geospatial: { rss: `https://news.google.com/rss/search?q=(geospasial+OR+pemetaan+OR+satelit+OR+tata+ruang)${TRUSTED_SOURCES}&hl=id&gl=ID&ceid=ID:id`, fallbackImages: ['https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=60'] },
        kesehatan: { rss: `https://news.google.com/rss/search?q=(kesehatan+OR+biologi+OR+medis+OR+penyakit+OR+virus)${TRUSTED_SOURCES}&hl=id&gl=ID&ceid=ID:id`, fallbackImages: ['https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=60'] }
    };

    // Kamus Pintar
    const DICTIONARY = {
        'migas': 'oil rig', 'minyak': 'oil pump', 'listrik': 'electricity transmission', 'pln': 'power plant', 'batu bara': 'coal mining', 'surya': 'solar panel', 'angin': 'wind turbine',
        'beras': 'rice field', 'padi': 'rice farming', 'panen': 'agriculture harvest', 'petani': 'asian farmer', 'pupuk': 'fertilizer agriculture', 'jagung': 'corn field', 'pangan': 'food supply',
        'banjir': 'flood disaster', 'longsor': 'landslide', 'gempa': 'earthquake damage', 'tsunami': 'tsunami', 'gunung': 'volcano eruption', 'cuaca': 'bad weather',
        'saham': 'stock market graph', 'ihsg': 'stock market trading', 'rupiah': 'currency money', 'investasi': 'investment graph', 'inflasi': 'inflation', 'bisnis': 'business building', 'pajak': 'tax document',
        'ai': 'artificial intelligence brain', 'kecerdasan buatan': 'artificial intelligence robot', 'startup': 'tech startup office', 'aplikasi': 'smartphone app', 'internet': 'fiber optic internet', 'digital': 'digital technology network', 'gadget': 'smartphone tech',
        'peta': 'map navigation', 'geospasial': 'satellite earth', 'satelit': 'space satellite', 'spasial': 'digital map', 'lokasi': 'gps location pin', 'tata ruang': 'city planning map',
        'kesehatan': 'health medical', 'rumah sakit': 'hospital building', 'virus': 'virus biology', 'vaksin': 'vaccine injection', 'biologi': 'biology laboratory', 'genetik': 'dna helix', 'dna': 'dna helix structure', 'penyakit': 'sick patient clinic', 'dokter': 'doctor medical'
    };

    function getSmartKeyword(title, cat) {
        const lowerTitle = title.toLowerCase();
        for (const [indoWord, engKey] of Object.entries(DICTIONARY)) {
            if (lowerTitle.includes(indoWord)) return engKey;
        }
        if (cat === 'energi') return 'energy industry';
        if (cat === 'pangan') return 'agriculture farming';
        if (cat === 'bencana') return 'natural disaster';
        if (cat === 'ekonomi') return 'economy finance';
        if (cat === 'teknologi') return 'technology software';
        if (cat === 'geospatial') return 'topographic map';
        return 'medical science';
    }

    try {
        // 1. Ambil Berita RSS
        const rssUrl = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(TOPICS[category].rss);
        const response = await fetch(rssUrl);
        const data = await response.json();

        if (data.status !== 'ok') throw new Error("Gagal mengambil RSS");

        // 2. Tambahkan Gambar Pexels di Server (Proses Paralel agar cepat)
        const enhancedItems = await Promise.all(data.items.map(async (item, index) => {
            let finalImage = item.thumbnail || item.enclosure?.link;
            
            if (!finalImage && PEXELS_KEY) {
                const keyword = getSmartKeyword(item.title, category);
                const randomPage = Math.floor(Math.random() * 3) + 1;
                const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1&page=${randomPage}&orientation=landscape`;
                
                try {
                    const pRes = await fetch(pexelsUrl, { headers: { 'Authorization': PEXELS_KEY } });
                    if (pRes.ok) {
                        const pData = await pRes.json();
                        if (pData.photos && pData.photos.length > 0) {
                            finalImage = pData.photos[0].src.medium;
                        }
                    }
                } catch(e) { console.error("Pexels error", e); }
            }
            
            // Fallback terakhir jika Pexels gagal / limit habis
            if (!finalImage) finalImage = TOPICS[category].fallbackImages[0];
            
            // Format ulang objek agar rapi saat dikirim ke frontend
            return {
                title: item.title,
                pubDate: item.pubDate,
                link: item.link,
                imageUrl: finalImage
            };
        }));

        res.status(200).json({ status: 'ok', items: enhancedItems });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}