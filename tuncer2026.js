/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                    TUNCER ZEKA v2026                        ║
 * ║              Yapay Zeka Kütüphanesi (JavaScript)            ║
 * ║                                                             ║
 * ║  Tasarımcı: Ahmet Tuncer                                    ║
 * ║  Sürüm: 2026.1.0                                           ║
 * ║  Lisans: Açık Kaynak                                        ║
 * ║                                                             ║
 * ║  Özellikler:                                                ║
 * ║  - Doğal Dil İşleme (Türkçe)                               ║
 * ║  - Görsel Anlama & Üretim                                   ║
 * ║  - Kod Yazma & Analiz                                       ║
 * ║  - Uzun Süreli Düşünme (Chain of Thought)                   ║
 * ║  - Sinir Ağı Altyapısı                                      ║
 * ║  - Bellek Sistemi                                           ║
 * ║  - Duygu Analizi                                            ║
 * ║  - Öğrenme Yeteneği                                         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

(function (global) {
    "use strict";

    // ================================================================
    // BÖLÜM 1: MATEMATİK & YARDIMCI FONKSİYONLAR
    // ================================================================

    const Matematik = {
        sigmoid: (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
        sigmoidTurev: (x) => x * (1 - x),
        tanh: (x) => Math.tanh(x),
        tanhTurev: (x) => 1 - x * x,
        relu: (x) => Math.max(0, x),
        reluTurev: (x) => (x > 0 ? 1 : 0),
        leakyRelu: (x) => (x > 0 ? x : 0.01 * x),
        softmax: (arr) => {
            const max = Math.max(...arr);
            const exp = arr.map((x) => Math.exp(x - max));
            const sum = exp.reduce((a, b) => a + b, 0);
            return exp.map((x) => x / sum);
        },
        rastgele: (min = -1, max = 1) => Math.random() * (max - min) + min,
        gaussRastgele: () => {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        },
        kosinusBenzerlik: (a, b) => {
            if (a.length !== b.length) return 0;
            let dot = 0, normA = 0, normB = 0;
            for (let i = 0; i < a.length; i++) {
                dot += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
            }
            const denom = Math.sqrt(normA) * Math.sqrt(normB);
            return denom === 0 ? 0 : dot / denom;
        },
        oklitMesafe: (a, b) => {
            let sum = 0;
            for (let i = 0; i < a.length; i++) {
                sum += (a[i] - b[i]) ** 2;
            }
            return Math.sqrt(sum);
        },
        matrisCarp: (a, b) => {
            const sonuc = [];
            for (let i = 0; i < a.length; i++) {
                sonuc[i] = [];
                for (let j = 0; j < b[0].length; j++) {
                    let toplam = 0;
                    for (let k = 0; k < a[0].length; k++) {
                        toplam += a[i][k] * b[k][j];
                    }
                    sonuc[i][j] = toplam;
                }
            }
            return sonuc;
        },
        vektorTopla: (a, b) => a.map((v, i) => v + (b[i] || 0)),
        vektorCarp: (a, skalar) => a.map((v) => v * skalar),
        normalize: (arr) => {
            const max = Math.max(...arr.map(Math.abs));
            return max === 0 ? arr : arr.map((x) => x / max);
        },
        crossEntropy: (predicted, actual) => {
            let loss = 0;
            for (let i = 0; i < actual.length; i++) {
                loss -= actual[i] * Math.log(Math.max(predicted[i], 1e-15));
            }
            return loss;
        }
    };

    // ================================================================
    // BÖLÜM 2: SİNİR AĞI ALTYAPISI
    // ================================================================

    class Noron {
        constructor(girisAdedi) {
            this.agirliklar = [];
            this.bias = Matematik.gaussRastgele() * 0.5;
            this.cikti = 0;
            this.delta = 0;
            this.girisler = [];
            this.agirlikDegisimleri = [];
            this.biasDegisimi = 0;

            for (let i = 0; i < girisAdedi; i++) {
                this.agirliklar.push(Matematik.gaussRastgele() * Math.sqrt(2.0 / girisAdedi));
                this.agirlikDegisimleri.push(0);
            }
        }

        hesapla(girisler, aktivasyon = "sigmoid") {
            this.girisler = girisler;
            let toplam = this.bias;
            for (let i = 0; i < girisler.length; i++) {
                toplam += girisler[i] * this.agirliklar[i];
            }
            switch (aktivasyon) {
                case "sigmoid": this.cikti = Matematik.sigmoid(toplam); break;
                case "tanh": this.cikti = Matematik.tanh(toplam); break;
                case "relu": this.cikti = Matematik.relu(toplam); break;
                case "leakyRelu": this.cikti = Matematik.leakyRelu(toplam); break;
                default: this.cikti = Matematik.sigmoid(toplam);
            }
            return this.cikti;
        }
    }

    class SinirAgi {
        constructor(katmanlar, ogrenmeOrani = 0.01, momentum = 0.9) {
            this.katmanlar = [];
            this.ogrenmeOrani = ogrenmeOrani;
            this.momentum = momentum;
            this.aktivasyon = "leakyRelu";
            this.kayipGecmisi = [];
            this.epoch = 0;

            for (let i = 1; i < katmanlar.length; i++) {
                const katman = [];
                for (let j = 0; j < katmanlar[i]; j++) {
                    katman.push(new Noron(katmanlar[i - 1]));
                }
                this.katmanlar.push(katman);
            }
        }

        ileriYayilim(girisler) {
            let mevcutGiris = girisler;
            for (let i = 0; i < this.katmanlar.length; i++) {
                const ciktilar = [];
                const aktFn = i === this.katmanlar.length - 1 ? "sigmoid" : this.aktivasyon;
                for (const noron of this.katmanlar[i]) {
                    ciktilar.push(noron.hesapla(mevcutGiris, aktFn));
                }
                mevcutGiris = ciktilar;
            }
            return mevcutGiris;
        }

        geriYayilim(hedefler) {
            const sonKatman = this.katmanlar[this.katmanlar.length - 1];
            for (let i = 0; i < sonKatman.length; i++) {
                const noron = sonKatman[i];
                const hata = hedefler[i] - noron.cikti;
                noron.delta = hata * Matematik.sigmoidTurev(noron.cikti);
            }

            for (let i = this.katmanlar.length - 2; i >= 0; i--) {
                for (let j = 0; j < this.katmanlar[i].length; j++) {
                    let hata = 0;
                    for (const noron of this.katmanlar[i + 1]) {
                        hata += noron.agirliklar[j] * noron.delta;
                    }
                    const noron = this.katmanlar[i][j];
                    const turev = this.aktivasyon === "relu"
                        ? Matematik.reluTurev(noron.cikti)
                        : this.aktivasyon === "leakyRelu"
                            ? (noron.cikti > 0 ? 1 : 0.01)
                            : Matematik.sigmoidTurev(noron.cikti);
                    noron.delta = hata * turev;
                }
            }

            for (const katman of this.katmanlar) {
                for (const noron of katman) {
                    for (let i = 0; i < noron.agirliklar.length; i++) {
                        const degisim = this.ogrenmeOrani * noron.delta * noron.girisler[i]
                            + this.momentum * noron.agirlikDegisimleri[i];
                        noron.agirliklar[i] += degisim;
                        noron.agirlikDegisimleri[i] = degisim;
                    }
                    const biasDeg = this.ogrenmeOrani * noron.delta + this.momentum * noron.biasDegisimi;
                    noron.bias += biasDeg;
                    noron.biasDegisimi = biasDeg;
                }
            }
        }

        egit(girisler, hedefler) {
            const cikti = this.ileriYayilim(girisler);
            this.geriYayilim(hedefler);
            let kayip = 0;
            for (let i = 0; i < hedefler.length; i++) {
                kayip += (hedefler[i] - cikti[i]) ** 2;
            }
            return kayip / hedefler.length;
        }

        topluEgit(veriSeti, epochSayisi = 100, karistir = true) {
            const kayiplar = [];
            for (let e = 0; e < epochSayisi; e++) {
                let toplamKayip = 0;
                const veri = karistir ? [...veriSeti].sort(() => Math.random() - 0.5) : veriSeti;
                for (const { giris, hedef } of veri) {
                    toplamKayip += this.egit(giris, hedef);
                }
                const ortKayip = toplamKayip / veriSeti.length;
                kayiplar.push(ortKayip);
                this.epoch++;
            }
            this.kayipGecmisi.push(...kayiplar);
            return kayiplar;
        }

        tahminEt(girisler) {
            return this.ileriYayilim(girisler);
        }

        kaydet() {
            return JSON.stringify({
                katmanlar: this.katmanlar.map(k => k.map(n => ({
                    agirliklar: n.agirliklar,
                    bias: n.bias
                }))),
                ogrenmeOrani: this.ogrenmeOrani,
                momentum: this.momentum,
                aktivasyon: this.aktivasyon,
                epoch: this.epoch
            });
        }

        yukle(json) {
            const veri = typeof json === "string" ? JSON.parse(json) : json;
            for (let i = 0; i < this.katmanlar.length; i++) {
                for (let j = 0; j < this.katmanlar[i].length; j++) {
                    this.katmanlar[i][j].agirliklar = veri.katmanlar[i][j].agirliklar;
                    this.katmanlar[i][j].bias = veri.katmanlar[i][j].bias;
                }
            }
            this.ogrenmeOrani = veri.ogrenmeOrani;
            this.momentum = veri.momentum;
            this.aktivasyon = veri.aktivasyon;
            this.epoch = veri.epoch;
        }
    }

    // ================================================================
    // BÖLÜM 3: TRANSFORMER BENZERİ DİKKAT MEKANİZMASI
    // ================================================================

    class DikkatMekanizmasi {
        constructor(boyut) {
            this.boyut = boyut;
            this.Wq = this.rastgeleMatris(boyut, boyut);
            this.Wk = this.rastgeleMatris(boyut, boyut);
            this.Wv = this.rastgeleMatris(boyut, boyut);
        }

        rastgeleMatris(satir, sutun) {
            const m = [];
            const scale = Math.sqrt(2.0 / (satir + sutun));
            for (let i = 0; i < satir; i++) {
                m[i] = [];
                for (let j = 0; j < sutun; j++) {
                    m[i][j] = Matematik.gaussRastgele() * scale;
                }
            }
            return m;
        }

        vektorMatrisCarp(vektor, matris) {
            const sonuc = [];
            for (let j = 0; j < matris[0].length; j++) {
                let toplam = 0;
                for (let i = 0; i < vektor.length; i++) {
                    toplam += vektor[i] * (matris[i] ? matris[i][j] || 0 : 0);
                }
                sonuc.push(toplam);
            }
            return sonuc;
        }

        dikkatHesapla(query, keys, values) {
            const q = this.vektorMatrisCarp(query, this.Wq);
            const skorlar = [];
            const scale = Math.sqrt(this.boyut);

            for (let i = 0; i < keys.length; i++) {
                const k = this.vektorMatrisCarp(keys[i], this.Wk);
                let skor = 0;
                for (let j = 0; j < q.length; j++) {
                    skor += q[j] * k[j];
                }
                skorlar.push(skor / scale);
            }

            const agirliklar = Matematik.softmax(skorlar);

            const sonuc = new Array(this.boyut).fill(0);
            for (let i = 0; i < values.length; i++) {
                const v = this.vektorMatrisCarp(values[i], this.Wv);
                for (let j = 0; j < sonuc.length; j++) {
                    sonuc[j] += agirliklar[i] * v[j];
                }
            }

            return { sonuc, agirliklar };
        }

        cokBasliDikkat(query, keys, values, baslikSayisi = 4) {
            const baslikBoyut = Math.floor(this.boyut / baslikSayisi);
            const sonuclar = [];

            for (let h = 0; h < baslikSayisi; h++) {
                const baslangic = h * baslikBoyut;
                const bitis = baslangic + baslikBoyut;

                const qParca = query.slice(baslangic, bitis);
                const kParcalar = keys.map(k => k.slice(baslangic, bitis));
                const vParcalar = values.map(v => v.slice(baslangic, bitis));

                const miniDikkat = new DikkatMekanizmasi(baslikBoyut);
                const { sonuc } = miniDikkat.dikkatHesapla(qParca, kParcalar, vParcalar);
                sonuclar.push(...sonuc);
            }

            while (sonuclar.length < this.boyut) sonuclar.push(0);
            return sonuclar.slice(0, this.boyut);
        }
    }

    // ================================================================
    // BÖLÜM 4: KELİME GÖMME (WORD EMBEDDING) SİSTEMİ
    // ================================================================

    class KelimeGomme {
        constructor(boyut = 64) {
            this.boyut = boyut;
            this.kelimeSozlugu = new Map();
            this.indeksKelime = new Map();
            this.vektorler = new Map();
            this.sayac = 0;
            this.idfDegerleri = new Map();
            this.dokumaSayisi = 0;
        }

        kelimeEkle(kelime) {
            const k = kelime.toLowerCase().trim();
            if (!this.kelimeSozlugu.has(k)) {
                this.kelimeSozlugu.set(k, this.sayac);
                this.indeksKelime.set(this.sayac, k);
                const vektor = [];
                for (let i = 0; i < this.boyut; i++) {
                    vektor.push(Matematik.gaussRastgele() * 0.3);
                }
                // Deterministik bileşen ekle (karakter bazlı hash)
                let hash = 0;
                for (let i = 0; i < k.length; i++) {
                    hash = ((hash << 5) - hash + k.charCodeAt(i)) | 0;
                }
                for (let i = 0; i < this.boyut; i++) {
                    vektor[i] += Math.sin(hash * (i + 1) * 0.01) * 0.5;
                }
                this.vektorler.set(k, Matematik.normalize(vektor));
                this.sayac++;
            }
            return this.kelimeSozlugu.get(k);
        }

        kelimeVektoru(kelime) {
            const k = kelime.toLowerCase().trim();
            if (!this.vektorler.has(k)) {
                this.kelimeEkle(k);
            }
            return this.vektorler.get(k);
        }

        cumleVektoru(cumle) {
            const kelimeler = this.tokenize(cumle);
            if (kelimeler.length === 0) return new Array(this.boyut).fill(0);

            const vektor = new Array(this.boyut).fill(0);
            let agirlikToplam = 0;

            for (let idx = 0; idx < kelimeler.length; idx++) {
                const kv = this.kelimeVektoru(kelimeler[idx]);
                // Pozisyon ağırlığı
                const pozAgirlik = 1 + 0.5 * Math.sin(idx * Math.PI / kelimeler.length);
                for (let i = 0; i < this.boyut; i++) {
                    vektor[i] += kv[i] * pozAgirlik;
                }
                agirlikToplam += pozAgirlik;
            }

            for (let i = 0; i < this.boyut; i++) {
                vektor[i] /= agirlikToplam;
            }

            return Matematik.normalize(vektor);
        }

        tokenize(metin) {
            return metin
                .toLowerCase()
                .replace(/[^\wçğıöşüâîûÇĞİÖŞÜ\s]/g, " ")
                .split(/\s+/)
                .filter((k) => k.length > 0);
        }

        benzerlik(kelime1, kelime2) {
            const v1 = typeof kelime1 === "string" ? this.kelimeVektoru(kelime1) : kelime1;
            const v2 = typeof kelime2 === "string" ? this.kelimeVektoru(kelime2) : kelime2;
            return Matematik.kosinusBenzerlik(v1, v2);
        }

        enBenzerKelimeler(kelime, n = 5) {
            const hedefVektor = this.kelimeVektoru(kelime);
            const skorlar = [];
            for (const [k, v] of this.vektorler) {
                if (k !== kelime.toLowerCase()) {
                    skorlar.push({ kelime: k, skor: Matematik.kosinusBenzerlik(hedefVektor, v) });
                }
            }
            return skorlar.sort((a, b) => b.skor - a.skor).slice(0, n);
        }
    }

    // ================================================================
    // BÖLÜM 5: BELLEK SİSTEMİ
    // ================================================================

    class BellekSistemi {
        constructor(kapasite = 10000) {
            this.kisaSureli = [];
            this.uzunSureli = new Map();
            this.episodik = [];
            this.kapasite = kapasite;
            this.onemSkorlari = new Map();
            this.erisimSayilari = new Map();
            this.sonErisim = new Map();
        }

        kisaSureliEkle(bilgi) {
            this.kisaSureli.push({
                icerik: bilgi,
                zaman: Date.now(),
                id: Math.random().toString(36).substr(2, 9)
            });
            if (this.kisaSureli.length > 50) {
                this.konsolide();
            }
        }

        uzunSureliEkle(anahtar, deger, onem = 0.5) {
            this.uzunSureli.set(anahtar, {
                deger,
                zaman: Date.now(),
                onem,
                erisimSayisi: 0
            });
            this.onemSkorlari.set(anahtar, onem);

            if (this.uzunSureli.size > this.kapasite) {
                this.unutmaMekanizmasi();
            }
        }

        uzunSureliGetir(anahtar) {
            if (this.uzunSureli.has(anahtar)) {
                const kayit = this.uzunSureli.get(anahtar);
                kayit.erisimSayisi++;
                kayit.sonErisim = Date.now();
                const mevcutOnem = this.onemSkorlari.get(anahtar) || 0.5;
                this.onemSkorlari.set(anahtar, Math.min(1, mevcutOnem + 0.05));
                return kayit.deger;
            }
            return null;
        }

        episodikEkle(olay) {
            this.episodik.push({
                olay,
                zaman: Date.now(),
                duyguDurumu: olay.duygu || "nötr"
            });
            if (this.episodik.length > 1000) {
                this.episodik = this.episodik.slice(-500);
            }
        }

        konsolide() {
            const onemli = this.kisaSureli.filter((b) => {
                return b.icerik && (typeof b.icerik === "string" ? b.icerik.length > 10 : true);
            });
            for (const bilgi of onemli) {
                const anahtar = typeof bilgi.icerik === "string"
                    ? bilgi.icerik.substring(0, 50)
                    : bilgi.id;
                this.uzunSureliEkle(anahtar, bilgi.icerik, 0.3);
            }
            this.kisaSureli = this.kisaSureli.slice(-10);
        }

        unutmaMekanizmasi() {
            const simdiki = Date.now();
            const silinecekler = [];

            for (const [anahtar, kayit] of this.uzunSureli) {
                const yas = (simdiki - kayit.zaman) / (1000 * 60 * 60);
                const onem = this.onemSkorlari.get(anahtar) || 0;
                const erisim = kayit.erisimSayisi || 0;
                const skor = onem * 0.4 + Math.min(erisim / 10, 1) * 0.3 + Math.max(0, 1 - yas / 24) * 0.3;

                if (skor < 0.15) {
                    silinecekler.push(anahtar);
                }
            }

            for (const anahtar of silinecekler) {
                this.uzunSureli.delete(anahtar);
                this.onemSkorlari.delete(anahtar);
            }
        }

        ara(sorgu, limit = 5) {
            const sonuclar = [];
            for (const [anahtar, kayit] of this.uzunSureli) {
                const benzerlik = this.metinBenzerlik(sorgu, anahtar);
                if (benzerlik > 0.2) {
                    sonuclar.push({ anahtar, deger: kayit.deger, skor: benzerlik });
                }
            }
            return sonuclar.sort((a, b) => b.skor - a.skor).slice(0, limit);
        }

        metinBenzerlik(a, b) {
            const setA = new Set(a.toLowerCase().split(/\s+/));
            const setB = new Set(b.toLowerCase().split(/\s+/));
            const kesisim = new Set([...setA].filter((x) => setB.has(x)));
            const birlesim = new Set([...setA, ...setB]);
            return birlesim.size === 0 ? 0 : kesisim.size / birlesim.size;
        }

        istatistikler() {
            return {
                kisaSureli: this.kisaSureli.length,
                uzunSureli: this.uzunSureli.size,
                episodik: this.episodik.length,
                kapasite: this.kapasite,
                kullanimOrani: (this.uzunSureli.size / this.kapasite * 100).toFixed(1) + "%"
            };
        }
    }

    // ================================================================
    // BÖLÜM 6: DOĞAL DİL İŞLEME (TÜRKÇE)
    // ================================================================

    class TurkceDilIsleme {
        constructor() {
            this.durakKelimeler = new Set([
                "bir", "ve", "ile", "bu", "şu", "o", "da", "de", "mi", "mı",
                "mu", "mü", "ki", "ama", "fakat", "ancak", "için", "gibi",
                "kadar", "daha", "en", "çok", "az", "her", "hiç", "ne",
                "ya", "hem", "veya", "ise", "olan", "olarak", "ben", "sen",
                "biz", "siz", "onlar", "benim", "senin", "onun", "var", "yok",
                "değil", "evet", "hayır", "tamam", "peki", "acaba", "belki",
                "hep", "bile", "sadece", "zaten", "artık", "hala", "diye",
                "üzere", "göre", "karşı", "rağmen", "dolayı", "itibaren"
            ]);

            this.ekler = {
                isimHal: ["ı", "i", "u", "ü", "yı", "yi", "yu", "yü", "a", "e", "ya", "ye", "da", "de", "ta", "te", "dan", "den", "tan", "ten", "ın", "in", "un", "ün", "nın", "nin", "nun", "nün"],
                fiilCekim: ["yor", "iyor", "uyor", "üyor", "mak", "mek", "dı", "di", "du", "dü", "tı", "ti", "tu", "tü", "acak", "ecek", "ır", "ir", "ur", "ür", "ar", "er", "mış", "miş", "muş", "müş", "sa", "se", "malı", "meli"],
                cogul: ["lar", "ler"],
                sahiplik: ["ım", "im", "um", "üm", "ın", "in", "un", "ün", "ımız", "imiz", "umuz", "ümüz"]
            };

            this.duyguSozlugu = {
                pozitif: ["güzel", "harika", "muhteşem", "süper", "mükemmel", "iyi", "sevgi",
                    "mutlu", "mutluluk", "sevinç", "başarı", "başarılı", "tebrik", "bravo",
                    "teşekkür", "sağol", "seviyorum", "bayıldım", "enfes", "olağanüstü",
                    "fevkalade", "şahane", "efsane", "kusursuz", "parlak", "umut", "heyecan",
                    "neşe", "keyif", "zevk", "hoş", "tatlı", "güler", "gülümseme", "aşk",
                    "dostluk", "barış", "huzur", "rahat", "kolay", "pratik", "verimli",
                    "yaratıcı", "ilham", "motive", "enerji", "canlı", "dinamik", "pozitif"],
                negatif: ["kötü", "berbat", "rezalet", "korkunç", "üzgün", "üzücü", "acı",
                    "ağrı", "sorun", "problem", "hata", "yanlış", "eksik", "zor", "imkansız",
                    "mutsuz", "sinirli", "kızgın", "öfke", "nefret", "tiksinme", "iğrenç",
                    "çirkin", "korkutucu", "tehlike", "tehlikeli", "zararlı", "olumsuz",
                    "başarısız", "felaket", "kriz", "stres", "endişe", "kaygı", "panik",
                    "depresyon", "yalnız", "yalnızlık", "ağlamak", "gözyaşı", "kayıp",
                    "ölüm", "hastalık", "hasta", "ağır", "sıkıntı", "bunalım", "çaresiz"],
                soru: ["ne", "neden", "niçin", "nasıl", "nerede", "kim", "hangi", "kaç",
                    "mi", "mı", "mu", "mü", "acaba", "yoksa"],
                emir: ["yap", "et", "gel", "git", "al", "ver", "söyle", "anlat", "göster",
                    "bul", "ara", "oku", "yaz", "çiz", "hesapla", "oluştur", "üret",
                    "kodla", "programla", "tasarla", "çalıştır", "başlat", "durdur"]
            };

            this.niyetKaliplari = {
                selamlama: ["merhaba", "selam", "günaydın", "iyi günler", "iyi akşamlar", "hey", "naber", "nasılsın", "ne haber", "hoş geldin"],
                vedalaşma: ["hoşça kal", "görüşürüz", "bye", "güle güle", "iyi geceler", "kendine iyi bak"],
                soru: ["nedir", "nedir?", "ne demek", "nasıl", "neden", "niçin", "ne zaman", "nerede", "kim"],
                kodYazma: ["kod yaz", "kodla", "programla", "script", "fonksiyon yaz", "algoritma", "program yaz", "html", "css", "javascript", "python", "java"],
                gorselAnaliz: ["resim", "görsel", "fotoğraf", "resmi analiz", "görseli incele", "ne görüyorsun", "resimde ne var", "piksell"],
                gorselUretim: ["resim çiz", "görsel oluştur", "çiz", "resim yap", "illüstrasyon", "grafik oluştur", "canvas", "pixel art"],
                matematik: ["hesapla", "topla", "çıkar", "çarp", "böl", "karekök", "üs", "faktöriyel", "integral", "türev"],
                bilgi: ["anlat", "açıkla", "bilgi ver", "öğret", "tanım", "tarih", "ne biliyorsun"],
                duyguAnaliz: ["nasıl hissediyorum", "duygu analiz", "ruh hali", "duygu durumu", "sentiment"],
                kendiHakkinda: ["sen kimsin", "kimsin", "adın ne", "kendini tanıt", "tuncer", "tasarımcın kim", "seni kim yaptı", "yapımcın"]
            };
        }

        tokenize(metin) {
            return metin
                .toLowerCase()
                .replace(/[^\wçğıöşüâîûÇĞİÖŞÜ\s]/g, " ")
                .split(/\s+/)
                .filter((k) => k.length > 0);
        }

        kokBul(kelime) {
            let kok = kelime.toLowerCase();
            const tumEkler = [
                ...this.ekler.fiilCekim,
                ...this.ekler.isimHal,
                ...this.ekler.cogul,
                ...this.ekler.sahiplik
            ].sort((a, b) => b.length - a.length);

            for (const ek of tumEkler) {
                if (kok.endsWith(ek) && kok.length - ek.length >= 2) {
                    kok = kok.substring(0, kok.length - ek.length);
                    break;
                }
            }
            return kok;
        }

        durakKelimeFiltele(kelimeler) {
            return kelimeler.filter((k) => !this.durakKelimeler.has(k.toLowerCase()));
        }

        duyguAnalizi(metin) {
            const kelimeler = this.tokenize(metin);
            let pozitifSkor = 0;
            let negatifSkor = 0;
            let bulunanPozitif = [];
            let bulunanNegatif = [];

            for (const kelime of kelimeler) {
                const kok = this.kokBul(kelime);
                if (this.duyguSozlugu.pozitif.some(p => kelime.includes(p) || kok.includes(p) || p.includes(kok))) {
                    pozitifSkor++;
                    bulunanPozitif.push(kelime);
                }
                if (this.duyguSozlugu.negatif.some(n => kelime.includes(n) || kok.includes(n) || n.includes(kok))) {
                    negatifSkor++;
                    bulunanNegatif.push(kelime);
                }
            }

            // Olumsuzluk kontrolü
            const olumsuzluklar = ["değil", "yok", "olmaz", "istemem", "hayır", "asla"];
            const olumsuzlukVar = kelimeler.some(k => olumsuzluklar.includes(k));
            if (olumsuzlukVar) {
                [pozitifSkor, negatifSkor] = [negatifSkor, pozitifSkor];
            }

            const toplam = pozitifSkor + negatifSkor || 1;
            const skor = (pozitifSkor - negatifSkor) / toplam;

            let duygu;
            if (skor > 0.3) duygu = "çok pozitif 😊";
            else if (skor > 0.1) duygu = "pozitif 🙂";
            else if (skor > -0.1) duygu = "nötr 😐";
            else if (skor > -0.3) duygu = "negatif 😟";
            else duygu = "çok negatif 😢";

            return {
                duygu,
                skor: Math.round(skor * 100) / 100,
                pozitifSkor,
                negatifSkor,
                bulunanPozitif,
                bulunanNegatif,
                detay: `Pozitif kelimeler: ${bulunanPozitif.join(", ") || "yok"} | Negatif kelimeler: ${bulunanNegatif.join(", ") || "yok"}`
            };
        }

        niyetTespit(metin) {
            const metinLower = metin.toLowerCase();
            const skorlar = {};

            for (const [niyet, kaliplar] of Object.entries(this.niyetKaliplari)) {
                skorlar[niyet] = 0;
                for (const kalip of kaliplar) {
                    if (metinLower.includes(kalip)) {
                        skorlar[niyet] += kalip.split(" ").length;
                    }
                }
            }

            // Soru işareti kontrolü
            if (metin.includes("?")) {
                skorlar.soru = (skorlar.soru || 0) + 2;
            }

            let enYuksekNiyet = "sohbet";
            let enYuksekSkor = 0;

            for (const [niyet, skor] of Object.entries(skorlar)) {
                if (skor > enYuksekSkor) {
                    enYuksekSkor = skor;
                    enYuksekNiyet = niyet;
                }
            }

            return {
                niyet: enYuksekNiyet,
                skor: enYuksekSkor,
                tumSkorlar: skorlar
            };
        }

        anahtarKelimeCikar(metin, limit = 10) {
            const kelimeler = this.tokenize(metin);
            const filtrelenmis = this.durakKelimeFiltele(kelimeler);
            const frekans = {};

            for (const kelime of filtrelenmis) {
                const kok = this.kokBul(kelime);
                frekans[kok] = (frekans[kok] || 0) + 1;
            }

            return Object.entries(frekans)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([kelime, sayi]) => ({ kelime, sayi }));
        }

        cumleBol(metin) {
            return metin
                .split(/[.!?]+/)
                .map((c) => c.trim())
                .filter((c) => c.length > 0);
        }

        nGram(metin, n = 2) {
            const kelimeler = this.tokenize(metin);
            const gramlar = [];
            for (let i = 0; i <= kelimeler.length - n; i++) {
                gramlar.push(kelimeler.slice(i, i + n).join(" "));
            }
            return gramlar;
        }

        metinOzetle(metin, cumleSayisi = 3) {
            const cumleler = this.cumleBol(metin);
            if (cumleler.length <= cumleSayisi) return metin;

            const skorlar = cumleler.map((cumle, idx) => {
                const kelimeler = this.durakKelimeFiltele(this.tokenize(cumle));
                let skor = kelimeler.length * 0.3;
                if (idx === 0) skor += 2;
                if (idx === cumleler.length - 1) skor += 1;
                const anahtarlar = this.anahtarKelimeCikar(metin, 5).map(a => a.kelime);
                for (const k of kelimeler) {
                    if (anahtarlar.includes(this.kokBul(k))) skor += 1;
                }
                return { cumle, skor, idx };
            });

            return skorlar
                .sort((a, b) => b.skor - a.skor)
                .slice(0, cumleSayisi)
                .sort((a, b) => a.idx - b.idx)
                .map((s) => s.cumle)
                .join(". ") + ".";
        }
    }

    // ================================================================
    // BÖLÜM 7: GÖRSEL ANLAMA SİSTEMİ
    // ================================================================

    class GorselAnlama {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.filtreler = {
                grilestir: this.grilestir.bind(this),
                kenarTespit: this.kenarTespit.bind(this),
                bulaniklastir: this.bulaniklastir.bind(this),
                keskinlestir: this.keskinlestir.bind(this),
                negatif: this.negatif.bind(this),
                sepia: this.sepia.bind(this),
                parlaklik: this.parlaklik.bind(this),
                kontrast: this.kontrast.bind(this)
            };
        }

        canvasOlustur(genislik, yukseklik) {
            this.canvas = document.createElement("canvas");
            this.canvas.width = genislik;
            this.canvas.height = yukseklik;
            this.ctx = this.canvas.getContext("2d");
            return this.canvas;
        }

        gorselYukle(kaynak) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    this.canvasOlustur(img.width, img.height);
                    this.ctx.drawImage(img, 0, 0);
                    resolve(img);
                };
                img.onerror = reject;
                img.src = kaynak;
            });
        }

        pikselVerisiAl() {
            if (!this.ctx) return null;
            return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }

        pikselVerisiYaz(imageData) {
            if (!this.ctx) return;
            this.ctx.putImageData(imageData, 0, 0);
        }

        gorselAnaliz(imageData) {
            if (!imageData) imageData = this.pikselVerisiAl();
            if (!imageData) return null;

            const data = imageData.data;
            const pikselSayisi = data.length / 4;

            let toplamR = 0, toplamG = 0, toplamB = 0;
            let minParlaklik = 255, maxParlaklik = 0;
            let renkDagilimi = { kirmizi: 0, yesil: 0, mavi: 0, siyah: 0, beyaz: 0, gri: 0 };
            let parlaklikHistogram = new Array(256).fill(0);
            let kenarYogunlugu = 0;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                toplamR += r;
                toplamG += g;
                toplamB += b;

                const parlaklik = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                parlaklikHistogram[parlaklik]++;
                minParlaklik = Math.min(minParlaklik, parlaklik);
                maxParlaklik = Math.max(maxParlaklik, parlaklik);

                if (r > 150 && g < 100 && b < 100) renkDagilimi.kirmizi++;
                else if (g > 150 && r < 100 && b < 100) renkDagilimi.yesil++;
                else if (b > 150 && r < 100 && g < 100) renkDagilimi.mavi++;
                else if (r < 50 && g < 50 && b < 50) renkDagilimi.siyah++;
                else if (r > 200 && g > 200 && b > 200) renkDagilimi.beyaz++;
                else if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) renkDagilimi.gri++;
            }

            const ortR = Math.round(toplamR / pikselSayisi);
            const ortG = Math.round(toplamG / pikselSayisi);
            const ortB = Math.round(toplamB / pikselSayisi);
            const ortParlaklik = Math.round((ortR * 0.299 + ortG * 0.587 + ortB * 0.114));

            let baskinRenk = "karışık";
            let maxRenk = 0;
            for (const [renk, sayi] of Object.entries(renkDagilimi)) {
                if (sayi > maxRenk) {
                    maxRenk = sayi;
                    baskinRenk = renk;
                }
            }

            let parlaklikDurumu;
            if (ortParlaklik > 180) parlaklikDurumu = "çok aydınlık";
            else if (ortParlaklik > 120) parlaklikDurumu = "aydınlık";
            else if (ortParlaklik > 80) parlaklikDurumu = "orta";
            else if (ortParlaklik > 40) parlaklikDurumu = "karanlık";
            else parlaklikDurumu = "çok karanlık";

            const kontrast = maxParlaklik - minParlaklik;
            let kontrastDurumu;
            if (kontrast > 200) kontrastDurumu = "yüksek kontrast";
            else if (kontrast > 100) kontrastDurumu = "orta kontrast";
            else kontrastDurumu = "düşük kontrast";

            // Basit bölge analizi
            const genislik = imageData.width;
            const yukseklik = imageData.height;
            const bolgeler = this.bolgeAnalizi(data, genislik, yukseklik);

            return {
                boyut: { genislik, yukseklik },
                pikselSayisi,
                ortalamaRenk: { r: ortR, g: ortG, b: ortB },
                ortalamaRenkHex: `#${ortR.toString(16).padStart(2, "0")}${ortG.toString(16).padStart(2, "0")}${ortB.toString(16).padStart(2, "0")}`,
                parlaklik: { ortalama: ortParlaklik, min: minParlaklik, max: maxParlaklik, durum: parlaklikDurumu },
                kontrast: { deger: kontrast, durum: kontrastDurumu },
                baskinRenk,
                renkDagilimi,
                bolgeler,
                aciklama: this.gorselAciklamaOlustur(ortParlaklik, baskinRenk, kontrastDurumu, genislik, yukseklik, bolgeler)
            };
        }

        bolgeAnalizi(data, genislik, yukseklik) {
            const bolgeler = {
                ustSol: { r: 0, g: 0, b: 0, n: 0 },
                ustSag: { r: 0, g: 0, b: 0, n: 0 },
                altSol: { r: 0, g: 0, b: 0, n: 0 },
                altSag: { r: 0, g: 0, b: 0, n: 0 },
                merkez: { r: 0, g: 0, b: 0, n: 0 }
            };

            const ortaX = genislik / 2;
            const ortaY = yukseklik / 2;
            const merkezBoyut = Math.min(genislik, yukseklik) / 4;

            for (let y = 0; y < yukseklik; y += 2) {
                for (let x = 0; x < genislik; x += 2) {
                    const idx = (y * genislik + x) * 4;
                    const r = data[idx], g = data[idx + 1], b = data[idx + 2];

                    if (Math.abs(x - ortaX) < merkezBoyut && Math.abs(y - ortaY) < merkezBoyut) {
                        bolgeler.merkez.r += r; bolgeler.merkez.g += g; bolgeler.merkez.b += b; bolgeler.merkez.n++;
                    }
                    if (x < ortaX && y < ortaY) {
                        bolgeler.ustSol.r += r; bolgeler.ustSol.g += g; bolgeler.ustSol.b += b; bolgeler.ustSol.n++;
                    } else if (x >= ortaX && y < ortaY) {
                        bolgeler.ustSag.r += r; bolgeler.ustSag.g += g; bolgeler.ustSag.b += b; bolgeler.ustSag.n++;
                    } else if (x < ortaX && y >= ortaY) {
                        bolgeler.altSol.r += r; bolgeler.altSol.g += g; bolgeler.altSol.b += b; bolgeler.altSol.n++;
                    } else {
                        bolgeler.altSag.r += r; bolgeler.altSag.g += g; bolgeler.altSag.b += b; bolgeler.altSag.n++;
                    }
                }
            }

            const sonuc = {};
            for (const [ad, bolge] of Object.entries(bolgeler)) {
                if (bolge.n > 0) {
                    sonuc[ad] = {
                        ortR: Math.round(bolge.r / bolge.n),
                        ortG: Math.round(bolge.g / bolge.n),
                        ortB: Math.round(bolge.b / bolge.n),
                        parlaklik: Math.round((bolge.r / bolge.n * 0.299 + bolge.g / bolge.n * 0.587 + bolge.b / bolge.n * 0.114))
                    };
                }
            }
            return sonuc;
        }

        gorselAciklamaOlustur(parlaklik, baskinRenk, kontrast, genislik, yukseklik, bolgeler) {
            let aciklama = `Bu ${genislik}x${yukseklik} piksel boyutunda bir görsel. `;

            const parlaklikAciklama = {
                "çok aydınlık": "Görsel oldukça aydınlık ve parlak tonlara sahip",
                "aydınlık": "Görsel genel olarak aydınlık tonlarda",
                "orta": "Görsel orta düzey parlaklığa sahip",
                "karanlık": "Görsel karanlık tonlarda",
                "çok karanlık": "Görsel oldukça karanlık ve koyu tonlarda"
            };

            const renkAciklama = {
                kirmizi: "kırmızı tonları baskın",
                yesil: "yeşil tonları baskın",
                mavi: "mavi tonları baskın",
                siyah: "siyah/koyu tonlar baskın",
                beyaz: "beyaz/açık tonlar baskın",
                gri: "gri tonlar baskın",
                "karışık": "çeşitli renkler dengeli dağılmış"
            };

            aciklama += (parlaklikAciklama[parlaklik > 180 ? "çok aydınlık" : parlaklik > 120 ? "aydınlık" : parlaklik > 80 ? "orta" : parlaklik > 40 ? "karanlık" : "çok karanlık"] || "") + ". ";
            aciklama += `Görselde ${renkAciklama[baskinRenk] || "çeşitli renkler mevcut"}. `;
            aciklama += `${kontrast} seviyesinde. `;

            if (bolgeler.merkez) {
                const merkezParlak = bolgeler.merkez.parlaklik;
                if (merkezParlak > 150) {
                    aciklama += "Merkezde parlak bir alan/nesne bulunuyor olabilir. ";
                } else if (merkezParlak < 80) {
                    aciklama += "Merkezde koyu bir alan/nesne bulunuyor olabilir. ";
                }
            }

            return aciklama;
        }

        grilestir(imageData) {
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const gri = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                data[i] = data[i + 1] = data[i + 2] = gri;
            }
            return imageData;
        }

        kenarTespit(imageData) {
            const genislik = imageData.width;
            const yukseklik = imageData.height;
            const kaynak = new Uint8ClampedArray(imageData.data);
            const data = imageData.data;

            // Sobel operatörü
            const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
            const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

            for (let y = 1; y < yukseklik - 1; y++) {
                for (let x = 1; x < genislik - 1; x++) {
                    let gx = 0, gy = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * genislik + (x + kx)) * 4;
                            const parlaklik = kaynak[idx] * 0.299 + kaynak[idx + 1] * 0.587 + kaynak[idx + 2] * 0.114;
                            gx += parlaklik * sobelX[ky + 1][kx + 1];
                            gy += parlaklik * sobelY[ky + 1][kx + 1];
                        }
                    }
                    const buyukluk = Math.min(255, Math.sqrt(gx * gx + gy * gy));
                    const idx = (y * genislik + x) * 4;
                    data[idx] = data[idx + 1] = data[idx + 2] = buyukluk;
                }
            }
            return imageData;
        }

        bulaniklastir(imageData, yaricap = 3) {
            const genislik = imageData.width;
            const yukseklik = imageData.height;
            const kaynak = new Uint8ClampedArray(imageData.data);
            const data = imageData.data;

            for (let y = 0; y < yukseklik; y++) {
                for (let x = 0; x < genislik; x++) {
                    let r = 0, g = 0, b = 0, sayac = 0;
                    for (let dy = -yaricap; dy <= yaricap; dy++) {
                        for (let dx = -yaricap; dx <= yaricap; dx++) {
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < genislik && ny >= 0 && ny < yukseklik) {
                                const idx = (ny * genislik + nx) * 4;
                                r += kaynak[idx]; g += kaynak[idx + 1]; b += kaynak[idx + 2];
                                sayac++;
                            }
                        }
                    }
                    const idx = (y * genislik + x) * 4;
                    data[idx] = r / sayac;
                    data[idx + 1] = g / sayac;
                    data[idx + 2] = b / sayac;
                }
            }
            return imageData;
        }

        keskinlestir(imageData) {
            const genislik = imageData.width;
            const yukseklik = imageData.height;
            const kaynak = new Uint8ClampedArray(imageData.data);
            const data = imageData.data;
            const kernel = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];

            for (let y = 1; y < yukseklik - 1; y++) {
                for (let x = 1; x < genislik - 1; x++) {
                    for (let c = 0; c < 3; c++) {
                        let toplam = 0;
                        for (let ky = -1; ky <= 1; ky++) {
                            for (let kx = -1; kx <= 1; kx++) {
                                const idx = ((y + ky) * genislik + (x + kx)) * 4 + c;
                                toplam += kaynak[idx] * kernel[ky + 1][kx + 1];
                            }
                        }
                        data[(y * genislik + x) * 4 + c] = Math.max(0, Math.min(255, toplam));
                    }
                }
            }
            return imageData;
        }

        negatif(imageData) {
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            return imageData;
        }

        sepia(imageData) {
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
            }
            return imageData;
        }

        parlaklik(imageData, deger = 30) {
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.max(0, Math.min(255, data[i] + deger));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + deger));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + deger));
            }
            return imageData;
        }

        kontrast(imageData, deger = 50) {
            const data = imageData.data;
            const faktor = (259 * (deger + 255)) / (255 * (259 - deger));
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.max(0, Math.min(255, faktor * (data[i] - 128) + 128));
                data[i + 1] = Math.max(0, Math.min(255, faktor * (data[i + 1] - 128) + 128));
                data[i + 2] = Math.max(0, Math.min(255, faktor * (data[i + 2] - 128) + 128));
            }
            return imageData;
        }

        renkPaletiCikar(imageData, paletBoyutu = 8) {
            const data = imageData.data;
            const renkler = {};

            for (let i = 0; i < data.length; i += 16) {
                const r = Math.round(data[i] / 32) * 32;
                const g = Math.round(data[i + 1] / 32) * 32;
                const b = Math.round(data[i + 2] / 32) * 32;
                const anahtar = `${r},${g},${b}`;
                renkler[anahtar] = (renkler[anahtar] || 0) + 1;
            }

            return Object.entries(renkler)
                .sort((a, b) => b[1] - a[1])
                .slice(0, paletBoyutu)
                .map(([renk, sayi]) => {
                    const [r, g, b] = renk.split(",").map(Number);
                    return {
                        rgb: { r, g, b },
                        hex: `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
                        oran: sayi
                    };
                });
        }
    }

    // ================================================================
    // BÖLÜM 8: GÖRSEL ÜRETİM SİSTEMİ
    // ================================================================

    class GorselUretim {
        constructor() {
            this.canvas = null;
            this.ctx = null;
        }

        canvasOlustur(genislik = 400, yukseklik = 400) {
            this.canvas = document.createElement("canvas");
            this.canvas.width = genislik;
            this.canvas.height = yukseklik;
            this.ctx = this.canvas.getContext("2d");
            return this.canvas;
        }

        // Prosedürel manzara üretimi
        manzaraUret(genislik = 600, yukseklik = 400, secenekler = {}) {
            const canvas = this.canvasOlustur(genislik, yukseklik);
            const ctx = this.ctx;
            const zaman = secenekler.zaman || "gunduz"; // gunduz, aksam, gece

            // Gökyüzü gradyanı
            let gkyGrad = ctx.createLinearGradient(0, 0, 0, yukseklik * 0.6);
            if (zaman === "gece") {
                gkyGrad.addColorStop(0, "#0a0a2e");
                gkyGrad.addColorStop(1, "#1a1a4e");
            } else if (zaman === "aksam") {
                gkyGrad.addColorStop(0, "#1a0533");
                gkyGrad.addColorStop(0.3, "#cc4400");
                gkyGrad.addColorStop(0.6, "#ff8800");
                gkyGrad.addColorStop(1, "#ffcc66");
            } else {
                gkyGrad.addColorStop(0, "#1e90ff");
                gkyGrad.addColorStop(0.5, "#87ceeb");
                gkyGrad.addColorStop(1, "#b0e0e6");
            }
            ctx.fillStyle = gkyGrad;
            ctx.fillRect(0, 0, genislik, yukseklik * 0.65);

            // Güneş/Ay
            if (zaman === "gece") {
                ctx.beginPath();
                ctx.arc(genislik * 0.8, yukseklik * 0.15, 30, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffcc";
                ctx.fill();
                // Yıldızlar
                for (let i = 0; i < 100; i++) {
                    const x = Math.random() * genislik;
                    const y = Math.random() * yukseklik * 0.5;
                    const boyut = Math.random() * 2 + 0.5;
                    ctx.beginPath();
                    ctx.arc(x, y, boyut, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
                    ctx.fill();
                }
            } else {
                const gunesX = zaman === "aksam" ? genislik * 0.7 : genislik * 0.3;
                const gunesY = zaman === "aksam" ? yukseklik * 0.35 : yukseklik * 0.12;
                const gunesRenk = zaman === "aksam" ? "#ff4400" : "#ffdd00";
                ctx.beginPath();
                ctx.arc(gunesX, gunesY, 35, 0, Math.PI * 2);
                ctx.fillStyle = gunesRenk;
                ctx.fill();
                ctx.shadowBlur = 30;
                ctx.shadowColor = gunesRenk;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Bulutlar
            if (zaman !== "gece") {
                for (let i = 0; i < 5; i++) {
                    this.bulutCiz(ctx, Math.random() * genislik, Math.random() * yukseklik * 0.3 + 20, Math.random() * 40 + 30);
                }
            }

            // Dağlar (arka plan)
            this.dagCiz(ctx, genislik, yukseklik, 0.5, "#4a6741", 3);
            this.dagCiz(ctx, genislik, yukseklik, 0.55, "#3d5a35", 4);

            // Zemin
            let zeminGrad = ctx.createLinearGradient(0, yukseklik * 0.6, 0, yukseklik);
            zeminGrad.addColorStop(0, "#4a8c3f");
            zeminGrad.addColorStop(0.5, "#3a7a30");
            zeminGrad.addColorStop(1, "#2d6625");
            ctx.fillStyle = zeminGrad;
            ctx.fillRect(0, yukseklik * 0.6, genislik, yukseklik * 0.4);

            // Ağaçlar
            for (let i = 0; i < 8; i++) {
                const ax = Math.random() * genislik;
                const ay = yukseklik * 0.55 + Math.random() * yukseklik * 0.15;
                const boyut = Math.random() * 30 + 20;
                this.agacCiz(ctx, ax, ay, boyut);
            }

            // Yol
            ctx.beginPath();
            ctx.moveTo(genislik * 0.4, yukseklik);
            ctx.quadraticCurveTo(genislik * 0.45, yukseklik * 0.75, genislik * 0.5, yukseklik * 0.6);
            ctx.quadraticCurveTo(genislik * 0.55, yukseklik * 0.75, genislik * 0.6, yukseklik);
            ctx.fillStyle = "#8B7355";
            ctx.fill();

            return canvas;
        }

        bulutCiz(ctx, x, y, boyut) {
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.beginPath();
            ctx.arc(x, y, boyut, 0, Math.PI * 2);
            ctx.arc(x + boyut * 0.6, y - boyut * 0.2, boyut * 0.7, 0, Math.PI * 2);
            ctx.arc(x + boyut * 1.2, y, boyut * 0.8, 0, Math.PI * 2);
            ctx.arc(x + boyut * 0.4, y + boyut * 0.2, boyut * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        dagCiz(ctx, genislik, yukseklik, tepeOrani, renk, dagSayisi) {
            ctx.fillStyle = renk;
            ctx.beginPath();
            ctx.moveTo(0, yukseklik * 0.65);

            const adim = genislik / dagSayisi;
            for (let i = 0; i <= dagSayisi; i++) {
                const x = i * adim;
                const tepeY = yukseklik * tepeOrani - Math.random() * yukseklik * 0.15;
                if (i % 1 === 0) {
                    ctx.lineTo(x, tepeY);
                } else {
                    ctx.lineTo(x, yukseklik * 0.65 - Math.random() * 20);
                }
            }
            ctx.lineTo(genislik, yukseklik * 0.65);
            ctx.closePath();
            ctx.fill();
        }

        agacCiz(ctx, x, y, boyut) {
            // Gövde
            ctx.fillStyle = "#5C4033";
            ctx.fillRect(x - boyut * 0.08, y - boyut * 0.3, boyut * 0.16, boyut * 0.5);

            // Yapraklar
            ctx.fillStyle = "#2d6625";
            ctx.beginPath();
            ctx.moveTo(x, y - boyut);
            ctx.lineTo(x - boyut * 0.4, y - boyut * 0.2);
            ctx.lineTo(x + boyut * 0.4, y - boyut * 0.2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#3a8030";
            ctx.beginPath();
            ctx.moveTo(x, y - boyut * 0.7);
            ctx.lineTo(x - boyut * 0.35, y - boyut * 0.05);
            ctx.lineTo(x + boyut * 0.35, y - boyut * 0.05);
            ctx.closePath();
            ctx.fill();
        }

        // Fraktal üretim
        fraktalUret(genislik = 400, yukseklik = 400, tip = "mandelbrot", iterasyon = 100) {
            const canvas = this.canvasOlustur(genislik, yukseklik);
            const ctx = this.ctx;
            const imageData = ctx.createImageData(genislik, yukseklik);
            const data = imageData.data;

            if (tip === "mandelbrot") {
                for (let px = 0; px < genislik; px++) {
                    for (let py = 0; py < yukseklik; py++) {
                        let x0 = (px - genislik / 2) / (genislik / 4);
                        let y0 = (py - yukseklik / 2) / (yukseklik / 4);
                        let x = 0, y = 0, i = 0;

                        while (x * x + y * y <= 4 && i < iterasyon) {
                            const xTemp = x * x - y * y + x0;
                            y = 2 * x * y + y0;
                            x = xTemp;
                            i++;
                        }

                        const idx = (py * genislik + px) * 4;
                        if (i === iterasyon) {
                            data[idx] = data[idx + 1] = data[idx + 2] = 0;
                        } else {
                            const t = i / iterasyon;
                            data[idx] = Math.floor(9 * (1 - t) * t * t * t * 255);
                            data[idx + 1] = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
                            data[idx + 2] = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
                        }
                        data[idx + 3] = 255;
                    }
                }
            } else if (tip === "julia") {
                const cRe = -0.7, cIm = 0.27015;
                for (let px = 0; px < genislik; px++) {
                    for (let py = 0; py < yukseklik; py++) {
                        let x = (px - genislik / 2) / (genislik / 4);
                        let y = (py - yukseklik / 2) / (yukseklik / 4);
                        let i = 0;

                        while (x * x + y * y <= 4 && i < iterasyon) {
                            const xTemp = x * x - y * y + cRe;
                            y = 2 * x * y + cIm;
                            x = xTemp;
                            i++;
                        }

                        const idx = (py * genislik + px) * 4;
                        if (i === iterasyon) {
                            data[idx] = data[idx + 1] = data[idx + 2] = 0;
                        } else {
                            const t = i / iterasyon;
                            data[idx] = Math.floor(t * 255);
                            data[idx + 1] = Math.floor(t * 128);
                            data[idx + 2] = Math.floor((1 - t) * 255);
                        }
                        data[idx + 3] = 255;
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
            return canvas;
        }

        // Pixel art üretimi
        pixelArtUret(genislik = 16, yukseklik = 16, olcek = 20, tema = "karakter") {
            const canvas = this.canvasOlustur(genislik * olcek, yukseklik * olcek);
            const ctx = this.ctx;

            const sablonlar = {
                karakter: [
                    "  000000  ",
                    " 00111100 ",
                    " 01111110 ",
                    " 01233210 ",
                    " 01233210 ",
                    " 01111110 ",
                    " 00144100 ",
                    "  011110  ",
                    "  055550  ",
                    " 05555550 ",
                    " 50555505 ",
                    "  055550  ",
                    "  055550  ",
                    "  05  50  ",
                    "  06  60  ",
                    "  66  66  "
                ],
                kalp: [
                    "  00  00  ",
                    " 0110 0110",
                    "0111101110",
                    "0111111110",
                    "0111111110",
                    " 01111110 ",
                    "  011110  ",
                    "   0110   ",
                    "    00    "
                ],
                yildiz: [
                    "    00    ",
                    "    00    ",
                    "   0110   ",
                    "0001111000",
                    "0011111100",
                    " 01111110 ",
                    "  011110  ",
                    " 01100110 ",
                    "011    110",
                    "01      10"
                ],
                ev: [
                    "    00    ",
                    "   0110   ",
                    "  011110  ",
                    " 01111110 ",
                    "0111111110",
                    " 12222221 ",
                    " 12222221 ",
                    " 12233221 ",
                    " 12233221 ",
                    " 12233221 "
                ]
            };

            const renkPaletleri = {
                karakter: ["#000000", "#FFD700", "#FFA500", "#FF0000", "#FFFFFF", "#4169E1", "#8B4513"],
                kalp: ["#000000", "#FF0000", "#FF4444"],
                yildiz: ["#000000", "#FFD700", "#FFA500"],
                ev: ["#000000", "#8B4513", "#DEB887", "#4169E1"]
            };

            const sablon = sablonlar[tema] || sablonlar.karakter;
            const palet = renkPaletleri[tema] || renkPaletleri.karakter;

            ctx.fillStyle = "#87CEEB";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let y = 0; y < sablon.length; y++) {
                for (let x = 0; x < sablon[y].length; x++) {
                    const karakter = sablon[y][x];
                    if (karakter !== " ") {
                        const renkIdx = parseInt(karakter) || 0;
                        ctx.fillStyle = palet[renkIdx] || "#000000";
                        ctx.fillRect(x * olcek, y * olcek, olcek, olcek);
                    }
                }
            }

            return canvas;
        }

        // Soyut sanat üretimi
        soyutSanatUret(genislik = 500, yukseklik = 500, stil = "geometrik") {
            const canvas = this.canvasOlustur(genislik, yukseklik);
            const ctx = this.ctx;

            // Arka plan
            const grad = ctx.createLinearGradient(0, 0, genislik, yukseklik);
            grad.addColorStop(0, `hsl(${Math.random() * 360}, 30%, 10%)`);
            grad.addColorStop(1, `hsl(${Math.random() * 360}, 30%, 20%)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, genislik, yukseklik);

            if (stil === "geometrik") {
                for (let i = 0; i < 30; i++) {
                    ctx.save();
                    ctx.translate(Math.random() * genislik, Math.random() * yukseklik);
                    ctx.rotate(Math.random() * Math.PI * 2);
                    ctx.globalAlpha = Math.random() * 0.5 + 0.2;
                    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;

                    const sekil = Math.floor(Math.random() * 3);
                    const boyut = Math.random() * 80 + 20;

                    if (sekil === 0) {
                        ctx.fillRect(-boyut / 2, -boyut / 2, boyut, boyut);
                    } else if (sekil === 1) {
                        ctx.beginPath();
                        ctx.arc(0, 0, boyut / 2, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.beginPath();
                        ctx.moveTo(0, -boyut / 2);
                        ctx.lineTo(boyut / 2, boyut / 2);
                        ctx.lineTo(-boyut / 2, boyut / 2);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                }
            } else if (stil === "dalga") {
                for (let i = 0; i < 15; i++) {
                    ctx.beginPath();
                    ctx.strokeStyle = `hsla(${i * 25}, 80%, 60%, 0.6)`;
                    ctx.lineWidth = Math.random() * 4 + 1;

                    const baslangicY = Math.random() * yukseklik;
                    ctx.moveTo(0, baslangicY);

                    for (let x = 0; x < genislik; x += 5) {
                        const y = baslangicY + Math.sin(x * 0.02 + i) * (50 + i * 5) + Math.cos(x * 0.01) * 20;
                        ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
            } else if (stil === "noktasal") {
                for (let i = 0; i < 2000; i++) {
                    const x = Math.random() * genislik;
                    const y = Math.random() * yukseklik;
                    const boyut = Math.random() * 8 + 1;
                    ctx.beginPath();
                    ctx.arc(x, y, boyut, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${(x + y) * 0.5 % 360}, 70%, 60%, ${Math.random() * 0.8 + 0.2})`;
                    ctx.fill();
                }
            }

            return canvas;
        }

        // Grafik/Chart üretimi
        grafikUret(veri, tip = "cubuk", secenekler = {}) {
            const genislik = secenekler.genislik || 600;
            const yukseklik = secenekler.yukseklik || 400;
            const canvas = this.canvasOlustur(genislik, yukseklik);
            const ctx = this.ctx;
            const kenarBosluk = 60;

            // Arka plan
            ctx.fillStyle = secenekler.arkaPlan || "#1a1a2e";
            ctx.fillRect(0, 0, genislik, yukseklik);

            // Başlık
            if (secenekler.baslik) {
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 16px Arial";
                ctx.textAlign = "center";
                ctx.fillText(secenekler.baslik, genislik / 2, 25);
            }

            const maxDeger = Math.max(...veri.map(d => d.deger));
            const minDeger = Math.min(0, ...veri.map(d => d.deger));
            const aralik = maxDeger - minDeger || 1;
            const grafikGen = genislik - kenarBosluk * 2;
            const grafikYuk = yukseklik - kenarBosluk * 2 - 20;

            // Izgara
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = kenarBosluk + 20 + (grafikYuk / 5) * i;
                ctx.beginPath();
                ctx.moveTo(kenarBosluk, y);
                ctx.lineTo(genislik - kenarBosluk, y);
                ctx.stroke();

                const 