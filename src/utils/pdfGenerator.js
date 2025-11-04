import jsPDF from 'jspdf';

export class PdfGenerator {
    constructor(data, layout) {
        this.data = data;
        this.layout = layout;
        this.pdf = null;
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
    generateBytes() {
        this.calculateLabelDimensions();
        
        const pageDims = this.getPageDimensions(this.layout.paperFormat);
        this.pdf = new jsPDF({
            orientation: pageDims.width > pageDims.height ? 'l' : 'p',
            unit: 'mm',
            format: this.layout.paperFormat
        });

        let labelIndex = 0;
        let currentPage = 1;
        const labelsPerPage = this.layout.labelsX * this.layout.labelsY;

        for (let rowIdx = 0; rowIdx < this.layout.labelsY; rowIdx++) {
            for (let colIdx = 0; colIdx < this.layout.labelsX; colIdx++) {
                if (labelIndex >= this.data.length) {
                    break;
                }

                // Calculate position
                const x = this.layout.marginLeft + colIdx * (this.layout.labelWidth + this.layout.gapX);
                const y = this.layout.marginTop + rowIdx * (this.layout.labelHeight + this.layout.gapY);

                this.drawLabel(this.data[labelIndex], x, y);
                labelIndex++;
            }

            if (labelIndex >= this.data.length) break;
        }

        return this.pdf.output('arraybuffer');
    }

    /**
     * Draw a single label
     */
    drawLabel(item, x, y) {
        // Draw border
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.rect(x, y, this.layout.labelWidth, this.layout.labelHeight);

        // Set font
        this.pdf.setTextColor(0, 0, 0);
        this.pdf.setFontSize(12);
        this.pdf.setFont(undefined, 'bold');

        // Name
        const nameMaxWidth = this.layout.labelWidth - 4;
        const nameLines = this.pdf.splitTextToSize(item.name, nameMaxWidth);
        this.pdf.text(nameLines, x + 2, y + 6);

        // Function
        const functionY = y + this.layout.labelHeight - 6;
        this.pdf.setFontSize(10);
        this.pdf.setFont(undefined, 'normal');
        const functionMaxWidth = this.layout.labelWidth - 4;
        const functionLines = this.pdf.splitTextToSize(item.function, functionMaxWidth);
        
        // Draw function text aligned to bottom
        this.pdf.text(functionLines, x + 2, functionY - (functionLines.length - 1) * 4);
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
