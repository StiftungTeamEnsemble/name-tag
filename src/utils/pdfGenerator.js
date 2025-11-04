import jsPDF from 'jspdf';
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
        this.pdf = null;
        this.fontCache = {};
    }

    /**
     * Get page dimensions in mm
     */
    getPageDimensions(format) {
        const dimensions = {
            'A4': { width: 210, height: 297 },
            'Letter': { width: 215.9, height: 279.4 },
            'A3': { width: 297, height: 420 }
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
        
        // Calculate available space
        const availableWidth = pageDims.width - (2 * this.layout.marginLeft);
        const availableHeight = pageDims.height - (2 * this.layout.marginTop);
        
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
        this.pdf = new jsPDF({
            orientation: pageDims.width > pageDims.height ? 'l' : 'p',
            unit: 'mm',
            format: this.layout.paperFormat
        });

    let labelIndex = 0;

        for (let rowIdx = 0; rowIdx < this.layout.labelsY; rowIdx++) {
            for (let colIdx = 0; colIdx < this.layout.labelsX; colIdx++) {
                if (labelIndex >= this.data.length) {
                    break;
                }

                // Calculate position
                const x = this.layout.marginLeft + colIdx * (this.layout.labelWidth + this.layout.gapX);
                const y = this.layout.marginTop + rowIdx * (this.layout.labelHeight + this.layout.gapY);

                await this.drawLabel(this.data[labelIndex], x, y);
                labelIndex++;
            }

            if (labelIndex >= this.data.length) break;
        }

        return this.pdf.output('arraybuffer');
    }

    /**
     * Draw a single label with configured elements
     */
    async drawLabel(item, x, y) {
        // Draw border
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.rect(x, y, this.layout.labelWidth, this.layout.labelHeight);

        // Render each element from config
        for (const element of this.layoutConfig.elements) {
            if (element.type === 'image') {
                await this.drawImage(element, x, y);
            } else if (element.type === 'text') {
                await this.drawText(element, item, x, y);
            }
        }
    }

    /**
     * Draw an image element
     */
    async drawImage(element, labelX, labelY) {
        try {
            const imgX = labelX + element.position.x;
            const imgY = labelY + element.position.y;
            const imgWidth = element.width;
            
            // Load SVG
            const svgData = await this.loadSvg(element.src);
            if (svgData) {
                // Use jsPDF's addSvg method
                const imgHeight = element.height ?? element.width;
                this.pdf.addSvg(svgData, imgX, imgY, imgWidth, imgHeight);
            }
        } catch (error) {
            console.error('Error drawing image:', error);
        }
    }

    /**
     * Load SVG as string
     */
    async loadSvg(svgPath) {
        try {
            const response = await fetch(svgPath);
            const svgText = await response.text();
            return svgText;
        } catch (error) {
            console.error('Error loading SVG:', error);
            return null;
        }
    }

    /**
     * Draw a text element with custom font
     */
    async drawText(element, item, labelX, labelY) {
        try {
            // Replace template variables
            const text = element.content
                .replace('{{name}}', item.name)
                .replace('{{function}}', item.function);

            const textX = labelX + element.position.x;
            const textY = labelY + element.position.y;

            // Set text properties
            const hexColor = element.color || '#000000';
            const rgbColor = this.hexToRgb(hexColor);
            this.pdf.setTextColor(rgbColor.r, rgbColor.g, rgbColor.b);
            this.pdf.setFontSize(element.font.size);

            await this.ensureFont(element.font);
            if (element.font?.name) {
                this.pdf.setFont(element.font.name, element.font.style || 'normal');
            }

            // Draw text
            const maxWidth = this.layout.labelWidth - element.position.x - 1;
            const lines = this.pdf.splitTextToSize(text, maxWidth);
            this.pdf.text(lines, textX, textY);
        } catch (error) {
            console.error('Error drawing text:', error);
        }
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
            return;
        }

        const cacheKey = `${fontConfig.name}-${fontConfig.style || 'normal'}`;
        if (this.fontCache[cacheKey]) {
            return;
        }

        try {
            const response = await fetch(fontConfig.file);
            if (!response.ok) {
                throw new Error(`Failed to load font at ${fontConfig.file}`);
            }

            const buffer = await response.arrayBuffer();
            const fontData = this.arrayBufferToBase64(buffer);
            const fileName = `${cacheKey}.ttf`;
            this.pdf.addFileToVFS(fileName, fontData);
            this.pdf.addFont(fileName, fontConfig.name, fontConfig.style || 'normal');
            this.fontCache[cacheKey] = true;
        } catch (error) {
            console.error('Error loading font:', error);
        }
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
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
    download() {
        this.triggerDownload(this.pdf.output('arraybuffer'));
    }
}
