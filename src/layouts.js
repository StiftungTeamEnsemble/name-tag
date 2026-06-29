/**
 * Shared label layout definitions
 * Used by both browser and Node.js configs
 */

export function createLabelLayouts(assetPaths) {
  const layouts = {
    "zweckform-L4785-20": {
      name: "Zweckform L4785-20",
      paperFormat: "A4",
      columns: 2,
      rows: 5,
      labelWidth: 80,
      labelHeight: 50,
      rowGap: 15,
      columnGap: 5,
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

  // Team Ensemble badge: 90 x 135 mm, three placed side by side (0 mm gap)
  // centered on an A4 landscape sheet, with printer crop marks.
  layouts["team-ensemble-badge-90x135"] = {
    name: "Team Ensemble Badge 90×135mm (3 auf A4 quer)",
    paperFormat: "A4",
    landscape: true,
    columns: 3,
    rows: 1,
    labelWidth: 90,
    labelHeight: 135,
    rowGap: 0, // horizontal gap between badges
    columnGap: 0, // vertical gap between rows
    // (297 - 3*90) / 2 = 13.5 ; (210 - 135) / 2 = 37.5
    marginLeft: 13.5,
    marginTop: 37.5,
    showBorder: false,
    cropMarks: true,
    elements: [
      {
        type: "mask",
        left: "7.50mm",
        top: "14.00mm",
        width: "75.00mm",
        height: "75.00mm",
        typeMask: "circle",
        children: [
          {
            type: "imageData",
            left: "0.00mm",
            top: "0.00mm",
            width: "75.00mm",
            height: "75.00mm",
            src: "{{image}}",
            // How the photo is fitted/aligned within the mask:
            //   objectFit: "cover" | "contain" | "fill"
            //   align: "left" | "center" | "right" (or 0..1 / "%")
            //   verticalAlign: "top" | "center" | "bottom" (or 0..1 / "%")
            objectFit: "cover",
            align: "center",
            verticalAlign: "center",
          },
        ],
      },
      {
        type: "textbox",
        left: "5.00mm",
        top: "91.5mm",
        width: "80.00mm",
        height: "24.00mm",
        textAlign: "center",
        verticalAlign: "top",
        children: [
          {
            type: "text",
            bottomPadding: "2mm",
            content: "{{displayName}}",
            autoSize: true,
            font: {
              size: 24,
              file: "geistSemiBold",
              name: "Geist-SemiBold",
              style: "normal",
              lineHeight: 1.1,
            },
            color: "#000000",
            width: "80.00mm",
            autoSize: true,
          },
          {
            type: "text",
            content: "{{addition}}",
            topPadding: 1,
            bottomPadding: 0,
            font: {
              size: 9,
              file: "geistRegular",
              name: "Geist-Regular",
              style: "normal",
              lineHeight: 1.2,
            },
            color: "#000000",
          },
        ],
      },
      {
        type: "textbox",
        left: "0mm",
        top: "123.25mm",
        width: "65.5mm",
        height: "11.00mm",
        textAlign: "right",
        verticalAlign: "top",
        children: [
          {
            type: "text",
            runs: [
              {
                content: "Bleib im Kontakt mit",
                font: {
                  size: 8,
                  file: "geistRegular",
                  name: "Geist-Regular",
                  style: "normal",
                  lineHeight: 1.2,
                },
                color: "#000000",
              },
              {
                content: " Team Ensemble",
                font: {
                  size: 10,
                  file: "geistSemiBold",
                  name: "Geist-SemiBold",
                  style: "normal",
                  lineHeight: 1.2,
                },
                color: "#000000",
              },
            ],
          },
        ],
      },
      {
        type: "qrcode",
        left: "68.5mm",
        top: "121mm",
        width: "10.5mm",
        height: "10.5mm",
        text: "https://link.team-ensemble.ch/qmPzVA",
      },
    ],
  };

  layouts["team-ensemble-badge-90x135-debug"] = {
    ...layouts["team-ensemble-badge-90x135"],
    name: "Team Ensemble Badge 90×135mm (liniert)",
    showBorder: true,
  };

  // Same badge, but the photo is placed via face detection so every face ends
  // up at the same position and size inside the circular mask.
  {
    const faceElements = JSON.parse(
      JSON.stringify(layouts["team-ensemble-badge-90x135"].elements),
    );
    for (const el of faceElements) {
      if (el.type === "mask" && Array.isArray(el.children)) {
        for (const child of el.children) {
          if (child.type === "imageData") {
            child.faceDetect = true;
            // Tunables (defaults shown): face box height vs. mask, and where the
            // face center is anchored within the mask.
            child.faceHeightFraction = 0.6;
            child.faceCenterX = 0.5;
            child.faceCenterY = 0.55;
          }
        }
      }
    }
    layouts["team-ensemble-badge-90x135-face"] = {
      ...layouts["team-ensemble-badge-90x135"],
      name: "Team Ensemble Badge 90×135mm (Gesichtserkennung)",
      elements: faceElements,
    };
  }

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
