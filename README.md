# Obsidian Static Site

A simple static site generator that converts Obsidian markdown files into a clean, browsable HTML site.

Perfect for sharing recipes, notes, or any collection of markdown files.

## Features

- 📁 Preserves folder structure as URLs (`/desserts/tiramisu.md` → `/desserts/tiramisu.html`)
- 🌙 Dark mode support (follows system preference)
- 📱 Mobile-friendly responsive design
- 🔗 Auto-generated index with categories
- ✨ Handles Obsidian callouts and wiki links
- 🚀 One-click deploy to GitHub Pages

## Quick Start

### Local Development

1. Clone this repo:
   ```bash
   git clone https://github.com/elazzabi/obsidian-static-site
   cd obsidian-static-site
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` to point to your markdown folder:
   ```env
   SOURCE_DIR=/Users/you/Brain/Food
   SITE_TITLE=My Recipes
   SITE_DESCRIPTION=A collection of my favorite recipes
   ```

5. Build and preview:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

### Deploy to GitHub Pages

**Option A: Copy your markdown files into the repo**

1. Copy your markdown files to `./content/`
2. Push to GitHub
3. Go to repo Settings → Pages → Source: GitHub Actions
4. The site auto-deploys on every push

**Option B: Use a separate content repo (advanced)**

1. Fork this repo
2. Set up a GitHub Action in your content repo to copy files here and trigger a build

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `SOURCE_DIR` | Path to markdown files | `./content` |
| `OUTPUT_DIR` | Build output directory | `./dist` |
| `SITE_TITLE` | Site title in header | `My Recipes` |
| `SITE_DESCRIPTION` | Description on index page | `A collection of recipes` |

## Folder Structure

```
your-markdown-folder/
├── Desserts/
│   ├── Tiramisu.md        → /desserts/tiramisu.html
│   └── Chocolate Cake.md  → /desserts/chocolate-cake.html
├── Mains/
│   └── Pasta.md           → /mains/pasta.html
└── index.md               → Ignored (auto-generated)
```

## Obsidian Compatibility

The generator handles common Obsidian syntax:

- ✅ Standard markdown
- ✅ Tables
- ✅ Code blocks
- ✅ Callouts (`> [!NOTE]`, `> [!TIP]`, etc.)
- ✅ Wiki links are converted to plain text
- ❌ Embedded files (images need to be hosted externally)

## License

MIT
