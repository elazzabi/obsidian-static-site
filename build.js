#!/usr/bin/env node
/**
 * Obsidian Static Site Generator
 * Converts a folder of markdown files into a static HTML site.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const fm = require('front-matter');

// Configuration
const SOURCE_DIR = process.env.SOURCE_DIR || './content';
const OUTPUT_DIR = process.env.OUTPUT_DIR || './dist';
const SITE_TITLE = process.env.SITE_TITLE || 'My Recipes';
const SITE_DESCRIPTION = process.env.SITE_DESCRIPTION || 'A collection of recipes';
const BASE_PATH = process.env.BASE_PATH || ''; // e.g., '/obsidian-static-site' for GitHub Pages

// HTML template
const htmlTemplate = (title, content, breadcrumbs = '', isIndex = false) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${SITE_TITLE}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    :root {
      --bg: #ffffff;
      --bg-secondary: #f9fafb;
      --bg-tertiary: #f3f4f6;
      --text: #111827;
      --text-secondary: #6b7280;
      --text-tertiary: #9ca3af;
      --accent: #5046e5;
      --accent-light: #eef2ff;
      --border: #e5e7eb;
      --border-light: #f3f4f6;
      --success: #10b981;
      --success-bg: #ecfdf5;
      --warning: #f59e0b;
      --warning-bg: #fffbeb;
      --info: #3b82f6;
      --info-bg: #eff6ff;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --radius: 8px;
      --radius-lg: 12px;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0a0a0b;
        --bg-secondary: #111113;
        --bg-tertiary: #1a1a1d;
        --text: #f9fafb;
        --text-secondary: #9ca3af;
        --text-tertiary: #6b7280;
        --accent: #818cf8;
        --accent-light: #1e1b4b;
        --border: #27272a;
        --border-light: #1f1f23;
        --success: #34d399;
        --success-bg: #064e3b;
        --warning: #fbbf24;
        --warning-bg: #451a03;
        --info: #60a5fa;
        --info-bg: #1e3a5f;
        --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
        --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.4);
        --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
      }
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px;
      line-height: 1.7;
      background: var(--bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }
    
    /* Header */
    header {
      margin-bottom: 3rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    
    header a {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
      text-decoration: none;
      letter-spacing: -0.01em;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    header a:hover { color: var(--accent); }
    
    header a::before {
      content: '←';
      font-size: 1rem;
      opacity: 0.5;
    }
    
    /* Breadcrumbs */
    .breadcrumbs {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      margin-bottom: 1.5rem;
    }
    
    .breadcrumbs a {
      color: var(--text-secondary);
      text-decoration: none;
    }
    
    .breadcrumbs a:hover { color: var(--accent); }
    
    /* Typography */
    h1 {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin-bottom: 1.5rem;
      color: var(--text);
    }
    
    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      color: var(--text);
    }
    
    h3 {
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      color: var(--text);
    }
    
    p { margin-bottom: 1rem; color: var(--text-secondary); }
    
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    
    strong { font-weight: 600; color: var(--text); }
    
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 2.5rem 0;
    }
    
    /* Lists */
    ul, ol {
      margin: 1rem 0;
      padding-left: 1.5rem;
      color: var(--text-secondary);
    }
    
    li {
      margin-bottom: 0.5rem;
      padding-left: 0.25rem;
    }
    
    li::marker { color: var(--text-tertiary); }
    
    /* Index list (home page) */
    ul.index {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    
    ul.index li {
      margin: 0;
      padding: 0;
    }
    
    ul.index a {
      display: flex;
      align-items: center;
      padding: 0.875rem 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius);
      color: var(--text);
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    
    ul.index a:hover {
      background: var(--bg-tertiary);
      border-color: var(--border);
      transform: translateX(4px);
    }
    
    ul.index a::after {
      content: '→';
      margin-left: auto;
      color: var(--text-tertiary);
      font-size: 0.875rem;
    }
    
    /* Categories */
    .category {
      margin: 2.5rem 0;
    }
    
    .category h2 {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      margin-bottom: 0.75rem;
      margin-top: 0;
    }
    
    /* Callouts / Blockquotes */
    blockquote {
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-left: 3px solid var(--accent);
      border-radius: var(--radius);
      padding: 1rem 1.25rem;
      margin: 1.5rem 0;
      color: var(--text-secondary);
    }
    
    blockquote p { margin: 0; }
    blockquote p + p { margin-top: 0.75rem; }
    
    blockquote strong {
      display: block;
      color: var(--text);
      margin-bottom: 0.25rem;
    }
    
    /* Info/Note callout */
    blockquote:has(strong:first-child) {
      background: var(--info-bg);
      border-color: var(--info);
      border-left-color: var(--info);
    }
    
    /* Code */
    code {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 0.875em;
      background: var(--bg-tertiary);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      color: var(--text);
    }
    
    pre {
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius);
      padding: 1rem 1.25rem;
      overflow-x: auto;
      margin: 1.5rem 0;
    }
    
    pre code {
      background: none;
      padding: 0;
      font-size: 0.8125rem;
      line-height: 1.6;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.875rem;
    }
    
    th {
      text-align: left;
      font-weight: 600;
      color: var(--text);
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
    }
    
    th:first-child { border-radius: var(--radius) 0 0 0; }
    th:last-child { border-radius: 0 var(--radius) 0 0; }
    
    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-light);
      color: var(--text-secondary);
    }
    
    tr:hover td { background: var(--bg-secondary); }
    
    /* Images */
    img {
      max-width: 100%;
      height: auto;
      border-radius: var(--radius);
      margin: 1.5rem 0;
    }
    
    /* Footer */
    footer {
      margin-top: 4rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      color: var(--text-tertiary);
      font-size: 0.8125rem;
    }
    
    footer a { color: var(--text-secondary); }
    footer a:hover { color: var(--accent); }
    
    /* Page title styling for index */
    main > h1:first-child {
      margin-bottom: 0.5rem;
    }
    
    main > h1:first-child + p {
      font-size: 1.0625rem;
      color: var(--text-secondary);
      margin-bottom: 2.5rem;
    }
    
    /* Filters */
    .filters {
      background: var(--bg-secondary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      margin-bottom: 2rem;
    }
    
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .filter-row:last-of-type { margin-bottom: 0.75rem; }
    
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .filter-group > label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
    }
    
    .filter-group select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg);
      color: var(--text);
      font-size: 0.875rem;
      font-family: inherit;
      cursor: pointer;
    }
    
    .filter-group select:focus {
      outline: none;
      border-color: var(--accent);
    }
    
    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    
    .checkbox {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      cursor: pointer;
      text-transform: capitalize;
    }
    
    .checkbox input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
      accent-color: var(--accent);
      cursor: pointer;
    }
    
    .filter-status {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-light);
    }
    
    .filter-status span {
      font-weight: 600;
      color: var(--accent);
    }
    
    /* Recipe cards with badges */
    .recipe-list a {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
    
    .recipe-name {
      font-weight: 500;
    }
    
    .recipe-badges {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      font-weight: 400;
    }
    
    .recipe-list a::after {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
    }
    
    .recipe-list li {
      position: relative;
    }
    
    /* Responsive */
    @media (max-width: 640px) {
      .container { padding: 2rem 1rem; }
      h1 { font-size: 1.5rem; }
      h2 { font-size: 1.125rem; }
      .filter-row { flex-direction: column; gap: 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="${BASE_PATH}/">${SITE_TITLE}</a>
    </header>
    ${breadcrumbs ? `<div class="breadcrumbs">${breadcrumbs}</div>` : ''}
    <main>
      ${content}
    </main>
    <footer>
      Built with <a href="https://github.com/elazzabi/obsidian-static-site">obsidian-static-site</a>
    </footer>
  </div>
</body>
</html>`;

// Utility functions
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-\.\/]+/g, '')   // Remove special chars (keep . / -)
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getAllMarkdownFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip hidden directories
      if (!item.startsWith('.')) {
        files.push(...getAllMarkdownFiles(fullPath, baseDir));
      }
    } else if (item.endsWith('.md') && !item.startsWith('.')) {
      const relativePath = path.relative(baseDir, fullPath);
      const urlPath = slugify(relativePath.replace(/\.md$/, '.html'));
      
      // Parse frontmatter
      const source = fs.readFileSync(fullPath, 'utf8');
      const { attributes } = fm(source);
      
      files.push({
        sourcePath: fullPath,
        relativePath: relativePath,
        urlPath: urlPath,
        name: item.replace(/\.md$/, ''),
        category: path.dirname(relativePath) === '.' ? null : path.dirname(relativePath),
        // Frontmatter metadata
        meta: {
          prep_time: attributes.prep_time || null,
          cook_time: attributes.cook_time || null,
          total_time: attributes.total_time || null,
          servings: attributes.servings || null,
          equipment: attributes.equipment || [],
          difficulty: attributes.difficulty || null,
          freezable: attributes.freezable || false
        }
      });
    }
  }
  
  return files;
}

function generateBreadcrumbs(urlPath) {
  const parts = urlPath.split('/').filter(Boolean);
  if (parts.length <= 1) return '';
  
  let crumbs = `<a href="${BASE_PATH}/">Home</a>`;
  let currentPath = BASE_PATH;
  
  for (let i = 0; i < parts.length - 1; i++) {
    currentPath += '/' + parts[i];
    crumbs += ` / <a href="${currentPath}/index.html">${parts[i]}</a>`;
  }
  
  return crumbs;
}

function processObsidianSyntax(content) {
  // Convert Obsidian callouts to blockquotes
  content = content.replace(/>\s*\[!(NOTE|INFO|TIP|WARNING|IMPORTANT)\]\s*(.*)/gi, (match, type, title) => {
    return `> **${type}${title ? ': ' + title : ''}**`;
  });
  
  // Remove Obsidian wiki links but keep text: [[link|text]] -> text, [[link]] -> link
  content = content.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  content = content.replace(/\[\[([^\]]+)\]\]/g, '$1');
  
  return content;
}

function buildPage(file) {
  const source = fs.readFileSync(file.sourcePath, 'utf8');
  const { attributes, body } = fm(source);
  
  const processedBody = processObsidianSyntax(body);
  const htmlContent = marked.parse(processedBody);
  
  const title = attributes.title || file.name;
  const breadcrumbs = generateBreadcrumbs(file.urlPath);
  
  return htmlTemplate(title, htmlContent, breadcrumbs);
}

function buildIndex(files) {
  // Collect all unique equipment
  const allEquipment = new Set();
  files.forEach(f => {
    if (f.meta.equipment) {
      f.meta.equipment.forEach(e => allEquipment.add(e));
    }
  });
  
  // Group files by category
  const categories = {};
  const rootFiles = [];
  
  for (const file of files) {
    if (file.category) {
      if (!categories[file.category]) {
        categories[file.category] = [];
      }
      categories[file.category].push(file);
    } else {
      rootFiles.push(file);
    }
  }
  
  let content = `<h1>${SITE_TITLE}</h1>\n<p>${SITE_DESCRIPTION}</p>\n`;
  
  // Filter controls
  content += `
<div class="filters">
  <div class="filter-row">
    <div class="filter-group">
      <label>⏱️ Time</label>
      <select id="filter-time">
        <option value="all">All</option>
        <option value="15">Under 15 min</option>
        <option value="30">Under 30 min</option>
        <option value="60">Under 1 hour</option>
      </select>
    </div>
    <div class="filter-group">
      <label>📊 Difficulty</label>
      <select id="filter-difficulty">
        <option value="all">All</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
  </div>
  <div class="filter-row">
    <div class="filter-group">
      <label>🔧 Equipment</label>
      <div class="checkbox-group">
        ${[...allEquipment].sort().map(e => `<label class="checkbox"><input type="checkbox" value="${e}" class="filter-equipment"> ${e}</label>`).join('\n        ')}
      </div>
    </div>
    <div class="filter-group">
      <label class="checkbox"><input type="checkbox" id="filter-freezable"> ❄️ Freezable only</label>
    </div>
  </div>
  <div class="filter-status">
    <span id="filter-count">${files.length}</span> of ${files.length} recipes
  </div>
</div>
`;
  
  // Helper to generate recipe card
  function recipeCard(file) {
    const meta = file.meta;
    const dataAttrs = `data-time="${meta.total_time || 999}" data-difficulty="${meta.difficulty || ''}" data-equipment="${(meta.equipment || []).join(',')}" data-freezable="${meta.freezable}"`;
    
    let badges = [];
    if (meta.total_time) badges.push(`${meta.total_time} min`);
    if (meta.difficulty) badges.push(meta.difficulty);
    if (meta.freezable) badges.push('❄️');
    
    return `    <li class="recipe-card" ${dataAttrs}>
      <a href="${BASE_PATH}/${file.urlPath}">
        <span class="recipe-name">${file.name}</span>
        ${badges.length ? `<span class="recipe-badges">${badges.join(' • ')}</span>` : ''}
      </a>
    </li>`;
  }
  
  // Root files first
  if (rootFiles.length > 0) {
    content += '<ul class="index recipe-list">\n';
    for (const file of rootFiles.sort((a, b) => a.name.localeCompare(b.name))) {
      content += recipeCard(file) + '\n';
    }
    content += '</ul>\n';
  }
  
  // Then categories
  const sortedCategories = Object.keys(categories).sort();
  for (const category of sortedCategories) {
    const categoryFiles = categories[category].sort((a, b) => a.name.localeCompare(b.name));
    content += `<div class="category">\n`;
    content += `  <h2>${category}</h2>\n`;
    content += '  <ul class="index recipe-list">\n';
    for (const file of categoryFiles) {
      content += recipeCard(file) + '\n';
    }
    content += '  </ul>\n</div>\n';
  }
  
  // Filter JavaScript
  content += `
<script>
(function() {
  const cards = document.querySelectorAll('.recipe-card');
  const timeSelect = document.getElementById('filter-time');
  const difficultySelect = document.getElementById('filter-difficulty');
  const equipmentCheckboxes = document.querySelectorAll('.filter-equipment');
  const freezableCheckbox = document.getElementById('filter-freezable');
  const countSpan = document.getElementById('filter-count');
  
  function applyFilters() {
    const maxTime = timeSelect.value === 'all' ? 9999 : parseInt(timeSelect.value);
    const difficulty = difficultySelect.value;
    const selectedEquipment = [...equipmentCheckboxes].filter(cb => cb.checked).map(cb => cb.value);
    const freezableOnly = freezableCheckbox.checked;
    
    let visibleCount = 0;
    
    cards.forEach(card => {
      const time = parseInt(card.dataset.time) || 9999;
      const cardDifficulty = card.dataset.difficulty;
      const cardEquipment = card.dataset.equipment ? card.dataset.equipment.split(',') : [];
      const cardFreezable = card.dataset.freezable === 'true';
      
      let show = true;
      
      // Time filter
      if (time > maxTime) show = false;
      
      // Difficulty filter
      if (difficulty !== 'all' && cardDifficulty !== difficulty) show = false;
      
      // Equipment filter (must have ALL selected)
      if (selectedEquipment.length > 0) {
        const hasAll = selectedEquipment.every(e => cardEquipment.includes(e));
        if (!hasAll) show = false;
      }
      
      // Freezable filter
      if (freezableOnly && !cardFreezable) show = false;
      
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    
    countSpan.textContent = visibleCount;
  }
  
  timeSelect.addEventListener('change', applyFilters);
  difficultySelect.addEventListener('change', applyFilters);
  equipmentCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
  freezableCheckbox.addEventListener('change', applyFilters);
})();
</script>
`;
  
  return htmlTemplate(SITE_TITLE, content, '', true);
}

// Main build function
function build() {
  console.log(`📁 Source: ${SOURCE_DIR}`);
  console.log(`📤 Output: ${OUTPUT_DIR}`);
  
  // Check source exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    console.log('   Create a .env file with SOURCE_DIR=/path/to/your/markdown/files');
    process.exit(1);
  }
  
  // Clean and create output dir
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  ensureDir(OUTPUT_DIR);
  
  // Get all markdown files
  const files = getAllMarkdownFiles(SOURCE_DIR);
  console.log(`📄 Found ${files.length} markdown files`);
  
  if (files.length === 0) {
    console.log('⚠️  No markdown files found in source directory');
    process.exit(0);
  }
  
  // Build each page
  for (const file of files) {
    const outputPath = path.join(OUTPUT_DIR, file.urlPath);
    ensureDir(path.dirname(outputPath));
    
    const html = buildPage(file);
    fs.writeFileSync(outputPath, html);
    console.log(`  ✓ ${file.urlPath}`);
  }
  
  // Build index
  const indexHtml = buildIndex(files);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
  console.log(`  ✓ index.html`);
  
  console.log(`\n✅ Built ${files.length + 1} pages to ${OUTPUT_DIR}`);
}

build();
