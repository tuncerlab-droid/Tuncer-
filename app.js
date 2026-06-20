import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ========================= AYARLAR =========================
const SCENE_SCALE = 0.09;          // harita.obj birimlerini metreye yaklasik cevirir
const TOUCH_RADIUS = 0.55;         // metre - parmagin bir nesneye "dokunmus" sayilmasi icin esik
const REACH_DEPTH_BASE = -0.55;    // metre - elin kullaniciya gore ortalama derinligi (kamera onunde)
const REACH_DEPTH_RANGE = 0.45;    // metre - z'ye gore one/arkaya ne kadar oynayabilecegi
const DEPTH_SMOOTHING = 0.35;      // 0-1, yuksek = daha az titreme ama daha gec tepki
const REACH_WIDTH = 0.9;           // metre - el hareket alani genisligi
const REACH_HEIGHT = 0.7;          // metre - el hareket alani yuksekligi
const CAINE_POSITION = new THREE.Vector3(0, 0, -2.2);

// kosu hareketiyle yurume: elleri yukari-asagi sallayinca ileri gidilir
const RUN_ENERGY_THRESHOLD = 0.8;  // bu esigin altindaki el titremeleri hareket baslatmaz
const RUN_GAIN = 1.1;              // enerji -> hiz carpani
const WALK_SPEED_MAX = 1.8;        // metre/saniye, tavan hiz
const RUN_SMOOTHING = 0.25;        // enerji yumusatma (dusuk = daha hizli tepki)
const PLAYER_HEIGHT = 1.65;
const MAP_BOUNDS_MARGIN = 0.3;     // metre - haritanin disina tasmayi onlemek icin pay

// ========================= DOM =========================
const setupScreen = document.getElementById("setup-screen");
const vrContainer = document.getElementById("vr-container");
const wsAddressInput = document.getElementById("ws-address");
const btnConnect = document.getElementById("btn-connect");
const connDot = document.getElementById("conn-dot");
const connStatus = document.getElementById("conn-status");
const btnEnterVR = document.getElementById("btn-enter-vr");
const btnExitVR = document.getElementById("btn-exit-vr");
const canvas = document.getElementById("vr-canvas");

const hudFps = document.getElementById("hud-fps");
const hudConn = document.getElementById("hud-conn");
const hudConnText = document.getElementById("hud-conn-text");
const hudHands = document.getElementById("hud-hands");
const hudSpeed = document.getElementById("hud-speed");
const hudTouch = document.getElementById("hud-touch");
const hudWarning = document.getElementById("hud-warning");

// ========================= DURUM =========================
let socket = null;
let socketReady = false;
let latestHands = [];
let touchableObjects = []; // {name, worldCenter: Vector3, radius}
let mapBounds = null; // THREE.Box3, harita disina tasmayi engellemek icin
let lastTouchedName = null;
let lastTouchedAt = 0;

// kayitli sunucu adresi
wsAddressInput.value = localStorage.getItem("tuncerlab_ws_addr") || "wss://192.168.1.10:8765";

// ========================= WEBSOCKET =========================
function connectSocket() {
  const addr = wsAddressInput.value.trim();
  if (!addr) return;
  localStorage.setItem("tuncerlab_ws_addr", addr);

  if (socket) {
    try { socket.close(); } catch (e) {}
  }

  connStatus.textContent = "BAĞLANIYOR...";
  socket = new WebSocket(addr);

  socket.onopen = () => {
    socketReady = true;
    connDot.classList.add("live");
    connStatus.textContent = "BAĞLANDI";
    hudConn.style.color = "var(--ok)";
    hudConnText.textContent = "ONLINE";
    btnEnterVR.disabled = false;
  };

  socket.onclose = () => {
    socketReady = false;
    connDot.classList.remove("live");
    connStatus.textContent = "BAĞLANTI KOPTU - tekrar dene";
    hudConnText.textContent = "OFFLINE";
    btnEnterVR.disabled = true;
  };

  socket.onerror = () => {
    connStatus.textContent = "HATA - adresi kontrol et";
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      latestHands = data.hands || [];
    } catch (e) {
      /* ignore malformed frame */
    }
  };
}

btnConnect.addEventListener("click", connectSocket);

// ========================= THREE.JS SAHNE =========================
let renderer, scene, camera, stereoCam;
let handCursors = []; // THREE.Mesh x2 (sol/sag)
let touchFlashGroup;
let clock = new THREE.Clock();
let frameCount = 0, fpsAccum = 0, fpsTimer = 0;

function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0c);
  scene.fog = new THREE.Fog(0x0a0a0c, 8, 40);

  camera = new THREE.PerspectiveCamera(70, 1, 0.05, 100);
  camera.position.set(0, 1.65, 0); // ortalama goz yuksekligi

  stereoCam = new THREE.StereoCamera();
  stereoCam.aspect = 0.5;
  stereoCam.eyeSep = 0.064;

  // isiklandirma - sicak/soguk vurgu (TuncerLab gold/obsidian)
  scene.add(new THREE.AmbientLight(0x404048, 1.4));
  const key = new THREE.DirectionalLight(0xfff3d6, 1.4);
  key.position.set(3, 6, 2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x4a6cff, 0.5);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  // zemin grid (gold ton) - referans icin
  const grid = new THREE.GridHelper(40, 40, 0xd4af37, 0x2a2a2e);
  grid.position.y = 0.01;
  scene.add(grid);

  // el imleçleri
  const cursorGeo = new THREE.IcosahedronGeometry(0.035, 1);
  for (let i = 0; i < 2; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0xd4af37,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(cursorGeo, mat);
    mesh.visible = false;
    scene.add(mesh);
    handCursors.push(mesh);
  }

  touchFlashGroup = new THREE.Group();
  scene.add(touchFlashGroup);

  loadModels();
  initOrientationControls();
  window.addEventListener("resize", onResize);
  onResize();
}

function loadModels() {
  const loader = new GLTFLoader();

  // ---- HARITA ----
  loader.load("assets/harita.glb", (gltf) => {
    const mapGroup = new THREE.Group();
    mapGroup.add(gltf.scene);
    gltf.scene.traverse((c) => {
      if (c.isMesh) {
        c.material.flatShading = false;
        c.material.roughness = 0.85;
        c.material.metalness = 0.05;
      }
    });

    // harita.glb ham OBJ koordinatlarinda - olcekleyip zemini y=0'a hizala
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    mapGroup.scale.setScalar(SCENE_SCALE);
    mapGroup.position.set(
      -center.x * SCENE_SCALE,
      -box.min.y * SCENE_SCALE,
      -center.z * SCENE_SCALE
    );
    scene.add(mapGroup);
    mapBounds = new THREE.Box3().setFromObject(mapGroup);

    // dokunulabilir nesne merkezlerini ayni donusumle dunya koordinatina cevir
    fetch("assets/harita_objects.json")
      .then((r) => r.json())
      .then((objs) => {
        touchableObjects = Object.entries(objs).map(([name, o]) => {
          const raw = new THREE.Vector3(o.center[0], o.center[1], o.center[2]);
          const world = raw.multiplyScalar(SCENE_SCALE).add(mapGroup.position);
          const sizeWorld = Math.max(o.size[0], o.size[1], o.size[2]) * SCENE_SCALE;
          return { name, worldCenter: world, radius: Math.max(TOUCH_RADIUS, sizeWorld * 0.5) };
        });
        console.log(`[TuncerLab] ${touchableObjects.length} dokunulabilir nesne yuklendi`);
      });
  }, undefined, (err) => console.error("harita.glb yuklenemedi", err));

  // ---- KARAKTER (Caine) ----
  loader.load("assets/karakter.glb", (gltf) => {
    gltf.scene.position.copy(CAINE_POSITION);
    gltf.scene.rotation.y = Math.PI; // kullaniciya baksin
    scene.add(gltf.scene);
  }, undefined, (err) => console.error("karakter.glb yuklenemedi", err));
}

// ========================= BAS YONELIMI (Cardboard) =========================
let deviceQuat = new THREE.Quaternion();
let screenOrientation = 0;
let lastOrientationEventAt = 0;
let vrEnteredAt = 0;

function initOrientationControls() {
  window.addEventListener("orientationchange", () => {
    screenOrientation = window.orientation || 0;
  });

  window.addEventListener("deviceorientation", (e) => {
    if (e.alpha === null) return;
    lastOrientationEventAt = performance.now();
    setQuaternionFromDeviceOrientation(deviceQuat, e.alpha, e.beta, e.gamma, screenOrientation);
  });
}

const EULER_ORDER = "YXZ";
const _zee = new THREE.Vector3(0, 0, 1);
const _euler = new THREE.Euler();
const _q0 = new THREE.Quaternion();
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

function setQuaternionFromDeviceOrientation(quat, alpha, beta, gamma, orient) {
  _euler.set(
    THREE.MathUtils.degToRad(beta),
    THREE.MathUtils.degToRad(alpha),
    -THREE.MathUtils.degToRad(gamma),
    EULER_ORDER
  );
  quat.setFromEuler(_euler);
  quat.multiply(_q1);
  quat.multiply(_q0.setFromAxisAngle(_zee, -THREE.MathUtils.degToRad(orient)));
}

async function requestMotionPermission() {
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      return res === "granted";
    } catch (e) {
      return false;
    }
  }
  return true; // Android / izin gerektirmeyen tarayicilar
}

// ========================= EL VERISI -> SAHNE =========================
const _handWorldPos = [new THREE.Vector3(), new THREE.Vector3()];
const _smoothedDepth = [REACH_DEPTH_BASE, REACH_DEPTH_BASE];

function updateHandCursors() {
  for (let i = 0; i < 2; i++) {
    const hand = latestHands[i];
    if (!hand) {
      handCursors[i].visible = false;
      continue;
    }
    const tip = hand.landmarks[8];   // isaret parmagi ucu
    const wrist = hand.landmarks[0]; // bilek - z referans noktasi

    // MediaPipe z, bilege gore goreceli derinlik (negatif = kameraya daha yakin).
    // Tek kameradan geldigi icin gurultulu olabilir; ham parmak-ucu z'sini
    // kullanip ustune hafif smoothing uyguluyoruz.
    const rawZ = tip[2] - wrist[2];
    const targetDepth = REACH_DEPTH_BASE - THREE.MathUtils.clamp(rawZ * 4.0, -1, 1) * REACH_DEPTH_RANGE;
    _smoothedDepth[i] = THREE.MathUtils.lerp(targetDepth, _smoothedDepth[i], DEPTH_SMOOTHING);

    // MediaPipe normalize (0-1) -> kamera onunde, derinligi z'ye gore degisen bir noktaya yansit
    const nx = (tip[0] - 0.5) * REACH_WIDTH;
    const ny = (0.5 - tip[1]) * REACH_HEIGHT;

    const local = new THREE.Vector3(nx, ny, _smoothedDepth[i]);
    local.applyQuaternion(camera.quaternion);
    local.add(camera.position);

    handCursors[i].position.copy(local);
    handCursors[i].visible = true;
    handCursors[i].material.emissiveIntensity = hand.pinching ? 1.4 : 0.5;
    handCursors[i].scale.setScalar(hand.pinching ? 1.6 : 1.0);

    _handWorldPos[i].copy(local);
  }
}

// ========================= KOSU HAREKETIYLE YURUME =========================
// Mantik: eller yukari-asagi sallandiginda (kosar gibi) bilek noktasinin
// dikey hizi yukselir; bu "enerji" bir esigi gectiginde bakilan yone dogru
// ileri hareket baslar. Durunca enerji sonup hareket de kesilir.
let runEnergy = 0;
let currentSpeed = 0;
const _prevWristY = [null, null];
const _forward = new THREE.Vector3();

function updateLocomotion(dt) {
  if (dt <= 0) return;

  let rawEnergy = 0;
  for (let i = 0; i < 2; i++) {
    const hand = latestHands[i];
    if (!hand) { _prevWristY[i] = null; continue; }
    const wristY = hand.landmarks[0][1];
    if (_prevWristY[i] !== null) {
      rawEnergy += Math.abs(wristY - _prevWristY[i]) / dt;
    }
    _prevWristY[i] = wristY;
  }

  runEnergy = THREE.MathUtils.lerp(rawEnergy, runEnergy, RUN_SMOOTHING);
  currentSpeed = THREE.MathUtils.clamp((runEnergy - RUN_ENERGY_THRESHOLD) * RUN_GAIN, 0, WALK_SPEED_MAX);

  if (currentSpeed > 0.02) {
    _forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    _forward.y = 0;
    if (_forward.lengthSq() > 0.0001) {
      _forward.normalize();
      camera.position.addScaledVector(_forward, currentSpeed * dt);
    }
  }

  // haritanin disina tasmasin
  if (mapBounds) {
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, mapBounds.min.x + MAP_BOUNDS_MARGIN, mapBounds.max.x - MAP_BOUNDS_MARGIN);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, mapBounds.min.z + MAP_BOUNDS_MARGIN, mapBounds.max.z - MAP_BOUNDS_MARGIN);
  }
  camera.position.y = PLAYER_HEIGHT;
}

function checkTouches() {
  let touchedThisFrame = null;
  for (let i = 0; i < 2; i++) {
    const hand = latestHands[i];
    if (!hand || !hand.pinching) continue;
    const pos = _handWorldPos[i];
    let best = null, bestDist = Infinity;
    for (const obj of touchableObjects) {
      const d = pos.distanceTo(obj.worldCenter);
      if (d < obj.radius && d < bestDist) {
        best = obj;
        bestDist = d;
      }
    }
    if (best) touchedThisFrame = best;
  }

  if (touchedThisFrame && touchedThisFrame.name !== lastTouchedName) {
    spawnTouchFlash(touchedThisFrame.worldCenter);
    lastTouchedName = touchedThisFrame.name;
    lastTouchedAt = performance.now();
    hudTouch.textContent = `DOKUNULDU: ${touchedThisFrame.name}`;
  } else if (!touchedThisFrame) {
    lastTouchedName = null;
  }
}

function spawnTouchFlash(pos) {
  const geo = new THREE.RingGeometry(0.05, 0.08, 24);
  const mat = new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(geo, mat);
  ring.position.copy(pos);
  ring.lookAt(camera.position);
  ring.userData.born = performance.now();
  touchFlashGroup.add(ring);
}

function updateTouchFlashes() {
  const now = performance.now();
  for (let i = touchFlashGroup.children.length - 1; i >= 0; i--) {
    const ring = touchFlashGroup.children[i];
    const age = (now - ring.userData.born) / 600; // 600ms omur
    if (age >= 1) {
      touchFlashGroup.remove(ring);
      continue;
    }
    ring.scale.setScalar(1 + age * 6);
    ring.material.opacity = 0.9 * (1 - age);
  }
}

// ========================= TESHIS =========================
function updateDiagnostics() {
  if (!vrContainer.classList.contains("active")) return;
  const sinceEnter = performance.now() - vrEnteredAt;
  const sinceLastOrientation = performance.now() - lastOrientationEventAt;

  if (sinceEnter > 2500 && sinceLastOrientation > 2500) {
    hudWarning.textContent =
      "JİROSKOP VERİSİ ALINAMIYOR — sayfa wss/https üzerinden açılmalı, ayrıca tarayıcı hareket sensörü iznini kontrol et.";
    hudWarning.classList.add("show");
  } else {
    hudWarning.classList.remove("show");
  }
}

// ========================= RENDER DONGUSU =========================
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  camera.quaternion.copy(deviceQuat);

  updateLocomotion(dt);
  updateHandCursors();
  checkTouches();
  updateTouchFlashes();

  stereoCam.update(camera);

  const w = window.innerWidth, h = window.innerHeight;
  renderer.setScissorTest(true);

  renderer.setViewport(0, 0, w / 2, h);
  renderer.setScissor(0, 0, w / 2, h);
  renderer.render(scene, stereoCam.cameraL);

  renderer.setViewport(w / 2, 0, w / 2, h);
  renderer.setScissor(w / 2, 0, w / 2, h);
  renderer.render(scene, stereoCam.cameraR);

  renderer.setScissorTest(false);

  // HUD guncelle (saniyede birkac kez yeterli)
  frameCount++; fpsAccum += dt; fpsTimer += dt;
  if (fpsTimer > 0.4) {
    hudFps.textContent = Math.round(frameCount / fpsAccum);
    frameCount = 0; fpsAccum = 0; fpsTimer = 0;
  }
  hudHands.textContent = latestHands.length;
  hudSpeed.textContent = currentSpeed.toFixed(1);
  updateDiagnostics();
  if (lastTouchedName && performance.now() - lastTouchedAt > 1500) {
    hudTouch.textContent = "—";
  }
}

// ========================= GIRIS / CIKIS VR =========================
btnEnterVR.addEventListener("click", async () => {
  const granted = await requestMotionPermission();
  if (!granted) {
    alert("Hareket sensörü izni verilmedi. Ayarlardan tarayıcıya hareket izni vermen gerekiyor.");
    return;
  }
  setupScreen.style.display = "none";
  vrContainer.classList.add("active");
  vrEnteredAt = performance.now();
  if (vrContainer.requestFullscreen) vrContainer.requestFullscreen().catch(() => {});
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }
  onResize();
});

btnExitVR.addEventListener("click", () => {
  vrContainer.classList.remove("active");
  setupScreen.style.display = "flex";
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
});

// ========================= BASLAT =========================
initScene();
animate();
