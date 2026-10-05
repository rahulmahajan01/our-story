import { loadJSON, buildNav, footer } from './common.js';
import { getStorage } from './storage.js';

const config = await loadJSON('data/config.json');
const store = await getStorage();
buildNav('us.html');

const head = document.createElement('header');
head.className = 'page-head';
head.innerHTML = `
  <h1>Us</h1>
  <div class="subtitle">the running total of ${config.names.him.toLowerCase()} + ${config.names.her.toLowerCase()}</div>`;
document.body.appendChild(head);

const wrap = document.createElement('div');
wrap.className = 'us-wrap';
document.body.appendChild(wrap);

// ---------- Live counters ----------
const counters = document.createElement('div');
counters.className = 'counters';
wrap.appendChild(counters);

function daysBetween(a, b) { return Math.floor((b - a) / 86400000); }

function renderCounters() {
  const now = new Date();
  const items = [
    { num: daysBetween(new Date(config.relationshipStart), now), label: 'days of “us” 💘' },
  ];
  const meet = new Date(config.nextMeeting);
  if (meet > now) {
    items.push({ num: Math.ceil((meet - now) / 86400000), label: 'days until the next hug 🤗' });
  } else {
    items.push({ num: '🫂', label: 'no countdown — we\'re together right now' });
  }
  const { him, her } = config.cities;
  if (him.lat != null && her.lat != null) {
    items.push({ num: haversineKm(him, her).toLocaleString(), label: `km between ${him.name} and ${her.name} 🗺️` });
  }
  counters.innerHTML = items
    .map((i) => `<div class="counter"><div class="num">${i.num}</div><div class="label">${i.label}</div></div>`)
    .join('');
}
function haversineKm(a, b) {
  const r = (d) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(h)));
}
renderCounters();
setInterval(renderCounters, 60000);

// ---------- "Things I love about you" notebooks ----------
// Ritual: one new note each birthday. Target count = the reader's new age.
const nbWrap = document.createElement('div');
nbWrap.className = 'notebooks';
wrap.appendChild(nbWrap);

const notes = await store.list('loveNotes');

function age(birthdayISO) {
  const b = new Date(birthdayISO);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const hadBirthday = now.getMonth() > b.getMonth() ||
    (now.getMonth() === b.getMonth() && now.getDate() >= b.getDate());
  if (!hadBirthday) a--;
  return a;
}

function notebook(forKey) {
  const reader = forKey === 'her' ? config.names.her : config.names.him;
  const writer = forKey === 'her' ? config.names.him : config.names.her;
  const bday = forKey === 'her' ? config.birthdays.her : config.birthdays.him;
  const target = age(bday) + 1; // the age they turn on their next/this year's birthday
  const bdayLabel = new Date(bday).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const mine = notes.filter((n) => n.for === forKey).sort((a, b) => (a.year || 0) - (b.year || 0));

  const nb = document.createElement('div');
  nb.className = 'notebook';
  nb.innerHTML = `
    <h3>${target} things ${writer} loves about ${reader}</h3>
    <div class="nb-sub">the ritual: one more every birthday (${bdayLabel}) 🎂</div>`;

  if (mine.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'nb-empty';
    empty.textContent = forKey === 'her'
      ? `✍️ ${writer}, this notebook is empty. ${reader} turns ${target} — she's owed ${target} reasons. Get writing.`
      : `✍️ ${writer}, your pen is waiting. To be written on ${bdayLabel} 🎂`;
    nb.appendChild(empty);
  } else {
    const ol = document.createElement('ol');
    for (const n of mine) {
      const li = document.createElement('li');
      li.textContent = n.text;
      ol.appendChild(li);
    }
    nb.appendChild(ol);
    if (mine.length < target) {
      const owed = document.createElement('div');
      owed.className = 'nb-sub';
      owed.textContent = `${target - mine.length} still owed… 👀`;
      nb.appendChild(owed);
    }
  }

  const add = document.createElement('button');
  add.className = 'nb-add';
  add.textContent = '+ add one';
  add.addEventListener('click', async () => {
    const text = prompt(`A thing ${writer} loves about ${reader}:`);
    if (!text || !text.trim()) return;
    const row = await store.add('loveNotes', { for: forKey, text: text.trim(), year: new Date().getFullYear() });
    notes.push(row);
    rerenderNotebooks();
  });
  nb.appendChild(add);
  return nb;
}

function rerenderNotebooks() {
  nbWrap.innerHTML = '';
  nbWrap.appendChild(notebook('her'));
  nbWrap.appendChild(notebook('him'));
}
rerenderNotebooks();

// ---------- Bucket list ----------
const bucket = document.createElement('div');
bucket.className = 'bucket';
bucket.innerHTML = '<h3>🪣 The bucket list</h3>';
const ul = document.createElement('ul');
bucket.appendChild(ul);
wrap.appendChild(bucket);

let items = await store.list('bucket');

function renderBucket() {
  ul.innerHTML = '';
  if (items.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<span class="txt" style="color:var(--ink-soft)">empty so far — add the first adventure ↓</span>';
    ul.appendChild(li);
  }
  for (const it of items) {
    const li = document.createElement('li');
    li.className = it.done ? 'done' : '';
    li.innerHTML = `<span class="tick">${it.done ? '✓' : ''}</span><span class="txt">${it.text}</span>`;
    li.querySelector('.tick').addEventListener('click', async () => {
      it.done = !it.done;
      await store.update('bucket', it.id, { done: it.done });
      renderBucket();
    });
    ul.appendChild(li);
  }
}
renderBucket();

const addBtn = document.createElement('button');
addBtn.className = 'bk-add';
addBtn.textContent = '+ add to the list';
addBtn.addEventListener('click', async () => {
  const text = prompt('Something we have to do together:');
  if (!text || !text.trim()) return;
  const row = await store.add('bucket', { text: text.trim(), done: false });
  items.push(row);
  renderBucket();
});
bucket.appendChild(addBtn);

if (store.mode === 'local') {
  const note = document.createElement('div');
  note.className = 'storage-note';
  note.textContent = '💾 local mode: things you add save only on this device. Connect Firebase (see README) to share across both of you.';
  wrap.appendChild(note);
}

footer();
