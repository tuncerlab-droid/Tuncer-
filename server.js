const express = require('express');
const path = require('path');
const app = express();

// Gelen JSON verilerini okuyabilmek için
app.use(express.json());

// Frontend (HTML/CSS/JS) dosyalarını 'public' klasöründen sunuyoruz
app.use(express.static(path.join(__dirname, 'public')));

// --- VERİ TABANI (Geçici RAM Bellek) ---
let products = [
    // Savunma (5 Ürün)
    { id: 1, name: "Mark-V Taktik Zırh", category: "savunma", price: 12500, stock: 10, image: "https://images.unsplash.com/photo-1590483736622-39da8af75bba?w=400" },
    { id: 2, name: "EM-4 Pulse Tüfeği", category: "savunma", price: 8900, stock: 5, image: "https://images.unsplash.com/photo-1595231712325-9fdec00518f2?w=400" },
    { id: 3, name: "Balistik Kask V3", category: "savunma", price: 3200, stock: 15, image: "https://images.unsplash.com/photo-1584386161274-91d1fcb00801?w=400" },
    { id: 4, name: "Taktik Gece Görüş", category: "savunma", price: 15600, stock: 3, image: "https://images.unsplash.com/photo-1579227114347-15d08fc37cae?w=400" },
    { id: 5, name: "Sinyal Kesici Jammer", category: "savunma", price: 7800, stock: 8, image: "https://images.unsplash.com/photo-1558494949-ef010ccdcc32?w=400" },
    
    // Star Wars (5 Ürün)
    { id: 6, name: "Vader Legacy Kılıç", category: "starwars", price: 4500, stock: 12, image: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=400" },
    { id: 7, name: "Boba Fett Kaskı", category: "starwars", price: 3200, stock: 7, image: "https://images.unsplash.com/photo-1546561892-65bf811416b9?w=400" },
    { id: 8, name: "Thermal Detonator", category: "starwars", price: 1200, stock: 25, image: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400" },
    { id: 9, name: "Kylo Ren Kaskı", category: "starwars", price: 3800, stock: 4, image: "https://images.unsplash.com/photo-1585676232082-972ed309f05f?w=400" },
    { id: 10, name: "Stormtrooper Zırhı", category: "starwars", price: 9500, stock: 2, image: "https://images.unsplash.com/photo-1585123334904-845d60e97b29?w=400" },

    // Teknoloji (2 Ürün)
    { id: 11, name: "Holoprojector V2", category: "teknoloji", price: 4200, stock: 10, image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400" },
    { id: 12, name: "Siber Güvenlik Modülü", category: "teknoloji", price: 7300, stock: 6, image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400" }
];

let orders = [];

// --- API ENDPOINTS ---

// 1. Ürünleri Getir
app.get('/api/products', (req, res) => {
    res.json(products);
});

// 2. Sipariş Ver
app.post('/api/orders', (req, res) => {
    const newOrder = {
        id: "TL-" + Math.floor(Math.random() * 900000 + 100000), // TL-123456 formatında ID
        ...req.body,
        status: "Hazırlanıyor",
        date: new Date().toLocaleString('tr-TR')
    };
    
    // Stokları düşür
    newOrder.items.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product && product.stock > 0) {
            product.stock -= 1;
        }
    });

    orders.push(newOrder);
    res.json({ success: true, orderId: newOrder.id });
});

// 3. Sipariş Takibi (Gmail ile)
app.get('/api/orders/track/:email', (req, res) => {
    const userOrders = orders.filter(o => o.email.toLowerCase() === req.params.email.toLowerCase());
    res.json(userOrders);
});

// 4. Admin - Tüm Siparişleri Getir
app.get('/api/admin/orders', (req, res) => {
    res.json(orders);
});

// 5. Admin - Sipariş Durumu Güncelle
app.put('/api/admin/orders/:id/status', (req, res) => {
    const order = orders.find(o => o.id == req.params.id);
    if (order) {
        order.status = req.body.status;
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Sipariş bulunamadı" });
    }
});

// 6. Admin - Stok Güncelle
app.put('/api/products/:id/stock', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (product) {
        product.stock = parseInt(req.body.stock);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Ürün bulunamadı" });
    }
});

// Herhangi bir tanımlanmayan rotada ana sayfayı gönder (SPA desteği)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`TuncerLab Shop aktif: http://localhost:${PORT}`));