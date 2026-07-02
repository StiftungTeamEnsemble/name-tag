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
2. Match the active field order shown in the data field list

##### Manual Input

1. Switch to "Manual Input" tab
2. Enter data in the text area, one entry per line
3. Use TAB to separate columns

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
node src/cli.js test/example-badges.tsv --format firstname,lastname,addition,image

# Specify column format and output
node src/cli.js data.tsv --format firstname,lastname,role,addition --output tags.pdf

# Sort explicitly when desired. Without --sort, input order is preserved.
node src/cli.js data.tsv --format firstname,lastname,addition,image --sort lastname

# Use different layout
node src/cli.js data.csv --layout zweckform-L4785-20-no-logo

# Generate 90×135mm photo badges (3-up on A4 landscape, with crop marks)
node src/cli.js test/example-badges.tsv \
  --format firstname,lastname,addition,image \
  --sort lastname \
  --layout team-ensemble-badge-90x135 \
  --image-dir test \
  --output badges.pdf

# Show help
node src/cli.js --help
```

CLI options:

- `--format <fields>` — comma-separated column order, for example
  `firstname,lastname,addition,image`. Known fields are `firstname`,
  `lastname`, `role`, `addition`, and `image`.
- `--sort <field>` — optional sort field. If omitted, entries are processed in
  the order of the TSV/CSV. Known sort fields are `firstname`, `lastname`,
  `role`, `addition`, and `image`.
- `--lines` — draw label/badge border lines for checking alignment
- `--layout <layout>` — layout name
- `--output <file>` — output PDF path
- `--image-dir <dir>` — folder containing the photos referenced by filename in
  the CSV (required for the badge layout). Filenames are matched
  case-insensitively and Unicode-normalization-insensitively (handy on macOS,
  whose filenames are NFD).

Run `node src/cli.js --help` for the full option list, and see
**[LAYOUTS.md](LAYOUTS.md)** for the layout definition reference.

### Layouts

Select a layout with `--layout` (CLI) or the dropdown (web). Three ship by
default:

| Key                          | Name                                         |
| ---------------------------- | -------------------------------------------- |
| `zweckform-L4785-20`         | Team Ensemble Etiketten (Zweckform L4785-20) |
| `zweckform-L4785-20-no-logo` | Neutral Etiketten (Zweckform L4785-20)       |
| `team-ensemble-badge-90x135` | Team Ensemble Badge 90×135mm (3 auf A4 quer) |

The **badge** layout places a face-detected circular photo, the name + company,
a "Bleib im Kontakt mit **Team Ensemble**" footer and a QR code three-up on an A4
landscape sheet with crop marks. Use it with
`--format firstname,lastname,addition,image` and point `--image-dir` at the photo
folder.

> **Defining or customizing layouts:** see **[LAYOUTS.md](LAYOUTS.md)** — the
> full layout definition reference (the element AST). It covers the layout
> properties, grid/imposition math, crop marks, template helpers, every element
> type (`image`, `text`, `story`, `textbox`, `mask`, `imageData`, `qrcode`,
> `circle`), and face detection.

#### Image folder (badge photos)

The badge layout references photos by filename (the `image` field). Provide the
folder via:

- **CLI**: `--image-dir <dir>`
- **Web**: the "Bildordner auswählen" button, which uses the
  [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
  (`showDirectoryPicker`) with a `<input webkitdirectory>` fallback.

A ready-made example TSV referencing the photos in `test/` is at
`test/example-badges.tsv`.

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
│   ├── layouts.js                 # Layout definitions (shared) — see LAYOUTS.md
│   ├── styles.css                 # Global styles
│   └── utils/
│       ├── csvParser.js           # CSV/TSV parsing (shared)
│       ├── pdfGenerator.js        # PDF generation (renders the layout AST)
│       ├── resourceLoader.js      # Font/PDF/image loading (browser + Node)
│       ├── faceDetectorNode.js    # Face detection (Node, WASM backend)
│       ├── faceDetectorBrowser.js # Face detection (browser, WebGL backend)
│       └── pdfPreviewManager.js   # PDF preview with PDF.js (web only)
├── test/                          # Example data (TSV + sample portraits)
├── index.html                     # Main HTML file
├── vite.config.js                # Vite configuration
├── package.json                   # Dependencies and scripts
├── README.md                      # This file
└── LAYOUTS.md                     # Layout definition reference (element AST)
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

### Adding New Layouts

Add an entry to `createLabelLayouts()` in [`src/layouts.js`](src/layouts.js). It
becomes available in both the CLI (`--layout <key>`) and the web dropdown
automatically. See **[LAYOUTS.md](LAYOUTS.md)** for the full layout definition
reference (properties and element types).

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
