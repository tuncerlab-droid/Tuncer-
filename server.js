const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// CORS Ayarları - Github Pages üzerinden erişim için şart
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.status(200).end();
    next();
});

// Statik dosyaları 'public' klasöründen sun
app.use(express.static(path.join(__dirname, 'public')));

// --- VERİ TABANI ---
let products = [
    { id: 1, name: "Mark-V Taktik Zırh", category: "savunma", price: 12500, stock: 10, image: "https://images.unsplash.com/photo-1590483736622-39da8af75bba?w=400" },
    { id: 2, name: "EM-4 Pulse Tüfeği", category: "savunma", price: 8900, stock: 5, image: "https://images.unsplash.com/photo-1595231712325-9fdec00518f2?w=400" },
    { id: 6, name: "Vader Legacy Kılıç", category: "starwars", price: 4500, stock: 12, image: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=400" },
    { id: 7, name: "Boba Fett Kaskı", category: "starwars", price: 3200, stock: 7, image: "https://images.unsplash.com/photo-1546561892-65bf811416b9?w=400" },
    { id: 11, name: "Holoprojector V2", category: "teknoloji", price: 4200, stock: 10, image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400" }
];
let orders = [];

// --- API ENDPOINTS ---
app.get('/api/products', (req, res) => res.json(products));

app.post('/api/orders', (req, res) => {
    const newOrder = {
        id: "TL-" + Math.floor(Math.random() * 900000 + 100000), 
        ...req.body, status: "Hazırlanıyor", date: new Date().toLocaleString('tr-TR')
    };
    newOrder.items.forEach(item => {
        const p = products.find(x => x.id === item.id);
        if (p && p.stock > 0) p.stock -= 1;
    });
    orders.push(newOrder);
    res.json({ success: true, orderId: newOrder.id });
});

app.get('/api/orders/track/:email', (req, res) => {
    res.json(orders.filter(o => o.email.toLowerCase() === req.params.email.toLowerCase()));
});

app.get('/api/admin/orders', (req, res) => res.json(orders));

app.put('/api/admin/orders/:id/status', (req, res) => {
    const o = orders.find(x => x.id == req.params.id);
    if (o) { o.status = req.body.status; res.json({ success: true }); }
    else res.status(404).json({ error: "Hata" });
});

app.put('/api/products/:id/stock', (req, res) => {
    const p = products.find(x => x.id == req.params.id);
    if (p) { p.stock = parseInt(req.body.stock); res.json({ success: true }); }
    else res.status(404).json({ error: "Hata" });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// --- RENDER PORT AYARI ---
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Sunucu aktif: Port ${port}`);
});