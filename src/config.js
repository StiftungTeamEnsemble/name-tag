import logoPdfUrl from "../assets/logo.pdf?url";
import geistRegularFontUrl from "../assets/fonts/Geist/ttf/Geist-Regular.ttf?url";
import geistSemiBoldFontUrl from "../assets/fonts/Geist/ttf/Geist-SemiBold.ttf?url";
import merriweatherRegularFontUrl from "../assets/fonts/Merriweather/ttf/Merriweather-Regular.ttf?url";

/**
 * Label Layout Configuration
 * Defines the structure and styling for name tags
 *
 * POSITIONING MODEL (HTML-like):
 * All positions use a top-left coordinate system (like HTML).
 * Text blocks include their em-square + leading (extra space from line-height).
 * Leading is distributed equally above and below the text (half-leading).
 *
 * Element Types:
 *
 * 1. Image Element:
 * - src: URL or path to the image/PDF
 * - width: Width in mm
 * - height: Height in mm or "auto" for aspect ratio
 * - position: { x, y } coordinates in mm (top-left corner)
 *
 * 2. Text Element:
 * - content: Template string with {{displayName}}, {{function}}, and {{addition}} placeholders
 * - Empty fields will be skipped (no rendering if text is empty)
 * - width: (optional) Text box width in mm for multi-line text wrapping
 * - autoSize: (optional) Auto-scale text down to fit within width if any line is too long
 * - position: { x, y } coordinates in mm (top-left corner of the text box)
 * - font.lineHeight: (optional) Line height multiplier (e.g., 1.2 = 120% of font size)
 *   The extra space (leading) is distributed above and below the text
 * - topPadding: (optional, story children only) Padding above text in mm
 * - bottomPadding: (optional, story children only) Padding below text in mm
 *
 * 3. Story Element:
 * - type: "story"
 * - position: { x, y } starting coordinates in mm (top-left corner)
 * - children: Array of text elements (only text type allowed)
 * - Children are rendered sequentially like HTML blocks
 * - Each child's position is ignored; they stack vertically
 * - Children support topPadding and bottomPadding for spacing between blocks
 * - Text blocks naturally include their leading space (from lineHeight)
 *
 * Example Story Element:
 * {
 *   type: "story",
 *   position: { x: 10, y: 10 },
 *   children: [
 *     {
 *       type: "text",
 *       content: "{{displayName}}",
 *       topPadding: 2,      // Extra space above this block
 *       bottomPadding: 3,   // Extra space below this block
 *       font: { size: 18, file: geistSemiBoldFontUrl, name: "Geist-SemiBold", style: "normal", lineHeight: 1.2 },
 *       color: "#000000",
 *       width: 60,
 *       autoSize: true
 *     },
 *     {
 *       type: "text",
 *       content: "{{function}}",
 *       topPadding: 1,
 *       bottomPadding: 2,
 *       font: { size: 10, file: merriweatherRegularFontUrl, name: "Merriweather-Regular", style: "normal", lineHeight: 1.2 },
 *       color: "#666666",
 *       width: 60
 *     },
 *     {
 *       type: "text",
 *       content: "{{addition}}",
 *       topPadding: 1,
 *       bottomPadding: 0,
 *       font: { size: 8, file: merriweatherRegularFontUrl, name: "Merriweather-Regular", style: "normal", lineHeight: 1.2 },
 *       color: "#999999",
 *       width: 60
 *     }
 *   ]
 * }
 *
 * OpenType Features:
 * NOTE: OpenType features are currently NOT supported by pdf-lib.
 * The features configuration is preserved for future implementation but will not affect rendering.
 *
 * To use OpenType features, you would need to use a font file that has the features
 * applied by default, or use a different PDF generation library that supports fontkit text shaping.
 *
 * Common OpenType features include:
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
 * Example (not currently functional):
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
    showBorder: false, // Set to true for debugging label positioning
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
          y: 5,
        },
        children: [
          {
            type: "text",
            content: "{{displayName}}",
            topPadding: 0,
            bottomPadding: 0,
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
            topPadding: 4,
            bottomPadding: 0,
            font: {
              size: 9,
              file: merriweatherRegularFontUrl,
              name: "Merriweather-Regular",
              style: "normal",
              lineHeight: 1.2,
            },
            color: "#000000",
            width: 56,
            autoSize: true,
          },
          {
            type: "text",
            content: "{{addition}}",
            topPadding: 1,
            bottomPadding: 0,
            font: {
              size: 9,
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
labelLayouts["zweckform-L4785-20-debug"] = {
  ...labelLayouts["zweckform-L4785-20"],
  name: "Zweckform L4785-20 (liniert)",
  showBorder: true,
};
labelLayouts["zweckform-L4785-20-no-logo"] = {
  ...labelLayouts["zweckform-L4785-20"],
  name: "Zweckform L4785-20 (ohne Logo)",
  elements: labelLayouts["zweckform-L4785-20"].elements.filter(
    (el) => el.type !== "image",
  ),
  showBorder: true,
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
