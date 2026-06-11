// Gemini AI ve istemci tarafı (mock) görüntü analizi yardımcı modülü
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

async function mockAnalyzeDataUrl(dataUrlOrFile, sampleSize = 20000) {
  let dataUrl = dataUrlOrFile
  if (dataUrlOrFile && typeof dataUrlOrFile !== 'string' && dataUrlOrFile instanceof Blob) {
    dataUrl = await fileToDataUrl(dataUrlOrFile)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const w = Math.min(img.width, 600)
        const h = Math.min(img.height, 400)
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const imgd = ctx.getImageData(0, 0, w, h)
        const data = imgd.data
        const totalPixels = w * h
        const step = Math.max(1, Math.floor(totalPixels / sampleSize))

        let darkScoreSum = 0
        let suspectCount = 0

        for (let i = 0; i < totalPixels; i += step) {
          const idx = i * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]

          const brightness = (r + g + b) / 3 / 255 // 0..1
          const darkness = 1 - brightness
          darkScoreSum += darkness

          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          const saturation = max === 0 ? 0 : (max - min) / max

          const isBrownish = (r > 80 && g > 40 && b < 120 && r > g)
          const isGrayish = (saturation < 0.15 && brightness < 0.8)
          if (isBrownish || isGrayish) suspectCount++
        }

        const avgDark = darkScoreSum / (totalPixels / step)
        const suspectRatio = suspectCount / (totalPixels / step)

        let rawScore = avgDark * 0.8 + suspectRatio * 0.6
        rawScore = Math.max(0, Math.min(1, rawScore))
        let percent = Math.round(rawScore * 110 - 5)
        percent = Math.max(0, Math.min(100, percent))

        resolve({ kirlilik_orani: percent, isMock: true })
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = (e) => reject(new Error('Görüntü yüklenemedi'))
    img.src = dataUrl
  })
}

export async function analyzeDataUrl(dataUrlOrFile) {
  let dataUrl = dataUrlOrFile;
  if (dataUrlOrFile && typeof dataUrlOrFile !== 'string' && dataUrlOrFile instanceof Blob) {
    dataUrl = await fileToDataUrl(dataUrlOrFile);
  }

  // 1. Gemini AI Analizi (Eğer API Anahtarı varsa)
  if (GEMINI_API_KEY) {
    try {
      // Data URL'den base64 kısmını ayır
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) throw new Error("Geçersiz format");

      const prompt = `Sen bir çevre kirliliği analiz yapay zekasısın. Bu fotoğrafı analiz et ve sadece aşağıdaki JSON formatında yanıt ver:
      { "kirlilik_orani": 0-100 arası sayı }
      Eğer fotoğraf temizse oranı çok düşük (0-20), kirliyse yüksek (60-100) ver. Yalnızca geçerli JSON döndür.`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 128 }
        })
      });

      if (!response.ok) throw new Error("Gemini API Hatası: " + response.status);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        if (typeof result.kirlilik_orani === 'number') {
           return { kirlilik_orani: Math.max(0, Math.min(100, result.kirlilik_orani)), isMock: false };
        }
      }
    } catch (err) {
      console.warn("Gemini AI analizi başarısız oldu (Kota/Ağ). Mock analiz motoruna geçiliyor...", err);
      // Fallthrough to mock
    }
  }

  // 2. Fallback: İstemci tarafı (Mock) Piksel Analizi
  return mockAnalyzeDataUrl(dataUrl);
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.readAsDataURL(file)
  })
}
