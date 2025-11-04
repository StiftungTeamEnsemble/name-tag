# Technical Documentation

## Project Architecture

```
name-tag/
├── docs/                    # Documentation
│   ├── README.md           # Main documentation
│   ├── QUICKSTART.md       # Quick start guide
│   └── LABELS.md           # Label specifications
├── src/                    # Source code
│   ├── main.js            # Application entry point & UI logic
│   ├── styles.css         # Global styles & theming
│   └── utils/             # Utility modules
│       ├── csvParser.js   # CSV/TSV parsing
│       ├── pdfGenerator.js # PDF generation with jsPDF
│       └── pdfPreviewManager.js # PDF preview with PDF.js
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions CI/CD
├── index.html             # Main HTML file
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies & scripts
├── .gitignore            # Git ignore rules
└── example-data.csv      # Sample data file
```

## Module Documentation

### main.js
**Purpose**: Application orchestration and UI event handling

**Key Functions**:
- `parseAndDisplayData()`: Parse input and update preview
- `displayPreview()`: Render data table
- `getSelectedLayout()`: Get current layout configuration
- `showError()/showSuccess()`: User notifications

**Event Listeners**:
- CSV upload with drag & drop
- Tab switching
- Parse, generate, and preview buttons
- Row deletion from preview

### csvParser.js
**Purpose**: Parse CSV and TSV data formats

**Exports**:
- `parseCSV(content)`: Parse string content into name tag array

**Logic**:
1. Split by newlines
2. Try tab-separated format first
3. Fall back to comma-separated format
4. Extract first two fields (name, function)
5. Filter empty lines

**Returns**: `Array<{name, function}>`

### pdfGenerator.js
**Purpose**: Generate PDFs using jsPDF

**Class**: `PdfGenerator`

**Methods**:
- `constructor(data, layout)`: Initialize with data and layout
- `generateBytes()`: Generate PDF as ArrayBuffer
- `generate()`: Generate and auto-download
- `download()`: Trigger download of current PDF
- `getPageDimensions(format)`: Get dimensions for paper format
- `calculateLabelDimensions()`: Calculate custom dimensions
- `drawLabel(item, x, y)`: Draw single label

**Features**:
- Automatic page management
- Grid-based label placement
- Text wrapping for long names/functions
- Light gray label borders

### pdfPreviewManager.js
**Purpose**: Preview PDFs using PDF.js

**Class**: `PdfPreviewManager`

**Methods**:
- `constructor(pdfBytes)`: Initialize with PDF data
- `init()`: Load PDF and initialize worker
- `renderPage(pageNum)`: Render specific page
- `nextPage()/previousPage()`: Navigation
- `updatePageInfo()`: Update page counter

**Features**:
- CDN-loaded PDF.js worker
- Canvas-based rendering
- Page navigation controls
- Page info display

## Data Flow

```
User Input
    ↓
CSV Upload / Manual Input
    ↓
parseCSV() [csvParser.js]
    ↓
Store in nameTagData[]
    ↓
displayPreview()
    ↓
User selects layout & clicks Generate/Preview
    ↓
getSelectedLayout()
    ↓
PdfGenerator.generateBytes() [pdfGenerator.js]
    ↓
For Download:
  - triggerDownload()
  - Browser saves file
For Preview:
  - PdfPreviewManager.init() [pdfPreviewManager.js]
  - renderPage()
  - Display in modal
```

## Build Process

### Development
```bash
npm run dev
```
- Vite dev server runs on port 5173
- Hot module replacement enabled
- Source maps available
- No minification

### Production
```bash
npm run build
```
- Vite optimizes code
- Tree-shaking removes unused code
- Assets minified
- Output in `dist/` folder
- Base path set to `/name-tag/` for GitHub Pages

## Deployment Process

### GitHub Actions Workflow
**File**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to `main` branch
- Pull requests (build only, no deploy)

**Steps**:
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (cached)
4. Run `npm run build`
5. Configure Pages
6. Upload artifact
7. Deploy to GitHub Pages

**Result**: Site available at `https://StiftungTeamEnsemble.github.io/name-tag/`

## Dependencies

### Production
| Package | Version | Purpose |
|---------|---------|---------|
| jspdf | ^2.5.1 | PDF generation |
| pdfjs-dist | ^4.0.379 | PDF preview & rendering |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^5.0.8 | Build tool & dev server |
| gh-pages | ^6.1.1 | GitHub Pages deployment |

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Mobile 90+

**Features used**:
- ES6 modules (import/export)
- Fetch API
- Canvas API
- Flexbox & Grid CSS
- LocalStorage (potential for future use)

## PDF Specifications

### Font Settings
- **Name**: 12pt, Bold, Black text
- **Function**: 10pt, Regular, Black text
- **Font**: Default (Helvetica equivalent)

### Label Structure
```
┌─ Label ─┐
│ Name    │
│         │
│ Function│
└─────────┘
```
- Name: Top, bold, left-aligned with 2mm padding
- Function: Bottom, regular, left-aligned with 2mm padding
- Border: Light gray (rgb 200, 200, 200)

### Page Management
- Fills labels row by row, left to right
- Automatically continues on new pages
- No blank pages generated

## Security Considerations

### Data Handling
- All processing done client-side
- No data sent to servers
- No cookies or tracking
- CSV files never uploaded

### File Input
- Only `.csv` files accepted in file dialog
- Manual input accepted as-is (sanitized in display)
- HTML entities properly escaped

### Dependencies
- jsPDF: Actively maintained, no known vulnerabilities
- PDF.js: Mozilla official library, security-focused
- Vite: Modern build tool with security updates

## Performance Optimization

### Code Splitting
- All code bundled together (small project)
- Can be split per feature if needed

### Asset Optimization
- CSS minified in production
- JavaScript minified and tree-shaken
- No unnecessary dependencies

### PDF Generation
- Efficient page creation
- Minimal object creation during rendering
- Memory released after download

## Testing Recommendations

### Unit Tests (Future)
- CSV parser edge cases
- Layout calculations
- PDF byte generation

### Integration Tests
- End-to-end workflow
- Preview generation
- Download functionality

### Manual Testing
- Different CSV formats
- Various label layouts
- Different paper sizes
- Mobile responsiveness

## Debugging Tips

### Browser Console
```javascript
// Check loaded data
console.log(nameTagData)

// Check PDF object
console.log(pdfGenerator.pdf)

// Test layout
console.log(getSelectedLayout())
```

### PDF.js Issues
- Check worker URL in console
- Verify CDN is accessible
- Check CORS headers

### CSV Parsing
- Test with simple 2-column data
- Check line endings (LF vs CRLF)
- Verify UTF-8 encoding

## Future Enhancements

- Color customization per label
- Company logo support
- Multiple lines for function
- QR code generation
- Label templates (business card format)
- Multilingual support
- Barcode support
- Database integration
- Cloud storage sync
