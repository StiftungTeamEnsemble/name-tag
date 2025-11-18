/**
 * Parse CSV or tab-separated data into name tag entries
 * @param {string} content - The CSV/TSV content
 * @param {string} format - Format type: 'name-vorname-funktion-zusatz', 'vorname-name-funktion-zusatz', or 'name-funktion-zusatz'
 * @returns {Array} Array of {vorname, name, function, zusatz} objects, sorted alphabetically by name
 */
export function parseCSV(content, format = "name-vorname-funktion-zusatz") {
  const lines = content.trim().split("\n");
  const data = [];

  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines

    // Try tab-separated first (TSV format)
    let parts = line.split("\t").map((p) => p.trim());

    // If no tabs, try comma-separated
    if (parts.length === 1) {
      parts = line.split(",").map((p) => p.trim());
    }

    let entry = { vorname: "", name: "", function: "", zusatz: "" };

    // Parse according to selected format
    switch (format) {
      case "name-vorname-funktion-zusatz":
        // Name[TAB]Vorname[TAB]Funktion(optional)[TAB]Zusatz(optional)
        if (parts.length >= 1 && parts[0]) {
          entry.name = parts[0];
          entry.vorname = parts[1] || "";
          entry.function = parts[2] || "";
          entry.addition = parts[3] || "";
        }
        break;

      case "vorname-name-funktion-zusatz":
        // Vorname[TAB]Name[TAB]Funktion(optional)[TAB]Zusatz(optional)
        if (parts.length >= 1 && parts[0]) {
          entry.vorname = parts[0];
          entry.name = parts[1] || "";
          entry.function = parts[2] || "";
          entry.addition = parts[3] || "";
        }
        break;

      case "name-funktion-zusatz":
        // Name[TAB]Funktion(optional)[TAB]Zusatz(optional) (no Vorname in this format)
        if (parts.length >= 1 && parts[0]) {
          entry.name = parts[0];
          entry.vorname = "";
          entry.function = parts[1] || "";
          entry.addition = parts[2] || "";
        }
        break;
    }

    // Only add if at least name or vorname exists
    if (entry.name || entry.vorname) {
      data.push(entry);
    }
  }

  // Sort alphabetically by name (case-insensitive)
  data.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return data;
}
