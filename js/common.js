// Shared helpers: nav, music player, polaroids, confetti.

export async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

export function buildNav(active) {
  const nav = document.createElement('nav');
  nav.className = 'topbar';
  const pages = [
    ['index.html', 'Our Story'],
    ['gallery.html', 'Gallery'],
    ['letters.html', 'Letters'],
    ['us.html', 'Us'],
  ];
  for (const [href, label] of pages) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    if (href === active) a.classList.add('active');
    nav.appendChild(a);
  }
  const music = document.createElement('button');
  music.className = 'music-toggle';
  music.textContent = '🔇';
  music.title = 'music on/off';
  music.addEventListener('click', () => toggleMusic(music));
  nav.appendChild(music);
  document.body.prepend(nav);
}

// ---- Music: one <audio>, swapped per era; off until she taps the note. ----
const audio = new Audio();
audio.loop = true;
let musicOn = false;
let currentSrc = null;

function toggleMusic(btn) {
  musicOn = !musicOn;
  btn.textContent = musicOn ? '🎵' : '🔇';
  if (musicOn && currentSrc) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}

export function setEraSong(src) {
  if (!src || src === currentSrc) return;
  currentSrc = src;
  // Missing audio files are expected until Rahul drops them in; fail silently.
  fetch(src, { method: 'HEAD' }).then((r) => {
    if (!r.ok) return;
    const wasPlaying = musicOn;
    audio.src = src;
    if (wasPlaying) audio.play().catch(() => {});
  }).catch(() => {});
}

// ---- Polaroid builder: shows a dashed drop-slot until the photo exists. ----
export function polaroid(src, { caption = '', egg = null } = {}) {
  const card = document.createElement('div');
  card.className = 'polaroid';
  const img = document.createElement('img');
  img.src = src;
  img.alt = caption || 'photo';
  img.loading = 'lazy';
  img.onerror = () => {
    const ph = document.createElement('div');
    ph.className = 'ph';
    ph.innerHTML = `<div class="cam">📷</div><div>drop photo here:<br>${src}</div>`;
    img.replaceWith(ph);
  };
  card.appendChild(img);
  if (caption) {
    const cap = document.createElement('div');
    cap.className = 'caption';
    cap.textContent = caption;
    card.appendChild(cap);
  }
  if (egg) attachEgg(card, egg);
  return card;
}

function attachEgg(card, egg) {
  card.classList.add('has-egg');
  card.addEventListener('click', () => {
    if (egg.type === 'video') {
      openVideoModal(egg.src);
    } else if (egg.type === 'note') {
      openNoteModal(egg.text);
    }
  });
}

function modalShell() {
  const back = document.createElement('div');
  back.className = 'modal-backdrop show';
  back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });
  const box = document.createElement('div');
  box.className = 'modal';
  back.appendChild(box);
  document.body.appendChild(back);
  return box;
}

export function openVideoModal(src) {
  const box = modalShell();
  const vid = document.createElement('video');
  vid.src = src;
  vid.controls = true;
  vid.autoplay = true;
  vid.style.width = '100%';
  vid.onerror = () => {
    box.innerHTML = `<h3>🎞️ reel not loaded yet</h3><p class="hint">drop the clip at <b>${src}</b></p>`;
  };
  box.appendChild(vid);
}

export function openNoteModal(text) {
  const box = modalShell();
  box.innerHTML = `<h3>🤫 you found a hidden note</h3><p style="font-family:var(--hand);font-size:1.5rem;">${text}</p>`;
}

// ---- Confetti ----
export function confetti(n = 120) {
  const colors = ['#c0392b', '#e8a79e', '#f1c40f', '#7fb9b2', '#b48ec9'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 2.2 + Math.random() * 2.5 + 's';
    p.style.animationDelay = Math.random() * 1.2 + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 6000);
  }
}

// ---- Scroll reveal ----
export function observeReveals() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.15 });
  document.querySelectorAll('.entry').forEach((el) => io.observe(el));
}

export function footer() {
  const f = document.createElement('footer');
  f.textContent = 'made with too much love by gupta²';
  document.body.appendChild(f);
}
