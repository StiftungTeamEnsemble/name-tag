import {
  KNOWN_FIELDS,
  parseCSV,
  createBlankEntries,
} from "./utils/csvParser.js";
import { PdfGenerator } from "./utils/pdfGenerator.js";
import { PdfPreviewManager } from "./utils/pdfPreviewManager.js";
import { getAvailableLayouts, getLayoutConfig, assetPaths } from "./config.js";

/**
 * Recursively check whether a layout uses face detection on any element.
 */
function layoutUsesFaceDetection(elements) {
  if (!Array.isArray(elements)) return false;
  return elements.some(
    (el) => el.faceDetect || layoutUsesFaceDetection(el.children),
  );
}

/**
 * Build a PdfGenerator for the given layout, wiring the image loader and
 * (when the layout needs it) the browser face detector.
 */
async function buildGenerator(layoutConfig) {
  let faceDetector = null;
  if (layoutUsesFaceDetection(layoutConfig.elements)) {
    if (!imageFiles) {
      throw new Error(
        "Dieses Layout nutzt Gesichtserkennung – bitte zuerst einen Bildordner auswählen.",
      );
    }
    showSuccess("Gesichtserkennung wird geladen…");
    // Lazy-loaded so the large face-detection library is only fetched on demand.
    const { createBrowserFaceDetector } =
      await import("./utils/faceDetectorBrowser.js");
    faceDetector = await createBrowserFaceDetector();
  }
  // Append blank tags (to fill in by hand) requested in the UI.
  const emptyCount = parseInt(emptyTags?.value, 10) || 0;
  const data = nameTagData.concat(createBlankEntries(emptyCount));

  return new PdfGenerator(data, layoutConfig, null, assetPaths, {
    imageLoader: buildImageLoader(),
    faceDetector,
  });
}

let nameTagData = [];
let pdfGenerator = null;
let pdfPreviewManager = null;
// Map of lowercased filename -> async () => ArrayBuffer for the selected image folder
let imageFiles = null;

// DOM Elements
const csvFile = document.getElementById("csvFile");
const dropZone = document.getElementById("dropZone");
const manualInput = document.getElementById("manualInput");
const fieldOrderList = document.getElementById("fieldOrderList");
const formatHint = document.getElementById("formatHint");
const sortSelect = document.getElementById("sortSelect");
const parseBtn = document.getElementById("parseBtn");
const previewTable = document.getElementById("previewTable");
const previewHead = previewTable.querySelector("thead tr");
const previewBody = document.getElementById("previewBody");
const noPreview = document.getElementById("noPreview");
const layoutSelect = document.getElementById("layoutSelect");
const showLines = document.getElementById("showLines");
const folderSelector = document.querySelector(".folder-selector");
const selectFolderBtn = document.getElementById("selectFolderBtn");
const folderInput = document.getElementById("folderInput");
const folderStatus = document.getElementById("folderStatus");
const emptyTags = document.getElementById("emptyTags");
const generateBtn = document.getElementById("generateBtn");
const previewPdfBtn = document.getElementById("previewPdfBtn");
const previewModal = document.getElementById("previewModal");
const closePreview = document.getElementById("closePreview");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

const fieldDefinitions = [
  { value: "firstname", label: "Vorname" },
  { value: "lastname", label: "Nachname" },
  { value: "role", label: "Funktion" },
  { value: "addition", label: "Zusatz" },
  { value: "image", label: "Bilddatei" },
];
let fieldOrder = [];
let activeFields = new Set();
let draggedField = null;
let dropIndicator = null;
let currentInputContent = "";

// Populate layout dropdown
function populateLayoutDropdown() {
  const layouts = getAvailableLayouts();
  layoutSelect.innerHTML = "";

  layouts.forEach((layout) => {
    const option = document.createElement("option");
    option.value = layout.value;
    option.textContent = layout.label;
    layoutSelect.appendChild(option);
  });

  updateLayoutOptions();
}

function updateLayoutOptions() {
  const layoutConfig = getSelectedLayoutConfig();
  folderSelector.hidden = !layoutConfig.requiresImageFolder;
  const layoutFields = getLayoutFields(layoutConfig);
  fieldOrder = layoutFields;
  activeFields = new Set(layoutFields);
  renderFieldOrderList();
  populateSortDropdown(layoutFields);
  refreshPreviewFromCurrentInput();
}

function getSelectedLayoutConfig() {
  const layoutConfig = getLayoutConfig(layoutSelect.value);
  return {
    ...layoutConfig,
    showBorder: Boolean(layoutConfig.showBorder || showLines.checked),
  };
}

// Initialize
populateLayoutDropdown();

function getLayoutFields(layoutConfig) {
  const fields = Array.isArray(layoutConfig.dataFields)
    ? layoutConfig.dataFields
    : KNOWN_FIELDS;
  return fields.filter((field) => KNOWN_FIELDS.includes(field));
}

function populateSortDropdown(fields = fieldOrder) {
  const previousValue = sortSelect.value;
  sortSelect.innerHTML = "";

  const keepOrderOption = document.createElement("option");
  keepOrderOption.value = "";
  keepOrderOption.textContent = "Reihenfolge der TSV/CSV behalten";
  sortSelect.appendChild(keepOrderOption);

  fieldDefinitions
    .filter((definition) => fields.includes(definition.value))
    .forEach((field) => {
      const option = document.createElement("option");
      option.value = field.value;
      option.textContent = field.label;
      sortSelect.appendChild(option);
    });

  sortSelect.value = fields.includes(previousValue) ? previousValue : "";
}

function getActiveFormatFields() {
  return fieldOrder.filter((field) => activeFields.has(field));
}

function getActiveFormat() {
  return getActiveFormatFields().join(",");
}

function renderFieldOrderList() {
  fieldOrderList.innerHTML = "";

  fieldOrder.forEach((field) => {
    const definition = fieldDefinitions.find((item) => item.value === field);
    const item = document.createElement("li");
    item.className = "field-order-item";
    item.draggable = true;
    item.dataset.field = field;
    item.innerHTML = `
      <span class="drag-handle" aria-hidden="true">⋮⋮</span>
      <label>
        <input type="checkbox" ${activeFields.has(field) ? "checked" : ""} />
        <span>${definition.label}</span>
      </label>
    `;

    item.addEventListener("dragstart", () => {
      draggedField = field;
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => {
      draggedField = null;
      clearDropIndicator();
      item.classList.remove("dragging");
    });

    const checkbox = item.querySelector("input");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        activeFields.add(field);
      } else {
        activeFields.delete(field);
      }
      updateFormatPreview();
      refreshPreviewFromCurrentInput();
    });

    fieldOrderList.appendChild(item);
  });

  updateFormatPreview();
}

function getDropIndex(clientY) {
  const items = Array.from(
    fieldOrderList.querySelectorAll(".field-order-item"),
  );
  for (let index = 0; index < items.length; index++) {
    const rect = items[index].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return index;
    }
  }
  return items.length;
}

function setDropIndicator(index) {
  dropIndicator = { index };

  const items = Array.from(
    fieldOrderList.querySelectorAll(".field-order-item"),
  );
  items.forEach((item) => item.classList.remove("drop-before", "drop-after"));

  if (items.length === 0) return;
  if (index >= items.length) {
    items[items.length - 1].classList.add("drop-after");
  } else {
    items[index].classList.add("drop-before");
  }
}

function clearDropIndicator() {
  dropIndicator = null;
  fieldOrderList.querySelectorAll(".field-order-item").forEach((item) => {
    item.classList.remove("drop-before", "drop-after");
  });
}

fieldOrderList.addEventListener("dragover", (event) => {
  if (!draggedField) return;
  event.preventDefault();
  setDropIndicator(getDropIndex(event.clientY));
});

fieldOrderList.addEventListener("dragleave", (event) => {
  if (!fieldOrderList.contains(event.relatedTarget)) {
    clearDropIndicator();
  }
});

fieldOrderList.addEventListener("drop", (event) => {
  event.preventDefault();
  if (!draggedField) return;

  const nextOrder = fieldOrder.filter((value) => value !== draggedField);
  const draggedIndex = fieldOrder.indexOf(draggedField);
  let dropIndex = dropIndicator?.index ?? getDropIndex(event.clientY);
  if (draggedIndex < dropIndex) {
    dropIndex -= 1;
  }
  dropIndex = Math.max(0, Math.min(dropIndex, nextOrder.length));

  nextOrder.splice(dropIndex, 0, draggedField);
  fieldOrder = nextOrder;
  clearDropIndicator();
  renderFieldOrderList();
  refreshPreviewFromCurrentInput();
});

function updateFormatPreview() {
  formatHint.textContent = getActiveFormat()
    ? "Aktive Felder entsprechen den Spalten von links nach rechts."
    : "Bitte mindestens ein Feld aktivieren.";
}

manualInput.placeholder =
  "Daten einfügen\nEine Zeile pro Schild, Spalten mit Tab getrennt\n\nBeispiel:\nMax\tMustermann\tDirektor\tAbteilung A\nErika\tMusterfrau\tManagerin\t";

sortSelect.addEventListener("change", () => refreshPreviewFromCurrentInput());
layoutSelect.addEventListener("change", updateLayoutOptions);

// Image folder selection.
// Prefer the File System Access API (showDirectoryPicker); fall back to a
// <input webkitdirectory> for browsers that don't support it (Firefox/Safari).
selectFolderBtn.addEventListener("click", async () => {
  if (window.showDirectoryPicker) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const map = new Map();
      for await (const entry of dirHandle.values()) {
        if (entry.kind === "file") {
          map.set(entry.name.normalize("NFC").toLowerCase(), async () => {
            const file = await entry.getFile();
            return await file.arrayBuffer();
          });
        }
      }
      imageFiles = map;
      folderStatus.textContent = `${map.size} Bilder geladen (${dirHandle.name})`;
    } catch (error) {
      if (error.name !== "AbortError") {
        showError(`Fehler beim Auswählen des Ordners: ${error.message}`);
      }
    }
  } else {
    // Fallback for browsers without the File System Access API
    folderInput.click();
  }
});

folderInput.addEventListener("change", () => {
  const files = Array.from(folderInput.files || []);
  if (files.length === 0) return;
  const map = new Map();
  for (const file of files) {
    map.set(
      file.name.normalize("NFC").toLowerCase(),
      async () => await file.arrayBuffer(),
    );
  }
  imageFiles = map;
  folderStatus.textContent = `${map.size} Bilder geladen`;
});

// Build an image loader that resolves a CSV filename (case-insensitive) to bytes
function buildImageLoader() {
  if (!imageFiles) return null;
  return async (filename) => {
    if (!filename) return null;
    const getter = imageFiles.get(filename.normalize("NFC").toLowerCase());
    return getter ? await getter() : null;
  };
}

// Tab switching
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;

    // Update active button
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Update active content
    tabContents.forEach((content) => content.classList.remove("active"));
    document.getElementById(`${tabName}-tab`).classList.add("active");

    if (tabName === "manual") {
      currentInputContent = manualInput.value;
      refreshPreviewFromCurrentInput();
    }
  });
});

// CSV Upload - Drag & Drop
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    csvFile.files = files;
    loadCSVFile();
  }
});

dropZone.addEventListener("click", () => {
  csvFile.click();
});

csvFile.addEventListener("change", loadCSVFile);

function loadCSVFile() {
  const file = csvFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    currentInputContent = e.target.result;
    parseAndDisplayData(currentInputContent);
  };
  reader.readAsText(file);
}

manualInput.addEventListener("input", () => {
  currentInputContent = manualInput.value;
  refreshPreviewFromCurrentInput();
});

// Parse Button
parseBtn.addEventListener("click", () => {
  const activeTab = document.querySelector(".tab-btn.active").dataset.tab;

  let content = "";
  if (activeTab === "csv") {
    if (!csvFile.files.length) {
      showError("Bitte wählen Sie eine CSV-Datei aus");
      return;
    }
    const file = csvFile.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      content = e.target.result;
      currentInputContent = content;
      parseAndDisplayData(content);
    };
    reader.readAsText(file);
  } else {
    content = manualInput.value.trim();
    if (!content) {
      showError("Bitte geben Sie Daten in das Textfeld ein");
      return;
    }
    currentInputContent = content;
    parseAndDisplayData(content);
  }
});

function refreshPreviewFromCurrentInput() {
  if (!currentInputContent.trim()) {
    clearPreview();
    return;
  }
  parseAndDisplayData(currentInputContent, { silent: true });
}

function clearPreview() {
  nameTagData = [];
  previewBody.innerHTML = "";
  previewTable.style.display = "none";
  noPreview.style.display = "block";
  generateBtn.disabled = true;
  previewPdfBtn.disabled = true;
}

function parseAndDisplayData(content, { silent = false } = {}) {
  try {
    nameTagData = parseCSV(content, getActiveFormat(), {
      sort: sortSelect.value || null,
    });

    if (nameTagData.length === 0) {
      clearPreview();
      if (!silent) {
        showError(
          "Keine gültigen Daten gefunden. Bitte überprüfen Sie das Format.",
        );
      }
      return;
    }

    displayPreview();
    generateBtn.disabled = false;
    previewPdfBtn.disabled = false;
    if (!silent) {
      showSuccess(`${nameTagData.length} Namensschilder geladen`);
    }
  } catch (error) {
    clearPreview();
    if (!silent) {
      showError(`Fehler beim Verarbeiten der Daten: ${error.message}`);
    }
  }
}

function displayPreview() {
  const previewFields = getActiveFormatFields();
  previewBody.innerHTML = "";
  previewHead.innerHTML = "";

  previewFields.forEach((field) => {
    const definition = fieldDefinitions.find((item) => item.value === field);
    const header = document.createElement("th");
    header.textContent = definition?.label || field;
    previewHead.appendChild(header);
  });

  const actionHeader = document.createElement("th");
  actionHeader.textContent = "Aktion";
  previewHead.appendChild(actionHeader);

  nameTagData.forEach((item, index) => {
    const row = document.createElement("tr");

    previewFields.forEach((field) => {
      const cell = document.createElement("td");
      cell.textContent = item[field] || "";
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    actionCell.innerHTML = `<button class="delete-btn" onclick="deleteRow(${index})">Löschen</button>`;
    row.appendChild(actionCell);
    previewBody.appendChild(row);
  });

  previewTable.style.display = "block";
  noPreview.style.display = "none";
}

window.deleteRow = (index) => {
  nameTagData.splice(index, 1);
  if (nameTagData.length === 0) {
    previewTable.style.display = "none";
    noPreview.style.display = "block";
    generateBtn.disabled = true;
    previewPdfBtn.disabled = true;
  } else {
    displayPreview();
  }
};

// Generate PDF
generateBtn.addEventListener("click", async () => {
  if (nameTagData.length === 0) {
    showError("Keine Daten zum Generieren vorhanden");
    return;
  }

  const layoutConfig = getSelectedLayoutConfig();

  try {
    pdfGenerator = await buildGenerator(layoutConfig);
    await pdfGenerator.generate();
    showSuccess("PDF erfolgreich generiert!");
  } catch (error) {
    showError(`Fehler beim Generieren des PDFs: ${error.message}`);
  }
});

// Preview PDF
previewPdfBtn.addEventListener("click", async () => {
  if (nameTagData.length === 0) {
    showError("Keine Daten für Vorschau vorhanden");
    return;
  }

  const layoutConfig = getSelectedLayoutConfig();

  try {
    pdfGenerator = await buildGenerator(layoutConfig);
    const pdfBytes = await pdfGenerator.generateBytes();
    pdfPreviewManager = new PdfPreviewManager(pdfBytes);
    await pdfPreviewManager.init();

    previewModal.classList.add("show");
    await pdfPreviewManager.renderPage(1);
  } catch (error) {
    showError(`Fehler bei der PDF-Vorschau: ${error.message}`);
  }
});

closePreview.addEventListener("click", () => {
  previewModal.classList.remove("show");
});

previewModal.addEventListener("click", (e) => {
  if (e.target === previewModal) {
    previewModal.classList.remove("show");
  }
});

// Keyboard shortcuts for PDF preview
document.addEventListener("keydown", (e) => {
  if (!previewModal.classList.contains("show") || !pdfPreviewManager) {
    return;
  }

  switch (e.key) {
    case "ArrowLeft":
    case "PageUp":
      e.preventDefault();
      pdfPreviewManager.previousPage();
      break;
    case "ArrowRight":
    case "PageDown":
      e.preventDefault();
      pdfPreviewManager.nextPage();
      break;
    case "+":
    case "=":
      e.preventDefault();
      pdfPreviewManager.zoomIn();
      break;
    case "-":
      e.preventDefault();
      pdfPreviewManager.zoomOut();
      break;
    case "0":
      e.preventDefault();
      pdfPreviewManager.zoomReset();
      break;
    case "Escape":
      previewModal.classList.remove("show");
      break;
  }
});

document.getElementById("prevPageBtn").addEventListener("click", async () => {
  if (pdfPreviewManager) {
    await pdfPreviewManager.previousPage();
  }
});

document.getElementById("nextPageBtn").addEventListener("click", async () => {
  if (pdfPreviewManager) {
    await pdfPreviewManager.nextPage();
  }
});

document.getElementById("zoomInBtn").addEventListener("click", async () => {
  if (pdfPreviewManager) {
    await pdfPreviewManager.zoomIn();
  }
});

document.getElementById("zoomOutBtn").addEventListener("click", async () => {
  if (pdfPreviewManager) {
    await pdfPreviewManager.zoomOut();
  }
});

document.getElementById("zoomResetBtn").addEventListener("click", async () => {
  if (pdfPreviewManager) {
    await pdfPreviewManager.zoomReset();
  }
});

document.getElementById("downloadPdfBtn").addEventListener("click", () => {
  if (pdfGenerator) {
    pdfGenerator.download();
    showSuccess("PDF heruntergeladen!");
  }
});

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  const notification = document.createElement("div");
  notification.className = "error";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}

function showSuccess(message) {
  const notification = document.createElement("div");
  notification.className = "success";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}
