// Gerekli modüller: npm install express cors
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
// Frontend'in (HTML dosyanın) bu sunucuya istek atabilmesi için CORS izni
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Yüz verileri büyük olabilir

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// --- BAŞLANGIÇ VERİTABANI DOSYASI OLUŞTURMA ---
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ 
        faceData: null, 
        chatHistory: [{ role: "system", content: 'Sen "Tuncer Zeka"sın. Geliştiricin: Ahmet Tuncer. Kullanıcıya "patron" de. Bir Iron Man zırh yapay zekası gibi davran. Çok kısa ve net konuş.' }] 
    }));
}

// JSON Okuma yardımcı fonksiyonu
const readData = () => {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return { faceData: null, chatHistory: [] };
    }
};

// JSON Yazma yardımcı fonksiyonu
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// ==========================================
// API UÇ NOKTALARI (ENDPOINTS)
// ==========================================

// 1. Yüz verisini getir
app.get('/api/face', (req, res) => {
    const data = readData();
    res.json({ faceData: data.faceData });
});

// 2. Yüz verisini kaydet
app.post('/api/face', (req, res) => {
    const data = readData();
    data.faceData = req.body.faceData;
    writeData(data);
    console.log("Yeni biyometrik yüz verisi sunucuya kaydedildi.");
    res.json({ success: true, message: "Yüz verisi kaydedildi." });
});

// 3. Sohbet geçmişini getir
app.get('/api/chat', (req, res) => {
    const data = readData();
    res.json({ chatHistory: data.chatHistory });
});

// 4. Yeni mesajı sohbet geçmişine ekle
app.post('/api/chat', (req, res) => {
    const data = readData();
    if (req.body.message) {
        data.chatHistory.push(req.body.message);
        writeData(data);
    }
    res.json({ success: true });
});

// Sunucuyu Başlat
app.listen(PORT, () => {
    console.log(`Tuncer OS Sunucusu ${PORT} portunda çalışıyor...`);
});