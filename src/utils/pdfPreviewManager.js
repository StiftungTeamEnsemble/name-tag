import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import PdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker";

export class PdfPreviewManager {
  constructor(pdfBytes) {
    this.pdfBytes = pdfBytes;
    this.pdfDoc = null;
    this.currentPage = 1;
    this.worker = null;
  }

  /**
   * Initialize PDF.js worker and load PDF
   */
  async init() {
    // Set up PDF.js worker using bundled worker constructor
    if (!this.worker) {
      this.worker = new PdfWorker();
      pdfjsLib.GlobalWorkerOptions.workerPort = this.worker;
    }

    try {
      this.pdfDoc = await pdfjsLib.getDocument({
        data: this.pdfBytes,
        isEvalSupported: false,
      }).promise;

      console.log("PDF loaded with", this.pdfDoc.numPages, "pages");
      this.updatePageInfo();
    } catch (error) {
      console.error("Error loading PDF:", error);
      throw error;
    }
  }

  /**
   * Render a specific page
   */
  async renderPage(pageNum) {
    if (!this.pdfDoc || pageNum < 1 || pageNum > this.pdfDoc.numPages) {
      return;
    }

    this.currentPage = pageNum;

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Display canvas
      const viewer = document.getElementById("pdfViewer");
      viewer.innerHTML = "";
      viewer.appendChild(canvas);

      this.updatePageInfo();
    } catch (error) {
      console.error("Error rendering page:", error);
      throw error;
    }
  }

  /**
   * Go to next page
   */
  async nextPage() {
    if (this.currentPage < this.pdfDoc.numPages) {
      await this.renderPage(this.currentPage + 1);
    }
  }

  /**
   * Go to previous page
   */
  async previousPage() {
    if (this.currentPage > 1) {
      await this.renderPage(this.currentPage - 1);
    }
  }

  /**
   * Update page info display
   */
  updatePageInfo() {
    const info = document.getElementById("pageInfo");
    if (info && this.pdfDoc) {
      info.textContent = `Page ${this.currentPage} of ${this.pdfDoc.numPages}`;

      // Update button states
      document.getElementById("prevPageBtn").disabled = this.currentPage <= 1;
      document.getElementById("nextPageBtn").disabled =
        this.currentPage >= this.pdfDoc.numPages;
    }
  }
}
