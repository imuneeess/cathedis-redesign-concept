import { THREE, createStage, addLights, shadowFloor, createParcel, createVan } from './common.js';

// ---------- 3D: click to drop parcels that bounce and stack ----------
const canvas = document.querySelector('#drop-canvas');
const { scene, camera, loop } = createStage(canvas, { camPos: [0, 4.5, 9], fov: 38 });
addLights(scene, { shadowSize: 6 });
scene.add(shadowFloor(30, 0.15));

const van = createVan();
van.scale.setScalar(0.75);
van.position.set(-1.2, 0, -1.6);
van.rotation.y = 0.35;
scene.add(van);

const boxes = [];
const MAX = 30;
function drop(x = (Math.random() - 0.5) * 3 + 1, z = (Math.random() - 0.5) * 1.6 + 0.6) {
  const s = 0.45 + Math.random() * 0.35;
  const p = createParcel({ size: [s * 1.3, s, s] });
  p.position.set(x, 6 + Math.random() * 2, z);
  p.rotation.y = Math.random() * Math.PI;
  p.userData = { vy: 0, w: s * 0.75, h: s, rest: false, spin: (Math.random() - 0.5) * 6, tilt: (Math.random() - 0.5) * 1.5 };
  scene.add(p);
  boxes.push(p);
  if (boxes.length > MAX) {
    const old = boxes.shift();
    scene.remove(old);
  }
}
for (let i = 0; i < 6; i++) setTimeout(() => drop(), 300 + i * 260);

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (ray.ray.intersectPlane(plane, hit)) drop(THREE.MathUtils.clamp(hit.x, -3.5, 3.5), THREE.MathUtils.clamp(hit.z, -1, 2.5));
});

loop((t, dt, mouse) => {
  boxes.forEach((b) => {
    const u = b.userData;
    if (u.rest) return;
    u.vy -= dt * 20;
    b.position.y += u.vy * dt;
    b.rotation.y += u.spin * dt;
    b.rotation.x = u.tilt * Math.min(1, Math.max(0, b.position.y - 0.5) / 3);
    // floor = ground or top of any resting box under us
    let floor = 0;
    for (const o of boxes) {
      if (o === b || !o.userData.rest) continue;
      if (Math.hypot(o.position.x - b.position.x, o.position.z - b.position.z) < (o.userData.w + u.w) * 0.8) floor = Math.max(floor, o.position.y + o.userData.h);
    }
    if (b.position.y <= floor) {
      b.position.y = floor;
      if (Math.abs(u.vy) > 2) { u.vy = -u.vy * 0.32; u.spin *= 0.4; }
      else { u.vy = 0; u.rest = true; b.rotation.x = 0; }
    }
  });
  van.position.y = Math.abs(Math.sin(t * 2)) * 0.015;
  camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.05;
  camera.position.y += (4.5 + mouse.y * 0.6 - camera.position.y) * 0.05;
  camera.lookAt(0, 1, 0);
});

// ---------- Form (demo only: nothing is sent) ----------
const form = document.querySelector('#contact-form');
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x === b));
  form.classList.toggle('driver', b.dataset.tab === 'driver');
  form.querySelectorAll('.business-only [required], .driver-only [required]').forEach((el) => (el.disabled = el.closest(b.dataset.tab === 'driver' ? '.business-only' : '.driver-only') !== null));
}));
form.querySelectorAll('.driver-only [required]').forEach((el) => (el.disabled = true));
const toast = document.querySelector('.toast');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.reset();
  for (let i = 0; i < 8; i++) setTimeout(() => drop(), i * 120);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
});
