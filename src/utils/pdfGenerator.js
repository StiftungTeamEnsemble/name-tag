import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { getLayoutConfig } from '../config.js';

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
            marginTop: this.layoutConfig.marginTop
        };
        this.pdfDoc = null;
        this.fontCache = {};
        this.page = null;
    }

    /**
     * Get page dimensions in points (pdf-lib uses points: 1mm = 2.834645669291339 points)
     */
    mmToPoints(mm) {
        return mm * 2.834645669291339;
    }

    getPageDimensions(format) {
        const dimensions = {
            'A4': { width: this.mmToPoints(210), height: this.mmToPoints(297) },
            'Letter': { width: this.mmToPoints(215.9), height: this.mmToPoints(279.4) },
            'A3': { width: this.mmToPoints(297), height: this.mmToPoints(420) }
        };
        return dimensions[format] || dimensions['A4'];
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
        const availableWidth = pageWidthMm - (2 * this.layout.marginLeft);
        const availableHeight = pageHeightMm - (2 * this.layout.marginTop);
        
        // Calculate label dimensions accounting for gaps
        this.layout.labelWidth = (availableWidth - (this.layout.labelsX - 1) * this.layout.gapX) / this.layout.labelsX;
        this.layout.labelHeight = (availableHeight - (this.layout.labelsY - 1) * this.layout.gapY) / this.layout.labelsY;
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
        
        this.page = this.pdfDoc.addPage([pageDims.width, pageDims.height]);

        let labelIndex = 0;

        for (let rowIdx = 0; rowIdx < this.layout.labelsY; rowIdx++) {
            for (let colIdx = 0; colIdx < this.layout.labelsX; colIdx++) {
                if (labelIndex >= this.data.length) {
                    break;
                }

                // Calculate position (pdf-lib uses bottom-left origin, so we need to flip Y)
                const x = this.mmToPoints(this.layout.marginLeft + colIdx * (this.layout.labelWidth + this.layout.gapX));
                const y = pageDims.height - this.mmToPoints(this.layout.marginTop + rowIdx * (this.layout.labelHeight + this.layout.gapY)) - this.mmToPoints(this.layout.labelHeight);

                await this.drawLabel(this.data[labelIndex], x, y);
                labelIndex++;
            }

            if (labelIndex >= this.data.length) break;
        }

        return await this.pdfDoc.save();
    }

    /**
     * Draw a single label with configured elements
     */
    async drawLabel(item, x, y) {
        const labelWidth = this.mmToPoints(this.layout.labelWidth);
        const labelHeight = this.mmToPoints(this.layout.labelHeight);

        // Draw border
        this.page.drawRectangle({
            x: x,
            y: y,
            width: labelWidth,
            height: labelHeight,
            borderColor: rgb(0.78, 0.78, 0.78),
            borderWidth: 0.5,
        });

        // Render each element from config
        for (const element of this.layoutConfig.elements) {
            if (element.type === 'image') {
                await this.drawImage(element, x, y, labelHeight);
            } else if (element.type === 'text') {
                await this.drawText(element, item, x, y, labelHeight);
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
            
            // Load PDF
            const pdfData = await this.loadPdf(element.src);
            if (pdfData) {
                const logoPdf = await PDFDocument.load(pdfData);
                const [logoPage] = await this.pdfDoc.embedPdf(logoPdf, [0]);
                
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
            console.error('Error drawing image:', error);
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
            console.error('Error loading PDF:', error);
            return null;
        }
    }

    /**
     * Draw a text element with custom font
     */
    async drawText(element, item, labelX, labelY, labelHeight) {
        try {
            // Replace template variables
            const text = element.content
                .replace('{{name}}', item.name)
                .replace('{{function}}', item.function);

            const textX = labelX + this.mmToPoints(element.position.x);
            // Flip Y coordinate (pdf-lib uses bottom-left origin)
            const textY = labelY + labelHeight - this.mmToPoints(element.position.y);

            // Set text properties
            const hexColor = element.color || '#000000';
            const rgbColor = this.hexToRgb(hexColor);
            const fontSize = element.font.size;

            const font = await this.ensureFont(element.font);

            // Prepare draw options
            const drawOptions = {
                x: textX,
                y: textY,
                size: fontSize,
                font: font,
                color: rgb(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255),
            };

            // Add OpenType features if specified
            if (element.font.features) {
                drawOptions.features = this.convertFeatures(element.font.features);
            }

            // Draw text
            this.page.drawText(text, drawOptions);
        } catch (error) {
            console.error('Error drawing text:', error);
        }
    }

    /**
     * Convert feature object to array format for pdf-lib
     * OpenType features like { ss03: true, liga: false } 
     * become [{ tag: 'ss03', value: 1 }, { tag: 'liga', value: 0 }]
     */
    convertFeatures(features) {
        return Object.entries(features).map(([tag, enabled]) => ({
            tag: tag,
            value: enabled ? 1 : 0
        }));
    }

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    async ensureFont(fontConfig) {
        if (!fontConfig?.file || !fontConfig?.name) {
            // Return default font
            return await this.pdfDoc.embedFont(StandardFonts.Helvetica);
        }

        const cacheKey = `${fontConfig.name}-${fontConfig.style || 'normal'}`;
        if (this.fontCache[cacheKey]) {
            return this.fontCache[cacheKey];
        }

        try {
            const response = await fetch(fontConfig.file);
            if (!response.ok) {
                throw new Error(`Failed to load font at ${fontConfig.file}`);
            }

            const fontBytes = await response.arrayBuffer();
            const font = await this.pdfDoc.embedFont(fontBytes);
            this.fontCache[cacheKey] = font;
            return font;
        } catch (error) {
            console.error('Error loading font:', error);
            // Return default font on error
            return await this.pdfDoc.embedFont(StandardFonts.Helvetica);
        }
    }

    /**
     * Download the PDF
     */
    triggerDownload(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
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
