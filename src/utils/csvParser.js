/**
 * Parse CSV or tab-separated data into name tag entries
 * @param {string} content - The CSV/TSV content
 * @returns {Array} Array of {name, function} objects
 */
export function parseCSV(content) {
    const lines = content.trim().split('\n');
    const data = [];
    
    for (const line of lines) {
        if (!line.trim()) continue; // Skip empty lines
        
        // Try tab-separated first (TSV format)
        let parts = line.split('\t').map(p => p.trim()).filter(p => p);
        
        // If no tabs, try comma-separated
        if (parts.length === 1) {
            parts = line.split(',').map(p => p.trim()).filter(p => p);
        }
        
        if (parts.length >= 2) {
            data.push({
                name: parts[0],
                function: parts[1]
            });
        }
    }
    
    return data;
}
