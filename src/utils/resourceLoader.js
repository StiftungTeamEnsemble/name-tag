/**
 * Resource Loader Interface
 * Abstracts loading of fonts and PDFs for different environments (browser vs Node.js)
 */

/**
 * Browser-based resource loader using fetch API
 */
export class BrowserResourceLoader {
  async loadFont(fontPath) {
    try {
      const response = await fetch(fontPath);
      if (!response.ok) {
        throw new Error(`Failed to load font at ${fontPath}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error loading font:", error);
      throw error;
    }
  }

  async loadPdf(pdfPath) {
    try {
      const response = await fetch(pdfPath);
      if (!response.ok) {
        throw new Error(`Failed to load PDF at ${pdfPath}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error loading PDF:", error);
      return null;
    }
  }

  async loadImage(imagePath) {
    try {
      const response = await fetch(imagePath);
      if (!response.ok) {
        throw new Error(`Failed to load image at ${imagePath}`);
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error loading image:", error);
      return null;
    }
  }
}

/**
 * Node.js-based resource loader using fs
 */
export class NodeResourceLoader {
  constructor() {
    // Dynamic import to avoid issues in browser environment
    this.fs = null;
  }

  async _ensureFs() {
    if (!this.fs) {
      const { readFileSync } = await import("fs");
      this.fs = { readFileSync };
    }
  }

  async loadFont(fontPath) {
    try {
      await this._ensureFs();
      const buffer = this.fs.readFileSync(fontPath);
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
    } catch (error) {
      console.error("Error loading font:", error);
      throw error;
    }
  }

  async loadPdf(pdfPath) {
    try {
      await this._ensureFs();
      const buffer = this.fs.readFileSync(pdfPath);
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
    } catch (error) {
      console.error("Error loading PDF:", error);
      return null;
    }
  }

  async loadImage(imagePath) {
    try {
      await this._ensureFs();
      const buffer = this.fs.readFileSync(imagePath);
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
    } catch (error) {
      console.error("Error loading image:", error);
      return null;
    }
  }
}
