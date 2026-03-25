const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Render için kritik: CORS ve JSON limitleri
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Dosyaları sunucu üzerinden servis et (Render'da hata almamak için)
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 10000; // Render genellikle 10000 kullanır
const DATA_FILE = path.join(__dirname, 'data.json');

// --- VERİTABANI BAŞLATMA ---
const initData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        const starter = { 
            faceData: null, 
            chatHistory: [{ role: "system", content: 'Sen "Tuncer Zeka"sın. Patronun: Ahmet Tuncer.' }] 
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(starter));
    }
};
initData();

const getData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const saveData = (d) => fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));

// --- API YOLLARI ---
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/face', (req, res) => res.json(getData()));
app.post('/api/face', (req, res) => {
    const d = getData();
    d.faceData = req.body.faceData;
    saveData(d);
    res.json({ success: true });
});

app.get('/api/chat', (req, res) => res.json(getData()));
app.post('/api/chat', (req, res) => {
    const d = getData();
    if (req.body.message) {
        d.chatHistory.push(req.body.message);
        if(d.chatHistory.length > 30) d.chatHistory.shift();
        saveData(d);
    }
    res.json({ success: true });
});

// Ana sayfa isteği gelirse index.html gönder
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// KRİTİK: '0.0.0.0' eklemezsen Render sunucuyu "offline" görür
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda başarıyla ayağa kalktı.`);
});