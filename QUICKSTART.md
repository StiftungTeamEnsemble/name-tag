# Quick Start Guide

## Installation & Running Locally

### 1. Install Dependencies
```bash
npm install
```

This will install:
- **jspdf**: PDF generation library
- **pdfjs-dist**: PDF preview functionality
- **vite**: Modern build tool
- **gh-pages**: GitHub Pages deployment helper

### 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

Output will be in the `dist/` folder.

## First Use - Creating Name Tags

### Step 1: Prepare Your Data
You can use either of two methods:

**Option A: CSV File**
Create a file named `names.csv`:
```
John Doe	CEO
Jane Smith	Manager
Bob Johnson	Developer
```

**Option B: Manual Entry**
Just paste in the text area:
```
John Doe	CEO
Jane Smith	Manager
Bob Johnson	Developer
```

### Step 2: Load Data
1. Click on **CSV Upload** tab or **Manual Input** tab
2. Upload your file or paste your data
3. Click **Parse Data**

### Step 3: Configure Labels
1. **Select Layout**: Choose Zweckform L4785-20 or Custom
2. **Custom Options** (if needed):
   - Set your label dimensions
   - Configure spacing and margins

### Step 4: Generate
1. Click **Generate PDF** to download
2. Or click **Preview PDF** to view first
3. Download when ready

## GitHub Pages Deployment

### Initial Setup
1. Go to repository **Settings** → **Pages**
2. Select **GitHub Actions** as the deployment source
3. Push code to `main` branch

### Automatic Deployment
Every time you push to `main`, GitHub Actions will:
- Run the build
- Deploy to GitHub Pages
- Available at: `https://StiftungTeamEnsemble.github.io/name-tag/`

### Manual Deployment
```bash
npm run deploy
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| PDF generation fails | Check browser console for errors, try different paper format |
| Labels cut off | Adjust margins or label spacing |
| Preview not loading | Ensure PDF.js worker can load from CDN |
| CSV not parsing | Use TAB or comma separators, UTF-8 encoding |

## Example Workflow

1. **Prepare data**: Export attendee list as CSV
2. **Run dev server**: `npm run dev`
3. **Load data**: Drag & drop CSV or paste
4. **Preview**: Click "Preview PDF" to check layout
5. **Generate**: Click "Generate PDF" to download
6. **Print**: Print on Zweckform L4785-20 sheets

## File Locations

- **Data**: `example-data.csv`
- **Styles**: `src/styles.css`
- **Logic**: `src/main.js`
- **Utilities**: `src/utils/`
- **Build config**: `vite.config.js`
- **Deploy config**: `.github/workflows/deploy.yml`

## Next Steps

- Customize colors in `src/styles.css`
- Add more label presets in `src/main.js`
- Modify PDF layout in `src/utils/pdfGenerator.js`
- Create documentation for your team
