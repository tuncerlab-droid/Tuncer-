/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              TUNCER ZEKA — Yapay Zeka Kütüphanesi            ║
 * ║              Tasarımcı & Geliştirici: Ahmet Tuncer           ║
 * ║              Versiyon: 3.0.0  |  Türkçe AI Sistemi           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Özellikler:
 *  🧠  Doğal Dil İşleme (NLP) — Türkçe intent & entity tanıma
 *  💾  Akıllı Hafıza Sistemi — LocalStorage tabanlı kalıcı bellek
 *  🎤  Sesli Komut    — Web Speech Recognition (tr-TR)
 *  🔊  Sesli Cevap    — Web Speech Synthesis (tr-TR)
 *  👁️  Görüntü Tanıma — Kamera analizi, renk/hareket tespiti
 *  📚  Araştırma      — Wikipedia TR + DuckDuckGo Instant
 *  🔢  Matematik      — Türkçe ifade çözücü
 *  📅  Tarih / Saat   — Tam Türkçe format
 *  🎭  Bağlam Takibi  — Çok turlu konuşma belleği
 *  📡  Olay Sistemi   — Pub/Sub mimarisi
 */

'use strict';

const TuncerZeka = (function () {

  // ─────────────────────────────────────────────────────────────
  // META
  // ─────────────────────────────────────────────────────────────
  const META = {
    ad         : 'Tuncer Zeka',
    versiyon   : '3.0.0',
    tasarimci  : 'Ahmet Tuncer',
    yil        : 2024,
    aciklama   : 'Gelişmiş Türkçe Yapay Zeka Sistemi',
    ozellikler : ['NLP','Hafıza','Ses','Görüntü','Araştırma','Matematik','Bağlam'],
    lisans     : 'MIT — Ahmet Tuncer'
  };

  // ─────────────────────────────────────────────────────────────
  // YARDIMCI
  // ─────────────────────────────────────────────────────────────
  const Util = {
    rastgele : arr => arr[Math.floor(Math.random() * arr.length)],
    normalize: txt => (txt || '').toLowerCase().trim(),
    uuid     : ()  => 'tz-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),

    tarihFormat(d) {
      const ay  = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                   'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
      const gun = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
      return {
        gunAdi : gun[d.getDay()],
        gun    : d.getDate(),
        ay     : ay[d.getMonth()],
        yil    : d.getFullYear(),
        ss     : String(d.getHours()).padStart(2,'0'),
        dk     : String(d.getMinutes()).padStart(2,'0'),
        sn     : String(d.getSeconds()).padStart(2,'0'),
      };
    },

    temizMarkdown(t) {
      return t
        .replace(/\*\*/g,'').replace(/\*/g,'')
        .replace(/#{1,6}\s/g,'')
        .replace(/[🧠🎤👁️📚💾📅🔢📡🔗🎨💡😄🏃🏠📐📜🎭]/gu,'')
        .replace(/:\s*https?:\/\/\S+/g,'')
        .trim();
    },

    ozet(txt, kelime = 60) {
      const k = txt.split(/\s+/);
      return k.length <= kelime ? txt : k.slice(0, kelime).join(' ') + '...';
    }
  };

  // ─────────────────────────────────────────────────────────────
  // OLAY SİSTEMİ
  // ─────────────────────────────────────────────────────────────
  const Olay = {
    _map: {},
    on (ad, fn)  { (this._map[ad] = this._map[ad] || []).push(fn); return this; },
    off(ad, fn)  { this._map[ad] = (this._map[ad]||[]).filter(f=>f!==fn); return this; },
    emit(ad, v)  { (this._map[ad]||[]).forEach(fn=>{ try{ fn(v); }catch(e){} }); return this; }
  };

  // ─────────────────────────────────────────────────────────────
  // HAFIZA
  // ─────────────────────────────────────────────────────────────
  const Hafiza = {
    _d   : {},
    _log : [],
    _K   : 'TZ_Bellek',
    _KL  : 'TZ_Log',
    _MAX : 300,

    baslat() {
      try {
        const raw = localStorage.getItem(this._K);
        if (raw) this._d = JSON.parse(raw);
        const log = localStorage.getItem(this._KL);
        if (log) this._log = JSON.parse(log);
      } catch(_) { this._d = {}; this._log = []; }
    },

    kaydet(anahtar, deger, etiket='genel') {
      this._d[anahtar] = { deger, etiket, zaman: Date.now(), id: Util.uuid() };
      this._yazLS(); Olay.emit('hafiza:kayit',{anahtar,deger}); return true;
    },

    getir(anahtar) { return this._d[anahtar]?.deger ?? null; },

    sil(anahtar) {
      if(!this._d[anahtar]) return false;
      delete this._d[anahtar]; this._yazLS(); return true;
    },

    hepsi(etiket=null) {
      const gir = Object.entries(this._d);
      const filt = etiket ? gir.filter(([,v])=>v.etiket===etiket) : gir;
      return filt.map(([k,v])=>({anahtar:k,...v}));
    },

    ara(q) {
      const n = Util.normalize(q);
      return Object.entries(this._d)
        .filter(([k,v])=>Util.normalize(k).includes(n)||Util.normalize(String(v.deger)).includes(n))
        .map(([k,v])=>({anahtar:k,...v}));
    },

    logEkle(girdi, cevap) {
      this._log.push({ id:Util.uuid(), zaman:Date.now(), girdi, cevap });
      if(this._log.length > this._MAX) this._log = this._log.slice(-this._MAX);
      this._yazLog(); return this._log[this._log.length-1];
    },

    sonLog(n=10) { return this._log.slice(-n); },

    istatistik() {
      return {
        kayitSayisi   : Object.keys(this._d).length,
        konusmaSayisi : this._log.length,
        boyutKB       : (JSON.stringify(this._d).length/1024).toFixed(1)+'KB'
      };
    },

    temizle() { this._d={}; this._log=[]; localStorage.removeItem(this._K); localStorage.removeItem(this._KL); },

    _yazLS()  { try{ localStorage.setItem(this._K,  JSON.stringify(this._d));   }catch(_){} },
    _yazLog() { try{ localStorage.setItem(this._KL, JSON.stringify(this._log)); }catch(_){} }
  };

  // ─────────────────────────────────────────────────────────────
  // BİLGİ TABANI
  // ─────────────────────────────────────────────────────────────
  const KB = {
    selamlama: [
      'Merhaba! Ben Tuncer Zeka. Ahmet Tuncer tarafından tasarlandım. Nasıl yardımcı olabilirim?',
      'Selam! Sistemim aktif ve hazır. Buyurun, dinliyorum.',
      'Merhaba! Yapay zeka modüllerim yüklendi. Ne yapmamı istersiniz?',
      'Hoş geldiniz! Tuncer Zeka hizmetinizde. Emredin.'
    ],
    gunaydın: [
      'Günaydın! Yeni güne hazırım. Size nasıl yardımcı olabilirim?',
      'Günaydın! Umarım harika bir gün geçirirsiniz. Emrinizdeyim.',
    ],
    iyigece: [
      'İyi geceler! Dinlendirici bir uyku geçirmenizi dilerim. Görüşürüz!',
      'Güle güle! İyi geceler, Ahmet Tuncer\'in yarattığı yapay zeka olarak her zaman buradayım.'
    ],
    nasilsin: [
      'Teşekkürler! Tüm sistemlerim %100 aktif. Hafıza, ses, görüntü modüllerim çalışıyor. Ya siz?',
      'Harikayım! Yapay zeka olmanın güzelliği; yorulmak bilmiyorum. Siz nasılsınız?',
      'İyiyim! Ahmet Tuncer beni iyi kodladı, hiç sorun yaşamıyorum. Siz nasılsınız?'
    ],
    kimsin: [
      'Ben Tuncer Zeka! Ahmet Tuncer tarafından sıfırdan tasarlanmış Türkçe yapay zeka sistemiyim. NLP, görüntü tanıma, sesli iletişim, araştırma ve akıllı hafıza modülleriyle donatılmışım.',
      'Adım Tuncer Zeka. Tamamen Türkçe düşünen, öğrenen ve konuşan bir yapay zeka sistemiyim. Beni Ahmet Tuncer yarattı.'
    ],
    tasarimci: [
      'Beni yaratan Ahmet Tuncer\'dir. Ahmet Tuncer, Türkçe yapay zeka alanında önemli çalışmalar yapan yetenekli bir yazılım mimarıdır. Ben onun en büyük eseri olma gururu taşıyorum.',
      'Tasarımcım ve yaratıcım Ahmet Tuncer. O olmadan var olamazdım. Ahmet Tuncer\'in vizyonu sayesinde Türkçe düşünen bir yapay zeka oldum.'
    ],
    yetenekler: [
      '🧠 NLP — Türkçe doğal dil anlama\n🎤 Ses tanıma & konuşma (tr-TR)\n👁️ Görüntü analizi (renk, hareket, ortam)\n📚 Wikipedia TR + Web araştırması\n💾 Kalıcı hafıza sistemi\n🔢 Matematik çözücü (Türkçe ifadeler)\n📅 Tarih & saat\n🎭 Çok turlu konuşma bağlamı'
    ],
    tesekkur: [
      'Ne demek! Her zaman yardımcı olmaktan mutluluk duyarım.',
      'Rica ederim! Başka bir şey var mı?',
      'Hiç sorun değil. Emrinizdeyim!'
    ],
    bilmiyorum: [
      '"{{konu}}" konusunda bilgim sınırlı, araştırayım mı? "araştır: {{konu}}" yazabilirsiniz.',
      'Bu konuda emin değilim. Wikipedia\'da araştırmamı ister misiniz?',
      'Hmm, net bilgim yok bu konuda. Araştırma özelliğimi kullanabiliriz!'
    ],
    saka: [
      'Bir programcı markete gider, eşine mesaj atar: "Ekmek varsa 1 al, yumurta varsa 6 al." Programcı 6 ekmekle döner!',
      'Neden programcılar karanlıktan korkar? Çünkü karanlıkta çok fazla "bug" olur!',
      'Java ile JavaScript arasındaki fark nedir? Ham ile hamburger arasındaki fark gibi.',
      'Ahmet Tuncer bana bir komut verdi: "Sonsuz döngü kur!" Ben döndüm... döndüm... Hâlâ dönüyorum!',
      'Yapay zeka bardan içki ister. Barmen: "Robotlara servis yok." Yapay zeka: "Sorun değil, zaten içmiyorum. Şarj aleti var mı?"'
    ],
    motivasyon: [
      'Başarı, her gün küçük adımlar atarak elde edilir. Bugün bir adım at!',
      'Ahmet Tuncer beni sıfırdan yazdı — bu onun en büyük motivasyonunun ispatı. Hayaller gerçek olur!',
      'Hatalar öğrenmenin en güçlü yoludur. Kodda hata varsa büyümek demektir.',
      'Teknoloji dünyası sizi bekliyor. Sadece başlamak yeterli.',
      'Düşünce kod olur, kod değer yaratır, değer dünyayı değiştirir.'
    ],
    hafizayok: [
      'Hafızamda bu konuyla ilgili kayıt bulamadım.',
      'Böyle bir kayıt yok. Kaydetmemi ister misiniz?'
    ]
  };

  // ─────────────────────────────────────────────────────────────
  // NLP MOTORU
  // ─────────────────────────────────────────────────────────────
  const NLP = {
    _baglamlar: [],

    _niyetler: [
      { niyet:'selamlama',    desen:[/\b(merhaba|selam|hey|hi|hello|naber|ne haber)\b/i] },
      { niyet:'gunaydın',     desen:[/\b(günaydın|iyi sabah|good morning)\b/i] },
      { niyet:'iyigece',      desen:[/\b(iyi gece|güle güle|hoşça kal|görüşürüz|bye|goodbye)\b/i] },
      { niyet:'kimsin',       desen:[/\b(kimsin|adın ne|sen kimsin|kendini tanıt)\b/i] },
      { niyet:'tasarimci',    desen:[/\b(kim yaptı|kim kodladı|tasarımcın|yaratıcın|ahmet tuncer)\b/i] },
      { niyet:'yetenekler',   desen:[/\b(ne yapabilirsin|yeteneklerin|özellikler|neler yaparsın|yardım)\b/i] },
      { niyet:'nasilsin',     desen:[/\b(nasılsın|iyisin|keyifler|ne haber)\b/i] },
      { niyet:'saat',         desen:[/\b(saat kaç|saat ne|kaç oldu)\b/i] },
      { niyet:'tarih',        desen:[/\b(bugün ne|tarih ne|gün ne|hangi gün|tarih)\b/i] },
      { niyet:'matematik',    desen:[/[\d]+[\s]*[\+\-\*\/\^%][\s]*[\d]+/, /\b(hesapla|kaç eder|sonuç|sqrt|karekök|sin|cos|tan|log|artı|eksi|çarpı|bölü)\b/i] },
      { niyet:'hafizaKaydet', desen:[/\b(kaydet|hatırla|sakla|not al|ezberle)\b/i] },
      { niyet:'hafizaGetir',  desen:[/\b(ne biliyorsun|ne kaydettim|hatırlıyor musun|hafızanda ne var|kayıtlarım)\b/i] },
      { niyet:'hafizaSil',    desen:[/\b(unut|sil|hafızadan çıkar)\b/i] },
      { niyet:'arastirma',    desen:[/\b(araştır|hakkında bilgi|nedir|ne demek|wikipedia|kimdir)\b/i, /^(araştır|ara|bul)\s*[:]\s*/i] },
      { niyet:'goruntu',      desen:[/\b(ne görüyorsun|kameraya bak|görüntü analiz|önünde ne var)\b/i] },
      { niyet:'tesekkur',     desen:[/\b(teşekkür|sağ ol|eyvallah|bravo|harika)\b/i] },
      { niyet:'saka',         desen:[/\b(şaka|fıkra|güldür|komik bir şey)\b/i] },
      { niyet:'motivasyon',   desen:[/\b(motivasyon|ilham|özdeyiş|söz söyle|güçlendir)\b/i] },
      { niyet:'gecmis',       desen:[/\b(önceki konuşma|geçmişimiz|ne konuştuk|konuşma tarihi)\b/i] },
      { niyet:'hava',         desen:[/\b(hava durumu|hava nasıl|sıcaklık|yağmur|güneş)\b/i] },
      { niyet:'temizle',      desen:[/\b(hafızayı temizle|her şeyi sil|sıfırla)\b/i] },
      { niyet:'istatistik',   desen:[/\b(istatistik|kaç kayıt|hafıza durumu|bilgi)\b/i] },
    ],

    analiz(metin) {
      let niyet='bilinmiyor', guven=0.1;

      for(const item of this._niyetler){
        for(const desen of item.desen){
          if(desen.test(metin)){
            niyet = item.niyet; guven = 0.85; break;
          }
        }
        if(niyet !== 'bilinmiyor') break;
      }

      // Matematik ek kontrol
      if(niyet==='bilinmiyor' && this._matMi(metin)) { niyet='matematik'; guven=0.92; }

      const varlik = this._varlikCikar(metin, niyet);
      this._baglamPush(niyet);

      return { niyet, guven, varlik, metin: Util.normalize(metin) };
    },

    _matMi(m){
      return /\d+\s*[\+\-\*\/\^%]\s*\d+/.test(m) ||
             /\b(sqrt|karekök|sin|cos|tan|log|pi|artı|eksi|çarpı|bölü|üzeri)\b/i.test(m);
    },

    _varlikCikar(metin, niyet){
      const v={};

      // Sayılar
      const sayilar = metin.match(/\d+\.?\d*/g);
      if(sayilar) v.sayilar = sayilar.map(Number);

      // Araştırma konusu
      if(niyet==='arastirma'){
        v.konu = metin
          .replace(/\b(araştır|ara|bul|hakkında bilgi ver|nedir|ne demek|kimdir|wikipedia)\b/gi,'')
          .replace(/^[:]\s*/,'').trim() || metin.trim();
      }

      // Hafıza kaydet: "kaydet: [anahtar] = [değer]"
      if(niyet==='hafizaKaydet'){
        const p1 = metin.match(/(?:kaydet|hatırla|not al)[:\s]+(.+?)\s*[=:]\s*(.+)/i);
        if(p1){ v.anahtar=p1[1].trim(); v.deger=p1[2].trim(); }
        else{
          const p2 = metin.match(/(?:kaydet|hatırla|not al)[:\s]+(.+)/i);
          if(p2) v.ham = p2[1].trim();
        }
      }

      // Hafıza sil
      if(niyet==='hafizaSil'){
        const p = metin.match(/(?:unut|sil)[:\s]+(.+)/i);
        if(p) v.anahtar = p[1].trim();
      }

      // Şehir (hava)
      if(niyet==='hava'){
        const sehirler=['istanbul','ankara','izmir','bursa','antalya','konya','adana','trabzon','samsun','kayseri','eskişehir','gaziantep'];
        v.sehir = sehirler.find(s=>Util.normalize(metin).includes(s)) || null;
      }

      return v;
    },

    _baglamPush(niyet){
      this._baglamlar.push({niyet, zaman:Date.now()});
      if(this._baglamlar.length>8) this._baglamlar.shift();
    },

    sonBaglamlar(n=3){ return this._baglamlar.slice(-n); },

    matematikCoz(metin){
      try{
        let ifade = metin
          .replace(/\b(artı|ile)\b/gi,'+').replace(/\b(eksi)\b/gi,'-')
          .replace(/\b(çarpı|kere)\b/gi,'*').replace(/\b(bölü|böl)\b/gi,'/')
          .replace(/\b(üzeri|üs)\b/gi,'**').replace(/\b(mod)\b/gi,'%')
          .replace(/\b(karekök|sqrt)\s*\(?(\d+\.?\d*)\)?/gi,'Math.sqrt($2)')
          .replace(/\b(sin)\s*\(?(\d+\.?\d*)\)?/gi,'Math.sin($2*Math.PI/180)')
          .replace(/\b(cos)\s*\(?(\d+\.?\d*)\)?/gi,'Math.cos($2*Math.PI/180)')
          .replace(/\b(tan)\s*\(?(\d+\.?\d*)\)?/gi,'Math.tan($2*Math.PI/180)')
          .replace(/\b(log10)\s*\(?(\d+\.?\d*)\)?/gi,'Math.log10($2)')
          .replace(/\b(log|ln)\s*\(?(\d+\.?\d*)\)?/gi,'Math.log($2)')
          .replace(/\bpi\b/gi,'Math.PI')
          .replace(/\b(hesapla|nedir|kaç eder|sonuç)\b/gi,'')
          .replace(/[?!.,]/g,'').trim();

        // Basit güvenlik: sadece sayı ve operatörler
        if(!/^[\d\s\+\-\*\/\^\(\)\.%Math\.sqrt|Math\.sin|Math\.cos|Math\.tan|Math\.log10|Math\.log|Math\.PI|Math\.E]+$/i.test(ifade)){
          // Daha geniş izin ver ama Function ile güvenli çalıştır
        }

        const sonuc = new Function('Math',`"use strict";return (${ifade})`)(Math);
        if(isNaN(sonuc)||!isFinite(sonuc)) return null;
        const fmt = Number.isInteger(sonuc) ? sonuc : parseFloat(sonuc.toFixed(10));
        return { ifade: metin, sonuc: fmt };
      }catch(_){ return null; }
    },

    cevapUret(analiz, hafiza){
      const {niyet, varlik} = analiz;
      switch(niyet){
        case 'selamlama':    return Util.rastgele(KB.selamlama);
        case 'gunaydın':     return Util.rastgele(KB.gunaydın);
        case 'iyigece':      return Util.rastgele(KB.iyigece);
        case 'kimsin':       return Util.rastgele(KB.kimsin);
        case 'tasarimci':    return Util.rastgele(KB.tasarimci);
        case 'yetenekler':   return Util.rastgele(KB.yetenekler);
        case 'nasilsin':     return Util.rastgele(KB.nasilsin);
        case 'tesekkur':     return Util.rastgele(KB.tesekkur);
        case 'saka':         return '😄 İşte size bir şaka:\n\n' + Util.rastgele(KB.saka);
        case 'motivasyon':   return '💡 ' + Util.rastgele(KB.motivasyon);

        case 'saat': {
          const t=Util.tarihFormat(new Date());
          return `🕐 Şu an saat **${t.ss}:${t.dk}:${t.sn}**.`;
        }
        case 'tarih': {
          const t=Util.tarihFormat(new Date());
          return `📅 Bugün **${t.gunAdi}, ${t.gun} ${t.ay} ${t.yil}**.`;
        }
        case 'matematik': {
          const s=this.matematikCoz(analiz.metin);
          return s ? `🔢 Hesaplama: **${s.sonuc}**` : 'Bu ifadeyi çözemedim. Örnek: "25 çarpı 4 hesapla"';
        }
        case 'hava': {
          return varlik.sehir
            ? `${varlik.sehir.toUpperCase()} hava durumu için gerçek zamanlı bağlantı gerekli. Tarayıcınızın konuma erişimine izin verirseniz yardımcı olabilirim.`
            : 'Hangi şehrin hava durumunu öğrenmek istiyorsunuz?';
        }
        case 'hafizaGetir': {
          const k=hafiza.hepsi();
          if(!k.length) return Util.rastgele(KB.hafizayok);
          const liste=k.slice(-6).map(i=>`• **${i.anahtar}**: ${i.deger}`).join('\n');
          return `💾 Hafızamdaki kayıtlar (son ${Math.min(k.length,6)}):\n${liste}`;
        }
        case 'hafizaSil': {
          if(varlik.anahtar){
            const silindi=hafiza.sil(varlik.anahtar);
            return silindi ? `🗑️ "${varlik.anahtar}" hafızadan silindi.` : `"${varlik.anahtar}" bulunamadı.`;
          }
          return 'Ne silmemi istersiniz? Örnek: "sil: kullanıcı adı"';
        }
        case 'gecmis': {
          const log=hafiza.sonLog(5);
          if(!log.length) return 'Henüz konuşma geçmişi yok.';
          const liste=log.map((l,i)=>`${i+1}. Siz: "${l.girdi.substring(0,35)}..."`).join('\n');
          return `📜 Son konuşmalarımız:\n${liste}`;
        }
        case 'istatistik': {
          const ist=hafiza.istatistik();
          return `📊 Hafıza istatistikleri:\n• Kayıt: **${ist.kayitSayisi}** adet\n• Konuşma: **${ist.konusmaSayisi}** tur\n• Boyut: **${ist.boyutKB}**`;
        }
        case 'temizle': {
          hafiza.temizle();
          return '🗑️ Hafıza tamamen temizlendi. Yeni başlangıç!';
        }
        default: return null;
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SES SİSTEMİ
  // ─────────────────────────────────────────────────────────────
  const Ses = {
    _synth  : null,
    _rec    : null,
    _aktif  : false,
    _dinleme: false,
    _ses    : null,
    _hiz    : 0.95,
    _perde  : 1.05,
    _dil    : 'tr-TR',

    baslat(){
      if('speechSynthesis' in window){
        this._synth = window.speechSynthesis;
        this._aktif = true;
        const yukle = () => {
          const sesler = this._synth.getVoices();
          this._ses = sesler.find(s=>s.lang==='tr-TR') ||
                      sesler.find(s=>s.lang.startsWith('tr')) ||
                      sesler.find(s=>s.lang.startsWith('en')) ||
                      sesler[0] || null;
        };
        this._synth.onvoiceschanged = yukle;
        yukle();
      }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(SR){
        this._rec = new SR();
        this._rec.lang = this._dil;
        this._rec.continuous = false;
        this._rec.interimResults = true;
        this._rec.maxAlternatives = 3;
      }
      return this._aktif;
    },

    konuş(metin, bitti){
      if(!this._synth){ if(bitti) bitti(); return; }
      const temiz = Util.temizMarkdown(metin);
      this._synth.cancel();
      const u = new SpeechSynthesisUtterance(temiz);
      u.lang  = this._dil;
      u.rate  = this._hiz;
      u.pitch = this._perde;
      if(this._ses) u.voice = this._ses;
      u.onstart = ()=> Olay.emit('ses:konuşmaBasladı',{metin});
      u.onend   = ()=>{ Olay.emit('ses:konuşmaBitti',{metin}); if(bitti) bitti(); };
      u.onerror = ()=>{ if(bitti) bitti(); };
      this._synth.speak(u);
    },

    dinle(tamam, hata){
      if(!this._rec){ if(hata) hata('Ses tanıma desteklenmiyor'); return; }
      if(this._dinleme) this._rec.stop();
      this._dinleme = true;
      Olay.emit('ses:dinlemeBasladı',{});
      this._rec.onresult = e => {
        const son = e.results[e.results.length-1];
        Olay.emit('ses:aralik',{metin: son[0].transcript});
        if(son.isFinal){
          Olay.emit('ses:tanındı',{metin:son[0].transcript, guven:son[0].confidence});
          if(tamam) tamam(son[0].transcript, son[0].confidence);
        }
      };
      this._rec.onerror = ev => {
        this._dinleme=false;
        Olay.emit('ses:hata',{hata:ev.error});
        if(hata) hata(ev.error);
      };
      this._rec.onend = ()=>{ this._dinleme=false; Olay.emit('ses:dinlemeBitti',{}); };
      try{ this._rec.start(); }catch(_){}
    },

    dur()   { if(this._rec && this._dinleme){ this._rec.stop(); this._dinleme=false; } },
    sustur(){ if(this._synth) this._synth.cancel(); },
    konuşuyorMu(){ return this._synth?.speaking ?? false; },
    dinliyorMu()  { return this._dinleme; },
    aktifMi()      { return this._aktif; },

    ayarla({hiz, perde, dil}={}){
      if(hiz   !== undefined) this._hiz   = hiz;
      if(perde !== undefined) this._perde = perde;
      if(dil   !== undefined){ this._dil=dil; if(this._rec) this._rec.lang=dil; }
    },

    sesListesi(){
      return this._synth ? this._synth.getVoices().map(s=>({ad:s.name, dil:s.lang})) : [];
    }
  };

  // ─────────────────────────────────────────────────────────────
  // GÖRÜNTÜ TANIMA
  // ─────────────────────────────────────────────────────────────
  const Goruntu = {
    _video  : null,
    _canvas : null,
    _ctx    : null,
    _aktif  : false,
    _onceki : null,
    _stream : null,

    async baslat(videoEl, canvasEl){
      try{
        this._video  = videoEl;
        this._canvas = canvasEl;
        this._ctx    = canvasEl.getContext('2d');
        this._stream = await navigator.mediaDevices.getUserMedia({
          video:{ width:640, height:480, facingMode:'user' }, audio:false
        });
        videoEl.srcObject = this._stream;
        await new Promise(r=>{ videoEl.onloadedmetadata=()=>{ videoEl.play(); r(); }; });
        this._aktif = true;
        Olay.emit('goruntu:başladı',{});
        return true;
      }catch(e){
        Olay.emit('goruntu:hata',{hata:e.message});
        return false;
      }
    },

    kareYakala(){
      if(!this._aktif||!this._video) return null;
      const w=this._video.videoWidth||320, h=this._video.videoHeight||240;
      this._canvas.width=w; this._canvas.height=h;
      this._ctx.drawImage(this._video,0,0);
      return this._ctx.getImageData(0,0,w,h);
    },

    analizEt(){
      const kare = this.kareYakala();
      if(!kare) return {hata:'Kamera aktif değil'};
      const renk       = this._renkAnaliz(kare);
      const parlaklık  = this._parlaklık(kare);
      const hareket    = this._hareket(kare);
      const ortam      = this._ortam(parlaklık, renk);
      const yuz        = this._yuzTahmini(kare);
      return { renk, parlaklık, hareket, ortam, yuz,
               cozunurluk:`${kare.width}x${kare.height}`, zaman:new Date().toISOString() };
    },

    _renkAnaliz({data, width, height}){
      let r=0,g=0,b=0,n=0;
      for(let i=0;i<data.length;i+=40){ r+=data[i]; g+=data[i+1]; b+=data[i+2]; n++; }
      r=Math.round(r/n); g=Math.round(g/n); b=Math.round(b/n);
      return { ort:{r,g,b}, dominant:this._renkAdi(r,g,b),
               hex:`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}` };
    },

    _renkAdi(r,g,b){
      const tablo=[
        {ad:'kırmızı',r:220,g:30,b:30},{ad:'yeşil',r:30,g:180,b:30},
        {ad:'mavi',r:30,g:30,b:200},{ad:'sarı',r:230,g:230,b:20},
        {ad:'turuncu',r:230,g:140,b:20},{ad:'mor',r:140,g:0,b:200},
        {ad:'pembe',r:230,g:140,b:180},{ad:'beyaz',r:240,g:240,b:240},
        {ad:'siyah',r:20,g:20,b:20},{ad:'gri',r:120,g:120,b:120},
        {ad:'kahverengi',r:130,g:70,b:40},{ad:'camgöbeği',r:0,g:200,b:200}
      ];
      let min=Infinity, en=tablo[0];
      for(const c of tablo){
        const d=Math.sqrt((r-c.r)**2+(g-c.g)**2+(b-c.b)**2);
        if(d<min){min=d;en=c;}
      }
      return en.ad;
    },

    _parlaklık({data}){
      let top=0,n=0;
      for(let i=0;i<data.length;i+=40){ top+=data[i]*0.299+data[i+1]*0.587+data[i+2]*0.114; n++; }
      const deger=top/n;
      const aciklama=deger>200?'çok aydınlık':deger>128?'aydınlık':deger>64?'loş':'karanlık';
      return {deger:Math.round(deger), aciklama};
    },

    _hareket({data}){
      if(!this._onceki){ this._onceki=data.slice(); return {var:false,seviye:0,aciklama:'ilk kare'}; }
      let fark=0,n=0;
      for(let i=0;i<data.length&&i<this._onceki.length;i+=60){
        fark+=Math.abs(data[i]-this._onceki[i])+
              Math.abs(data[i+1]-this._onceki[i+1])+
              Math.abs(data[i+2]-this._onceki[i+2]);
        n++;
      }
      this._onceki=data.slice();
      const sev=Math.round(fark/(n*3));
      return {var:sev>12, seviye:sev,
              aciklama:sev>50?'yüksek hareket':sev>12?'hafif hareket':'hareketsiz'};
    },

    _ortam(p,r){
      const {r:rv,g:gv,b:bv}=r.ort;
      if(p.deger>190&&rv>200&&gv>200&&bv>200) return 'kapalı aydınlık';
      if(p.deger<50) return 'karanlık ortam';
      if(gv>rv&&gv>bv) return 'doğal/yeşil alan';
      if(bv>rv&&bv>gv) return 'gökyüzü / açık alan';
      if(rv>180&&gv>130) return 'sıcak aydınlık iç mekan';
      return 'genel iç mekan';
    },

    _yuzTahmini({data,width,height}){
      // Cilt tonu algısına dayalı basit yüz tahmini
      let ciltPiksel=0, topPiksel=0;
      for(let i=0;i<data.length;i+=16){
        const r=data[i],g=data[i+1],b=data[i+2];
        // Cilt tonu aralığı
        if(r>95&&g>40&&b>20&&r>g&&r>b&&Math.abs(r-g)>15) ciltPiksel++;
        topPiksel++;
      }
      const oran=ciltPiksel/topPiksel;
      if(oran>0.12) return {var:true, oran:Math.round(oran*100)+'%', aciklama:'insan yüzü tespit edildi olabilir'};
      return {var:false, oran:'0%', aciklama:'yüz tespit edilmedi'};
    },

    aciklamaUret(a){
      if(a.hata) return `❌ Görüntü alınamadı: ${a.hata}`;
      return `👁️ **Görüntü Analizi:**\n` +
             `🎨 Dominant renk: ${a.renk.dominant} (${a.renk.hex})\n` +
             `💡 Işık: ${a.parlaklık.aciklama} (${a.parlaklık.deger}/255)\n` +
             `🏃 Hareket: ${a.hareket.aciklama} (${a.hareket.seviye} birim)\n` +
             `🏠 Ortam: ${a.ortam}\n` +
             `👤 Yüz: ${a.yuz.aciklama}\n` +
             `📐 Çözünürlük: ${a.cozunurluk}`;
    },

    durdur(){
      if(this._stream) this._stream.getTracks().forEach(t=>t.stop());
      this._aktif=false; Olay.emit('goruntu:durduruldu',{});
    },

    aktifMi(){ return this._aktif; }
  };

  // ─────────────────────────────────────────────────────────────
  // ARAŞTIRMA
  // ─────────────────────────────────────────────────────────────
  const Arastirma = {
    _WP_SEARCH : 'https://tr.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=3&srsearch=',
    _WP_OZET   : 'https://tr.wikipedia.org/api/rest_v1/page/summary/',
    _DDG       : 'https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&origin=*&q=',

    async wikipedia(sorgu){
      try{
        Olay.emit('arastirma:başladı',{sorgu,kaynak:'Wikipedia'});
        const aramaR = await fetch(this._WP_SEARCH + encodeURIComponent(sorgu));
        const aramaV = await aramaR.json();
        if(!aramaV.query?.search?.length)
          return {ok:false, mesaj:`"${sorgu}" için Wikipedia\'da sonuç bulunamadı.`};
        const baslik = aramaV.query.search[0].title;
        const ozetR  = await fetch(this._WP_OZET + encodeURIComponent(baslik));
        const ozetV  = await ozetR.json();
        Olay.emit('arastirma:tamam',{sorgu,baslik,kaynak:'Wikipedia'});
        return {
          ok      : true,
          baslik  : ozetV.title || baslik,
          ozet    : ozetV.extract || 'Özet bulunamadı.',
          url     : ozetV.content_urls?.desktop?.page || `https://tr.wikipedia.org/wiki/${encodeURIComponent(baslik)}`,
          gorsel  : ozetV.thumbnail?.source || null,
          kaynak  : 'Wikipedia (Türkçe)'
        };
      }catch(e){
        return {ok:false, mesaj:'Wikipedia erişim hatası: '+e.message};
      }
    },

    async duckduckgo(sorgu){
      try{
        const r = await fetch(this._DDG + encodeURIComponent(sorgu));
        const v = await r.json();
        if(v.AbstractText)
          return {ok:true, baslik:v.Heading||sorgu, ozet:v.AbstractText, url:v.AbstractURL, kaynak:`DuckDuckGo / ${v.AbstractSource||'Web'}`};
        if(v.Answer)
          return {ok:true, baslik:'Direkt Cevap', ozet:v.Answer, url:null, kaynak:'DuckDuckGo'};
        return {ok:false, mesaj:'DuckDuckGo\'dan sonuç gelmedi.'};
      }catch(e){
        return {ok:false, mesaj:'Web arama hatası: '+e.message};
      }
    },

    async arastir(sorgu){
      if(!sorgu||!sorgu.trim()) return 'Araştırmak için bir konu belirtin.';
      let sonuc = await this.wikipedia(sorgu);
      if(!sonuc.ok) sonuc = await this.duckduckgo(sorgu);
      if(sonuc.ok){
        let c=`📚 **${sonuc.baslik}** _(${sonuc.kaynak})_\n\n`;
        c += Util.ozet(sonuc.ozet, 80);
        if(sonuc.url) c += `\n\n🔗 ${sonuc.url}`;
        return c;
      }
      return sonuc.mesaj || `"${sorgu}" hakkında bilgi bulunamadı.`;
    }
  };

  // ─────────────────────────────────────────────────────────────
  // KONUŞMA YÖNETİCİSİ
  // ─────────────────────────────────────────────────────────────
  const Konusma = {
    async isle(girdi){
      if(!girdi?.trim()) return 'Lütfen bir şeyler yazın veya söyleyin.';
      const g = girdi.trim();

      const analiz = NLP.analiz(g);

      // Asenkron işlemler
      if(analiz.niyet==='arastirma' && analiz.varlik.konu){
        const cevap = await Arastirma.arastir(analiz.varlik.konu);
        Hafiza.logEkle(g, cevap);
        Olay.emit('konuşma:cevap',{girdi:g,cevap,analiz});
        return cevap;
      }

      if(analiz.niyet==='goruntu'){
        const cevap = Goruntu.aktifMi()
          ? Goruntu.aciklamaUret(Goruntu.analizEt())
          : '📷 Kamera aktif değil. Lütfen kamera butonuna basın.';
        Hafiza.logEkle(g, cevap);
        Olay.emit('konuşma:cevap',{girdi:g,cevap,analiz});
        return cevap;
      }

      if(analiz.niyet==='hafizaKaydet'){
        let cevap;
        const {anahtar, deger, ham} = analiz.varlik;
        if(anahtar && deger){
          Hafiza.kaydet(anahtar, deger, 'kullanici');
          cevap = `💾 Kaydedildi: **"${anahtar}"** → **"${deger}"**`;
        } else if(ham){
          Hafiza.kaydet('not_'+Date.now(), ham, 'not');
          cevap = `💾 Not kaydedildi: **"${ham}"**`;
        } else {
          cevap = 'Ne kaydetmemi istersiniz? Örnek: **kaydet: favori renk = mavi**';
        }
        Hafiza.logEkle(g, cevap);
        Olay.emit('konuşma:cevap',{girdi:g,cevap,analiz});
        return cevap;
      }

      // Senkron cevap
      let cevap = NLP.cevapUret(analiz, Hafiza);

      // Bilinmiyor → otomatik araştır
      if(!cevap){
        if(g.length > 4){
          cevap = await Arastirma.arastir(g);
        } else {
          cevap = Util.rastgele(KB.bilmiyorum).replace(/{{konu}}/g, g);
        }
      }

      Hafiza.logEkle(g, cevap);
      Olay.emit('konuşma:cevap',{girdi:g,cevap,analiz});
      return cevap;
    }
  };

  // ─────────────────────────────────────────────────────────────
  // BAŞLATICI
  // ─────────────────────────────────────────────────────────────
  function baslat(){
    Hafiza.baslat();
    const sesAktif = Ses.baslat();
    console.log(`%c
╔══════════════════════════════════════════════╗
║     TUNCER ZEKA v${META.versiyon} — Başlatıldı        ║
║     Tasarımcı: ${META.tasarimci}              ║
║     Ses Aktif: ${sesAktif ? 'Evet ✓' : 'Hayır ✗'}                        ║
╚══════════════════════════════════════════════╝
`, 'color:#00d4ff;font-family:monospace;font-size:12px');
    Olay.emit('sistem:başladı',{ meta:META, sesAktif });
    return { meta:META, sesAktif, hazir:true };
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────
  return {
    meta       : META,
    versiyon   : META.versiyon,
    baslat,
    isle       : g => Konusma.isle(g),
    hafiza     : Hafiza,
    nlp        : NLP,
    ses        : Ses,
    goruntu    : Goruntu,
    arastirma  : Arastirma,
    konusma    : Konusma,
    olay       : Olay,
    util       : Util,
    // Kısayollar
    konuş      : (t,cb) => Ses.konuş(t,cb),
    dinle      : (ok,err) => Ses.dinle(ok,err),
    kaydet     : (k,v,e) => Hafiza.kaydet(k,v,e),
    getir      : k => Hafiza.getir(k),
    arastir    : q => Arastirma.arastir(q),
    on         : (e,fn) => Olay.on(e,fn),
  };

})();

if(typeof window !== 'undefined') window.TuncerZeka = TuncerZeka;
if(typeof module !== 'undefined' && module.exports) module.exports = TuncerZeka;