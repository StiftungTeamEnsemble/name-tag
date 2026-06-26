#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseCSV } from "./utils/csvParser.js";
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
 *   --format <format>          Format type: 'name-vorname-funktion-zusatz' (default),
 *                              'vorname-name-funktion-zusatz', or 'name-funktion-zusatz'
 *   --layout <layout>          Layout name (default: 'zweckform-L4785-20')
 *   --output <file>            Output PDF file path (default: name-tags-YYYY-MM-DD.pdf)
 */

function printUsage() {
  console.log(`
Usage: name-tag-cli <csv-file> [options]

Options:
  --format <format>    CSV format type (default: name-vorname-funktion-zusatz)
                       Options:
                         - name-vorname-funktion-zusatz
                         - vorname-name-funktion-zusatz
                         - name-funktion-zusatz
                         - vorname-name-image   (for badge layout)
                         - name-image           (for badge layout)

  --layout <layout>    Label layout name (default: zweckform-L4785-20)
                       Options:
                         - zweckform-L4785-20
                         - zweckform-L4785-20-debug
                         - zweckform-L4785-20-no-logo
                         - team-ensemble-badge-90x135
                         - team-ensemble-badge-90x135-debug
                         - team-ensemble-badge-90x135-face  (face detection)
  
  --output <file>      Output PDF file path (default: name-tags-YYYY-MM-DD.pdf)

  --image-dir <dir>    Folder containing images referenced by filename in the CSV
                       (used by the badge layout's photo / {{image}} field)

  --help              Show this help message

Examples:
  # Generate PDF with default settings
  name-tag-cli example-data.csv

  # Specify format and output file
  name-tag-cli data.csv --format vorname-name-funktion-zusatz --output tags.pdf

  # Use a different layout
  name-tag-cli data.csv --layout zweckform-L4785-20-no-logo

  # Generate 90x135mm badges (3-up on A4 landscape) with photos from a folder
  name-tag-cli DATA/example-badges.csv \\
    --format vorname-name-image \\
    --layout team-ensemble-badge-90x135 \\
    --image-dir DATA \\
    --output badges.pdf
`);
}

function parseArguments(args) {
  const options = {
    csvFile: null,
    format: "name-vorname-funktion-zusatz",
    layout: "zweckform-L4785-20",
    output: null,
    imageDir: null,
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--format") {
      options.format = args[++i];
    } else if (arg === "--layout") {
      options.layout = args[++i];
    } else if (arg === "--output" || arg === "-o") {
      options.output = args[++i];
    } else if (arg === "--image-dir") {
      options.imageDir = args[++i];
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
    nameTagData = parseCSV(csvContent, options.format);
    if (nameTagData.length === 0) {
      console.error("Error: No valid data found in CSV file");
      process.exit(1);
    }
    console.log(`Parsed ${nameTagData.length} name tags from CSV`);
  } catch (error) {
    console.error(`Error parsing CSV: ${error.message}`);
    process.exit(1);
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
    const layoutConfig = getLayoutConfig(options.layout, nodeAssetPaths);

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
