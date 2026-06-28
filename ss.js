/**
 * TuncerLab – World AI İstemcisi v3.0
 * MediaPipe.js  : telefon kamerası → el takibi (tarayıcıda, PC webcam'e gerek yok)
 * Three.js      : stereo Cardboard render
 * AI Avatar     : tam kemik hiyerarşisi (sunucu rotasyon gönderir)
 * Gece/Gündüz  : güneş yörüngesi + dinamik gökyüzü
 * Çok Oyunculu : her telefon kendi konumunu sunucuya gönderir
 * Terminal      : AI'ya komut gönder, çıktıyı gör
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ═══════════════════════════════════════════════════════ AYARLAR ════
const REACH_W = 0.9, REACH_H = 0.7;
const DEPTH_BASE = -0.55, DEPTH_RANGE = 0.45, DEPTH_SMOOTH = 0.35;
const TOUCH_R    = 0.55;
const PLAYER_H   = 1.65;
const SCENE_SCALE = 0.09;
const RUN_THRESH  = 0.8, RUN_GAIN = 1.1, MAX_SPEED = 1.8, RUN_SMOOTH = 0.25;
const MAP_MARGIN  = 0.3;
const STATE_HZ    = 12;
const PLAYER_TIMEOUT_MS = 5000;
const PLAYER_COLORS = ["#d4af37","#4ecbd9","#c4392f","#6fcf7a","#b07be0","#e08a3c"];

// ═══════════════════════════════════════════════════════ DOM ════════
const setupScreen  = document.getElementById("setup-screen");
const vrContainer  = document.getElementById("vr-container");
const canvas       = document.getElementById("vr-canvas");
const wsInput      = document.getElementById("ws-address");
const nameInput    = document.getElementById("player-name");
const btnConnect   = document.getElementById("btn-connect");
const connDot      = document.getElementById("conn-dot");
const connStatus   = document.getElementById("conn-status");
const btnEnterVR   = document.getElementById("btn-enter-vr");
const btnExitVR    = document.getElementById("btn-exit-vr");
const hudFps       = document.getElementById("hud-fps");
const hudConnDot   = document.getElementById("hud-conn-dot");
const hudConnText  = document.getElementById("hud-conn-text");
const hudPlayers   = document.getElementById("hud-players");
const hudHands     = document.getElementById("hud-hands");
const hudSpeed     = document.getElementById("hud-speed");
const hudTouch     = document.getElementById("hud-touch");
const hudWarning   = document.getElementById("hud-warning");
const aiSpeechEl   = document.getElementById("ai-speech");
const hudClock     = document.getElementById("hud-clock");
const termPanel    = document.getElementById("terminal-panel");
const termToggle   = document.getElementById("terminal-toggle");
const termOutput   = document.getElementById("terminal-output");
const termInput    = document.getElementById("terminal-input");
const termSend     = document.getElementById("terminal-send");
const termChevron  = document.getElementById("terminal-chevron");
const videoEl      = document.getElementById("mp-video");

// ═══════════════════════════════════════════════════════ DURUM ══════
wsInput.value  = localStorage.getItem("tl_ws")   || "wss://192.168.1.10:8765";
nameInput.value= localStorage.getItem("tl_name") || `Oyuncu${(Math.random()*900+100)|0}`;
const myColor  = localStorage.getItem("tl_color")|| PLAYER_COLORS[(Math.random()*PLAYER_COLORS.length)|0];
localStorage.setItem("tl_color", myColor);

let socket = null, socketReady = false, myPlayerId = null, reconnTimer = null;
let latestHands = [], remoteAvatars = {}, remotePlayerStates = {};
let touchableObjects = [], mapBounds = null;
let lastTouchedName = null, lastTouchedAt = 0;
let worldSkyTime = 12.0;
let spawnedObjects = {};     // id → THREE.Group

// ═══════════════════════════════════════════════════════ WEBSOCKET ══
function connectSocket() {
  const addr = wsInput.value.trim();
  if (!addr) return;
  localStorage.setItem("tl_ws", addr);
  localStorage.setItem("tl_name", nameInput.value.trim() || "Oyuncu");

  if (reconnTimer) { clearTimeout(reconnTimer); reconnTimer = null; }
  if (socket) { try { socket.close(); } catch(e){} }
  connStatus.textContent = "BAĞLANIYOR...";

  let ws;
  try { ws = new WebSocket(addr); } catch(e) {
    connStatus.textContent = "GEÇERSİZ ADRES";
    return;
  }
  socket = ws;

  ws.onopen = () => {
    socketReady = true;
    connDot.classList.add("live");
    connStatus.textContent = "BAĞLANDI";
    hudConnDot.style.color = "var(--ok)";
    hudConnText.textContent = "ONLINE";
    btnEnterVR.disabled = false;
    termLog("sys", "Sunucuya bağlandı.");
  };

  ws.onclose = ev => {
    socketReady = false;
    connDot.classList.remove("live");
    hudConnText.textContent = "OFFLINE";
    btnEnterVR.disabled = true;
    myPlayerId = null;
    connStatus.textContent = `KOPTU (${ev.code}) — yeniden deniyor...`;
    reconnTimer = setTimeout(connectSocket, 2500);
  };

  ws.onerror = () => {
    connStatus.textContent = "HATA — sertifikayı kabul ettin mi? (https://IP:8765)";
  };

  ws.onmessage = ev => {
    let d; try { d = JSON.parse(ev.data); } catch(e) { return; }
    handleServerMessage(d);
  };
}

function sendWS(msg) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try { socket.send(JSON.stringify(msg)); } catch(e){}
  }
}

function handleServerMessage(d) {
  switch(d.type) {
    case "welcome":
      myPlayerId = d.id;
      termLog("sys", `Hoşgeldin! ID: ${d.id}`);
      break;

    case "world_update":
      worldSkyTime = d.sky_time ?? worldSkyTime;
      remotePlayerStates = d.players || {};
      if (d.weather) applyWeather(d.weather, d.weather_intensity ?? 0.5);
      // AI avatar güncelle
      if (d.ai) applyAIPose(d.ai);
      break;

    case "sky_update":
      worldSkyTime = d.time ?? worldSkyTime;
      break;

    case "weather_update":
      applyWeather(d.weather, d.intensity ?? 0.5);
      break;

    case "spawn_object":
      spawnObjectFromServer(d);
      break;

    case "remove_object":
      removeSpawnedObject(d.id);
      break;

    case "ai_action":
      if (d.action === "bone_update") applyAIPose({ pose: d.bones });
      break;

    case "ai_speech":
      showAISpeech(d.text, d.duration);
      break;

    case "ai_move":
      if (aiAvatarRoot) aiAvatarRoot.position.set(d.position[0], 0, d.position[2]);
      break;

    case "terminal_output":
      termLog("cmd", `$ ${d.cmd}`);
      termLog("out", d.output || "(çıktı yok)");
      break;

    case "player_left":
      removeRemoteAvatar(d.id);
      break;

    case "interaction":
      termLog("ai", `[ETKİLEŞİM] ${d.player} → ${d.target} (${d.action})`);
      break;
  }
}

btnConnect.addEventListener("click", connectSocket);

// Kendi konum/el durumumuzu periyodik gönder
setInterval(() => {
  if (!camera || !socketReady) return;
  sendWS({
    type: "player_state",
    name: (nameInput.value || "Oyuncu").trim().slice(0,16),
    color: myColor,
    head: {
      pos:  [camera.position.x, camera.position.y, camera.position.z],
      quat: [camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w],
    },
    hands: latestHands,
  });
}, 1000 / STATE_HZ);

// ═══════════════════════════════════════════════════════ MEDIAPIPE ══
let mpReady = false;

function initMediaPipe() {
  if (typeof Hands === "undefined") {
    console.warn("MediaPipe Hands CDN henüz yüklenmedi.");
    return;
  }

  const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
  });
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 0,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5,
  });
  hands.onResults(results => {
    latestHands = [];
    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach((lms, i) => {
        const hn = results.multiHandedness?.[i]?.label ?? "Right";
        const pts = lms.map(lm => [lm.x, lm.y, lm.z]);
        const th = pts[4], idx = pts[8];
        const pinchD = Math.hypot(th[0]-idx[0], th[1]-idx[1], th[2]-idx[2]);
        latestHands.push({
          handedness: hn,
          landmarks: pts,
          pinchDist: pinchD,
          pinching: pinchD < 0.055,
        });
      });
    }
  });

  const cam = new Camera(videoEl, {
    onFrame: async () => { await hands.send({ image: videoEl }); },
    width: 640, height: 480,
    facingMode: "user",         // ön kamera; "environment" = arka kamera
  });
  cam.start().then(() => {
    mpReady = true;
    termLog("sys", "MediaPipe Hands başlatıldı (telefon kamerası).");
  }).catch(e => {
    termLog("err", `Kamera erişimi reddedildi: ${e.message}`);
  });
}

// ═══════════════════════════════════════════════════════ THREE.JS ═══
let renderer, scene, camera, stereoCam;
let sunMesh, sunGlow, sunLight, skyCanvas, skyTex, starsGroup;
let handCursors = [], touchFlashGroup;
let aiAvatarRoot = null, boneGroups = {};
let clock = new THREE.Clock();
let frameCount = 0, fpsAccum = 0, fpsTimer = 0;
let currentSpeed = 0, runEnergy = 0;
let vrEnteredAt = 0, lastOrientAt = 0;
let deviceQuat = new THREE.Quaternion();
let screenOrient = 0;
const _prevWristY = [null, null];
const _smoothedDepth = [DEPTH_BASE, DEPTH_BASE];
const _handWorldPos = [new THREE.Vector3(), new THREE.Vector3()];
const _fw = new THREE.Vector3();

// ── Gökyüzü ──────────────────────────────────────────────────────────
function buildSkyCanvas() {
  const c = document.createElement("canvas");
  c.width = 8; c.height = 512;
  skyCanvas = c;
  skyTex = new THREE.CanvasTexture(c);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  skyTex.mapping = THREE.EquirectangularReflectionMapping;
  updateSkyForTime(12);
  return skyTex;
}

function updateSkyForTime(h) {
  const ctx = skyCanvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  if (h >= 5 && h < 8) {       // şafak
    g.addColorStop(0, "#1a1f3e"); g.addColorStop(.45, "#d4703a"); g.addColorStop(.75, "#f0b060"); g.addColorStop(1, "#1a0e0a");
  } else if (h >= 8 && h < 17) { // gündüz
    g.addColorStop(0, "#2460a8"); g.addColorStop(.55, "#63a0e0"); g.addColorStop(.78, "#f4c97a"); g.addColorStop(1, "#1a1410");
  } else if (h >= 17 && h < 20) { // gün batımı
    g.addColorStop(0, "#1a2a4a"); g.addColorStop(.4, "#b04020"); g.addColorStop(.7, "#f07830"); g.addColorStop(1, "#100808");
  } else {                       // gece
    g.addColorStop(0, "#03040d"); g.addColorStop(.5, "#0d1b3e"); g.addColorStop(.8, "#1a1410"); g.addColorStop(1, "#050304");
  }
  ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 512);
  skyTex.needsUpdate = true;
  scene.background = skyTex;
}

function updateSunPosition(h) {
  // Güneş yörüngesi: sabah 6'da doğar, 12'de zirve, 18'de batar
  const angle = ((h - 6) / 12) * Math.PI;
  const r = 60;
  const x = -r * Math.cos(angle);
  const y = r * Math.sin(angle);
  const pos = new THREE.Vector3(x, y, -50);

  if (sunMesh) sunMesh.position.copy(pos);
  if (sunGlow) sunGlow.position.copy(pos);
  if (sunLight) {
    sunLight.position.copy(pos);
    const intensity = Math.max(0, Math.sin(angle)) * 2.8;
    sunLight.intensity = intensity;
    const warm = Math.abs(Math.sin(angle));
    sunLight.color.setRGB(1.0, 0.85 + warm * 0.15, 0.6 + warm * 0.3);
    // Gece yıldızları göster
    if (starsGroup) starsGroup.visible = (h < 5.5 || h > 19.5);
  }
  // Sis rengi
  const skyBase = (h >= 8 && h < 17) ? 0x9fb8d6 : (h >= 17 || h < 5 ? 0x2a2040 : 0x704030);
  if (scene.fog) scene.fog.color.set(skyBase);
}

function createStars() {
  const geo = new THREE.BufferGeometry();
  const pos = [];
  for (let i = 0; i < 2000; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r = 80 + Math.random() * 20;
    pos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, sizeAttenuation: true });
  starsGroup = new THREE.Points(geo, mat);
  starsGroup.visible = false;
  scene.add(starsGroup);
}

// ── Nesne Kataloğu ────────────────────────────────────────────────────
const MAT_CACHE = {};
function getMat(hex, rough = 0.7, metal = 0.05) {
  const k = `${hex}_${rough}_${metal}`;
  if (!MAT_CACHE[k]) MAT_CACHE[k] = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
  return MAT_CACHE[k];
}

const OBJECT_BUILDERS = {
  tree: () => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,.6,8), getMat("#5c3d1a"));
    g.add(trunk);
    [[0,.75,0,.4,1],[0,1.15,0,.3,.8],[0,1.5,0,.22,.6]].forEach(([x,y,z,r,h]) => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(r,h,8), getMat("#2d6a2d",0.9));
      c.position.set(x,y,z); g.add(c);
    });
    return g;
  },
  cube: (scale=1) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(scale,scale,scale), getMat("#8a9bb0",0.6)));
    return g;
  },
  sphere: () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.4,16,16), getMat("#9a6080",0.5,0.2)));
    return g;
  },
  rock: () => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.35,1), getMat("#7a7a7a",0.9));
    m.scale.set(1+Math.random()*.4, 0.6+Math.random()*.5, 1+Math.random()*.4);
    g.add(m); return g;
  },
  lamp: () => {
    const g = new THREE.Group();
    g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,1.8,8), getMat("#4a4a4a")), {position: new THREE.Vector3(0,.9,0)}));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.08,8,8), new THREE.MeshStandardMaterial({color:0xffee88,emissive:0xffee88,emissiveIntensity:2}));
    bulb.position.y = 1.85; g.add(bulb);
    const light = new THREE.PointLight(0xffee88,.8,5);
    light.position.copy(bulb.position); g.add(light);
    return g;
  },
  barrel: () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,.4,12), getMat("#8B4513",0.8)));
    return g;
  },
  fence: () => {
    const g = new THREE.Group();
    for (let i=-1;i<=1;i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(.05,.8,.05), getMat("#8B6914"));
      p.position.set(i*.5,0,0); g.add(p);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.05,.05,.04), getMat("#8B6914"));
    rail.position.y = .3; g.add(rail);
    return g;
  },
  sign: () => {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.2,6), getMat("#aaa"));
    post.position.y = .6; g.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(.4,.25,.03), getMat("#f4e0a0"));
    board.position.y = 1.1; g.add(board);
    return g;
  },
  platform: () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2,.1,2), getMat("#606060",0.8)));
    return g;
  },
  vehicle: () => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6,.5,.9), getMat("#c0392b",0.5,0.3));
    body.position.y = .35; g.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(.9,.4,.85), getMat("#c0392b",0.5,0.3));
    top.position.set(-.1,.8,0); g.add(top);
    [[-.5,0,.55],[.5,0,.55],[-.5,0,-.55],[.5,0,-.55]].forEach(([x,y,z]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.12,12), getMat("#222",0.9));
      w.rotation.x = Math.PI/2; w.position.set(x,y,z); g.add(w);
    });
    return g;
  },
};

function spawnObjectFromServer(d) {
  if (spawnedObjects[d.id]) return;
  const builder = OBJECT_BUILDERS[d.type] || OBJECT_BUILDERS.cube;
  const group = builder();
  const [px,py,pz] = d.position || [0,0,-3];
  const [rx,ry,rz] = (d.rotation||[0,0,0]).map(THREE.MathUtils.degToRad);
  const [sx,sy,sz] = d.scale || [1,1,1];
  group.position.set(px, py, pz);
  group.rotation.set(rx, ry, rz);
  group.scale.set(sx, sy, sz);
  if (d.color && group.children[0]?.material) group.children[0].material.color.set(d.color);
  scene.add(group);
  spawnedObjects[d.id] = group;
  touchableObjects.push({ name: d.id, worldCenter: group.position.clone(), radius: 0.6 });
}

function removeSpawnedObject(id) {
  const g = spawnedObjects[id];
  if (g) { scene.remove(g); delete spawnedObjects[id]; }
  touchableObjects = touchableObjects.filter(o => o.name !== id);
}

// ── Hava Durumu ───────────────────────────────────────────────────────
let rainGroup = null;
function applyWeather(type, intensity) {
  if (scene.fog) {
    if (type === "fog") scene.fog.far = 15;
    else if (type === "rain" || type === "storm") scene.fog.far = 30;
    else scene.fog.far = 70;
  }
  if (rainGroup) { scene.remove(rainGroup); rainGroup = null; }
  if (type === "rain" || type === "storm") {
    const geo = new THREE.BufferGeometry();
    const pos = [];
    for (let i=0;i<800*intensity;i++) {
      pos.push((Math.random()-.5)*20, Math.random()*10, (Math.random()-.5)*20);
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos,3));
    const mat = new THREE.PointsMaterial({color:0x99ccff,size:0.04,transparent:true,opacity:0.6});
    rainGroup = new THREE.Points(geo, mat);
    scene.add(rainGroup);
  }
}

// ── AI Avatar (Kemik Sistemi) ─────────────────────────────────────────
function buildAIAvatar() {
  aiAvatarRoot = new THREE.Group();
  aiAvatarRoot.position.set(0, 0, -3);

  const BONE_DEFS = {
    root:        {parent:null,       off:[0,.9,0],    geo:[.16,.25,.16],  col:"#3a3a4a"},
    spine:       {parent:"root",     off:[0,.25,0],   geo:[.14,.22,.13],  col:"#4060c0"},
    chest:       {parent:"spine",    off:[0,.22,0],   geo:[.18,.2,.14],   col:"#3a55b0"},
    neck:        {parent:"chest",    off:[0,.2,0],    geo:[.06,.1,.06],   col:"#6080d0"},
    head:        {parent:"neck",     off:[0,.1,0],    geo:[.15,.18,.15],  col:"#e8d0a0"},
    shoulder_l:  {parent:"chest",    off:[-.2,.05,0], geo:[.08,.08,.08],  col:"#d4af37"},
    upper_arm_l: {parent:"shoulder_l",off:[-.18,0,0], geo:[.07,.22,.07],  col:"#c49a20"},
    forearm_l:   {parent:"upper_arm_l",off:[-.22,0,0],geo:[.06,.2,.06],   col:"#d4af37"},
    hand_l:      {parent:"forearm_l",off:[-.2,0,0],  geo:[.07,.09,.04],  col:"#e8d0a0"},
    shoulder_r:  {parent:"chest",    off:[.2,.05,0],  geo:[.08,.08,.08],  col:"#d4af37"},
    upper_arm_r: {parent:"shoulder_r",off:[.18,0,0],  geo:[.07,.22,.07],  col:"#c49a20"},
    forearm_r:   {parent:"upper_arm_r",off:[.22,0,0], geo:[.06,.2,.06],   col:"#d4af37"},
    hand_r:      {parent:"forearm_r",off:[.2,0,0],   geo:[.07,.09,.04],  col:"#e8d0a0"},
    thigh_l:     {parent:"root",     off:[-.11,-.3,0],geo:[.08,.35,.08],  col:"#303888"},
    shin_l:      {parent:"thigh_l",  off:[0,-.35,0], geo:[.07,.33,.07],  col:"#282d80"},
    foot_l:      {parent:"shin_l",   off:[0,-.33,.05],geo:[.08,.06,.15],  col:"#e8d0a0"},
    thigh_r:     {parent:"root",     off:[.11,-.3,0], geo:[.08,.35,.08],  col:"#303888"},
    shin_r:      {parent:"thigh_r",  off:[0,-.35,0], geo:[.07,.33,.07],  col:"#282d80"},
    foot_r:      {parent:"shin_r",   off:[0,-.33,.05],geo:[.08,.06,.15],  col:"#e8d0a0"},
  };

  function makeBone(name, def) {
    const group = new THREE.Group();
    group.position.set(...def.off);
    const [w,h,d] = def.geo;
    const mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(w/2, h, 4, 8),
      new THREE.MeshStandardMaterial({ color: def.col, roughness: 0.45, metalness: 0.15,
        emissive: def.col, emissiveIntensity: 0.08 })
    );
    mesh.rotation.z = (def.off[0] !== 0 && def.off[1] === 0) ? Math.PI/2 : 0;
    group.add(mesh);
    boneGroups[name] = group;
    return group;
  }

  const roots = {};
  for (const [name, def] of Object.entries(BONE_DEFS)) {
    const bone = makeBone(name, def);
    roots[name] = bone;
  }
  for (const [name, def] of Object.entries(BONE_DEFS)) {
    if (def.parent) roots[def.parent].add(roots[name]);
    else aiAvatarRoot.add(roots[name]);
  }

  // AI etrafında ince altın halka (gösterge)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.32, 32),
    new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI/2;
  ring.position.y = -0.88;
  aiAvatarRoot.add(ring);

  scene.add(aiAvatarRoot);
}

function applyAIPose(aiState) {
  if (!aiAvatarRoot) return;
  if (aiState.position) aiAvatarRoot.position.set(aiState.position[0], 0, aiState.position[2]);
  if (aiState.pose) {
    for (const [bone, rot] of Object.entries(aiState.pose)) {
      const bg = boneGroups[bone];
      if (bg) bg.rotation.set(rot[0], rot[1], rot[2]);
    }
  }
}

// ── Diğer Oyuncular ───────────────────────────────────────────────────
function getOrCreateAvatar(id, name, color) {
  let av = remoteAvatars[id];
  if (av) return av;
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 4, 8), mat);
  body.position.y = -0.45; group.add(body);
  group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), mat));

  // İsim sprite
  const c2 = document.createElement("canvas"); c2.width=256;c2.height=64;
  const ctx=c2.getContext("2d");
  ctx.fillStyle="rgba(10,10,12,.6)"; ctx.fillRect(0,0,256,64);
  ctx.font="600 28px monospace"; ctx.fillStyle=color;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(name.slice(0,14), 128, 34);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c2),transparent:true,depthWrite:false}));
  spr.scale.set(.9,.22,1); spr.position.y=.28; group.add(spr);

  scene.add(group);
  av = { group, lastSeen: performance.now() };
  remoteAvatars[id] = av;
  return av;
}

function updateRemoteAvatars() {
  const now = performance.now();
  const seen = new Set();
  for (const [id, state] of Object.entries(remotePlayerStates)) {
    if (id === myPlayerId) continue;
    if (!state?.head?.pos || !state?.head?.quat) continue;
    seen.add(id);
    const av = getOrCreateAvatar(id, state.name||"Oyuncu", state.color||"#d4af37");
    const [px,,pz] = state.head.pos;
    av.group.position.set(px, PLAYER_H - 0.05, pz);
    av.group.quaternion.set(...state.head.quat);
    av.lastSeen = now;
  }
  for (const id of Object.keys(remoteAvatars)) {
    if (!seen.has(id) && now - remoteAvatars[id].lastSeen > PLAYER_TIMEOUT_MS) {
      removeRemoteAvatar(id);
    }
  }
  hudPlayers.textContent = seen.size + 1;
}

function removeRemoteAvatar(id) {
  if (remoteAvatars[id]) { scene.remove(remoteAvatars[id].group); delete remoteAvatars[id]; }
}

// ── El Takibi (MediaPipe verisi) ──────────────────────────────────────
function updateHandCursors() {
  for (let i=0;i<2;i++) {
    const hand = latestHands[i];
    if (!hand || !Array.isArray(hand.landmarks) || hand.landmarks.length < 9) {
      handCursors[i].visible = false; continue;
    }
    const tip = hand.landmarks[8], wrist = hand.landmarks[0];
    const rawZ = tip[2] - wrist[2];
    const td = DEPTH_BASE - THREE.MathUtils.clamp(rawZ*4,-1,1)*DEPTH_RANGE;
    _smoothedDepth[i] = THREE.MathUtils.lerp(td, _smoothedDepth[i], DEPTH_SMOOTH);
    const local = new THREE.Vector3((tip[0]-.5)*REACH_W, (.5-tip[1])*REACH_H, _smoothedDepth[i]);
    local.applyQuaternion(camera.quaternion).add(camera.position);
    handCursors[i].position.copy(local);
    handCursors[i].visible = true;
    handCursors[i].material.emissiveIntensity = hand.pinching ? 1.8 : 0.9;
    handCursors[i].scale.setScalar(hand.pinching ? 1.8 : 1.0);
    handCursors[i].children[0]?.lookAt(camera.position);
    _handWorldPos[i].copy(local);
  }
}

// ── Yürüme (koşu hareketi) ────────────────────────────────────────────
function updateLocomotion(dt) {
  if (dt <= 0) return;
  let raw = 0;
  for (let i=0;i<2;i++) {
    const h = latestHands[i];
    if (!h || !h.landmarks?.length) { _prevWristY[i]=null; continue; }
    const wy = h.landmarks[0][1];
    if (_prevWristY[i] !== null) raw += Math.abs(wy - _prevWristY[i]) / dt;
    _prevWristY[i] = wy;
  }
  runEnergy = THREE.MathUtils.lerp(raw, runEnergy, RUN_SMOOTH);
  currentSpeed = THREE.MathUtils.clamp((runEnergy-RUN_THRESH)*RUN_GAIN, 0, MAX_SPEED);
  if (currentSpeed > 0.02) {
    _fw.set(0,0,-1).applyQuaternion(camera.quaternion); _fw.y=0;
    if (_fw.lengthSq()>0.0001) { _fw.normalize(); camera.position.addScaledVector(_fw, currentSpeed*dt); }
  }
  if (mapBounds) {
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, mapBounds.min.x+MAP_MARGIN, mapBounds.max.x-MAP_MARGIN);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, mapBounds.min.z+MAP_MARGIN, mapBounds.max.z-MAP_MARGIN);
  }
  camera.position.y = PLAYER_H;
}

// ── Dokunma Tespiti ───────────────────────────────────────────────────
function checkTouches() {
  let hit = null;
  for (let i=0;i<2;i++) {
    const h = latestHands[i];
    if (!h?.pinching) continue;
    for (const obj of touchableObjects) {
      if (_handWorldPos[i].distanceTo(obj.worldCenter) < obj.radius) { hit = obj; break; }
    }
    if (hit) break;
  }
  if (hit && hit.name !== lastTouchedName) {
    spawnFlash(hit.worldCenter);
    lastTouchedName = hit.name; lastTouchedAt = performance.now();
    hudTouch.textContent = `DOKUNULDU: ${hit.name.slice(0,20)}`;
    sendWS({ type: "interact", target: hit.name, action: "touch" });
  } else if (!hit) lastTouchedName = null;
}

function spawnFlash(pos) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(.05,.08,24),
    new THREE.MeshBasicMaterial({color:0xd4af37,transparent:true,opacity:.9,side:THREE.DoubleSide})
  );
  m.position.copy(pos); m.lookAt(camera.position); m.userData.born = performance.now();
  touchFlashGroup.add(m);
}

function updateFlashes() {
  const now = performance.now();
  for (let i=touchFlashGroup.children.length-1;i>=0;i--) {
    const m = touchFlashGroup.children[i];
    const age = (now - m.userData.born) / 600;
    if (age >= 1) { touchFlashGroup.remove(m); continue; }
    m.scale.setScalar(1+age*6); m.material.opacity = .9*(1-age);
  }
}

// ── Jiroskop ─────────────────────────────────────────────────────────
const _q1 = new THREE.Quaternion(-Math.sqrt(.5),0,0,Math.sqrt(.5));
const _zee = new THREE.Vector3(0,0,1), _q0 = new THREE.Quaternion();
const _euler = new THREE.Euler();

function initOrientation() {
  window.addEventListener("orientationchange", ()=>{ screenOrient = window.orientation||0; });
  window.addEventListener("deviceorientation", e=>{
    if (e.alpha===null) return;
    lastOrientAt = performance.now();
    _euler.set(THREE.MathUtils.degToRad(e.beta), THREE.MathUtils.degToRad(e.alpha),
               -THREE.MathUtils.degToRad(e.gamma), "YXZ");
    deviceQuat.setFromEuler(_euler).multiply(_q1)
              .multiply(_q0.setFromAxisAngle(_zee, -THREE.MathUtils.degToRad(screenOrient)));
  });
}

async function requestMotionPerm() {
  if (typeof DeviceOrientationEvent!=="undefined" && typeof DeviceOrientationEvent.requestPermission==="function") {
    return (await DeviceOrientationEvent.requestPermission().catch(()=>"denied")) === "granted";
  }
  return true;
}

// ── AI Konuşma ────────────────────────────────────────────────────────
let speechTimer = null;
function showAISpeech(text, dur) {
  if (!text) { aiSpeechEl.classList.remove("show"); return; }
  aiSpeechEl.textContent = text;
  aiSpeechEl.classList.add("show");
  if (speechTimer) clearTimeout(speechTimer);
  speechTimer = setTimeout(()=>aiSpeechEl.classList.remove("show"), (dur||4)*1000);
}

// ── Tanı (Jiroskop uyarısı) ───────────────────────────────────────────
function updateDiag() {
  if (!vrContainer.classList.contains("active")) return;
  const sinceEnter = performance.now() - vrEnteredAt;
  const sinceOrient = performance.now() - lastOrientAt;
  if (sinceEnter > 2500 && sinceOrient > 2500) {
    hudWarning.textContent = "JİROSKOP YOK — HTTPS üzerinden aç ve hareket iznini ver.";
    hudWarning.classList.add("show");
  } else if (!socketReady) {
    hudWarning.textContent = "SUNUCU BAĞLANTISI YOK";
    hudWarning.classList.add("show");
  } else {
    hudWarning.classList.remove("show");
  }
}

// ── Saat Gösterge ─────────────────────────────────────────────────────
function updateClockHUD(h) {
  const hh = String(Math.floor(h)).padStart(2,"0");
  const mm = String(Math.floor((h%1)*60)).padStart(2,"0");
  hudClock.textContent = `${hh}:${mm}`;
}

// ── Yağmur Animasyonu ─────────────────────────────────────────────────
function animateRain(dt) {
  if (!rainGroup) return;
  const pos = rainGroup.geometry.attributes.position;
  for (let i=0;i<pos.count;i++) {
    pos.setY(i, pos.getY(i) - dt*6);
    if (pos.getY(i) < 0) pos.setY(i, 10);
  }
  pos.needsUpdate = true;
}

// ── Sahne Başlatma ────────────────────────────────────────────────────
function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  scene = new THREE.Scene();
  scene.background = buildSkyCanvas();
  scene.fog = new THREE.Fog(0x9fb8d6, 22, 70);

  camera = new THREE.PerspectiveCamera(70, 1, 0.05, 150);
  camera.position.set(0, PLAYER_H, 0);
  stereoCam = new THREE.StereoCamera();
  stereoCam.aspect = 0.5; stereoCam.eyeSep = 0.064;

  // Işıklandırma
  scene.add(new THREE.HemisphereLight(0xbfd6ff, 0x6b5a45, 1.2));
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  sunLight = new THREE.DirectionalLight(0xfff0d0, 2.4);
  sunLight.position.set(-40, 28, -50); scene.add(sunLight);
  scene.add(new THREE.DirectionalLight(0x6f8fd6, 0.3).translateX(8).translateY(4));

  // Güneş diski + glow
  const sGeo = new THREE.SphereGeometry(2.5, 20, 20);
  const sMat = new THREE.MeshBasicMaterial({ color: 0xfff5cc, fog: false });
  sunMesh = new THREE.Mesh(sGeo, sMat); scene.add(sunMesh);
  const gCanvas = document.createElement("canvas"); gCanvas.width=gCanvas.height=256;
  const gCtx = gCanvas.getContext("2d");
  const rg = gCtx.createRadialGradient(128,128,0,128,128,128);
  rg.addColorStop(0,"rgba(255,244,214,.92)"); rg.addColorStop(.4,"rgba(255,220,160,.3)"); rg.addColorStop(1,"rgba(255,220,160,0)");
  gCtx.fillStyle=rg; gCtx.fillRect(0,0,256,256);
  sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(gCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  sunGlow.scale.set(35,35,1); scene.add(sunGlow);

  createStars();

  // Grid
  const grid = new THREE.GridHelper(60, 60, 0xd4af37, 0x55585f);
  grid.position.y = 0.01; scene.add(grid);

  // El imleçleri
  for (let i=0;i<2;i++) {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(.048, 1),
      new THREE.MeshStandardMaterial({ color:0xd4af37, emissive:0xd4af37, emissiveIntensity:.9, roughness:.25 })
    );
    m.visible = false;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(.065,.082,24),
      new THREE.MeshBasicMaterial({color:0xd4af37,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false})
    );
    m.add(ring); scene.add(m); handCursors.push(m);
  }
  touchFlashGroup = new THREE.Group(); scene.add(touchFlashGroup);

  buildAIAvatar();

  // Modeller
  const loader = new GLTFLoader();
  loader.load("assets/harita.glb", gltf => {
    const mg = new THREE.Group(); mg.add(gltf.scene);
    gltf.scene.traverse(c => { if (c.isMesh) { c.material.roughness=.85; c.material.metalness=.05; } });
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    mg.scale.setScalar(SCENE_SCALE);
    mg.position.set(-center.x*SCENE_SCALE, -box.min.y*SCENE_SCALE, -center.z*SCENE_SCALE);
    scene.add(mg);
    mapBounds = new THREE.Box3().setFromObject(mg);
    fetch("assets/harita_objects.json").then(r=>r.json()).then(objs=>{
      touchableObjects = Object.entries(objs).map(([name,o])=>({
        name,
        worldCenter: new THREE.Vector3(o.center[0],o.center[1],o.center[2]).multiplyScalar(SCENE_SCALE).add(mg.position),
        radius: Math.max(TOUCH_R, Math.max(...o.size)*SCENE_SCALE*.5),
      }));
    }).catch(()=>{});
  }, undefined, e=>console.error("harita.glb", e));

  loader.load("assets/karakter.glb", gltf => {
    gltf.scene.position.set(0,0,-2.2); gltf.scene.rotation.y=Math.PI; scene.add(gltf.scene);
  }, undefined, ()=>{});

  initOrientation();
  window.addEventListener("resize", onResize);
  onResize();
}

function onResize() {
  const w=window.innerWidth, h=window.innerHeight;
  renderer.setSize(w,h);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}

// ── Render Döngüsü ────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  camera.quaternion.copy(deviceQuat);

  // Gece/gündüz güncelle
  updateSkyForTime(worldSkyTime);
  updateSunPosition(worldSkyTime);
  updateClockHUD(worldSkyTime);

  updateLocomotion(dt);
  updateHandCursors();
  updateRemoteAvatars();
  checkTouches();
  updateFlashes();
  animateRain(dt);

  stereoCam.update(camera);
  const w=window.innerWidth, h=window.innerHeight;
  renderer.setScissorTest(true);
  renderer.setViewport(0,0,w/2,h); renderer.setScissor(0,0,w/2,h);
  renderer.render(scene, stereoCam.cameraL);
  renderer.setViewport(w/2,0,w/2,h); renderer.setScissor(w/2,0,w/2,h);
  renderer.render(scene, stereoCam.cameraR);
  renderer.setScissorTest(false);

  // HUD
  frameCount++; fpsAccum+=dt; fpsTimer+=dt;
  if (fpsTimer > .4) {
    hudFps.textContent = Math.round(frameCount/fpsAccum);
    frameCount=0; fpsAccum=0; fpsTimer=0;
  }
  hudHands.textContent  = latestHands.length;
  hudSpeed.textContent  = currentSpeed.toFixed(1);
  if (lastTouchedName && performance.now()-lastTouchedAt>1500) hudTouch.textContent="—";
  updateDiag();
}

// ═══════════════════════════════════════════════════════ TERMINAL ════
function termLog(type, text) {
  const div = document.createElement("div");
  div.className = `t-${type}`;
  div.textContent = text;
  termOutput.appendChild(div);
  termOutput.scrollTop = termOutput.scrollHeight;
  // Max 200 satır
  while (termOutput.children.length > 200) termOutput.removeChild(termOutput.firstChild);
}

function sendTerminal() {
  const txt = termInput.value.trim();
  if (!txt) return;
  termInput.value = "";
  termLog("cmd", `> ${txt}`);
  if (socketReady) {
    sendWS({ type: "command", text: txt });
  } else {
    termLog("err", "Sunucuya bağlı değilsiniz.");
  }
}

termSend.addEventListener("click", sendTerminal);
termInput.addEventListener("keydown", e => { if (e.key === "Enter") sendTerminal(); });

termToggle.addEventListener("click", () => {
  const expanded = termPanel.classList.toggle("expanded");
  termPanel.classList.toggle("collapsed", !expanded);
  termChevron.textContent = expanded ? "▼" : "▲";
});

// ═══════════════════════════════════════════════════════ VR GİRİŞ ═══
btnEnterVR.addEventListener("click", async () => {
  const granted = await requestMotionPerm();
  if (!granted) { alert("Hareket sensörü izni verilmedi."); return; }
  initMediaPipe();  // kamera erişimi VR girişinde başlat
  setupScreen.style.display = "none";
  vrContainer.classList.add("active");
  vrEnteredAt = performance.now();
  if (vrContainer.requestFullscreen) vrContainer.requestFullscreen().catch(()=>{});
  if (screen.orientation?.lock) screen.orientation.lock("landscape").catch(()=>{});
  onResize();
  termLog("sys", "VR modu aktif. Terminal için alttaki çubuğa dokun.");
  termLog("ai", "Komut örnekleri: /sky 22  /spawn tree  /anim wave_r  /weather rain  ls -la");
});

btnExitVR.addEventListener("click", () => {
  vrContainer.classList.remove("active");
  setupScreen.style.display = "flex";
  if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
});

// ═══════════════════════════════════════════════════════ BAŞLAT ═════
initScene();
animate();
termLog("sys", "TuncerLab World AI v3.0 yüklendi.");
termLog("ai", "AI eğitimi için: cd server && python train.py --use-api");
