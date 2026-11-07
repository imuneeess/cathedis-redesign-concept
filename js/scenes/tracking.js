import { THREE, createStage, addLights, shadowFloor, createNetwork, createVan, labelSprite, CITIES, project } from './common.js';

// Demo shipments only: this concept is not connected to any real tracking system.
const DEMO = {
  'CTH-2026-0007': { to: 'Marrakech', step: 4, eta: 'Today, 14:00 – 16:00' },
  'CTH-2026-0042': { to: 'Tanger', step: 5, eta: 'Delivered at 11:24' },
  'CTH-2026-1234': { to: 'Agadir', step: 3, eta: 'Tomorrow, before 18:00' },
};
const STEPS = ['Order created', 'Picked up from seller', 'Sorted at Casablanca hub', 'In transit', 'Out for delivery', 'Delivered'];

const canvas = document.querySelector('#track-canvas');
const { scene, camera, loop } = createStage(canvas, { camPos: [0, 6, 5], fov: 40 });
addLights(scene, { shadowSize: 6 });
scene.add(shadowFloor(30, 0.08));
const net = createNetwork({ labels: false });
scene.add(net);
net.userData.routes.forEach((r) => { r.tube.material.opacity = 0.12; r.box.visible = false; });

const van = createVan();
van.scale.setScalar(0.17);
scene.add(van);
const fromLabel = labelSprite('Casablanca', { bg: '#0e1b3d', scale: 0.42 });
const toLabel = labelSprite('', { scale: 0.42 });
scene.add(fromLabel, toLabel);
fromLabel.position.copy(project(33.57, -7.59)).setY(1.05);

let route = null, target = 0, progress = 0;
const focus = new THREE.Vector3(), camGoal = new THREE.Vector3(0, 6, 5);

function setLabel(sprite, text) {
  const s = labelSprite(text, { bg: '#ff5a1f', scale: 0.42 });
  sprite.material.map.dispose();
  sprite.material.map = s.material.map;
}

const list = document.querySelector('.timeline');
const etaEl = document.querySelector('#eta');
const statusEl = document.querySelector('#status');
function track(code) {
  const ship = DEMO[code.trim().toUpperCase()];
  if (!ship) {
    statusEl.textContent = 'No demo shipment found. Try one of the sample numbers below.';
    return;
  }
  statusEl.textContent = `Shipment ${code.toUpperCase()} · Casablanca → ${ship.to}`;
  etaEl.textContent = ship.eta;
  list.innerHTML = STEPS.map((s, i) => `<li><b>${s}</b><small>${i <= ship.step ? ['Mon 09:12', 'Mon 15:40', 'Mon 22:05', 'Tue 06:30', 'Tue 08:15', 'Tue 11:24'][i] : 'Pending'}</small></li>`).join('');
  [...list.children].forEach((li, i) => setTimeout(() => {
    if (i <= ship.step) li.classList.add(i === ship.step && ship.step < 5 ? 'current' : 'done');
  }, 250 + i * 220));

  net.userData.routes.forEach((r) => (r.tube.material.opacity = 0.12));
  route = net.userData.routes.find((r) => r.city.name === ship.to);
  route.tube.material.opacity = 1;
  setLabel(toLabel, ship.to);
  const c = CITIES.find((x) => x.name === ship.to);
  toLabel.position.copy(project(c.lat, c.lon)).setY(0.95);
  progress = 0;
  target = [0, 0.02, 0.05, 0.55, 0.85, 1][ship.step];
  const mid = route.curve.getPoint(0.5);
  focus.copy(mid);
  const len = route.curve.getLength();
  camGoal.set(mid.x + 0.4, 3.6 + len * 1.5, mid.z + 3.4 + len * 1.2);
}

document.querySelector('#track-form').addEventListener('submit', (e) => {
  e.preventDefault();
  track(document.querySelector('#track-input').value);
});
document.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => {
  document.querySelector('#track-input').value = b.dataset.demo;
  track(b.dataset.demo);
}));
const fromUrl = new URLSearchParams(location.search).get('n');
document.querySelector('#track-input').value = fromUrl || 'CTH-2026-0007';
track(fromUrl && DEMO[fromUrl.toUpperCase()] ? fromUrl : 'CTH-2026-0007');

const look = new THREE.Vector3();
loop((t, dt, mouse) => {
  net.userData.tick(t);
  progress += (target - progress) * 0.02;
  if (route) {
    const p = route.curve.getPoint(Math.min(progress, 0.999));
    const ahead = route.curve.getPoint(Math.min(progress + 0.01, 1));
    van.position.copy(p);
    van.position.y += 0.05 + Math.sin(t * 6) * 0.01;
    van.lookAt(ahead.x, van.position.y, ahead.z);
    van.rotateY(-Math.PI / 2);
  }
  look.lerp(focus, 0.05);
  camera.position.lerp(new THREE.Vector3(camGoal.x + mouse.x * 0.5, camGoal.y, camGoal.z), 0.04);
  camera.lookAt(look);
});
