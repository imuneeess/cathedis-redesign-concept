// Shared Three.js helpers for the Cathedis concept
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE, RoundedBoxGeometry };
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const COLORS = {
  // Red & white: swap brand for the exact official Cathedis red if you have it.
  brand: 0xe30613, brand2: 0xb00010, ink: 0x1c1c1c, grey: 0xd9d9d9,
  card: 0xf7f7f7, white: 0xffffff,
};

/** Renderer + scene + camera bound to a canvas, with resize, smoothed mouse and offscreen pausing. */
export function createStage(canvas, { camPos = [0, 4, 10], fov = 40, shadows = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  camera.position.set(...camPos);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
  });

  const size = { w: 1, h: 1 };
  const resize = () => {
    size.w = canvas.clientWidth || 1;
    size.h = canvas.clientHeight || 1;
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);

  const clock = new THREE.Clock();
  const loop = (update) => {
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!visible || document.hidden) return;
      const t = clock.elapsedTime * (reduceMotion ? 0.2 : 1);
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      update(t, dt, mouse);
      renderer.render(scene, camera);
    });
  };
  return { renderer, scene, camera, mouse, size, loop };
}

export function addLights(scene, { shadowSize = 8 } = {}) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e6e6, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(5, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  Object.assign(sun.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: 1, far: 40 });
  scene.add(sun);
  return sun;
}

export function shadowFloor(size = 40, opacity = 0.12) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity, color: 0x000000 }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

// ---------- Canvas textures ----------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function cardboard(ctx, w, h) {
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.025})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1);
  }
}

const sideTex = () => canvasTex(512, 384, (ctx, w, h) => {
  cardboard(ctx, w, h);
  // shipping label
  ctx.fillStyle = '#fff';
  ctx.fillRect(40, 60, 250, 170);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 60, 250, 170);
  ctx.fillStyle = '#e30613';
  ctx.fillRect(40, 60, 250, 46);
  ctx.fillStyle = '#fff';
  ctx.font = '800 30px "Bricolage Grotesque", sans-serif';
  ctx.fillText('CATHEDIS', 56, 94);
  ctx.fillStyle = '#1c1c1c';
  for (let i = 0; i < 26; i++) ctx.fillRect(56 + i * 8, 124, i % 3 ? 3 : 5, 56);
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillText('CTH-2026-MA-0007', 56, 210);
  // arrows "this side up"
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 6;
  [370, 420].forEach((x) => {
    ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x, 80); ctx.moveTo(x - 16, 98); ctx.lineTo(x, 80); ctx.lineTo(x + 16, 98); ctx.stroke();
  });
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(350, 160, 90, 6);
  // tape
  ctx.fillStyle = '#e30613';
  ctx.fillRect(w / 2 - 34, 0, 68, 40);
});

const topTex = () => canvasTex(512, 512, (ctx, w, h) => {
  cardboard(ctx, w, h);
  ctx.fillStyle = '#e30613';
  ctx.fillRect(w / 2 - 40, 0, 80, h);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 26px "Bricolage Grotesque", sans-serif';
  ctx.save(); ctx.translate(w / 2 + 9, h / 2 + 70); ctx.rotate(-Math.PI / 2); ctx.fillText('CATHEDIS', 0, 0); ctx.restore();
});

export function labelSprite(text, { bg = '#1c1c1c', fg = '#ffffff', scale = 1 } = {}) {
  const tex = canvasTex(512, 128, (ctx) => {
    ctx.font = '700 54px "Bricolage Grotesque", sans-serif';
    const w = ctx.measureText(text).width + 60;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect((512 - w) / 2, 20, w, 88, 44);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 66);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(2 * scale, 0.5 * scale, 1);
  s.renderOrder = 10;
  return s;
}

// ---------- Parcel ----------
let _side, _top;
/** A cardboard parcel. With { flaps: true } it has 4 hinged top flaps (userData.setOpen(0..1)). */
export function createParcel({ size = [1.2, 0.9, 0.9], flaps = false } = {}) {
  _side ??= sideTex();
  _top ??= topTex();
  const [w, h, d] = size;
  const side = new THREE.MeshStandardMaterial({ map: _side, roughness: 0.85 });
  const plain = new THREE.MeshStandardMaterial({ color: COLORS.card, roughness: 0.9 });
  const top = new THREE.MeshStandardMaterial({ map: _top, roughness: 0.85 });
  const inner = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 1 });
  const group = new THREE.Group();
  // material order: +x, -x, +y, -y, +z, -z
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.03), [plain, plain, flaps ? inner : top, plain, side, side]);
  body.castShadow = true;
  body.receiveShadow = true;
  body.position.y = h / 2;
  group.add(body);

  if (flaps) {
    const flapMat = new THREE.MeshStandardMaterial({ color: COLORS.card, roughness: 0.85, side: THREE.DoubleSide });
    const mk = (fw, fd, px, pz, axis, sign) => {
      const pivot = new THREE.Group();
      pivot.position.set(px, h, pz);
      const flap = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.02, fd), flapMat);
      flap.castShadow = true;
      if (axis === 'x') flap.position.z = (sign * fd) / 2; else flap.position.x = (sign * fw) / 2;
      pivot.add(flap);
      pivot.userData = { axis, sign };
      group.add(pivot);
      return pivot;
    };
    const fl = [
      mk(w, d / 2, 0, -d / 2, 'x', 1), mk(w, d / 2, 0, d / 2, 'x', -1),
      mk(w / 2, d, -w / 2, 0, 'z', 1), mk(w / 2, d, w / 2, 0, 'z', -1),
    ];
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, d + 0.02), new THREE.MeshStandardMaterial({ color: COLORS.brand, roughness: 0.4 }));
    tape.position.y = h + 0.03;
    tape.scale.z = 0.001;
    group.add(tape);
    group.userData.setOpen = (o, tapeAmt = 0) => {
      // o: 1 = fully open, 0 = closed. Side flaps close first, then front/back.
      const a = THREE.MathUtils.clamp(o * 2 - 1, 0, 1); // x flaps (front/back)
      const b = THREE.MathUtils.clamp(o * 2, 0, 1); // z flaps (sides)
      fl.forEach((p, i) => {
        const open = i < 2 ? a : b;
        const ang = open * 2.1 * -p.userData.sign;
        if (p.userData.axis === 'x') p.rotation.x = ang; else p.rotation.z = -ang;
        p.position.y = h + (i < 2 ? 0.012 : 0);
      });
      tape.scale.z = Math.max(tapeAmt, 0.001);
      tape.visible = tapeAmt > 0.01;
    };
    group.userData.setOpen(1);
  }
  return group;
}

// ---------- Delivery van ----------
export function createVan() {
  const van = new THREE.Group();
  const brand = new THREE.MeshStandardMaterial({ color: COLORS.brand, roughness: 0.45, metalness: 0.1 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.15, metalness: 0.6 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x1a1f2e, roughness: 0.9 });
  const rim = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.3 });

  const sideTexture = canvasTex(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e30613'; ctx.fillRect(0, h - 150, w, 150);
    ctx.fillStyle = '#e30613';
    ctx.font = '800 150px "Bricolage Grotesque", sans-serif';
    ctx.fillText('CATHEDIS', 70, 250);
    ctx.font = '600 44px Inter, sans-serif';
    ctx.fillStyle = '#6e6e6e';
    ctx.fillText('Livraison partout au Maroc', 76, 320);
  });
  const cargoSide = new THREE.MeshStandardMaterial({ map: sideTexture, roughness: 0.5 });
  const cargoSideFlip = cargoSide.clone();
  cargoSideFlip.map = sideTexture.clone();
  cargoSideFlip.map.wrapS = THREE.RepeatWrapping;
  cargoSideFlip.map.repeat.x = -1;

  const cargo = new THREE.Mesh(new RoundedBoxGeometry(2.6, 1.6, 1.5, 4, 0.12), [white, white, white, white, cargoSide, cargoSideFlip]);
  cargo.position.set(-0.4, 1.25, 0);
  const cab = new THREE.Mesh(new RoundedBoxGeometry(1.2, 1.25, 1.46, 4, 0.2), brand);
  cab.position.set(1.45, 1.05, 0);
  const wind = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.55, 1.3, 2, 0.04), glass);
  wind.position.set(2.02, 1.35, 0);
  wind.rotation.z = -0.25;
  const sideWin = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.45, 1.5, 2, 0.04), glass);
  sideWin.position.set(1.5, 1.38, 0);
  const bumper = new THREE.Mesh(new RoundedBoxGeometry(0.25, 0.25, 1.5, 2, 0.08), new THREE.MeshStandardMaterial({ color: 0x2b2b2b }));
  bumper.position.set(2.05, 0.55, 0);
  const lightL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xffffff, emissiveIntensity: 1.2 }));
  lightL.position.set(2.06, 0.85, 0.52);
  const lightR = lightL.clone(); lightR.position.z = -0.52;
  van.add(cargo, cab, wind, sideWin, bumper, lightL, lightR);

  const wheels = [];
  [[-1.1, 0.75], [-1.1, -0.75], [1.3, 0.75], [1.3, -0.75]].forEach(([x, z]) => {
    const wg = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24), tire);
    t.rotation.x = Math.PI / 2;
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16), rim);
    r.rotation.x = Math.PI / 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.31), rim);
    wg.add(t, r, spoke);
    wg.position.set(x, 0.38, z);
    van.add(wg);
    wheels.push(wg);
  });
  van.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  van.userData.spin = (amount) => wheels.forEach((w) => (w.rotation.z -= amount));
  return van;
}

// ---------- Morocco city network ----------
// Sample data for the concept: replace delivery times with official figures.
export const CITIES = [
  { name: 'Casablanca', lat: 33.57, lon: -7.59, eta: 'Same day', relays: 42, hub: true },
  { name: 'Rabat', lat: 34.02, lon: -6.84, eta: '24h', relays: 28 },
  { name: 'Tanger', lat: 35.76, lon: -5.83, eta: '24h', relays: 22 },
  { name: 'Tétouan', lat: 35.57, lon: -5.37, eta: '24–48h', relays: 12 },
  { name: 'Fès', lat: 34.03, lon: -5.0, eta: '24h', relays: 20 },
  { name: 'Meknès', lat: 33.9, lon: -5.55, eta: '24h', relays: 14 },
  { name: 'Oujda', lat: 34.68, lon: -1.91, eta: '48h', relays: 10 },
  { name: 'Nador', lat: 35.17, lon: -2.93, eta: '48h', relays: 8 },
  { name: 'Kénitra', lat: 34.26, lon: -6.58, eta: '24h', relays: 11 },
  { name: 'El Jadida', lat: 33.25, lon: -8.5, eta: '24h', relays: 9 },
  { name: 'Safi', lat: 32.3, lon: -9.24, eta: '24–48h', relays: 7 },
  { name: 'Marrakech', lat: 31.63, lon: -8.0, eta: '24h', relays: 26 },
  { name: 'Béni Mellal', lat: 32.34, lon: -6.35, eta: '24–48h', relays: 8 },
  { name: 'Essaouira', lat: 31.51, lon: -9.77, eta: '48h', relays: 5 },
  { name: 'Agadir', lat: 30.42, lon: -9.6, eta: '24–48h', relays: 16 },
  { name: 'Ouarzazate', lat: 30.92, lon: -6.9, eta: '48h', relays: 5 },
  { name: 'Errachidia', lat: 31.93, lon: -4.43, eta: '48–72h', relays: 4 },
  { name: 'Guelmim', lat: 28.98, lon: -10.06, eta: '48–72h', relays: 4 },
  { name: 'Laâyoune', lat: 27.15, lon: -13.2, eta: '48–72h', relays: 6 },
  { name: 'Dakhla', lat: 23.7, lon: -15.95, eta: '72h', relays: 4 },
];

export const project = (lat, lon, k = 0.55) => new THREE.Vector3((lon + 8.5) * k, 0, -(lat - 30) * k);

/** Hex-tile terrain that follows the city network (no borders), plus pins and routes. */
export function createNetwork({ k = 0.55, labels = true, labelFilter = () => true } = {}) {
  const group = new THREE.Group();
  const pts = CITIES.map((c) => project(c.lat, c.lon, k));
  // polyline "spine" to grow tiles around (north coast → south)
  const order = ['Oujda', 'Nador', 'Tétouan', 'Tanger', 'Kénitra', 'Rabat', 'Casablanca', 'El Jadida', 'Safi', 'Essaouira', 'Agadir', 'Guelmim', 'Laâyoune', 'Dakhla'];
  const P = (n) => pts[CITIES.findIndex((c) => c.name === n)];
  const segs = [];
  for (let i = 0; i < order.length - 1; i++) segs.push([P(order[i]), P(order[i + 1])]);
  [['Rabat', 'Meknès'], ['Meknès', 'Fès'], ['Fès', 'Oujda'], ['Fès', 'Errachidia'], ['Casablanca', 'Béni Mellal'], ['Béni Mellal', 'Errachidia'], ['Marrakech', 'Ouarzazate'], ['Ouarzazate', 'Errachidia'], ['Safi', 'Marrakech'], ['Marrakech', 'Béni Mellal'], ['Agadir', 'Ouarzazate']]
    .forEach(([a, b]) => segs.push([P(a), P(b)]));
  const distToSeg = (p, a, b) => {
    const ab = b.clone().sub(a), t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1);
    return p.distanceTo(a.clone().add(ab.multiplyScalar(t)));
  };

  const R = 0.16, hexW = Math.sqrt(3) * R;
  const tiles = [];
  for (let row = -40; row < 40; row++)
    for (let col = -40; col < 40; col++) {
      const x = col * hexW + (row % 2 ? hexW / 2 : 0), z = row * R * 1.5;
      const p = new THREE.Vector3(x, 0, z);
      let d = Infinity;
      for (const [a, b] of segs) d = Math.min(d, distToSeg(p, a, b));
      if (d < 0.75) tiles.push({ x, z, d });
    }
  const hex = new THREE.CylinderGeometry(R * 0.96, R * 0.96, 1, 6);
  hex.translate(0, 0.5, 0);
  const tileMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const inst = new THREE.InstancedMesh(hex, tileMat, tiles.length);
  const m = new THREE.Matrix4(), col = new THREE.Color();
  const palette = [0xffffff, 0xf6f6f6, 0xeeeeee, 0xfafafa];
  tiles.forEach((tl, i) => {
    const h = 0.06 + Math.max(0, 0.75 - tl.d) * 0.3 + Math.random() * 0.06;
    m.compose(new THREE.Vector3(tl.x, 0, tl.z), new THREE.Quaternion(), new THREE.Vector3(1, h, 1));
    inst.setMatrixAt(i, m);
    inst.setColorAt(i, col.setHex(palette[(Math.random() * palette.length) | 0]));
    tl.h = h;
  });
  inst.castShadow = true;
  inst.receiveShadow = true;
  group.add(inst);

  // pins
  const pinMat = new THREE.MeshStandardMaterial({ color: COLORS.brand, roughness: 0.4 });
  const hubMat = new THREE.MeshStandardMaterial({ color: COLORS.brand2, roughness: 0.4 });
  const pins = CITIES.map((c, i) => {
    const pin = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(c.hub ? 0.13 : 0.09, 20, 20), c.hub ? hubMat : pinMat);
    head.position.y = c.hub ? 0.55 : 0.42;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, head.position.y, 8), c.hub ? hubMat : pinMat);
    stem.position.y = head.position.y / 2;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.14, 32), new THREE.MeshBasicMaterial({ color: COLORS.brand, transparent: true, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    pin.add(stem, head, ring);
    pin.position.copy(pts[i]).setY(0.12);
    head.castShadow = true;
    pin.userData = { city: c, head, ring, index: i };
    if (labels && labelFilter(c)) {
      const l = labelSprite(c.name, { bg: c.hub ? '#e30613' : '#1c1c1c', scale: 0.55 });
      l.position.y = head.position.y + 0.3;
      pin.add(l);
      pin.userData.label = l;
    }
    group.add(pin);
    return pin;
  });

  // routes from the hub
  const hub = pts[0];
  const routes = CITIES.slice(1).map((c, i) => {
    const b = pts[i + 1];
    const mid = hub.clone().add(b).multiplyScalar(0.5);
    mid.y = 0.6 + hub.distanceTo(b) * 0.25;
    const curve = new THREE.QuadraticBezierCurve3(hub.clone().setY(0.6), mid, b.clone().setY(0.5));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.012, 6, false), new THREE.MeshBasicMaterial({ color: COLORS.brand, transparent: true, opacity: 0.45 }));
    group.add(tube);
    const box = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.08, 0.08, 2, 0.015), new THREE.MeshStandardMaterial({ color: COLORS.card }));
    group.add(box);
    return { curve, tube, box, o: Math.random(), city: c };
  });

  group.userData = { pins, routes, tick(t) {
    routes.forEach((r) => {
      const k2 = (t * 0.22 + r.o) % 1;
      r.box.position.copy(r.curve.getPoint(k2));
      r.box.rotation.y = t * 2 + r.o * 6;
    });
    pins.forEach((p, i) => {
      const s = 1 + ((t * 0.8 + i * 0.13) % 1) * 2.2;
      p.userData.ring.scale.setScalar(s);
      p.userData.ring.material.opacity = Math.max(0, 1 - (s - 1) / 2.2);
    });
  } };
  return group;
}

export const scrollWithin = (el) => {
  const r = el.getBoundingClientRect();
  const total = r.height - innerHeight;
  return THREE.MathUtils.clamp(-r.top / (total || 1), 0, 1);
};
