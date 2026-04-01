// ============================================================
// 🧠 TUNCER ZEKA v2.0
// Türkçe Yapay Zeka Kütüphanesi
// Geliştirici & Kurucu: Ahmet Tuncer (Tuncer Lab)
// Tamamen sıfırdan, bağımlılık olmadan yazılmıştır.
// ============================================================

const TuncerZeka = (() => {

  // ... [Mevcut Matematik, SinirAgi, TurkceNLP, DuyguAnalizi, SohbetBotu, MetinSiniflandirici, KelimeVektoru, MetinOzetleyici, KNN sınıfları aynen korunmuştur] ...
  // (Kodun çok uzun olmaması adına mevcut sınıflarının kodlarının burada olduğunu varsay, yapısını hiç değiştirmedik)
  
  // Önceki sınıflarının bittiği yerden itibaren yeni modülleri ekliyoruz:

  // ============================================================
  // 🌐 İNTERNET TARAMA (Web Scraping & Fetch)
  // ============================================================
  class InternetTarama {
    constructor() {
      this.sonuclar = [];
    }

    /**
     * Wikipedia üzerinden Türkçe açık kaynaklı bilgi taraması yapar.
     * Dış bağımlılık kullanmadan yerleşik fetch API'sini kullanır.
     * @param {string} sorgu - Aranacak kelime veya cümle
     */
    async bilgiAra(sorgu) {
      try {
        // Wikipedia Açık API'si kullanımı (CORS sorunu yaratmaz)
        const url = `https://tr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(sorgu)}&utf8=&format=json&origin=*`;
        const yanit = await fetch(url);
        
        if (!yanit.ok) throw new Error('Ağ yanıtı başarısız.');
        
        const veri = await yanit.json();
        
        this.sonuclar = veri.query.search.map(snc => ({
          baslik: snc.title,
          ozet: snc.snippet.replace(/(<([^>]+)>)/gi, ""), // HTML etiketlerini temizle
          kelimeSayisi: snc.wordcount
        }));

        return this.sonuclar;
      } catch (hata) {
        console.error("Tuncer Zeka İnternet Hatası:", hata);
        return [{ baslik: "Hata", ozet: "İnternet araması başarısız oldu. Lütfen bağlantınızı kontrol edin." }];
      }
    }

    /**
     * Herhangi bir açık JSON API'sine bağlanıp veri çeker.
     */
    async ozelApiTara(url) {
      try {
        const yanit = await fetch(url);
        return await yanit.json();
      } catch (hata) {
        return { hata: "Veri çekilemedi." };
      }
    }
  }

  // ============================================================
  // 👁️ GÖRSEL TARAMA VE İŞLEME (Bilgisayarlı Görü Temelleri)
  // ============================================================
  class GorselIsleme {
    constructor() {
      // Sadece tarayıcı ortamında (Canvas API) çalıştığını doğrulamak için
      this.tarayiciOrtami = typeof document !== 'undefined';
    }

    /**
     * Bir HTML Image elementini (<img>) alır ve piksel piksel tarayarak analiz eder.
     * @param {HTMLImageElement} resimElementi 
     */
    analizEt(resimElementi) {
      if (!this.tarayiciOrtami) {
        return { hata: "Görsel tarama özelliği şu anda sadece tarayıcı (Browser) ortamında desteklenmektedir." };
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = resimElementi.naturalWidth || resimElementi.width;
      canvas.height = resimElementi.naturalHeight || resimElementi.height;
      
      ctx.drawImage(resimElementi, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let toplamR = 0, toplamG = 0, toplamB = 0;
      let karanlikPiksel = 0, aydinlikPiksel = 0;

      const pikselSayisi = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        toplamR += r;
        toplamG += g;
        toplamB += b;

        // İnsan gözünün parlaklık algısına göre (Luma) hesaplama
        const parlaklik = (r * 0.299) + (g * 0.587) + (b * 0.114);
        
        if (parlaklik > 127) aydinlikPiksel++;
        else karanlikPiksel++;
      }

      const ortalamaRenk = {
        r: Math.round(toplamR / pikselSayisi),
        g: Math.round(toplamG / pikselSayisi),
        b: Math.round(toplamB / pikselSayisi)
      };

      const genelParlaklik = (ortalamaRenk.r * 0.299) + (ortalamaRenk.g * 0.587) + (ortalamaRenk.b * 0.114);

      let gorselTipi = "Dengeli";
      if (genelParlaklik > 170) gorselTipi = "Çok Aydınlık / Aşırı Pozlanmış";
      else if (genelParlaklik < 85) gorselTipi = "Çok Karanlık";

      return {
        boyutlar: { genislik: canvas.width, yukseklik: canvas.height },
        toplamPiksel: pikselSayisi,
        ortalamaRenk: ortalamaRenk,
        genelParlaklikSkoru: Math.round(genelParlaklik),
        aydinlikOrani: Math.round((aydinlikPiksel / pikselSayisi) * 100),
        karanlikOrani: Math.round((karanlikPiksel / pikselSayisi) * 100),
        tespitEdilenTip: gorselTipi
      };
    }
  }

  // ============================================================
  // 🏗️ ANA MODÜL - TUNCER ZEKA
  // ============================================================
  const API = {
    versiyon: '2.0.0',
    isim: 'Tuncer Zeka',
    gelistirici: 'Ahmet Tuncer',
    marka: 'Tuncer Lab',

    // Sınıflar (Öncekiler + Yeniler)
    // SinirAgi,
    // TurkceNLP,
    // DuyguAnalizi,
    // SohbetBotu,
    // MetinSiniflandirici,
    // KelimeVektoru,
    // MetinOzetleyici,
    // KNN,
    // Matematik,
    InternetTarama,
    GorselIsleme,

    // Kısayol fonksiyonları (Önceki fonksiyonların aynen duruyor)
    
    /**
     * Hızlı İnternet Taraması
     */
    async bilgiAra(sorgu) {
      const internet = new InternetTarama();
      return await internet.bilgiAra(sorgu);
    },

    /**
     * Hızlı Görsel Analizi
     */
    gorselAnalizEt(resimElementi) {
      const gorsel = new GorselIsleme();
      return gorsel.analizEt(resimElementi);
    },

    /**
     * Kütüphane bilgisi
     */
    hakkinda() {
      return `
╔══════════════════════════════════════════╗
║         🧠 TUNCER ZEKA v${API.versiyon}            ║
║    Türkçe Yapay Zeka Kütüphanesi         ║
╠══════════════════════════════════════════╣
║  👨‍💻 Geliştirici : ${API.gelistirici}               ║
║  🏢 Kurum       : ${API.marka}                ║
║                                          ║
║  📦 Modüller:                            ║
║    • SinirAgi     - Yapay Sinir Ağı      ║
║    • TurkceNLP    - Doğal Dil İşleme     ║
║    • DuyguAnalizi - Duygu Analizi        ║
║    • SohbetBotu   - Chatbot              ║
║    • MetinSiniflandirici - Naive Bayes   ║
║    • KelimeVektoru - Word Embeddings     ║
║    • MetinOzetleyici - Özetleme          ║
║    • KNN          - K-En Yakın Komşu     ║
║    • InternetTarama- Açık Web Taraması   ║
║    • GorselIsleme - Piksel/Renk Analizi  ║
║                                          ║
║  🇹🇷 Tamamen Türkçe                       ║
║  📝 Sıfır bağımlılık                     ║
║  ⚡ Saf JavaScript                        ║
╚══════════════════════════════════════════╝`;
    }
  };

  return API;

})();

// Node.js modül desteği
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TuncerZeka;
}
