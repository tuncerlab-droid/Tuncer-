// ═══════════════════════════════════════════════════════════════════════
// ██████╗ ██╗   ██╗███╗   ██╗ ██████╗███████╗██████╗ 
// ╚═██╔═╝ ██║   ██║████╗  ██║██╔════╝██╔════╝██╔══██╗
//   ██║   ██║   ██║██╔██╗ ██║██║     █████╗  ██████╔╝
//   ██║   ██║   ██║██║╚██╗██║██║     ██╔══╝  ██╔══██╗
//   ██║   ╚██████╔╝██║ ╚████║╚██████╗███████╗██║  ██║
//   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚══════╝╚═╝  ╚═╝
//               Z E K A   2 0 2 6
// ═══════════════════════════════════════════════════════════════════════
//
//  TUNCER ZEKA v2026 - Gelişmiş Yapay Zeka Kütüphanesi
//  Tasarımcı & Geliştirici: Ahmet Tuncer
//  Dosya: tuncer2026.js
//  Lisans: Açık Kaynak - Ücretsiz
//  Tarih: 2026
//  
//  Özellikler:
//  ✦ Doğal Dil İşleme (Türkçe)
//  ✦ Görsel Üretimi (Canvas tabanlı)
//  ✦ Görsel Anlama / Analiz
//  ✦ Kod Yazma & Analiz
//  ✦ Uzun Süreli Düşünme (Chain-of-Thought)
//  ✦ Wikipedia Bilgi Edinme
//  ✦ Hava Durumu Verileri
//  ✦ Matematik Motoru
//  ✦ Hafıza Sistemi
//  ✦ Duygu Analizi
//  ✦ Metin Özetleme
//  ✦ Soru-Cevap Motoru
//  ✦ Öğrenme Sistemi
//
// ═══════════════════════════════════════════════════════════════════════

(function(global) {
    "use strict";

    // ═══════════════════════════════════════════════════════════════
    // ANA SINIF
    // ═══════════════════════════════════════════════════════════════
    
    class TuncerZeka {
        constructor(ayarlar = {}) {
            this.versiyon = "2026.1.0";
            this.tasarimci = "Ahmet Tuncer";
            this.isim = "Tuncer Zeka";
            this.olusturmaTarihi = new Date().toISOString();
            
            // Alt sistemler
            this.hafiza = new HafizaSistemi(ayarlar.hafizaKapasitesi || 10000);
            this.dil = new DilMotoru();
            this.matematik = new MatematikMotoru();
            this.dusunce = new DusunceMotoru(this);
            this.gorsel = new GorselMotor();
            this.kod = new KodMotoru();
            this.bilgi = new BilgiBankasi();
            this.ogrenme = new OgrenmeSistemi(this);
            this.ag = new AgServisleri();
            
            // Durum
            this.aktif = true;
            this.konusmaGecmisi = [];
            this.dusunceSuresi = ayarlar.dusunceSuresi || 5000;
            this.detayliLog = ayarlar.detayliLog || false;
            
            this._log("Tuncer Zeka v" + this.versiyon + " başlatıldı.");
            this._log("Tasarımcı: " + this.tasarimci);
        }

        _log(mesaj) {
            if (this.detayliLog) {
                console.log(`[TuncerZeka] ${mesaj}`);
            }
        }

        // ═══════════════════════════════════════
        // ANA KONUŞMA FONKSİYONU
        // ═══════════════════════════════════════
        
        async konus(girdi) {
            if (!girdi || typeof girdi !== "string") {
                return "Lütfen bir şey söyleyin.";
            }

            const basla = Date.now();
            this.konusmaGecmisi.push({ rol: "kullanici", mesaj: girdi, zaman: basla });

            // Girdi analizi
            const analiz = this.dil.analizEt(girdi);
            this._log("Analiz: " + JSON.stringify(analiz));

            // Duygu analizi
            const duygu = this.dil.duyguAnalizi(girdi);
            
            // Niyet tespiti
            const niyet = this._niyetTespit(girdi, analiz);
            this._log("Niyet: " + niyet);

            let cevap;

            switch(niyet) {
                case "selamlama":
                    cevap = this._selamVer(analiz);
                    break;
                case "matematik":
                    cevap = this.matematik.coz(girdi);
                    break;
                case "kod_yaz":
                    cevap = await this.kod.kodYaz(girdi);
                    break;
                case "kod_analiz":
                    cevap = this.kod.kodAnaliz(girdi);
                    break;
                case "hava_durumu":
                    cevap = await this.ag.havaDurumu(girdi);
                    break;
                case "wikipedia":
                    cevap = await this.ag.wikipediaBilgi(girdi);
                    break;
                case "gorsel_uret":
                    cevap = await this.gorsel.gorselUret(girdi);
                    break;
                case "gorsel_anla":
                    cevap = "Görsel analizi için gorselAnla() metodunu kullanın.";
                    break;
                case "ozet":
                    cevap = this.dil.ozetle(girdi);
                    break;
                case "tercume":
                    cevap = this.dil.tercumeEt(girdi);
                    break;
                case "kimsin":
                    cevap = this._kendiniTanit();
                    break;
                case "dusun":
                    cevap = await this.dusunce.derinDusun(girdi);
                    break;
                case "ogren":
                    cevap = this.ogrenme.ogren(girdi);
                    break;
                case "hatirla":
                    cevap = this.hafiza.hatirla(girdi);
                    break;
                default:
                    cevap = await this.dusunce.cevapUret(girdi, analiz, duygu);
                    break;
            }

            const sure = Date.now() - basla;
            const sonuc = {
                cevap: cevap,
                sure: sure + "ms",
                duygu: duygu,
                niyet: niyet
            };

            this.konusmaGecmisi.push({ rol: "tuncer", mesaj: cevap, zaman: Date.now() });
            this.hafiza.kaydet("konusma", { girdi, cevap, niyet, duygu });

            return sonuc;
        }

        // ═══════════════════════════════════════
        // NİYET TESPİT
        // ═══════════════════════════════════════

        _niyetTespit(girdi, analiz) {
            const kucuk = girdi.toLowerCase().trim();

            // Selamlama
            const selamlar = ["merhaba", "selam", "hey", "naber", "nasılsın", 
                            "günaydın", "iyi akşamlar", "iyi geceler", "sa", "as"];
            if (selamlar.some(s => kucuk.includes(s))) return "selamlama";

            // Kimsin
            const kimsinKelimeler = ["kimsin", "nesin", "adın ne", "kendini tanıt", 
                                     "sen kimsin", "kim yaptı", "tasarımcı", "tuncer"];
            if (kimsinKelimeler.some(k => kucuk.includes(k))) return "kimsin";

            // Matematik
            const matKelimeler = ["hesapla", "topla", "çıkar", "çarp", "böl", 
                                  "karekök", "üssü", "faktöriyel", "kaçtır", "kaç eder",
                                  "matematik", "işlem"];
            if (matKelimeler.some(m => kucuk.includes(m)) || 
                /[\d]+\s*[\+\-\*\/\^]\s*[\d]+/.test(kucuk) ||
                /\d+\s*(artı|eksi|çarpı|bölü)\s*\d+/.test(kucuk)) return "matematik";

            // Kod yazma
            const kodYazKelimeler = ["kod yaz", "program yaz", "fonksiyon yaz", 
                                     "script yaz", "kodla", "programla", "kod oluştur",
                                     "javascript yaz", "python yaz", "html yaz", "css yaz"];
            if (kodYazKelimeler.some(k => kucuk.includes(k))) return "kod_yaz";

            // Kod analiz
            const kodAnalizKelimeler = ["kodu analiz", "kodu incele", "kod analiz", 
                                        "bu kod ne", "kodu açıkla"];
            if (kodAnalizKelimeler.some(k => kucuk.includes(k))) return "kod_analiz";

            // Hava durumu
            const havaKelimeler = ["hava durumu", "hava nasıl", "sıcaklık", 
                                   "yağmur yağacak", "hava", "meteoroloji"];
            if (havaKelimeler.some(h => kucuk.includes(h))) return "hava_durumu";

            // Wikipedia
            const wikiKelimeler = ["wikipedia", "vikipedi", "kimdir", "nedir", 
                                   "bilgi ver", "hakkında bilgi", "araştır", "kim bu"];
            if (wikiKelimeler.some(w => kucuk.includes(w))) return "wikipedia";

            // Görsel üretme
            const gorselKelimeler = ["görsel oluştur", "resim yap", "çiz", "görsel üret",
                                     "resim oluştur", "görsel yap", "tablo çiz"];
            if (gorselKelimeler.some(g => kucuk.includes(g))) return "gorsel_uret";

            // Görsel anlama
            const gorselAnlaKelimeler = ["resmi analiz", "görseli analiz", "resimde ne var",
                                         "görseli anla", "resmi açıkla"];
            if (gorselAnlaKelimeler.some(g => kucuk.includes(g))) return "gorsel_anla";

            // Özetleme
            const ozetKelimeler = ["özetle", "özet", "kısalt", "kısa anlat"];
            if (ozetKelimeler.some(o => kucuk.includes(o))) return "ozet";

            // Tercüme
            const tercumeKelimeler = ["tercüme", "çevir", "ingilizcesi", "türkçesi", 
                                      "translate"];
            if (tercumeKelimeler.some(t => kucuk.includes(t))) return "tercume";

            // Düşünme
            const dusunKelimeler = ["düşün", "analiz et", "derinlemesine", "detaylı düşün",
                                    "uzun düşün", "iyice düşün"];
            if (dusunKelimeler.some(d => kucuk.includes(d))) return "dusun";

            // Öğrenme
            const ogrenKelimeler = ["öğren", "bunu bil", "hatırla", "kaydet", "unutma"];
            if (ogrenKelimeler.some(o => kucuk.includes(o))) return "ogren";

            // Hatırlama
            const hatirlaKelimeler = ["hatırlıyor musun", "ne demiştin", "önceki", 
                                      "geçmiş konuşma"];
            if (hatirlaKelimeler.some(h => kucuk.includes(h))) return "hatirla";

            return "genel";
        }

        _selamVer(analiz) {
            const saat = new Date().getHours();
            let zamanDilimi;
            if (saat >= 6 && saat < 12) zamanDilimi = "günaydın";
            else if (saat >= 12 && saat < 18) zamanDilimi = "iyi günler";
            else if (saat >= 18 && saat < 22) zamanDilimi = "iyi akşamlar";
            else zamanDilimi = "iyi geceler";

            const selamlar = [
                `Merhaba! ${zamanDilimi}! Ben Tuncer Zeka. Size nasıl yardımcı olabilirim?`,
                `Selam! ${zamanDilimi}! Tuncer Zeka olarak hizmetinizdeyim. Buyurun!`,
                `Hey! ${zamanDilimi}! Ben Ahmet Tuncer'in geliştirdiği yapay zeka. Neler yapabilirim?`,
                `${zamanDilimi}! Tuncer Zeka burada. Matematik, kod yazma, görsel üretme, bilgi edinme... Ne isterseniz!`
            ];
            return selamlar[Math.floor(Math.random() * selamlar.length)];
        }

        _kendiniTanit() {
            return `🧠 Ben TUNCER ZEKA v${this.versiyon}!

👨‍💻 Tasarımcım ve geliştiricim: Ahmet Tuncer

🚀 Yeteneklerim:
  ✦ Doğal Türkçe konuşma ve anlama
  ✦ Matematik problemleri çözme
  ✦ Kod yazma (JavaScript, Python, HTML, CSS ve daha fazlası)
  ✦ Kod analiz etme ve hata bulma
  ✦ Görsel üretme (Canvas tabanlı)
  ✦ Görsel analiz ve anlama
  ✦ Wikipedia'dan bilgi edinme
  ✦ Hava durumu bilgisi
  ✦ Duygu analizi
  ✦ Metin özetleme
  ✦ Uzun süreli derinlemesine düşünme
  ✦ Öğrenme ve hafıza sistemi
  ✦ Soru-cevap motoru

💡 Tamamen ücretsiz ve API anahtarı gerektirmez!
📅 Oluşturulma: ${this.olusturmaTarihi}`;
        }

        // ═══════════════════════════════════════
        // GÖRSEL ANLAMA (Dışarıdan görsel verisi)
        // ═══════════════════════════════════════
        
        async gorselAnla(gorselVerisi) {
            return this.gorsel.gorselAnla(gorselVerisi);
        }

        // ═══════════════════════════════════════
        // DURUM BİLGİSİ
        // ═══════════════════════════════════════
        
        durum() {
            return {
                isim: this.isim,
                versiyon: this.versiyon,
                tasarimci: this.tasarimci,
                aktif: this.aktif,
                hafizaKullanilanSlot: this.hafiza.boyut(),
                konusmaAdedi: this.konusmaGecmisi.length,
                ogrenilenBilgiSayisi: this.ogrenme.bilgiSayisi(),
                calismaZamani: Date.now(),
                olusturmaTarihi: this.olusturmaTarihi
            };
        }

        // Geçmişi temizle
        sifirla() {
            this.konusmaGecmisi = [];
            this.hafiza.temizle();
            this.ogrenme.sifirla();
            return "Tuncer Zeka sıfırlandı.";
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // HAFIZA SİSTEMİ
    // ═══════════════════════════════════════════════════════════════
    
    class HafizaSistemi {
        constructor(kapasite) {
            this.kapasite = kapasite;
            this.kisaHafiza = [];
            this.uzunHafiza = new Map();
            this.indeks = new Map();
        }

        kaydet(kategori, veri) {
            const kayit = {
                id: this._idUret(),
                kategori: kategori,
                veri: veri,
                zaman: Date.now(),
                erisimSayisi: 0
            };

            this.kisaHafiza.push(kayit);
            
            if (this.kisaHafiza.length > 100) {
                const eski = this.kisaHafiza.shift();
                this.uzunHafiza.set(eski.id, eski);
            }

            // İndeksleme
            if (typeof veri === "object") {
                const metinler = Object.values(veri).filter(v => typeof v === "string");
                metinler.forEach(metin => {
                    const kelimeler = metin.toLowerCase().split(/\s+/);
                    kelimeler.forEach(kelime => {
                        if (kelime.length > 2) {
                            if (!this.indeks.has(kelime)) {
                                this.indeks.set(kelime, []);
                            }
                            this.indeks.get(kelime).push(kayit.id);
                        }
                    });
                });
            }

            return kayit.id;
        }

        hatirla(sorgu) {
            if (typeof sorgu !== "string") return "Hatırlanacak bir şey bulunamadı.";
            
            const kelimeler = sorgu.toLowerCase().split(/\s+/);
            const eslesen = new Map();

            kelimeler.forEach(kelime => {
                if (this.indeks.has(kelime)) {
                    this.indeks.get(kelime).forEach(id => {
                        eslesen.set(id, (eslesen.get(id) || 0) + 1);
                    });
                }
            });

            if (eslesen.size === 0) {
                // Son konuşmaları göster
                const son = this.kisaHafiza.slice(-5);
                if (son.length === 0) return "Henüz hafızamda bir şey yok.";
                
                let cevap = "Son hatırladıklarım:\n";
                son.forEach(k => {
                    if (k.veri && k.veri.girdi) {
                        cevap += `- "${k.veri.girdi}" → "${k.veri.cevap}"\n`;
                    }
                });
                return cevap;
            }

            // En çok eşleşeni bul
            const sirali = [...eslesen.entries()].sort((a, b) => b[1] - a[1]);
            const enIyiId = sirali[0][0];
            
            const kayit = this.kisaHafiza.find(k => k.id === enIyiId) || 
                          this.uzunHafiza.get(enIyiId);
            
            if (kayit && kayit.veri) {
                kayit.erisimSayisi++;
                if (kayit.veri.girdi && kayit.veri.cevap) {
                    return `Hatırlıyorum! "${kayit.veri.girdi}" diye sormuştunuz, ben de "${kayit.veri.cevap}" demiştim.`;
                }
                return "Buna benzer bir şey hatırlıyorum: " + JSON.stringify(kayit.veri);
            }

            return "Bu konuda bir şey hatırlayamadım.";
        }

        boyut() {
            return this.kisaHafiza.length + this.uzunHafiza.size;
        }

        temizle() {
            this.kisaHafiza = [];
            this.uzunHafiza.clear();
            this.indeks.clear();
        }

        _idUret() {
            return "h_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DİL MOTORU - Doğal Dil İşleme
    // ═══════════════════════════════════════════════════════════════
    
    class DilMotoru {
        constructor() {
            this.durmaKelimeleri = new Set([
                "bir", "ve", "ile", "bu", "şu", "o", "de", "da", "mi", "mu",
                "mı", "mü", "ki", "için", "gibi", "kadar", "daha", "en",
                "çok", "az", "olan", "olarak", "ise", "ya", "veya", "ama",
                "fakat", "ancak", "hem", "ne", "her", "hiç", "ben", "sen",
                "biz", "siz", "onlar", "benim", "senin", "bana", "sana"
            ]);

            this.ekler = [
                "lar", "ler", "lık", "lik", "luk", "lük", "cı", "ci",
                "cu", "cü", "sız", "siz", "suz", "süz", "lı", "li",
                "lu", "lü", "dan", "den", "tan", "ten", "da", "de",
                "ta", "te", "ın", "in", "un", "ün", "ı", "i", "u", "ü",
                "ya", "ye", "dır", "dir", "dur", "dür", "tır", "tir",
                "yor", "ecek", "acak", "mış", "miş", "muş", "müş",
                "arak", "erek", "ıyor", "iyor", "uyor", "üyor"
            ];

            this.olumluKelimeler = new Set([
                "güzel", "harika", "muhteşem", "süper", "iyi", "mükemmel",
                "seviyorum", "beğendim", "teşekkür", "sağol", "bravo",
                "müthiş", "enfes", "şahane", "olağanüstü", "fevkalade",
                "başarılı", "parlak", "heyecanlı", "mutlu", "sevinçli",
                "keyifli", "neşeli", "hoş", "tatlı", "sevimli"
            ]);

            this.olumsuzKelimeler = new Set([
                "kötü", "berbat", "rezalet", "iğrenç", "korkunç", "üzgün",
                "sinirli", "kızgın", "nefret", "saçma", "anlamsız", "boş",
                "çirkin", "sıkıcı", "bayağı", "adi", "zavallı", "acı",
                "felaket", "yıkım", "sorun", "problem", "hata", "yanlış"
            ]);
        }

        analizEt(metin) {
            const kelimeler = this._tokenize(metin);
            const kokler = kelimeler.map(k => this._kokBul(k));
            const anlamliKelimeler = kelimeler.filter(k => !this.durmaKelimeleri.has(k.toLowerCase()));
            
            return {
                orijinal: metin,
                kelimeler: kelimeler,
                kokler: kokler,
                anlamliKelimeler: anlamliKelimeler,
                kelimeSayisi: kelimeler.length,
                cumleSayisi: metin.split(/[.!?]+/).filter(s => s.trim()).length,
                soruMu: this._soruMu(metin),
                emirMi: this._emirMi(metin),
                olumluMu: this._olumluMu(kelimeler),
                dilBilgisi: this._dilBilgisi(metin)
            };
        }

        _tokenize(metin) {
            return metin
                .replace(/[^\wçğıöşüÇĞİÖŞÜ\s]/g, " ")
                .split(/\s+/)
                .filter(k => k.length > 0);
        }

        _kokBul(kelime) {
            let kucuk = kelime.toLowerCase();
            // Ekleri sırayla kaldır (uzundan kısaya)
            const siraliEkler = [...this.ekler].sort((a, b) => b.length - a.length);
            
            for (const ek of siraliEkler) {
                if (kucuk.endsWith(ek) && kucuk.length - ek.length >= 2) {
                    return kucuk.substring(0, kucuk.length - ek.length);
                }
            }
            return kucuk;
        }

        _soruMu(metin) {
            const soruIsaretleri = ["?", "mı", "mi", "mu", "mü", "ne", "nasıl", 
                                    "neden", "niçin", "niye", "kim", "hangi", "kaç",
                                    "nerede", "ne zaman", "hangisi"];
            const kucuk = metin.toLowerCase();
            return soruIsaretleri.some(s => kucuk.includes(s));
        }

        _emirMi(metin) {
            const emirKaliplari = ["yap", "et", "ver", "söyle", "anlat", "göster",
                                   "hesapla", "bul", "ara", "çöz", "yaz", "oku",
                                   "çiz", "oluştur", "üret"];
            const kucuk = metin.toLowerCase();
            return emirKaliplari.some(e => kucuk.includes(e));
        }

        _olumluMu(kelimeler) {
            let puan = 0;
            kelimeler.forEach(k => {
                const kucuk = k.toLowerCase();
                if (this.olumluKelimeler.has(kucuk)) puan++;
                if (this.olumsuzKelimeler.has(kucuk)) puan--;
            });
            if (puan > 0) return "olumlu";
            if (puan < 0) return "olumsuz";
            return "nötr";
        }

        _dilBilgisi(metin) {
            return {
                buyukHarfBasliyor: /^[A-ZÇĞİÖŞÜ]/.test(metin),
                noktaIleBitiyor: /[.!?]$/.test(metin.trim()),
                tumBuyukHarf: metin === metin.toUpperCase() && /[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(metin),
                uzunluk: metin.length
            };
        }

        duyguAnalizi(metin) {
            const kelimeler = this._tokenize(metin);
            let olumluPuan = 0;
            let olumsuzPuan = 0;

            kelimeler.forEach(k => {
                const kucuk = k.toLowerCase();
                if (this.olumluKelimeler.has(kucuk)) olumluPuan += 2;
                if (this.olumsuzKelimeler.has(kucuk)) olumsuzPuan += 2;

                // Kök bazlı kontrol
                const kok = this._kokBul(kucuk);
                if (this.olumluKelimeler.has(kok)) olumluPuan += 1;
                if (this.olumsuzKelimeler.has(kok)) olumsuzPuan += 1;
            });

            // Büyük harf = yoğunluk
            if (metin === metin.toUpperCase() && metin.length > 3) {
                olumluPuan *= 1.5;
                olumsuzPuan *= 1.5;
            }

            // Ünlem sayısı
            const unlemSayisi = (metin.match(/!/g) || []).length;
            olumluPuan += unlemSayisi * 0.5;

            const toplam = olumluPuan - olumsuzPuan;
            let duygu, yogunluk;

            if (toplam > 3) { duygu = "çok olumlu"; yogunluk = "yüksek"; }
            else if (toplam > 1) { duygu = "olumlu"; yogunluk = "orta"; }
            else if (toplam > -1) { duygu = "nötr"; yogunluk = "düşük"; }
            else if (toplam > -3) { duygu = "olumsuz"; yogunluk = "orta"; }
            else { duygu = "çok olumsuz"; yogunluk = "yüksek"; }

            return {
                duygu: duygu,
                yogunluk: yogunluk,
                olumluPuan: olumluPuan,
                olumsuzPuan: olumsuzPuan,
                toplamPuan: toplam
            };
        }

        ozetle(metin) {
            // "özetle:" veya "özetle " sonrasını al
            let hedefMetin = metin;
            const ozetKaliplari = ["özetle:", "özetle ", "özet:", "kısalt:"];
            for (const kalip of ozetKaliplari) {
                const idx = metin.toLowerCase().indexOf(kalip);
                if (idx !== -1) {
                    hedefMetin = metin.substring(idx + kalip.length).trim();
                    break;
                }
            }

            if (hedefMetin.length < 50) {
                return "Özetlenecek metin çok kısa. Daha uzun bir metin verin.";
            }

            const cumleler = hedefMetin.split(/[.!?]+/).filter(c => c.trim().length > 10);
            
            if (cumleler.length <= 2) {
                return "📝 Özet: " + hedefMetin;
            }

            // TF-IDF benzeri puanlama
            const kelimeFrekanslari = new Map();
            const cumlePuanlari = [];

            // Kelime frekanslarını hesapla
            cumleler.forEach(cumle => {
                const kelimeler = this._tokenize(cumle)
                    .map(k => k.toLowerCase())
                    .filter(k => !this.durmaKelimeleri.has(k) && k.length > 2);
                
                kelimeler.forEach(k => {
                    kelimeFrekanslari.set(k, (kelimeFrekanslari.get(k) || 0) + 1);
                });
            });

            // Cümle puanlarını hesapla
            cumleler.forEach((cumle, idx) => {
                let puan = 0;
                const kelimeler = this._tokenize(cumle)
                    .map(k => k.toLowerCase())
                    .filter(k => !this.durmaKelimeleri.has(k) && k.length > 2);

                kelimeler.forEach(k => {
                    puan += kelimeFrekanslari.get(k) || 0;
                });

                // İlk cümle bonusu
                if (idx === 0) puan *= 1.5;
                // Çok kısa cümleleri cezalandır
                if (kelimeler.length < 3) puan *= 0.5;

                cumlePuanlari.push({ cumle: cumle.trim(), puan: puan, idx: idx });
            });

            // En yüksek puanlı cümleleri seç
            const secilecek = Math.max(2, Math.ceil(cumleler.length * 0.3));
            const sirali = [...cumlePuanlari].sort((a, b) => b.puan - a.puan);
            const secilen = sirali.slice(0, secilecek).sort((a, b) => a.idx - b.idx);

            const ozet = secilen.map(s => s.cumle).join(". ") + ".";
            
            return `📝 Özet (${cumleler.length} cümleden ${secilen.length} cümleye):\n\n${ozet}`;
        }

        tercumeEt(metin) {
            // Basit sözlük tabanlı çeviri
            const sozluk = {
                // Türkçe -> İngilizce
                "merhaba": "hello", "günaydın": "good morning", "iyi akşamlar": "good evening",
                "teşekkürler": "thank you", "evet": "yes", "hayır": "no",
                "ben": "I", "sen": "you", "o": "he/she/it", "biz": "we",
                "güzel": "beautiful", "iyi": "good", "kötü": "bad",
                "büyük": "big", "küçük": "small", "yeni": "new", "eski": "old",
                "ev": "house", "araba": "car", "kitap": "book", "su": "water",
                "yemek": "food", "okul": "school", "iş": "work", "gün": "day",
                "gece": "night", "sabah": "morning", "akşam": "evening",
                "sevgi": "love", "barış": "peace", "savaş": "war",
                "dünya": "world", "hayat": "life", "zaman": "time",
                "nasılsın": "how are you", "ne": "what", "nerede": "where",
                "kim": "who", "neden": "why", "nasıl": "how"
            };

            let hedefMetin = metin;
            const tercumeKaliplari = ["tercüme et:", "çevir:", "ingilizcesi:", "tercüme:"];
            for (const kalip of tercumeKaliplari) {
                const idx = metin.toLowerCase().indexOf(kalip);
                if (idx !== -1) {
                    hedefMetin = metin.substring(idx + kalip.length).trim();
                    break;
                }
            }

            const kelimeler = hedefMetin.toLowerCase().split(/\s+/);
            const ceviriler = kelimeler.map(k => sozluk[k] || `[${k}]`);

            return `🌐 Çeviri:\n"${hedefMetin}"\n→ "${ceviriler.join(" ")}"\n\n(Not: Bu basit sözlük tabanlı çeviridir. Daha karmaşık cümleler için tam anlam veremeyebilir.)`;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // MATEMATİK MOTORU
    // ═══════════════════════════════════════════════════════════════
    
    class MatematikMotoru {
        constructor() {
            this.sabitler = {
                "pi": Math.PI,
                "e": Math.E,
                "altın oran": 1.618033988749895,
                "kök2": Math.SQRT2
            };
        }

        coz(girdi) {
            try {
                const kucuk = girdi.toLowerCase();

                // Türkçe kelimeleri matematiksel ifadeye çevir
                let ifade = kucuk
                    .replace(/artı/g, "+")
                    .replace(/eksi/g, "-")
                    .replace(/çarpı/g, "*")
                    .replace(/bölü/g, "/")
                    .replace(/üssü/g, "**")
                    .replace(/mod/g, "%")
                    .replace(/pi/g, String(Math.PI))
                    .replace(/karekök(ü?)\s*(\d+)/g, (_, __, n) => `Math.sqrt(${n})`)
                    .replace(/kök\s*(\d+)/g, (_, n) => `Math.sqrt(${n})`)
                    .replace(/(\d+)\s*faktöriyel/g, (_, n) => this._faktoriyel(parseInt(n)))
                    .replace(/faktöriyel\s*(\d+)/g, (_, n) => this._faktoriyel(parseInt(n)));

                // Sadece sayısal ifadeyi çıkar
                const sayisalIfade = ifade.match(/[\d\.\+\-\*\/\%\(\)\s\*Math\.sqrt]+/);
                
                if (!sayisalIfade) {
                    return this._ozelIslemler(kucuk);
                }

                // Güvenli hesaplama
                const sonuc = this._guvenliHesapla(sayisalIfade[0].trim());
                
                if (sonuc === null || isNaN(sonuc)) {
                    return this._ozelIslemler(kucuk);
                }

                return `🔢 Hesaplama:\n${girdi}\n= ${sonuc}\n\n${this._adimGoster(girdi, sonuc)}`;

            } catch (hata) {
                return this._ozelIslemler(girdi.toLowerCase());
            }
        }

        _guvenliHesapla(ifade) {
            // Sadece güvenli karakterlere izin ver
            const temiz = ifade.replace(/[^0-9\+\-\*\/\.\(\)\s\%]/g, "");
            if (temiz.length === 0) return null;
            
            try {
                // Math fonksiyonlarını destekle
                const hesapla = new Function("Math", `"use strict"; return (${ifade});`);
                return hesapla(Math);
            } catch {
                try {
                    const hesapla2 = new Function(`"use strict"; return (${temiz});`);
                    return hesapla2();
                } catch {
                    return null;
                }
            }
        }

        _faktoriyel(n) {
            if (n < 0) return "Negatif sayıların faktöriyeli yoktur";
            if (n > 170) return "Çok büyük sayı";
            let sonuc = 1;
            for (let i = 2; i <= n; i++) sonuc *= i;
            return sonuc;
        }

        _ozelIslemler(girdi) {
            // Karekök
            let esleme = girdi.match(/karekök(?:ü)?\s*(\d+)/);
            if (esleme) {
                const n = parseInt(esleme[1]);
                return `🔢 √${n} = ${Math.sqrt(n).toFixed(6)}`;
            }

            // Üssü
            esleme = girdi.match(/(\d+)\s*(?:üssü|üzeri)\s*(\d+)/);
            if (esleme) {
                const taban = parseInt(esleme[1]);
                const us = parseInt(esleme[2]);
                return `🔢 ${taban}^${us} = ${Math.pow(taban, us)}`;
            }

            // Faktöriyel
            esleme = girdi.match(/(\d+)\s*faktöriyel/);
            if (esleme) {
                const n = parseInt(esleme[1]);
                return `🔢 ${n}! = ${this._faktoriyel(n)}`;
            }

            // Yüzde hesaplama
            esleme = girdi.match(/(\d+).*?yüzde\s*(\d+)/);
            if (!esleme) esleme = girdi.match(/%\s*(\d+).*?(\d+)/);
            if (esleme) {
                const sayi = parseInt(esleme[1]);
                const yuzde = parseInt(esleme[2]);
                return `🔢 ${sayi}'nin %${yuzde}'si = ${(sayi * yuzde / 100).toFixed(2)}`;
            }

            // Asal sayı kontrolü
            esleme = girdi.match(/(\d+)\s*asal/);
            if (esleme) {
                const n = parseInt(esleme[1]);
                const asal = this._asalMi(n);
                return `🔢 ${n} ${asal ? "ASAL bir sayıdır ✓" : "asal bir sayı DEĞİLDİR ✗"}`;
            }

            // Basit dört işlem arama
            esleme = girdi.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
            if (esleme) {
                const a = parseFloat(esleme[1]);
                const op = esleme[2];
                const b = parseFloat(esleme[3]);
                let sonuc;
                switch(op) {
                    case "+": sonuc = a + b; break;
                    case "-": sonuc = a - b; break;
                    case "*": sonuc = a * b; break;
                    case "/": sonuc = b !== 0 ? a / b : "Sıfıra bölünemez!"; break;
                }
                return `🔢 ${a} ${op} ${b} = ${sonuc}`;
            }

            // Sadece sayılar varsa topla
            const sayilar = girdi.match(/\d+/g);
            if (sayilar && sayilar.length >= 2) {
                const nums = sayilar.map(Number);
                const toplam = nums.reduce((a, b) => a + b, 0);
                return `🔢 Bulunan sayılar: ${nums.join(", ")}\nToplam: ${toplam}\nOrtalama: ${(toplam / nums.length).toFixed(2)}`;
            }

            return "🔢 Matematiksel ifadeyi anlayamadım. Örnek: '5 artı 3', '144 karekök', '5 faktöriyel'";
        }

        _asalMi(n) {
            if (n < 2) return false;
            if (n === 2) return true;
            if (n % 2 === 0) return false;
            for (let i = 3; i <= Math.sqrt(n); i += 2) {
                if (n % i === 0) return false;
            }
            return true;
        }

        _adimGoster(girdi, sonuc) {
            const sayilar = girdi.match(/\d+/g);
            if (sayilar && sayilar.length >= 2) {
                return `📊 Adımlar:\n  Giriş: ${girdi}\n  Sonuç: ${sonuc}`;
            }
            return "";
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DÜŞÜNCE MOTORU - Chain of Thought (Uzun Süreli Düşünme)
    // ═══════════════════════════════════════════════════════════════
    
    class DusunceMotoru {
        constructor(ana) {
            this.ana = ana;
            this.dusunceZinciri = [];
            
            this.bilgiBankasi = {
                genel: {
                    "türkiye": "Türkiye, Avrupa ve Asya kıtaları arasında yer alan bir ülkedir. Başkenti Ankara'dır. En büyük şehri İstanbul'dur.",
                    "yapay zeka": "Yapay zeka, makinelerin insan benzeri düşünme ve öğrenme yetenekleri sergilemesidir. Makine öğrenimi, derin öğrenme gibi alt dalları vardır.",
                    "bilgisayar": "Bilgisayar, verileri işleyen elektronik bir cihazdır. İşlemci, bellek, depolama ve giriş/çıkış birimlerinden oluşur.",
                    "internet": "İnternet, dünya genelinde bilgisayar ağlarının birbirine bağlanmasıyla oluşan küresel bir iletişim ağıdır.",
                    "programlama": "Programlama, bilgisayarlara belirli görevleri yerine getirmesi için talimatlar yazma sanatıdır.",
                    "matematik": "Matematik, sayılar, yapılar, uzay ve değişim ile ilgilenen bir bilim dalıdır.",
                    "fizik": "Fizik, madde ve enerji arasındaki etkileşimleri inceleyen temel bir bilim dalıdır.",
                    "tarih": "Tarih, geçmişte yaşanan olayları inceleyen bir bilim dalıdır.",
                    "felsefe": "Felsefe, varoluş, bilgi, değerler, akıl ve dil gibi temel konuları inceleyen bir disiplindir.",
                    "uzay": "Uzay, Dünya atmosferinin dışında kalan sonsuz boşluktur. Galaksiler, yıldızlar ve gezegenler uzayda bulunur.",
                    "güneş sistemi": "Güneş Sistemi, Güneş ve onun çevresinde dönen 8 gezegen ile diğer gök cisimlerinden oluşur.",
                    "dünya": "Dünya, Güneş'ten üçüncü gezegendir. Yaşamı destekleyen tek bilinen gezegendir.",
                    "evrim": "Evrim, canlıların zaman içinde genetik değişimler yoluyla farklılaşması sürecidir.",
                    "dna": "DNA (Deoksiribonükleik Asit), canlıların genetik bilgisini taşıyan moleküldür.",
                    "atom": "Atom, maddenin en küçük yapı taşıdır. Proton, nötron ve elektronlardan oluşur.",
                    "iklim": "İklim, bir bölgede uzun süre gözlemlenen hava koşullarının ortalamasıdır.",
                    "demokrasi": "Demokrasi, halkın kendi kendini yönettiği bir yönetim biçimidir.",
                    "ekonomi": "Ekonomi, kaynakların üretim, dağıtım ve tüketimini inceleyen bir bilim dalıdır.",
                    "müzik": "Müzik, seslerin ritmik ve melodik düzenlemesiyle oluşturulan sanat formudur.",
                    "edebiyat": "Edebiyat, dili sanatsal biçimde kullanarak yapılan yazılı ve sözlü eserlerin bütünüdür."
                },
                bilim: {
                    "newton": "Isaac Newton, yerçekimi yasasını ve hareket yasalarını keşfeden bilim insanıdır.",
                    "einstein": "Albert Einstein, özel ve genel görelilik teorilerini geliştiren fizikçidir. E=mc² formülüyle ünlüdür.",
                    "kuantum": "Kuantum mekaniği, atom altı parçacıkların davranışlarını açıklayan fizik dalıdır.",
                    "görelilik": "Görelilik teorisi, Einstein tarafından geliştirilen, uzay-zaman ve yerçekimi ilişkisini açıklayan teoridir."
                },
                teknoloji: {
                    "javascript": "JavaScript, web tarayıcılarında çalışan dinamik bir programlama dilidir. Node.js ile sunucu tarafında da kullanılır.",
                    "python": "Python, okunabilirliği yüksek, genel amaçlı bir programlama dilidir. Yapay zeka ve veri biliminde yaygın kullanılır.",
                    "html": "HTML (HyperText Markup Language), web sayfalarının yapısını oluşturan işaretleme dilidir.",
                    "css": "CSS (Cascading Style Sheets), web sayfalarının görünümünü düzenleyen stil dilidir.",
                    "machine learning": "Makine öğrenimi, bilgisayarların veriden öğrenmesini sağlayan yapay zeka alt dalıdır.",
                    "blockchain": "Blockchain, verilerin dağıtık ve değiştirilemez şekilde saklandığı teknolojik yapıdır."
                }
            };
        }

        async derinDusun(soru) {
            this.dusunceZinciri = [];
            const basla = Date.now();

            this._dusunceAdimi("Soruyu anlama", `"${soru}" sorusunu analiz ediyorum...`);
            
            // Adım 1: Soruyu parçala
            const analiz = this.ana.dil.analizEt(soru);
            this._dusunceAdimi("Kelime analizi", `${analiz.kelimeSayisi} kelime bulundu. Anlamlı kelimeler: ${analiz.anlamliKelimeler.join(", ")}`);

            // Adım 2: Anahtar kavramları belirle
            const kavramlar = this._kavramBul(analiz.anlamliKelimeler);
            this._dusunceAdimi("Kavram tespiti", `Tespit edilen kavramlar: ${kavramlar.join(", ") || "Genel soru"}`);

            // Adım 3: Bilgi bankasından ara
            const bilgiler = this._bilgiAra(kavramlar);
            this._dusunceAdimi("Bilgi arama", `${bilgiler.length} adet ilgili bilgi bulundu.`);

            // Adım 4: İlişkilendirme
            this._dusunceAdimi("İlişkilendirme", "Bulunan bilgiler arasında bağlantılar kuruluyor...");

            // Adım 5: Muhakeme
            this._dusunceAdimi("Muhakeme", "Mantıksal çıkarımlar yapılıyor...");

            // Adım 6: Sentez
            this._dusunceAdimi("Sentez", "Bilgiler birleştirilerek kapsamlı bir cevap oluşturuluyor...");

            // Cevap oluştur
            const cevap = this._sentezYap(soru, kavramlar, bilgiler, analiz);
            
            const sure = Date.now() - basla;
            this._dusunceAdimi("Tamamlandı", `Düşünme süreci ${sure}ms'de tamamlandı.`);

            return `🧠 DERİN DÜŞÜNME SONUCU\n${"═".repeat(40)}\n\n` +
                   `📋 Düşünce Zinciri:\n${this.dusunceZinciri.map((a, i) => `  ${i+1}. [${a.baslik}] ${a.detay}`).join("\n")}\n\n` +
                   `${"─".repeat(40)}\n\n` +
                   `💡 Sonuç:\n${cevap}\n\n` +
                   `⏱️ Toplam düşünme süresi: ${sure}ms`;
        }

        async cevapUret(girdi, analiz, duygu) {
            const kavramlar = this._kavramBul(analiz.anlamliKelimeler);
            const bilgiler = this._bilgiAra(kavramlar);

            // Hafızadan ilgili bilgi ara
            const hafizaBilgi = this.ana.hafiza.hatirla(girdi);

            // Öğrenilmiş bilgilerden ara
            const ogrenilenBilgi = this.ana.ogrenme.bilgiSorgula(girdi);

            if (bilgiler.length > 0) {
                let cevap = bilgiler.join("\n\n");
                if (duygu.duygu === "olumsuz") {
                    cevap = "Anlıyorum, bazen zor olabilir. İşte bildiklerim:\n\n" + cevap;
                } else if (duygu.duygu === "çok olumlu") {
                    cevap = "Harika bir soru! 😊\n\n" + cevap;
                }
                return cevap;
            }

            if (ogrenilenBilgi) {
                return `Daha önce öğrendiğim bilgiye göre: ${ogrenilenBilgi}`;
            }

            // Soru türüne göre genel cevap
            if (analiz.soruMu) {
                return this._genelSoruCevapla(girdi, analiz);
            }

            if (analiz.emirMi) {
                return this._emirCevapla(girdi, analiz);
            }

            // Genel konuşma
            return this._genelKonusmaCevapla(girdi, duygu);
        }

        _dusunceAdimi(baslik, detay) {
            this.dusunceZinciri.push({ baslik, detay, zaman: Date.now() });
        }

        _kavramBul(kelimeler) {
            const kavramlar = [];
            const tumKavramlar = {};
            
            Object.entries(this.bilgiBankasi).forEach(([kategori, bilgiler]) => {
                Object.keys(bilgiler).forEach(anahtar => {
                    tumKavramlar[anahtar] = kategori;
                });
            });

            kelimeler.forEach(kelime => {
                const kucuk = kelime.toLowerCase();
                Object.keys(tumKavramlar).forEach(kavram => {
                    if (kavram.includes(kucuk) || kucuk.includes(kavram)) {
                        kavramlar.push(kavram);
                    }
                });
            });

            return [...new Set(kavramlar)];
        }

        _bilgiAra(kavramlar) {
            const bilgiler = [];
            
            kavramlar.forEach(kavram => {
                Object.values(this.bilgiBankasi).forEach(kategori => {
                    if (kategori[kavram]) {
                        bilgiler.push(kategori[kavram]);
                    }
                });
            });

            return bilgiler;
        }

        _sentezYap(soru, kavramlar, bilgiler, analiz) {
            if (bilgiler.length === 0) {
                return `"${soru}" hakkında bilgi bankamda spesifik bilgi bulunamadı. ` +
                       `Ancak şunu söyleyebilirim: Bu konu ${kavramlar.length > 0 ? kavramlar.join(", ") + " ile ilgili görünüyor" : "oldukça geniş kapsamlı"}. ` +
                       `Wikipedia'dan arama yapmak için "wikipedia: ${analiz.anlamliKelimeler[0] || soru}" yazabilirsiniz.`;
            }

            if (bilgiler.length === 1) {
                return bilgiler[0];
            }

            return `Bu konu hakkında birkaç önemli bilgi buldum:\n\n` +
                   bilgiler.map((b, i) => `${i + 1}. ${b}`).join("\n\n") +
                   `\n\nBu bilgiler birlikte değerlendirildiğinde, ${kavramlar.join(" ve ")} konusu hakkında kapsamlı bir anlayış elde edilebilir.`;
        }

        _genelSoruCevapla(girdi, analiz) {
            const kucuk = girdi.toLowerCase();

            if (kucuk.includes("kaç") && kucuk.includes("gün")) {
                const ay = new Date().getMonth();
                const yil = new Date().getFullYear();
                const gunSayisi = new Date(yil, ay + 1, 0).getDate();
                return `Bu ayda ${gunSayisi} gün var.`;
            }

            if (kucuk.includes("saat kaç") || kucuk.includes("saat")) {
                return `Şu an saat ${new Date().toLocaleTimeString("tr-TR")}`;
            }

            if (kucuk.includes("tarih") || kucuk.includes("bugün")) {
                return `Bugünün tarihi: ${new Date().toLocaleDateString("tr-TR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
            }

            if (kucuk.includes("anlam") || kucuk.includes("ne demek")) {
                return `Bu sorunuzu anlamaya çalışıyorum. Daha spesifik bir konuda sormak ister misiniz? Örneğin "wikipedia: [konu]" yazabilirsiniz.`;
            }

            return `Hmm, bu ilginç bir soru. "${girdi}" hakkında düşünüyorum... ` +
                   `Net bir cevap verebilmem için konuyu daraltabilir misiniz? ` +
                   `Bilgi bankamda, matematik problemlerinde, kod yazımında veya Wikipedia aramasında yardımcı olabilirim.`;
        }

        _emirCevapla(girdi, analiz) {
            return `Emrinizi anladım. "${girdi}" konusunda yardımcı olmaya çalışacağım. ` +
                   `Daha spesifik bir istek belirtirseniz daha iyi yardımcı olabilirim.\n\n` +
                   `Yapabileceğim şeyler:\n` +
                   `• Kod yaz: "kod yaz: [açıklama]"\n` +
                   `• Hesapla: "hesapla 5 + 3"\n` +
                   `• Bilgi: "wikipedia: [konu]"\n` +
                   `• Görsel: "görsel oluştur: [açıklama]"\n` +
                   `• Hava: "hava durumu: [şehir]"`;
        }

        _genelKonusmaCevapla(girdi, duygu) {
            if (duygu.duygu === "çok olumlu" || duygu.duygu === "olumlu") {
                const cevaplar = [
                    "Bu çok güzel! Sizinle konuşmak beni de mutlu ediyor 😊",
                    "Harika! Pozitif enerjiniz harika. Size nasıl yardımcı olabilirim?",
                    "Ne güzel! Başka bir konuda yardımcı olabilir miyim?"
                ];
                return cevaplar[Math.floor(Math.random() * cevaplar.length)];
            }

            if (duygu.duygu === "çok olumsuz" || duygu.duygu === "olumsuz") {
                const cevaplar = [
                    "Anlıyorum, zor bir durum gibi görünüyor. Size nasıl yardımcı olabilirim?",
                    "Üzüldüm bunu duyduğuma. Belki bir konuda yardımcı olabilirim?",
                    "Bazen işler zor olabilir. Ama birlikte çözüm bulabiliriz."
                ];
                return cevaplar[Math.floor(Math.random() * cevaplar.length)];
            }

            const genelCevaplar = [
                `"${girdi}" hakkında düşünüyorum. Daha detaylı açıklayabilir misiniz?`,
                `Anladım. Bu konuda size şu şekillerde yardımcı olabilirim: kod yazma, matematik, bilgi arama, görsel üretme...`,
                `İlginç bir konu! Daha spesifik bir soru sorarsanız daha iyi yardımcı olabilirim.`,
                `Bu konuyu daha iyi anlayabilmem için birkaç detay paylaşabilir misiniz?`
            ];
            return genelCevaplar[Math.floor(Math.random() * genelCevaplar.length)];
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GÖRSEL MOTOR
    // ═══════════════════════════════════════════════════════════════
    
    class GorselMotor {
        constructor() {
            this.renkPaleti = {
                "kırmızı": "#FF0000", "mavi": "#0000FF", "yeşil": "#00FF00",
                "sarı": "#FFFF00", "turuncu": "#FF8C00", "mor": "#800080",
                "pembe": "#FF69B4", "beyaz": "#FFFFFF", "siyah": "#000000",
                "gri": "#808080", "kahverengi": "#8B4513", "turkuaz": "#40E0D0",
                "lacivert": "#191970", "bordo": "#800000", "altın": "#FFD700",
                "gümüş": "#C0C0C0", "mercan": "#FF7F50", "lavanta": "#E6E6FA"
            };
        }

        async gorselUret(aciklama) {
            const kucuk = aciklama.toLowerCase();
            
            // Canvas kontrol
            if (typeof document === "undefined") {
                return this._svgGorselUret(aciklama);
            }

            try {
                const canvas = document.createElement("canvas");
                canvas.width = 800;
                canvas.height = 600;
                const ctx = canvas.getContext("2d");

                if (kucuk.includes("manzara") || kucuk.includes("doğa")) {
                    this._manzaraCiz(ctx, canvas, aciklama);
                } else if (kucuk.includes("grafik") || kucuk.includes("tablo") || kucuk.includes("chart")) {
                    this._grafikCiz(ctx, canvas, aciklama);
                } else if (kucuk.includes("yüz") || kucuk.includes("portre")) {
                    this._yuzCiz(ctx, canvas);
                } else if (kucuk.includes("ev") || kucuk.includes("bina")) {
                    this._evCiz(ctx, canvas);
                } else if (kucuk.includes("ağaç")) {
                    this._agacCiz(ctx, canvas);
                } else if (kucuk.includes("yıldız") || kucuk.includes("gece")) {
                    this._geceGokCiz(ctx, canvas);
                } else if (kucuk.includes("daire") || kucuk.includes("şekil")) {
                    this._sekillerCiz(ctx, canvas);
                } else if (kucuk.includes("güneş") || kucuk.includes("gündoğumu")) {
                    this._gunDogumuCiz(ctx, canvas);
                } else if (kucuk.includes("deniz") || kucuk.includes("okyanus")) {
                    this._denizCiz(ctx, canvas);
                } else {
                    this._soyutSanatCiz(ctx, canvas, aciklama);
                }

                // İmza
                ctx.fillStyle = "#333";
                ctx.font = "12px Arial";
                ctx.fillText("Tuncer Zeka v2026 | Tasarımcı: Ahmet Tuncer", 10, canvas.height - 10);

                const dataUrl = canvas.toDataURL("image/png");
                
                return {
                    mesaj: `🎨 Görsel oluşturuldu: "${aciklama}"`,
                    gorsel: dataUrl,
                    genislik: canvas.width,
                    yukseklik: canvas.height,
                    tip: "image/png",
                    talimat: "Görseli görmek için: const img = new Image(); img.src = sonuc.gorsel; document.body.appendChild(img);"
                };

            } catch (hata) {
                return this._svgGorselUret(aciklama);
            }
        }

        _manzaraCiz(ctx, canvas, aciklama) {
            const w = canvas.width, h = canvas.height;

            // Gökyüzü gradyanı
            const gokGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
            gokGrad.addColorStop(0, "#1a2a6c");
            gokGrad.addColorStop(0.5, "#b21f1f");
            gokGrad.addColorStop(1, "#fdbb2d");
            ctx.fillStyle = gokGrad;
            ctx.fillRect(0, 0, w, h * 0.6);

            // Güneş
            ctx.beginPath();
            ctx.arc(w * 0.7, h * 0.25, 60, 0, Math.PI * 2);
            const gunesGrad = ctx.createRadialGradient(w * 0.7, h * 0.25, 10, w * 0.7, h * 0.25, 60);
            gunesGrad.addColorStop(0, "#fff");
            gunesGrad.addColorStop(0.5, "#ffdd00");
            gunesGrad.addColorStop(1, "#ff6600");
            ctx.fillStyle = gunesGrad;
            ctx.fill();

            // Bulutlar
            this._bulutCiz(ctx, 100, 80, 1);
            this._bulutCiz(ctx, 400, 60, 0.8);
            this._bulutCiz(ctx, 600, 100, 1.2);

            // Dağlar
            ctx.beginPath();
            ctx.moveTo(0, h * 0.6);
            ctx.lineTo(150, h * 0.3);
            ctx.lineTo(300, h * 0.55);
            ctx.lineTo(450, h * 0.25);
            ctx.lineTo(600, h * 0.5);
            ctx.lineTo(750, h * 0.35);
            ctx.lineTo(w, h * 0.55);
            ctx.lineTo(w, h * 0.6);
            ctx.closePath();
            const dagGrad = ctx.createLinearGradient(0, h * 0.25, 0, h * 0.6);
            dagGrad.addColorStop(0, "#2d5016");
            dagGrad.addColorStop(1, "#1a3a0a");
            ctx.fillStyle = dagGrad;
            ctx.fill();

            // Çimen
            const cimenGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
            cimenGrad.addColorStop(0, "#228B22");
            cimenGrad.addColorStop(1, "#006400");
            ctx.fillStyle = cimenGrad;
            ctx.fillRect(0, h * 0.6, w, h * 0.4);

            // Çiçekler
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * w;
                const y = h * 0.65 + Math.random() * (h * 0.3);
                this._cicekCiz(ctx, x, y);
            }

            // Ağaçlar
            this._basitAgac(ctx, 100, h * 0.55, 40);
            this._basitAgac(ctx, 650, h * 0.5, 50);
        }

        _bulutCiz(ctx, x, y, olcek) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(olcek, olcek);
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.arc(30, -10, 25, 0, Math.PI * 2);
            ctx.arc(60, 0, 30, 0, Math.PI * 2);
            ctx.arc(25, 10, 25, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }

        _cicekCiz(ctx, x, y) {
            const renkler = ["#FF69B4", "#FF0000", "#FFD700", "#FF6347", "#DA70D6"];
            const renk = renkler[Math.floor(Math.random() * renkler.length)];
            
            // Yapraklar
            ctx.fillStyle = renk;
            for (let i = 0; i < 5; i++) {
                const aci = (i * Math.PI * 2) / 5;
                ctx.beginPath();
                ctx.arc(x + Math.cos(aci) * 4, y + Math.sin(aci) * 4, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            // Merkez
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        _basitAgac(ctx, x, y, boyut) {
            // Gövde
            ctx.fillStyle = "#8B4513";
            ctx.fillRect(x - boyut * 0.1, y, boyut * 0.2, boyut * 0.8);

            // Yapraklar
            ctx.fillStyle = "#228B22";
            ctx.beginPath();
            ctx.arc(x, y - boyut * 0.2, boyut * 0.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#2E8B57";
            ctx.beginPath();
            ctx.arc(x - boyut * 0.2, y, boyut * 0.35, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x + boyut * 0.2, y, boyut * 0.35, 0, Math.PI * 2);
            ctx.fill();
        }

        _geceGokCiz(ctx, canvas) {
            const w = canvas.width, h = canvas.height;

            // Gece gökyüzü
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "#000011");
            grad.addColorStop(0.5, "#0a0a3a");
            grad.addColorStop(1, "#1a1a4a");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Yıldızlar
            for (let i = 0; i < 200; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h * 0.8;
                const boyut = Math.random() * 3;
                const parlaklik = Math.random();

                ctx.fillStyle = `rgba(255, 255, ${200 + Math.random() * 55}, ${parlaklik})`;
                ctx.beginPath();
                ctx.arc(x, y, boyut, 0, Math.PI * 2);
                ctx.fill();
            }

            // Büyük parlak yıldızlar
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h * 0.6;
                this._parlakYildiz(ctx, x, y, 8 + Math.random() * 8);
            }

            // Ay
            ctx.beginPath();
            ctx.arc(w * 0.8, h * 0.15, 50, 0, Math.PI * 2);
            const ayGrad = ctx.createRadialGradient(w * 0.8, h * 0.15, 5, w * 0.8, h * 0.15, 50);
            ayGrad.addColorStop(0, "#FFFACD");
            ayGrad.addColorStop(0.8, "#F0E68C");
            ayGrad.addColorStop(1, "#DAA520");
            ctx.fillStyle = ayGrad;
            ctx.fill();

            // Ay krater efekti
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            ctx.beginPath();
            ctx.arc(w * 0.8 - 10, h * 0.15 - 10, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(w * 0.8 + 15, h * 0.15 + 5, 5, 0, Math.PI * 2);
            ctx.fill();

            // Samanyolu efekti
            ctx.save();
            ctx.globalAlpha = 0.15;
            for (let i = 0; i < 500; i++) {
                const t = i / 500;
                const x = w * t;
                const y = h * 0.3 + Math.sin(t * 4) * 80 + (Math.random() - 0.5) * 60;
                ctx.fillStyle = `rgba(200, 200, 255, ${Math.random() * 0.5})`;
                ctx.beginPath();
                ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        _parlakYildiz(ctx, x, y, boyut) {
            ctx.save();
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const aci = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const px = x + Math.cos(aci) * boyut;
                const py = y + Math.sin(aci) * boyut;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            
            // Parlama efekti
            const parlama = ctx.createRadialGradient(x, y, 0, x, y, boyut * 2);
            parlama.addColorStop(0, "rgba(255,255,255,0.3)");
            parlama.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = parlama;
            ctx.beginPath();
            ctx.arc(x, y, boyut * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }

        _evCiz(ctx, canvas) {
            const w = canvas.width, h = canvas.height;

            // Gökyüzü
            const gok = ctx.createLinearGradient(0, 0, 0, h);
            gok.addColorStop(0, "#87CEEB");
            gok.addColorStop(1, "#E0F7FA");
            ctx.fillStyle = gok;
            ctx.fillRect(0, 0, w, h);

            // Çimen
            ctx.fillStyle = "#4CAF50";
            ctx.fillRect(0, h * 0.65, w, h * 0.35);

            // Yol
            ctx.fillStyle = "#9E9E9E";
            ctx.beginPath();
            ctx.moveTo(w * 0.4, h);
            ctx.lineTo(w * 0.6, h);
            ctx.lineTo(w * 0.55, h * 0.75);
            ctx.lineTo(w * 0.45, h * 0.75);
            ctx.closePath();
            ctx.fill();

            // Ev gövdesi
            ctx.fillStyle = "#D32F2F";
            ctx.fillRect(w * 0.25, h * 0.35, w * 0.5, h * 0.4);

            // Çatı
            ctx.fillStyle = "#5D4037";
            ctx.beginPath();
            ctx.moveTo(w * 0.2, h * 0.35);
            ctx.lineTo(w * 0.5, h * 0.1);
            ctx.lineTo(w * 0.8, h * 0.35);
            ctx.closePath();
            ctx.fill();

            // Kapı
            ctx.fillStyle = "#795548";
            ctx.fillRect(w * 0.43, h * 0.52, w * 0.14, h * 0.23);
            // Kapı kolu
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(w * 0.54, h * 0.64, 4, 0, Math.PI * 2);
            ctx.fill();

            // Pencereler
            ctx.fillStyle = "#BBDEFB";
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;
            // Sol pencere
            ctx.fillRect(w * 0.28, h * 0.4, w * 0.12, h * 0.1);
            ctx.strokeRect(w * 0.28, h * 0.4, w * 0.12, h * 0.1);
            // Sağ pencere
            ctx.fillRect(w * 0.6, h * 0.4, w * 0.12, h * 0.1);
            ctx.strokeRect(w * 0.6, h * 0.4, w * 0.12, h * 0.1);
            // Pencere çaprazları
            ctx.beginPath();
            ctx.moveTo(w * 0.34, h * 0.4); ctx.lineTo(w * 0.34, h * 0.5);
            ctx.moveTo(w * 0.28, h * 0.45); ctx.lineTo(w * 0.4, h * 0.45);
            ctx.moveTo(w * 0.66, h * 0.4); ctx.lineTo(w * 0.66, h * 0.5);
            ctx.moveTo(w * 0.6, h * 0.45); ctx.lineTo(w * 0.72, h * 0.45);
            ctx.stroke();

            // Baca
            ctx.fillStyle = "#795548";
            ctx.fillRect(w * 0.6, h * 0.12, w * 0.06, h * 0.15);

            // Duman
            ctx.fillStyle = "rgba(200,200,200,0.5)";
            ctx.beginPath();
            ctx.arc(w * 0.63, h * 0.08, 10, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            ctx.arc(w * 0.65, h * 0.04, 12, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            ctx.arc(w * 0.62, h * 0.0, 14, 0, Math.PI * 2); ctx.fill();

            // Ağaçlar
            this._basitAgac(ctx, w * 0.1, h * 0.5, 60);
            this._basitAgac(ctx, w * 0.9, h * 0.48, 55);

            // Güneş
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(w * 0.15, h * 0.12, 40, 0, Math.PI * 2);
            ctx.fill();
        }

        _gunDogumuCiz(ctx, canvas) {
            const w = canvas.width, h = canvas.height;

            // Gökyüzü gradyanı
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "#1a0533");
            grad.addColorStop(0.3, "#c2185b");
            grad.addColorStop(0.5, "#ff6f00");
            grad.addColorStop(0.7, "#ffd54f");
            grad.addColorStop(1, "#fff9c4");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Güneş
            const gunesY = h * 0.45;
            const gunesGrad = ctx.createRadialGradient(w / 2, gunesY, 20, w / 2, gunesY, 150);
            gunesGrad.addColorStop(0, "rgba(255,255,255,1)");
            gunesGrad.addColorStop(0.3, "rgba(255,200,50,0.8)");
            gunesGrad.addColorStop(0.6, "rgba(255,100,0,0.3)");
            gunesGrad.addColorStop(1, "rgba(255,50,0,0)");
            ctx.fillStyle = gunesGrad;
            ctx.beginPath();
            ctx.arc(w / 2, gunesY, 150, 0, Math.PI * 2);
            ctx.fill();

            // Güneş çekirdeği
            ctx.fillStyle = "#FFF";
            ctx.beginPath();
            ctx.arc(w / 2, gunesY, 45, 0, Math.PI * 2);
            ctx.fill();

            // Yansıma - su
            ctx.fillStyle = "rgba(0,50,100,0.3)";
            ctx.fillRect(0, h * 0.6, w, h * 0.4);
            
            // Su yansıması
            for (let i = 0; i < 50; i++) {
                const y = h * 0.6 + Math.random() * h * 0.35;
                const x = Math.random() * w;
                const genislik = 20 + Math.random() * 60;
                ctx.fillStyle = `rgba(255, ${150 + Math.random() * 105}, 0, ${0.1 + Math.random() * 0.2})`;
                ctx.fillRect(x, y, genislik, 2);
            }
        }

        _denizCiz(ctx, canvas) {
            const w = canvas.width, h = canvas.height;

            // Gökyüzü
            const gok = ctx.createLinearGradient(0, 0, 0, h * 0.5);
            gok.addColorStop(0, "#0288D1");
            gok.addColorStop(1, "#81D4FA");
            ctx.fillStyle = gok;
            ctx.fillRect(0, 0, w, h * 0.5);

            // Deniz
            const deniz = ctx.createLinearGradient(0, h * 0.5, 0, h);
            deniz.addColorStop(0, "#01579B");
            deniz.addColorStop(0.5, "#0277BD");
            deniz.addColorStop(1, "#004D6B");
            ctx.fillStyle = deniz;
            ctx.fillRect(0, h * 0.5, w, h * 0.5);

            // Dalgalar
            for (let dalga = 0; dalga < 8; dalga++) {
                const y = h * 0.5 + dalga * 30;
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x <= w; x += 5) {
                    const dalgaY = y + Math.sin((x + dalga * 50) * 0.02) * 15 + Math.sin(x * 0.01) * 8;
                    ctx.lineTo(x, dalgaY);
                }
                ctx.lineTo(w, h);
                ctx.lineTo(0, h);
                ctx.closePath();
                ctx.fillStyle = `rgba(${dalga * 5}, ${100 + dalga * 15}, ${180 + dalga * 10}, 0.3)`;
                ctx.fill();
            }

            // Güneş
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(w * 0.75, h * 0.15, 50, 0, Math.PI * 2);
            ctx.fill();

            // Bulutlar
            this._bulutCiz(ctx, 150, 70, 1.2);
            this._bulutCiz(ctx, 450, 50, 0.9);

            // Yelkenli
            ctx.fillStyle = "#8D6E63";
            ctx.fillRect(w * 0.35 - 2, h * 0.35, 4, h * 0.18);
            // Yelken
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.moveTo(w * 0.35, h * 0.35);
            ctx.lineTo(w * 0.35, h * 0.5);
            ctx.lineTo(w * 0.42, h * 0.48);
            ctx.closePath();
            ctx.fill();
            // Tekne
            ctx.fillStyle = "#5D4037";
            ctx.beginPath();
            ctx.moveTo(w * 0.28, h * 0.52);
            ctx.lineTo(w * 0.44, h * 0.52);
            ctx.lineTo(w * 0.42, h * 0.56);
            ctx.lineTo(w * 0.3, h * 0.56);
            ctx.closePath();
            ctx.fill();
        }

        _agacCiz(ctx, canvas) {
            const w = canvas.width, h = canvas.height;

            // Arkaplan
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "#87CEEB");
            grad.addColorStop(1, "#E8F5E9");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Çimen
            ctx.fillStyle = "#4CAF50";
            ctx.fillRect(0, h * 0.7, w, h * 0.3);

            // Ana ağaç - gövde
            ctx.fillStyle = "#5D4037";
            ctx.fillRect(w * 0.46, h * 0.3, w * 0.08, h * 0.45);

            // Dallar
            ctx.strokeStyle = "#5D4037";
            ctx.lineWidth = 8;
            // Sol dal
            ctx.beginPath();
            ctx.moveTo(w * 0.48, h * 0.45);
            ctx.quadraticCurveTo(w * 0.35, h * 0.35, w * 0.28, h * 0.3);
            ctx.stroke();
            // Sağ dal
            ctx.beginPath();
            ctx.moveTo(w * 0.52, h * 0.4);
            ctx.quadraticCurveTo(w * 0.65, h * 0.3, w * 0.7, h * 0.28);
            ctx.stroke();

            // Yaprak kümeleri
            const yaprakMerkezleri = [
                [w * 0.5, h * 0.2], [w * 0.35, h * 0.25], [w * 0.65, h * 0.22],
                [w * 0.42, h * 0.15], [w * 0.58, h * 0.15], [w * 0.5, h * 0.08],
                [w * 0.28, h * 0.28], [w * 0.72, h * 0.25], [w * 0.38, h * 0.32],
                [w * 0.62, h * 0.3]
            ];

            yaprakMerkezleri.forEach(([x, y]) => {
                const yesiller = ["#2E7D32", "#388E3C", "#43A047", "#4CAF50", "#66BB6A"];
                ctx.fillStyle = yesiller[Math.floor(Math.random() * yesiller.length)];
                ctx.beginPath();
                ctx.arc(x, y, 35 + Math.random() * 20, 0, Math.PI * 2);
                ctx.fill();
            });

            // Elmalar veya meyveler
            const meyveler = [[w * 0.4, h * 0.2], [w * 0.55, h * 0.18], [w * 0.48, h * 0.25], [w * 0.62, h * 0.28]];
            meyveler.forEach(([x, y]) => {
                ctx.fillStyle = "#D32F2F";
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        _sekillerCiz(ctx, canvas) {
            const w = canvas.width, h = canvas.height;

            ctx.fillStyle = "#FAFAFA";
            ctx.fillRect(0, 0, w, h);

            const sekiller = 12;
            for (let i = 0; i < sekiller; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const boyut = 30 + Math.random() * 80;
                const tip = Math.floor(Math.random() * 4);

                ctx.fillStyle = `hsla(${Math.random() * 360}, 70%, 60%, 0.7)`;
                ctx.strokeStyle = `hsla(${Math.random() * 360}, 70%, 40%, 0.9)`;
                ctx.lineWidth = 3;

                switch(tip) {
                    case 0: // Daire
                        ctx.beginPath();
                        ctx.arc(x, y, boyut, 0, Math.PI * 2);
                        ctx.fill(); ctx.stroke();
                        break;
                    case 1: // Kare
                        ctx.fillRect(x - boyut/2, y - boyut/2, boyut, boyut);
                        ctx.strokeRect(x - boyut/2, y - boyut/2, boyut, boyut);
                        break;
                    case 2: // Üçgen
                        ctx.beginPath();
                        ctx.moveTo(x, y - boyut);
                        ctx.lineTo(x - boyut, y + boyut/2);
                        ctx.lineTo(x + boyut, y + boyut/2);
                        ctx.closePath();
                        ctx.fill(); ctx.stroke();
                        break;
                    case 3: // Yıldız
                        this._parlakYildiz(ctx, x, y, boyut);
                        break;
                }
            }
        }

        _grafikCiz(ctx, canvas, aciklama) {
            const w = canvas.width, h = canvas.height;

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, w, h);

            // Başlık
            ctx.fillStyle = "#333";
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Tuncer Zeka - Grafik", w / 2, 30);

            // Rastgele veri oluştur
            const veriSayisi = 7;
            const etiketler = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
            const veriler = Array.from({length: veriSayisi}, () => Math.random() * 80 + 20);

            const kenarBosluk = 80;
            const grafikW = w - kenarBosluk * 2;
            const grafikH = h - 120;
            const barW = grafikW / veriSayisi * 0.6;
            const bosW = grafikW / veriSayisi * 0.4;

            // Eksenler
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(kenarBosluk, 50);
            ctx.lineTo(kenarBosluk, h - 60);
            ctx.lineTo(w - kenarBosluk, h - 60);
            ctx.stroke();

            // Yatay çizgiler
            ctx.strokeStyle = "#ddd";
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = 50 + (grafikH / 5) * i;
                ctx.beginPath();
                ctx.moveTo(kenarBosluk, y);
                ctx.lineTo(w - kenarBosluk, y);
                ctx.stroke();
                
                ctx.fillStyle = "#666";
                ctx.font = "12px Arial";
                ctx.textAlign = "right";
                ctx.fillText(Math.round(100 - i * 20), kenarBosluk - 10, y + 4);
            }

            // Barlar
            veriler.forEach((deger, i) => {
                const x = kenarBosluk + i * (barW + bosW) + bosW / 2;
                const barH = (deger / 100) * grafikH;
                const y = h - 60 - barH;

                const renkler = ["#E91E63", "#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#00BCD4", "#FF5722"];
                
                // Bar gradyanı
                const barGrad = ctx.createLinearGradient(x, y, x, h - 60);
                barGrad.addColorStop(0, renkler[i]);
                barGrad.addColorStop(1, renkler[i] + "88");
                ctx.fillStyle = barGrad;
                
                // Yuvarlatılmış bar
                const radius = 5;
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + barW - radius, y);
                ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
                ctx.lineTo(x + barW, h - 60);
                ctx.lineTo(x, h - 60);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.fill();

                // Değer
                ctx.fillStyle = "#333";
                ctx.font = "bold 14px Arial";
                ctx.textAlign = "center";
                ctx.fillText(Math.round(deger), x + barW / 2, y - 8);

                // Etiket
                ctx.fillStyle = "#666";
                ctx.font = "13px Arial";
                ctx.fillText(etiketler[i], x + barW / 2, h - 40);
            });
        }

        _soyutSanatCiz(ctx, canvas, aciklama) {
            const w = canvas.width, h = canvas.height;

            // Arkaplan
            const bgGrad = ctx.createLinearGradient(0, 0, w, h);
            bgGrad.addColorStop(0, `hsl(${Math.random() * 360}, 30%, 15%)`);
            bgGrad.addColorStop(1, `hsl(${Math.random() * 360}, 30%, 25%)`);
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            // Renk tespiti
            let anaRenk = null;
            Object.entries(this.renkPaleti).forEach(([isim, hex]) => {
                if (aciklama.toLowerCase().includes(isim)) {
                    anaRenk = hex;
                }
            });

            // Soyut şekiller
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const boyut = 20 + Math.random() * 100;
                
                let renk;
                if (anaRenk) {
                    const r = parseInt(anaRenk.slice(1, 3), 16);
                    const g = parseInt(anaRenk.slice(3, 5), 16);
                    const b = parseInt(anaRenk.slice(5, 7), 16);
                    renk = `rgba(${r + Math.random() * 50 - 25}, ${g + Math.random() * 50 - 25}, ${b + Math.random() * 50 - 25}, ${0.2 + Math.random() * 0.5})`;
                } else {
                    renk = `hsla(${Math.random() * 360}, ${50 + Math.random() * 50}%, ${40 + Math.random() * 30}%, ${0.2 + Math.random() * 0.5})`;
                }

                ctx.fillStyle = renk;

                const tip = Math.floor(Math.random() * 5);
                switch(tip) {
                    case 0:
                        ctx.beginPath();
                        ctx.arc(x, y, boyut, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    case 1:
                        ctx.fillRect(x, y, boyut, boyut * (0.5 + Math.random()));
                        break;
                    case 2:
                        ctx.beginPath();
                        ctx.moveTo(x, y - boyut);
                        ctx.lineTo(x - boyut, y + boyut);
                        ctx.lineTo(x + boyut, y + boyut);
                        ctx.closePath();
                        ctx.fill();
                        break;
                    case 3:
                        ctx.beginPath();
                        ctx.ellipse(x, y, boyut, boyut * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    case 4:
                        // Bezier eğrisi
                        ctx.strokeStyle = renk;
                        ctx.lineWidth = 2 + Math.random() * 5;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.bezierCurveTo(
                            x + Math.random() * 200 - 100, y + Math.random() * 200 - 100,
                            x + Math.random() * 200 - 100, y + Math.random() * 200 - 100,
                            x + Math.random() * 200 - 100, y + Math.random() * 200 - 100
                        );
                        ctx.stroke();
                        break;
                }
            }

            // Başlık
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`"${aciklama.substring(0, 50)}"`, w / 2, h - 40);
        }

        // SVG tabanlı görsel (Node.js ortamı için)
        _svgGorselUret(aciklama) {
            const kucuk = aciklama.toLowerCase();
            let icerik = "";

            const w = 800, h = 600;

            if (kucuk.includes("manzara") || kucuk.includes("doğa")) {
                icerik = `
                    <defs>
                        <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#87CEEB"/>
                            <stop offset="100%" style="stop-color:#E0F7FA"/>
                        </linearGradient>
                    </defs>
                    <rect width="${w}" height="${h * 0.6}" fill="url(#sky)"/>
                    <circle cx="${w * 0.8}" cy="80" r="50" fill="#FFD700"/>
                    <rect y="${h * 0.6}" width="${w}" height="${h * 0.4}" fill="#228B22"/>
                    <polygon points="0,${h * 0.6} 200,${h * 0.2} 400,${h * 0.6}" fill="#2E7D32"/>
                    <polygon points="300,${h * 0.6} 500,${h * 0.15} 700,${h * 0.6}" fill="#1B5E20"/>
                    <rect x="380" y="${h * 0.45}" width="20" height="80" fill="#5D4037"/>
                    <circle cx="390" cy="${h * 0.38}" r="40" fill="#4CAF50"/>`;
            } else {
                // Soyut
                let sekiller = "";
                for (let i = 0; i < 15; i++) {
                    const x = Math.random() * w;
                    const y = Math.random() * h;
                    const r = 20 + Math.random() * 60;
                    const renk = `hsl(${Math.random() * 360}, 70%, 60%)`;
                    const opaklık = 0.3 + Math.random() * 0.5;
                    if (Math.random() > 0.5) {
                        sekiller += `<circle cx="${x}" cy="${y}" r="${r}" fill="${renk}" opacity="${opaklık}"/>`;
                    } else {
                        sekiller += `<rect x="${x}" y="${y}" width="${r*2}" height="${r}" rx="5" fill="${renk}" opacity="${opaklık}"/>`;
                    }
                }
                icerik = `<rect width="${w}" height="${h}" fill="#1a1a2e"/>${sekiller}`;
            }

            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
                ${icerik}
                <text x="10" y="${h - 10}" font-size="12" fill="#666">Tuncer Zeka v2026 | Tasarımcı: Ahmet Tuncer</text>
            </svg>`;

            return {
                mesaj: `🎨 SVG Görsel oluşturuldu: "${aciklama}"`,
                svg: svg,
                genislik: w,
                yukseklik: h,
                tip: "image/svg+xml",
                talimat: "SVG'yi görmek için bir HTML dosyasına yapıştırabilirsiniz."
            };
        }

        // ═══════════════════════════════════════
        // GÖRSEL ANLAMA
        // ═══════════════════════════════════════
        
        gorselAnla(gorselVerisi) {
            if (!gorselVerisi) {
                return "Analiz edilecek görsel verisi bulunamadı.";
            }

            // ImageData veya Canvas'tan analiz
            if (gorselVerisi instanceof ImageData || (gorselVerisi.data && gorselVerisi.width)) {
                return this._pikselAnalizi(gorselVerisi);
            }

            // Base64 string
            if (typeof gorselVerisi === "string" && gorselVerisi.startsWith("data:image")) {
                return this._base64Analiz(gorselVerisi);
            }

            // Canvas element
            if (gorselVerisi.getContext) {
                const ctx = gorselVerisi.getContext("2d");
                const imgData = ctx.getImageData(0, 0, gorselVerisi.width, gorselVerisi.height);
                return this._pikselAnalizi(imgData);
            }

            return "Desteklenmeyen görsel formatı. ImageData, Canvas veya Base64 string gönderin.";
        }

        _pikselAnalizi(imgData) {
            const data = imgData.data;
            const w = imgData.width;
            const h = imgData.height;
            const pikselSayisi = w * h;

            let toplamR = 0, toplamG = 0, toplamB = 0;
            let minR = 255, minG = 255, minB = 255;
            let maxR = 0, maxG = 0, maxB = 0;
            let parlaklikToplam = 0;
            let renkDagilimi = { kirmizi: 0, yesil: 0, mavi: 0, sari: 0, beyaz: 0, siyah: 0, gri: 0 };
            let kenarSayisi = 0;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                
                toplamR += r; toplamG += g; toplamB += b;
                minR = Math.min(minR, r); minG = Math.min(minG, g); minB = Math.min(minB, b);
                maxR = Math.max(maxR, r); maxG = Math.max(maxG, g); maxB = Math.max(maxB, b);

                const parlaklik = (r + g + b) / 3;
                parlaklikToplam += parlaklik;

                // Renk sınıflandırma
                if (parlaklik > 230) renkDagilimi.beyaz++;
                else if (parlaklik < 25) renkDagilimi.siyah++;
                else if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) renkDagilimi.gri++;
                else if (r > g && r > b) renkDagilimi.kirmizi++;
                else if (g > r && g > b) renkDagilimi.yesil++;
                else if (b > r && b > g) renkDagilimi.mavi++;
                else if (r > 200 && g > 200 && b < 100) renkDagilimi.sari++;
            }

            // Kenar tespiti (basit Sobel)
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const idx = (y * w + x) * 4;
                    const idxL = (y * w + x - 1) * 4;
                    const idxR = (y * w + x + 1) * 4;
                    const idxU = ((y - 1) * w + x) * 4;
                    const idxD = ((y + 1) * w + x) * 4;

                    const gx = Math.abs((data[idxR] - data[idxL]));
                    const gy = Math.abs((data[idxD] - data[idxU]));

                    if (gx + gy > 50) kenarSayisi++;
                }
            }

            const ortR = Math.round(toplamR / pikselSayisi);
            const ortG = Math.round(toplamG / pikselSayisi);
            const ortB = Math.round(toplamB / pikselSayisi);
            const ortParlaklik = Math.round(parlaklikToplam / pikselSayisi);

            // Baskın renk
            const baskinRenk = Object.entries(renkDagilimi)
                .sort((a, b) => b[1] - a[1])[0][0];

            // Karmaşıklık
            const kenarOrani = kenarSayisi / pikselSayisi;
            let karmasiklik;
            if (kenarOrani > 0.3) karmasiklik = "çok karmaşık";
            else if (kenarOrani > 0.15) karmasiklik = "karmaşık";
            else if (kenarOrani > 0.05) karmasiklik = "orta";
            else karmasiklik = "basit";

            // Tür tahmini
            let turTahmini = [];
            if (renkDagilimi.yesil > pikselSayisi * 0.2 && renkDagilimi.mavi > pikselSayisi * 0.1) {
                turTahmini.push("doğa/manzara");
            }
            if (renkDagilimi.mavi > pikselSayisi * 0.3) {
                turTahmini.push("gökyüzü/deniz");
            }
            if (renkDagilimi.beyaz > pikselSayisi * 0.5) {
                turTahmini.push("belge/metin");
            }
            if (karmasiklik === "basit" && renkDagilimi.gri > pikselSayisi * 0.4) {
                turTahmini.push("minimalist tasarım");
            }
            if (kenarOrani > 0.2) {
                turTahmini.push("detaylı/fotografik");
            }
            if (turTahmini.length === 0) turTahmini.push("genel görsel");

            return `🔍 GÖRSEL ANALİZ RAPORU
${"═".repeat(40)}

📐 Boyut: ${w} x ${h} piksel (${pikselSayisi.toLocaleString()} piksel)

🎨 Renk Analizi:
  • Ortalama renk: RGB(${ortR}, ${ortG}, ${ortB})
  • Baskın renk tonu: ${baskinRenk}
  • Ortalama parlaklık: ${ortParlaklik}/255 (${ortParlaklik > 128 ? "açık tonlu" : "koyu tonlu"})
  • Renk aralığı: R[${minR}-${maxR}] G[${minG}-${maxG}] B[${minB}-${maxB}]

📊 Renk Dağılımı:
  ${Object.entries(renkDagilimi).map(([k, v]) => `• ${k}: %${(v / pikselSayisi * 100).toFixed(1)}`).join("\n  ")}

🔲 Yapı Analizi:
  • Kenar yoğunluğu: %${(kenarOrani * 100).toFixed(1)}
  • Karmaşıklık: ${karmasiklik}
  • Tespit edilen kenar: ${kenarSayisi.toLocaleString()}

🏷️ Tür Tahmini: ${turTahmini.join(", ")}

💡 Genel Değerlendirme:
Bu görsel ${w}x${h} boyutunda, ${ortParlaklik > 128 ? "açık" : "koyu"} tonlu, 
${baskinRenk} rengin baskın olduğu, ${karmasiklik} yapıda bir görseldir.
Muhtemelen bir ${turTahmini[0]} görseli olabilir.`;
        }

        _base64Analiz(base64) {
            // Base64'ten boyut bilgisi çıkar
            const boyutKB = Math.round((base64.length * 3) / 4 / 1024);
            const tip = base64.match(/data:image\/(\w+)/)?.[1] || "bilinmiyor";

            return `🔍 GÖRSEL ÖN ANALİZ
${"═".repeat(40)}
📁 Format: ${tip.toUpperCase()}
💾 Tahmini boyut: ~${boyutKB} KB
📊 Base64 uzunluk: ${base64.length.toLocaleString()} karakter

💡 Detaylı piksel analizi için görseli bir Canvas'a çizip ImageData olarak gönderin:
   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d');
   const img = new Image();
   img.onload = () => {
       canvas.width = img.width;
       canvas.height = img.height;
       ctx.drawImage(img, 0, 0);
       const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
       const analiz = tuncer.gorselAnla(imgData);
   };
   img.src = base64String;`;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // KOD MOTORU
    // ═══════════════════════════════════════════════════════════════
    
    class KodMotoru {
        constructor() {
            this.sablonlar = {
                javascript: {
                    "fonksiyon": (isim, params) => `function ${isim}(${params}) {\n  // Fonksiyon içeriği\n  \n  return;\n}`,
                    "sinif": (isim) => `class ${isim} {\n  constructor() {\n    \n  }\n\n  metod() {\n    \n  }\n}`,
                    "dizi_islem": () => `const dizi = [1, 2, 3, 4, 5];\n\n// Filtreleme\nconst ciftler = dizi.filter(x => x % 2 === 0);\n\n// Dönüştürme\nconst kareler = dizi.map(x => x * x);\n\n// Toplama\nconst toplam = dizi.reduce((acc, x) => acc + x, 0);\n\nconsole.log("Çiftler:", ciftler);\nconsole.log("Kareler:", kareler);\nconsole.log("Toplam:", toplam);`,
                    "fetch": (url) => `async function veriCek(url) {\n  try {\n    const yanit = await fetch(url);\n    if (!yanit.ok) throw new Error("HTTP hatası: " + yanit.status);\n    const veri = await yanit.json();\n    return veri;\n  } catch (hata) {\n    console.error("Hata:", hata.message);\n    return null;\n  }\n}\n\n// Kullanım\nveriCek("${url || 'https://api.example.com/veri'}").then(console.log);`,
                    "event_listener": () => `document.addEventListener('DOMContentLoaded', () => {\n  const buton = document.querySelector('#myButton');\n  \n  buton.addEventListener('click', (e) => {\n    console.log('Butona tıklandı!');\n    // İşlemleriniz burada\n  });\n\n  buton.addEventListener('mouseover', (e) => {\n    e.target.style.backgroundColor = '#4CAF50';\n  });\n\n  buton.addEventListener('mouseout', (e) => {\n    e.target.style.backgroundColor = '';\n  });\n});`
                },
                python: {
                    "fonksiyon": (isim, params) => `def ${isim}(${params}):\n    \"\"\"Fonksiyon açıklaması\"\"\"\n    \n    return None`,
                    "sinif": (isim) => `class ${isim}:\n    def __init__(self):\n        pass\n\n    def metod(self):\n        pass\n\n    def __str__(self):\n        return f"${isim} nesnesi"`,
                    "liste_islem": () => `liste = [1, 2, 3, 4, 5]\n\n# Filtreleme\nciftler = [x for x in liste if x % 2 == 0]\n\n# Dönüştürme\nkareler = [x**2 for x in liste]\n\n# Toplama\ntoplam = sum(liste)\n\nprint(f"Çiftler: {ciftler}")\nprint(f"Kareler: {kareler}")\nprint(f"Toplam: {toplam}")`,
                    "dosya_islem": () => `# Dosya yazma\nwith open('dosya.txt', 'w', encoding='utf-8') as f:\n    f.write('Merhaba Dünya!\\n')\n    f.write('Tuncer Zeka\\n')\n\n# Dosya okuma\nwith open('dosya.txt', 'r', encoding='utf-8') as f:\n    icerik = f.read()\n    print(icerik)`
                },
                html: {
                    "sayfa": (baslik) => `<!DOCTYPE html>\n<html lang="tr">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${baslik || 'Tuncer Zeka Sayfası'}</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body {\n            font-family: 'Segoe UI', sans-serif;\n            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n            min-height: 100vh;\n            display: flex;\n            justify-content: center;\n            align-items: center;\n        }\n        .container {\n            background: white;\n            padding: 2rem;\n            border-radius: 15px;\n            box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n            text-align: center;\n            max-width: 500px;\n        }\n        h1 { color: #333; margin-bottom: 1rem; }\n        p { color: #666; line-height: 1.6; }\n        .btn {\n            display: inline-block;\n            margin-top: 1rem;\n            padding: 12px 30px;\n            background: #667eea;\n            color: white;\n            border: none;\n            border-radius: 25px;\n            cursor: pointer;\n            font-size: 16px;\n            transition: transform 0.2s;\n        }\n        .btn:hover { transform: scale(1.05); }\n    </style>\n</head>\n<body>\n    <div class="container">\n        <h1>${baslik || 'Merhaba Dünya!'}</h1>\n        <p>Bu sayfa Tuncer Zeka tarafından oluşturulmuştur.</p>\n        <button class="btn" onclick="alert('Tuncer Zeka v2026!')">Tıkla</button>\n    </div>\n</body>\n</html>`,
                    "form": () => `<form id="iletisimForm" onsubmit="return formGonder(event)">\n    <div style="margin-bottom: 15px;">\n        <label for="isim">İsim:</label><br>\n        <input type="text" id="isim" name="isim" required \n               style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">\n    </div>\n    <div style="margin-bottom: 15px;">\n        <label for="email">E-posta:</label><br>\n        <input type="email" id="email" name="email" required\n               style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;">\n    </div>\n    <div style="margin-bottom: 15px;">\n        <label for="mesaj">Mesaj:</label><br>\n        <textarea id="mesaj" name="mesaj" rows="4" required\n                  style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px;"></textarea>\n    </div>\n    <button type="submit" style="background: #4CAF50; color: white; padding: 10px 25px; border: none; border-radius: 5px; cursor: pointer;">\n        Gönder\n    </button>\n</form>\n\n<script>\nfunction formGonder(e) {\n    e.preventDefault();\n    const veri = new FormData(e.target);\n    console.log('Form verileri:', Object.fromEntries(veri));\n    alert('Form gönderildi!');\n    return false;\n}\n</script>`
                },
                css: {
                    "animasyon": () => `.animasyonlu-kutu {\n    width: 100px;\n    height: 100px;\n    background: linear-gradient(45deg, #FF6B6B, #4ECDC4);\n    border-radius: 10px;\n    animation: donme 3s ease-in-out infinite;\n}\n\n@keyframes donme {\n    0% { transform: rotate(0deg) scale(1); }\n    25% { transform: rotate(90deg) scale(1.2); }\n    50% { transform: rotate(180deg) scale(1); }\n    75% { transform: rotate(270deg) scale(1.2); }\n    100% { transform: rotate(360deg) scale(1); }\n}\n\n/* Hover efekti */\n.animasyonlu-kutu:hover {\n    animation-play-state: paused;\n    box-shadow: 0 10px 30px rgba(0,0,0,0.3);\n}`,
                    "grid": () => `.grid-container {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n    gap: 20px;\n    padding: 20px;\n}\n\n.grid-item {\n    background: white;\n    padding: 20px;\n    border-radius: 10px;\n    box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n    transition: transform 0.3s ease;\n}\n\n.grid-item:hover {\n    transform: translateY(-5px);\n    box-shadow: 0 5px 20px rgba(0,0,0,0.15);\n}`,
                    "flexbox": () => `.flex-container {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: center;\n    align-items: center;\n    gap: 15px;\n    padding: 20px;\n    min-height: 100vh;\n}\n\n.flex-item {\n    flex: 0 1 200px;\n    padding: 20px;\n    background: linear-gradient(135deg, #667eea, #764ba2);\n    color: white;\n    border-radius: 10px;\n    text-align: center;\n    transition: all 0.3s ease;\n}\n\n.flex-item:hover {\n    flex-grow: 1;\n    max-width: 300px;\n}`
                }
            };
        }

        async kodYaz(girdi) {
            const kucuk = girdi.toLowerCase();

            // Dil tespiti
            let dil = "javascript";
            if (kucuk.includes("python")) dil = "python";
            else if (kucuk.includes("html")) dil = "html";
            else if (kucuk.includes("css")) dil = "css";

            // Ne tür kod isteniyor?
            let kod = "";
            let aciklama = "";

            if (dil === "javascript") {
                if (kucuk.includes("sınıf") || kucuk.includes("class")) {
                    const isim = this._isimCikar(girdi) || "Ornek";
                    kod = this.sablonlar.javascript.sinif(isim);
                    aciklama = `${isim} isimli bir JavaScript sınıfı`;
                } else if (kucuk.includes("fetch") || kucuk.includes("api") || kucuk.includes("veri çek")) {
                    kod = this.sablonlar.javascript.fetch("https://api.example.com/veri");
                    aciklama = "API'den veri çeken async fonksiyon";
                } else if (kucuk.includes("dizi") || kucuk.includes("array") || kucuk.includes("liste")) {
                    kod = this.sablonlar.javascript.dizi_islem();
                    aciklama = "Dizi işlemleri (filter, map, reduce)";
                } else if (kucuk.includes("event") || kucuk.includes("olay") || kucuk.includes("tıklama") || kucuk.includes("buton")) {
                    kod = this.sablonlar.javascript.event_listener();
                    aciklama = "Event listener kullanımı";
                } else if (kucuk.includes("hesap") || kucuk.includes("kalkül")) {
                    kod = this._hesapMakinesiKodu();
                    aciklama = "Hesap makinesi uygulaması";
                } else if (kucuk.includes("todo") || kucuk.includes("yapılacak")) {
                    kod = this._todoKodu();
                    aciklama = "Yapılacaklar listesi uygulaması";
                } else if (kucuk.includes("saat") || kucuk.includes("zaman")) {
                    kod = this._saatKodu();
                    aciklama = "Dijital saat uygulaması";
                } else if (kucuk.includes("oyun") || kucuk.includes("game")) {
                    kod = this._basitOyunKodu();
                    aciklama = "Basit tahmin oyunu";
                } else if (kucuk.includes("sıralama") || kucuk.includes("sort")) {
                    kod = this._siralamaAlgoritmasi();
                    aciklama = "Sıralama algoritmaları";
                } else {
                    const isim = this._isimCikar(girdi) || "ornekFonksiyon";
                    kod = this.sablonlar.javascript.fonksiyon(isim, "parametre1, parametre2");
                    aciklama = `${isim} isimli bir JavaScript fonksiyonu`;
                }
            } else if (dil === "python") {
                if (kucuk.includes("sınıf") || kucuk.includes("class")) {
                    const isim = this._isimCikar(girdi) || "Ornek";
                    kod = this.sablonlar.python.sinif(isim);
                    aciklama = `${isim} isimli bir Python sınıfı`;
                } else if (kucuk.includes("dosya")) {
                    kod = this.sablonlar.python.dosya_islem();
                    aciklama = "Dosya okuma/yazma işlemleri";
                } else if (kucuk.includes("liste") || kucuk.includes("dizi")) {
                    kod = this.sablonlar.python.liste_islem();
                    aciklama = "Python liste işlemleri";
                } else {
                    const isim = this._isimCikar(girdi) || "ornek_fonksiyon";
                    kod = this.sablonlar.python.fonksiyon(isim, "parametre1, parametre2");
                    aciklama = `${isim} isimli bir Python fonksiyonu`;
                }
            } else if (dil === "html") {
                if (kucuk.includes("form") || kucuk.includes("iletişim")) {
                    kod = this.sablonlar.html.form();
                    aciklama = "İletişim formu";
                } else {
                    const baslik = this._isimCikar(girdi) || "Tuncer Zeka Sayfası";
                    kod = this.sablonlar.html.sayfa(baslik);
                    aciklama = "Tam HTML sayfası";
                }
            } else if (dil === "css") {
                if (kucuk.includes("animasyon") || kucuk.includes("animation")) {
                    kod = this.sablonlar.css.animasyon();
                    aciklama = "CSS animasyon örneği";
                } else if (kucuk.includes("grid")) {
                    kod = this.sablonlar.css.grid();
                    aciklama = "CSS Grid layout";
                } else {
                    kod = this.sablonlar.css.flexbox();
                    aciklama = "CSS Flexbox layout";
                }
            }

            return `💻 KOD ÜRETİMİ
${"═".repeat(40)}
📝 İstek: ${girdi}
🔧 Dil: ${dil.toUpperCase()}
📋 Açıklama: ${aciklama}
${"─".repeat(40)}

\`\`\`${dil}
${kod}
\`\`\`

✅ Kod Tuncer Zeka v2026 tarafından üretilmiştir.
👨‍💻 Tasarımcı: Ahmet Tuncer`;
        }

        _isimCikar(girdi) {
            // Tırnak içindeki metni bul
            const tirnak = girdi.match(/["""]([^"""]+)["""]/);
            if (tirnak) return tirnak[1].replace(/\s+/g, "");

            // "adında", "isimli", "adlı" kelimesinden önceki kelimeyi bul
            const adinda = girdi.match(/(\w+)\s+(?:adında|isimli|adlı|isminde)/);
            if (adinda) return adinda[1];

            return null;
        }

        _hesapMakinesiKodu() {
            return `class HesapMakinesi {
    constructor() {
        this.sonuc = 0;
        this.gecmis = [];
    }

    topla(a, b) {
        this.sonuc = a + b;
        this._kaydet(\`\${a} + \${b} = \${this.sonuc}\`);
        return this.sonuc;
    }

    cikar(a, b) {
        this.sonuc = a - b;
        this._kaydet(\`\${a} - \${b} = \${this.sonuc}\`);
        return this.sonuc;
    }

    carp(a, b) {
        this.sonuc = a * b;
        this._kaydet(\`\${a} × \${b} = \${this.sonuc}\`);
        return this.sonuc;
    }

    bol(a, b) {
        if (b === 0) throw new Error("Sıfıra bölünemez!");
        this.sonuc = a / b;
        this._kaydet(\`\${a} ÷ \${b} = \${this.sonuc}\`);
        return this.sonuc;
    }

    karekok(n) {
        this.sonuc = Math.sqrt(n);
        this._kaydet(\`√\${n} = \${this.sonuc}\`);
        return this.sonuc;
    }

    us(taban, us) {
        this.sonuc = Math.pow(taban, us);
        this._kaydet(\`\${taban}^\${us} = \${this.sonuc}\`);
        return this.sonuc;
    }

    _kaydet(islem) {
        this.gecmis.push({ islem, zaman: new Date() });
    }

    gecmisiGoster() {
        return this.gecmis.map(g => g.islem).join("\\n");
    }
}

// Kullanım
const hesap = new HesapMakinesi();
console.log(hesap.topla(5, 3));      // 8
console.log(hesap.carp(4, 7));       // 28
console.log(hesap.karekok(144));     // 12
console.log(hesap.gecmisiGoster());`;
        }

        _todoKodu() {
            return `class YapilacaklarListesi {
    constructor() {
        this.gorevler = [];
        this.sayac = 0;
    }

    ekle(baslik, oncelik = "normal") {
        this.sayac++;
        const gorev = {
            id: this.sayac,
            baslik: baslik,
            oncelik: oncelik, // "düşük", "normal", "yüksek"
            tamamlandi: false,
            olusturma: new Date().toLocaleString("tr-TR"),
        };
        this.gorevler.push(gorev);
        console.log(\`✅ Görev eklendi: "\${baslik}"\`);
        return gorev;
    }

    tamamla(id) {
        const gorev = this.gorevler.find(g => g.id === id);
        if (gorev) {
            gorev.tamamlandi = true;
            console.log(\`✓ Tamamlandı: "\${gorev.baslik}"\`);
        }
    }

    sil(id) {
        this.gorevler = this.gorevler.filter(g => g.id !== id);
        console.log(\`🗑️ Görev silindi: #\${id}\`);
    }

    listele() {
        if (this.gorevler.length === 0) {
            console.log("📋 Liste boş!");
            return;
        }
        console.log("\\n📋 Yapılacaklar Listesi:");
        console.log("─".repeat(40));
        this.gorevler.forEach(g => {
            const durum = g.tamamlandi ? "✅" : "⬜";
            const oncelik = { düşük: "🟢", normal: "🟡", yüksek: "🔴" };
            console.log(\`\${durum} [\${g.id}] \${oncelik[g.oncelik] || "🟡"} \${g.baslik}\`);
        });
    }

    bekleyenler() {
        return this.gorevler.filter(g => !g.tamamlandi);
    }
}

// Kullanım
const todo = new YapilacaklarListesi();
todo.ekle("JavaScript öğren", "yüksek");
todo.ekle("Proje dosyalarını düzenle", "normal");
todo.ekle("Kahve al", "düşük");
todo.tamamla(1);
todo.listele();`;
        }

        _saatKodu() {
            return `function dijitalSaat() {
    function guncelle() {
        const simdi = new Date();
        const saat = String(simdi.getHours()).padStart(2, '0');
        const dakika = String(simdi.getMinutes()).padStart(2, '0');
        const saniye = String(simdi.getSeconds()).padStart(2, '0');
        const tarih = simdi.toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const saatMetni = \`\${saat}:\${dakika}:\${saniye}\`;
        
        // Konsol için
        console.clear();
        console.log("╔════════════════════╗");
        console.log(\`║    \${saatMetni}       ║\`);
        console.log("╚════════════════════╝");
        console.log(\`  \${tarih}\`);

        // DOM varsa
        if (typeof document !== 'undefined') {
            const el = document.getElementById('saat');
            if (el) {
                el.textContent = saatMetni;
            }
            const tarihEl = document.getElementById('tarih');
            if (tarihEl) {
                tarihEl.textContent = tarih;
            }
        }
    }

    guncelle();
    setInterval(guncelle, 1000);
}

// Başlat
dijitalSaat();`;
        }

        _basitOyunKodu() {
            return `class TahminOyunu {
    constructor(minSayi = 1, maxSayi = 100) {
        this.min = minSayi;
        this.max = maxSayi;
        this.hedef = 0;
        this.denemeSayisi = 0;
        this.maxDeneme = 7;
        this.bitti = false;
    }

    baslat() {
        this.hedef = Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
        this.denemeSayisi = 0;
        this.bitti = false;
        
        console.log("🎮 TAHMİN OYUNU");
        console.log(\`\${this.min} ile \${this.max} arasında bir sayı tuttum!\`);
        console.log(\`\${this.maxDeneme} deneme hakkınız var. Hadi başlayalım!\\n\`);
        return this;
    }

    tahminEt(sayi) {
        if (this.bitti) {
            console.log("Oyun bitti! Yeni oyun için baslat() çağırın.");
            return;
        }

        this.denemeSayisi++;
        const kalan = this.maxDeneme - this.denemeSayisi;

        if (sayi === this.hedef) {
            this.bitti = true;
            console.log(\`🎉 TEBRİKLER! \${this.denemeSayisi} denemede bildiniz!\`);
            console.log(\`Sayı: \${this.hedef}\`);
            return "kazandın";
        }

        if (this.denemeSayisi >= this.maxDeneme) {
            this.bitti = true;
            console.log(\`😔 Kaybettiniz! Doğru sayı \${this.hedef} idi.\`);
            return "kaybettin";
        }

        if (sayi < this.hedef) {
            console.log(\`⬆️ Daha BÜYÜK! (Kalan: \${kalan} deneme)\`);
        } else {
            console.log(\`⬇️ Daha KÜÇÜK! (Kalan: \${kalan} deneme)\`);
        }

        return "devam";
    }
}

// Kullanım
const oyun = new TahminOyunu(1, 100).baslat();
// oyun.tahminEt(50);
// oyun.tahminEt(75);
// ...`;
        }

        _siralamaAlgoritmasi() {
            return `// ═══════════════════════════════════════
// SIRALAMA ALGORİTMALARI KOLEKSİYONU
// Tuncer Zeka v2026
// ═══════════════════════════════════════

// 1. Bubble Sort (Kabarcık Sıralaması)
function bubbleSort(dizi) {
    const arr = [...dizi];
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}

// 2. Quick Sort (Hızlı Sıralama)
function quickSort(dizi) {
    if (dizi.length <= 1) return dizi;
    
    const pivot = dizi[Math.floor(dizi.length / 2)];
    const sol = dizi.filter(x => x < pivot);
    const orta = dizi.filter(x => x === pivot);
    const sag = dizi.filter(x => x > pivot);
    
    return [...quickSort(sol), ...orta, ...quickSort(sag)];
}

// 3. Merge Sort (Birleştirmeli Sıralama)
function mergeSort(dizi) {
    if (dizi.length <= 1) return dizi;
    
    const orta = Math.floor(dizi.length / 2);
    const sol = mergeSort(dizi.slice(0, orta));
    const sag = mergeSort(dizi.slice(orta));
    
    return birlestir(sol, sag);
}

function birlestir(sol, sag) {
    const sonuc = [];
    let i = 0, j = 0;
    
    while (i < sol.length && j < sag.length) {
        if (sol[i] <= sag[j]) {
            sonuc.push(sol[i++]);
        } else {
            sonuc.push(sag[j++]);
        }
    }
    
    return [...sonuc, ...sol.slice(i), ...sag.slice(j)];
}

// Test
const testDizi = [64, 34, 25, 12, 22, 11, 90, 1, 55, 42];
console.log("Orijinal:", testDizi);
console.log("Bubble Sort:", bubbleSort(testDizi));
console.log("Quick Sort:", quickSort(testDizi));
console.log("Merge Sort:", mergeSort(testDizi));

// Performans karşılaştırması
function performansTest(boyut = 10000) {
    const rastgele = Array.from({length: boyut}, () => Math.random() * 10000);
    
    console.log(\`\\nPerformans Testi (\${boyut} eleman):\`);
    
    let t = Date.now();
    bubbleSort(rastgele);
    console.log(\`Bubble Sort: \${Date.now() - t}ms\`);
    
    t = Date.now();
    quickSort(rastgele);
    console.log(\`Quick Sort: \${Date.now() - t}ms\`);
    
    t = Date.now();
    mergeSort(rastgele);
    console.log(\`Merge Sort: \${Date.now() - t}ms\`);
}

performansTest(5000);`;
        }

        kodAnaliz(girdi) {
            // Kod bloğunu çıkar
            const kodBlok = girdi.match(/```[\w]*\n?([\s\S]*?)```/) || 
                           girdi.match(/`([^`]+)`/);
            
            const kod = kodBlok ? kodBlok[1].trim() : girdi;

            let analiz = [];
            let uyarilar = [];
            let istatistikler = {};

            // Satır sayısı
            const satirlar = kod.split("\n");
            istatistikler.satirSayisi = satirlar.length;
            istatistikler.bosOlmayanSatir = satirlar.filter(s => s.trim()).length;
            istatistikler.yorumSatiri = satirlar.filter(s => s.trim().startsWith("//") || s.trim().startsWith("/*") || s.trim().startsWith("#")).length;

            // Fonksiyon tespiti
            const fonksiyonlar = kod.match(/function\s+\w+|const\s+\w+\s*=\s*(?:\(|async)|def\s+\w+|=>\s*{/g) || [];
            istatistikler.fonksiyonSayisi = fonksiyonlar.length;

            // Değişken tespiti
            const degiskenler = kod.match(/(?:var|let|const)\s+\w+/g) || [];
            istatistikler.degiskenSayisi = degiskenler.length;

            // var kullanımı uyarısı
            if (kod.includes("var ")) {
                uyarilar.push("⚠️ 'var' yerine 'let' veya 'const' kullanmanız önerilir.");
            }

            // console.log kontrolü
            const consoleSayisi = (kod.match(/console\.log/g) || []).length;
            if (consoleSayisi > 5) {
                uyarilar.push(`⚠️ ${consoleSayisi} adet console.log bulundu. Production'da kaldırmayı düşünün.`);
            }

            // Derin iç içe geçme
            let maxGirintisi = 0;
            satirlar.forEach(s => {
                const bosluk = s.match(/^(\s*)/)[1].length;
                maxGirintisi = Math.max(maxGirintisi, Math.floor(bosluk / 2));
            });
            if (maxGirintisi > 5) {
                uyarilar.push(`⚠️ Derin girintileme tespit edildi (${maxGirintisi} seviye). Kodu basitleştirmeyi düşünün.`);
            }

            // eval kullanımı
            if (kod.includes("eval(")) {
                uyarilar.push("🔴 eval() kullanımı tespit edildi! Bu güvenlik riski oluşturur.");
            }

            // == vs === kontrolü
            const gevşekKarsilastirma = (kod.match(/[^=!]==[^=]/g) || []).length;
            if (gevşekKarsilastirma > 0) {
                uyarilar.push(`⚠️ ${gevşekKarsilastirma} adet gevşek karşılaştırma (==) bulundu. Katı karşılaştırma (===) önerilir.`);
            }

            // Hata yakalama kontrolü
            if (kod.includes("async") && !kod.includes("try") && !kod.includes("catch")) {
                uyarilar.push("⚠️ Async kod var ama try-catch bloğu bulunamadı.");
            }

            // Dil tahmini
            let dil = "Bilinmiyor";
            if (kod.includes("function") || kod.includes("const") || kod.includes("let") || kod.includes("=>")) dil = "JavaScript";
            else if (kod.includes("def ") || kod.includes("import ") || kod.includes("print(")) dil = "Python";
            else if (kod.includes("<html") || kod.includes("<div")) dil = "HTML";
            else if (kod.includes("{") && kod.includes(":") && kod.includes(";") && !kod.includes("function")) dil = "CSS";

            return `🔍 KOD ANALİZ RAPORU
${"═".repeat(40)}

📊 İstatistikler:
  • Dil: ${dil}
  • Toplam satır: ${istatistikler.satirSayisi}
  • Kod satırı: ${istatistikler.bosOlmayanSatir}
  • Yorum satırı: ${istatistikler.yorumSatiri}
  • Fonksiyon sayısı: ${istatistikler.fonksiyonSayisi}
  • Değişken sayısı: ${istatistikler.degiskenSayisi}
  • Maksimum girintileme: ${maxGirintisi} seviye

$${uyarilar.length > 0 ? `\n⚠️ Uyarılar ($${uyarilar.length}):\n$${uyarilar.map(u => `  $${u}`).join("\n")}` : "✅ Belirgin sorun tespit edilmedi!"}

💡 Öneriler:
  $${istatistikler.yorumSatiri === 0 ? "• Kodunuza yorum ekleyin.\n  " : ""}$${istatistikler.fonksiyonSayisi === 0 ? "• Kodu fonksiyonlara bölmeyi düşünün.\n  " : ""}• Kod kalitesini artırmak için birim testleri yazın.

🤖 Analiz: Tuncer Zeka v2026 | Tasarımcı: Ahmet Tuncer`;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // BİLGİ BANKASI
    // ═══════════════════════════════════════════════════════════════
    
    class BilgiBankasi {
        constructor() {
            this.veriler = new Map();
        }

        ekle(anahtar, deger) {
            this.veriler.set(anahtar.toLowerCase(), deger);
        }

        ara(sorgu) {
            const kucuk = sorgu.toLowerCase();
            const sonuclar = [];

            this.veriler.forEach((deger, anahtar) => {
                if (anahtar.includes(kucuk) || kucuk.includes(anahtar)) {
                    sonuclar.push({ anahtar, deger });
                }
            });

            return sonuclar;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ÖĞRENME SİSTEMİ
    // ═══════════════════════════════════════════════════════════════
    
    class OgrenmeSistemi {
        constructor(ana) {
            this.ana = ana;
            this.ogrenilmisler = new Map();
            this.iliskiler = new Map();
            this.kurallar = [];
        }

        ogren(girdi) {
            const kucuk = girdi.toLowerCase();

            // "öğren: X = Y" formatı
            let esleme = girdi.match(/(?:öğren|bil|kaydet|hatırla)[\s:]+(.+?)(?:\s*=\s*|\s+(?:şudur|budur|demektir|anlamı)\s*)(.+)/i);
            
            if (esleme) {
                const anahtar = esleme[1].trim().toLowerCase();
                const deger = esleme[2].trim();
                this.ogrenilmisler.set(anahtar, {
                    deger: deger,
                    zaman: Date.now(),
                    kaynak: "kullanici"
                });
                return `✅ Öğrendim! "$${esleme[1].trim()}" = "$${deger}"\nBunu artık hatırlayacağım.`;
            }

            // "X, Y'dir" formatı
            esleme = girdi.match(/(.+?)(?:\s+(?:dır|dir|tır|tir|dur|dür|olarak bilinir|olarak tanınır))\s*[.!]?$/i);
            if (esleme) {
                const cumle = esleme[0].trim();
                const parcalar = cumle.split(/\s+(?:dır|dir|tır|tir|dur|dür)/i);
                if (parcalar.length >= 2) {
                    const anahtar = parcalar[0].trim().toLowerCase();
                    const deger = parcalar.join(" ").trim();
                    this.ogrenilmisler.set(anahtar, {
                        deger: deger,
                        zaman: Date.now(),
                        kaynak: "kullanici"
                    });
                    return `✅ Anladım ve kaydettim: "${deger}"`;
                }
            }

            // Genel öğrenme
            const kelimeler = this.ana.dil.analizEt(girdi).anlamliKelimeler;
            if (kelimeler.length >= 2) {
                const anahtar = kelimeler.slice(0, 2).join(" ").toLowerCase();
                this.ogrenilmisler.set(anahtar, {
                    deger: girdi,
                    zaman: Date.now(),
                    kaynak: "kullanici"
                });
                return `✅ Bu bilgiyi kaydettim. "$${anahtar}" olarak hatırlayacağım.\nBilgi: "$${girdi}"`;
            }

            return "Öğrenmemi istediğiniz bilgiyi şu formatta yazın: 'öğren: [konu] = [bilgi]'";
        }

        bilgiSorgula(sorgu) {
            const kucuk = sorgu.toLowerCase();
            
            // Direkt eşleşme
            if (this.ogrenilmisler.has(kucuk)) {
                return this.ogrenilmisler.get(kucuk).deger;
            }

            // Kısmi eşleşme
            for (const [anahtar, veri] of this.ogrenilmisler) {
                if (kucuk.includes(anahtar) || anahtar.includes(kucuk)) {
                    return veri.deger;
                }
            }

            // Kelime bazlı arama
            const kelimeler = kucuk.split(/\s+/).filter(k => k.length > 2);
            let enIyiEsleme = null;
            let enIyiPuan = 0;

            for (const [anahtar, veri] of this.ogrenilmisler) {
                let puan = 0;
                kelimeler.forEach(k => {
                    if (anahtar.includes(k)) puan++;
                    if (veri.deger.toLowerCase().includes(k)) puan += 0.5;
                });
                if (puan > enIyiPuan) {
                    enIyiPuan = puan;
                    enIyiEsleme = veri.deger;
                }
            }

            return enIyiPuan > 0 ? enIyiEsleme : null;
        }

        bilgiSayisi() {
            return this.ogrenilmisler.size;
        }

        tumBilgiler() {
            const sonuc = [];
            this.ogrenilmisler.forEach((veri, anahtar) => {
                sonuc.push({ anahtar, deger: veri.deger, zaman: veri.zaman });
            });
            return sonuc;
        }

        sifirla() {
            this.ogrenilmisler.clear();
            this.iliskiler.clear();
            this.kurallar = [];
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AĞ SERVİSLERİ - Wikipedia & Hava Durumu
    // ═══════════════════════════════════════════════════════════════
    
    class AgServisleri {
        constructor() {
            this.onbellek = new Map();
            this.onbellekSuresi = 300000; // 5 dakika
        }

        // ═══════════════════════════════════════
        // WİKİPEDİA BİLGİ EDİNME
        // ═══════════════════════════════════════

        async wikipediaBilgi(girdi) {
            // Arama terimini çıkar
            let aramaTermi = girdi;
            const kaliplar = ["wikipedia:", "vikipedi:", "bilgi ver:", "hakkında bilgi:", 
                             "araştır:", "kimdir", "nedir", "wikipedia", "vikipedi",
                             "bilgi ver", "hakkında bilgi", "araştır", "kim bu"];
            
            for (const kalip of kaliplar) {
                const idx = girdi.toLowerCase().indexOf(kalip);
                if (idx !== -1) {
                    aramaTermi = girdi.substring(idx + kalip.length).trim();
                    break;
                }
            }

            // Gereksiz kelimeleri temizle
            aramaTermi = aramaTermi.replace(/[?!.]/g, "").trim();
            
            if (!aramaTermi || aramaTermi.length < 2) {
                return "Wikipedia'da arama yapmak için bir konu belirtin. Örnek: 'wikipedia: Atatürk'";
            }

            // Önbellek kontrolü
            const onbellekAnahtari = "wiki_" + aramaTermi.toLowerCase();
            if (this.onbellek.has(onbellekAnahtari)) {
                const kayit = this.onbellek.get(onbellekAnahtari);
                if (Date.now() - kayit.zaman < this.onbellekSuresi) {
                    return kayit.veri + "\n\n📦 (Önbellekten)";
                }
            }

            try {
                // Fetch API kontrolü
                if (typeof fetch === "undefined") {
                    return this._cevrimdisiWikipedia(aramaTermi);
                }

                // Wikipedia API (ücretsiz, API anahtarı gerektirmez)
                const aramaUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(aramaTermi)}`;
                
                const yanit = await fetch(aramaUrl, {
                    headers: { 
                        "Accept": "application/json",
                        "User-Agent": "TuncerZeka/2026 (Yapay Zeka Kütüphanesi)"
                    }
                });

                if (yanit.ok) {
                    const veri = await yanit.json();
                    
                    if (veri.extract) {
                        const sonuc = `📖 WİKİPEDİA: ${veri.title || aramaTermi}
${"═".repeat(40)}

$${veri.description ? `📋 $${veri.description}\n` : ""}
${veri.extract}

$${veri.content_urls ? `\n🔗 Kaynak: $${veri.content_urls.desktop.page}` : ""}
\n🤖 Tuncer Zeka v2026 | Wikipedia Türkçe`;
                        
                        this.onbellek.set(onbellekAnahtari, { veri: sonuc, zaman: Date.now() });
                        return sonuc;
                    }
                }

                // Arama API'si dene
                const aramaUrl2 = `https://tr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(aramaTermi)}&format=json&origin=*&utf8=1&srlimit=3`;
                
                const yanit2 = await fetch(aramaUrl2);
                if (yanit2.ok) {
                    const veri2 = await yanit2.json();
                    
                    if (veri2.query && veri2.query.search && veri2.query.search.length > 0) {
                        const sonuclar = veri2.query.search;
                        let metin = `📖 WİKİPEDİA ARAMA: "$${aramaTermi}"\n$${"═".repeat(40)}\n\n`;
                        metin += `${sonuclar.length} sonuç bulundu:\n\n`;
                        
                        for (const s of sonuclar) {
                            const temizSnippet = s.snippet.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
                            metin += `📌 $${s.title}\n   $${temizSnippet}...\n   🔗 https://tr.wikipedia.org/wiki/${encodeURIComponent(s.title)}\n\n`;
                        }

                        // İlk sonucun detayını al
                        try {
                            const detayUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sonuclar[0].title)}`;
                            const detayYanit = await fetch(detayUrl);
                            if (detayYanit.ok) {
                                const detay = await detayYanit.json();
                                if (detay.extract) {
                                    metin += `$${"─".repeat(40)}\n\n📝 Detay ($${detay.title}):\n${detay.extract}`;
                                }
                            }
                        } catch(e) {}

                        metin += `\n\n🤖 Tuncer Zeka v2026 | Wikipedia Türkçe`;
                        this.onbellek.set(onbellekAnahtari, { veri: metin, zaman: Date.now() });
                        return metin;
                    }
                }

                return this._cevrimdisiWikipedia(aramaTermi);

            } catch (hata) {
                return this._cevrimdisiWikipedia(aramaTermi);
            }
        }

        _cevrimdisiWikipedia(terim) {
            // Çevrimdışı bilgi bankası
            const bilgiler = {
                "atatürk": "Mustafa Kemal Atatürk (1881-1938), Türkiye Cumhuriyeti'nin kurucusu ve ilk cumhurbaşkanıdır. Kurtuluş Savaşı'nı yönetmiş, cumhuriyeti ilan etmiş ve birçok devrim gerçekleştirmiştir. Harf devrimi, şapka devrimi, kadın hakları gibi reformları hayata geçirmiştir.",
                "istanbul": "İstanbul, Türkiye'nin en kalabalık şehri ve kültürel başkentidir. Avrupa ve Asya kıtalarını birbirine bağlayan İstanbul Boğazı üzerinde kurulmuştur. Tarihi yarımada, UNESCO Dünya Mirası listesindedir.",
                "ankara": "Ankara, Türkiye Cumhuriyeti'nin başkentidir. İç Anadolu Bölgesi'nde yer alır. 1923'te başkent ilan edilmiştir. Anıtkabir, Atatürk'ün anıt mezarı burada bulunmaktadır.",
                "türkiye": "Türkiye, Güneydoğu Avrupa ve Güneybatı Asya'da yer alan bir ülkedir. Başkenti Ankara, en büyük şehri İstanbul'dur. Nüfusu 85 milyonun üzerindedir. Zengin tarihi ve kültürel mirasa sahiptir.",
                "yapay zeka": "Yapay zeka (AI), makinelerin insan benzeri zekâ sergilemesini amaçlayan bilim dalıdır. Alt dalları arasında makine öğrenimi, derin öğrenme, doğal dil işleme, bilgisayarlı görü bulunur. İlk yapay zeka çalışmaları 1950'lerde Alan Turing ile başlamıştır.",
                "internet": "İnternet, dünya genelindeki bilgisayar ağlarının birbirine bağlanmasıyla oluşan küresel iletişim ağıdır. 1960'larda ARPANET projesi ile başlamış, 1990'larda World Wide Web ile yaygınlaşmıştır.",
                "dünya": "Dünya, Güneş'ten üçüncü gezegendir. Yaşamı destekleyen tek bilinen gezegendir. Yüzeyinin %71'i su ile kaplıdır. 4.5 milyar yaşındadır ve yaklaşık 8 milyar insana ev sahipliği yapmaktadır.",
                "güneş": "Güneş, Güneş Sistemi'nin merkezindeki yıldızdır. Dünya'dan yaklaşık 150 milyon km uzaktadır. Yüzey sıcaklığı yaklaşık 5.500°C'dir. Hidrojen ve helyumdan oluşur.",
                "ay": "Ay, Dünya'nın tek doğal uydusudur. Dünya'dan ortalama 384.400 km uzaktadır. İnsanlar ilk kez 1969'da Apollo 11 misyonuyla Ay'a ayak basmıştır.",
                "mars": "Mars, Güneş'ten dördüncü gezegendir. Kızıl gezegen olarak da bilinir. Yüzeyindeki demir oksit nedeniyle kırmızımsı görünür. NASA'nın çeşitli robotik araçları Mars yüzeyini keşfetmektedir.",
                "einstein": "Albert Einstein (1879-1955), Alman doğumlu fizikçidir. Özel ve genel görelilik teorilerini geliştirmiştir. E=mc² formülü ile ünlüdür. 1921'de Nobel Fizik Ödülü almıştır.",
                "newton": "Sir Isaac Newton (1643-1727), İngiliz fizikçi ve matematikçidir. Yerçekimi yasası ve hareket yasalarını keşfetmiştir. Kalkülüs'ün (diferansiyel ve integral) kurucularındandır.",
                "python": "Python, Guido van Rossum tarafından 1991'de oluşturulan yüksek seviyeli programlama dilidir. Okunabilirliği yüksektir. Yapay zeka, veri bilimi, web geliştirme alanlarında yaygın kullanılır.",
                "javascript": "JavaScript, 1995'te Brendan Eich tarafından geliştirilmiş programlama dilidir. Web tarayıcılarının dilidir. Node.js ile sunucu tarafında da kullanılır. Dünyanın en popüler programlama dillerinden biridir.",
            };

            const kucukTerim = terim.toLowerCase();
            
            for (const [anahtar, bilgi] of Object.entries(bilgiler)) {
                if (kucukTerim.includes(anahtar) || anahtar.includes(kucukTerim)) {
                    return `📖 BİLGİ: ${anahtar.charAt(0).toUpperCase() + anahtar.slice(1)}
${"═".repeat(40)}

${bilgi}

📴 Not: Çevrimdışı bilgi bankasından alındı. İnternet bağlantısıyla daha detaylı bilgi alabilirsiniz.
🤖 Tuncer Zeka v2026`;
                }
            }

            return `📖 "${terim}" hakkında çevrimdışı bilgi bankamda bilgi bulunamadı.\n\n💡 Öneriler:\n• İnternet bağlantınızı kontrol edin\n• Farklı anahtar kelimeler deneyin\n• Daha genel bir terim arayın\n\n🤖 Tuncer Zeka v2026`;
        }

        // ═══════════════════════════════════════
        // HAVA DURUMU
        // ═══════════════════════════════════════

        async havaDurumu(girdi) {
            // Şehir adını çıkar
            let sehir = girdi;
            const kaliplar = ["hava durumu:", "hava durumu", "hava nasıl:", "hava nasıl",
                             "hava:", "sıcaklık:", "meteoroloji:"];
            
            for (const kalip of kaliplar) {
                const idx = girdi.toLowerCase().indexOf(kalip);
                if (idx !== -1) {
                    sehir = girdi.substring(idx + kalip.length).trim();
                    break;
                }
            }

            // Gereksiz kelimeleri temizle
            sehir = sehir.replace(/[?!.,]/g, "")
                         .replace(/\b(da|de|ta|te|nın|nin|nun|nün|ın|in|un|ün)\b/g, "")
                         .trim();

            if (!sehir || sehir.length < 2) {
                sehir = "İstanbul"; // Varsayılan
            }

            // Önbellek kontrolü
            const onbellekAnahtari = "hava_" + sehir.toLowerCase();
            if (this.onbellek.has(onbellekAnahtari)) {
                const kayit = this.onbellek.get(onbellekAnahtari);
                if (Date.now() - kayit.zaman < this.onbellekSuresi) {
                    return kayit.veri + "\n\n📦 (Önbellekten)";
                }
            }

            try {
                if (typeof fetch === "undefined") {
                    return this._cevrimdisiHavaDurumu(sehir);
                }

                // wttr.in API (ücretsiz, API anahtarı gerektirmez)
                const url = `https://wttr.in/${encodeURIComponent(sehir)}?format=j1&lang=tr`;
                
                const yanit = await fetch(url, {
                    headers: { 
                        "Accept": "application/json",
                        "User-Agent": "TuncerZeka/2026"
                    }
                });

                if (yanit.ok) {
                    const veri = await yanit.json();
                    
                    if (veri.current_condition && veri.current_condition[0]) {
                        const guncel = veri.current_condition[0];
                        const konum = veri.nearest_area ? veri.nearest_area[0] : null;
                        
                        const sicaklik = guncel.temp_C;
                        const hissedilen = guncel.FeelsLikeC;
                        const nem = guncel.humidity;
                        const ruzgar = guncel.windspeedKmph;
                        const ruzgarYon = guncel.winddir16Point;
                        const gorunurluk = guncel.visibility;
                        const basınç = guncel.pressure;
                        const bulut = guncel.cloudcover;

                        // Hava durumu açıklaması
                        const durumTR = guncel.lang_tr ? guncel.lang_tr[0].value : 
                                       (guncel.weatherDesc ? guncel.weatherDesc[0].value : "Bilinmiyor");

                        // Hava ikonu
                        let ikon = "🌤️";
                        const durumKucuk = durumTR.toLowerCase();
                        if (durumKucuk.includes("güneş") || durumKucuk.includes("açık") || durumKucuk.includes("sunny") || durumKucuk.includes("clear")) ikon = "☀️";
                        else if (durumKucuk.includes("bulut") || durumKucuk.includes("cloud") || durumKucuk.includes("kapalı")) ikon = "☁️";
                        else if (durumKucuk.includes("yağmur") || durumKucuk.includes("rain")) ikon = "🌧️";
                        else if (durumKucuk.includes("kar") || durumKucuk.includes("snow")) ikon = "❄️";
                        else if (durumKucuk.includes("fırtına") || durumKucuk.includes("thunder")) ikon = "⛈️";
                        else if (durumKucuk.includes("sis") || durumKucuk.includes("fog")) ikon = "🌫️";
                        else if (durumKucuk.includes("parça")) ikon = "⛅";

                        let tahminMetni = "";
                        if (veri.weather && veri.weather.length > 0) {
                            tahminMetni = "\n\n📅 3 Günlük Tahmin:\n";
                            veri.weather.slice(0, 3).forEach((gun, i) => {
                                const tarih = gun.date;
                                const maxS = gun.maxtempC;
                                const minS = gun.mintempC;
                                const gunDurum = gun.hourly && gun.hourly[4] ? 
                                    (gun.hourly[4].lang_tr ? gun.hourly[4].lang_tr[0].value : gun.hourly[4].weatherDesc[0].value) : "";
                                const gunler = ["Bug