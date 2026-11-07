import { THREE, RoundedBoxGeometry, createStage, addLights, shadowFloor, createParcel, createVan, createNetwork, labelSprite, scrollWithin, COLORS } from './common.js';

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const seg = (p, a, b) => THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);

// ---------- Hero: 3D delivery network ----------
{
  const canvas = document.querySelector('#hero-canvas');
  const { scene, camera, loop } = createStage(canvas, { camPos: [0, 7.5, 6.5], fov: 38 });
  addLights(scene, { shadowSize: 6 });
  const net = createNetwork({ labelFilter: (c) => ['Casablanca', 'Tanger', 'Marrakech', 'Agadir', 'Fès', 'Oujda', 'Laâyoune', 'Dakhla', 'Rabat'].includes(c.name) });
  const rig = new THREE.Group();
  rig.add(net);
  net.position.set(0.25, 0, -0.15);
  scene.add(rig);
  const floor = shadowFloor(30, 0.08);
  rig.add(floor);

  // floating parcels around the map
  const floaters = Array.from({ length: 5 }, (_, i) => {
    const p = createParcel({ size: [0.5, 0.38, 0.38] });
    p.userData.o = i * 1.3;
    p.userData.base = new THREE.Vector3(Math.cos(i * 1.25) * 2.4 + 1.2, 1.4 + (i % 2) * 0.6, Math.sin(i * 1.25) * 3.2);
    rig.add(p);
    return p;
  });

  let intro = 0;
  loop((t, dt, mouse) => {
    intro = Math.min(intro + dt * 0.5, 1);
    const wide = camera.aspect > 1.2;
    rig.position.x += ((wide ? Math.min(camera.aspect * 1.75, 3.6) : 0) - rig.position.x) * 0.1;
    rig.position.z += ((wide ? 0 : 4.6) - rig.position.z) * 0.1;
    const sc = wide ? 0.85 : 0.5;
    rig.scale.setScalar(sc * (0.6 + ease(intro) * 0.4));
    rig.rotation.y = 0.7 + mouse.x * 0.15 + Math.sin(t * 0.2) * 0.04;
    net.userData.tick(t);
    floaters.forEach((f) => {
      const { o, base } = f.userData;
      f.position.set(base.x, base.y + Math.sin(t * 1.3 + o) * 0.25, base.z);
      f.rotation.set(Math.sin(t + o) * 0.3, t * 0.6 + o, Math.cos(t * 0.8 + o) * 0.2);
    });
    const s = Math.min(scrollY / innerHeight, 1);
    camera.position.set(mouse.x * 0.6, 8.6 + mouse.y * 0.5 - s * 2, 7.6 + s * 2);
    camera.lookAt(0, 0, -0.5);
  });
}

// ---------- Parcel journey (scroll story) ----------
{
  const section = document.querySelector('.journey');
  const canvas = document.querySelector('#journey-canvas');
  const { scene, camera, size, loop } = createStage(canvas, { camPos: [0, 3, 7], fov: 38 });
  const sun = addLights(scene, { shadowSize: 10 });
  scene.add(sun.target);
  const floor = shadowFloor(80, 0.12);
  scene.add(floor);

  // --- station 1: packing table
  const table = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.2, 1.8, 3, 0.06), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
  table.position.set(0, 0.9, 0);
  table.castShadow = table.receiveShadow = true;
  const legMat = new THREE.MeshStandardMaterial({ color: COLORS.ink });
  [[-1.1, -0.7], [1.1, -0.7], [-1.1, 0.7], [1.1, 0.7]].forEach(([x, z]) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), legMat);
    l.position.set(x, 0.45, z);
    l.castShadow = true;
    scene.add(l);
  });
  scene.add(table);
  // items going into the box
  const items = [0xff5a1f, 0x12b39a, 0xffd23f].map((c, i) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.22, 0.22, 2, 0.05), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
    m.userData.start = new THREE.Vector3(-0.9 + i * 0.35, 1.12, 0.55);
    m.castShadow = true;
    scene.add(m);
    return m;
  });

  // --- station 2: conveyor + scanner
  const belt = new THREE.Mesh(new RoundedBoxGeometry(5, 0.18, 1.3, 3, 0.08), new THREE.MeshStandardMaterial({ color: 0x2a3a66, roughness: 0.7 }));
  belt.position.set(4.2, 0.9, 0);
  belt.receiveShadow = belt.castShadow = true;
  scene.add(belt);
  const stripes = [];
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 1.25), new THREE.MeshStandardMaterial({ color: 0x4b5d94 }));
    s.position.set(1.9 + i * 0.35, 1.0, 0);
    scene.add(s);
    stripes.push(s);
  }
  const arch = new THREE.Group();
  const archMat = new THREE.MeshStandardMaterial({ color: COLORS.brand, roughness: 0.4 });
  const postL = new THREE.Mesh(new RoundedBoxGeometry(0.2, 2.2, 0.2, 2, 0.05), archMat);
  postL.position.set(0, 1.1, 0.8);
  const postR = postL.clone(); postR.position.z = -0.8;
  const beam = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.3, 1.8, 2, 0.08), archMat);
  beam.position.y = 2.2;
  const laser = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ color: 0xff2d2d, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }));
  laser.rotation.y = Math.PI / 2;
  laser.position.y = 1.55;
  arch.add(postL, postR, beam, laser);
  arch.position.x = 4.2;
  arch.traverse((o) => o.isMesh && (o.castShadow = true));
  scene.add(arch);
  const scanned = labelSprite('✓ Scanned · CTH-0007', { bg: '#12b39a', scale: 0.8 });
  scanned.position.set(4.2, 2.9, 0);
  scene.add(scanned);

  // --- station 3: road + van
  const road = new THREE.Mesh(new THREE.PlaneGeometry(40, 3), new THREE.MeshStandardMaterial({ color: 0xe9e2d6, roughness: 1 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(20, 0.005, -0.2);
  road.receiveShadow = true;
  scene.add(road);
  for (let i = 0; i < 26; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(7 + i * 1.3, 0.01, -0.2);
    scene.add(dash);
  }
  const van = createVan();
  van.scale.setScalar(0.8);
  scene.add(van);
  // little trees along the road
  const treeMat = new THREE.MeshStandardMaterial({ color: COLORS.teal, roughness: 0.6 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2b });
  for (let i = 0; i < 9; i++) {
    const tr = new THREE.Group();
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), treeMat);
    top.position.y = 1.1;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8), trunkMat);
    trunk.position.y = 0.4;
    tr.add(top, trunk);
    tr.position.set(8 + i * 2.3, 0, -2.2 - (i % 2) * 0.5);
    tr.scale.setScalar(0.8 + (i % 3) * 0.2);
    tr.traverse((o) => o.isMesh && (o.castShadow = true));
    scene.add(tr);
  }

  // --- station 4: front door
  const HOUSE_X = 24;
  const house = new THREE.Group();
  const wall = new THREE.Mesh(new RoundedBoxGeometry(4, 3.2, 0.3, 3, 0.06), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
  wall.position.y = 1.6;
  const door = new THREE.Mesh(new RoundedBoxGeometry(1, 2, 0.1, 3, 0.04), new THREE.MeshStandardMaterial({ color: 0x12b39a, roughness: 0.5 }));
  door.position.set(0, 1.0, 0.18);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: COLORS.sun }));
  arc.position.set(0, 2.0, 0.2);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshStandardMaterial({ color: COLORS.sun, metalness: 0.8 }));
  knob.position.set(0.32, 1.0, 0.26);
  const mat = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.04, 0.7, 2, 0.02), new THREE.MeshStandardMaterial({ color: COLORS.brand }));
  mat.position.set(0, 0.02, 0.7);
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), treeMat);
  plant.position.set(1.3, 0.55, 0.5);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.4, 16), new THREE.MeshStandardMaterial({ color: COLORS.brand2 }));
  pot.position.set(1.3, 0.2, 0.5);
  house.add(wall, door, arc, knob, mat, plant, pot);
  house.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  house.position.set(HOUSE_X, 0, -3);
  scene.add(house);
  const delivered = labelSprite('✓ Livré · Delivered', { bg: '#ff5a1f', scale: 0.9 });
  delivered.position.set(HOUSE_X, 2.4, -1.6);
  scene.add(delivered);

  // confetti
  const confetti = [];
  const confColors = [COLORS.brand, COLORS.sun, COLORS.teal, COLORS.ink];
  for (let i = 0; i < 60; i++) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.14), new THREE.MeshBasicMaterial({ color: confColors[i % 4], side: THREE.DoubleSide }));
    c.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 3, 2 + Math.random() * 3, (Math.random() - 0.5) * 2), r: Math.random() * 10 };
    c.visible = false;
    scene.add(c);
    confetti.push(c);
  }

  // --- the parcel
  const parcel = createParcel({ size: [0.9, 0.65, 0.65], flaps: true });
  scene.add(parcel);

  const steps = [...document.querySelectorAll('.journey-step')];
  const bars = [...document.querySelectorAll('.journey-bar i')];
  const camTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3(0, 3, 7);
  let sp = 0, lastStage = -1, burst = 0, prevVanX = 0;

  loop((t, dt, mouse) => {
    sp += (scrollWithin(section) - sp) * 0.1;
    const p = sp;
    const stage = Math.min(3, Math.floor(p * 4));
    if (stage !== lastStage) {
      steps.forEach((s, i) => s.classList.toggle('on', i === stage));
      if (stage === 3 && lastStage === 2) burst = 1;
      lastStage = stage;
    }
    bars.forEach((b, i) => (b.style.width = `${seg(p, i / 4, (i + 1) / 4) * 100}%`));

    const s1 = seg(p, 0.02, 0.22), s2 = seg(p, 0.27, 0.47), s3a = seg(p, 0.52, 0.6), s3b = seg(p, 0.6, 0.74), s4 = seg(p, 0.77, 0.92);
    const pos = new THREE.Vector3();

    // 1. pack: items drop into the box, flaps close, tape runs
    items.forEach((it, i) => {
      const k = seg(s1, i * 0.12, i * 0.12 + 0.3);
      const target = new THREE.Vector3(-0.15 + i * 0.15, 1.15, 0);
      it.position.lerpVectors(it.userData.start, target, ease(k));
      it.position.y += Math.sin(k * Math.PI) * 0.6;
      it.visible = k < 0.98 && p < 0.27;
      it.rotation.y = k * 3;
    });
    parcel.userData.setOpen(1 - ease(seg(s1, 0.4, 0.8)), ease(seg(s1, 0.8, 1)));

    // 2. conveyor + scan
    pos.set(0 + ease(s2) * 4.2 + ease(seg(p, 0.47, 0.52)) * 1.8, 1.0, 0);
    stripes.forEach((s, i) => (s.position.x = 1.9 + ((i * 0.35 + (p < 0.5 ? s2 : 1) * 4) % 4.9)));
    const scanK = seg(s2, 0.35, 0.75);
    laser.material.opacity = Math.sin(scanK * Math.PI) * 0.35 + (scanK > 0 && scanK < 1 ? Math.sin(t * 30) * 0.05 : 0);
    laser.position.x = (scanK - 0.5) * 0.8;
    const sc = seg(s2, 0.7, 0.85) * (1 - seg(p, 0.5, 0.55));
    scanned.scale.set(1.6 * sc * 0.8, 0.4 * sc * 0.8, 1);
    scanned.visible = sc > 0.01;

    // 3. load into van and drive
    const VAN_START = 8.6, VAN_END = HOUSE_X + 4.2;
    const drive = ease(s3b) + ease(seg(p, 0.92, 1)) * 0;
    const vanX = VAN_START + drive * (VAN_END - VAN_START);
    van.position.set(vanX, 0, 0);
    van.userData.spin((vanX - prevVanX) * 2.5);
    prevVanX = vanX;
    van.position.y = s3b > 0 && s3b < 1 ? Math.abs(Math.sin(t * 18)) * 0.02 : 0;
    const back = new THREE.Vector3(vanX - 1.75, 1.0, 0);
    if (p >= 0.52) {
      pos.lerpVectors(new THREE.Vector3(6.0, 1.0, 0), back.clone().add(new THREE.Vector3(0.9, 0, 0)), ease(s3a));
      pos.y += Math.sin(s3a * Math.PI) * 0.4;
    }
    let hidden = p > 0.6 && p < 0.77;

    // 4. deliver to the doorstep
    if (p >= 0.77) {
      hidden = false;
      const from = new THREE.Vector3(VAN_END - 1.4, 1.0, 0);
      const to = new THREE.Vector3(HOUSE_X, 0.04, -2.3);
      pos.lerpVectors(from, to, ease(s4));
      pos.y += Math.sin(s4 * Math.PI) * 0.8;
    }
    parcel.position.copy(pos);
    parcel.visible = !hidden;
    parcel.rotation.y = p >= 0.77 ? ease(s4) * Math.PI * 0.5 : 0;
    const dk = seg(p, 0.9, 0.96);
    delivered.scale.set(2 * 0.9 * dk, 0.5 * 0.9 * dk, 1);
    delivered.visible = dk > 0.01;

    if (burst > 0) {
      confetti.forEach((c) => { c.visible = true; c.position.set(HOUSE_X, 1, -2); c.userData.vel = c.userData.v.clone(); });
      burst = 0;
    }
    confetti.forEach((c) => {
      if (!c.visible) return;
      c.userData.vel.y -= dt * 5;
      c.position.addScaledVector(c.userData.vel, dt);
      c.rotation.set(t * c.userData.r, t * 2, 0);
      if (c.position.y < 0 || p < 0.75) c.visible = false;
    });

    // camera follows the action
    const focus = parcel.visible ? parcel.position : van.position;
    camTarget.lerp(new THREE.Vector3(focus.x, 1.1, p >= 0.77 ? -1.6 : 0), 0.08);
    const wide = camera.aspect > 1.2;
    const offX = wide ? -3.2 : 0; // keep the action right of the text on desktop
    const dist = size.w < 760 ? 13 : 10.5;
    camPos.lerp(new THREE.Vector3(camTarget.x + offX + mouse.x * 0.6, 4.3 + mouse.y * 0.4, camTarget.z + dist), 0.08);
    camera.position.copy(camPos);
    camera.lookAt(camTarget.x + offX, camTarget.y, camTarget.z);
    sun.position.set(camTarget.x + 5, 10, 6);
    sun.target.position.copy(camTarget);
  });
}
