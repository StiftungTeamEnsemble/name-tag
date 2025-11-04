# 🏷️ Name Tag PDF Generator - Quick Reference Card

## 📌 One-Page Cheat Sheet

### Installation & Running
```bash
npm install          # Install once
npm run dev          # Run locally → http://localhost:5173
npm run build        # Build for production
npm run deploy       # Deploy to GitHub Pages
```

### Data Format
```
Name[TAB]Function
John Doe	CEO
Jane Smith	Manager
Bob Johnson	Developer
```

### Workflow
1. **Load Data** → Drag CSV or paste text
2. **Parse** → Click "Parse Data"
3. **Review** → Check preview table
4. **Configure** → Select layout
5. **Generate** → Preview or Download PDF
6. **Print** → Use Zweckform L4785-20 or custom labels

---

## 🎯 Feature Matrix

| Feature | Status | Where |
|---------|--------|-------|
| CSV Upload | ✅ | Drag & drop area |
| Manual Input | ✅ | Text area |
| CSV Preview | ✅ | Data table |
| PDF Generate | ✅ | "Generate PDF" button |
| PDF Preview | ✅ | "Preview PDF" button |
| Zweckform Preset | ✅ | Layout dropdown |
| Custom Layout | ✅ | Layout dropdown |
| Multiple Pages | ✅ | Automatic |
| Download | ✅ | Auto-download or preview |

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main app |
| `src/main.js` | Logic |
| `src/utils/csvParser.js` | Parse data |
| `src/utils/pdfGenerator.js` | Create PDF |
| `src/utils/pdfPreviewManager.js` | Show preview |
| `package.json` | Dependencies |
| `vite.config.js` | Build config |

---

## 🏷️ Label Specs

### Zweckform L4785-20 (Default)
- Size: 52.5 × 21.2 mm
- Grid: 4 × 20 (80 labels)
- Paper: A4
- Gap: 1mm (X), 0mm (Y)

### Custom Layout Parameters
- Paper Format: A4 / Letter / A3
- Grid: X columns × Y rows
- Gap: X/Y spacing (mm)
- Margins: Left/Top (mm)

---

## 📚 Documentation

| Doc | For |
|-----|-----|
| **SETUP.md** | Installation |
| **QUICKSTART.md** | First use |
| **README.md** | Full features |
| **LABELS.md** | Label info |
| **TECHNICAL.md** | Code details |
| **WORKFLOW.md** | Deployment |
| **INDEX.md** | Navigation |

---

## ⌨️ Keyboard Shortcuts

| Action | Method |
|--------|--------|
| Upload CSV | Click upload area or drag-drop |
| Tab switch | Click "CSV Upload" or "Manual Input" |
| Parse data | Click "Parse Data" button |
| Preview PDF | Click "Preview PDF" button |
| Next page | Click ► in preview |
| Prev page | Click ◄ in preview |
| Download | Auto-download or click in preview |

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| npm install fails | `npm cache clean --force && npm install` |
| Port 5173 taken | `npm run dev -- --port 3000` |
| Module not found | `rm -rf node_modules && npm install` |
| PDF not preview | Try download instead |
| CSV won't parse | Check TAB separator, UTF-8 encoding |

---

## 🌍 GitHub Pages

### Setup
1. Repo Settings → Pages
2. Source: GitHub Actions
3. Push to main

### URL
```
https://StiftungTeamEnsemble.github.io/name-tag/
```

---

## 💻 Environment

| Tool | Version |
|------|---------|
| Node.js | 16+ |
| npm | Latest |
| jsPDF | 2.5.1 |
| PDF.js | 4.0.379 |
| Vite | 5.0.8 |

---

## 📋 CSV Examples

### Tab-Separated ✅ Recommended
```
John Doe	CEO
Jane Smith	Manager
```

### Comma-Separated ✅ Works
```
John Doe,CEO
Jane Smith,Manager
```

---

## 🎨 Customization

### Colors
Edit `src/styles.css`:
```css
:root {
    --primary-color: #2563eb;
    --success-color: #16a34a;
    /* ... */
}
```

### Add Label Preset
Edit `src/main.js` `getSelectedLayout()`:
```javascript
} else if (layoutType === 'my-label') {
    return {
        name: 'My Label',
        paperFormat: 'A4',
        labelsX: 4,
        // ... more params
    };
}
```

---

## 🚀 Deploy Steps

1. `npm run build`
2. `npm run deploy`
   OR
   Push to GitHub (auto-deploy)

---

## 📞 Support

- **Setup**: See SETUP.md
- **Use**: See QUICKSTART.md
- **Features**: See README.md
- **Labels**: See LABELS.md
- **Code**: See TECHNICAL.md
- **Deploy**: See WORKFLOW.md

---

## ✨ Browser Support

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Mobile browsers

---

## 🎯 Common Tasks

### Generate First PDF
```
1. npm run dev
2. Drag example-data.csv
3. Click Parse Data
4. Click Generate PDF
5. Open PDF
```

### Add Custom Labels
```
1. Edit src/main.js
2. Add to getSelectedLayout()
3. Update index.html dropdown
4. npm run build
```

### Deploy to GitHub
```
1. npm run build
2. git add .
3. git commit -m "Update"
4. git push origin main
5. Wait for GitHub Actions
```

---

## 📊 Quick Stats

- 6 source files
- 4 config files
- 8 documentation files
- 2 production dependencies
- 3 development dependencies
- ~4KB gzipped
- < 2s build time

---

## 🎉 Ready to Use!

1. Install: `npm install`
2. Run: `npm run dev`
3. Test: Load example data
4. Create: Generate PDFs
5. Print: On label sheets
6. Done! 🏷️

---

## 📅 When to Read Each Doc

| Time | Document |
|------|----------|
| Now | This card! |
| 2 min | SETUP.md intro |
| 5 min | QUICKSTART.md |
| 15 min | Full README.md |
| 10 min | LABELS.md (if custom) |
| When deploying | WORKFLOW.md |
| When coding | TECHNICAL.md |

---

**Everything you need is ready. Start with:** `npm install`

Then read: `SETUP.md`

Enjoy creating name tags! 🏷️
