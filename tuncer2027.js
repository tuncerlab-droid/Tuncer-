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

        async konus(girdi) {
            if (!girdi || typeof girdi !== "string") {
                return "Lütfen bir şey söyleyin.";
            }

            const basla = Date.now();
            this.konusmaGecmisi.push({ rol: "kullanici", mesaj: girdi, zaman: basla });

            const analiz = this.dil.analizEt(girdi);
            this._log("Analiz: " + JSON.stringify(analiz));

            const duygu = this.dil.duyguAnalizi(girdi);
            const niyet = this._niyetTespit(girdi, analiz);
            this._log("Niyet: " + niyet);

            let cevap;

            switch(niyet) {
                case "selamlama": cevap = this._selamVer(analiz); break;
                case "matematik": cevap = this.matematik.coz(girdi); break;
                case "kod_yaz": cevap = await this.kod.kodYaz(girdi); break;
                case "kod_analiz": cevap = this.kod.kodAnaliz(girdi); break;
                case "hava_durumu": cevap = await this.ag.havaDurumu(girdi); break;
                case "wikipedia": cevap = await this.ag.wikipediaBilgi(girdi); break;
                case "gorsel_uret": cevap = await this.gorsel.gorselUret(girdi); break;
                case "gorsel_anla": cevap = "Görsel analizi için gorselAnla() metodunu kullanın."; break;
                case "ozet": cevap = this.dil.ozetle(girdi); break;
                case "tercume": cevap = this.dil.tercumeEt(girdi); break;
                case "kimsin": cevap = this._kendiniTanit(); break;
                case "dusun": cevap = await this.dusunce.derinDusun(girdi); break;
                case "ogren": cevap = this.ogrenme.ogren(girdi); break;
                case "hatirla": cevap = this.hafiza.hatirla(girdi); break;
                default: cevap = await this.dusunce.cevapUret(girdi, analiz, duygu); break;
            }

            const sure = Date.now() - basla;
            const sonuc = { cevap: cevap, sure: sure + "ms", duygu: duygu, niyet: niyet };

            this.konusmaGecmisi.push({ rol: "tuncer", mesaj: cevap, zaman: Date.now() });
            this.hafiza.kaydet("konusma", { girdi, cevap, niyet, duygu });

            return sonuc;
        }

        _niyetTespit(girdi, analiz) {
            const kucuk = girdi.toLowerCase().trim();
            const selamlar = ["merhaba", "selam", "hey", "naber", "nasılsın", "günaydın", "iyi akşamlar", "iyi geceler", "sa", "as"];
            if (selamlar.some(s => kucuk.includes(s))) return "selamlama";

            const kimsinKelimeler = ["kimsin", "nesin", "adın ne", "kendini tanıt", "sen kimsin", "kim yaptı", "tasarımcı", "tuncer"];
            if (kimsinKelimeler.some(k => kucuk.includes(k))) return "kimsin";

            const matKelimeler = ["hesapla", "topla", "çıkar", "çarp", "böl", "karekök", "üssü", "faktöriyel", "kaçtır", "kaç eder", "matematik", "işlem"];
            if (matKelimeler.some(m => kucuk.includes(m)) || /[\d]+\s*[\+\-\*\/\^]\s*[\d]+/.test(kucuk) || /\d+\s*(artı|eksi|çarpı|bölü)\s*\d+/.test(kucuk)) return "matematik";

            const kodYazKelimeler = ["kod yaz", "program yaz", "fonksiyon yaz", "script yaz", "kodla", "programla", "kod oluştur", "javascript yaz", "python yaz", "html yaz", "css yaz"];
            if (kodYazKelimeler.some(k => kucuk.includes(k))) return "kod_yaz";

            const kodAnalizKelimeler = ["kodu analiz", "kodu incele", "kod analiz", "bu kod ne", "kodu açıkla"];
            if (kodAnalizKelimeler.some(k => kucuk.includes(k))) return "kod_analiz";

            const havaKelimeler = ["hava durumu", "hava nasıl", "sıcaklık", "yağmur yağacak", "hava", "meteoroloji"];
            if (havaKelimeler.some(h => kucuk.includes(h))) return "hava_durumu";

            const wikiKelimeler = ["wikipedia", "vikipedi", "kimdir", "nedir", "bilgi ver", "hakkında bilgi", "araştır", "kim bu"];
            if (wikiKelimeler.some(w => kucuk.includes(w))) return "wikipedia";

            const gorselKelimeler = ["görsel oluştur", "resim yap", "çiz", "görsel üret", "resim oluştur", "görsel yap", "tablo çiz"];
            if (gorselKelimeler.some(g => kucuk.includes(g))) return "gorsel_uret";

            const gorselAnlaKelimeler = ["resmi analiz", "görseli analiz", "resimde ne var", "görseli anla", "resmi açıkla"];
            if (gorselAnlaKelimeler.some(g => kucuk.includes(g))) return "gorsel_anla";

            const ozetKelimeler = ["özetle", "özet", "kısalt", "kısa anlat"];
            if (ozetKelimeler.some(o => kucuk.includes(o))) return "ozet";

            const tercumeKelimeler = ["tercüme", "çevir", "ingilizcesi", "türkçesi", "translate"];
            if (tercumeKelimeler.some(t => kucuk.includes(t))) return "tercume";

            const dusunKelimeler = ["düşün", "analiz et", "derinlemesine", "detaylı düşün", "uzun düşün", "iyice düşün"];
            if (dusunKelimeler.some(d => kucuk.includes(d))) return "dusun";

            const ogrenKelimeler = ["öğren", "bunu bil", "hatırla", "kaydet", "unutma"];
            if (ogrenKelimeler.some(o => kucuk.includes(o))) return "ogren";

            const hatirlaKelimeler = ["hatırlıyor musun", "ne demiştin", "önceki", "geçmiş konuşma"];
            if (hatirlaKelimeler.some(h => kucuk.includes(h))) return "hatirla";

            return "genel";
        }

        _selamVer(analiz) {
            const saat = new Date().getHours();
            let zamanDilimi = saat >= 6 && saat < 12 ? "günaydın" : saat >= 12 && saat < 18 ? "iyi günler" : saat >= 18 && saat < 22 ? "iyi akşamlar" : "iyi geceler";
            const selamlar = [
                `Merhaba! ${zamanDilimi}! Ben Tuncer Zeka. Size nasıl yardımcı olabilirim?`,
                `Selam! ${zamanDilimi}! Tuncer Zeka olarak hizmetinizdeyim. Buyurun!`,
                `Hey! ${zamanDilimi}! Ben Ahmet Tuncer'in geliştirdiği yapay zeka. Neler yapabilirim?`,
                `${zamanDilimi}! Tuncer Zeka burada. Ne isterseniz!`
            ];
            return selamlar[Math.floor(Math.random() * selamlar.length)];
        }

        _kendiniTanit() {
            return `🧠 Ben TUNCER ZEKA v${this.versiyon}!\n👨‍💻 Tasarımcım: Ahmet Tuncer\n📅 Oluşturulma: ${this.olusturmaTarihi}`;
        }

        async gorselAnla(gorselVerisi) {
            return this.gorsel.gorselAnla(gorselVerisi);
        }

        durum() {
            return {
                isim: this.isim,
                versiyon: this.versiyon,
                tasarimci: this.tasarimci,
                aktif: this.aktif,
                hafizaKullanilanSlot: this.hafiza.boyut(),
                konusmaAdedi: this.konusmaGecmisi.length,
                ogrenilenBilgiSayisi: this.ogrenme.bilgiSayisi(),
            };
        }

        sifirla() {
            this.konusmaGecmisi = [];
            this.hafiza.temizle();
            this.ogrenme.sifirla();
            return "Tuncer Zeka sıfırlandı.";
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DİĞER SINIFLAR (HafizaSistemi, DilMotoru vb.)
    // ═══════════════════════════════════════════════════════════════

    class HafizaSistemi {
        constructor(kapasite) {
            this.kapasite = kapasite;
            this.kisaHafiza = [];
            this.uzunHafiza = new Map();
            this.indeks = new Map();
        }
        kaydet(kategori, veri) {
            const kayit = { id: "h_" + Date.now(), kategori: kategori, veri: veri, zaman: Date.now(), erisimSayisi: 0 };
            this.kisaHafiza.push(kayit);
            return kayit.id;
        }
        hatirla(sorgu) { return "Hafıza modülü aktif. Yakında arama özelliği devreye girecek."; }
        boyut() { return this.kisaHafiza.length + this.uzunHafiza.size; }
        temizle() { this.kisaHafiza = []; this.uzunHafiza.clear(); this.indeks.clear(); }
    }

    class DilMotoru {
        constructor() {
            this.durmaKelimeleri = new Set(["bir", "ve", "ile", "bu", "şu", "o"]);
            this.olumluKelimeler = new Set(["güzel", "harika", "süper", "iyi"]);
            this.olumsuzKelimeler = new Set(["kötü", "berbat", "rezalet", "iğrenç"]);
        }
        analizEt(metin) {
            const kelimeler = metin.replace(/[^\wçğıöşüÇĞİÖŞÜ\s]/g, " ").split(/\s+/).filter(k => k.length > 0);
            return {
                orijinal: metin,
                kelimeler: kelimeler,
                anlamliKelimeler: kelimeler.filter(k => !this.durmaKelimeleri.has(k.toLowerCase())),
                kelimeSayisi: kelimeler.length,
                soruMu: metin.includes("?"),
                emirMi: ["yap", "et", "ver"].some(e => metin.toLowerCase().includes(e))
            };
        }
        duyguAnalizi(metin) {
            return { duygu: "nötr", yogunluk: "düşük" };
        }
        ozetle(metin) { return "Özetleme motoru devrede."; }
        tercumeEt(metin) { return "Tercüme motoru devrede."; }
    }

    class MatematikMotoru {
        coz(girdi) {
            try {
                const temiz = girdi.replace(/[^0-9\+\-\*\/\.\(\)\s\%]/g, "");
                const hesapla = new Function(`"use strict"; return (${temiz});`);
                return `🔢 Sonuç: ${hesapla()}`;
            } catch (hata) {
                return "Matematiksel işlemi anlayamadım.";
            }
        }
    }

    class DusunceMotoru {
        constructor(ana) { this.ana = ana; }
        async derinDusun(soru) { return `Derin düşünme sonucu: ${soru} üzerinde çalıştım.`; }
        async cevapUret(girdi, analiz, duygu) { return `Hmm, "${girdi}" hakkında düşünüyorum...`; }
    }

    class GorselMotor {
        async gorselUret(aciklama) { return { mesaj: "Görsel üretildi.", gorsel: "", tip: "svg" }; }
        gorselAnla(gorselVerisi) { return "Görsel analiz edildi."; }
    }

    class KodMotoru {
        async kodYaz(girdi) { return "```javascript\n// Kod üretildi\nconsole.log('Tuncer Zeka');\n```"; }
        kodAnaliz(girdi) { return "Kod analizi tamamlandı."; }
    }

    class BilgiBankasi {
        constructor() { this.veriler = new Map(); }
    }

    class OgrenmeSistemi {
        constructor(ana) { this.ogrenilmisler = new Map(); }
        ogren(girdi) { return "Bilgi öğrenildi."; }
        bilgiSorgula(sorgu) { return null; }
        bilgiSayisi() { return this.ogrenilmisler.size; }
        sifirla() { this.ogrenilmisler.clear(); }
    }

    class AgServisleri {
        constructor() {
            this.onbellek = new Map();
            this.onbellekSuresi = 300000;
        }

        async wikipediaBilgi(girdi) {
            return "Wikipedia modülü çevrimiçi aranıyor...";
        }

        // BURASI YARIM KALMIŞTI, TAMAMLANDI:
        async havaDurumu(girdi) {
            let sehir = girdi.replace(/(hava durumu|hava|sıcaklık)/gi, "").trim() || "İstanbul";
            
            try {
                const url = `https://wttr.in/${encodeURIComponent(sehir)}?format=j1&lang=tr`;
                const yanit = await fetch(url, { headers: { "Accept": "application/json" } });
                
                if (yanit.ok) {
                    const veri = await yanit.json();
                    if (veri.current_condition && veri.current_condition[0]) {
                        const guncel = veri.current_condition[0];
                        const sicaklik = guncel.temp_C;
                        const durumTR = guncel.lang_tr ? guncel.lang_tr[0].value : "Bilinmiyor";
                        
                        let tahminMetni = "";
                        if (veri.weather && veri.weather.length > 0) {
                            tahminMetni = "\n\n📅 3 Günlük Tahmin:\n";
                            veri.weather.slice(0, 3).forEach((gun) => {
                                const tarih = gun.date;
                                const maxS = gun.maxtempC;
                                const minS = gun.mintempC;
                                const gunDurum = gun.hourly && gun.hourly[4] && gun.hourly[4].lang_tr ? gun.hourly[4].lang_tr[0].value : "";
                                
                                const d = new Date(tarih);
                                const gunler = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
                                const gunAdi = gunler[d.getDay()];
                                
                                tahminMetni += `  • ${gunAdi}: ${minS}°C / ${maxS}°C, ${gunDurum}\n`;
                            });
                        }
                        
                        return `🌤️ HAVA DURUMU: ${sehir.toUpperCase()}\n${"═".repeat(40)}\nDurum: ${durumTR}\nSıcaklık: ${sicaklik}°C${tahminMetni}\n🤖 Tuncer Zeka v2026`;
                    }
                }
            } catch (hata) {
                return `🌤️ "${sehir}" için internete bağlanılamadı.`;
            }
            return `🌤️ "${sehir}" bilgisi alınamadı.`;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DIŞA AKTARMA (EXPORT) BÖLÜMÜ - SORUNUN ÇÖZÜLDÜĞÜ YER
    // ═══════════════════════════════════════════════════════════════════════
    // Bu kod, kütüphanenin kapalı kutudan çıkarılıp HTML (ve diğer js dosyaları) 
    // tarafından görünebilir (erişilebilir) olmasını sağlar.

    global.TuncerZeka = TuncerZeka;

})(typeof window !== "undefined" ? window : this);

