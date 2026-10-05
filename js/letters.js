import { loadJSON, buildNav, confetti, footer } from './common.js';

const data = await loadJSON('data/letters.json');
buildNav('letters.html');

const head = document.createElement('header');
head.className = 'page-head';
head.innerHTML = `
  <h1>Letters</h1>
  <div class="subtitle">some sealed, some waiting to be written</div>`;
document.body.appendChild(head);

const wrap = document.createElement('div');
wrap.className = 'shelf-wrap';
document.body.appendChild(wrap);

// ---------- Milestone shelf ----------
const title1 = document.createElement('h2');
title1.className = 'shelf-title';
title1.textContent = '🗄️ The milestone shelf';
wrap.appendChild(title1);

const shelf = document.createElement('div');
shelf.className = 'shelf';
wrap.appendChild(shelf);

for (const m of data.milestones) {
  const env = document.createElement('div');
  env.className = 'envelope ' + m.state;
  env.innerHTML = `
    <div class="seal">${m.icon}</div>
    <h3>${m.title}</h3>
    <div class="env-date ${m.state === 'teaser' ? 'smudged' : ''}">${m.date}</div>
    <div class="tease-bubble"></div>`;

  env.addEventListener('click', () => {
    if (m.state === 'sealed') {
      askPassword(m);
    } else if (m.state === 'open') {
      openContent(m.content);
    } else {
      env.classList.remove('shake');
      void env.offsetWidth; // restart animation
      env.classList.add('shake');
      const bubble = env.querySelector('.tease-bubble');
      bubble.textContent = m.tease || '…';
      bubble.classList.add('show');
      setTimeout(() => bubble.classList.remove('show'), 2200);
    }
  });
  shelf.appendChild(env);
}

// ---------- Open-when letters ----------
const title2 = document.createElement('h2');
title2.className = 'shelf-title';
title2.textContent = '📬 Open when…';
wrap.appendChild(title2);

const owList = document.createElement('div');
owList.className = 'openwhen-list';
wrap.appendChild(owList);

for (const l of data.openWhen) {
  const card = document.createElement('div');
  card.className = 'ow-letter';
  card.innerHTML = `
    <h4>${l.title}</h4>
    <div class="ow-hint">tap to open (honor system 🤝)</div>
    <div class="ow-body">${l.body}</div>`;
  card.addEventListener('click', () => card.classList.toggle('open'));
  owList.appendChild(card);
}

footer();

// ---------- Unsealed envelope: show the letter ----------
function openContent(content) {
  const back = document.createElement('div');
  back.className = 'modal-backdrop show';
  back.innerHTML = `
    <div class="modal">
      <h3>${content.title}</h3>
      <p style="white-space:pre-wrap;text-align:left;color:var(--ink-soft);">${content.body}</p>
      ${content.link ? `<a class="btn-big" style="margin-top:0.9rem;font-size:1.15rem;" href="${content.link.href}">${content.link.label}</a>` : ''}
    </div>`;
  back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });
  document.body.appendChild(back);
}

// ---------- Password modal + decryption ----------
function askPassword(milestone) {
  const back = document.createElement('div');
  back.className = 'modal-backdrop show';
  back.innerHTML = `
    <div class="modal">
      <h3>${milestone.icon} ${milestone.title}</h3>
      <div class="hint">${milestone.passwordHint || 'enter the password'}</div>
      <input type="tel" inputmode="numeric" autocomplete="off" placeholder="••••••••">
      <div class="err"></div>
      <button class="btn-big">unseal</button>
    </div>`;
  document.body.appendChild(back);
  back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });

  const input = back.querySelector('input');
  const err = back.querySelector('.err');
  const btn = back.querySelector('button');
  input.focus();

  const attempt = async () => {
    err.textContent = '';
    btn.disabled = true;
    // Web Crypto only exists on HTTPS or localhost; say so instead of blaming the password.
    if (!window.crypto?.subtle) {
      err.textContent = 'this page must be opened via localhost or https — not a LAN IP';
      btn.disabled = false;
      return;
    }
    let payload;
    try {
      const res = await fetch(milestone.encrypted);
      if (!res.ok) throw new Error(res.status);
      payload = await res.json();
    } catch {
      err.textContent = `couldn't load ${milestone.encrypted} — is the file there?`;
      btn.disabled = false;
      return;
    }
    try {
      const content = await decrypt(payload, input.value.trim());
      back.remove();
      runAsk(JSON.parse(content));
    } catch {
      err.textContent = 'hmm, not that… think DDMMYYYY 💭';
      btn.disabled = false;
      input.select();
    }
  };
  btn.addEventListener('click', attempt);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') attempt(); });
}

// AES-256-GCM, key from PBKDF2-SHA256 (150k iterations). Mirrors tools/seal-envelope.mjs.
async function decrypt({ salt, iv, ct }, password) {
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(salt), iterations: 150000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(iv) }, key, b64(ct));
  return new TextDecoder().decode(plain);
}

// ---------- The Ask: fullscreen takeover ----------
function runAsk(content) {
  const screen = document.createElement('div');
  screen.className = 'ask-screen show';
  screen.innerHTML = `
    <div class="ask-inner">
      <h1>${content.question}</h1>
      ${content.image ? `<img class="ask-gif" src="${content.image}" alt="">` : ''}
      <div class="ask-buttons">
        <button class="btn-big" id="btn-yes">${content.yesLabel || 'Yes'}</button>
        <button id="btn-no">${content.noLabel || 'No'}</button>
      </div>
      <div class="itinerary"></div>
    </div>`;
  document.body.appendChild(screen);

  const noBtn = screen.querySelector('#btn-no');
  const yesBtn = screen.querySelector('#btn-yes');
  const noLines = content.noLines || ['nope 😌', 'still no', 'the button remembers 2024'];
  let dodges = 0;

  const flee = () => {
    noBtn.classList.add('fleeing');
    const pad = 20;
    const w = noBtn.offsetWidth, h = noBtn.offsetHeight;
    noBtn.style.left = pad + Math.random() * (window.innerWidth - w - pad * 2) + 'px';
    noBtn.style.top = pad + Math.random() * (window.innerHeight - h - pad * 2) + 'px';
    noBtn.textContent = noLines[Math.min(dodges, noLines.length - 1)];
    dodges++;
  };
  noBtn.addEventListener('mouseenter', flee);
  noBtn.addEventListener('touchstart', (e) => { e.preventDefault(); flee(); }, { passive: false });
  noBtn.addEventListener('click', flee);

  yesBtn.addEventListener('click', () => {
    noBtn.remove();
    yesBtn.remove();
    screen.querySelector('h1').textContent = content.yesTitle || 'She said yes!! 🎉';
    confetti(160);
    const itin = screen.querySelector('.itinerary');
    itin.classList.add('show');
    const rows = (content.itinerary.rows || [])
      .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    itin.innerHTML = `
      <h2>${content.itinerary.title}</h2>
      <dl>${rows}</dl>
      <div class="note">${content.itinerary.note || ''}</div>`;
  });
}
