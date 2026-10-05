import { loadJSON, buildNav, polaroid, footer } from './common.js';

const data = await loadJSON('data/gallery.json');
buildNav('gallery.html');

const head = document.createElement('header');
head.className = 'page-head';
head.innerHTML = `
  <h1>Gallery</h1>
  <div class="subtitle">everything that didn't fit the story</div>`;
document.body.appendChild(head);

const grid = document.createElement('div');
grid.className = 'gallery-grid';
for (const p of data.photos) {
  grid.appendChild(polaroid(p.src, { caption: p.caption }));
}
document.body.appendChild(grid);
footer();
