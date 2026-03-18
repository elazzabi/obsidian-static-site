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

// HTML template
const htmlTemplate = (title, content, breadcrumbs = '', isIndex = false) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${SITE_TITLE}</title>
  <style>
    :root {
      --bg: #fefefe;
      --text: #333;
      --accent: #e67e22;
      --muted: #666;
      --border: #eee;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1a1a;
        --text: #e0e0e0;
        --accent: #f39c12;
        --muted: #999;
        --border: #333;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.7;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
      background: var(--bg);
      color: var(--text);
    }
    header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    header a {
      color: var(--accent);
      text-decoration: none;
      font-weight: 600;
    }
    h1 { margin-top: 0; color: var(--accent); }
    h2, h3 { color: var(--text); margin-top: 2rem; }
    a { color: var(--accent); }
    .breadcrumbs { color: var(--muted); font-size: 0.9rem; margin-bottom: 1rem; }
    .breadcrumbs a { color: var(--muted); }
    ul.index { list-style: none; padding: 0; }
    ul.index li { padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
    ul.index a { text-decoration: none; font-size: 1.1rem; }
    .category { margin: 2rem 0; }
    .category h2 { 
      font-size: 1rem; 
      text-transform: uppercase; 
      letter-spacing: 0.1em;
      color: var(--muted);
      margin-bottom: 0.5rem;
    }
    pre {
      background: var(--border);
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      background: var(--border);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 4px solid var(--accent);
      margin: 1rem 0;
      padding-left: 1rem;
      color: var(--muted);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td {
      text-align: left;
      padding: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <header>
    <a href="/">${SITE_TITLE}</a>
  </header>
  ${breadcrumbs ? `<div class="breadcrumbs">${breadcrumbs}</div>` : ''}
  <main>
    ${content}
  </main>
  <footer>
    Generated with <a href="https://github.com/elazzabi/obsidian-static-site">obsidian-static-site</a>
  </footer>
</body>
</html>`;

// Utility functions
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
      files.push({
        sourcePath: fullPath,
        relativePath: relativePath,
        urlPath: relativePath.replace(/\.md$/, '.html'),
        name: item.replace(/\.md$/, ''),
        category: path.dirname(relativePath) === '.' ? null : path.dirname(relativePath)
      });
    }
  }
  
  return files;
}

function generateBreadcrumbs(urlPath) {
  const parts = urlPath.split('/').filter(Boolean);
  if (parts.length <= 1) return '';
  
  let crumbs = '<a href="/">Home</a>';
  let currentPath = '';
  
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
  
  // Root files first
  if (rootFiles.length > 0) {
    content += '<ul class="index">\n';
    for (const file of rootFiles.sort((a, b) => a.name.localeCompare(b.name))) {
      content += `  <li><a href="/${file.urlPath}">${file.name}</a></li>\n`;
    }
    content += '</ul>\n';
  }
  
  // Then categories
  const sortedCategories = Object.keys(categories).sort();
  for (const category of sortedCategories) {
    const categoryFiles = categories[category].sort((a, b) => a.name.localeCompare(b.name));
    content += `<div class="category">\n`;
    content += `  <h2>${category}</h2>\n`;
    content += '  <ul class="index">\n';
    for (const file of categoryFiles) {
      content += `    <li><a href="/${file.urlPath}">${file.name}</a></li>\n`;
    }
    content += '  </ul>\n</div>\n';
  }
  
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
