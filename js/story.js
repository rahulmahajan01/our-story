import { loadJSON, buildNav, setEraSong, polaroid, observeReveals, footer } from './common.js';

const story = await loadJSON('data/story.json');
buildNav('index.html');

const head = document.createElement('header');
head.className = 'page-head';
head.innerHTML = `
  <h1>${story.intro.title}</h1>
  <div class="subtitle">${story.intro.subtitle}</div>
  <div class="note">${story.intro.note}</div>`;
document.body.appendChild(head);

const main = document.createElement('main');
main.className = 'timeline';
document.body.appendChild(main);

for (const era of story.eras) {
  const sec = document.createElement('section');
  sec.className = 'era' + (era.quiet ? ' quiet' : '');
  sec.dataset.song = era.song || '';
  sec.innerHTML = `<h2>${era.title}</h2>`;

  for (const entry of era.entries) {
    const card = document.createElement('article');
    card.className = 'entry' + (entry.flourish ? ' flourish' : '');
    card.innerHTML = `
      <span class="date-stamp">${entry.date}</span>
      <h3>${entry.title}</h3>
      <p>${entry.text}</p>`;

    if (entry.photos && entry.photos.length) {
      const row = document.createElement('div');
      row.className = 'photo-row';
      entry.photos.forEach((src, i) => {
        // The egg rides on the first photo of the entry.
        row.appendChild(polaroid(src, { egg: i === 0 ? entry.egg : null }));
      });
      card.appendChild(row);
      if (entry.egg && entry.egg.hint) {
        const hint = document.createElement('div');
        hint.className = 'egg-hint';
        hint.textContent = entry.egg.hint;
        card.appendChild(hint);
      }
    }

    if (entry.archive) {
      const a = document.createElement('a');
      a.className = 'archive-card';
      a.href = entry.archive.href;
      a.innerHTML = `${entry.archive.label}<small>the 2024 website, every pixel intact — including the No button that still runs away</small>`;
      card.appendChild(a);
    }

    sec.appendChild(card);
  }

  if (era.finale) {
    const fin = document.createElement('div');
    fin.className = 'finale';
    fin.innerHTML = `
      <p>${era.finale.text}</p>
      <a class="btn-big" href="${era.finale.cta.href}">${era.finale.cta.label}</a>`;
    sec.appendChild(fin);
  }

  main.appendChild(sec);
}

footer();
observeReveals();

// Crossfade era songs as each era scrolls into view.
const eraIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting && e.target.dataset.song) setEraSong(e.target.dataset.song);
  }
}, { threshold: 0.4 });
document.querySelectorAll('section.era').forEach((s) => eraIO.observe(s));
