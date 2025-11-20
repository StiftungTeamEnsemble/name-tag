/**
 * Shared label layout definitions
 * Used by both browser and Node.js configs
 */

export function createLabelLayouts(assetPaths) {
  const layouts = {
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
      showBorder: false,
      elements: [
        {
          type: "image",
          src: "logo",
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
                file: "geistSemiBold",
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
                file: "merriweatherRegular",
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
                file: "merriweatherRegular",
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

  layouts["zweckform-L4785-20-debug"] = {
    ...layouts["zweckform-L4785-20"],
    name: "Zweckform L4785-20 (liniert)",
    showBorder: true,
  };

  layouts["zweckform-L4785-20-no-logo"] = {
    ...layouts["zweckform-L4785-20"],
    name: "Zweckform L4785-20 (ohne Logo)",
    elements: layouts["zweckform-L4785-20"].elements.filter(
      (el) => el.type !== "image",
    ),
    showBorder: true,
  };

  return layouts;
}

/**
 * Get layout configuration by name
 */
export function getLayoutConfig(layoutName, assetPaths) {
  const layouts = createLabelLayouts(assetPaths);
  return layouts[layoutName] || layouts["zweckform-L4785-20"];
}

/**
 * Get all available layouts
 */
export function getAvailableLayouts(assetPaths) {
  const layouts = createLabelLayouts(assetPaths);
  return Object.keys(layouts).map((key) => ({
    value: key,
    label: layouts[key].name,
  }));
}
