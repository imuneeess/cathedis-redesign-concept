import { THREE, createStage, addLights, shadowFloor, createNetwork, CITIES } from './common.js';

const canvas = document.querySelector('#map-canvas');
const { scene, camera, size, loop } = createStage(canvas, { camPos: [0, 9, 7], fov: 40 });
addLights(scene, { shadowSize: 7 });
scene.add(shadowFloor(40, 0.08));
const net = createNetwork({ labelFilter: (c) => c.relays >= 9 || ['Laâyoune', 'Dakhla'].includes(c.name) });
scene.add(net);
const { pins, routes } = net.userData;

// haversine distance from the Casablanca hub (km)
const km = (a, b) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
};

const list = document.querySelector('.city-list');
const panel = document.querySelector('.city-info');
CITIES.forEach((c) => {
  const b = document.createElement('button');
  b.textContent = c.name;
  b.addEventListener('click', () => select(c.name));
  list.append(b);
});

let selected = null;
const focus = new THREE.Vector3(0, 0, 0.2), goal = new THREE.Vector3(0, 9, 7);
function select(name) {
  const i = CITIES.findIndex((c) => c.name === name);
  const c = CITIES[i];
  selected = i;
  [...list.children].forEach((b, k) => b.classList.toggle('active', k === i));
  panel.querySelector('h2').textContent = c.name;
  panel.querySelector('[data-k=eta]').textContent = c.eta;
  panel.querySelector('[data-k=relays]').textContent = c.relays;
  panel.querySelector('[data-k=km]').textContent = c.hub ? 'Hub' : km(CITIES[0], c) + ' km';
  panel.querySelector('p').textContent = c.hub
    ? 'Our main sorting hub. Parcels for every city leave from here each night.'
    : `Parcels for ${c.name} leave the Casablanca hub every night, with home delivery or pickup at ${c.relays} relay points.`;
  panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
  routes.forEach((r) => (r.tube.material.opacity = r.city.name === name ? 1 : 0.15));
  const p = pins[i].position;
  focus.set(p.x, 0, p.z);
  goal.set(p.x + 0.4, 4.2, p.z + 3.6);
}

// click pins
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const heads = pins.map((p) => p.userData.head);
  const hit = ray.intersectObjects(heads)[0];
  if (hit) select(pins[heads.indexOf(hit.object)].userData.city.name);
  else {
    // pick nearest pin on screen within 40px
    let best = null, bd = 40;
    pins.forEach((p) => {
      const v = p.position.clone().setY(0.4).project(camera);
      const d = Math.hypot((v.x - ndc.x) * r.width / 2, (v.y - ndc.y) * r.height / 2);
      if (d < bd) { bd = d; best = p; }
    });
    if (best) select(best.userData.city.name);
  }
});
document.querySelector('#overview').addEventListener('click', () => {
  selected = null;
  [...list.children].forEach((b) => b.classList.remove('active'));
  routes.forEach((r) => (r.tube.material.opacity = 0.45));
  focus.set(0, 0, 0.2);
  goal.set(0, 9, 7);
});
select('Casablanca');

const look = new THREE.Vector3(0, 0, 0.2);
loop((t, dt, mouse) => {
  net.userData.tick(t);
  pins.forEach((p, i) => {
    const s = i === selected ? 1.6 + Math.sin(t * 5) * 0.15 : 1;
    p.userData.head.scale.lerp(new THREE.Vector3(s, s, s), 0.15);
  });
  const far = size.w < 600 ? 1.35 : 1;
  look.lerp(focus, 0.06);
  camera.position.lerp(new THREE.Vector3(goal.x + mouse.x * 0.5, goal.y * far, goal.z * far), 0.05);
  camera.lookAt(look);
});
