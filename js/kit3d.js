// Camisa + short 3D gerados por código, pintados em tempo real via CanvasTexture.
import * as THREE from 'three';

export const DEFAULT_KIT = {
  body: '#111111', sleeve: '#111111', collar: '#ff6a00', detail: '#ff6a00',
  pattern: 'diagonal', patternColor: '#ff6a00',
  name: 'ESTAMP', number: '10', textColor: '#ffffff', font: 'Teko',
  shortsColor: '#111111', shortsDetail: '#ff6a00',
  logo: null, logoPos: 'peito', sponsor: '',
};

// raio do tronco por altura (pontos-chave), amostrado de forma uniforme para o UV ficar linear
const TORSO = [[-1.25, 0.97], [-0.8, 0.99], [-0.2, 0.95], [0.3, 0.98], [0.7, 1.02], [0.9, 0.97], [1.03, 0.78], [1.12, 0.5], [1.17, 0.38]];
function radiusAt(y) {
  for (let i = 0; i < TORSO.length - 1; i++) {
    const [y0, r0] = TORSO[i], [y1, r1] = TORSO[i + 1];
    if (y >= y0 && y <= y1) { const t = (y - y0) / (y1 - y0); return r0 + (r1 - r0) * (t * t * (3 - 2 * t)); }
  }
  return TORSO[TORSO.length - 1][1];
}

function canvasTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return { c, ctx: c.getContext('2d'), t };
}

function mat(map, color) {
  return new THREE.MeshStandardMaterial({ map: map || null, color: color || 0xffffff, roughness: 0.78, metalness: 0.02, side: THREE.DoubleSide });
}

export function createKit({ shorts = true } = {}) {
  const group = new THREE.Group();
  const shirt = canvasTex(2048, 1024);
  const shortsTex = canvasTex(1024, 512);
  const legTex = canvasTex(1024, 512); // perna sem número

  // tronco (lathe: u=0.25 frente, u=0.75 costas)
  const pts = [];
  const N = 48;
  for (let i = 0; i <= N; i++) { const y = -1.25 + (i / N) * 2.42; pts.push(new THREE.Vector2(radiusAt(y), y)); }
  const torsoGeo = new THREE.LatheGeometry(pts, 96, -Math.PI / 2, Math.PI * 2);
  const torso = new THREE.Mesh(torsoGeo, mat(shirt.t));
  torso.scale.z = 0.58;
  group.add(torso);

  const collarMat = mat(null, 0xff6a00);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.055, 16, 64), collarMat);
  collar.rotation.x = Math.PI / 2; collar.position.y = 1.16; collar.scale.y = 0.58;
  group.add(collar);

  const sleeveMat = mat(null, 0x111111);
  const cuffMat = mat(null, 0xff6a00);
  for (const s of [1, -1]) {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.95, 40, 1, true), sleeveMat);
    sleeve.position.set(1.18 * s, 0.6, 0); sleeve.rotation.z = 0.95 * s; sleeve.scale.z = 0.72;
    group.add(sleeve);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.41, 0.08, 40, 1, true), cuffMat);
    cuff.position.set((1.18 + Math.sin(0.95) * 0.44) * s, 0.6 - Math.cos(0.95) * 0.44, 0);
    cuff.rotation.z = 0.95 * s; cuff.scale.z = 0.72;
    group.add(cuff);
  }

  let shortsGroup = null;
  if (shorts) {
    shortsGroup = new THREE.Group();
    const sMat = mat(shortsTex.t);
    const plainMat = mat(legTex.t);
    const wpts = [];
    for (let i = 0; i <= 12; i++) { const y = -1.95 + (i / 12) * 0.75; wpts.push(new THREE.Vector2(0.92 + (y + 1.95) * 0.04, y)); }
    const waist = new THREE.Mesh(new THREE.LatheGeometry(wpts, 80, -Math.PI / 2), plainMat);
    waist.scale.z = 0.6; shortsGroup.add(waist);
    for (const s of [1, -1]) {
      // número em uma perna só, como nos uniformes reais
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.56, 0.85, 48, 1, true), s === -1 ? sMat : plainMat);
      leg.position.set(0.45 * s, -2.3, 0); leg.rotation.z = -0.07 * s; leg.scale.z = 0.95;
      shortsGroup.add(leg);
    }
    shortsGroup.position.y = 0;
    group.add(shortsGroup);
  }

  const kit = { group, torso, shortsGroup, state: { ...DEFAULT_KIT } };
  kit.paint = (opts = {}) => {
    Object.assign(kit.state, opts);
    const s = kit.state;
    paintShirt(shirt.ctx, s);
    shirt.t.needsUpdate = true;
    sleeveMat.color.set(s.sleeve);
    collarMat.color.set(s.collar);
    cuffMat.color.set(s.detail);
    if (shorts) {
      paintShorts(shortsTex.ctx, s); shortsTex.t.needsUpdate = true;
      paintShorts(legTex.ctx, { ...s, number: '' }); legTex.t.needsUpdate = true;
    }
  };
  kit.paint();
  return kit;
}

function paintShirt(g, s) {
  const W = g.canvas.width, H = g.canvas.height;
  g.save();
  g.fillStyle = s.body; g.fillRect(0, 0, W, H);
  g.fillStyle = s.patternColor; g.strokeStyle = s.patternColor;
  switch (s.pattern) {
    case 'listras':
      for (let x = 0; x < W; x += 140) g.fillRect(x, 0, 56, H);
      break;
    case 'horizontal':
      for (let y = 60; y < H; y += 150) g.fillRect(0, y, W, 60);
      break;
    case 'degrade': {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, s.body); gr.addColorStop(1, s.patternColor);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      break;
    }
    case 'diagonal':
      for (const cx of [W * 0.25, W * 0.75]) {
        g.beginPath();
        g.moveTo(cx + 260, 0); g.lineTo(cx + 420, 0); g.lineTo(cx - 260, H); g.lineTo(cx - 420, H); g.closePath(); g.fill();
      }
      break;
    case 'lateral':
      g.fillRect(0, 0, W * 0.07, H); g.fillRect(W * 0.43, 0, W * 0.14, H); g.fillRect(W * 0.93, 0, W * 0.07, H);
      break;
    case 'geometrico': {
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      g.globalAlpha = 0.85;
      for (let i = 0; i < 90; i++) {
        const x = rnd() * W, y = rnd() * H, r = 30 + rnd() * 110;
        g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y + r * 0.7); g.lineTo(x - r, y + r * 0.7); g.closePath();
        g.globalAlpha = 0.25 + rnd() * 0.6; g.fill();
      }
      g.globalAlpha = 1;
      break;
    }
    case 'camuflado': {
      let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 160; i++) {
        g.globalAlpha = 0.35 + rnd() * 0.5;
        g.beginPath(); g.ellipse(rnd() * W, rnd() * H, 30 + rnd() * 90, 18 + rnd() * 50, rnd() * 3, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
      break;
    }
  }
  // barra
  g.fillStyle = s.detail; g.fillRect(0, H - 26, W, 26);

  const font = (px) => `700 ${px}px "${s.font}", "Krona One", sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round';
  const textWithOutline = (txt, x, y, px) => {
    g.font = font(px);
    g.lineWidth = px * 0.08; g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeText(txt, x, y);
    g.fillStyle = s.textColor; g.fillText(txt, x, y);
  };

  // FRENTE (u=0.25): escudo/logo no peito esquerdo, número pequeno à direita, patrocinador no centro
  const fx = W * 0.25;
  if (s.logo && s.logoPos === 'peito') drawImageFit(g, s.logo, fx + 120, H * 0.26, 150);
  if (s.logo && s.logoPos === 'centro') drawImageFit(g, s.logo, fx, H * 0.42, 300);
  if (!s.logo) drawBadge(g, fx + 120, H * 0.26, s);
  if (s.number) textWithOutline(String(s.number).slice(0, 3), fx - 120, H * 0.26, 110);
  if (s.sponsor) textWithOutline(s.sponsor.toUpperCase().slice(0, 14), fx, H * 0.5, 84);

  // COSTAS (u=0.75): nome + número grande
  const bx = W * 0.75;
  if (s.logo && s.logoPos === 'costas') drawImageFit(g, s.logo, bx, H * 0.12, 120);
  if (s.name) textWithOutline(s.name.toUpperCase().slice(0, 14), bx, H * 0.24, 96);
  if (s.number) textWithOutline(String(s.number).slice(0, 3), bx, H * 0.5, 330);
  g.restore();
}

function drawBadge(g, x, y, s) {
  g.save();
  g.beginPath(); g.arc(x, y, 62, 0, Math.PI * 2);
  g.fillStyle = s.detail; g.fill();
  g.lineWidth = 8; g.strokeStyle = s.textColor; g.stroke();
  g.fillStyle = s.body; g.font = '700 70px "Krona One", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('E', x, y + 4);
  g.restore();
}

function drawImageFit(g, img, cx, cy, size) {
  const r = Math.min(size / img.width, size / img.height);
  const w = img.width * r, h = img.height * r;
  g.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

function paintShorts(g, s) {
  const W = g.canvas.width, H = g.canvas.height;
  g.fillStyle = s.shortsColor; g.fillRect(0, 0, W, H);
  g.fillStyle = s.shortsDetail;
  // faixas laterais (u=0 e u=0.5 no cós; nas pernas os lados externos)
  for (const u of [0, 0.25, 0.5, 0.75, 1]) g.fillRect(u * W - 22, 0, 44, H);
  g.fillRect(0, 0, W, 34); // cós
  if (s.number) {
    g.font = `700 120px "${s.font}", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = s.textColor; g.fillText(String(s.number).slice(0, 3), W * 0.12, H * 0.62);
  }
}

// Cena pronta com câmera, luzes e renderer
export function createStage(canvas, { fov = 32, z = 8.5, alpha = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 0, z);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7a1a, 2.4); rim.position.set(-4, 2, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.8); fill.position.set(-3, -1, 4); scene.add(fill);
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas); resize();
  return { renderer, scene, camera, THREE };
}
