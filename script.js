// Появится на финальном экране после «Да!». Например: "Суббота, 19:00"
const DETAILS = "";

const PX = 4;
const PALETTES = {
  bun:     ['#f6c177', '#eeaa55', '#e39b3c', '#d2872b', '#b86f1f'],
  lettuce: ['#8fd14f', '#6cbb3c', '#52a52c', '#3d8a22'],
  tomato:  ['#ff6b5b', '#e8433a', '#cc2f2a', '#a8201f'],
  cheese:  ['#ffe066', '#f7c531', '#eab01f', '#d89a12'],
  patty:   ['#8a4b2a', '#74391e', '#5e2c16', '#4a210f', '#3a190b'],
  stone:   ['#8f8f8f', '#7f7f7f', '#747474', '#686868', '#5c5c5c'],
  grass:   ['#8fcf4a', '#7cbd3f', '#6aaa33', '#5b9a2b'],
  dirt:    ['#a07350', '#966c4a', '#8b5a3c', '#79492f', '#6b3f28'],
  log:     ['#7a5c38', '#6b5132', '#5a4228', '#4d3820'],
  leaves:  ['#4ea333', '#3f8f2a', '#357a22', '#2c6a1c'],
  creeper: ['#6fd65a', '#5cc24a', '#4fae3d', '#3f9a30', '#9be58a', '#2f7a24'],
  smoke:   ['#ffffff', '#e6e6e6', '#bdbdbd', '#8f8f8f', '#5c5c5c'],
};

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const burger = document.getElementById('burger');
const ask = document.getElementById('ask');
const yes = document.getElementById('yes');
const no = document.getElementById('no');
const win = document.getElementById('win');
const toast = document.getElementById('toast');

/* ---------- pixel textures ---------- */

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function layerTexture(w, h, palette, seeds) {
  const cw = Math.max(1, Math.round(w / PX));
  const ch = Math.max(1, Math.round(h / PX));
  const [c, ctx] = canvas(cw, ch);
  const n = palette.length;

  for (let y = 0; y < ch; y++) {
    const shade = ch > 1 ? y / (ch - 1) : 0.5;
    for (let x = 0; x < cw; x++) {
      const i = Math.round(shade * (n - 1) * 0.7 + rnd(-1, 1.2));
      ctx.fillStyle = palette[Math.min(n - 1, Math.max(0, i))];
      ctx.fillRect(x, y, 1, 1);
    }
  }

  if (seeds) {
    ctx.fillStyle = '#fff3d6';
    for (let k = 0; k < Math.round(cw / 5); k++) {
      ctx.fillRect(Math.floor(rnd(3, cw - 4)), Math.floor(rnd(3, Math.min(7, ch))), 2, 1);
    }
  }
  return c.toDataURL();
}

function tile(fn) {
  const [c, ctx] = canvas(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = fn(x, y);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return `url(${c.toDataURL()})`;
}

const grassTile = () => tile((x, y) => {
  const grass = y < 3 || (y === 3 && Math.random() < 0.6) || (y === 4 && Math.random() < 0.2);
  if (grass) return pick(PALETTES.grass);
  return Math.random() < 0.04 ? '#8a8a8a' : pick(PALETTES.dirt);
});

const stoneTile = () => tile(() => pick(PALETTES.stone));

const logTile = () => tile((x) => {
  const i = (x % 4 === 0 ? 2 : 0) + (Math.random() < 0.5 ? 1 : 0);
  return PALETTES.log[i];
});

const leavesTile = () => tile(() => (Math.random() < 0.08 ? '#1f4d14' : pick(PALETTES.leaves)));

function applyTextures() {
  document.querySelectorAll('.layer').forEach((el) => {
    const url = layerTexture(el.offsetWidth, el.offsetHeight, PALETTES[el.dataset.tex], el.classList.contains('bun-top'));
    el.style.backgroundImage = `url(${url})`;
  });
}

document.documentElement.style.setProperty('--grass', grassTile());
document.documentElement.style.setProperty('--stone', stoneTile());
document.documentElement.style.setProperty('--log', logTile());
document.documentElement.style.setProperty('--leaves', leavesTile());
applyTextures();

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(applyTextures, 200);
});

/* ---------- falling burger ---------- */

const START = 0.6;
const STEP = 0.42;
const DUR = 0.75;
let timers = [];

function burst(el) {
  const r = el.getBoundingClientRect();
  const palette = PALETTES[el.dataset.tex];
  for (let k = 0; k < 12; k++) {
    const side = k % 2 ? 1 : -1;
    const p = document.createElement('i');
    p.className = 'particle';
    p.style.left = `${side > 0 ? r.right - 6 : r.left}px`;
    p.style.top = `${r.bottom - 8}px`;
    p.style.background = pick(palette);
    document.body.append(p);

    const dx = side * rnd(10, 70);
    const dy = -rnd(10, 45);
    p.animate([
      { transform: 'translate(0, 0)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx * 1.4}px, ${dy + 50}px)`, opacity: 0 },
    ], { duration: rnd(500, 850), easing: 'ease-out' }).onfinish = () => p.remove();
  }
}

function dropBurger() {
  timers.forEach(clearTimeout);
  timers = [];
  const layers = [...burger.querySelectorAll('.layer')].reverse();

  if (reducedMotion) {
    ask.classList.add('show');
    burger.style.pointerEvents = 'none';
    return;
  }

  layers.forEach((el, i) => {
    const delay = START + i * STEP;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    el.style.animationDelay = `${delay}s`;
    el.style.animationDuration = `${DUR}s`;
    timers.push(setTimeout(() => burst(el), (delay + DUR * 0.65) * 1000));
  });

  timers.push(setTimeout(() => {
    ask.classList.add('show');
    burger.style.pointerEvents = 'none';
  }, (START + (layers.length - 1) * STEP + DUR + 0.2) * 1000));
}

dropBurger();
burger.addEventListener('click', (e) => {
  e.preventDefault();
  if (ask.classList.contains('show')) return;
  if (performance.now() - lastFlee < 600) return;
  if (burger.getAnimations({ subtree: true }).some((a) => a.playState === 'running')) return;
  dropBurger();
});

/* ---------- "no" runs away ---------- */

const NO_TEXTS = [
  'Нет',
  'Точно?',
  'Подумай ещё',
  'Там луковые кольца!',
  'А если фишбургер?',
  'Ну пожааалуйста',
  'Я угощаю!',
  'Кнопка сломалась :)',
];
const CREEPER_AFTER = 8;
let tries = 0;
let creeperBusy = false;
let creeperTimers = [];

function overlaps(x, y, w, h, r, gap) {
  return x < r.right + gap && x + w > r.left - gap && y < r.bottom + gap && y + h > r.top - gap;
}

let lastFlee = 0;

function flee(e) {
  if (e) e.preventDefault();
  if (performance.now() - lastFlee < 300) return;
  lastFlee = performance.now();
  tries++;

  const before = no.getBoundingClientRect();
  if (!no.classList.contains('flee')) {
    no.style.left = `${before.left}px`;
    no.style.top = `${before.top}px`;
    no.classList.add('flee');
  }
  no.textContent = NO_TEXTS[Math.min(tries, NO_TEXTS.length - 1)];
  yes.style.setProperty('--s', Math.min(1.7, 1 + tries * 0.1));

  const b = no.getBoundingClientRect();
  const pad = 12;
  const maxX = Math.max(pad, innerWidth - b.width - pad);
  const maxY = Math.max(pad, innerHeight - b.height - pad);
  const yesRect = yes.getBoundingClientRect();
  let x, y, attempt = 0;
  do {
    x = rnd(pad, maxX);
    y = rnd(pad, maxY);
    attempt++;
  } while (attempt < 40 && (overlaps(x, y, b.width, b.height, yesRect, 20) || Math.hypot(x - before.left, y - before.top) < 120));

  no.style.left = `${x}px`;
  no.style.top = `${y}px`;

  if (tries >= CREEPER_AFTER && !creeperBusy) spawnCreeper();
}

no.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !creeperBusy) flee(); });
no.addEventListener('pointerdown', (e) => {
  if (creeperBusy) return;
  e.preventDefault();
  e.stopPropagation();
  flee(e);
});
no.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (creeperBusy) return;
  if (e.detail === 0) flee(e);
});

/* ---------- creeper ---------- */

function explodeAt(x, y) {
  for (let k = 0; k < 48; k++) {
    const p = document.createElement('i');
    p.className = 'particle';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.width = `${rnd(6, 14)}px`;
    p.style.height = p.style.width;
    p.style.background = pick([...PALETTES.creeper, ...PALETTES.dirt, ...PALETTES.smoke]);
    document.body.append(p);
    const ang = rnd(0, Math.PI * 2);
    const dist = rnd(40, 180);
    p.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist - 30}px) scale(${rnd(.2, .8)})`, opacity: 0 },
    ], { duration: rnd(500, 900), easing: 'ease-out' }).onfinish = () => p.remove();
  }

  const flash = document.createElement('div');
  flash.className = 'flash flash--boom';
  document.body.append(flash);
  document.body.classList.add('shake');
  setTimeout(() => {
    flash.remove();
    document.body.classList.remove('shake');
  }, 600);
}

function spawnCreeper() {
  if (creeperBusy || !no.isConnected) return;
  creeperBusy = true;

  const el = document.createElement('div');
  el.className = 'creeper';
  el.innerHTML = '<img src="creeper.png" alt="">';
  document.body.append(el);

  const size = Math.min(240, innerWidth * 0.52);
  const height = size * 2;
  const x = Math.min(innerWidth - size - 24, Math.max(24, innerWidth / 2 + 80));
  const land = Math.min(innerHeight - 80 - height, Math.max(24, innerHeight * 0.18));
  el.style.left = `${x}px`;
  el.style.top = `${land}px`;
  el.style.transform = 'translateY(-130vh)';

  if (reducedMotion) {
    el.style.transform = 'none';
    el.classList.add('creeper--fuse');
    creeperTimers.push(setTimeout(() => explodeCreeper(el), 1550));
    return;
  }

  el.animate([
    { transform: 'translateY(-130vh)' },
    { transform: 'translateY(0)', offset: 0.7 },
    { transform: 'translateY(-20px)', offset: 0.84 },
    { transform: 'translateY(0)' },
  ], { duration: 900, easing: 'cubic-bezier(.45, 0, .7, .15)', fill: 'forwards' });

  creeperTimers.push(setTimeout(() => el.classList.add('creeper--fuse'), 900));
  creeperTimers.push(setTimeout(() => explodeCreeper(el), 2500));
}

function explodeCreeper(el) {
  const r = el.getBoundingClientRect();
  explodeAt(r.left + r.width / 2, r.top + r.height / 2);
  el.remove();
  if (no.isConnected) {
    no.style.transition = 'none';
    no.style.opacity = '0';
    no.remove();
  }
  creeperBusy = false;
}

/* ---------- "yes" ---------- */

const HEART = [
  '.XX.XX.',
  'XXXXXXX',
  'XXXXXXX',
  '.XXXXX.',
  '..XXX..',
  '...X...',
];

function heart(extraClass = '') {
  let rects = '';
  HEART.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'X') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }));
  const wrap = document.createElement('span');
  wrap.innerHTML = `<svg class="heart ${extraClass}" viewBox="0 0 7 6" shape-rendering="crispEdges">
    <g fill="#e3262f">${rects}</g><rect x="1" y="1" width="1" height="1" fill="#fff" opacity=".85"/></svg>`;
  return wrap.firstElementChild;
}

function rainHeart() {
  const h = heart('heart--rain');
  const size = rnd(16, 36);
  h.style.left = `${rnd(0, innerWidth - size)}px`;
  h.style.width = `${size}px`;
  h.style.height = `${size * 6 / 7}px`;
  document.body.append(h);
  h.animate([
    { transform: 'translateY(0) rotate(0deg)' },
    { transform: `translateY(${innerHeight + 80}px) rotate(${rnd(-40, 40)}deg)` },
  ], { duration: rnd(3000, 6000), easing: 'linear' }).onfinish = () => h.remove();
}

function audioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx.current || audioCtx.current.state === 'closed') audioCtx.current = new AC();
  if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
  return audioCtx.current;
}

function chime() {
  try {
    const ac = audioCtx();
    if (!ac) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      const t = ac.currentTime + i * 0.1;
      o.type = 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.3);
    });
  } catch { /* no audio — not a problem */ }
}

yes.addEventListener('click', () => {
  creeperTimers.forEach(clearTimeout);
  creeperTimers = [];
  document.querySelector('.creeper')?.remove();
  chime();
  no.remove();
  win.hidden = false;

  const health = document.getElementById('health');
  for (let i = 0; i < 10; i++) {
    const h = heart();
    h.style.animationDelay = `${0.4 + i * 0.08}s`;
    health.append(h);
  }

  if (DETAILS) {
    const when = document.getElementById('when');
    when.textContent = DETAILS;
    when.hidden = false;
  }

  setTimeout(() => toast.classList.add('show'), 900);
  setTimeout(() => toast.classList.remove('show'), 5500);

  if (!reducedMotion) {
    for (let i = 0; i < 25; i++) setTimeout(rainHeart, i * 80);
    setInterval(rainHeart, 350);
  }
}, { once: true });
