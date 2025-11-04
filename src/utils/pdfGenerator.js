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
    generate() {
        const pdfBytes = this.generateBytes();
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
        const labelsPerPage = this.layout.labelsX * this.layout.labelsY;

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
                this.drawImage(element, x, y);
            } else if (element.type === 'text') {
                await this.drawText(element, item, x, y);
            }
        }
    }

    /**
     * Draw an image element
     */
    drawImage(element, labelX, labelY) {
        try {
            const imgX = labelX + element.position.x;
            const imgY = labelY + element.position.y;
            const imgWidth = element.width;
            
            // Load and embed SVG/image - for now we'll skip this as it requires additional processing
            // In production, convert SVG to canvas or use imgData
            // this.pdf.addImage(imgData, 'SVG', imgX, imgY, imgWidth, imgWidth);
        } catch (error) {
            console.error('Error drawing image:', error);
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
            
            // Use available fonts in jsPDF
            const fontWeight = element.font.weight === 'bold' ? 'bold' : 'normal';
            this.pdf.setFont(undefined, fontWeight);

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
