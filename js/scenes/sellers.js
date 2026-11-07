import { THREE, createStage, addLights, shadowFloor, createParcel, CITIES } from './common.js';

// ---------- Price calculator (illustrative sample pricing) ----------
const $ = (s) => document.querySelector(s);
const city = $('#p-city'), weight = $('#p-weight'), volume = $('#p-volume'), cod = $('#p-cod'), ins = $('#p-ins');
CITIES.forEach((c) => city.append(new Option(`${c.name} · ${c.eta}`, c.name)));
city.value = 'Marrakech';

const ZONE = { 'Same day': 25, '24h': 30, '24–48h': 33, '48h': 35, '48–72h': 40, '72h': 45 };
const fmt = (n) => n.toLocaleString('fr-MA', { maximumFractionDigits: 0 }) + ' MAD';
const state = { boxes: 6, scale: 1 };

function calc() {
  const c = CITIES.find((x) => x.name === city.value);
  const kg = +weight.value, n = +volume.value;
  const base = ZONE[c.eta];
  const extraKg = Math.max(0, kg - 2) * 3;
  const codFee = cod.checked ? 5 : 0;
  const insFee = ins.checked ? 2 : 0;
  const disc = n >= 2000 ? 0.2 : n >= 500 ? 0.1 : 0;
  const unit = (base + extraKg + codFee + insFee) * (1 - disc);
  $('#v-weight').textContent = kg + ' kg';
  $('#v-volume').textContent = n.toLocaleString('fr-MA') + ' / month';
  $('#o-unit').textContent = fmt(unit);
  $('#o-month').textContent = fmt(unit * n);
  $('#o-base').textContent = fmt(base);
  $('#o-kg').textContent = extraKg ? '+' + fmt(extraKg) : '—';
  $('#o-opts').textContent = codFee + insFee ? '+' + fmt(codFee + insFee) : '—';
  $('#o-disc').textContent = disc ? `−${disc * 100}%` : '—';
  $('#o-eta').textContent = c.eta;
  state.boxes = Math.round(4 + (Math.log10(n) - 1) * 9);
  state.scale = 0.7 + Math.min(kg, 30) / 30 * 0.6;
}
[city, weight, volume, cod, ins].forEach((el) => el.addEventListener('input', calc));
calc();

// ---------- 3D: a growing stack of parcels ----------
const canvas = $('#stack-canvas');
const { scene, camera, loop } = createStage(canvas, { camPos: [3.5, 4.5, 6.5], fov: 40 });
addLights(scene, { shadowSize: 5 });
scene.add(shadowFloor(20, 0.3));
const hemi = scene.children.find((o) => o.isHemisphereLight);
hemi.intensity = 1.1;

const MAX = 40;
const pile = [];
// deterministic stack layout: 3x3 layers
const slot = (i) => {
  const layer = Math.floor(i / 9), k = i % 9;
  return new THREE.Vector3(((k % 3) - 1) * 0.95, layer * 0.68, (Math.floor(k / 3) - 1) * 0.95);
};
for (let i = 0; i < MAX; i++) {
  const p = createParcel({ size: [0.88, 0.64, 0.88] });
  p.userData = { slot: slot(i), y: 8 + i * 0.3, vy: 0, on: false, rot: (Math.random() - 0.5) * 0.3 };
  p.visible = false;
  p.rotation.y = p.userData.rot;
  scene.add(p);
  pile.push(p);
}
const group = new THREE.Group();
scene.add(group);

loop((t, dt, mouse) => {
  pile.forEach((p, i) => {
    const u = p.userData;
    const want = i < state.boxes;
    if (want && !u.on) { u.on = true; u.y = u.slot.y + 5 + i * 0.05; u.vy = 0; p.visible = true; }
    if (!want && u.on) { u.on = false; }
    if (u.on) {
      u.vy -= dt * 22;
      u.y += u.vy * dt;
      if (u.y < u.slot.y) { u.y = u.slot.y; u.vy = Math.abs(u.vy) > 1.5 ? -u.vy * 0.3 : 0; }
    } else if (p.visible) {
      p.scale.multiplyScalar(0.85);
      if (p.scale.x < 0.05) p.visible = false;
      return;
    }
    p.scale.lerp(new THREE.Vector3(state.scale, state.scale, state.scale), 0.1);
    p.position.set(u.slot.x * state.scale, u.y * state.scale, u.slot.z * state.scale);
  });
  const top = Math.ceil(state.boxes / 9) * 0.68 * state.scale;
  camera.position.lerp(new THREE.Vector3(2.8 + mouse.x * 0.6, 2.4 + top * 1.0, 4.6 + top * 1.0), 0.05);
  camera.lookAt(0, top * 0.45, 0);
  void group; void t;
});
