import {
  PDFDocument,
  rgb,
  StandardFonts,
  pushGraphicsState,
  popGraphicsState,
  moveTo,
  appendBezierCurve,
  closePath,
  clip,
  endPath,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { BrowserResourceLoader } from "./resourceLoader.js";

/**
 * Parse a measurement that may be a number (mm) or a string like "7.50mm".
 */
export function parseMm(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/mm$/i, "").trim());
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Decode a base64 string to bytes (works in browser and Node.js).
 */
function base64ToBytes(b64) {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

/**
 * Convert a data: URL to bytes.
 */
function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(",");
  return base64ToBytes(dataUrl.slice(comma + 1));
}

export class PdfGenerator {
  /**
   * @param {Array} data - parsed records
   * @param {Object} layoutConfig - layout definition
   * @param {Object} resourceLoader - font/pdf loader (browser or node)
   * @param {Object} assetPaths - resolved asset paths
   * @param {Object} [options] - { imageLoader: async (filename) => ArrayBuffer|null }
   */
  constructor(
    data,
    layoutConfig,
    resourceLoader = null,
    assetPaths = {},
    options = {},
  ) {
    this.data = data;
    this.layoutConfig = layoutConfig;
    this.layout = {
      paperFormat: this.layoutConfig.paperFormat,
      landscape: this.layoutConfig.landscape || false,
      columns: this.layoutConfig.columns,
      rows: this.layoutConfig.rows,
      labelWidth: this.layoutConfig.labelWidth,
      labelHeight: this.layoutConfig.labelHeight,
      rowGap: this.layoutConfig.rowGap,
      columnGap: this.layoutConfig.columnGap,
      marginLeft: this.layoutConfig.marginLeft,
      marginTop: this.layoutConfig.marginTop,
      showBorder: this.layoutConfig.showBorder || false,
      cropMarks: this.layoutConfig.cropMarks || false,
    };
    this.pdfDoc = null;
    this.fontCache = {};
    this.imageCache = {};
    this.imageDataCache = {};
    this.bytesCache = {};
    this.faceCache = {};
    this.page = null;
    // Use provided resource loader or default to browser loader
    this.resourceLoader = resourceLoader || new BrowserResourceLoader();
    this.assetPaths = assetPaths;
    // Optional loader resolving a bare filename (from CSV) to image bytes
    this.imageLoader = options.imageLoader || null;
    // Optional face detector: async (bytes, key) => { x, y, width, height } | null
    // (normalized [0..1] face box in image space, top-left origin)
    this.faceDetector = options.faceDetector || null;
  }

  /**
   * Get page dimensions in points (pdf-lib uses points: 1mm = 2.834645669291339 points)
   */
  mmToPoints(mm) {
    return mm * (72 / 25.4); // 1 inch = 25.4 mm, 1 inch = 72 points
  }

  getPageDimensions(format) {
    const dimensions = {
      A4: { width: this.mmToPoints(210), height: this.mmToPoints(297) },
      Letter: { width: this.mmToPoints(215.9), height: this.mmToPoints(279.4) },
      A3: { width: this.mmToPoints(297), height: this.mmToPoints(420) },
    };
    const dims = dimensions[format] || dimensions["A4"];
    // Swap dimensions for landscape orientation
    if (this.layout.landscape) {
      return { width: dims.height, height: dims.width };
    }
    return dims;
  }

  /**
   * Calculate label dimensions if custom layout
   */
  calculateLabelDimensions() {
    if (this.layout.labelWidth && this.layout.labelHeight) {
      return; // Already set (predefined layout)
    }

    const pageDims = this.getPageDimensions(this.layout.paperFormat);

    // Calculate available space (convert back to mm for calculation)
    const pageWidthMm = pageDims.width / 2.834645669291339;
    const pageHeightMm = pageDims.height / 2.834645669291339;
    const availableWidth = pageWidthMm - 2 * this.layout.marginLeft;
    const availableHeight = pageHeightMm - 2 * this.layout.marginTop;

    // Calculate label dimensions accounting for gaps
    this.layout.labelWidth =
      (availableWidth - (this.layout.columns - 1) * this.layout.rowGap) /
      this.layout.columns;
    this.layout.labelHeight =
      (availableHeight - (this.layout.rows - 1) * this.layout.columnGap) /
      this.layout.rows;
  }

  /**
   * Generate PDF and trigger download
   */
  async generate() {
    const pdfBytes = await this.generateBytes();
    this.triggerDownload(pdfBytes);
  }

  /**
   * Generate PDF bytes
   */
  async generateBytes() {
    this.calculateLabelDimensions();

    const pageDims = this.getPageDimensions(this.layout.paperFormat);
    this.pdfDoc = await PDFDocument.create();
    this.pdfDoc.registerFontkit(fontkit);

    const labelsPerPage = this.layout.columns * this.layout.rows;
    let labelIndex = 0;

    // Create pages until all labels are placed
    while (labelIndex < this.data.length) {
      this.page = this.pdfDoc.addPage([pageDims.width, pageDims.height]);

      for (let rowIdx = 0; rowIdx < this.layout.rows; rowIdx++) {
        for (let colIdx = 0; colIdx < this.layout.columns; colIdx++) {
          if (labelIndex >= this.data.length) {
            break;
          }

          // Calculate position (pdf-lib uses bottom-left origin, so we need to flip Y)
          const x = this.mmToPoints(
            this.layout.marginLeft +
              colIdx * (this.layout.labelWidth + this.layout.rowGap),
          );
          const y =
            pageDims.height -
            this.mmToPoints(
              this.layout.marginTop +
                rowIdx * (this.layout.labelHeight + this.layout.columnGap),
            ) -
            this.mmToPoints(this.layout.labelHeight);

          await this.drawLabel(this.data[labelIndex], x, y, rowIdx, colIdx);
          labelIndex++;
        }

        if (labelIndex >= this.data.length) break;
      }
    }

    return await this.pdfDoc.save();
  }

  /**
   * Draw a single label with configured elements
   */
  async drawLabel(item, x, y, rowIdx = 0, colIdx = 0) {
    const labelWidth = this.mmToPoints(this.layout.labelWidth);
    const labelHeight = this.mmToPoints(this.layout.labelHeight);

    // Draw border only if enabled (for debugging)
    if (this.layout.showBorder) {
      this.page.drawRectangle({
        x: x,
        y: y,
        width: labelWidth,
        height: labelHeight,
        borderColor: rgb(0.78, 0.78, 0.78),
        borderWidth: 0.5,
      });
    }

    // Render each element from config
    for (const element of this.layoutConfig.elements) {
      if (element.type === "image") {
        await this.drawImage(element, x, y, labelHeight);
      } else if (element.type === "text") {
        await this.drawText(element, item, x, y, labelHeight);
      } else if (element.type === "story") {
        await this.drawStory(element, item, x, y, labelHeight);
      } else if (element.type === "mask") {
        await this.drawMask(element, item, x, y, labelHeight);
      } else if (element.type === "imageData") {
        await this.drawImageData(element, item, x, y, labelHeight, null);
      } else if (element.type === "textbox") {
        await this.drawTextbox(element, item, x, y, labelHeight);
      } else if (element.type === "qrcode") {
        await this.drawQrCode(element, item, x, y, labelHeight);
      } else if (element.type === "circle" || element.type === "ellipse") {
        this.drawCircle(element, x, y, labelHeight);
      }
    }

    // Draw crop marks last so they sit on top
    if (this.layout.cropMarks) {
      const marks = this.getCropMarksForCell(rowIdx, colIdx);
      for (const m of marks) {
        this.page.drawLine({
          start: { x: x + m.dx1, y: y + m.dy1 },
          end: { x: x + m.dx2, y: y + m.dy2 },
          thickness: 0.25,
          color: rgb(0, 0, 0),
        });
      }
    }
  }

  /**
   * Crop marks for a grid cell (computed once per layout, cached). Returns the
   * line segments to draw relative to the cell's bottom-left corner (points).
   */
  getCropMarksForCell(rowIdx, colIdx) {
    if (!this._cropMarksByCell) {
      this._cropMarksByCell = this.computeCropMarks();
    }
    return this._cropMarksByCell.get(`${rowIdx},${colIdx}`) || [];
  }

  /**
   * Compute crop marks for the whole imposition grid, once per layout.
   *
   * The approach: generate every candidate crop mark for every cell in the
   * grid, then keep a mark only if it does not touch any badge's trim box. This
   * keeps the outer marks (which reach into the page margins) while dropping any
   * mark that would intrude into a neighbouring badge — independent of page,
   * gap size or orientation.
   *
   * Marks are returned in a Map keyed by "row,col", as segments expressed
   * relative to each cell's bottom-left corner (PDF points, y-up).
   */
  computeCropMarks() {
    const result = new Map();
    const cols = this.layout.columns;
    const rows = this.layout.rows;
    const lw = this.mmToPoints(this.layout.labelWidth);
    const lh = this.mmToPoints(this.layout.labelHeight);
    const gx = this.mmToPoints(this.layout.rowGap); // horizontal gap
    const gy = this.mmToPoints(this.layout.columnGap); // vertical gap
    const gap = this.mmToPoints(2); // gap between trim and mark
    const len = this.mmToPoints(4); // mark length
    const eps = 1e-6;

    // All badge trim rects in the grid (top-origin frame, y increasing down).
    const rects = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = c * (lw + gx);
        const top = r * (lh + gy);
        rects.push({ left, top, right: left + lw, bottom: top + lh });
      }
    }

    // True if an axis-aligned segment touches/overlaps any badge trim rect.
    const touchesAnyBadge = (seg) => {
      const minX = Math.min(seg.x1, seg.x2);
      const maxX = Math.max(seg.x1, seg.x2);
      const minY = Math.min(seg.y1, seg.y2);
      const maxY = Math.max(seg.y1, seg.y2);
      return rects.some(
        (rc) =>
          minX <= rc.right + eps &&
          rc.left - eps <= maxX &&
          minY <= rc.bottom + eps &&
          rc.top - eps <= maxY,
      );
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = c * (lw + gx);
        const top = r * (lh + gy);
        const right = left + lw;
        const bottom = top + lh;

        // 8 candidate marks (grid frame, y down): per corner one vertical and
        // one horizontal mark, each offset outward from the trim by `gap`.
        const candidates = [
          // top-left
          { x1: left, y1: top - gap, x2: left, y2: top - gap - len },
          { x1: left - gap, y1: top, x2: left - gap - len, y2: top },
          // top-right
          { x1: right, y1: top - gap, x2: right, y2: top - gap - len },
          { x1: right + gap, y1: top, x2: right + gap + len, y2: top },
          // bottom-left
          { x1: left, y1: bottom + gap, x2: left, y2: bottom + gap + len },
          { x1: left - gap, y1: bottom, x2: left - gap - len, y2: bottom },
          // bottom-right
          { x1: right, y1: bottom + gap, x2: right, y2: bottom + gap + len },
          { x1: right + gap, y1: bottom, x2: right + gap + len, y2: bottom },
        ];

        const kept = [];
        for (const seg of candidates) {
          if (touchesAnyBadge(seg)) continue;
          // Convert to cell-relative, y-up (cell bottom-left = grid (left, bottom)).
          kept.push({
            dx1: seg.x1 - left,
            dy1: bottom - seg.y1,
            dx2: seg.x2 - left,
            dy2: bottom - seg.y2,
          });
        }
        result.set(`${r},${c}`, kept);
      }
    }

    return result;
  }

  /**
   * Replace template variables in a string using a data record.
   */
  applyTemplate(str, item) {
    if (typeof str !== "string") return str;
    // Normalize visible text to NFC: source data (e.g. macOS filenames) can be
    // decomposed (NFD), which pdf-lib renders with mispositioned diacritics.
    const nfc = (v) => (v || "").normalize("NFC");
    const displayName = `${item.vorname || ""} ${item.name || ""}`.trim();
    return str
      .replace(/\{\{name\}\}/g, nfc(item.name))
      .replace(/\{\{displayName\}\}/g, nfc(displayName))
      .replace(/\{\{vorname\}\}/g, nfc(item.vorname))
      .replace(/\{\{function\}\}/g, nfc(item.function))
      .replace(/\{\{addition\}\}/g, nfc(item.addition))
      // image filename left un-normalized; loaders handle NFC matching themselves
      .replace(/\{\{image\}\}/g, item.image || "");
  }

  /**
   * Draw an image element (PDF)
   */
  async drawImage(element, labelX, labelY, labelHeight) {
    try {
      const imgX = labelX + this.mmToPoints(element.position.x);
      // Flip Y coordinate (pdf-lib uses bottom-left origin)
      const imgY = labelY + labelHeight - this.mmToPoints(element.position.y);
      const imgWidth = this.mmToPoints(element.width);

      // Check cache first
      let logoPage;
      if (this.imageCache[element.src]) {
        logoPage = this.imageCache[element.src];
      } else {
        // Resolve path from asset key or use as-is
        const pdfPath = this.assetPaths[element.src] || element.src;
        const pdfData = await this.resourceLoader.loadPdf(pdfPath);

        if (pdfData) {
          const logoPdf = await PDFDocument.load(pdfData);
          [logoPage] = await this.pdfDoc.embedPdf(logoPdf, [0]);
          // Cache the embedded page
          this.imageCache[element.src] = logoPage;
        }
      }

      if (logoPage) {
        // Calculate height maintaining aspect ratio if "auto"
        let imgHeight;
        if (element.height === "auto") {
          const aspectRatio = logoPage.height / logoPage.width;
          imgHeight = imgWidth * aspectRatio;
        } else {
          imgHeight = this.mmToPoints(element.height);
        }

        // Draw embedded PDF page (adjust Y to account for height)
        this.page.drawPage(logoPage, {
          x: imgX,
          y: imgY - imgHeight,
          width: imgWidth,
          height: imgHeight,
        });
      }
    } catch (error) {
      console.error("Error drawing image:", error);
    }
  }

  /**
   * Draw a text element with custom font
   * Position refers to the top-left corner of the text box (like HTML)
   * Returns the height consumed by the text (useful for story elements)
   */
  async drawText(
    element,
    item,
    labelX,
    labelY,
    labelHeight,
    returnHeight = false,
  ) {
    try {
      // Replace template variables
      const displayName = `${item.vorname || ""} ${item.name || ""}`.trim();
      let text = element.content
        .replace("{{name}}", item.name || "")
        .replace("{{displayName}}", displayName)
        .replace("{{vorname}}", item.vorname || "")
        .replace("{{function}}", item.function || "")
        .replace("{{addition}}", item.addition || "");

      // Skip rendering if text is empty after replacement
      if (!text.trim()) {
        return returnHeight ? 0 : undefined;
      }

      const textX = labelX + this.mmToPoints(element.position.x);

      // Set text properties
      const hexColor = element.color || "#000000";
      const rgbColor = this.hexToRgb(hexColor);
      const fontSize = element.font.size;
      const lineHeight = element.font.lineHeight || 1.2;

      const font = await this.ensureFont(element.font);

      // Calculate the em-square and leading
      const emSquare = fontSize;
      const totalLineHeight = fontSize * lineHeight;
      const leading = totalLineHeight - emSquare;
      const halfLeading = leading / 2;

      // Position is top-left, but PDF uses baseline positioning
      // Get actual font metrics from the font file
      const fontAscent = font.heightAtSize(fontSize, { descender: false });
      const baselineOffsetFromTop = fontAscent + halfLeading;

      // Convert position.y (from top) to PDF coordinates (from bottom)
      const textY =
        labelY +
        labelHeight -
        this.mmToPoints(element.position.y) -
        baselineOffsetFromTop;

      let totalHeight = 0;

      // Check if text should wrap within a width
      if (element.width) {
        totalHeight = await this.drawMultilineText(
          text,
          textX,
          textY,
          element.width,
          fontSize,
          lineHeight,
          font,
          rgbColor,
          element.font.features,
          element.autoSize,
        );
      } else {
        // Draw single line text
        const drawOptions = {
          x: textX,
          y: textY,
          size: fontSize,
          font: font,
          color: rgb(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255),
        };

        // Note: pdf-lib doesn't support OpenType features directly
        // Features would need to be implemented using fontkit text shaping
        if (element.font.features) {
          console.warn(
            "OpenType features are not currently supported by pdf-lib. Features specified:",
            element.font.features,
          );
        }

        this.page.drawText(text, drawOptions);
        totalHeight = totalLineHeight;
      }

      return returnHeight ? totalHeight : undefined;
    } catch (error) {
      console.error("Error drawing text:", error);
      return returnHeight ? 0 : undefined;
    }
  }

  /**
   * Draw a story element with children text elements stacked vertically
   * Children are rendered one after another like HTML blocks
   * Position x/y is ignored for children, but topPadding and bottomPadding are respected
   * Works like HTML: each block has its em-square + leading, and blocks stack with padding
   */
  async drawStory(element, item, labelX, labelY, labelHeight) {
    try {
      // Start position for the story (top-left corner)
      let currentY = element.position.y;

      // Process each child element
      if (element.children && Array.isArray(element.children)) {
        for (const child of element.children) {
          // Only text elements are allowed in stories
          if (child.type !== "text") {
            console.warn(
              "Story elements can only contain text children. Skipping non-text element.",
            );
            continue;
          }

          // Apply top padding if specified
          if (child.topPadding) {
            currentY += child.topPadding;
          }

          // Create a modified element with the current Y position
          const modifiedChild = {
            ...child,
            position: {
              x: element.position.x,
              y: currentY,
            },
          };

          // Draw the text and get its height (including leading)
          const textHeight = await this.drawText(
            modifiedChild,
            item,
            labelX,
            labelY,
            labelHeight,
            true, // Return height
          );

          // Convert height from points back to mm
          const textHeightMm = textHeight / this.mmToPoints(1);

          // Move down by the height of the text block (em-square + leading)
          currentY += textHeightMm;

          // Apply bottom padding if specified
          if (child.bottomPadding) {
            currentY += child.bottomPadding;
          }
        }
      }
    } catch (error) {
      console.error("Error drawing story:", error);
    }
  }

  /**
   * Draw multi-line text within a specified width
   * Returns the total height consumed by the text (including leading)
   * y parameter is the baseline position of the first line
   */
  async drawMultilineText(
    text,
    x,
    y,
    widthMm,
    fontSize,
    lineHeight,
    font,
    rgbColor,
    features,
    autoSize = false,
  ) {
    const maxWidth = this.mmToPoints(widthMm);
    let adjustedFontSize = fontSize;

    // If autoSize is enabled, calculate the scale factor needed
    if (autoSize) {
      // Find the longest word or line that won't wrap
      const words = text.split(" ");
      let maxWordWidth = 0;

      for (const word of words) {
        const wordWidth = font.widthOfTextAtSize(word, fontSize);
        if (wordWidth > maxWordWidth) {
          maxWordWidth = wordWidth;
        }
      }

      // If the longest word exceeds max width, scale down the font
      if (maxWordWidth > maxWidth) {
        const scaleFactor = maxWidth / maxWordWidth;
        adjustedFontSize = fontSize * scaleFactor;
      }
    }

    const totalLineHeight = adjustedFontSize * lineHeight;

    // Split text into words
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, adjustedFontSize);

      if (testWidth > maxWidth && currentLine) {
        // Line is too long, push current line and start new one
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    // Push the last line
    if (currentLine) {
      lines.push(currentLine);
    }

    // Draw each line with proper line-height spacing
    for (let i = 0; i < lines.length; i++) {
      const drawOptions = {
        x: x,
        y: y - i * totalLineHeight, // Each line moves down by totalLineHeight
        size: adjustedFontSize,
        font: font,
        color: rgb(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255),
      };

      // Note: pdf-lib doesn't support OpenType features directly
      // Would need fontkit text shaping for feature support

      this.page.drawText(lines[i], drawOptions);
    }

    // Return total height consumed (number of lines * totalLineHeight)
    return lines.length * totalLineHeight;
  }

  /**
   * Build PDF operators describing a circular path centered at (cx, cy).
   */
  circlePathOperators(cx, cy, r) {
    const k = 0.5522847498307936 * r; // bezier approximation constant
    return [
      moveTo(cx + r, cy),
      appendBezierCurve(cx + r, cy + k, cx + k, cy + r, cx, cy + r),
      appendBezierCurve(cx - k, cy + r, cx - r, cy + k, cx - r, cy),
      appendBezierCurve(cx - r, cy - k, cx - k, cy - r, cx, cy - r),
      appendBezierCurve(cx + k, cy - r, cx + r, cy - k, cx + r, cy),
      closePath(),
    ];
  }

  /**
   * Draw a mask element: clips its children to a shape (currently "circle").
   * Coordinates use top-left origin (left/top/width/height in mm).
   */
  async drawMask(element, item, labelX, labelY, labelHeight) {
    try {
      const boxX = labelX + this.mmToPoints(parseMm(element.left));
      const boxW = this.mmToPoints(parseMm(element.width));
      const boxH = this.mmToPoints(parseMm(element.height));
      const boxTopY = labelY + labelHeight - this.mmToPoints(parseMm(element.top));
      const boxBottomY = boxTopY - boxH;

      this.page.pushOperators(pushGraphicsState());

      if (element.typeMask === "circle") {
        const cx = boxX + boxW / 2;
        const cy = boxBottomY + boxH / 2;
        const r = Math.min(boxW, boxH) / 2;
        this.page.pushOperators(
          ...this.circlePathOperators(cx, cy, r),
          clip(),
          endPath(),
        );
      }
      // (other mask shapes could be added here; default = no clip)

      // Draw children within the mask box coordinate frame
      if (Array.isArray(element.children)) {
        for (const child of element.children) {
          if (child.type === "imageData") {
            await this.drawImageData(
              child,
              item,
              boxX,
              boxBottomY,
              boxH,
            );
          }
        }
      }

      this.page.pushOperators(popGraphicsState());
    } catch (error) {
      console.error("Error drawing mask:", error);
    }
  }

  /**
   * Load raster image bytes from a folder filename, data URL, or path.
   */
  async loadImageBytes(src) {
    if (!src) return null;
    if (src.startsWith("data:")) return dataUrlToBytes(src);

    const isBareName = !src.includes("/") && !src.includes("\\");
    if (this.imageLoader && isBareName) {
      return await this.imageLoader(src);
    }
    if (this.resourceLoader.loadImage) {
      return await this.resourceLoader.loadImage(src);
    }
    return await this.resourceLoader.loadPdf(src);
  }

  /**
   * Embed raster image bytes, detecting PNG vs JPEG.
   */
  async embedImageBytes(bytes) {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (u8[0] === 0x89 && u8[1] === 0x50) {
      return await this.pdfDoc.embedPng(bytes);
    }
    if (u8[0] === 0xff && u8[1] === 0xd8) {
      return await this.pdfDoc.embedJpg(bytes);
    }
    // Fallback: try JPEG then PNG
    try {
      return await this.pdfDoc.embedJpg(bytes);
    } catch {
      return await this.pdfDoc.embedPng(bytes);
    }
  }

  /**
   * Load (and cache) the raw bytes for a resolved src.
   */
  async getImageBytes(resolvedSrc) {
    if (resolvedSrc in this.bytesCache) return this.bytesCache[resolvedSrc];
    const bytes = await this.loadImageBytes(resolvedSrc);
    this.bytesCache[resolvedSrc] = bytes || null;
    return this.bytesCache[resolvedSrc];
  }

  /**
   * Get an embedded image for a src (with template + caching).
   */
  async getEmbeddedImage(src, item) {
    const resolved = this.applyTemplate(src, item);
    if (!resolved) return null;
    if (this.imageDataCache[resolved]) return this.imageDataCache[resolved];

    const bytes = await this.getImageBytes(resolved);
    if (!bytes) return null;
    const img = await this.embedImageBytes(bytes);
    this.imageDataCache[resolved] = img;
    return img;
  }

  /**
   * Detect (and cache) the face box for a src. Returns a normalized box
   * { x, y, width, height } in [0..1] image space, or null.
   */
  async getFaceBox(src, item) {
    if (!this.faceDetector) return null;
    const resolved = this.applyTemplate(src, item);
    if (!resolved) return null;
    if (resolved in this.faceCache) return this.faceCache[resolved];

    let box = null;
    try {
      const bytes = await this.getImageBytes(resolved);
      box = bytes ? await this.faceDetector(bytes, resolved) : null;
    } catch (error) {
      console.error(`Face detection failed for ${resolved}:`, error);
    }
    this.faceCache[resolved] = box;
    return box;
  }

  /**
   * Compute the drawn-image rectangle (in box-local, top-left coordinates,
   * points) so that a detected face is centered and uniformly sized across all
   * images, while still fully covering the box (no gaps). If the face-based
   * placement would leave the box uncovered, the image is scaled up to the
   * closest fit that fills the box, then the position is clamped so it never
   * exposes a gap.
   *
   * @returns { drawW, drawH, drawLeft, drawTop }
   */
  computeFacePlacement(boxW, boxH, imgAR, face, opts = {}) {
    const faceHeightFraction = opts.faceHeightFraction ?? 0.6;
    const faceCenterX = opts.faceCenterX ?? 0.5;
    const faceCenterY = opts.faceCenterY ?? 0.55;

    // Guard against degenerate detections.
    const fw = Math.min(1, Math.max(0.02, face.width));
    const fh = Math.min(1, Math.max(0.02, face.height));
    const fcx = Math.min(1, Math.max(0, face.x + face.width / 2));
    const fcy = Math.min(1, Math.max(0, face.y + face.height / 2));

    // Scale the image so the face occupies the target height of the box.
    let drawH = (faceHeightFraction * boxH) / fh;
    let drawW = drawH * imgAR;

    // Ensure the image fully covers the box ("closest fit, whole rect filled").
    const coverFactor = Math.max(1, boxW / drawW, boxH / drawH);
    drawW *= coverFactor;
    drawH *= coverFactor;

    // Place so the face center lands on the target point in the box.
    const targetX = faceCenterX * boxW;
    const targetY = faceCenterY * boxH;
    let drawLeft = targetX - fcx * drawW;
    let drawTop = targetY - fcy * drawH;

    // Clamp so the box stays fully covered (drawLeft in [boxW-drawW, 0], etc.),
    // staying as close as possible to the face-centered position.
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    drawLeft = clamp(drawLeft, boxW - drawW, 0);
    drawTop = clamp(drawTop, boxH - drawH, 0);

    return { drawW, drawH, drawLeft, drawTop };
  }

  /**
   * Resolve an alignment value to a fraction in [0, 1].
   * Accepts a number (already a fraction), a percentage string ("25%"),
   * or a keyword. Defaults to 0.5 (center) for unknown values.
   */
  alignFraction(value, axis) {
    if (typeof value === "number") return Math.min(1, Math.max(0, value));
    if (typeof value === "string") {
      const trimmed = value.trim().toLowerCase();
      const keywords =
        axis === "x"
          ? { left: 0, center: 0.5, right: 1 }
          : { top: 0, center: 0.5, bottom: 1 };
      if (trimmed in keywords) return keywords[trimmed];
      if (trimmed.endsWith("%")) {
        const pct = parseFloat(trimmed);
        if (!Number.isNaN(pct)) return Math.min(1, Math.max(0, pct / 100));
      }
    }
    return 0.5;
  }

  /**
   * Draw a raster image element within its box, with configurable fit and
   * alignment. Defaults to object-fit: cover, centered (overflow is cropped by
   * any enclosing mask clip).
   *
   * Options on the element:
   *   objectFit: "cover" (default) | "contain" | "fill"
   *   align:     "left" | "center" (default) | "right" | number/percent (X)
   *   verticalAlign: "top" | "center" (default) | "bottom" | number/percent (Y)
   *
   * labelX/labelY/labelHeight describe the parent coordinate frame.
   */
  async drawImageData(element, item, labelX, labelY, labelHeight) {
    try {
      const boxX = labelX + this.mmToPoints(parseMm(element.left));
      const boxW = this.mmToPoints(parseMm(element.width));
      const boxH = this.mmToPoints(parseMm(element.height));
      const boxTopY = labelY + labelHeight - this.mmToPoints(parseMm(element.top));
      const boxBottomY = boxTopY - boxH;

      const img = await this.getEmbeddedImage(element.src, item);
      if (!img) return;

      const imgAR = img.width / img.height;

      // Face-detection placement: center & uniformly scale around the face.
      if (element.faceDetect && this.faceDetector) {
        const face = await this.getFaceBox(element.src, item);
        if (face) {
          const { drawW, drawH, drawLeft, drawTop } = this.computeFacePlacement(
            boxW,
            boxH,
            imgAR,
            face,
            {
              faceHeightFraction: element.faceHeightFraction,
              faceCenterX: element.faceCenterX,
              faceCenterY: element.faceCenterY,
            },
          );
          this.page.drawImage(img, {
            x: boxX + drawLeft,
            y: boxTopY - drawTop - drawH,
            width: drawW,
            height: drawH,
          });
          return;
        }
        // No face found → fall through to objectFit/align behavior.
      }

      const fit = element.objectFit || "cover";
      const boxAR = boxW / boxH;

      let drawW;
      let drawH;
      if (fit === "fill") {
        drawW = boxW;
        drawH = boxH;
      } else if (fit === "contain") {
        // Scale to fit entirely inside the box
        if (imgAR > boxAR) {
          drawW = boxW;
          drawH = boxW / imgAR;
        } else {
          drawH = boxH;
          drawW = boxH * imgAR;
        }
      } else {
        // cover: scale to fill the box, cropping the overflow
        if (imgAR > boxAR) {
          drawH = boxH;
          drawW = boxH * imgAR;
        } else {
          drawW = boxW;
          drawH = boxW / imgAR;
        }
      }

      // Alignment: hFrac 0=left..1=right ; vFrac 0=top..1=bottom
      const hFrac = this.alignFraction(element.align, "x");
      const vFrac = this.alignFraction(element.verticalAlign, "y");
      const drawX = boxX + (boxW - drawW) * hFrac;
      const drawY = boxBottomY + (boxH - drawH) * (1 - vFrac);

      this.page.drawImage(img, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });
    } catch (error) {
      console.error("Error drawing imageData:", error);
    }
  }

  /**
   * Wrap text into lines that fit maxWidth, optionally shrinking the font so
   * the longest word fits. Returns { lines, fontSize }.
   */
  wrapText(text, font, fontSize, maxWidth, autoSize) {
    let size = fontSize;
    if (autoSize) {
      let maxWordWidth = 0;
      for (const word of text.split(" ")) {
        maxWordWidth = Math.max(maxWordWidth, font.widthOfTextAtSize(word, size));
      }
      if (maxWordWidth > maxWidth) {
        size = size * (maxWidth / maxWordWidth);
      }
    }

    const words = text.split(" ");
    const lines = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return { lines, fontSize: size };
  }

  /**
   * Layout a single paragraph (textbox child) and return its measured height
   * and a render() closure. A child is either:
   *   { content, font, color, autoSize, textAlign }  — wrapping text
   *   { runs: [{ content, font, color }], textAlign } — single line, mixed fonts
   */
  async layoutParagraph(child, item, boxW, defaultAlign) {
    const align = child.textAlign || defaultAlign;

    if (Array.isArray(child.runs)) {
      const runs = [];
      let totalWidth = 0;
      let maxFontSize = 0;
      let maxLineHeight = 0;
      let maxAscent = 0;
      for (const run of child.runs) {
        const font = await this.ensureFont(run.font);
        const size = run.font.size;
        const content = this.applyTemplate(run.content, item);
        const w = font.widthOfTextAtSize(content, size);
        const lh = size * (run.font.lineHeight || 1.2);
        runs.push({
          font,
          size,
          content,
          color: this.hexToRgb(run.color || "#000000"),
          width: w,
        });
        totalWidth += w;
        maxFontSize = Math.max(maxFontSize, size);
        maxLineHeight = Math.max(maxLineHeight, lh);
        // Tallest ascent drives the shared baseline so mixed sizes line up.
        maxAscent = Math.max(
          maxAscent,
          font.heightAtSize(size, { descender: false }),
        );
      }

      const height = maxLineHeight;
      const leading = maxLineHeight - maxFontSize;
      // Single baseline shared by all runs (relative to the line's top), so runs
      // of different font sizes sit on the same baseline instead of being
      // aligned at their tops.
      const baselineFromTop = maxAscent + leading / 2;
      return {
        height,
        render: (left, topY, width) => {
          let startX = left;
          if (align === "center") startX = left + (width - totalWidth) / 2;
          else if (align === "right") startX = left + (width - totalWidth);
          let cursor = startX;
          const baseline = topY - baselineFromTop;
          for (const r of runs) {
            this.page.drawText(r.content, {
              x: cursor,
              y: baseline,
              size: r.size,
              font: r.font,
              color: rgb(r.color.r / 255, r.color.g / 255, r.color.b / 255),
            });
            cursor += r.width;
          }
        },
      };
    }

    // Wrapping text paragraph
    const font = await this.ensureFont(child.font);
    const baseSize = child.font.size;
    const lineHeight = child.font.lineHeight || 1.2;
    const content = this.applyTemplate(child.content, item);
    const { lines, fontSize } = this.wrapText(
      content,
      font,
      baseSize,
      boxW,
      child.autoSize,
    );
    const totalLineHeight = fontSize * lineHeight;
    const leading = totalLineHeight - fontSize;
    const color = this.hexToRgb(child.color || "#000000");
    const height = lines.length * totalLineHeight;

    return {
      height,
      render: (left, topY, width) => {
        const ascent = font.heightAtSize(fontSize, { descender: false });
        for (let i = 0; i < lines.length; i++) {
          const lineWidth = font.widthOfTextAtSize(lines[i], fontSize);
          let x = left;
          if (align === "center") x = left + (width - lineWidth) / 2;
          else if (align === "right") x = left + (width - lineWidth);
          const baseline = topY - leading / 2 - ascent - i * totalLineHeight;
          this.page.drawText(lines[i], {
            x,
            y: baseline,
            size: fontSize,
            font,
            color: rgb(color.r / 255, color.g / 255, color.b / 255),
          });
        }
      },
    };
  }

  /**
   * Draw a textbox element: a positioned box containing stacked paragraphs,
   * with horizontal (textAlign) and vertical (verticalAlign) alignment.
   */
  async drawTextbox(element, item, labelX, labelY, labelHeight) {
    try {
      const boxLeft = labelX + this.mmToPoints(parseMm(element.left));
      const boxW = this.mmToPoints(parseMm(element.width));
      const boxH = this.mmToPoints(parseMm(element.height));
      const boxTopY = labelY + labelHeight - this.mmToPoints(parseMm(element.top));
      const defaultAlign = element.textAlign || "left";
      const valign = element.verticalAlign || "top";
      const children = element.children || [];

      const paras = [];
      let contentHeight = 0;
      for (const child of children) {
        if (child.type && child.type !== "text") continue;
        const topPad = this.mmToPoints(parseMm(child.topPadding || 0));
        const botPad = this.mmToPoints(parseMm(child.bottomPadding || 0));
        const layout = await this.layoutParagraph(
          child,
          item,
          boxW,
          defaultAlign,
        );
        paras.push({ layout, topPad, botPad });
        contentHeight += topPad + layout.height + botPad;
      }

      let offset = 0;
      if (valign === "center") offset = (boxH - contentHeight) / 2;
      else if (valign === "bottom") offset = boxH - contentHeight;
      if (offset < 0) offset = 0;

      let cursorTopY = boxTopY - offset;
      for (const { layout, topPad, botPad } of paras) {
        cursorTopY -= topPad;
        layout.render(boxLeft, cursorTopY, boxW);
        cursorTopY -= layout.height + botPad;
      }
    } catch (error) {
      console.error("Error drawing textbox:", error);
    }
  }

  /**
   * Draw a QR code element generated from its text.
   */
  async drawQrCode(element, item, labelX, labelY, labelHeight) {
    try {
      const text = this.applyTemplate(element.text || "", item);
      if (!text) return;

      const boxX = labelX + this.mmToPoints(parseMm(element.left));
      const w = this.mmToPoints(parseMm(element.width));
      const h = this.mmToPoints(parseMm(element.height));
      const boxTopY = labelY + labelHeight - this.mmToPoints(parseMm(element.top));

      const pixelSize = Math.max(64, Math.round(Math.max(w, h) * 4));
      const dataUrl = await QRCode.toDataURL(text, {
        margin: 0,
        width: pixelSize,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
      const img = await this.pdfDoc.embedPng(dataUrlToBytes(dataUrl));

      this.page.drawImage(img, {
        x: boxX,
        y: boxTopY - h,
        width: w,
        height: h,
      });
    } catch (error) {
      console.error("Error drawing QR code:", error);
    }
  }

  /**
   * Draw a filled circle/ellipse element. left/top/width/height use the same
   * top-left mm semantics as the other elements; `color` is a hex fill color
   * (default gray).
   */
  drawCircle(element, labelX, labelY, labelHeight) {
    try {
      const w = this.mmToPoints(parseMm(element.width));
      const h = this.mmToPoints(parseMm(element.height));
      const boxX = labelX + this.mmToPoints(parseMm(element.left));
      const boxTopY = labelY + labelHeight - this.mmToPoints(parseMm(element.top));
      const color = this.hexToRgb(element.color || "#808080");

      this.page.drawEllipse({
        x: boxX + w / 2,
        y: boxTopY - h / 2,
        xScale: w / 2,
        yScale: h / 2,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
      });
    } catch (error) {
      console.error("Error drawing circle:", error);
    }
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  async ensureFont(fontConfig) {
    if (!fontConfig?.file || !fontConfig?.name) {
      // Return default font
      return await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    const cacheKey = `${fontConfig.name}-${fontConfig.style || "normal"}`;
    if (this.fontCache[cacheKey]) {
      return this.fontCache[cacheKey];
    }

    try {
      // Resolve path from asset key or use as-is
      const fontPath = this.assetPaths[fontConfig.file] || fontConfig.file;
      const fontBytes = await this.resourceLoader.loadFont(fontPath);

      // Embed font with subset to reduce file size and use custom name
      const font = await this.pdfDoc.embedFont(fontBytes, {
        subset: true,
        customName: fontConfig.name,
      });

      this.fontCache[cacheKey] = font;
      return font;
    } catch (error) {
      console.error("Error loading font:", error);
      // Return default font on error
      return await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  }

  /**
   * Download the PDF
   */
  triggerDownload(pdfBytes) {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `name-tags-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Download the PDF
   */
  async download() {
    const pdfBytes = await this.pdfDoc.save();
    this.triggerDownload(pdfBytes);
  }
}
