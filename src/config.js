import logoPdfUrl from "../assets/logo.pdf?url";
import geistRegularFontUrl from "../assets/fonts/Geist/ttf/Geist-Regular.ttf?url";
import geistSemiBoldFontUrl from "../assets/fonts/Geist/ttf/Geist-SemiBold.ttf?url";
import merriweatherRegularFontUrl from "../assets/fonts/Merriweather/ttf/Merriweather-Regular.ttf?url";

/**
 * Label Layout Configuration
 * Defines the structure and styling for name tags
 *
 * Element Types:
 * 
 * 1. Image Element:
 * - src: URL or path to the image/PDF
 * - width: Width in mm
 * - height: Height in mm or "auto" for aspect ratio
 * - position: { x, y } coordinates in mm
 *
 * 2. Text Element:
 * - content: Template string with {{name}} and {{function}} placeholders
 * - Empty fields will be skipped (no rendering if text is empty)
 * - width: (optional) Text box width in mm for multi-line text wrapping
 * - autoSize: (optional) Auto-scale text down to fit within width if any line is too long
 * - position: { x, y } coordinates in mm
 * - font.lineHeight: (optional) Line height multiplier (e.g., 1.2 = 120% of font size)
 * - topPadding: (optional, story children only) Padding above text in mm
 * - bottomPadding: (optional, story children only) Padding below text in mm
 *
 * 3. Story Element:
 * - type: "story"
 * - position: { x, y } starting coordinates in mm
 * - children: Array of text elements (only text type allowed)
 * - Children are rendered sequentially like HTML blocks (ignoring their individual position)
 * - Children support topPadding and bottomPadding for spacing
 *
 * Example Story Element:
 * {
 *   type: "story",
 *   position: { x: 10, y: 10 },
 *   children: [
 *     {
 *       type: "text",
 *       content: "{{name}}",
 *       topPadding: 2,
 *       bottomPadding: 3,
 *       font: { size: 18, file: geistSemiBoldFontUrl, name: "Geist-SemiBold", style: "normal" },
 *       color: "#000000",
 *       width: 60,
 *       autoSize: true
 *     },
 *     {
 *       type: "text",
 *       content: "{{function}}",
 *       topPadding: 1,
 *       bottomPadding: 2,
 *       font: { size: 10, file: merriweatherRegularFontUrl, name: "Merriweather-Regular", style: "normal" },
 *       color: "#666666",
 *       width: 60
 *     }
 *   ]
 * }
 *
 * OpenType Features:
 * You can enable/disable OpenType features in the font configuration.
 * Common features include:
 * - ss01-ss20: Stylistic Sets (e.g., ss03: true)
 * - liga: Standard Ligatures (liga: true/false)
 * - dlig: Discretionary Ligatures
 * - calt: Contextual Alternates
 * - smcp: Small Capitals
 * - c2sc: Capitals to Small Capitals
 * - onum: Old Style Numerals
 * - pnum: Proportional Numerals
 * - tnum: Tabular Numerals
 * - frac: Fractions
 * - kern: Kerning
 *
 * Example:
 * features: {
 *   ss03: true,    // Enable Stylistic Set 03
 *   liga: false,   // Disable standard ligatures
 *   onum: true     // Enable old style numerals
 * }
 */

export const labelLayouts = {
  "zweckform-L4785-20": {
    name: "Zweckform L4785-20",
    paperFormat: "A4",
    labelsX: 2,
    labelsY: 5,
    labelWidth: 80,
    labelHeight: 50,
    gapX: 15,
    gapY: 5,
    marginLeft: 17.5,
    marginTop: 13.5,
    showBorder: true, // Set to true for debugging label positioning
    elements: [
      {
        type: "image",
        src: logoPdfUrl,
        width: 25,
        height: "auto",
        position: {
          x: 10,
          y: 42,
        },
      },
      {
        type: "text",
        content: "{{name}}",
        font: {
          size: 18,
          file: geistSemiBoldFontUrl,
          name: "Geist-SemiBold",
          style: "normal",
          lineHeight: 1.2, // Line height multiplier (1.2 = 120% of font size)
          features: {
            ss03: true, // Stylistic Set 03
          },
        },
        color: "#000000",
        width: 56, // Text box width in mm for multi-line wrapping
        autoSize: true, // Auto-scale text to fit within width if line is too long
        position: {
          x: 10,
          y: 10.5,
        },
      },
      {
        type: "text",
        content: "{{function}}",
        font: {
          size: 8,
          file: merriweatherRegularFontUrl,
          name: "Merriweather-Regular",
          style: "normal",
        },
        color: "#000000",
        width: 56, // Text box width in mm for multi-line wrapping
        autoSize: true, // Auto-scale text to fit within width if line is too long
        position: {
          x: 10,
          y: 16,
        },
      },
    ],
  },

  "zweckform-L4785-20-story": {
    name: "Zweckform L4785-20 (Story Example)",
    paperFormat: "A4",
    labelsX: 2,
    labelsY: 5,
    labelWidth: 80,
    labelHeight: 50,
    gapX: 15,
    gapY: 5,
    marginLeft: 17.5,
    marginTop: 13.5,
    showBorder: true, // Set to true for debugging label positioning
    elements: [
      {
        type: "image",
        src: logoPdfUrl,
        width: 25,
        height: "auto",
        position: {
          x: 10,
          y: 42,
        },
      },
      {
        type: "story",
        position: {
          x: 10,
          y: 10.5,
        },
        children: [
          {
            type: "text",
            content: "{{name}}",
            topPadding: 0,
            bottomPadding: 1,
            font: {
              size: 18,
              file: geistSemiBoldFontUrl,
              name: "Geist-SemiBold",
              style: "normal",
              lineHeight: 1.2,
              features: {
                ss03: true,
              },
            },
            color: "#000000",
            width: 56,
            autoSize: true,
          },
          {
            type: "text",
            content: "{{function}}",
            topPadding: 0,
            bottomPadding: 0,
            font: {
              size: 8,
              file: merriweatherRegularFontUrl,
              name: "Merriweather-Regular",
              style: "normal",
              lineHeight: 1.2,
            },
            color: "#000000",
            width: 56,
            autoSize: true,
          },
        ],
      },
    ],
  },


};

/**
 * Get layout configuration by name
 */
export function getLayoutConfig(layoutName) {
  return labelLayouts[layoutName] || labelLayouts["zweckform-L4785-20"];
}

/**
 * Get all available layouts
 */
export function getAvailableLayouts() {
  return Object.keys(labelLayouts).map((key) => ({
    value: key,
    label: labelLayouts[key].name,
  }));
}

/**
 * Create custom layout configuration
 */
export function createCustomLayout(params) {
  return {
    name: params.name || "Custom",
    paperFormat: params.paperFormat || "A4",
    labelsX: params.labelsX || 2,
    labelsY: params.labelsY || 10,
    labelWidth: params.labelWidth || 100,
    labelHeight: params.labelHeight || 30,
    gapX: params.gapX || 2,
    gapY: params.gapY || 2,
    marginLeft: params.marginLeft || 5,
    marginTop: params.marginTop || 5,
    showBorder: params.showBorder || false, // Set to true for debugging label positioning
    elements: params.elements || [
      {
        type: "image",
        src: logoPdfUrl,
        width: 12,
        height: "auto",
        position: { x: 2, y: 2 },
      },
      {
        type: "text",
        content: "{{name}}",
        font: {
          size: 14,
          file: geistRegularFontUrl,
          name: "Geist-Regular",
          style: "normal",
          features: {
            ss03: true, // Stylistic Set 03
          },
        },
        color: "#000000",
        position: { x: 16, y: 7 },
      },
      {
        type: "text",
        content: "{{function}}",
        font: {
          size: 10,
          file: merriweatherRegularFontUrl,
          name: "Merriweather-Regular",
          style: "normal",
          lineHeight: 1.2, // Line height multiplier
        },
        color: "#666666",
        width: 96, // Text box width in mm for multi-line wrapping
        autoSize: true, // Auto-scale text to fit within width if line is too long
        position: { x: 2, y: 25 },
      },
    ],
  };
}
