import numpy as np
import json
import random
import time
import os

# --- TUNCER NEURAL NETWORK CLASS ---
class TuncerNeuralNet:
    def __init__(self):
        # Basit bir Sinir Ağı Simülasyonu (Nöral Katmanlar)
        self.vocabulary = []
        self.intents = []
        self.weights = {}
        self.learning_rate = 0.1
        self.is_active = False

    def initialize_core(self):
        """Sistemi uyandırır ve veri tabanını yükler"""
        print("[SYSTEM] Tuncer Core v12.0 Başlatılıyor...")
        time.sleep(1)
        
        # Örnek Eğitim Verisi (Burayı genişletebilirsin)
        self.training_data = {
            "selam": {"patterns": ["merhaba", "selam", "hey", "uyan"], "responses": ["Hoş geldiniz Ahmet Bey.", "Sistem aktif patron.", "Tuncer Core emrinizde."]},
            "durum": {"patterns": ["nasılsın", "durumun ne", "aktif misin"], "responses": ["Çekirdek sıcaklığı normal, işlemler stabil.", "Tam kapasite çalışıyorum."]},
            "kimlik": {"patterns": ["kimsin", "ismin ne", "seni kim yaptı"], "responses": ["Ben Ahmet Tuncer tarafından kodlanan v12 Nöral Çekirdeğim.", "Bir yapay zeka birimiyim."]},
            "islem": {"patterns": ["hesapla", "analiz et", "düşün"], "responses": ["Veri blokları taranıyor...", "Nöral ağlar veri işliyor."]},
            "kapat": {"patterns": ["kapat", "uyu", "güle güle"], "responses": ["Sistem uyku moduna geçiyor.", "İyi günler patron."]}
        }
        
        # Kelime Haznesini (Vocabulary) Oluşturma
        for intent in self.training_data:
            for pattern in self.training_data[intent]["patterns"]:
                words = pattern.split()
                for word in words:
                    if word not in self.vocabulary:
                        self.vocabulary.append(word)
            if intent not in self.intents:
                self.intents.append(intent)
        
        print(f"[SUCCESS] {len(self.vocabulary)} kelime ve {len(self.intents)} niyet katmanı senkronize edildi.")
        self.is_active = True

    def _get_bag_of_words(self, sentence):
        """Cümleyi Sinir Ağının anlayacağı sayısal vektöre (0-1) çevirir"""
        bag = [0] * len(self.vocabulary)
        sentence_words = sentence.lower().split()
        for s_word in sentence_words:
            for i, word in enumerate(self.vocabulary):
                if word == s_word:
                    bag[i] = 1
        return np.array(bag)

    def predict(self, user_input):
        """Olasılık tabanlı niyet tahmini (Inference)"""
        if not self.is_active:
            return "Sistem kilitli. Lütfen önce 'uyan' komutu verin."

        bow = self._get_bag_of_words(user_input)
        
        # Basit bir aktivasyon simülasyonu
        best_match = None
        highest_prob = 0
        
        for intent, data in self.training_data.items():
            for pattern in data["patterns"]:
                p_bow = self._get_bag_of_words(pattern)
                # Cosine Similarity benzeri bir karşılaştırma (Noktasal çarpım)
                similarity = np.dot(bow, p_bow)
                if similarity > highest_prob:
                    highest_prob = similarity
                    best_match = intent

        if highest_prob > 0:
            return random.choice(self.training_data[best_match]["responses"])
        else:
            return "Bu giriş için nöral bir eşleşme bulunamadı patron. Analiz sürüyor."

# --- ANA PROGRAM DÖNGÜSÜ ---
def run_core():
    core = TuncerNeuralNet()
    core.initialize_core()
    
    print("\n" + "="*50)
    print(" TUNCER CORE v12.0 - TERMINAL HUD ACTIVE")
    print("="*50)

    while True:
        try:
            user_msg = input("\n[PATRON] > ")
            
            if user_msg.lower() in ["exit", "çıkış", "kapat"]:
                print("[CORE] Sistem kapatılıyor...")
                break

            # Yapay Zeka Düşünme Simülasyonu
            print("[THINKING]", end="", flush=True)
            for _ in range(3):
                time.sleep(0.3)
                print(".", end="", flush=True)
            print("\n")

            response = core.predict(user_msg)
            print(f"[TUNCER_CORE] >> {response}")

            # Özel bir veda komutu geldiyse döngüyü kır
            if "uyku moduna geçiyor" in response:
                break

        except KeyboardInterrupt:
            print("\n[ALERT] Manuel kesinti algılandı.")
            break

if __name__ == "__main__":
    run_core()