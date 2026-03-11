const express = require('express');
const path = require('path');
const app = express();

// Gelen JSON verile<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TuncerLab Shop</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Poppins:wght@300;400;600&display=swap');
        body { font-family: 'Poppins', sans-serif; background-color: #0a0f16; color: white; min-height: 100vh; }
        .glass { background: rgba(20, 25, 35, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(0, 229, 255, 0.1); border-radius: 20px; }
        .view-section { display: none; opacity: 0; }
        .view-section.active { display: block; opacity: 1; animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        #toast { position: fixed; bottom: -100px; left: 50%; transform: translateX(-50%); transition: bottom 0.4s; z-index: 100; }
        #toast.show { bottom: 20px; }
        
        /* Kategori Butonları Scroll Bar Gizleme */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="p-2 sm:p-4">

    <!-- Bildirim Balonu -->
    <div id="toast" class="glass px-6 py-3 font-bold shadow-2xl text-center w-11/12 max-w-sm"></div>

    <!-- Üst Menü -->
    <nav class="glass max-w-6xl mx-auto p-4 flex flex-col sm:flex-row justify-between items-center mb-6 sticky top-2 z-50 gap-4">
        <h1 class="font-bold text-2xl tracking-tighter cursor-pointer text-white" style="font-family:'Orbitron'" onclick="switchView('shop')">TUNCER<span class="text-cyan-400">LAB.</span></h1>
        <div class="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold">
            <button onclick="switchView('shop')" class="hover:text-cyan-400 transition">MAĞAZA</button>
            <button onclick="switchView('track')" class="hover:text-cyan-400 transition">TAKİP</button>
            <button onclick="switchView('cart')" class="text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 transition">
                SEPET (<span id="cart-count">0</span>)
            </button>
            <button onclick="openAdmin()" class="text-red-500 hover:text-red-400 transition">ADMİN</button>
        </div>
    </nav>

    <main class="max-w-6xl mx-auto pb-20">
        
        <!-- MAĞAZA EKRANI -->
        <section id="view-shop" class="view-section active">
            <!-- Kategoriler -->
            <div class="flex gap-3 mb-6 overflow-x-auto pb-2 border-b border-white/10 no-scrollbar" id="category-filters">
                <button onclick="filterCategory('all', this)" class="cat-btn px-5 py-2 rounded-xl border border-cyan-500 text-cyan-400 bg-cyan-500/10 font-bold whitespace-nowrap transition">Tümü</button>
                <button onclick="filterCategory('savunma', this)" class="cat-btn px-5 py-2 rounded-xl border border-white/20 text-gray-300 hover:border-cyan-500 whitespace-nowrap transition">Savunma</button>
                <button onclick="filterCategory('starwars', this)" class="cat-btn px-5 py-2 rounded-xl border border-white/20 text-gray-300 hover:border-cyan-500 whitespace-nowrap transition">Star Wars</button>
                <button onclick="filterCategory('teknoloji', this)" class="cat-btn px-5 py-2 rounded-xl border border-white/20 text-gray-300 hover:border-cyan-500 whitespace-nowrap transition">Teknoloji</button>
            </div>

            <!-- Ürün Listesi -->
            <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Ürünler JS ile buraya gelecek -->
            </div>
        </section>

        <!-- TAKİP EKRANI -->
        <section id="view-track" class="view-section">
            <div class="glass p-8 max-w-lg mx-auto text-center">
                <h2 class="text-2xl font-bold mb-2">Sipariş Takibi</h2>
                <p class="text-sm text-gray-400 mb-6">Sipariş verirken kullandığınız e-posta adresini girin.</p>
                <input type="email" id="track-email" placeholder="ornek@gmail.com" class="w-full bg-black/50 border border-white/10 rounded-xl p-4 mb-4 outline-none focus:border-cyan-400 transition">
                <button onclick="trackOrder()" class="w-full bg-cyan-500 text-black font-bold py-3 rounded-xl hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(0,229,255,0.3)]">SORGULA</button>
                <div id="track-results" class="mt-6 space-y-4 text-left"></div>
            </div>
        </section>

        <!-- SEPET EKRANI -->
        <section id="view-cart" class="view-section">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-4">
                    <h2 class="text-xl font-bold mb-4 border-b border-white/10 pb-2">Sepetinizdeki Ürünler</h2>
                    <div id="cart-list" class="space-y-4"></div>
                </div>
                
                <div class="glass p-6 h-fit sticky top-24">
                    <h2 class="text-xl font-bold mb-4 text-cyan-400 border-b border-white/10 pb-2">Siparişi Tamamla</h2>
                    <form onsubmit="submitOrder(event)" class="space-y-4">
                        <input type="text" id="c-name" placeholder="Ad Soyad" required class="w-full bg-black/40 border border-white/10 p-3 rounded-xl outline-none focus:border-cyan-400 transition">
                        <input type="email" id="c-email" placeholder="E-Posta Adresi" required class="w-full bg-black/40 border border-white/10 p-3 rounded-xl outline-none focus:border-cyan-400 transition">
                        <textarea id="c-addr" placeholder="Teslimat Adresi" rows="3" required class="w-full bg-black/40 border border-white/10 p-3 rounded-xl outline-none focus:border-cyan-400 transition"></textarea>
                        
                        <div class="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-center font-bold text-cyan-400 text-lg">
                            Toplam: <span id="cart-total">0 TL</span>
                        </div>
                        
                        <button type="submit" class="w-full bg-cyan-500 text-black font-bold py-4 rounded-xl mt-2 hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                            SİPARİŞİ ONAYLA
                        </button>
                    </form>
                </div>
            </div>
        </section>

        <!-- ADMİN EKRANI -->
        <section id="view-admin" class="view-section">
            <div class="glass p-6 overflow-x-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-red-500">Yönetim Paneli</h2>
                    <button onclick="fetchProductsAdmin()" class="bg-white/10 px-3 py-1 rounded text-sm hover:bg-white/20">Stokları Gör</button>
                </div>
                
                <h3 class="font-bold text-lg mb-2 border-b border-white/10 pb-1">Son Siparişler</h3>
                <table class="w-full text-left mb-8 min-w-[600px]">
                    <thead>
                        <tr class="text-gray-400 text-xs border-b border-white/10">
                            <th class="pb-2 pt-2 pl-2">SİPARİŞ ID</th>
                            <th class="pb-2 pt-2">MÜŞTERİ</th>
                            <th class="pb-2 pt-2">TUTAR</th>
                            <th class="pb-2 pt-2">DURUM</th>
                            <th class="pb-2 pt-2">İŞLEM</th>
                        </tr>
                    </thead>
                    <tbody id="admin-order-list"></tbody>
                </table>

                <h3 class="font-bold text-lg mb-2 border-b border-white/10 pb-1">Stok Yönetimi</h3>
                <table class="w-full text-left min-w-[600px]">
                    <thead>
                        <tr class="text-gray-400 text-xs border-b border-white/10">
                            <th class="pb-2 pt-2 pl-2">ÜRÜN ID</th>
                            <th class="pb-2 pt-2">ÜRÜN ADI</th>
                            <th class="pb-2 pt-2">STOK</th>
                            <th class="pb-2 pt-2">İŞLEM</th>
                        </tr>
                    </thead>
                    <tbody id="admin-stock-list"></tbody>
                </table>
            </div>
        </section>
    </main>

    <script>
        // DİNAMİK URL: Render'da çalışması için sunucunun bulunduğu adresi otomatik alır
        const API_URL = window.location.origin + "/api";
        
        let allProducts = [];
        let currentCategory = 'all';
        let cart = [];

        // --- MAĞAZA FONKSİYONLARI ---

        async function fetchProducts() {
            try {
                showToast("Ürünler yükleniyor...", false);
                const res = await fetch(`${API_URL}/products`, { cache: "no-store" });
                if(!res.ok) throw new Error("Sunucu yanıt vermedi");
                
                allProducts = await res.json();
                renderProducts();
            } catch (e) {
                console.error(e);
                showToast("Sunucuya bağlanılamadı!", true);
            }
        }

        function filterCategory(category, btnElement) {
            currentCategory = category;
            
            // Buton stillerini güncelle
            document.querySelectorAll('.cat-btn').forEach(btn => {
                btn.className = "cat-btn px-5 py-2 rounded-xl border border-white/20 text-gray-300 hover:border-cyan-500 whitespace-nowrap transition";
            });
            btnElement.className = "cat-btn px-5 py-2 rounded-xl border border-cyan-500 text-cyan-400 bg-cyan-500/10 font-bold whitespace-nowrap transition";
            
            renderProducts();
        }

        function renderProducts() {
            const grid = document.getElementById('product-grid');
            
            const filtered = currentCategory === 'all' 
                ? allProducts 
                : allProducts.filter(p => p.category === currentCategory);

            grid.innerHTML = filtered.map(p => `
                <div class="glass p-4 flex flex-col group hover:border-cyan-500/50 transition duration-300 relative overflow-hidden">
                    ${p.stock <= 0 ? '<div class="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">TÜKENDİ</div>' : ''}
                    <img src="${p.image}" class="h-48 w-full object-cover rounded-lg mb-4 group-hover:scale-105 transition duration-500">
                    <h3 class="font-bold text-md leading-tight mb-1">${p.name}</h3>
                    <div class="flex justify-between items-center mt-auto">
                        <p class="text-cyan-400 font-bold text-lg">${p.price.toLocaleString('tr-TR')} TL</p>
                        <span class="text-xs text-gray-400">Stok: ${p.stock}</span>
                    </div>
                    <button 
                        onclick="addToCart(${p.id})" 
                        ${p.stock <= 0 ? 'disabled' : ''}
                        class="mt-4 ${p.stock <= 0 ? 'bg-gray-600 cursor-not-allowed' : 'bg-white/5 hover:bg-cyan-500 hover:text-black'} py-3 rounded-lg text-sm font-bold transition w-full">
                        ${p.stock <= 0 ? 'STOKTA YOK' : 'SEPETE EKLE'}
                    </button>
                </div>
            `).join('');
            
            if(filtered.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-400">Bu kategoride ürün bulunamadı.</div>';
            }
        }

        // --- SEPET FONKSİYONLARI ---

        function addToCart(id) {
            const product = allProducts.find(x => x.id === id);
            
            // Sepetteki aynı ürünlerin sayısını kontrol et
            const inCartCount = cart.filter(item => item.id === id).length;
            
            if (inCartCount >= product.stock) {
                return showToast("Mevcut stoktan fazlasını ekleyemezsiniz!", true);
            }

            cart.push(product);
            document.getElementById('cart-count').innerText = cart.length;
            showToast(`${product.name} sepete eklendi.`);
        }

        function renderCart() {
            const list = document.getElementById('cart-list');
            let total = 0;
            
            list.innerHTML = cart.map((item, i) => {
                total += item.price;
                return `
                <div class="glass p-4 flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <img src="${item.image}" class="w-12 h-12 object-cover rounded border border-white/10">
                        <div>
                            <div class="font-bold text-sm">${item.name}</div>
                            <div class="text-xs text-gray-400">Kategori: ${item.category}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <b class="text-cyan-400">${item.price.toLocaleString('tr-TR')} TL</b>
                        <button onclick="removeFromCart(${i})" class="text-red-500 hover:bg-red-500/20 p-2 rounded-full transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>`;
            }).join('');
            
            if(cart.length === 0) {
                list.innerHTML = `
                <div class="glass p-10 text-center flex flex-col items-center">
                    <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <div class="text-gray-400 font-bold">Sepetiniz şu an boş.</div>
                    <button onclick="switchView('shop')" class="mt-4 text-cyan-400 underline text-sm">Alışverişe Başla</button>
                </div>`;
            }
            
            document.getElementById('cart-total').innerText = total.toLocaleString('tr-TR') + " TL";
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            document.getElementById('cart-count').innerText = cart.length;
            renderCart();
        }

        async function submitOrder(e) {
            e.preventDefault();
            if(cart.length === 0) return showToast("Sepetiniz boş!", true);
            
            const btn = e.target.querySelector('button[type="submit"]');
            btn.innerText = "İşleniyor...";
            btn.disabled = true;

            const data = {
                name: document.getElementById('c-name').value,
                email: document.getElementById('c-email').value,
                address: document.getElementById('c-addr').value,
                items: cart,
                total: cart.reduce((s,i) => s + i.price, 0)
            };
            
            try {
                const res = await fetch(`${API_URL}/orders`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                
                const result = await res.json();
                
                if(result.success) {
                    showToast("Sipariş alındı! Kod: " + result.orderId);
                    cart = [];
                    document.getElementById('cart-count').innerText = "0";
                    e.target.reset();
                    document.getElementById('track-email').value = data.email;
                    
                    // Stokların güncel halini arka planda çek
                    fetchProducts(); 
                    
                    setTimeout(() => {
                        switchView('track');
                        trackOrder(); // Otomatik sorgula
                    }, 1000);
                }
            } catch (err) {
                showToast("Sipariş oluşturulurken hata oluştu!", true);
            } finally {
                btn.innerText = "SİPARİŞİ ONAYLA";
                btn.disabled = false;
            }
        }

        // --- TAKİP FONKSİYONLARI ---

        async function trackOrder() {
            const email = document.getElementById('track-email').value;
            if(!email) return showToast("Lütfen e-posta girin", true);

            const resDiv = document.getElementById('track-results');
            resDiv.innerHTML = '<div class="text-center text-cyan-400">Sorgulanıyor...</div>';

            try {
                const res = await fetch(`${API_URL}/orders/track/${email}`);
                const data = await res.json();
                
                if(data.length === 0) {
                    resDiv.innerHTML = '<div class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400">Bu e-posta adresine ait sipariş bulunamadı.</div>';
                } else {
                    resDiv.innerHTML = data.map(o => `
                        <div class="glass p-5 border-l-4 ${o.status === 'Teslim Edildi' ? 'border-green-500' : 'border-cyan-500'}">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <div class="text-[10px] text-gray-500 font-mono">Sipariş No: ${o.id}</div>
                                    <div class="text-xs text-gray-400">${o.date}</div>
                                </div>
                                <div class="font-bold text-lg ${o.status === 'Teslim Edildi' ? 'text-green-400' : 'text-cyan-400'}">${o.status}</div>
                            </div>
                            <div class="text-sm mt-3 border-t border-white/5 pt-3">
                                <span class="text-gray-400">Toplam Tutar:</span> 
                                <span class="font-bold ml-2">${o.total.toLocaleString('tr-TR')} TL</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">${o.items.length} ürün</div>
                        </div>
                    `).join('');
                }
            } catch(e) {
                resDiv.innerHTML = '<div class="text-red-400">Bağlantı hatası!</div>';
            }
        }

        // --- ADMİN FONKSİYONLARI ---

        function openAdmin() {
            const p = prompt("Admin Şifresi (İpucu: 175017):");
            if(p === "175017") {
                switchView('admin');
            } else if (p !== null) {
                showToast("Hatalı şifre!", true);
            }
        }

        async function loadAdminOrders() {
            try {
                const res = await fetch(`${API_URL}/admin/orders`);
                const data = await res.json();
                
                document.getElementById('admin-order-list').innerHTML = data.reverse().map(o => `
                    <tr class="border-b border-white/5 text-sm hover:bg-white/5 transition">
                        <td class="py-3 pl-2 font-mono text-xs text-gray-400">${o.id}</td>
                        <td>
                            <div>${o.name}</div>
                            <div class="text-[10px] text-gray-500">${o.email}</div>
                        </td>
                        <td class="font-bold">${o.total.toLocaleString('tr-TR')} ₺</td>
                        <td class="${o.status === 'Teslim Edildi' ? 'text-green-400' : 'text-cyan-400'} font-bold">${o.status}</td>
                        <td>
                            <select onchange="updateStatus('${o.id}', this.value)" class="bg-black/50 border border-white/10 rounded p-1 text-xs outline-none">
                                <option value="" disabled selected>Değiştir</option>
                                <option value="Hazırlanıyor">Hazırlanıyor</option>
                                <option value="Kargoya Verildi">Kargoya Verildi</option>
                                <option value="Teslim Edildi">Teslim Edildi</option>
                                <option value="İptal Edildi">İptal Edildi</option>
                            </select>
                        </td>
                    </tr>
                `).join('');
            } catch (e) {
                console.error("Admin verileri çekilemedi");
            }
        }

        async function fetchProductsAdmin() {
            try {
                const res = await fetch(`${API_URL}/products`);
                const data = await res.json();
                
                document.getElementById('admin-stock-list').innerHTML = data.map(p => `
                    <tr class="border-b border-white/5 text-sm hover:bg-white/5 transition">
                        <td class="py-2 pl-2 text-gray-400">#${p.id}</td>
                        <td>${p.name}</td>
                        <td class="font-bold ${p.stock <= 2 ? 'text-red-500' : 'text-green-400'}">${p.stock} Adet</td>
                        <td>
                            <button onclick="updateStock(${p.id}, ${p.stock})" class="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-xs hover:bg-cyan-500 hover:text-black transition">Stok Güncelle</button>
                        </td>
                    </tr>
                `).join('');
            } catch(e) {
                showToast("Stoklar yüklenemedi!", true);
            }
        }

        async function updateStatus(id, newStatus) {
            if(!newStatus) return;
            try {
                await fetch(`${API_URL}/admin/orders/${id}/status`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({status: newStatus})
                });
                showToast("Durum güncellendi!");
                loadAdminOrders();
            } catch(e) {
                showToast("Hata oluştu", true);
            }
        }

        async function updateStock(id, currentStock) {
            const newStock = prompt(`Yeni stok miktarını girin (Mevcut: ${currentStock}):`, currentStock);
            if(newStock === null || isNaN(newStock)) return;
            
            try {
                await fetch(`${API_URL}/products/${id}/stock`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({stock: parseInt(newStock)})
                });
                showToast("Stok güncellendi!");
                fetchProductsAdmin();
                fetchProducts(); // Mağazayı da güncelle
            } catch(e) {
                showToast("Hata oluştu", true);
            }
        }

        // --- YARDIMCI FONKSİYONLAR ---

        function switchView(view) {
            document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
            document.getElementById('view-' + view).classList.add('active');
            
            if(view === 'cart') renderCart();
            if(view === 'admin') {
                loadAdminOrders();
                fetchProductsAdmin();
            }
            
            // Ekranın en üstüne kaydır
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function showToast(msg, isErr = false) {
            const t = document.getElementById('toast');
            t.innerText = msg;
            t.style.background = isErr ? "#ef4444" : "#00e5ff"; // Kırmızı veya Cam Göbeği
            t.style.color = isErr ? "white" : "black";
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 3000);
        }

        // Başlangıç
        window.onload = fetchProducts;
    </script>
</body>
</html>


rini okumak için
app.use(express.json());

// CORS - Siten Github Pages'de, Sunucu Render'da olduğu için bu izinler ŞART. 
// (Ekstra npm paketi gerektirmemesi için manuel eklendi, çökme yapmaz)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

// Statik dosyaları sun (index.html 'public' klasörü içinde olmalı)
app.use(express.static(path.join(__dirname, 'public')));

// --- VERİ TABANI ---
let products = [
    { id: 1, name: "Mark-V Taktik Zırh", category: "savunma", price: 12500, stock: 10, image: "https://images.unsplash.com/photo-1590483736622-39da8af75bba?w=400" },
    { id: 2, name: "EM-4 Pulse Tüfeği", category: "savunma", price: 8900, stock: 5, image: "https://images.unsplash.com/photo-1595231712325-9fdec00518f2?w=400" },
    { id: 3, name: "Balistik Kask V3", category: "savunma", price: 3200, stock: 15, image: "https://images.unsplash.com/photo-1584386161274-91d1fcb00801?w=400" },
    { id: 4, name: "Taktik Gece Görüş", category: "savunma", price: 15600, stock: 3, image: "https://images.unsplash.com/photo-1579227114347-15d08fc37cae?w=400" },
    { id: 5, name: "Sinyal Kesici Jammer", category: "savunma", price: 7800, stock: 8, image: "https://images.unsplash.com/photo-1558494949-ef010ccdcc32?w=400" },
    { id: 6, name: "Vader Legacy Kılıç", category: "starwars", price: 4500, stock: 12, image: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=400" },
    { id: 7, name: "Boba Fett Kaskı", category: "starwars", price: 3200, stock: 7, image: "https://images.unsplash.com/photo-1546561892-65bf811416b9?w=400" },
    { id: 8, name: "Thermal Detonator", category: "starwars", price: 1200, stock: 25, image: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400" },
    { id: 9, name: "Kylo Ren Kaskı", category: "starwars", price: 3800, stock: 4, image: "https://images.unsplash.com/photo-1585676232082-972ed309f05f?w=400" },
    { id: 10, name: "Stormtrooper Zırhı", category: "starwars", price: 9500, stock: 2, image: "https://images.unsplash.com/photo-1585123334904-845d60e97b29?w=400" },
    { id: 11, name: "Holoprojector V2", category: "teknoloji", price: 4200, stock: 10, image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400" },
    { id: 12, name: "Siber Güvenlik Modülü", category: "teknoloji", price: 7300, stock: 6, image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400" }
];

let orders = [];

// --- API ENDPOINTS ---
app.get('/api/products', (req, res) => res.json(products));

app.post('/api/orders', (req, res) => {
    const newOrder = {
        id: "TL-" + Math.floor(Math.random() * 900000 + 100000), 
        ...req.body, status: "Hazırlanıyor", date: new Date().toLocaleString('tr-TR')
    };
    newOrder.items.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product && product.stock > 0) product.stock -= 1;
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
    if (order) { order.status = req.body.status; res.json({ success: true }); } 
    else { res.status(404).json({ error: "Sipariş bulunamadı" }); }
});

app.put('/api/products/:id/stock', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (product) { product.stock = parseInt(req.body.stock); res.json({ success: true }); } 
    else { res.status(404).json({ error: "Ürün bulunamadı" }); }
});

// GÖNDERDİĞİN FOTOĞRAFTAKİ PORT YAPISI BİREBİR AYNISI
const port = process.env.PORT || 10000;

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
}); 