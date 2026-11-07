// Shared UI: nav, page transitions, reveals, counters, cursor, tilt, magnetic buttons
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Page transition ----
requestAnimationFrame(() => document.documentElement.classList.add('loaded'));
window.addEventListener('pageshow', (e) => {
  if (e.persisted) document.documentElement.classList.remove('leaving');
});
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const url = new URL(a.href, location.href);
  const internal = url.origin === location.origin && url.pathname !== location.pathname && !a.target && !e.metaKey && !e.ctrlKey;
  if (!internal || reduce) return;
  e.preventDefault();
  document.documentElement.classList.add('leaving');
  setTimeout(() => (location.href = a.href), 650);
});

// ---- Nav ----
const nav = document.querySelector('.nav');
const page = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach((a) => {
  if (a.getAttribute('href') === page) a.classList.add('active');
});
document.querySelector('.burger')?.addEventListener('click', () => nav.classList.toggle('open'));

const progress = document.querySelector('.progress');
function onScroll() {
  nav?.classList.toggle('scrolled', scrollY > 30);
  const max = document.documentElement.scrollHeight - innerHeight;
  if (progress) progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---- Split headline words ----
document.querySelectorAll('.split').forEach((el) => {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(part);
          const w = document.createElement('span');
          w.className = 'word';
          const inner = document.createElement('span');
          inner.textContent = part;
          w.append(inner);
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    });
  };
  walk(el);
  el.querySelectorAll('.word > span').forEach((s, i) => (s.style.transitionDelay = `${0.15 + i * 0.06}s`));
});

// ---- Reveal on scroll ----
const io = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (en.isIntersecting) {
      en.target.classList.add('in');
      io.unobserve(en.target);
    }
  }),
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal, .split').forEach((el) => io.observe(el));

// ---- Counters ----
const cio = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  const el = en.target;
  const end = parseFloat(el.dataset.count);
  const dec = (el.dataset.count.split('.')[1] || '').length;
  const suffix = el.dataset.suffix || '';
  const t0 = performance.now();
  const dur = 1800;
  const tick = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const v = end * (1 - Math.pow(1 - p, 4));
    el.textContent = v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  cio.unobserve(el);
}), { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

// ---- Custom cursor ----
if (matchMedia('(hover: hover)').matches && !reduce) {
  const ring = Object.assign(document.createElement('div'), { className: 'cursor' });
  const dot = Object.assign(document.createElement('div'), { className: 'cursor-dot' });
  document.body.append(ring, dot);
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate(${x}px, ${y}px)`;
  });
  (function loop() {
    rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener('pointerover', (e) => {
    ring.classList.toggle('hover', !!e.target.closest('a, button, .card, input, textarea, select, canvas'));
  });
}

// ---- 3D tilt cards + spotlight ----
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
    if (!reduce) card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 10}deg) rotateY(${(px - 0.5) * 10}deg)`;
  });
  card.addEventListener('pointerleave', () => (card.style.transform = ''));
});

// ---- Magnetic buttons ----
document.querySelectorAll('.btn').forEach((btn) => {
  btn.addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    btn.style.setProperty('--x', `${dx}px`);
    btn.style.setProperty('--y', `${dy}px`);
    if (!reduce) btn.style.transform = `translate(${(dx - r.width / 2) * 0.2}px, ${(dy - r.height / 2) * 0.3}px)`;
  });
  btn.addEventListener('pointerleave', () => (btn.style.transform = ''));
});

// ---- Footer year ----
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
