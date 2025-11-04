import { parseCSV } from "./utils/csvParser.js";
import { PdfGenerator } from "./utils/pdfGenerator.js";
import { PdfPreviewManager } from "./utils/pdfPreviewManager.js";

let nameTagData = [];
let pdfGenerator = null;
let pdfPreviewManager = null;

// DOM Elements
const csvFile = document.getElementById("csvFile");
const dropZone = document.getElementById("dropZone");
const manualInput = document.getElementById("manualInput");
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
    parseAndDisplayData(content);
  };
  reader.readAsText(file);
}

// Parse Button
parseBtn.addEventListener("click", () => {
  const activeTab = document.querySelector(".tab-btn.active").dataset.tab;

  let content = "";
  if (activeTab === "csv") {
    if (!csvFile.files.length) {
      showError("Please select a CSV file");
      return;
    }
    const file = csvFile.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      content = e.target.result;
      parseAndDisplayData(content);
    };
    reader.readAsText(file);
  } else {
    content = manualInput.value.trim();
    if (!content) {
      showError("Please enter data in the text field");
      return;
    }
    parseAndDisplayData(content);
  }
});

function parseAndDisplayData(content) {
  try {
    nameTagData = parseCSV(content);

    if (nameTagData.length === 0) {
      showError("No valid data found. Make sure format is: Name[TAB]Function");
      return;
    }

    displayPreview();
    generateBtn.disabled = false;
    previewPdfBtn.disabled = false;
    showSuccess(`Loaded ${nameTagData.length} name tags`);
  } catch (error) {
    showError(`Error parsing data: ${error.message}`);
  }
}

function displayPreview() {
  previewBody.innerHTML = "";

  nameTagData.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.function)}</td>
            <td><button class="delete-btn" onclick="deleteRow(${index})">Delete</button></td>
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
    showError("No data to generate PDF");
    return;
  }

  const layoutName = layoutSelect.value;
  pdfGenerator = new PdfGenerator(nameTagData, layoutName);

  try {
    await pdfGenerator.generate();
    showSuccess("PDF generated successfully!");
  } catch (error) {
    showError(`Error generating PDF: ${error.message}`);
  }
});

// Preview PDF
previewPdfBtn.addEventListener("click", async () => {
  if (nameTagData.length === 0) {
    showError("No data to preview");
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
    showError(`Error previewing PDF: ${error.message}`);
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

document.getElementById("downloadPdfBtn").addEventListener("click", () => {
  if (pdfGenerator) {
    pdfGenerator.download();
    showSuccess("PDF downloaded!");
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
