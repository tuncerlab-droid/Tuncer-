const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// CORS: Farklı sitelerden (Github Pages gibi) gelen isteklere izin verir
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.status(200).end();
    next();
});

// Statik Dosyalar (public klasörünü sunar)
app.use(express.static(path.join(__dirname, 'public')));

// --- VERİ TABANI ---
let products = [
    { id: 1, name: "tuncer ateş atar", category: "savunma", price: 700, stock: 10, image: "" },
    { id: 2, name: "flash pamuğu", category: "savunma", price: 250, stock: 5, image: "https://ibb.co/mFDWP4mX" },
    { id: 6, name: "tuncer zeka pro", category: "starwars", price: 4500, stock: 12, image: "https://ibb.co/4n0Q3fCF" },
    { id: 11, name: "ışın kılıcı analin skywalker", category: "teknoloji", price: 4200, stock: 10, image: "https://ibb.co/M5RkzMGf" }
];
let orders = [];

// --- API ---
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
    else res.status(404).json({ error: "Bulunamadı" });
});

app.put('/api/products/:id/stock', (req, res) => {
    const p = products.find(x => x.id == req.params.id);
    if (p) { p.stock = parseInt(req.body.stock); res.json({ success: true }); }
    else res.status(404).json({ error: "Ürün bulunamadı" });
});

// Port Ayarı (Render için Kritik!)
const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log(`Sunucu ${port} portunda aktif.`);
});