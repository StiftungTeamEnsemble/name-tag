import { parseCSV } from "./utils/csvParser.js";
import { PdfGenerator } from "./utils/pdfGenerator.js";
import { PdfPreviewManager } from "./utils/pdfPreviewManager.js";
import { getAvailableLayouts } from "./config.js";

let nameTagData = [];
let pdfGenerator = null;
let pdfPreviewManager = null;

// DOM Elements
const csvFile = document.getElementById("csvFile");
const dropZone = document.getElementById("dropZone");
const manualInput = document.getElementById("manualInput");
const formatSelect = document.getElementById("formatSelect");
const formatHint = document.getElementById("formatHint");
const parseBtn = document.getElementById("parseBtn");
const previewTable = document.getElementById("previewTable");
const previewBody = document.getElementById("previewBody");
const noPreview = document.getElementById("noPreview");
const layoutSelect = document.getElementById("layoutSelect");
const generateBtn = document.getElementById("generateBtn");
const previewPdfBtn = document.getElementById("previewPdfBtn");
const previewModal = document.getElementById("previewModal");
const closePreview = document.getElementById("closePreview");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

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
}

// Format configurations
const formatConfigurations = {
  "vorname-name-funktion-zusatz": {
    label: "Vorname[TAB]Name[TAB]Funktion (optional)[TAB]Zusatz (optional)",
    manual:
      "Namen und Funktionen eingeben\nFormat: Vorname[TAB]Name[TAB]Funktion[TAB]Zusatz\n\nBeispiel:\nMax\tMustermann\tDirektor\tAbteilung A\nErika\tMusterfrau\tManagerin\t",
    hint: "Format: Vorname[TAB]Name[TAB]Funktion (optional)[TAB]Zusatz (optional)",
  },
  "name-vorname-funktion-zusatz": {
    label: "Name[TAB]Vorname[TAB]Funktion (optional)[TAB]Zusatz (optional)",
    manual:
      "Namen und Funktionen eingeben\nFormat: Name[TAB]Vorname[TAB]Funktion[TAB]Zusatz\n\nBeispiel:\nMustermann\tMax\tDirektor\tAbteilung A\nMusterfrau\tErika\tManagerin\t",
    hint: "Format: Name[TAB]Vorname[TAB]Funktion (optional)[TAB]Zusatz (optional)",
  },
  "name-funktion-zusatz": {
    label: "Name[TAB]Funktion (optional)[TAB]Zusatz (optional)",
    manual:
      "Namen und Funktionen eingeben\nFormat: Name[TAB]Funktion[TAB]Zusatz\n\nBeispiel:\nMustermann\tDirektor\tAbteilung A\nMusterfrau\tManagerin\t",
    hint: "Format: Name[TAB]Funktion (optional)[TAB]Zusatz (optional)",
  },
};

// Initialize
populateFormatDropdown();
populateLayoutDropdown();

// Populate format dropdown
function populateFormatDropdown() {
  formatSelect.innerHTML = "";

  Object.keys(formatConfigurations).forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = formatConfigurations[key].label;
    formatSelect.appendChild(option);
  });
}

// Update placeholder text based on format selection
function updatePlaceholders() {
  const format = formatSelect.value;
  const config = formatConfigurations[format];

  if (config) {
    manualInput.placeholder = config.manual;
    formatHint.textContent = config.hint;
  }
}

// Initialize placeholders
updatePlaceholders();

// Listen for format changes
formatSelect.addEventListener("change", updatePlaceholders);

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
    const content = e.target.result;
    const format = formatSelect.value;
    parseAndDisplayData(content, format);
  };
  reader.readAsText(file);
}

// Parse Button
parseBtn.addEventListener("click", () => {
  const activeTab = document.querySelector(".tab-btn.active").dataset.tab;
  const format = formatSelect.value;

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
      parseAndDisplayData(content, format);
    };
    reader.readAsText(file);
  } else {
    content = manualInput.value.trim();
    if (!content) {
      showError("Bitte geben Sie Daten in das Textfeld ein");
      return;
    }
    parseAndDisplayData(content, format);
  }
});

function parseAndDisplayData(content, format) {
  try {
    nameTagData = parseCSV(content, format);

    if (nameTagData.length === 0) {
      showError(
        "Keine gültigen Daten gefunden. Bitte überprüfen Sie das Format.",
      );
      return;
    }

    displayPreview();
    generateBtn.disabled = false;
    previewPdfBtn.disabled = false;
    showSuccess(`${nameTagData.length} Namensschilder geladen`);
  } catch (error) {
    showError(`Fehler beim Verarbeiten der Daten: ${error.message}`);
  }
}

function displayPreview() {
  previewBody.innerHTML = "";

  nameTagData.forEach((item, index) => {
    const row = document.createElement("tr");
    const displayName = `${item.vorname} ${item.name}`.trim();
    row.innerHTML = `
            <td>${escapeHtml(displayName)}</td>
            <td>${escapeHtml(item.function)}</td>
            <td>${escapeHtml(item.addition)}</td>
            <td><button class="delete-btn" onclick="deleteRow(${index})">Löschen</button></td>
        `;
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

  const layoutName = layoutSelect.value;
  pdfGenerator = new PdfGenerator(nameTagData, layoutName);

  try {
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

  const layoutName = layoutSelect.value;
  pdfGenerator = new PdfGenerator(nameTagData, layoutName);

  try {
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
