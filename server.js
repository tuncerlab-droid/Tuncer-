import json
import threading
import asyncio
import websockets
import gymnasium as gym
import mujoco
import mujoco.viewer
from stable_baselines3 import PPO
import time
import http.server
import socketserver
import cv2
import mediapipe as mp
import base64
import numpy as np
import math

# ==========================================
# AYARLAR VE AĞ (WebSocket & HTTP)
# ==========================================
HOST = "0.0.0.0" 
PORT_WS = 5005   
PORT_HTTP = 8000 

sensor_state = {
    "w": False, "a": False, "s": False, "d": False,
    "alpha": 0.0, "beta": 0.0, "gamma": 0.0
}

current_azimuth = 0.0
current_elevation = 0.0

# AR Eller ve Kutu için değişkenler (Fizik motorunu çökertmemek için ekran üstü AR kullanıyoruz)
hand_state = {'lx': 0.5, 'ly': 0.5, 'l_pinch': False, 'rx': 0.5, 'ry': 0.5, 'r_pinch': False}
virtual_box_pos = [0.5, 0.4] # Ekranın ortasında uçan sarı kutu

clients = set()
ws_loop = None

def start_http_server():
    Handler = http.server.SimpleHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((HOST, PORT_HTTP), Handler) as httpd:
        print(f"🌍 [WEB] Telefonunuzdan girin: http://BILGISAYAR_IP_ADRESINIZ:{PORT_HTTP}")
        httpd.serve_forever()

async def handle_client(websocket):
    print("📱 [AĞ] Telefon (VR Gözlük) bağlandı!")
    clients.add(websocket)
    try:
        async for message in websocket:
            if message.startswith("{"):
                sensor_state.update(json.loads(message))
    except Exception:
        pass
    finally:
        clients.remove(websocket)

def websocket_thread():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    # run_until_complete yerine async bir görev başlatın
    loop.run_until_complete(websockets.serve(handle_client, HOST, PORT_WS))
    loop.run_forever()

def mediapipe_thread():
    import mediapipe as mp
    cap = cv2.VideoCapture(0)
    # MediaPipe Hands başlatma
    hands = mp.solutions.hands.Hands(min_detection_confidence=0.6, min_tracking_confidence=0.6)
    print("📷 [KAMERA] El takibi başlatıldı.")
    
    while True:
        ret, frame = cap.read()
        if not ret: 
            continue
        
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = hands.process(rgb)
        
        # Varsayılan değerler
        hand_state['l_pinch'] = False
        hand_state['r_pinch'] = False
        
        if res.multi_hand_landmarks:
            for idx, lm in enumerate(res.multi_hand_landmarks):
                # Elin sol mu sağ mı olduğunu anla
                lbl = res.multi_handedness[idx].classification[0].label
                
                # İşaret parmağı (landmark 8) ve Baş parmak (landmark 4)
                ix, iy = lm.landmark[8].x, lm.landmark[8].y
                tx, ty = lm.landmark[4].x, lm.landmark[4].y
                
                # Çimdik kontrolü
                pinch = math.hypot(ix - tx, iy - ty) < 0.05
                
                if lbl == "Left":
                    hand_state.update({'lx': ix, 'ly': iy, 'l_pinch': pinch})
                else:
                    hand_state.update({'rx': ix, 'ry': iy, 'r_pinch': pinch})
        
        time.sleep(0.01)
    
    while True:
        ret, frame = cap.read()
        if not ret: continue
        
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = hands.process(rgb)
        
        hand_state['l_pinch'] = False
        hand_state['r_pinch'] = False
        
        if res.multi_hand_landmarks:
            for idx, lm in enumerate(res.multi_hand_landmarks):
                lbl = res.multi_handedness[idx].classification[0].label
                ix, iy = lm.landmark[8].x, lm.landmark[8].y
                tx, ty = lm.landmark[4].x, lm.landmark[4].y
                pinch = math.hypot(ix - tx, iy - ty) < 0.05
                
                if lbl == "Left":
                    hand_state.update({'lx': ix, 'ly': iy, 'l_pinch': pinch})
                else:
                    hand_state.update({'rx': ix, 'ry': iy, 'r_pinch': pinch})
        time.sleep(0.01)

def main():
    global current_azimuth, current_elevation, virtual_box_pos
    
    threading.Thread(target=start_http_server, daemon=True).start()
    threading.Thread(target=websocket_thread, daemon=True).start()
    threading.Thread(target=mediapipe_thread, daemon=True).start()

    print("🤖 [ORTAM] Gymnasium Humanoid-v4 yükleniyor...")
    # XML değiştirmeden eski güvenli yöntemi kullanıyoruz
    env = gym.make("Humanoid-v4")
    
    try:
        model = PPO.load("humanoid_ai.zip")
        ai_loaded = True
        print("✅ [AI] Yapay zeka devrede.")
    except:
        ai_loaded = False

    obs, info = env.reset()
    mujoco_model = env.unwrapped.model
    mujoco_data = env.unwrapped.data

    # VR için Görüntü Çıkarıcı (Render)
    renderer = mujoco.Renderer(mujoco_model, width=400, height=300)
    
    # Senin başlangıç pozisyonun (Humanoid'in 3 metre gerisinde, kendi gözünden)
    cam_pos = np.array([0.0, -3.0, 1.5]) 

    with mujoco.viewer.launch_passive(mujoco_model, mujoco_data) as viewer:
        # Viewer artık burada tanımlı, ayarları buraya taşıyın:
        viewer.cam.type = mujoco.mjtCamera.mjCAMERA_FREE
        viewer.cam.distance = 0.0 
        
        while viewer.is_running():
            step_start = time.time()

            if ai_loaded:
                action, _states = model.predict(obs, deterministic=True)
            else:
                action = env.action_space.sample()

            obs, reward, terminated, truncated, info = env.step(action)

            # --- VR KAFA TAKİBİ VE DÜZELTİLMİŞ EKSENLER ---
            # VR yatay kullanımda: Alpha (Sağ/Sol dönme), Gamma (Aşağı/Yukarı bakma)
            target_azimuth = sensor_state["alpha"]
            target_elevation = -sensor_state["gamma"]
            
            current_azimuth += (target_azimuth - current_azimuth) * 0.1
            current_elevation += (target_elevation - current_elevation) * 0.1
            
            yaw_rad = math.radians(current_azimuth)
            forward = np.array([-math.sin(yaw_rad), math.cos(yaw_rad), 0])
            right = np.array([math.cos(yaw_rad), math.sin(yaw_rad), 0])

            # --- KULLANICI YÖNLENDİRMESİ (BAĞIMSIZ HAREKET) ---
            speed = 0.05 
            if sensor_state["w"]: cam_pos += forward * speed
            if sensor_state["s"]: cam_pos -= forward * speed
            if sensor_state["d"]: cam_pos += right * speed
            if sensor_state["a"]: cam_pos -= right * speed

            viewer.cam.azimuth = current_azimuth
            viewer.cam.elevation = current_elevation
            viewer.cam.lookat[:] = cam_pos + forward
            

            viewer.sync()

            # --- VR GÖRÜNTÜ OLUŞTURMA VE AR EŞYA ---
            renderer.update_scene(mujoco_data, camera=viewer.cam)
            img = renderer.render()
            h, w, _ = img.shape
            
            # AR Kutu Etkileşimi (Eşya Tutma Mantığı)
            dist_l = math.hypot(hand_state['lx'] - virtual_box_pos[0], hand_state['ly'] - virtual_box_pos[1])
            dist_r = math.hypot(hand_state['rx'] - virtual_box_pos[0], hand_state['ry'] - virtual_box_pos[1])
            
            if dist_l < 0.1 and hand_state['l_pinch']: virtual_box_pos = [hand_state['lx'], hand_state['ly']]
            elif dist_r < 0.1 and hand_state['r_pinch']: virtual_box_pos = [hand_state['rx'], hand_state['ry']]
            
            # Kutuyu Ekrana Çiz
            bx, by = int(virtual_box_pos[0]*w), int(virtual_box_pos[1]*h)
            cv2.rectangle(img, (bx-15, by-15), (bx+15, by+15), (0, 215, 255), -1)

            # Elleri Ekrana Çiz (Çimdik atınca Yeşile döner)
            lx, ly = int(hand_state['lx']*w), int(hand_state['ly']*h)
            rx, ry = int(hand_state['rx']*w), int(hand_state['ry']*h)
            cv2.circle(img, (lx, ly), 10, (0, 255, 0) if hand_state['l_pinch'] else (255, 0, 0), -1)
            cv2.circle(img, (rx, ry), 10, (0, 255, 0) if hand_state['r_pinch'] else (0, 0, 255), -1)

            # Çift Ekran (Stereo VR Formatı)
            img_vr = np.concatenate((img, img), axis=1)
            img_vr_bgr = cv2.cvtColor(img_vr, cv2.COLOR_RGB2BGR)
            
            _, buf = cv2.imencode('.jpg', img_vr_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 50])
            b64_str = "data:image/jpeg;base64," + base64.b64encode(buf).decode('utf-8')

            # Görüntüyü telefona asenkron gönder
            if clients and ws_loop:
                async def broadcast():
                    await asyncio.gather(*[c.send(b64_str) for c in list(clients)], return_exceptions=True)
                asyncio.run_coroutine_threadsafe(broadcast(), ws_loop)

            if terminated or truncated:
                obs, info = env.reset()

            time.sleep(max(0, mujoco_model.opt.timestep - (time.time() - step_start)))

if __name__ == "__main__":
    main()
