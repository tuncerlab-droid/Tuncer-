const express = require('express');
const path = require('path');
const cors = require('cors'); // CORS güvenliği için eklendi
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Render için statik dosya sunumu (Klasör yapısı kontrolü)
// Projenin ana dizininde 'public' klasörü olmalı
app.use(express.static(path.join(__dirname, 'public')));

// --- VERİ TABANI ---
let products = [
    { id: 1, name: "tuncer fire shoter", category: "savunma", price: 12500, stock: 10, image: "https://images.unsplash.com/photo-1590483736622-39da8af75bba?w=400" },
    { id: 2, name: "EM-4 Pulse Tüfeği", category: "savunma", price: 8900, stock: 5, image: "https://images.unsplash.com/photo-1595231712325-9fdec00518f2?w=400" },
    { id: 3, name: "Balistik Kask V3", category: "savunma", price: 3200, stock: 15, image: "https://images.unsplash.com/photo-1584386161274-91d1fcb00801?w=400" },
    { id: 4, name: "Taktik Gece Görüş", category: "savunma", price: 15600, stock: 3, image: "https://images.unsplash.com/photo-1579227114347-15d08fc37cae?w=400" },
    { id: 5, name: "Sinyal Kesici Jammer", category: "savunma", price: 7800, stock: 8, image: "https://images.unsplash.com/photo-1558494949-ef010ccdcc32?w=400" },
    { id: 6, name: "Vader Legacy Kılıç", category: "starwars", price: 4500, stock: 12, image: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=400" },
    { id: 7, name: "Boba Fett Kaskı", category: "starwars", price: 3200, stock: 7, image: "https://images.unsplash.com/photo-1546561892-65bf811416b9?w=400" },
    { id: 11, name: "Holoprojector V2", category: "teknoloji", price: 4200, stock: 10, image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400" }
];

let orders = [];

// API Endpoints
app.get('/api/products', (req, res) => res.json(products));

app.post('/api/orders', (req, res) => {
    const newOrder = {
        id: "TL-" + Math.floor(Math.random() * 900000 + 100000),
        ...req.body,
        status: "Hazırlanıyor",
        date: new Date().toLocaleString('tr-TR')
    };
    newOrder.items.forEach(item => {
        const p = products.find(x => x.id === item.id);
        if (p && p.stock > 0) p.stock -= 1;
    });
    orders.push(newOrder);
    res.json({ success: true, orderId: newOrder.id });
});

app.get('/api/orders/track/:email', (req, res) => {
    const userOrders = orders.filter(o => o.email.toLowerCase() === req.params.email.toLowerCase());
    res.json(userOrders);
});

// Admin API
app.get('/api/admin/orders', (req, res) => res.json(orders));
app.put('/api/admin/orders/:id/status', (req, res) => {
    const o = orders.find(x => x.id == req.params.id);
    if (o) { o.status = req.body.status; res.json({ success: true }); }
    else res.status(404).json({ error: "Not found" });
});

// SPA Fallback (Tüm yolları index.html'e yönlendir)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// RENDER PORT AYARI: 0.0.0.0 dinlemesi Render için kritiktir
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sunucu aktif: Port ${PORT}`);
}); 