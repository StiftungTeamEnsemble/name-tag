#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseCSV, createBlankEntries } from "./utils/csvParser.js";
import { PdfGenerator } from "./utils/pdfGenerator.js";
import { NodeResourceLoader } from "./utils/resourceLoader.js";
import { createNodeFaceDetector } from "./utils/faceDetectorNode.js";
import { getLayoutConfig } from "./layouts.js";

/**
 * Recursively check whether a layout uses face detection on any element.
 */
function layoutUsesFaceDetection(elements) {
  if (!Array.isArray(elements)) return false;
  return elements.some(
    (el) => el.faceDetect || layoutUsesFaceDetection(el.children),
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

// Create Node.js asset paths
const nodeAssetPaths = {
  logo: resolve(projectRoot, "assets/logo.pdf"),
  geistRegular: resolve(
    projectRoot,
    "assets/fonts/Geist/ttf/Geist-Regular.ttf",
  ),
  geistSemiBold: resolve(
    projectRoot,
    "assets/fonts/Geist/ttf/Geist-SemiBold.ttf",
  ),
  merriweatherRegular: resolve(
    projectRoot,
    "assets/fonts/Merriweather/ttf/Merriweather-Regular.ttf",
  ),
};

/**
 * CLI tool for generating name tag PDFs from CSV files
 *
 * Usage:
 *   node src/cli.js <csv-file> [options]
 *
 * Options:
 *   --format <fields>          Comma-separated column fields (default: 'firstname,lastname,role,addition')
 *   --sort <field>             Optional field to sort by. If omitted, input order is kept.
 *   --lines                    Draw label/badge border lines for checking alignment.
 *   --layout <layout>          Layout name (default: 'zweckform-L4785-20')
 *   --output <file>            Output PDF file path (default: name-tags-YYYY-MM-DD.pdf)
 */

function printUsage() {
  console.log(`
Usage: name-tag-cli <csv-file> [options]

Options:
  --format <fields>    Comma-separated column fields (default: firstname,lastname,role,addition)
                       Known fields: firstname, lastname, role, addition, image
                       Example: --format firstname,lastname,addition,image

  --sort <field>       Sort by a field after parsing. If omitted, the TSV/CSV order is kept.
                       Known fields: firstname, lastname, role, addition, image

  --lines              Draw label/badge border lines for checking alignment

  --layout <layout>    Label layout name (default: zweckform-L4785-20)
                       Options:
                         - zweckform-L4785-20
                         - zweckform-L4785-20-no-logo
                         - team-ensemble-badge-90x135  (uses face detection)
  
  --output <file>      Output PDF file path (default: name-tags-YYYY-MM-DD.pdf)

  --image-dir <dir>    Folder containing images referenced by filename in the CSV
                       (used by the badge layout's photo / {{image}} field)

  --empty <n>          Append <n> blank tags at the end (to fill in by hand)

  --help              Show this help message

Examples:
  # Generate labels from the bundled example data
  name-tag-cli test/example-badges.tsv --format firstname,lastname,addition,image

  # Specify format and output file
  name-tag-cli data.tsv --format firstname,lastname,role,addition --output tags.pdf

  # Sort by last name
  name-tag-cli data.tsv --format firstname,lastname,addition,image --sort lastname

  # Use a different layout
  name-tag-cli data.csv --layout zweckform-L4785-20-no-logo

  # Draw layout lines for checking alignment
  name-tag-cli data.csv --lines

  # Generate 90x135mm badges (3-up on A4 landscape) with photos from a folder
  name-tag-cli test/example-badges.tsv \\
    --format firstname,lastname,addition,image \\
    --sort lastname \\
    --layout team-ensemble-badge-90x135 \\
    --image-dir test \\
    --output badges.pdf
`);
}

function parseArguments(args) {
  const options = {
    csvFile: null,
    format: "firstname,lastname,role,addition",
    sort: null,
    layout: "zweckform-L4785-20",
    lines: false,
    output: null,
    imageDir: null,
    empty: 0,
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--format") {
      options.format = args[++i];
    } else if (arg === "--sort") {
      options.sort = args[++i];
    } else if (arg === "--layout") {
      options.layout = args[++i];
    } else if (arg === "--lines") {
      options.lines = true;
    } else if (arg === "--output" || arg === "-o") {
      options.output = args[++i];
    } else if (arg === "--image-dir") {
      options.imageDir = args[++i];
    } else if (arg === "--empty") {
      options.empty = parseInt(args[++i], 10) || 0;
    } else if (!arg.startsWith("--")) {
      // First non-flag argument is the CSV file
      options.csvFile = arg;
    }
  }

  return options;
}

async function main() {
  const options = parseArguments(process.argv);

  // Validate CSV file
  if (!options.csvFile) {
    console.error("Error: CSV file is required\n");
    printUsage();
    process.exit(1);
  }

  // Read CSV file
  let csvContent;
  try {
    csvContent = readFileSync(options.csvFile, "utf-8");
  } catch (error) {
    console.error(`Error reading CSV file: ${error.message}`);
    process.exit(1);
  }

  // Parse CSV data
  let nameTagData;
  try {
    nameTagData = parseCSV(csvContent, options.format, {
      sort: options.sort,
    });
    if (nameTagData.length === 0) {
      console.error("Error: No valid data found in CSV file");
      process.exit(1);
    }
    console.log(`Parsed ${nameTagData.length} name tags from CSV`);
  } catch (error) {
    console.error(`Error parsing CSV: ${error.message}`);
    process.exit(1);
  }

  // Append blank tags to fill in by hand
  if (options.empty > 0) {
    nameTagData = nameTagData.concat(createBlankEntries(options.empty));
    console.log(`Added ${options.empty} blank tag(s)`);
  }

  // Generate output filename if not specified
  if (!options.output) {
    const date = new Date().toISOString().slice(0, 10);
    options.output = `name-tags-${date}.pdf`;
  }

  // Generate PDF
  try {
    console.log(`Generating PDF with layout: ${options.layout}`);

    // Get layout configuration with Node.js paths
    const baseLayoutConfig = getLayoutConfig(options.layout, nodeAssetPaths);
    const layoutConfig = {
      ...baseLayoutConfig,
      showBorder: baseLayoutConfig.showBorder || options.lines,
    };

    // Create Node.js resource loader
    const resourceLoader = new NodeResourceLoader();

    // Build an image loader that resolves bare CSV filenames against --image-dir.
    // Matching is case-insensitive so e.g. "alain_gut.jpg" finds "Alain_Gut.JPG".
    let imageLoader = null;
    if (options.imageDir) {
      const imageDir = resolve(options.imageDir);
      let dirEntries = [];
      try {
        dirEntries = readdirSync(imageDir);
      } catch (error) {
        console.warn(
          `Warning: could not read image directory "${imageDir}": ${error.message}`,
        );
      }
      // Match case- and unicode-normalization-insensitively (macOS uses NFD)
      const lookup = new Map(
        dirEntries.map((entry) => [
          entry.normalize("NFC").toLowerCase(),
          entry,
        ]),
      );

      imageLoader = async (filename) => {
        if (!filename) return null;
        const key = filename.normalize("NFC").toLowerCase();
        const match = lookup.get(key) || filename;
        try {
          const buffer = readFileSync(join(imageDir, match));
          return buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength,
          );
        } catch (error) {
          console.warn(
            `Warning: image "${filename}" not found in ${imageDir}`,
          );
          return null;
        }
      };
    }

    // Build the face detector only when the layout actually needs it
    // (loading the model is relatively expensive).
    let faceDetector = null;
    if (layoutUsesFaceDetection(layoutConfig.elements)) {
      console.log("Loading face detection model...");
      faceDetector = await createNodeFaceDetector();
    }

    // Create PDF generator with layout config, resource loader, and asset paths
    const pdfGenerator = new PdfGenerator(
      nameTagData,
      layoutConfig,
      resourceLoader,
      nodeAssetPaths,
      { imageLoader, faceDetector },
    );

    const pdfBytes = await pdfGenerator.generateBytes();

    // Write PDF to file
    writeFileSync(options.output, pdfBytes);
    console.log(`✓ PDF generated successfully: ${resolve(options.output)}`);
    console.log(`  File size: ${(pdfBytes.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error(`Error generating PDF: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
