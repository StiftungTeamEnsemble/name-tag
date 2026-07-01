const DEFAULT_FORMAT = "firstname,lastname,role,addition";
export const KNOWN_FIELDS = [
  "firstname",
  "lastname",
  "role",
  "addition",
  "image",
];

const SORT_FIELDS = [...KNOWN_FIELDS];

function createEntry() {
  return {
    firstname: "",
    lastname: "",
    role: "",
    addition: "",
    image: "",
  };
}

export function normalizeField(field) {
  return String(field || "").trim().toLowerCase();
}

export function parseFormat(format = DEFAULT_FORMAT) {
  const fields = String(format || DEFAULT_FORMAT)
    .split(",")
    .map(normalizeField)
    .filter(Boolean);

  if (fields.length === 0) {
    throw new Error("Format must contain at least one field");
  }

  const invalid = fields.filter((field) => !KNOWN_FIELDS.includes(field));
  if (invalid.length > 0) {
    throw new Error(
      `Unknown format field(s): ${invalid.join(", ")}. Known fields: ${KNOWN_FIELDS.join(", ")}`,
    );
  }

  return fields;
}

function splitLine(line) {
  let parts = line.split("\t").map((p) => p.trim());
  if (parts.length === 1) {
    parts = line.split(",").map((p) => p.trim());
  }
  return parts;
}

function compareByField(field) {
  const normalizedField = normalizeField(field);
  if (!SORT_FIELDS.includes(normalizedField)) {
    throw new Error(
      `Unknown sort field: ${field}. Known fields: ${KNOWN_FIELDS.join(", ")}`,
    );
  }

  return (a, b) => {
    const valueA = a[normalizedField] || "";
    const valueB = b[normalizedField] || "";
    return valueA.localeCompare(valueB, undefined, {
      sensitivity: "base",
      numeric: true,
    });
  };
}

/**
 * Parse CSV or tab-separated data into name tag entries.
 * @param {string} content - The CSV/TSV content
 * @param {string|string[]} format - Ordered fields, e.g. "firstname,lastname,addition,image"
 * @param {Object} options - Parser options
 * @param {string} [options.sort] - Optional field to sort by. If omitted, input order is kept.
 * @returns {Array} Array of parsed name tag entry objects
 */
export function parseCSV(content, format = DEFAULT_FORMAT, options = {}) {
  const fields = Array.isArray(format)
    ? format.map(normalizeField).filter(Boolean)
    : parseFormat(format);
  const lines = content.trim().split(/\r?\n/);
  const data = [];

  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines

    const parts = splitLine(line);
    const entry = createEntry();

    fields.forEach((field, index) => {
      entry[field] = parts[index] || "";
    });

    if (Object.values(entry).some((value) => value)) {
      data.push(entry);
    }
  }

  if (options.sort) {
    data.sort(compareByField(options.sort));
  }

  return data;
}

/**
 * Create blank entries (no name/photo), useful for tags to fill in by hand.
 * @param {number} count - how many blank entries to create
 * @returns {Array} array of empty entry objects
 */
export function createBlankEntries(count) {
  const n = Math.max(0, parseInt(count, 10) || 0);
  return Array.from({ length: n }, () => ({
    firstname: "",
    lastname: "",
    role: "",
    addition: "",
    image: "",
  }));
}
