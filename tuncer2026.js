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

                const deger = maxDeger - (aralik / 5) * i;
                ctx.fillStyle = "#888";
                ctx.font = "11px Arial";
                ctx.textAlign = "right";
                ctx.fillText(deger.toFixed(1), kenarBosluk - 5, y + 4);
            }

            if (tip === "cubuk") {
                const cubukGen = (grafikGen / veri.length) * 0.7;
                const bosluk = (grafikGen / veri.length) * 0.3;

                veri.forEach((d, i) => {
                    const x = kenarBosluk + i * (cubukGen + bosluk) + bosluk / 2;
                    const cubukYuk = ((d.deger - minDeger) / aralik) * grafikYuk;
                    const y = kenarBosluk + 20 + grafikYuk - cubukYuk;

                    const renk = d.renk || `hsl(${(i * 360) / veri.length}, 70%, 55%)`;
                    const grad = ctx.createLinearGradient(x, y, x, y + cubukYuk);
                    grad.addColorStop(0, renk);
                    grad.addColorStop(1, renk.replace("55%", "35%"));
                    ctx.fillStyle = grad;
                    ctx.fillRect(x, y, cubukGen, cubukYuk);

                    // Etiket
                    ctx.fillStyle = "#ccc";
                    ctx.font = "10px Arial";
                    ctx.textAlign = "center";
                    ctx.save();
                    ctx.translate(x + cubukGen / 2, kenarBosluk + 20 + grafikYuk + 15);
                    ctx.rotate(-0.3);
                    ctx.fillText(d.etiket || `${i + 1}`, 0, 0);
                    ctx.restore();

                    // Değer
                    ctx.fillStyle = "#fff";
                    ctx.font = "bold 11px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(d.deger.toFixed(1), x + cubukGen / 2, y - 5);
                });
            } else if (tip === "cizgi") {
                ctx.beginPath();
                ctx.strokeStyle = secenekler.cizgiRenk || "#00ff88";
                ctx.lineWidth = 2.5;

                const noktalar = [];
                veri.forEach((d, i) => {
                    const x = kenarBosluk + (i / (veri.length - 1 || 1)) * grafikGen;
                    const y = kenarBosluk + 20 + grafikYuk - ((d.deger - minDeger) / aralik) * grafikYuk;
                    noktalar.push({ x, y });
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();

                // Noktalar
                noktalar.forEach((n, i) => {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
                    ctx.fillStyle = "#00ff88";
                    ctx.fill();
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = "#ccc";
                    ctx.font = "10px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(veri[i].etiket || "", n.x, kenarBosluk + 20 + grafikYuk + 15);
                });
            } else if (tip === "pasta") {
                const merkezX = genislik / 2;
                const merkezY = yukseklik / 2 + 10;
                const yaricap = Math.min(grafikGen, grafikYuk) / 2.5;
                const toplam = veri.reduce((a, b) => a + b.deger, 0);
                let baslangicAci = -Math.PI / 2;

                veri.forEach((d, i) => {
                    const dilimAci = (d.deger / toplam) * Math.PI * 2;
                    const renk = d.renk || `hsl(${(i * 360) / veri.length}, 70%, 55%)`;

                    ctx.beginPath();
                    ctx.moveTo(merkezX, merkezY);
                    ctx.arc(merkezX, merkezY, yaricap, baslangicAci, baslangicAci + dilimAci);
                    ctx.closePath();
                    ctx.fillStyle = renk;
                    ctx.fill();
                    ctx.strokeStyle = "#1a1a2e";
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Etiket
                    const etiketAci = baslangicAci + dilimAci / 2;
                    const etiketX = merkezX + Math.cos(etiketAci) * (yaricap + 25);
                    const etiketY = merkezY + Math.sin(etiketAci) * (yaricap + 25);
                    ctx.fillStyle = "#fff";
                    ctx.font = "11px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(`${d.etiket || ""} (${((d.deger / toplam) * 100).toFixed(1)}%)`, etiketX, etiketY);

                    baslangicAci += dilimAci;
                });
            }

            return canvas;
        }
    }

    // ================================================================
    // BÖLÜM 9: KOD YAZMA & ANALİZ SİSTEMİ
    // ================================================================

    class KodYazici {
        constructor() {
            this.sablonlar = this.sablonlariYukle();
            this.dilBilgisi = this.dilBilgisiYukle();
        }

        sablonlariYukle() {
            return {
                javascript: {
                    fonksiyon: (ad, parametreler, govde) =>
                        `function ${ad}(${parametreler}) {\n${govde}\n}`,
                    okFonksiyon: (ad, parametreler, govde) =>
                        `const ${ad} = (${parametreler}) => {\n${govde}\n};`,
                    sinif: (ad, ozellikler, metodlar) =>
                        `class ${ad} {\n  constructor(${ozellikler}) {\n    ${ozellikler.split(",").map(p => `this.${p.trim()} = ${p.trim()};`).join("\n    ")}\n  }\n\n${metodlar}\n}`,
                    dongu: (tip, kosul, govde) => {
                        if (tip === "for") return `for (let i = 0; i < ${kosul}; i++) {\n${govde}\n}`;
                        if (tip === "while") return `while (${kosul}) {\n${govde}\n}`;
                        if (tip === "forEach") return `${kosul}.forEach((eleman, index) => {\n${govde}\n});`;
                        return "";
                    },
                    async: (ad, govde) =>
                        `async function ${ad}() {\n  try {\n${govde}\n  } catch (hata) {\n    console.error("Hata:", hata);\n  }\n}`,
                    promise: (govde) =>
                        `new Promise((resolve, reject) => {\n${govde}\n});`,
                    fetchAPI: (url) =>
                        `async function veriCek() {\n  try {\n    const yanit = await fetch("${url}");\n    const veri = await yanit.json();\n    console.log(veri);\n    return veri;\n  } catch (hata) {\n    console.error("Veri çekme hatası:", hata);\n  }\n}`,
                    eventListener: (eleman, olay, govde) =>
                        `document.querySelector("${eleman}").addEventListener("${olay}", function(e) {\n${govde}\n});`,
                    modul: (ad, ihracatlar) =>
                        `// ${ad} modülü\n${ihracatlar.map(i => `export function ${i}() {\n  // TODO: Implementasyon\n}`).join("\n\n")}\n\nexport default { ${ihracatlar.join(", ")} };`
                },
                html: {
                    sayfa: (baslik, icerik) =>
                        `<!DOCTYPE html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${baslik}</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body { font-family: 'Segoe UI', sans-serif; }\n  </style>\n</head>\n<body>\n  ${icerik}\n</body>\n</html>`,
                    form: (alanlar) =>
                        `<form id="form" onsubmit="return false;">\n${alanlar.map(a => `  <div class="form-grup">\n    <label for="${a.ad}">${a.etiket}</label>\n    <input type="${a.tip || "text"}" id="${a.ad}" name="${a.ad}" placeholder="${a.placeholder || ""}" ${a.zorunlu ? "required" : ""}>\n  </div>`).join("\n")}\n  <button type="submit">Gönder</button>\n</form>`,
                    tablo: (basliklar, satirlar) =>
                        `<table>\n  <thead>\n    <tr>\n${basliklar.map(b => `      <th>${b}</th>`).join("\n")}\n    </tr>\n  </thead>\n  <tbody>\n${satirlar.map(s => `    <tr>\n${s.map(h => `      <td>${h}</td>`).join("\n")}\n    </tr>`).join("\n")}\n  </tbody>\n</table>`
                },
                css: {
                    flexbox: (yonelim = "row") =>
                        `.container {\n  display: flex;\n  flex-direction: ${yonelim};\n  justify-content: center;\n  align-items: center;\n  gap: 1rem;\n  flex-wrap: wrap;\n}`,
                    grid: (sutun = 3) =>
                        `.grid-container {\n  display: grid;\n  grid-template-columns: repeat(${sutun}, 1fr);\n  gap: 1rem;\n  padding: 1rem;\n}`,
                    animasyon: (ad, keyframes) =>
                        `@keyframes ${ad} {\n${keyframes}\n}\n\n.${ad}-animasyonlu {\n  animation: ${ad} 1s ease-in-out infinite;\n}`,
                    karanlikTema: () =>
                        `:root {\n  --bg: #1a1a2e;\n  --text: #eee;\n  --primary: #e94560;\n  --secondary: #0f3460;\n  --accent: #16213e;\n}\n\nbody {\n  background: var(--bg);\n  color: var(--text);\n  font-family: 'Segoe UI', sans-serif;\n}`
                },
                python: {
                    fonksiyon: (ad, parametreler, govde) =>
                        `def ${ad}(${parametreler}):\n    """${ad} fonksiyonu"""\n${govde.split("\n").map(l => "    " + l).join("\n")}`,
                    sinif: (ad, ozellikler) =>
                        `class ${ad}:\n    def __init__(self, ${ozellikler}):\n${ozellikler.split(",").map(p => `        self.${p.trim()} = ${p.trim()}`).join("\n")}\n\n    def __str__(self):\n        return f"${ad}(${ozellikler.split(",").map(p => `${p.trim()}={self.${p.trim()}}`).join(", ")})"`,
                    listComprehension: (ifade, degisken, kaynak, kosul) =>
                        `sonuc = [${ifade} for ${degisken} in ${kaynak}${kosul ? ` if ${kosul}` : ""}]`
                }
            };
        }

        dilBilgisiYukle() {
            return {
                javascript: {
                    uzanti: ".js",
                    yorumTek: "//",
                    yorumCok: ["/*", "*/"],
                    anahtarKelimeler: ["function", "const", "let", "var", "if", "else", "for", "while", "return", "class", "new", "this", "async", "await", "import", "export", "try", "catch"]
                },
                python: {
                    uzanti: ".py",
                    yorumTek: "#",
                    yorumCok: ['"""', '"""'],
                    anahtarKelimeler: ["def", "class", "if", "elif", "else", "for", "while", "return", "import", "from", "try", "except", "with", "as", "lambda", "yield"]
                },
                html: {
                    uzanti: ".html",
                    yorumTek: null,
                    yorumCok: ["<!--", "-->"],
                    anahtarKelimeler: ["div", "span", "p", "h1", "h2", "h3", "a", "img", "form", "input", "button", "table", "ul", "li"]
                }
            };
        }

        kodUret(istek) {
            const istekLower = istek.toLowerCase();
            let kod = "";
            let dil = "javascript";
            let aciklama = "";

            // Dil tespiti
            if (istekLower.includes("python")) dil = "python";
            else if (istekLower.includes("html")) dil = "html";
            else if (istekLower.includes("css")) dil = "css";

            // İstek analizi ve kod üretimi
            if (istekLower.includes("sıralama") || istekLower.includes("sort")) {
                aciklama = "Çeşitli sıralama algoritmaları";
                kod = this.siralamaAlgoritmalari(dil);
            } else if (istekLower.includes("arama") || istekLower.includes("search")) {
                aciklama = "Arama algoritmaları";
                kod = this.aramaAlgoritmalari(dil);
            } else if (istekLower.includes("hesap") || istekLower.includes("kalkül") || istekLower.includes("matematik")) {
                aciklama = "Matematik hesaplama fonksiyonları";
                kod = this.matematikKodu(dil);
            } else if (istekLower.includes("todo") || istekLower.includes("yapılacak")) {
                aciklama = "Todo (Yapılacaklar) uygulaması";
                kod = this.todoUygulamasi();
                dil = "html";
            } else if (istekLower.includes("form")) {
                aciklama = "Form oluşturma";
                kod = this.sablonlar.html.form([
                    { ad: "isim", etiket: "İsim", tip: "text", placeholder: "Adınız", zorunlu: true },
                    { ad: "email", etiket: "E-posta", tip: "email", placeholder: "E-posta adresiniz", zorunlu: true },
                    { ad: "mesaj", etiket: "Mesaj", tip: "text", placeholder: "Mesajınız" }
                ]);
                dil = "html";
            } else if (istekLower.includes("api") || istekLower.includes("fetch") || istekLower.includes("veri çek")) {
                aciklama = "API'den veri çekme";
                kod = this.sablonlar.javascript.fetchAPI("https://jsonplaceholder.typicode.com/posts");
            } else if (istekLower.includes("animasyon")) {
                aciklama = "CSS animasyonu";
                kod = this.sablonlar.css.animasyon("ziplama", "  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-20px); }");
                dil = "css";
            } else if (istekLower.includes("tema") || istekLower.includes("karanlık")) {
                aciklama = "Karanlık tema CSS";
                kod = this.sablonlar.css.karanlikTema();
                dil = "css";
            } else if (istekLower.includes("sınıf") || istekLower.includes("class")) {
                aciklama = "Sınıf oluşturma";
                if (dil === "python") {
                    kod = this.sablonlar.python.sinif("Ogrenci", "ad, yas, numara");
                } else {
                    kod = this.sablonlar.javascript.sinif("Ogrenci", "ad, yas, numara", '  bilgiGoster() {\n    return `${this.ad} - ${this.yas} yaşında`;\n  }');
                }
            } else if (istekLower.includes("oyun") || istekLower.includes("game")) {
                aciklama = "Basit bir oyun";
                kod = this.basitOyun();
                dil = "javascript";
            } else if (istekLower.includes("grid") || istekLower.includes("ızgara")) {
                aciklama = "CSS Grid düzeni";
                kod = this.sablonlar.css.grid(3);
                dil = "css";
            } else if (istekLower.includes("flexbox") || istekLower.includes("flex")) {
                aciklama = "CSS Flexbox düzeni";
                kod = this.sablonlar.css.flexbox("row");
                dil = "css";
            } else if (istekLower.includes("sayfa") || istekLower.includes("web")) {
                aciklama = "Temel web sayfası";
                kod = this.sablonlar.html.sayfa("Tuncer Zeka Sayfası", '<div style="text-align:center; padding:2rem;">\n    <h1>Merhaba Dünya!</h1>\n    <p>Bu sayfa Tuncer Zeka tarafından oluşturuldu.</p>\n  </div>');
                dil = "html";
            } else {
                aciklama = "İstenen kod yapısı";
                kod = this.genelKodUret(istek, dil);
            }

            return {
                kod,
                dil,
                aciklama,
                satirSayisi: kod.split("\n").length,
                karakter: kod.length
            };
        }

        siralamaAlgoritmalari(dil) {
            if (dil === "python") {
                return `# Sıralama Algoritmaları - Tuncer Zeka
# Tasarımcı: Ahmet Tuncer

def bubble_sort(dizi):
    """Kabarcık sıralama"""
    n = len(dizi)
    for i in range(n):
        for j in range(0, n-i-1):
            if dizi[j] > dizi[j+1]:
                dizi[j], dizi[j+1] = dizi[j+1], dizi[j]
    return dizi

def quick_sort(dizi):
    """Hızlı sıralama"""
    if len(dizi) <= 1:
        return dizi
    pivot = dizi[len(dizi) // 2]
    sol = [x for x in dizi if x < pivot]
    orta = [x for x in dizi if x == pivot]
    sag = [x for x in dizi if x > pivot]
    return quick_sort(sol) + orta + quick_sort(sag)

def merge_sort(dizi):
    """Birleştirmeli sıralama"""
    if len(dizi) <= 1:
        return dizi
    orta = len(dizi) // 2
    sol = merge_sort(dizi[:orta])
    sag = merge_sort(dizi[orta:])
    return birlestir(sol, sag)

def birlestir(sol, sag):
    sonuc = []
    i = j = 0
    while i < len(sol) and j < len(sag):
        if sol[i] <= sag[j]:
            sonuc.append(sol[i])
            i += 1
        else:
            sonuc.append(sag[j])
            j += 1
    sonuc.extend(sol[i:])
    sonuc.extend(sag[j:])
    return sonuc

# Test
test = [64, 34, 25, 12, 22, 11, 90]
print("Bubble Sort:", bubble_sort(test.copy()))
print("Quick Sort:", quick_sort(test.copy()))
print("Merge Sort:", merge_sort(test.copy()))`;
            }

            return `// Sıralama Algoritmaları - Tuncer Zeka
// Tasarımcı: Ahmet Tuncer

// Kabarcık Sıralama (Bubble Sort)
function bubbleSort(dizi) {
    const arr = [...dizi];
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}

// Hızlı Sıralama (Quick Sort)
function quickSort(dizi) {
    if (dizi.length <= 1) return dizi;
    const pivot = dizi[Math.floor(dizi.length / 2)];
    const sol = dizi.filter(x => x < pivot);
    const orta = dizi.filter(x => x === pivot);
    const sag = dizi.filter(x => x > pivot);
    return [...quickSort(sol), ...orta, ...quickSort(sag)];
}

// Birleştirmeli Sıralama (Merge Sort)
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
        if (sol[i] <= sag[j]) sonuc.push(sol[i++]);
        else sonuc.push(sag[j++]);
    }
    return [...sonuc, ...sol.slice(i), ...sag.slice(j)];
}

// Seçmeli Sıralama (Selection Sort)
function selectionSort(dizi) {
    const arr = [...dizi];
    for (let i = 0; i < arr.length; i++) {
        let minIdx = i;
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
    return arr;
}

// Test
const test = [64, 34, 25, 12, 22, 11, 90];
console.log("Bubble Sort:", bubbleSort(test));
console.log("Quick Sort:", quickSort(test));
console.log("Merge Sort:", mergeSort(test));
console.log("Selection Sort:", selectionSort(test));`;
        }

        aramaAlgoritmalari(dil) {
            return `// Arama Algoritmaları - Tuncer Zeka
// Tasarımcı: Ahmet Tuncer

// İkili Arama (Binary Search)
function ikiliArama(dizi, hedef) {
    let sol = 0, sag = dizi.length - 1;
    while (sol <= sag) {
        const orta = Math.floor((sol + sag) / 2);
        if (dizi[orta] === hedef) return orta;
        if (dizi[orta] < hedef) sol = orta + 1;
        else sag = orta - 1;
    }
    return -1;
}

// Doğrusal Arama (Linear Search)
function dogrusalArama(dizi, hedef) {
    for (let i = 0; i < dizi.length; i++) {
        if (dizi[i] === hedef) return i;
    }
    return -1;
}

// Derinlik Öncelikli Arama (DFS)
function dfs(graf, baslangic, ziyaretEdilen = new Set()) {
    ziyaretEdilen.add(baslangic);
    console.log("Ziyaret:", baslangic);
    for (const komsu of (graf[baslangic] || [])) {
        if (!ziyaretEdilen.has(komsu)) {
            dfs(graf, komsu, ziyaretEdilen);
        }
    }
    return ziyaretEdilen;
}

// Genişlik Öncelikli Arama (BFS)
function bfs(graf, baslangic) {
    const ziyaretEdilen = new Set();
    const kuyruk = [baslangic];
    ziyaretEdilen.add(baslangic);
    while (kuyruk.length > 0) {
        const dugum = kuyruk.shift();
        console.log("Ziyaret:", dugum);
        for (const komsu of (graf[dugum] || [])) {
            if (!ziyaretEdilen.has(komsu)) {
                ziyaretEdilen.add(komsu);
                kuyruk.push(komsu);
            }
        }
    }
    return ziyaretEdilen;
}

// Test
const siraliDizi = [1, 3, 5, 7, 9, 11, 13, 15];
console.log("İkili Arama (7):", ikiliArama(siraliDizi, 7));
console.log("Doğrusal Arama (11):", dogrusalArama(siraliDizi, 11));

const graf = { A: ["B", "C"], B: ["D", "E"], C: ["F"], D: [], E: ["F"], F: [] };
console.log("DFS:"); dfs(graf, "A");
console.log("BFS:"); bfs(graf, "A");`;
        }

        matematikKodu(dil) {
            return `// Matematik Fonksiyonları - Tuncer Zeka
// Tasarımcı: Ahmet Tuncer

const TuncerMatematik = {
    // Faktöriyel
    faktoriyel(n) {
        if (n <= 1) return 1;
        return n * this.faktoriyel(n - 1);
    },

    // Fibonacci
    fibonacci(n) {
        const dizi = [0, 1];
        for (let i = 2; i <= n; i++) {
            dizi.push(dizi[i-1] + dizi[i-2]);
        }
        return dizi;
    },

    // Asal sayı kontrolü
    asalMi(n) {
        if (n < 2) return false;
        if (n === 2) return true;
        if (n % 2 === 0) return false;
        for (let i = 3; i <= Math.sqrt(n); i += 2) {
            if (n % i === 0) return false;
        }
        return true;
    },

    // Asal sayıları bul
    asalSayilar(limit) {
        return Array.from({length: limit}, (_, i) => i + 2).filter(n => this.asalMi(n));
    },

    // EBOB (GCD)
    ebob(a, b) {
        while (b !== 0) {
            [a, b] = [b, a % b];
        }
        return a;
    },

    // EKOK (LCM)
    ekok(a, b) {
        return (a * b) / this.ebob(a, b);
    },

    // Üs alma
    us(taban, us) {
        return Math.pow(taban, us);
    },

    // Kombinasyon
    kombinasyon(n, r) {
        return this.faktoriyel(n) / (this.faktoriyel(r) * this.faktoriyel(n - r));
    },

    // Permütasyon
    permutasyon(n, r) {
        return this.faktoriyel(n) / this.faktoriyel(n - r);
    },

    // Ortalama
    ortalama(dizi) {
        return dizi.reduce((a, b) => a + b, 0) / dizi.length;
    },

    // Medyan
    medyan(dizi) {
        const sirali = [...dizi].sort((a, b) => a - b);
        const orta = Math.floor(sirali.length / 2);
        return sirali.length % 2 ? sirali[orta] : (sirali[orta - 1] + sirali[orta]) / 2;
    },

    // Standart sapma
    standartSapma(dizi) {
        const ort = this.ortalama(dizi);
        const varyans = dizi.reduce((acc, val) => acc + (val - ort) ** 2, 0) / dizi.length;
        return Math.sqrt(varyans);
    },

    // Matris çarpımı
    matrisCarp(a, b) {
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

    // Sayısal türev
    turev(f, x, h = 0.0001) {
        return (f(x + h) - f(x - h)) / (2 * h);
    },

    // Sayısal integral (Simpson kuralı)
    integral(f, a, b, n = 1000) {
        const h = (b - a) / n;
        let toplam = f(a) + f(b);
        for (let i = 1; i < n; i++) {
            toplam += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
        }
        return (h / 3) * toplam;
    }
};

// Test
console.log("10! =", TuncerMatematik.faktoriyel(10));
console.log("Fibonacci(10):", TuncerMatematik.fibonacci(10));
console.log("Asal sayılar (50'ye kadar):", TuncerMatematik.asalSayilar(50));
console.log("EBOB(48, 18):", TuncerMatematik.ebob(48, 18));
console.log("C(10,3):", TuncerMatematik.kombinasyon(10, 3));
console.log("π ≈", TuncerMatematik.integral(x => 4/(1+x*x), 0, 1));`;
        }

        todoUygulamasi() {
            return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yapılacaklar - Tuncer Zeka</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #eee; min-height: 100vh; display: flex; justify-content: center; padding: 2rem; }
        .container { max-width: 500px; width: 100%; }
        h1 { text-align: center; margin-bottom: 1.5rem; color: #e94560; }
        .input-grup { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        input { flex: 1; padding: 0.75rem; border: 2px solid #333; border-radius: 8px; background: #16213e; color: #eee; font-size: 1rem; }
        button { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; background: #e94560; color: white; cursor: pointer; font-size: 1rem; }
        button:hover { background: #c73650; }
        .todo-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; margin-bottom: 0.5rem; background: #16213e; border-radius: 8px; }
        .todo-item.tamamlandi { opacity: 0.5; text-decoration: line-through; }
        .todo-item span { flex: 1; }
        .sil-btn { background: #333; padding: 0.5rem 0.75rem; font-size: 0.8rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Yapılacaklar</h1>
        <div class="input-grup">
            <input type="text" id="yeniGorev" placeholder="Yeni görev ekle..." onkeypress="if(event.key==='Enter')ekle()">
            <button onclick="ekle()">Ekle</button>
        </div>
        <div id="liste"></div>
    </div>
    <script>
        let gorevler = JSON.parse(localStorage.getItem('gorevler') || '[]');
        function render() {
            const liste = document.getElementById('liste');
            liste.innerHTML = gorevler.map((g, i) => \`
                <div class="todo-item \${g.tamam ? 'tamamlandi' : ''}">
                    <input type="checkbox" \${g.tamam ? 'checked' : ''} onchange="degistir(\${i})">
                    <span>\${g.metin}</span>
                    <button class="sil-btn" onclick="sil(\${i})">🗑️</button>
                </div>\`).join('');
            localStorage.setItem('gorevler', JSON.stringify(gorevler));
        }
        function ekle() {
            const input = document.getElementById('yeniGorev');
            if (input.value.trim()) {
                gorevler.push({ metin: input.value.trim(), tamam: false });
                input.value = '';
                render();
            }
        }
        function degistir(i) { gorevler[i].tamam = !gorevler[i].tamam; render(); }
        function sil(i) { gorevler.splice(i, 1); render(); }
        render();
    </script>
</body>
</html>`;
        }

        basitOyun() {
            return `// Basit Yılan Oyunu - Tuncer Zeka
// Tasarımcı: Ahmet Tuncer

const canvas = document.createElement('canvas');
canvas.width = 400; canvas.height = 400;
canvas.style.border = '2px solid #e94560';
canvas.style.background = '#1a1a2e';
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

const BOYUT = 20;
let yilan = [{x: 10, y: 10}];
let yon = {x: 1, y: 0};
let yem = yeniYem();
let skor = 0;
let oyunBitti = false;

function yeniYem() {
    return {
        x: Math.floor(Math.random() * (canvas.width / BOYUT)),
        y: Math.floor(Math.random() * (canvas.height / BOYUT))
    };
}

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': if(yon.y !== 1) yon = {x:0, y:-1}; break;
        case 'ArrowDown': if(yon.y !== -1) yon = {x:0, y:1}; break;
        case 'ArrowLeft': if(yon.x !== 1) yon = {x:-1, y:0}; break;
        case 'ArrowRight': if(yon.x !== -1) yon = {x:1, y:0}; break;
    }
});

function guncelle() {
    if (oyunBitti) return;
    const bas = {x: yilan[0].x + yon.x, y: yilan[0].y + yon.y};

    // Duvar kontrolü
    if (bas.x < 0 || bas.x >= canvas.width/BOYUT || bas.y < 0 || bas.y >= canvas.height/BOYUT) {
        oyunBitti = true; return;
    }
    // Kendine çarpma
    if (yilan.some(p => p.x === bas.x && p.y === bas.y)) {
        oyunBitti = true; return;
    }

    yilan.unshift(bas);
    if (bas.x === yem.x && bas.y === yem.y) {
        skor += 10;
        yem = yeniYem();
    } else {
        yilan.pop();
    }
}

function ciz() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Yılan
    yilan.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? '#e94560' : '#0f3460';
        ctx.fillRect(p.x * BOYUT, p.y * BOYUT, BOYUT - 1, BOYUT - 1);
    });

    // Yem
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(yem.x * BOYUT, yem.y * BOYUT, BOYUT - 1, BOYUT - 1);

    // Skor
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Skor: ' + skor, 10, 20);

    if (oyunBitti) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('OYUN BİTTİ!', canvas.width/2, canvas.height/2);
        ctx.font = '20px Arial';
        ctx.fillText('Skor: ' + skor, canvas.width/2, canvas.height/2 + 35);
    }
}

setInterval(() => { guncelle(); ciz(); }, 150);`;
        }

        genelKodUret(istek, dil) {
            const kelimeler = istek.toLowerCase().split(/\s+/);
            let kod = `// ${istek}\n// Tuncer Zeka tarafından üretildi\n// Tasarımcı: Ahmet Tuncer\n\n`;

            if (kelimeler.some(k => ["fonksiyon", "function", "metod"].includes(k))) {
                const ad = kelimeler.find(k => !["bir", "yaz", "oluştur", "fonksiyon", "function", "metod", "kod"].includes(k)) || "tuncerFonksiyon";
                kod += this.sablonlar.javascript.fonksiyon(ad, "parametre", '  // TODO: Fonksiyon gövdesini yazın\n  console.log("' + ad + ' çalıştı!", parametre);\n  return parametre;');
            } else {
                kod += `// İstek: "${istek}"\n`;
                kod += `// Bu istek için özel bir şablon bulunamadı.\n`;
                kod += `// Aşağıda temel bir yapı oluşturuldu:\n\n`;
                kod += `function tuncerCozum() {\n`;
                kod += `  // Çözüm burada uygulanacak\n`;
                kod += `  console.log("Tuncer Zeka - Çözüm hazır!");\n`;
                kod += `}\n\ntuncerCozum();`;
            }

            return kod;
        }

        kodAnaliz(kod) {
            const satirlar = kod.split("\n");
            const satirSayisi = satirlar.length;
            const bosOlmayanSatirlar = satirlar.filter((s) => s.trim().length > 0).length;
            const yorumSatirlari = satirlar.filter((s) => {
                const t = s.trim();
                return t.startsWith("//") || t.startsWith("#") || t.startsWith("/*") || t.startsWith("*") || t.startsWith("<!--");
            }).length;

            // Fonksiyon tespiti
            const fonksiyonlar = [];
            const fonksiyonRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:$|async)|def\s+(\w+))/g;
            let esleme;
            while ((esleme = fonksiyonRegex.exec(kod)) !== null) {
                fonksiyonlar.push(esleme[1] || esleme[2] || esleme[3]);
            }

            // Değişken tespiti
            const degiskenler = [];
            const degiskenRegex = /(?:let|const|var)\s+(\w+)/g;
            while ((esleme = degiskenRegex.exec(kod)) !== null) {
                degiskenler.push(esleme[1]);
            }

            // Karmaşıklık tahmini
            let karmasiklik = 0;
            const karmasiklikAnahtarlar = ["if", "else", "for", "while", "switch", "case", "catch", "&&", "||", "?"];
            for (const anahtar of karmasiklikAnahtarlar) {
                const regex = new RegExp(anahtar.replace(/[.*+?^${}()|[$\$/g, '\\$&'), "g");
                const eslemeler = kod.match(regex);
                if (eslemeler) karmasiklik += eslemeler.length;
            }

            // Dil tespiti
            let dil = "bilinmiyor";
            if (kod.includes("function") || kod.includes("const ") || kod.includes("=>")) dil = "JavaScript";
            else if (kod.includes("def ") || kod.includes("import ") && kod.includes(":")) dil = "Python";
            else if (kod.includes("<!DOCTYPE") || kod.includes("<html")) dil = "HTML";
            else if (kod.includes("{") && kod.includes(":") && kod.includes(";") && !kod.includes("function")) dil = "CSS";

            // Kalite skoru
            const yorumOrani = yorumSatirlari / satirSayisi;
            let kaliteSkor = 50;
            if (yorumOrani > 0.1) kaliteSkor += 15;
            if (fonksiyonlar.length > 0) kaliteSkor += 10;
            if (karmasiklik < satirSayisi * 0.3) kaliteSkor += 10;
            if (bosOlmayanSatirlar / satirSayisi > 0.7) kaliteSkor += 5;
            kaliteSkor = Math.min(100, kaliteSkor);

            return {
                satirSayisi,
                bosOlmayanSatirlar,
                yorumSatirlari,
                yorumOrani: (yorumOrani * 100).toFixed(1) + "%",
                fonksiyonlar,
                fonksiyonSayisi: fonksiyonlar.length,
                degiskenler,
                degiskenSayisi: degiskenler.length,
                karmasiklik,
                karmasiklikSeviye: karmasiklik < 5 ? "Düşük" : karmasiklik < 15 ? "Orta" : "Yüksek",
                tespiEdilendil: dil,
                kaliteSkor,
                kaliteDerece: kaliteSkor >= 80 ? "Çok İyi ⭐" : kaliteSkor >= 60 ? "İyi 👍" : kaliteSkor >= 40 ? "Orta 📝" : "Geliştirilebilir 🔧",
                karakterSayisi: kod.length,
                kelimeSayisi: kod.split(/\s+/).length
            };
        }
    }

    // ================================================================
    // BÖLÜM 10: UZUN SÜRELİ DÜŞÜNME (CHAIN OF THOUGHT)
    // ================================================================

    class DusunmeMotoru {
        constructor(bellek, dilIsleme, kelimeGomme) {
            this.bellek = bellek;
            this.dilIsleme = dilIsleme;
            this.kelimeGomme = kelimeGomme;
            this.dikkat = new DikkatMekanizmasi(64);
            this.dusunceSureci = [];
            this.maxDusunmeDerinligi = 10;
            this.dusunmeZamani = 0;
        }

        async dusun(soru, derinlik = 5) {
            const baslangicZamani = Date.now();
            this.dusunceSureci = [];
            derinlik = Math.min(derinlik, this.maxDusunmeDerinligi);

            this.adimEkle("🔍 Analiz", `Soru alındı: "${soru}"`);

            // Adım 1: Soruyu anlama
            const niyet = this.dilIsleme.niyetTespit(soru);
            this.adimEkle("🎯 Niyet Tespiti", `Tespit edilen niyet: ${niyet.niyet} (güven: ${niyet.skor})`);

            // Adım 2: Anahtar kelimeleri çıkarma
            const anahtarlar = this.dilIsleme.anahtarKelimeCikar(soru);
            this.adimEkle("🔑 Anahtar Kelimeler", `Bulunan: ${anahtarlar.map(a => a.kelime).join(", ")}`);

            // Adım 3: Bellekten ilgili bilgi arama
            const bellekSonuclari = this.bellek.ara(soru);
            if (bellekSonuclari.length > 0) {
                this.adimEkle("🧠 Bellek Tarama", `${bellekSonuclari.length} ilgili kayıt bulundu`);
            } else {
                this.adimEkle("🧠 Bellek Tarama", "İlgili kayıt bulunamadı, yeni bilgi üretilecek");
            }

            // Adım 4: Duygu analizi
            const duygu = this.dilIsleme.duyguAnalizi(soru);
            this.adimEkle("💭 Duygu Analizi", `Algılanan duygu: ${duygu.duygu}`);

            // Adım 5: Dikkat mekanizması ile odaklanma
            const soruVektor = this.kelimeGomme.cumleVektoru(soru);
            const kelimeler = this.dilIsleme.tokenize(soru);
            if (kelimeler.length > 1) {
                const kelimeVektorleri = kelimeler.map(k => this.kelimeGomme.kelimeVektoru(k));
                const dikkatSonuc = this.dikkat.dikkatHesapla(soruVektor, kelimeVektorleri, kelimeVektorleri);
                const enOnemliIdx = dikkatSonuc.agirliklar.indexOf(Math.max(...dikkatSonuc.agirliklar));
                this.adimEkle("👁️ Dikkat Odağı", `En önemli kelime: "${kelimeler[enOnemliIdx]}" (ağırlık: ${dikkatSonuc.agirliklar[enOnemliIdx].toFixed(3)})`);
            }

            // Adım 6: Derinlemesine düşünme döngüsü
            for (let d = 0; d < derinlik - 5; d++) {
                await this.bekle(50); // Düşünme simülasyonu
                const altDusunce = this.altDusunceUret(soru, niyet, anahtarlar, d);
                this.adimEkle(`🔄 Düşünme Katmanı ${d + 1}`, altDusunce);
            }

            // Adım 7: Sonuç sentezi
            const sonuc = this.sonucSentezle(soru, niyet, anahtarlar, duygu, bellekSonuclari);
            this.adimEkle("✅ Sonuç", sonuc);

            this.dusunmeZamani = Date.now() - baslangicZamani;
            this.adimEkle("⏱️ Süre", `Düşünme süresi: ${this.dusunmeZamani}ms`);

            // Belleğe kaydet
            this.bellek.kisaSureliEkle({ soru, sonuc, zaman: Date.now() });
            this.bellek.episodikEkle({ tip: "dusunme", soru, sonuc, duygu: duygu.duygu });

            return {
                sonuc,
                dusunceSureci: this.dusunceSureci,
                niyet: niyet.niyet,
                duygu: duygu.duygu,
                sure: this.dusunmeZamani,
                derinlik,
                guvenSkor: Math.min(0.95, 0.5 + niyet.skor * 0.1 + (bellekSonuclari.length > 0 ? 0.15 : 0))
            };
        }

        adimEkle(baslik, icerik) {
            this.dusunceSureci.push({
                baslik,
                icerik,
                zaman: Date.now()
            });
        }

        altDusunceUret(soru, niyet, anahtarlar, katman) {
            const dusunceler = [
                `Sorunun bağlamını değerlendiriyorum... "${niyet.niyet}" niyeti ile ilgili bilgi tabanını tarıyorum.`,
                `Anahtar kavramlar arasındaki ilişkileri analiz ediyorum: ${anahtarlar.slice(0, 3).map(a => a.kelime).join(" ↔ ")}`,
                `Alternatif yorumları değerlendiriyorum ve en uygun yanıtı seçiyorum.`,
                `Bağlamsal tutarlılığı kontrol ediyorum ve yanıtı rafine ediyorum.`,
                `Son doğrulama yapıyorum ve güven skorunu hesaplıyorum.`
            ];
            return dusunceler[katman % dusunceler.length];
        }

        sonucSentezle(soru, niyet, anahtarlar, duygu, bellekSonuclari) {
            // Niyet bazlı yanıt üretimi
            switch (niyet.niyet) {
                case "selamlama":
                    return this.selamlamaYaniti(soru);
                case "vedalaşma":
                    return "Görüşmek üzere! Size yardımcı olabildiysem ne mutlu. Tekrar beklerim! 👋";
                case "kendiHakkinda":
                    return this.kendiHakkindaYanit();
                case "matematik":
                    return this.matematikCoz(soru);
                case "duyguAnaliz":
                    return `Duygu analizim: ${duygu.duygu}\nSkor: ${duygu.skor}\n${duygu.detay}`;
                case "bilgi":
                    return this.bilgiYaniti(soru, anahtarlar);
                default:
                    return this.genelYanit(soru, niyet, anahtarlar, duygu);
            }
        }

        selamlamaYaniti(soru) {
            const yanitlar = [
                "Merhaba! Ben Tuncer Zeka 🤖 Ahmet Tuncer tarafından tasarlandım. Size nasıl yardımcı olabilirim?",
                "Selam! Tuncer Zeka olarak hizmetinizdeyim. Ne yapmamı istersiniz? 😊",
                "Hoş geldiniz! Ben Tuncer Zeka, yapay zeka asistanınız. Sorularınızı bekliyorum!",
                "Merhaba! Bugün size nasıl yardımcı olabilirim? Kod yazma, görsel analiz, matematik ve daha fazlası için hazırım! 🚀"
            ];
            return yanitlar[Math.floor(Math.random() * yanitlar.length)];
        }

        kendiHakkindaYanit() {
            return `🤖 Ben Tuncer Zeka (v2026)!

👨‍💻 Tasarımcım: Ahmet Tuncer

🧠 Yeteneklerim:
• Doğal Dil İşleme (Türkçe)
• Duygu Analizi
• Kod Yazma & Analiz (JavaScript, Python, HTML, CSS)
• Görsel Anlama & Üretim
• Matematik Hesaplama
• Uzun Süreli Düşünme (Chain of Thought)
• Sinir Ağı ile Öğrenme
• Bellek Sistemi (Kısa/Uzun Süreli)
• Dikkat Mekanizması (Transformer benzeri)

💡 Tamamen bağımsız çalışırım - API veya internet bağlantısı gerektirmem!
📦 Tek dosyada (tuncer2026.js) tüm yeteneklerimi barındırırım.

Bana istediğiniz soruyu sorabilir, kod yazdırabilir, görsel oluşturabilir veya analiz yaptırabilirsiniz!`;
        }

        matematikCoz(soru) {
            try {
                // Basit matematik ifadelerini çöz
                const ifade = soru.replace(/[^0-9+\-*/().^%\s]/g, "")
                    .replace(/\^/g, "**")
                    .trim();

                if (ifade && /^[0-9+\-*/().%\s]+$/.test(ifade)) {
                    const sonuc = Function('"use strict"; return (' + ifade + ')')();
                    return `📐 Hesaplama: ${ifade} = ${sonuc}`;
                }

                // Özel matematik komutları
                if (soru.includes("karekök") || soru.includes("karekok")) {
                    const sayi = parseFloat(soru.match(/\d+/));
                    if (!isNaN(sayi)) return `📐 √${sayi} = ${Math.sqrt(sayi).toFixed(6)}`;
                }
                if (soru.includes("faktöriyel") || soru.includes("faktoriyel")) {
                    const sayi = parseInt(soru.match(/\d+/));
                    if (!isNaN(sayi) && sayi <= 170) {
                        let sonuc = 1;
                        for (let i = 2; i <= sayi; i++) sonuc *= i;
                        return `📐 ${sayi}! = ${sonuc}`;
                    }
                }
                if (soru.includes("asal")) {
                    const sayi = parseInt(soru.match(/\d+/));
                    if (!isNaN(sayi)) {
                        const asalMi = (n) => {
                            if (n < 2) return false;
                            for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
                            return true;
                        };
                        return `📐 ${sayi} ${asalMi(sayi) ? "asal bir sayıdır ✅" : "asal değildir ❌"}`;
                    }
                }

                return "📐 Matematik ifadesini anlayamadım. Lütfen daha açık yazın. Örnek: 'hesapla 15 + 27 * 3' veya 'karekök 144'";
            } catch (e) {
                return "📐 Hesaplama sırasında bir hata oluştu. Lütfen ifadeyi kontrol edin.";
            }
        }

        bilgiYaniti(soru, anahtarlar) {
            const konular = {
                "yapay zeka": "Yapay zeka (YZ), makinelerin insan benzeri zekâ görevlerini yerine getirmesini sağlayan bilgisayar bilimi dalıdır. Makine öğrenimi, derin öğrenme, doğal dil işleme gibi alt alanları vardır. Ben de bir yapay zeka sistemi olarak Ahmet Tuncer tarafından tasarlandım!",
                "javascript": "JavaScript, web'in temel programlama dilidir. Brendan Eich tarafından 1995'te oluşturulmuştur. Tarayıcılarda çalışır, Node.js ile sunucu tarafında da kullanılabilir. Dinamik, prototip tabanlı bir dildir.",
                "python": "Python, Guido van Rossum tarafından 1991'de oluşturulan yüksek seviyeli bir programlama dilidir. Okunabilirliği, geniş kütüphane desteği ve çok yönlülüğü ile bilinir. Yapay zeka, veri bilimi ve web geliştirmede yaygın kullanılır.",
                "sinir ağı": "Yapay sinir ağları, insan beynindeki nöronlardan esinlenen hesaplama modelleridir. Katmanlardan oluşur: giriş katmanı, gizli katmanlar ve çıkış katmanı. Geri yayılım algoritması ile öğrenirler.",
                "makine öğrenimi": "Makine öğrenimi, bilgisayarların açıkça programlanmadan verilerden öğrenmesini sağlayan YZ alt alanıdır. Denetimli öğrenme, denetimsiz öğrenme ve pekiştirmeli öğrenme olmak üzere üç ana türü vardır.",
                "html": "HTML (HyperText Markup Language), web sayfalarının yapısını tanımlayan işaretleme dilidir. Tim Berners-Lee tarafından 1991'de oluşturulmuştur. En son sürümü HTML5'tir.",
                "css": "CSS (Cascading Style Sheets), web sayfalarının görünümünü ve düzenini kontrol eden stil dilidir. Flexbox, Grid, animasyonlar ve responsive tasarım gibi güçlü özelliklere sahiptir."
            };

            for (const [konu, bilgi] of Object.entries(konular)) {
                if (soru.toLowerCase().includes(konu)) {
                    return `📚 ${bilgi}`;
                }
            }

            return `📚 "${anahtarlar.map(a => a.kelime).join(", ")}" hakkında bilgi tabanımda detaylı bir kayıt bulamadım. Ancak sorularınızı yanıtlamaya devam edebilirim. Daha spesifik bir soru sorabilir misiniz?`;
        }

        genelYanit(soru, niyet, anahtarlar, duygu) {
            let yanit = "";

            if (duygu.skor < -0.2) {
                yanit += "Üzgün görünüyorsunuz, umarım yardımcı olabilirim. ";
            } else if (duygu.skor > 0.2) {
                yanit += "Enerjiniz harika! ";
            }

            yanit += `"${soru}" hakkında düşüncelerimi paylaşayım:\n\n`;

            if (anahtarlar.length > 0) {
                yanit += `Sorununuzda "${anahtarlar[0].kelime}" konusu öne çıkıyor. `;
            }

            yanit += "Bu konuda size yardımcı olmak isterim. ";
            yanit += "\n\nBana daha spesifik sorular sorabilirsiniz:\n";
            yanit += "• 'Kod yaz: ...' - Kod üretimi\n";
            yanit += "• 'Hesapla: ...' - Matematik\n";
            yanit += "• 'Anlat: ...' - Bilgi\n";
            yanit += "• 'Duygu analiz: ...' - Duygu analizi\n";
            yanit += "• 'Resim çiz' - Görsel üretim";

            return yanit;
        }

        bekle(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }
    }

    // ================================================================
    // BÖLÜM 11: ANA TUNCER ZEKA SINIFI
    // ================================================================

    class TuncerZeka {
        constructor(secenekler = {}) {
            this.versiyon = "2026.1.0";
            this.tasarimci = "Ahmet Tuncer";
            this.ad = "Tuncer Zeka";

            // Alt sistemleri başlat
            this.kelimeGomme = new KelimeGomme(secenekler.gommeBoyutu || 64);
            this.dilIsleme = new TurkceDilIsleme();
            this.bellek = new BellekSistemi(secenekler.bellekKapasitesi || 10000);
            this.gorselAnlama = new GorselAnlama();
            this.gorselUretim = new GorselUretim();
            this.kodYazici = new KodYazici();
            this.dusunmeMotoru = new DusunmeMotoru(this.bellek, this.dilIsleme, this.kelimeGomme);

            // Sinir ağları
            this.sinirAglari = {};
            this.varsayilanAg = null;

            // Konuşma geçmişi
            this.konusmaGecmisi = [];
            this.maxGecmis = 100;

            // Başlangıç bilgi tabanını yükle
            this.bilgiTabaniYukle();

            console.log(`
╔══════════════════════════════════════╗
║        TUNCER ZEKA v${this.versiyon}        ║
║   Tasarımcı: ${this.tasarimci}          ║
║   Durum: Aktif ✅                    ║
╚══════════════════════════════════════╝`);
        }

        bilgiTabaniYukle() {
            const bilgiler = {
                "tuncer zeka": "Tuncer Zeka, Ahmet Tuncer tarafından tasarlanmış bir yapay zeka kütüphanesidir.",
                "ahmet tuncer": "Ahmet Tuncer, Tuncer Zeka yapay zeka sisteminin tasarımcısı ve geliştiricisidir.",
                "yapay zeka": "Yapay zeka, makinelerin insan benzeri zekâ görevlerini yerine getirmesini sağlayan bilgisayar bilimi dalıdır.",
                "sinir ağı": "Yapay sinir ağları, insan beyninden esinlenen hesaplama modelleridir.",
                "derin öğrenme": "Derin öğrenme, çok katmanlı sinir ağları kullanan makine öğrenimi alt alanıdır.",
                "doğal dil işleme": "Doğal dil işleme, bilgisayarların insan dilini anlaması ve üretmesi ile ilgilenen alandır.",
                "transformer": "Transformer, dikkat mekanizması kullanan ve NLP'de devrim yaratan bir sinir ağı mimarisidir."
            };

            for (const [anahtar, deger] of Object.entries(bilgiler)) {
                this.bellek.uzunSureliEkle(anahtar, deger, 0.9);
            }
        }

        // Ana sohbet fonksiyonu
        async sor(mesaj, secenekler = {}) {
            const baslangic = Date.now();
            const dusunmeDerinligi = secenekler.derinlik || 7;

            // Konuşma geçmişine ekle
            this.konusmaGecmisi.push({ rol: "kullanici", mesaj, zaman: Date.now() });

            // Niyet tespiti
            const niyet = this.dilIsleme.niyetTespit(mesaj);

            let yanit;

            switch (niyet.niyet) {
                case "kodYazma":
                    yanit = await this.kodYaz(mesaj);
                    break;
                case "gorselAnaliz":
                    yanit = "📷 Görsel analizi için lütfen `gorselAnaliz(gorselKaynagi)` fonksiyonunu kullanın. Canvas veya Image elementi gönderebilirsiniz.";
                    break;
                case "gorselUretim":
                    yanit = await this.gorselOlustur(mesaj);
                    break;
                case "matematik":
                    const dusunce = await this.dusunmeMotoru.dusun(mesaj, 3);
                    yanit = dusunce.sonuc;
                    break;
                default:
                    const sonuc = await this.dusunmeMotoru.dusun(mesaj, dusunmeDerinligi);
                    yanit = sonuc.sonuc;

                    if (secenekler.dusunceSureciniGoster) {
                        yanit = "💭 DÜŞÜNME SÜRECİ:\n" +
                            sonuc.dusunceSureci.map(d => `${d.baslik}: ${d.icerik}`).join("\n") +
                            "\n\n📝 YANIT:\n" + yanit;
                    }
            }

            // Konuşma geçmişine ekle
            this.konusmaGecmisi.push({ rol: "asistan", mesaj: typeof yanit === "string" ? yanit : yanit.aciklama || "Yanıt üretildi", zaman: Date.now() });

            // Geçmiş sınırı
            if (this.konusmaGecmisi.length > this.maxGecmis * 2) {
                this.konusmaGecmisi = this.konusmaGecmisi.slice(-this.maxGecmis);
            }

            return yanit;
        }

        // Kod yazma
        async kodYaz(istek) {
            const sonuc = this.kodYazici.kodUret(istek);
            return {
                tip: "kod",
                ...sonuc,
                mesaj: `✅ ${sonuc.aciklama}\n📝 Dil: ${sonuc.dil}\n📊 ${sonuc.satirSayisi} satır kod üretildi\n\n${sonuc.kod}`
            };
        }

        // Kod analizi
        kodAnalizEt(kod) {
            return this.kodYazici.kodAnaliz(kod);
        }

        // Görsel oluşturma
        async gorselOlustur(istek) {
            const istekLower = istek.toLowerCase();

            if (istekLower.includes("manzara")) {
                let zaman = "gunduz";
                if (istekLower.includes("gece")) zaman = "gece";
                else if (istekLower.includes("akşam") || istekLower.includes("aksam")) zaman = "aksam";
                const canvas = this.gorselUretim.manzaraUret(600, 400, { zaman });
                return { tip: "gorsel", canvas, aciklama: `${zaman} manzarası oluşturuldu` };
            }
            if (istekLower.includes("fraktal") || istekLower.includes("mandelbrot")) {
                const tip = istekLower.includes("julia") ? "julia" : "mandelbrot";
                const canvas = this.gorselUretim.fraktalUret(400, 400, tip);
                return { tip: "gorsel", canvas, aciklama: `${tip} fraktalı oluşturuldu` };
            }
            if (istekLower.includes("pixel") || istekLower.includes("piksel")) {
                let tema = "karakter";
                if (istekLower.includes("kalp")) tema = "kalp";
                else if (istekLower.includes("yıldız") || istekLower.includes("yildiz")) tema = "yildiz";
                else if (istekLower.includes("ev")) tema = "ev";
                const canvas = this.gorselUretim.pixelArtUret(16, 16, 20, tema);
                return { tip: "gorsel", canvas, aciklama: `${tema} pixel art oluşturuldu` };
            }
            if (istekLower.includes("soyut") || istekLower.includes("sanat")) {
                let stil = "geometrik";
                if (istekLower.includes("dalga")) stil = "dalga";
                else if (istekLower.includes("nokta")) stil = "noktasal";
                const canvas = this.gorselUretim.soyutSanatUret(500, 500, stil);
                return { tip: "gorsel", canvas, aciklama: `${stil} soyut sanat oluşturuldu` };
            }
            if (istekLower.includes("grafik") || istekLower.includes("chart")) {
                const veri = [
                    { etiket: "Ocak", deger: 65 },
                    { etiket: "Şubat", deger: 78 },
                    { etiket: "Mart", deger: 90 },
                    { etiket: "Nisan", deger: 81 },
                    { etiket: "Mayıs", deger: 95 },
                    { etiket: "Haziran", deger: 110 }
                ];
                let tip = "cubuk";
                if (istekLower.includes("çizgi") || istekLower.includes("cizgi")) tip = "cizgi";
                else if (istekLower.includes("pasta")) tip = "pasta";
                const canvas = this.gorselUretim.grafikUret(veri, tip, { baslik: "Tuncer Zeka - Örnek Grafik" });
                return { tip: "gorsel", canvas, aciklama: `${tip} grafik oluşturuldu` };
            }

            // Varsayılan: manzara
            const canvas = this.gorselUretim.manzaraUret(600, 400);
            return { tip: "gorsel", canvas, aciklama: "Varsayılan manzara oluşturuldu" };
        }

        // Görsel analiz
        async gorselAnaliz(kaynak) {
            if (typeof kaynak === "string") {
                await this.gorselAnlama.gorselYukle(kaynak);
            } else if (kaynak instanceof HTMLCanvasElement) {
                this.gorselAnlama.canvas = kaynak;
                this.gorselAnlama.ctx = kaynak.getContext("2d");
            } else if (kaynak instanceof HTMLImageElement) {
                this.gorselAnlama.canvasOlustur(kaynak.width, kaynak.height);
                this.gorselAnlama.ctx.drawImage(kaynak, 0, 0);
            }

            const analiz = this.gorselAnlama.gorselAnaliz();
            const palet = this.gorselAnlama.renkPaletiCikar(this.gorselAnlama.pikselVerisiAl());

            return {
                ...analiz,
                renkPaleti: palet,
                mesaj: `🖼️ Görsel Analiz Raporu:\n${analiz.aciklama}\n\nBoyut: ${analiz.boyut.genislik}x${analiz.boyut.yukseklik}\nBaskın Renk: ${analiz.baskinRenk}\nParlaklık: ${analiz.parlaklik.durum}\nKontrast: ${analiz.kontrast.durum}`
            };
        }

        // Görsel filtre uygula
        gorselFiltre(filtreAdi, ...parametreler) {
            const imageData = this.gorselAnlama.pikselVerisiAl();
            if (!imageData) return null;

            if (this.gorselAnlama.filtreler[filtreAdi]) {
                const sonuc = this.gorselAnlama.filtreler[filtreAdi](imageData, ...parametreler);
                this.gorselAnlama.pikselVerisiYaz(sonuc);
                return this.gorselAnlama.canvas;
            }
            return null;
        }

        // Duygu analizi
        duyguAnaliz(metin) {
            return this.dilIsleme.duyguAnalizi(metin);
        }

        // Metin özetleme
        ozetle(metin, cumleSayisi = 3) {
            return this.dilIsleme.metinOzetle(metin, cumleSayisi);
        }

        // Sinir ağı oluşturma
        sinirAgiOlustur(ad, katmanlar, ogrenmeOrani = 0.01) {
            const ag = new SinirAgi(katmanlar, ogrenmeOrani);
            this.sinirAglari[ad] = ag;
            if (!this.varsayilanAg) this.varsayilanAg = ag;
            return ag;
        }

        // Sinir ağı eğitimi
        sinirAgiEgit(ad, veriSeti, epochSayisi = 100) {
            const ag = this.sinirAglari[ad];
            if (!ag) throw new Error(`"${ad}" adında sinir ağı bulunamadı!`);
            return ag.topluEgit(veriSeti, epochSayisi);
        }

        // Sinir ağı tahmini
        sinirAgiTahmin(ad, giris) {
            const ag = this.sinirAglari[ad];
            if (!ag) throw new Error(`"${ad}" adında sinir ağı bulunamadı!`);
            return ag.tahminEt(giris);
        }

        // Kelime benzerliği
        kelimeBenzerligi(kelime1, kelime2) {
            return this.kelimeGomme.benzerlik(kelime1, kelime2);
        }

        // Cümle benzerliği
        cumleBenzerligi(cumle1, cumle2) {
            const v1 = this.kelimeGomme.cumleVektoru(cumle1);
            const v2 = this.kelimeGomme.cumleVektoru(cumle2);
            return Matematik.kosinusBenzerlik(v1, v2);
        }

        // Grafik oluşturma
        grafikOlustur(veri, tip = "cubuk", secenekler = {}) {
            return this.gorselUretim.grafikUret(veri, tip, secenekler);
        }

        // Bellek istatistikleri
        bellekDurumu() {
            return this.bellek.istatistikler();
        }

        // Sistem bilgisi
        sistemBilgisi() {
            return {
                ad: this.ad,
                versiyon: this.versiyon,
                tasarimci: this.tasarimci,
                bellek: this.bellek.istatistikler(),
                sinirAglari: Object.keys(this.sinirAglari).length,
                kelimeDagarcigi: this.kelimeGomme.kelimeSozlugu.size,
                konusmaGecmisi: this.konusmaGecmisi.length,
                yetenekler: [
                    "Doğal Dil İşleme (Türkçe)",
                    "Duygu Analizi",
                    "Kod Yazma & Analiz",
                    "Görsel Anlama & Üretim",
                    "Sinir Ağı Eğitimi",
                    "Uzun Süreli Düşünme",
                    "Bellek Sistemi",
                    "Dikkat Mekanizması",
                    "Kelime Gömme",
                    "Metin Özetleme",
                    "Grafik Oluşturma"
                ]
            };
        }

        // Yardım
        yardim() {
            return `
🤖 TUNCER ZEKA v${this.versiyon} - KULLANIM KILAVUZU
👨‍💻 Tasarımcı: ${this.tasarimci}

📌 TEMEL KOMUTLAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗣️ tz.sor("mesaj")              → Sohbet / Soru-Cevap
💻 tz.kodYaz("istek")            → Kod üretimi
📊 tz.kodAnalizEt(kod)           → Kod analizi
🖼️ tz.gorselOlustur("istek")    → Görsel üretimi
🔍 tz.gorselAnaliz(kaynak)       → Görsel analizi
😊 tz.duyguAnaliz("metin")       → Duygu analizi
📝 tz.ozetle("uzun metin")       → Metin özetleme
📈 tz.grafikOlustur(veri, tip)   → Grafik oluşturma
🧠 tz.sinirAgiOlustur(ad, [...]) → Sinir ağı oluşturma
📏 tz.kelimeBenzerligi(k1, k2)   → Kelime benzerliği
ℹ️ tz.sistemBilgisi()            → Sistem bilgisi
❓ tz.yardim()                   → Bu yardım mesajı

📌 ÖRNEK KULLANIM:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
await tz.sor("Merhaba, nasılsın?")
await tz.sor("JavaScript ile sıralama algoritması yaz")
await tz.gorselOlustur("gece manzarası çiz")
tz.duyguAnaliz("Bugün çok mutluyum!")
await tz.sor("Hesapla 15 * 27 + 33")
            `;
        }
    }

    // ================================================================
    // BÖLÜM 12: GLOBAL EXPORT
    // ================================================================

    // Alt sınıfları da dışa aktar
    TuncerZeka.SinirAgi = SinirAgi;
    TuncerZeka.KelimeGomme = KelimeGomme;
    TuncerZeka.DikkatMekanizmasi = DikkatMekanizmasi;
    TuncerZeka.BellekSistemi = BellekSistemi;
    TuncerZeka.TurkceDilIsleme = TurkceDilIsleme;
    TuncerZeka.GorselAnlama = GorselAnlama;
    TuncerZeka.GorselUretim = GorselUretim;
    TuncerZeka.KodYazici = KodYazici;
    TuncerZeka.DusunmeMotoru = DusunmeMotoru;
    TuncerZeka.Matematik = Matematik;

    // Global'e ata
    global.TuncerZeka = TuncerZeka;

    // Kısa erişim
    global.tz = null; // index.html'de oluşturulacak

})(typeof window !== "undefined" ? window : global);
