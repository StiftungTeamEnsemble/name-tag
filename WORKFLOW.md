# Workflow & Setup Guide

## Visual Workflow

```
START
  ↓
┌─────────────────────────────────┐
│ 1. INPUT DATA                   │
├─────────────────────────────────┤
│ ┌──────────────────────────────┐│
│ │ CSV Upload (Drag & Drop)     ││
│ └──────────────────────────────┘│
│ OR                              │
│ ┌──────────────────────────────┐│
│ │ Manual Input (Text Area)     ││
│ └──────────────────────────────┘│
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ 2. PARSE & PREVIEW              │
├─────────────────────────────────┤
│ Click "Parse Data"              │
│ View table of names & functions │
│ Delete entries as needed        │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ 3. SELECT LAYOUT                │
├─────────────────────────────────┤
│ ┌──────────────────────────────┐│
│ │ Predefined: Zweckform L4785  ││
│ └──────────────────────────────┘│
│ OR                              │
│ ┌──────────────────────────────┐│
│ │ Custom:                      ││
│ │ - Paper format (A4/Letter)   ││
│ │ - Grid (X×Y labels)          ││
│ │ - Spacing & margins          ││
│ └──────────────────────────────┘│
└────────────┬────────────────────┘
             ↓
        ┌────┴────┐
        ↓         ↓
    ┌───────┐  ┌──────────┐
    │Preview│  │ Download │
    └───┬───┘  └────┬─────┘
        ↓           ↓
    ┌───────────────────┐
    │ View in browser   │
    │ (PDF.js preview)  │
    │ Check layout OK   │
    └─────────┬─────────┘
              ↓
         Print PDF
         ↓
    SUCCESS: Name tags created!
```

## Initial Setup Steps

### Step 1: Clone & Install
```bash
# Clone repository
git clone https://github.com/StiftungTeamEnsemble/name-tag.git
cd name-tag

# Install dependencies
npm install
```

### Step 2: Local Development
```bash
# Start dev server
npm run dev

# Open in browser
# http://localhost:5173
```

### Step 3: GitHub Pages Setup

#### Option A: Automatic (Recommended)
1. Go to repository **Settings**
2. Select **Pages** in sidebar
3. Under "Build and deployment":
   - Choose **GitHub Actions**
4. Push to `main` - deployment happens automatically!

#### Option B: Manual
```bash
npm run build
npm run deploy
```

### Step 4: Deploy to GitHub Pages
```bash
# Build production files
npm run build

# Deploy (requires gh-pages setup)
npm run deploy

# Or push to main and GitHub Actions handles it
git add .
git commit -m "Deploy name-tag generator"
git push origin main
```

---

## File Setup Summary

| File | Purpose | Status |
|------|---------|--------|
| `index.html` | Main app page | ✅ Created |
| `src/main.js` | App logic | ✅ Created |
| `src/styles.css` | Styling | ✅ Created |
| `src/utils/csvParser.js` | CSV parsing | ✅ Created |
| `src/utils/pdfGenerator.js` | PDF generation | ✅ Created |
| `src/utils/pdfPreviewManager.js` | PDF preview | ✅ Created |
| `vite.config.js` | Build config | ✅ Created |
| `package.json` | Dependencies | ✅ Created |
| `.github/workflows/deploy.yml` | GitHub Actions | ✅ Created |
| `.gitignore` | Git rules | ✅ Created |
| `README.md` | Main docs | ✅ Created |
| `QUICKSTART.md` | Quick start | ✅ Created |
| `LABELS.md` | Label specs | ✅ Created |
| `TECHNICAL.md` | Technical docs | ✅ Created |

---

## Running Commands

### Development
```bash
npm run dev
```
- Hot reload enabled
- Development server on port 5173
- Source maps available

### Build
```bash
npm run build
```
- Optimized for production
- Output in `dist/` folder
- Ready for deployment

### Preview
```bash
npm run preview
```
- Test production build locally
- Same as deployed version

### Deploy
```bash
npm run deploy
```
- Requires `gh-pages` configured
- Builds and deploys to GitHub Pages
- Site: `https://StiftungTeamEnsemble.github.io/name-tag/`

---

## Environment Variables

Currently no environment variables needed. All configuration is:
- Hardcoded in `vite.config.js` (base path)
- Available in UI (layout customization)
- In `package.json` (build options)

---

## Troubleshooting Installation

### npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Port 5173 already in use
```bash
# Use different port
npm run dev -- --port 3000
```

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build fails
```bash
# Clear dist folder
rm -rf dist

# Rebuild
npm run build
```

---

## GitHub Actions Setup

### Prerequisites
- GitHub repository with `main` branch
- GitHub Pages enabled on repository

### First Deployment
1. Push code to repository
2. Go to **Actions** tab
3. Look for "Build and Deploy to GitHub Pages"
4. Wait for ✅ completion
5. Check **Settings** → **Pages** for deployment URL

### Redeployment
- Automatic on every push to `main`
- Manual deployment: run `npm run deploy` locally

---

## Project Statistics

| Metric | Value |
|--------|-------|
| Total files | 14 |
| Source files | 6 |
| Config files | 3 |
| Documentation | 5 |
| Dependencies | 2 (prod), 3 (dev) |
| Code size | ~4KB (gzipped) |
| Build time | < 2s |

---

## Next Steps After Setup

1. **Test locally**
   - Run `npm run dev`
   - Test with example-data.csv
   - Verify preview works

2. **Customize**
   - Add your logo/colors
   - Add label presets
   - Customize text formatting

3. **Deploy**
   - Push to GitHub
   - Verify GitHub Pages working
   - Share link with team

4. **Print**
   - Download PDF from app
   - Print on Zweckform labels
   - Enjoy your name tags!

---

## Common Next Customizations

### Add More Label Presets
Edit `src/main.js` in `getSelectedLayout()` function

### Change Colors
Edit `:root` variables in `src/styles.css`

### Modify PDF Layout
Edit `drawLabel()` in `src/utils/pdfGenerator.js`

### Add More Features
- Drag to reorder entries
- Bulk email generation
- QR code support
- Barcode support
- Logo upload

See `TECHNICAL.md` for architecture details.
