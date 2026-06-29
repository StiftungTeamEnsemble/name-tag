# Name Tag PDF Generator

A modern web application and CLI tool for generating professional PDF name tags from CSV data or manual input. Perfect for events, conferences, and team gatherings.

## Features

- 💻 **Web Interface & CLI**: Use via browser or command line
- 📤 **Multiple Input Methods**: Upload CSV files via drag & drop or paste data manually
- 🏷️ **Predefined Layouts**: Zweckform L4785-20 label support out of the box
- ⚙️ **Custom Layouts**: Create custom label configurations for any label sheet
- 👁️ **PDF Preview**: View generated PDFs before downloading using PDF.js (web only)
- 🎨 **Professional Design**: Clean, modern UI built with vanilla CSS
- 📱 **Responsive**: Works on desktop and tablet devices
- 🚀 **Fast Build**: Vite-powered development server and optimized builds
- 🌍 **GitHub Pages Ready**: Automatic deployment via GitHub Actions
- 🤖 **Automation**: CLI tool for batch processing and integration into workflows

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Build Tool**: Vite
- **PDF Generation**: jsPDF
- **PDF Preview**: PDF.js
- **Data Parsing**: Custom TSV/CSV parser
- **Deployment**: GitHub Pages with GitHub Actions

## Installation

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/StiftungTeamEnsemble/name-tag.git
cd name-tag
```

2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Usage

### Web Interface

#### Input Data

##### CSV Upload

1. Click the upload area or drag and drop a CSV file
2. Format: `Name[TAB]Function` (tab-separated) or `Name,Function` (comma-separated)

##### Manual Input

1. Switch to "Manual Input" tab
2. Enter data in the text area, one entry per line
3. Use TAB to separate name and function

#### Generate PDF

1. Click "Parse Data" to load your entries
2. Preview loaded entries in the table
3. Select a layout:
   - **Predefined**: Zweckform L4785-20 (default)
   - **Custom**: Define your own parameters
4. Click "Generate PDF" to download or "Preview PDF" to view first

### Command Line Interface (CLI)

For automated workflows, batch processing, or integration into build pipelines:

```bash
# Basic usage
node src/cli.js example-data.csv

# Specify format and output
node src/cli.js data.csv --format vorname-name-funktion-zusatz --output tags.pdf

# Use different layout
node src/cli.js data.csv --layout zweckform-L4785-20-no-logo

# Generate 90×135mm photo badges (3-up on A4 landscape, with crop marks)
node src/cli.js DATA/example-badges.csv \
  --format vorname-name-image \
  --layout team-ensemble-badge-90x135 \
  --image-dir DATA \
  --output badges.pdf

# Show help
node src/cli.js --help
```

CLI options:

- `--format <format>` — CSV column format (see formats below)
- `--layout <layout>` — layout name
- `--output <file>` — output PDF path
- `--image-dir <dir>` — folder containing the photos referenced by filename in
  the CSV (required for the badge layout). Filenames are matched
  case-insensitively and Unicode-normalization-insensitively (handy on macOS,
  whose filenames are NFD).

**See [QUICKSTART.md](QUICKSTART.md) and [CLI-README.md](CLI-README.md) for detailed CLI documentation.**

### Predefined Layouts

#### Zweckform L4785-20

- Labels per page: 80 (4 columns × 20 rows)
- Label size: 52.5 × 21.2 mm
- Paper format: A4

#### Team Ensemble Badge 90×135mm (`team-ensemble-badge-90x135`)

- Badge size: 90 × 135 mm
- 3 badges per A4 **landscape** sheet, side by side with **0 mm gap**, centered
- **Crop marks**: computed once for the whole imposition; a mark is drawn only
  if it doesn't intrude into a neighbouring badge, so shared cut lines get a
  single mark and the outer edges keep their marks
- Each badge contains:
  - a **circular masked photo** (75 × 75 mm), loaded by filename from the image
    folder (`--image-dir` / "Bildordner auswählen" in the web UI)
  - the **name** (`{{displayName}}`), auto-sized and centered
  - a "Bleib im Kontakt mit **Team Ensemble**" footer
  - a **QR code** (generated with the `qrcode` package)

Use it with the `vorname-name-image` CSV format. A debug variant
`team-ensemble-badge-90x135-debug` draws the badge outlines.

##### Face detection

The variant `team-ensemble-badge-90x135-face` runs face detection
([@vladmandic/human](https://github.com/vladmandic/human)) on each photo and
positions/scales it so every face ends up at the same size and position inside
the circular mask. If a face-centered crop would leave the mask uncovered, the
image is scaled up to the closest fit that still fills the whole mask; if no
face is found it falls back to plain cover/center.

It works in both environments:

- **CLI**: face detection is enabled automatically when the layout needs it
  (uses Human's WASM TensorFlow backend with models bundled locally — no native
  build and no network required).
- **Web**: enabled automatically for face layouts (uses the WebGL backend; the
  detection library is lazy-loaded and models are fetched from a CDN, so the
  first run needs network access). Select the image folder first.

Per-`imageData` tunables (with defaults): `faceHeightFraction` (0.6),
`faceCenterX` (0.5), `faceCenterY` (0.55).

```bash
node src/cli.js DATA/example-badges.csv \
  --format vorname-name-image \
  --layout team-ensemble-badge-90x135-face \
  --image-dir DATA \
  --output badges.pdf
```

##### Image folder

The badge layout references photos by filename. Provide the folder via:

- **CLI**: `--image-dir <dir>`
- **Web**: the "Bildordner auswählen" button, which uses the
  [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
  (`showDirectoryPicker`) with a `<input webkitdirectory>` fallback for browsers
  that don't support it.

A ready-made test CSV referencing the photos in `DATA/` is at
`DATA/example-badges.csv`.

### Custom Layout Parameters

- **Paper Format**: A4, Letter, or A3
- **Labels per Row (X)**: Number of columns
- **Labels per Column (Y)**: Number of rows
- **Gap X**: Horizontal spacing between labels (mm)
- **Gap Y**: Vertical spacing between labels (mm)
- **Start Left**: Left margin (mm)
- **Start Top**: Top margin (mm)

## Development

### Available Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages (requires gh-pages setup)
npm run deploy
```

### Project Structure

```
name-tag/
├── src/
│   ├── main.js                    # Main web application logic
│   ├── cli.js                     # CLI entry point
│   ├── config.js                  # Web configuration (Vite URLs)
│   ├── configNode.js              # Node.js configuration (file paths)
│   ├── styles.css                 # Global styles
│   └── utils/
│       ├── csvParser.js           # CSV/TSV parsing (shared)
│       ├── pdfGenerator.js        # PDF generation for web
│       ├── pdfGeneratorNode.js    # PDF generation for CLI
│       └── pdfPreviewManager.js   # PDF preview with PDF.js (web only)
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Actions deployment
├── index.html                     # Main HTML file
├── vite.config.js                # Vite configuration
├── package.json                   # Dependencies and scripts
├── README.md                      # This file
├── CLI-README.md                  # Detailed CLI documentation
├── QUICKSTART.md                  # Quick CLI reference
└── REFACTORING-SUMMARY.md         # Architecture documentation
```

## GitHub Pages Deployment

### Setup

1. Go to your repository settings
2. Navigate to **Pages** section
3. Set deployment source to "GitHub Actions"
4. The workflow will automatically deploy on every push to `main`

### Automatic Deployment

Every push to the `main` branch automatically:

1. Builds the project
2. Generates optimized production files
3. Deploys to GitHub Pages at `https://username.github.io/name-tag/`

### Manual Deployment

```bash
npm run build
npm run deploy
```

## CSV Format Examples

### Tab-Separated (Recommended)

```
John Doe	CEO
Jane Smith	Manager
Bob Johnson	Developer
```

### Comma-Separated

```
John Doe,CEO
Jane Smith,Manager
Bob Johnson,Developer
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Adding New Label Presets

Edit `src/main.js` in the `getSelectedLayout()` function:

```javascript
} else if (layoutType === 'your-label-name') {
    return {
        name: 'Your Label Name',
        paperFormat: 'A4',
        columns: 4,
        rows: 10,
        labelWidth: 50,
        labelHeight: 25,
        rowGap: 1,
        columnGap: 1,
        marginLeft: 5,
        marginTop: 5
    };
}
```

### Styling

All styles are in `src/styles.css` and use CSS custom properties for easy theming:

```css
:root {
  --primary-color: #2563eb;
  --success-color: #16a34a;
  --danger-color: #dc2626;
  /* ... more colors ... */
}
```

## Troubleshooting

### PDF not previewing

- Ensure PDF.js is properly loaded (check browser console)
- Try downloading instead of previewing

### Labels not centered

- Check "Start Left" and "Start Top" margins
- Verify label dimensions match your physical labels

### CSV not parsing

- Ensure file uses UTF-8 encoding
- Check separator (TAB or comma) consistency
- Verify no extra spaces in data

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/StiftungTeamEnsemble/name-tag/issues) page.
