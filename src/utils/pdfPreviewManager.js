import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import PdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker";

export class PdfPreviewManager {
  constructor(pdfBytes) {
    this.pdfBytes = pdfBytes;
    this.pdfDoc = null;
    this.currentPage = 1;
    this.worker = null;
    this.currentZoom = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 3.0;
    this.zoomStep = 0.25;
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

      // Get the viewer container
      const viewer = document.getElementById("pdfViewer");
      const viewerWidth = viewer.clientWidth - 40; // Account for padding
      const viewerHeight = viewer.clientHeight - 40;

      // Get the page dimensions at scale 1
      const baseViewport = page.getViewport({ scale: 1 });

      // Calculate scale to fit the viewer while respecting zoom
      const scaleX = viewerWidth / baseViewport.width;
      const scaleY = viewerHeight / baseViewport.height;
      const fitScale = Math.min(scaleX, scaleY);

      // Apply zoom to the fit scale
      const scale = fitScale * this.currentZoom;

      // Get device pixel ratio for crisp rendering
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale });

      // Create canvas with high DPI rendering
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      // Set actual canvas size (accounting for pixel ratio)
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;

      // Set display size (CSS pixels)
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Scale the drawing context to match pixel ratio
      context.scale(pixelRatio, pixelRatio);

      // Render to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Display canvas
      viewer.innerHTML = "";
      viewer.appendChild(canvas);

      // Scroll to top of viewer to ensure canvas is visible
      viewer.scrollTop = 0;

      this.updatePageInfo();
      this.updateZoomInfo();
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

  /**
   * Update zoom info display
   */
  updateZoomInfo() {
    const zoomResetBtn = document.getElementById("zoomResetBtn");
    if (zoomResetBtn) {
      zoomResetBtn.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }

    // Update zoom button states
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");

    if (zoomInBtn) {
      zoomInBtn.disabled = this.currentZoom >= this.maxZoom;
    }
    if (zoomOutBtn) {
      zoomOutBtn.disabled = this.currentZoom <= this.minZoom;
    }
  }

  /**
   * Zoom in
   */
  async zoomIn() {
    if (this.currentZoom < this.maxZoom) {
      this.currentZoom = Math.min(
        this.currentZoom + this.zoomStep,
        this.maxZoom,
      );
      await this.renderPage(this.currentPage);
    }
  }

  /**
   * Zoom out
   */
  async zoomOut() {
    if (this.currentZoom > this.minZoom) {
      this.currentZoom = Math.max(
        this.currentZoom - this.zoomStep,
        this.minZoom,
      );
      await this.renderPage(this.currentPage);
    }
  }

  /**
   * Reset zoom to 100%
   */
  async zoomReset() {
    this.currentZoom = 1.0;
    await this.renderPage(this.currentPage);
  }
}
