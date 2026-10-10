import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const catalogPath = path.join(root, "audit/menu-pdf-audit/cloudinary-menu-catalog-ready.json");
const outputPath = path.join(root, "audit/menu-qa-gallery.html");

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const { categories = [], products = [] } = catalog;

const catMap = new Map(categories.map((c) => [c.id, c.name]));

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sushi Bar №1 — Меню QA Галерея (${products.length} блюд)</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --border: #334155;
      --tag: #475569;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
      line-height: 1.5;
    }
    header {
      max-width: 1600px;
      margin: 0 auto 24px auto;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }
    h1 { font-size: 24px; font-weight: 700; color: #fff; }
    .stats { color: var(--muted); font-size: 14px; }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    input[type="text"], select {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    input[type="text"]:focus, select:focus {
      border-color: var(--accent);
    }
    .grid {
      max-width: 1600px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
    }
    .img-wrap {
      width: 100%;
      height: 220px;
      background: #090d16;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.2s ease;
    }
    .card:hover .img-wrap img {
      transform: scale(1.03);
    }
    .content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 8px;
    }
    .badge-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    .category-badge {
      background: var(--tag);
      color: #e2e8f0;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    .price-badge {
      font-weight: 700;
      color: #34d399;
      font-size: 15px;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }
    .description {
      font-size: 13px;
      color: var(--muted);
      flex: 1;
    }
    .meta {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.06);
      font-size: 11px;
      font-family: monospace;
      color: #64748b;
      word-break: break-all;
    }
    .url-link {
      color: var(--accent);
      text-decoration: none;
      font-size: 11px;
      word-break: break-all;
      display: inline-block;
      margin-top: 4px;
    }
    .url-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Visual QA Gallery — Sushi Bar №1</h1>
      <div class="stats">Всего товаров: <strong id="totalCount">${products.length}</strong> | Отображается: <strong id="visibleCount">${products.length}</strong></div>
    </div>
    <div class="filters">
      <input type="text" id="searchInput" placeholder="Поиск по названию / составу / ID..." style="width: 280px;">
      <select id="categorySelect">
        <option value="">Все категории (${categories.length})</option>
        ${categories.map((c) => `<option value="${c.id}">${c.name} (${c.productCount})</option>`).join("\n        ")}
      </select>
    </div>
  </header>

  <main class="grid" id="productGrid">
    ${products.map((p, idx) => {
      const catName = catMap.get(p.categoryId) || p.categoryId;
      const weightInfo = p.weight ? ` · ${p.weight}` : (p.sizeLabel ? ` · ${p.sizeLabel}` : "");
      return `
      <article class="card" data-cat="${p.categoryId}" data-text="${(p.name + ' ' + (p.description || '') + ' ' + p.id).toLowerCase()}">
        <div class="img-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='/images/menu/pdf/${p.id}.webp';">
        </div>
        <div class="content">
          <div class="badge-row">
            <span class="category-badge">${catName}</span>
            <span class="price-badge">${p.price ? p.price + ' сом' : 'нет цены'}</span>
          </div>
          <h2 class="title">${idx + 1}. ${p.name}${weightInfo}</h2>
          <p class="description"><strong>Состав:</strong> ${p.description || '—'}</p>
          <div class="meta">
            <div><strong>ID:</strong> ${p.id}</div>
            <a href="${p.image}" target="_blank" class="url-link">Открыть оригинал фото ↗</a>
          </div>
        </div>
      </article>
      `;
    }).join("\n")}
  </main>

  <script>
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categorySelect');
    const cards = Array.from(document.querySelectorAll('.card'));
    const visibleCount = document.getElementById('visibleCount');

    function filterCards() {
      const q = searchInput.value.trim().toLowerCase();
      const cat = categorySelect.value;
      let count = 0;

      cards.forEach(card => {
        const matchesCat = !cat || card.getAttribute('data-cat') === cat;
        const matchesText = !q || card.getAttribute('data-text').includes(q);
        if (matchesCat && matchesText) {
          card.style.display = '';
          count++;
        } else {
          card.style.display = 'none';
        }
      });
      visibleCount.textContent = count;
    }

    searchInput.addEventListener('input', filterCards);
    categorySelect.addEventListener('change', filterCards);
  </script>
</body>
</html>`;

await writeFile(outputPath, html, "utf8");
console.log(`Галерея сгенерирована: ${outputPath} (${products.length} карточек)`);
