const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// CORS Ayarları
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.status(200).end();
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// --- VERİ TABANI ---
let products = [
    { id: 1, name: "hidrojen repulsor set", category: "savunma", price: 12500, stock: 10, image: "https://images.unsplash.com/photo-1590483736622-39da" },
    { id: 2, name: "tuncer ateş atar", category: "savunma", price: 700, stock: 5, image:" },
    { id: 6, name: "Vader ışın Kılıç", category: "starwars", price: 4500, stock: 12, image: "" },
    { id: 7, name: "flash pamuğu(nitroseliloz)", category: "savunma", price: 260, stock: 7, image: "https://ibb.co/mFDWP4mX" },
    { id: 11, name: "tuncer zeka pro", category: "teknoloji", price: 4200, stock: 10, image:" },
    { id: 12, name: "anakin skywalker ışın kılıcı", category: "teknoloji", price: 4500, stock: 0, image:"https://ibb.co/M5RkzMGf" }
];

let orders = [];

// Tanımlı İndirim Kodları (Admin buradan kod ekleyebilir/değiştirebilir)
const discountCodes = {
    "TUNCER10": 0.10, // %10 indirim
    "EFSANE20": 0.20  // %20 indirim
};

// --- API ENDPOINTS ---

app.get('/api/products', (req, res) => res.json(products));

// İndirim Kodu Kontrol API
app.get('/api/discount/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    if (discountCodes[code]) {
        res.json({ success: true, rate: discountCodes[code] });
    } else {
        res.json({ success: false });
    }
});

app.post('/api/orders', (req, res) => {
    const newOrder = {
        id: "TL-" + Math.floor(Math.random() * 900000 + 100000), 
        ...req.body, 
        status: "Hazırlanıyor", 
        date: new Date().toLocaleString('tr-TR')
    };
    
    // Stok düşürme işlemi (Artık sepetteki "adet" (qty) baz alınarak düşüyor)
    newOrder.items.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product && product.stock >= cartItem.qty) product.stock -= cartItem.qty;
    });
    
    orders.push(newOrder);
    res.json({ success: true, orderId: newOrder.id });
});

app.get('/api/orders/track/:email', (req, res) => {
    res.json(orders.filter(o => o.email.toLowerCase() === req.params.email.toLowerCase()));
});

app.get('/api/admin/orders', (req, res) => res.json(orders));

app.put('/api/admin/orders/:id/status', (req, res) => {
    const order = orders.find(o => o.id == req.params.id);
    if (order) { 
        order.status = req.body.status; res.json({ success: true }); 
    } else res.status(404).json({ error: "Sipariş bulunamadı" });
});

app.put('/api/products/:id/stock', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (product) { 
        product.stock = parseInt(req.body.stock); res.json({ success: true }); 
    } else res.status(404).json({ error: "Ürün bulunamadı" });
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log(`Sunucu ${port} portunda aktif.`);
});