# 🚀 Installation & First Use Guide

## Quick Summary

Your complete name-tag PDF generator is ready! Everything is configured and ready to use.

### What You Have
✅ Modern Vite-powered web app
✅ PDF generation with jsPDF
✅ PDF preview with PDF.js
✅ CSV/manual data input
✅ Zweckform L4785-20 label support
✅ Custom layout configuration
✅ GitHub Pages ready with GitHub Actions

---

## 📦 Step 1: Install Dependencies (2 minutes)

```bash
cd /Users/DATA/TEAM/CODE/name-tag
npm install
```

This installs all required packages:
- **jspdf** - PDF creation library
- **pdfjs-dist** - PDF preview and rendering
- **vite** - Build tool and dev server
- **gh-pages** - GitHub Pages deployment

**What to expect:**
- Creates `node_modules/` folder
- Creates `package-lock.json` file
- No errors should appear

---

## 🏃 Step 2: Run Locally (1 minute)

```bash
npm run dev
```

**What happens:**
- Vite dev server starts
- Opens on `http://localhost:5173`
- Shows "Ready in XX ms"
- Hot reload enabled

**Open in browser and you should see:**
- Header: "Name Tag PDF Generator"
- 4 main sections: Input, Preview, Layout, Generate
- Ready to use!

---

## 🧪 Step 3: Test with Sample Data (2 minutes)

### Option A: Test with Drag & Drop
1. Open browser (http://localhost:5173)
2. Drag `example-data.csv` onto the upload area
3. Click **Parse Data**
4. See 10 names in preview table

### Option B: Test with Manual Input
1. Switch to **Manual Input** tab
2. Paste this:
```
John Doe	CEO
Jane Smith	Manager
Bob Johnson	Developer
```
3. Click **Parse Data**
4. See 3 names in preview table

---

## 📄 Step 4: Generate PDF (1 minute)

1. Make sure you have data loaded (from Step 3)
2. **Layout** is set to "Zweckform L4785-20" (default)
3. Click **Preview PDF** to see it first
4. Or click **Generate PDF** to download

**What happens:**
- PDF generates with your data
- For preview: opens in modal with page navigation
- For download: saves as `name-tags-YYYY-MM-DD.pdf`

---

## 🌍 Step 5: Deploy to GitHub Pages (5 minutes)

### Method 1: Automatic (Recommended)

1. **Enable GitHub Pages**
   ```bash
   # Commit your code first
   git add .
   git commit -m "Initial name-tag generator setup"
   git push origin main
   ```

2. **Configure GitHub Pages**
   - Go to: github.com/StiftungTeamEnsemble/name-tag
   - Click **Settings**
   - Select **Pages** from left menu
   - Under "Build and deployment":
     - Source: **GitHub Actions**
   - Done! 🎉

3. **Automatic Deployment**
   - GitHub Actions runs automatically
   - Builds and deploys to GitHub Pages
   - Site: `https://StiftungTeamEnsemble.github.io/name-tag/`

### Method 2: Manual Deploy

```bash
npm run build
npm run deploy
```

This builds and deploys directly to GitHub Pages.

---

## ✅ Verify Everything Works

### Checklist:

- [ ] `npm install` completed without errors
- [ ] `npm run dev` starts on port 5173
- [ ] App loads in browser at http://localhost:5173
- [ ] Can drag & drop example-data.csv
- [ ] "Parse Data" loads 10 entries
- [ ] Preview table shows names and functions
- [ ] "Generate PDF" creates a PDF file
- [ ] "Preview PDF" shows PDF in modal
- [ ] Can navigate pages in preview
- [ ] Can download PDF from preview
- [ ] `npm run build` creates dist/ folder
- [ ] GitHub Actions deployment runs

---

## 📋 Available Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `npm run dev` | Development server | Testing locally |
| `npm run build` | Production build | Before deployment |
| `npm run preview` | Preview prod build | Test locally |
| `npm run deploy` | Deploy to GitHub Pages | Manual deployment |

---

## 📁 File Overview

**Core Application:**
- `index.html` - Main page
- `src/main.js` - Application logic
- `src/styles.css` - Styling

**Utilities:**
- `src/utils/csvParser.js` - Parse CSV/TSV data
- `src/utils/pdfGenerator.js` - Generate PDFs
- `src/utils/pdfPreviewManager.js` - Preview PDFs

**Configuration:**
- `package.json` - Dependencies and scripts
- `vite.config.js` - Build configuration
- `.github/workflows/deploy.yml` - CI/CD

**Documentation:**
- `README.md` - Full documentation
- `QUICKSTART.md` - Quick start
- `LABELS.md` - Label specifications
- `TECHNICAL.md` - Technical details
- `WORKFLOW.md` - Setup guide
- `PROJECT_SUMMARY.md` - Project overview

---

## 🎯 First Use Workflow

### Print Name Tags

1. **Prepare Data**
   - Export attendee list as CSV
   - Format: Name[TAB]Function

2. **Load in App**
   ```bash
   npm run dev
   ```

3. **Upload Data**
   - Drag & drop CSV or paste manually
   - Click "Parse Data"

4. **Review & Adjust**
   - Check preview table
   - Delete any entries you don't want

5. **Generate PDF**
   - Select layout (Zweckform L4785-20 default)
   - Click "Preview PDF" to check
   - Click "Generate PDF" to download

6. **Print**
   - Open downloaded PDF
   - Print on Zweckform L4785-20 label sheets
   - Cut and use!

---

## 🎨 Customization (Optional)

### Add Your Logo
Edit `src/main.js` in the `drawLabel()` function (TODO item)

### Change Colors
Edit `src/styles.css` - modify `:root` variables

### Add More Presets
Edit `src/main.js` - add to `getSelectedLayout()`

### Change PDF Styling
Edit `src/utils/pdfGenerator.js`

See `TECHNICAL.md` for more details.

---

## 🆘 Troubleshooting

### `npm install` fails
```bash
npm cache clean --force
npm install
```

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build fails
```bash
rm -rf dist
npm run build
```

### PDF.js preview not working
- Check browser console for errors
- Verify you can download PDFs instead
- Try downloading and opening in separate PDF viewer

### GitHub Pages not updating
- Check that GitHub Actions workflow completed
- Go to Settings > Pages to verify deployment
- Clear browser cache (Ctrl+Shift+R)

---

## 📚 Need Help?

**Quick Questions:**
- See `QUICKSTART.md`

**Label Questions:**
- See `LABELS.md`

**Setup/Deployment:**
- See `WORKFLOW.md`

**Technical Questions:**
- See `TECHNICAL.md`

**Full Documentation:**
- See `README.md`

---

## 🚀 You're All Set!

Your name-tag PDF generator is complete and ready to use!

### Next Steps:
1. Run `npm install`
2. Run `npm run dev`
3. Test with example data
4. Customize as needed
5. Deploy to GitHub Pages
6. Share with your team!

---

## 💡 Tips for Best Results

### CSV Format Best Practices
- Use **TAB** as separator (more reliable)
- Use **UTF-8** encoding
- One entry per line
- No headers needed

### PDF Printing
- Use **Best/High** quality print mode
- Set **No scaling** (100%) in printer
- Print to **correct paper size**
- Test print on regular paper first

### Label Sheets
- Zweckform L4785-20 (default preset)
- Check label specifications in `LABELS.md`
- Buy from office supply stores

---

## 🎉 Congratulations!

You now have a professional name-tag PDF generator!

**You can:**
✅ Load data from CSV or manual input
✅ Preview names in real-time
✅ Generate professional PDFs
✅ Preview before printing
✅ Print on Zweckform labels
✅ Deploy to GitHub Pages
✅ Share with your team

**Enjoy creating perfect name tags!** 🏷️
