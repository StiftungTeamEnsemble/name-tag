# Label Specifications & Custom Layouts

## Zweckform L4785-20 (Predefined)

**Physical Specifications:**
- Label dimensions: 52.5 × 21.2 mm
- Labels per sheet: 80 (4 columns × 20 rows)
- Paper format: A4 (210 × 297 mm)
- Gap between labels: 1mm (X), 0mm (Y)
- Margins: 5mm (left & top)

**When to use:**
- Standard office name tags
- Small to medium events
- Conference badges
- Professional identification

**Where to buy:**
- Zweckform product code: L4785-20
- Available from most office supply stores in Europe
- Alternative: Similar Avery products (e.g., L4780)

---

## Custom Layout Configuration

### Paper Formats Available
- **A4**: 210 × 297 mm (standard in Europe)
- **Letter**: 215.9 × 279.4 mm (standard in USA)
- **A3**: 297 × 420 mm (double A4)

### Layout Parameters Explained

#### Labels per Row (X) & Column (Y)
Determines the grid layout:
- Small labels (e.g., 5 columns × 15 rows) = 75 labels per page
- Large labels (e.g., 2 columns × 8 rows) = 16 labels per page

#### Gap X & Gap Y
Space between labels in millimeters:
- Gap X: Horizontal spacing between columns
- Gap Y: Vertical spacing between rows
- Typical values: 1-2 mm

#### Start Left & Start Top
Top-left margins from paper edge:
- **Start Left**: Distance from left edge to first label
- **Start Top**: Distance from top edge to first label
- Typical values: 5-10 mm (check your label sheet instructions)

---

## Common Label Presets to Add

### Avery L4780
```
Label size: 52.5 × 21.2 mm
Layout: 4 × 20 (80 labels)
Paper: A4
```

### Avery L7658 (Address Labels)
```
Label size: 38.1 × 63.5 mm
Layout: 3 × 8 (24 labels)
Paper: A4
Gap X: 2 mm, Gap Y: 0 mm
Margins: 7 mm
```

### Avery L7651 (Small Badge Labels)
```
Label size: 45.7 × 21.2 mm
Layout: 4 × 20 (80 labels)
Paper: A4
Gap X: 1 mm, Gap Y: 0 mm
Margins: 5 mm
```

### Avery L4791 (Large Badge Labels)
```
Label size: 99.1 × 67.7 mm
Layout: 2 × 4 (8 labels)
Paper: A4
Gap X: 0 mm, Gap Y: 0 mm
Margins: 5 mm, 6.5 mm
```

---

## How to Measure Your Labels

If you have physical labels and want custom dimensions:

1. **Measure label width & height**
   - Use a ruler or caliper
   - Measure from edge to edge in mm

2. **Count grid layout**
   - Count columns (X)
   - Count rows (Y)

3. **Measure spacing**
   - Gap between horizontal labels (Gap X)
   - Gap between vertical labels (Gap Y)

4. **Measure margins**
   - Distance from paper left edge to first label (Start Left)
   - Distance from paper top edge to first label (Start Top)

5. **Enter in custom layout**
   - Paper format
   - Labels X/Y
   - All dimensions
   - Generate test PDF

---

## PDF Rendering Tips

### Label Appearance
- **Font Size**: Name uses 12pt bold, Function uses 10pt regular
- **Layout**: Name at top, function at bottom
- **Alignment**: Left-aligned with 2mm internal margins
- **Borders**: Light gray (200, 200, 200)

### Print Settings
1. Set printer to **No scaling** (100%)
2. Select correct **Paper size** in printer settings
3. Use **Best quality** print mode for colors
4. Test print on regular paper first

### Troubleshooting Print Issues

| Problem | Solution |
|---------|----------|
| Labels shifted | Check printer margins, disable "Fit to page" |
| Text cut off | Increase label size or reduce font size |
| Poor quality | Use Best/High quality print mode |
| Wrong paper size | Verify paper format and printer settings |
| Spacing incorrect | Check "Start Left" and "Start Top" values |

---

## Creating Your Own Preset

To add a custom preset to the code:

1. Open `src/main.js`
2. Find the `getSelectedLayout()` function
3. Add your layout before the final `else`:

```javascript
} else if (layoutType === 'my-custom-label') {
    return {
        name: 'My Custom Label',
        paperFormat: 'A4',
        labelsX: 3,
        labelsY: 8,
        labelWidth: 70,        // mm
        labelHeight: 30,       // mm
        gapX: 1.5,            // mm
        gapY: 2,              // mm
        marginLeft: 7,        // mm
        marginTop: 10         // mm
    };
}
```

4. Update the HTML dropdown in `index.html`:

```html
<select id="layoutSelect">
    <option value="zweckform-L4785-20">Zweckform L4785-20</option>
    <option value="my-custom-label">My Custom Label</option>
    <option value="custom">Custom Layout</option>
</select>
```

---

## Advanced: Calculating Dimensions

If you need to fit X labels across A4 width:

```
Available width = Paper width - (2 × margin)
Available width = 210 - (2 × 5) = 200 mm

Label width = (200 - (X-1) × gap) / X

Example for 4 labels with 1mm gap:
Label width = (200 - 3 × 1) / 4 = 197 / 4 = 49.25 mm
```

---

## Support for Other Label Sheets

The generator works with any rectangular label sheet. Common manufacturers:
- **Zweckform** (Europe)
- **Avery** (USA/International)
- **Herma** (Europe)
- **DIN A4** compatible sheets from any brand

Check your label sheet documentation for:
- Label dimensions
- Grid layout (columns × rows)
- Margins and gaps
- Paper format
