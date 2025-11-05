import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { getLayoutConfig } from "../config.js";

export class PdfGenerator {
  constructor(data, layoutName) {
    this.data = data;
    this.layoutConfig = getLayoutConfig(layoutName);
    this.layout = {
      paperFormat: this.layoutConfig.paperFormat,
      labelsX: this.layoutConfig.labelsX,
      labelsY: this.layoutConfig.labelsY,
      labelWidth: this.layoutConfig.labelWidth,
      labelHeight: this.layoutConfig.labelHeight,
      gapX: this.layoutConfig.gapX,
      gapY: this.layoutConfig.gapY,
      marginLeft: this.layoutConfig.marginLeft,
      marginTop: this.layoutConfig.marginTop,
      showBorder: this.layoutConfig.showBorder || false,
    };
    this.pdfDoc = null;
    this.fontCache = {};
    this.imageCache = {};
    this.page = null;
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
    return dimensions[format] || dimensions["A4"];
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
      (availableWidth - (this.layout.labelsX - 1) * this.layout.gapX) /
      this.layout.labelsX;
    this.layout.labelHeight =
      (availableHeight - (this.layout.labelsY - 1) * this.layout.gapY) /
      this.layout.labelsY;
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

    const labelsPerPage = this.layout.labelsX * this.layout.labelsY;
    let labelIndex = 0;

    // Create pages until all labels are placed
    while (labelIndex < this.data.length) {
      this.page = this.pdfDoc.addPage([pageDims.width, pageDims.height]);

      for (let rowIdx = 0; rowIdx < this.layout.labelsY; rowIdx++) {
        for (let colIdx = 0; colIdx < this.layout.labelsX; colIdx++) {
          if (labelIndex >= this.data.length) {
            break;
          }

          // Calculate position (pdf-lib uses bottom-left origin, so we need to flip Y)
          const x = this.mmToPoints(
            this.layout.marginLeft +
              colIdx * (this.layout.labelWidth + this.layout.gapX),
          );
          const y =
            pageDims.height -
            this.mmToPoints(
              this.layout.marginTop +
                rowIdx * (this.layout.labelHeight + this.layout.gapY),
            ) -
            this.mmToPoints(this.layout.labelHeight);

          await this.drawLabel(this.data[labelIndex], x, y);
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
  async drawLabel(item, x, y) {
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
      }
    }
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
        // Load PDF
        const pdfData = await this.loadPdf(element.src);
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
   * Load PDF as bytes
   */
  async loadPdf(pdfPath) {
    try {
      const response = await fetch(pdfPath);
      const pdfBytes = await response.arrayBuffer();
      return pdfBytes;
    } catch (error) {
      console.error("Error loading PDF:", error);
      return null;
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
        .replace("{{function}}", item.function || "");

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
      const response = await fetch(fontConfig.file);
      if (!response.ok) {
        throw new Error(`Failed to load font at ${fontConfig.file}`);
      }

      const fontBytes = await response.arrayBuffer();

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
