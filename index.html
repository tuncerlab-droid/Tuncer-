<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Tuncer Zeka v2.0</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Framer Motion benzeri basit CSS animasyonları -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap');
        
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #0b0f1a;
            color: #e2e8f0;
            margin: 0;
            overflow: hidden;
        }

        .chat-container {
            height: calc(100vh - 160px);
            scrollbar-width: thin;
            scrollbar-color: #1e293b transparent;
        }

        .chat-container::-webkit-scrollbar {
            width: 5px;
        }

        .chat-container::-webkit-scrollbar-thumb {
            background: #1e293b;
            border-radius: 10px;
        }

        .message-entry {
            animation: slideUp 0.3s ease-out forwards;
            opacity: 0;
            transform: translateY(10px);
        }

        @keyframes slideUp {
            to { opacity: 1; transform: translateY(0); }
        }

        .glass {
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sidebar-transition {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Mobil buton dokunmatik alanı */
        .btn-touch {
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>
<body class="flex">

    <!-- SIDEBAR -->
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-50 w-72 glass sidebar-transition -translate-x-full lg:translate-x-0 flex flex-col shadow-2xl">
        <!-- Yeni Sohbet Butonu -->
        <div class="p-4">
            <button onclick="window.location.reload()" class="w-full btn-touch bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 gap-2">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                Yeni Sohbet
            </button>
        </div>

        <!-- Sohbetler Listesi -->
        <div class="flex-1 overflow-y-auto px-3 space-y-1">
            <div class="text-[11px] uppercase tracking-wider text-gray-500 font-bold px-3 py-4">Sohbet Geçmişi</div>
            <div class="group flex items-center justify-between p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-sm cursor-pointer">
                <span class="truncate">Analiz Raporu #01</span>
                <svg class="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="5"></circle></svg>
            </div>
            <div class="flex items-center p-3 rounded-xl hover:bg-white/5 text-sm text-gray-400 cursor-pointer transition">
                <span class="truncate">Veri Madenciliği Testi</span>
            </div>
        </div>

        <!-- Hesap / Profil -->
        <div class="p-4 border-t border-white/5">
            <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition">
                <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                    T
                </div>
                <div class="flex-1">
                    <div class="text-sm font-semibold">Tuncer Hesabı</div>
                    <div class="text-[10px] text-emerald-400 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Çevrimiçi
                    </div>
                </div>
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
            </div>
        </div>
    </aside>

    <!-- ANA EKRAN -->
    <main class="flex-1 flex flex-col min-w-0 bg-[#0d121f]">
        
        <!-- Header -->
        <header class="h-16 flex items-center justify-between px-4 glass border-b-0 z-40">
            <button id="toggle-sidebar" class="lg:hidden p-2 text-gray-400 hover:text-white transition">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                <span class="font-bold tracking-tight text-white uppercase text-sm">Tuncer Zeka <span class="text-blue-500">v2</span></span>
            </div>
            <div id="lib-indicator" class="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                Kütüphane Çevrimdışı
            </div>
        </header>

        <!-- Sohbet Alanı -->
        <div id="chat-viewport" class="chat-container overflow-y-auto p-4 lg:p-8 space-y-6">
            <!-- Karşılama Mesajı -->
            <div class="message-entry flex gap-4 max-w-3xl mx-auto">
                <div class="w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-xs">AI</div>
                <div class="flex-1 space-y-2">
                    <div class="text-sm font-bold text-blue-400">Tuncer Zeka</div>
                    <div class="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                        Sana nasıl yardımcı olabilirim? Kütüphane tarama sistemi aktif, tüm modüller hazırlandı.
                    </div>
                </div>
            </div>
        </div>

        <!-- Giriş Alanı -->
        <footer class="p-4 lg:p-6">
            <div class="max-w-3xl mx-auto relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
                <div class="relative flex items-center bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
                    <input type="text" id="chat-input" placeholder="Bir şeyler yaz..." 
                        class="flex-1 bg-transparent p-4 lg:p-5 text-sm focus:outline-none text-white placeholder-gray-500">
                    <button id="btn-send" class="p-3 mr-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                    </button>
                </div>
                <div class="text-[10px] text-center mt-3 text-gray-600 font-medium">Güçlü algoritmalar ile Tuncer Zeka tarafından desteklenmektedir.</div>
            </div>
        </footer>
    </main>

    <!-- Overlay (Mobil için) -->
    <div id="overlay" class="fixed inset-0 bg-black/60 z-40 hidden lg:hidden"></div>

    <script>
        const input = document.getElementById('chat-input');
        const btnSend = document.getElementById('btn-send');
        const viewport = document.getElementById('chat-viewport');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const toggleBtn = document.getElementById('toggle-sidebar');
        const libIndicator = document.getElementById('lib-indicator');

        // 1. UI Fonksiyonları
        function toggleMenu() {
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        }

        toggleBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        function appendMessage(role, text) {
            const isAI = role === 'ai';
            const div = document.createElement('div');
            div.className = `message-entry flex gap-4 max-w-3xl mx-auto ${isAI ? '' : 'flex-row-reverse'}`;
            
            div.innerHTML = `
                <div class="w-8 h-8 rounded-lg ${isAI ? 'bg-blue-600' : 'bg-gray-700'} flex-shrink-0 flex items-center justify-center font-bold text-xs">
                    ${isAI ? 'AI' : 'SEN'}
                </div>
                <div class="flex-1 space-y-2 ${isAI ? '' : 'text-right'}">
                    <div class="text-sm font-bold ${isAI ? 'text-blue-400' : 'text-gray-400'}">${isAI ? 'Tuncer Zeka' : 'Sen'}</div>
                    <div class="text-gray-300 inline-block leading-relaxed bg-white/5 p-4 rounded-2xl ${isAI ? 'rounded-tl-none' : 'rounded-tr-none'} border border-white/5">
                        ${text}
                    </div>
                </div>
            `;
            
            viewport.appendChild(div);
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }

        // 2. Cevap Verme Mantığı (Kütüphane Bağlantısı Burası)
        async function handleChat() {
            const query = input.value.trim();
            if (!query) return;

            // Kullanıcı mesajını ekle
            appendMessage('user', query);
            input.value = '';

            // AI "Yazıyor..." efekti
            const typingId = "typing-" + Date.now();
            const typingDiv = document.createElement('div');
            typingDiv.id = typingId;
            typingDiv.className = "message-entry flex gap-4 max-w-3xl mx-auto";
            typingDiv.innerHTML = `
                <div class="w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-xs">AI</div>
                <div class="flex-1 bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 text-gray-500 italic text-sm animate-pulse">
                    Düşünüyor...
                </div>
            `;
            viewport.appendChild(typingDiv);
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });

            // Simüle edilmiş gecikme (Gerçek AI hissi için)
            setTimeout(() => {
                document.getElementById(typingId).remove();
                
                let response = "Anladım. Bu konuda Tuncer Zeka algoritmalarıyla çalışıyorum.";
                
                // Eğer tuncer-zeka.js yüklendiyse ve içinde cevap üreten bir yapı varsa:
                if (window.TuncerZeka && typeof window.TuncerZeka.generate === 'function') {
                    response = window.TuncerZeka.generate(query);
                } else if (query.toLowerCase().includes("merhaba")) {
                    response = "Merhaba! Sana nasıl yardımcı olabilirim?";
                } else if (query.toLowerCase().includes("hesap")) {
                    response = "Hesap ayarların Pro Plan olarak güncellendi.";
                }

                appendMessage('ai', response);
            }, 800);
        }

        // 3. Olay Dinleyicileri (Event Listeners)
        btnSend.addEventListener('click', handleChat);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChat();
        });

        // 4. Kütüphane Tarama Sistemi (tuncer-zeka.js Kontrolü)
        function checkLibrary() {
            const script = document.createElement('script');
            script.src = 'tuncer-zeka.js';
            script.async = true;

            script.onload = () => {
                libIndicator.innerText = "Kütüphane Aktif";
                libIndicator.className = "text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                console.log("Tuncer Zeka Kütüphanesi Başarıyla Tarandı.");
            };

            script.onerror = () => {
                libIndicator.innerText = "Kütüphane Taranamadı";
                console.error("tuncer-zeka.js dosyası bulunamadı. Lütfen dosya adını ve yolunu kontrol edin.");
            };

            document.body.appendChild(script);
        }

        // Sayfa hazır olduğunda kütüphaneyi tara
        window.addEventListener('load', checkLibrary);

    </script>
</body>
</html>

