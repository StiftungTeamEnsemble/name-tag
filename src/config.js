/**
 * Label Layout Configuration
 * Defines the structure and styling for name tags
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
    elements: [
      {
        type: "image",
        src: "./assets/logo.svg",
        width: 8,
        position: {
          x: 2,
          y: 1.5,
        },
      },
      {
        type: "text",
        content: "{{name}}",
        fontPath: "./assets/fonts/Geist/ttf/Geist-Bold.ttf",
        font: {
          size: 11,
          weight: "bold",
        },
        color: "#000000",
        position: {
          x: 5,
          y: 5.5,
        },
      },
      {
        type: "text",
        content: "{{function}}",
        fontPath: "./assets/fonts/Merriweather/ttf/Merriweather-Regular.ttf",
        font: {
          size: 8,
          weight: "normal",
        },
        color: "#000000",
        position: {
          x: 5,
          y: 17.5,
        },
      },
    ],
  },

  custom: {
    name: "Custom Layout",
    paperFormat: "A4",
    labelsX: 2,
    labelsY: 10,
    labelWidth: 100,
    labelHeight: 30,
    gapX: 2,
    gapY: 2,
    marginLeft: 5,
    marginTop: 5,
    elements: [
      {
        type: "image",
        src: "./assets/logo.svg",
        width: 12,
        position: {
          x: 2,
          y: 2,
        },
      },
      {
        type: "text",
        content: "{{name}}",
        fontPath: "./assets/fonts/Geist/ttf/Geist-Bold.ttf",
        font: {
          size: 14,
          weight: "bold",
        },
        color: "#000000",
        position: {
          x: 16,
          y: 7,
        },
      },
      {
        type: "text",
        content: "{{function}}",
        fontPath: "./assets/fonts/Merriweather/ttf/Merriweather-Regular.ttf",
        font: {
          size: 10,
          weight: "normal",
        },
        color: "#666666",
        position: {
          x: 2,
          y: 25,
        },
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
    elements: params.elements || [
      {
        type: "image",
        src: "./assets/logo.svg",
        width: 12,
        position: { x: 2, y: 2 },
      },
      {
        type: "text",
        content: "{{name}}",
        fontPath: "./assets/fonts/Geist/ttf/Geist-Bold.ttf",
        font: { size: 14, weight: "bold" },
        color: "#000000",
        position: { x: 16, y: 7 },
      },
      {
        type: "text",
        content: "{{function}}",
        fontPath: "./assets/fonts/Merriweather/ttf/Merriweather-Regular.ttf",
        font: { size: 10, weight: "normal" },
        color: "#666666",
        position: { x: 2, y: 25 },
      },
    ],
  };
}
