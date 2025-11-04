# 🎨 Config-Based Layout System Update

## Changes Made

### 1. New Configuration File: `src/config.js`
Created a centralized layout configuration system with:
- **Zweckform L4785-20 preset** with custom elements
- **Custom layout template**
- Helper functions for layout management
- Element-based rendering (image, text with templates)

### 2. Updated PDF Generator: `src/utils/pdfGenerator.js`
- Now uses layout configuration from `config.js`
- Accepts layout name instead of object
- New async rendering for element-based layouts
- Element types supported:
  - `type: 'image'` - For logo/SVG rendering
  - `type: 'text'` - For name and function with templates
- Template variables: `{{name}}`, `{{function}}`
- Custom font paths configured per element
- Color support via hex values

### 3. Updated Main App: `src/main.js`
- Imports configuration system
- Passes layout name to PDF generator
- Simplified generate/preview logic
- Now fully async for proper element handling

## New Features

### Element-Based Label Design
Each label element can be configured:
```javascript
{
  type: 'image',
  src: './assets/logo.svg',
  width: 8,
  position: { x: 2, y: 1.5 }
}
```

```javascript
{
  type: 'text',
  content: '{{name}}',
  fontPath: './assets/fonts/Geist/ttf/Geist-Bold.ttf',
  font: { size: 11, weight: 'bold' },
  color: '#000000',
  position: { x: 11, y: 5.5 }
}
```

### Font Support
- **Name**: Geist-Bold (modern, clean)
- **Function**: Merriweather-Regular (professional, readable)
- Fonts loaded from `./assets/fonts/`
- Easily customizable per layout

### Logo Integration
- Logo from `./assets/logo.svg`
- Configurable size and position
- Placed in bottom-left by default in Zweckform preset

## Configuration Structure

```javascript
labelLayouts = {
  'zweckform-L4785-20': {
    name: 'Zweckform L4785-20',
    paperFormat: 'A4',
    labelsX: 4,
    labelsY: 20,
    labelWidth: 52.5,
    labelHeight: 21.2,
    // ... more params
    elements: [
      // Array of elements to render
    ]
  }
}
```

## Available Functions in `config.js`

### `getLayoutConfig(layoutName)`
Get layout configuration by name
```javascript
const layout = getLayoutConfig('zweckform-L4785-20');
```

### `getAvailableLayouts()`
Get list of all available layouts
```javascript
const layouts = getAvailableLayouts();
// Returns: [{ value: '...', label: '...' }, ...]
```

### `createCustomLayout(params)`
Create custom layout programmatically
```javascript
const custom = createCustomLayout({
  name: 'My Custom',
  paperFormat: 'A4',
  labelsX: 4,
  labelsY: 20,
  // ... more params
});
```

## Files Modified

1. ✅ `src/config.js` - **NEW** - Central layout configuration
2. ✅ `src/utils/pdfGenerator.js` - Updated for config-based rendering
3. ✅ `src/main.js` - Updated to use new system

## Files Unchanged

- `index.html` - UI remains the same
- `src/styles.css` - Styling unchanged
- `src/utils/csvParser.js` - No changes needed
- `src/utils/pdfPreviewManager.js` - No changes needed

## How to Customize

### Add New Font to Layout
1. Place font in `./assets/fonts/FontName/ttf/`
2. Update `config.js` element:
```javascript
{
  type: 'text',
  fontPath: './assets/fonts/NewFont/ttf/NewFont-Weight.ttf',
  // ... rest of config
}
```

### Add New Logo Position
Update the image element in `config.js`:
```javascript
{
  type: 'image',
  src: './assets/logo.svg',
  width: 10,
  position: { x: 40, y: 1 }  // Changed position
}
```

### Create New Layout
Add to `labelLayouts` in `config.js`:
```javascript
'my-new-layout': {
  name: 'My Layout',
  // ... configuration
  elements: [
    // ... elements
  ]
}
```

## Dev Server

The dev server is running on:
```
http://localhost:5174/name-tag/
```

Test the app:
1. Load data (CSV or manual)
2. Select layout from dropdown (now config-based)
3. Click "Preview PDF" to see rendered layout
4. Click "Generate PDF" to download

## Next Steps

The system is now modular and configuration-driven. You can:
- ✅ Add more layout presets
- ✅ Customize fonts per element
- ✅ Change logo/image placement
- ✅ Adjust colors and sizing
- ✅ Create variations for different use cases

All changes are centralized in `config.js` for easy management!
