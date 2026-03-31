/**
 * Tuncer Zeka - Doğal Dil İşleme (NLP) ve Öğrenme Kütüphanesi
 */
class TuncerZeka {
    constructor() {
        // Tuncer'in beyni burası. Öğrendiği her şeyi burada tutacak.
        this.hafiza = [];
        console.log("🧠 Tuncer Zeka uyandı ve öğrenmeye hazır!");
    }

    /**
     * Harfleri ve kelimeleri daha iyi anlaması için metni parçalara böler (N-gram mantığı).
     * Bu sayede papağan gibi birebir kelime beklemez, harf benzerliklerini de anlar.
     */
    _analizEt(metin) {
        let parcalar = [];
        metin = metin.toLowerCase().trim();
        
        // 1. Önce tam kelimeleri hafızaya al
        let kelimeler = metin.split(/\s+/);
        kelimeler.forEach(k => parcalar.push(k));

        // 2. Sonra kelimeleri harf ikililerine (bigram) böl. 
        // Böylece harfleri de anlamlandırmaya başlar.
        for (let i = 0; i < metin.length - 1; i++) {
            let harfIkili = metin.substring(i, i + 2);
            // Sadece boşluk olmayan harf ikililerini al
            if (harfIkili.trim().length === 2) {
                parcalar.push(harfIkili);
            }
        }
        return parcalar;
    }

    /**
     * Tuncer Zeka'ya yeni bir şeyler öğretmek için kullanılır.
     * @param {string} soru - Kullanıcının söyleyebileceği şey
     * @param {string} cevap - Tuncer Zeka'nın vermesi gereken cevap
     */
    ogren(soru, cevap) {
        this.hafiza.push({
            orijinal: soru,
            ozellikler: this._analizEt(soru), // Harf ve kelime haritası
            verilecekCevap: cevap
        });
        console.log(`[+] Öğrendim: "${soru}" dendiğinde "${cevap}" diyeceğim.`);
    }

    /**
     * Tuncer Zeka'nın kendisine söylenen şeyi düşünüp en mantıklı cevabı bulması.
     * @param {string} mesaj - Kullanıcının mesajı
     */
    dusun(mesaj) {
        if (this.hafiza.length === 0) {
            return "Daha hiçbir şey bilmiyorum kanka, önce bana '.ogren()' ile bir şeyler öğret!";
        }

        let mesajOzellikleri = this._analizEt(mesaj);
        let enIyiSkor = 0;
        let enIyiCevap = "Bu harfleri ve kelimeleri henüz tam çözemedim. Bunun ne demek olduğunu bana öğretir misin?";

        // Hafızasındaki tüm verileri tarar ve en çok benzeyeni bulur
        for (let bilgi of this.hafiza) {
            let kesisim = 0;
            
            for (let ozellik of mesajOzellikleri) {
                if (bilgi.ozellikler.includes(ozellik)) {
                    kesisim++;
                }
            }

            // Jaccard Benzerlik Oranı hesaplaması (Kesişim / Birleşim)
            let birlesim = new Set([...mesajOzellikleri, ...bilgi.ozellikler]).size;
            let benzerlikSkoru = kesisim / birlesim;

            if (benzerlikSkoru > enIyiSkor) {
                enIyiSkor = benzerlikSkoru;
                enIyiCevap = bilgi.verilecekCevap;
            }
        }

        // Eğer benzerlik %25'ten fazlaysa tahminde bulunur. 
        // Yoksa rastgele bir şey sallamaz, bilmediğini itiraf eder.
        if (enIyiSkor > 0.25) {
            return enIyiCevap;
        } else {
            return "Bunu daha önce hiç duymadım. Ne cevap vermem gerektiğini bana öğret!";
        }
    }
}

// ==========================================
// TUNCER ZEKA KULLANIM TESTİ (ÖRNEK)
// ==========================================

// 1. Kütüphaneyi başlatıyoruz
const tuncer = new TuncerZeka();

// 2. Tuncer'e bir şeyler öğretiyoruz (Eğitim aşaması)
tuncer.ogren("Merhaba, nasılsın?", "İyiyim, sen nasılsın?");
tuncer.ogren("Adın ne senin?", "Benim adım Tuncer Zeka, senin için kodlandım!");
tuncer.ogren("Hava bugün çok güzel", "Evet, dışarı çıkmak için harika bir gün.");
tuncer.ogren("Matematik sever misin?", "Sayılarla aram fena değildir.");

console.log("\n--- SOHBET BAŞLIYOR ---");

// 3. Tuncer'i test ediyoruz (Birebir aynı yazmıyoruz, harf hatası yapıyoruz)

// Örnek 1: Birebir doğru yazım
console.log("Sen: Merhaba, nasılsın?");
console.log("Tuncer Zeka:", tuncer.dusun("Merhaba, nasılsın?"));

// Örnek 2: Eksik ve hatalı harfler (Sadece harfleri analiz ederek anlamaya çalışır)
console.log("\nSen: adn n senn?"); // "Adın ne senin?" demek istedik
console.log("Tuncer Zeka:", tuncer.dusun("adn n senn?"));

// Örnek 3: Tamamen farklı kelime yapısı ama benzer harfler
console.log("\nSen: hava çok güzl bugün"); 
console.log("Tuncer Zeka:", tuncer.dusun("hava çok güzl bugün"));

// Örnek 4: Hiç bilmediği bir şey sorarsak
console.log("\nSen: Uzaylılar var mı?");
console.log("Tuncer Zeka:", tuncer.dusun("Uzaylılar var mı?"));
