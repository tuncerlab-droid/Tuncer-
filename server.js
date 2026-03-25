const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Render ve diğer dış servisler için CORS ayarlarını genişlettik
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// --- VERİ DOSYASI KONTROLÜ ---
const initializeData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = { 
            faceData: null, 
            chatHistory: [{ role: "system", content: 'Sen "Tuncer Zeka"sın. Geliştiricin: Ahmet Tuncer. Kullanıcıya "patron" de. Iron Man zırh yapay zekası gibi davran.' }] 
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
};

initializeData();

const readData = () => {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error("Dosya okuma hatası:", e);
        return { faceData: null, chatHistory: [] };
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("Dosya yazma hatası:", e);
    }
};

// API Endpoints
app.get('/', (req, res) => res.send("Tuncer OS Online.")); // Sunucunun açık olduğunu anlamak için

app.get('/api/face', (req, res) => {
    res.json(readData());
});

app.post('/api/face', (req, res) => {
    const data = readData();
    data.faceData = req.body.faceData;
    writeData(data);
    res.json({ success: true });
});

app.get('/api/chat', (req, res) => {
    res.json(readData());
});

app.post('/api/chat', (req, res) => {
    const data = readData();
    if (req.body.message) {
        data.chatHistory.push(req.body.message);
        // Geçmiş çok şişmesin diye son 50 mesajı tutalım (opsiyonel)
        if(data.chatHistory.length > 50) data.chatHistory.shift(); 
        writeData(data);
    }
    res.json({ success: true });
});

// Hata yakalayıcı (Sunucunun çökmesini engeller)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Sunucu tarafında bir hata oluştu!');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu aktif: Port ${PORT}`);
});