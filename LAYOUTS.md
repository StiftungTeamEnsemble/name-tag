# Layout Definition Reference (AST)

Layouts describe how a single label/badge is composed and how labels are
arranged on the sheet. They are plain objects defined in
[`src/layouts.js`](src/layouts.js) and rendered by
[`src/utils/pdfGenerator.js`](src/utils/pdfGenerator.js).

- `getLayoutConfig(name, assetPaths)` returns a layout by key.
- `getAvailableLayouts(assetPaths)` returns `{ value, label }` for the UI dropdown.

The renderer walks a layout's `elements` array and draws each element as its own
node (an AST), so layouts are fully data-driven — you add features by adding
element nodes, not code.

## Table of contents

- [Coordinate system & units](#coordinate-system--units)
- [Layout object](#layout-object)
- [Grid & imposition](#grid--imposition)
- [Crop marks](#crop-marks)
- [Template variables & helpers](#template-variables--helpers)
- [Fonts, assets & colors](#fonts-assets--colors)
- [Elements](#elements)
  - [image](#image)
  - [text](#text)
  - [story](#story)
  - [textbox](#textbox)
  - [mask](#mask)
  - [imageData](#imagedata)
  - [qrcode](#qrcode)
  - [circle / ellipse](#circle--ellipse)
- [Face detection](#face-detection)
- [Full example](#full-example)

## Coordinate system & units

- **Origin is top-left**, like CSS/InDesign: `top` grows downward, `left` grows
  rightward. (pdf-lib itself is bottom-left; the renderer flips for you.)
- **Units are millimetres.** A measurement can be either a number (`75`) or a
  string with a unit suffix (`"75.00mm"`). Both are parsed by `parseMm()`.
- Two positioning conventions exist across element types:
  - **`left` / `top` / `width` / `height`** — used by newer elements
    (`textbox`, `mask`, `imageData`, `qrcode`, `circle`).
  - **`position: { x, y }` + `width` / `height`** — used by the older
    `image`, `text`, and `story` elements.

## Layout object

| Property      | Type    | Description                                                                                                                     |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | string  | Human-readable label shown in the UI dropdown.                                                                                  |
| `paperFormat` | string  | `"A4"`, `"Letter"`, or `"A3"`.                                                                                                  |
| `landscape`   | boolean | Swap page width/height (default `false`).                                                                                       |
| `columns`     | number  | Labels per row.                                                                                                                 |
| `rows`        | number  | Rows per page.                                                                                                                  |
| `labelWidth`  | number  | Label width in mm. If omitted, computed from the page/margins/gaps.                                                             |
| `labelHeight` | number  | Label height in mm. If omitted, computed.                                                                                       |
| `rowGap`      | number  | **Horizontal** gap between columns, in mm (see note).                                                                           |
| `columnGap`   | number  | **Vertical** gap between rows, in mm (see note).                                                                                |
| `marginLeft`  | number  | Left page margin in mm.                                                                                                         |
| `marginTop`   | number  | Top page margin in mm.                                                                                                          |
| `showBorder`  | boolean | Draw a light rectangle around each label (alignment aid). Toggled by the CLI `--lines` flag / the web "Linien anzeigen" option. |
| `cropMarks`   | boolean | Draw printer crop marks (see [Crop marks](#crop-marks)).                                                                        |
| `elements`    | array   | The element nodes to render inside every label.                                                                                 |

> **Naming quirk:** `rowGap` is the gap _between columns_ (horizontal) and
> `columnGap` is the gap _between rows_ (vertical). This is historical; keep it
> in mind when authoring layouts.

## Grid & imposition

Labels are placed left-to-right, top-to-bottom, filling `columns × rows` per
page and adding pages until all entries are placed. A label's top-left position
is:

```
x = marginLeft + col * (labelWidth  + rowGap)
y = marginTop  + row * (labelHeight + columnGap)
```

For a centered N-up sheet, pick margins so
`2 * marginLeft + columns * labelWidth + (columns - 1) * rowGap = pageWidth`.
Example (badge): A4 landscape is 297 mm wide, `3 × 90` mm badges with `rowGap: 0`
→ `marginLeft = (297 − 270) / 2 = 13.5`.

## Crop marks

When `cropMarks: true`, marks are computed **once per layout** for the whole
imposition grid, then filtered: a mark is drawn only if it does **not** touch
any badge's trim box. Consequences:

- Shared cut lines between adjacent labels get a single mark (no duplicates
  poking into a neighbour).
- Outer edges keep both their marks.
- The result is identical on every page (even a partly-filled last page), so the
  sheet always cuts the same way.

Marks sit `2 mm` outside the trim, are `4 mm` long and `0.25 pt` thick.

## Template variables & helpers

Any element `content`, run `content`, or `imageData`/`qrcode` string may contain
templates. Available fields come from the parsed data record: `firstname`,
`lastname`, `role`, `addition`, `image`.

- **Field:** `{{firstname}}`, `{{addition}}`, …
- **Join helper:** `{{join "firstname" "lastname" separator=" "}}` — joins the
  named fields with `separator`, skipping empty values (so a missing `lastname`
  produces no trailing space).

Visible text is normalized to Unicode **NFC** (macOS filenames are often NFD,
which otherwise mis-renders diacritics). The `image` field is left un-normalized
because the image loaders do their own NFC-insensitive matching.

## Fonts, assets & colors

- **Colors** are hex strings, e.g. `"#000000"`.
- **Fonts** are objects: `{ size, file, name, style, lineHeight, features }`.
  - `file` is an **asset key** resolved via `assetPaths` (see below), or a path.
  - `name` is the embedded font name; `lineHeight` is a multiplier (default `1.2`).
  - `features` (e.g. `{ ss03: true }`) is accepted but OpenType features are not
    applied by pdf-lib.
- **Asset keys** (from `config.js` / the CLI): `logo`, `geistRegular`,
  `geistSemiBold`, `merriweatherRegular`. The `image` element's `src` also uses
  these keys (e.g. `src: "logo"`).

## Elements

Every element has a `type`. Unknown types are ignored.

### image

Embeds a vector PDF asset (e.g. the logo). Uses `position` + `width`.

| Property   | Type               | Notes                                       |
| ---------- | ------------------ | ------------------------------------------- |
| `type`     | `"image"`          |                                             |
| `src`      | string             | Asset key (e.g. `"logo"`) or path to a PDF. |
| `width`    | number (mm)        |                                             |
| `height`   | number \| `"auto"` | `"auto"` keeps aspect ratio.                |
| `position` | `{ x, y }` (mm)    | Top-left.                                   |

### text

A single (optionally wrapping) text block. Used standalone or inside `story`.

| Property        | Type            | Notes                                         |
| --------------- | --------------- | --------------------------------------------- |
| `type`          | `"text"`        |                                               |
| `content`       | string          | May contain templates.                        |
| `font`          | font object     | See [Fonts](#fonts-assets--colors).           |
| `color`         | hex string      |                                               |
| `width`         | number (mm)     | Enables wrapping to this width.               |
| `autoSize`      | boolean         | Shrink font so the longest word fits `width`. |
| `position`      | `{ x, y }` (mm) | Top-left (when standalone).                   |
| `topPadding`    | number (mm)     | Space before (in `story`/`textbox`).          |
| `bottomPadding` | number (mm)     | Space after.                                  |

### story

Stacks `text` children vertically like HTML blocks, honoring each child's
`topPadding`/`bottomPadding`. Only `text` children are allowed.

| Property   | Type            | Notes                  |
| ---------- | --------------- | ---------------------- |
| `type`     | `"story"`       |                        |
| `position` | `{ x, y }` (mm) | Top-left of the stack. |
| `children` | array of `text` |                        |

### textbox

A positioned box containing stacked paragraphs, with horizontal and vertical
alignment. This is the richer successor to `story`.

| Property                | Type                                | Notes                   |
| ----------------------- | ----------------------------------- | ----------------------- |
| `type`                  | `"textbox"`                         |                         |
| `left/top/width/height` | mm                                  | The box.                |
| `textAlign`             | `"left"` \| `"center"` \| `"right"` | Default `"left"`.       |
| `verticalAlign`         | `"top"` \| `"center"` \| `"bottom"` | Default `"top"`.        |
| `children`              | array                               | Paragraphs (see below). |

Each **paragraph** child is one of:

- **Simple:** `{ content, font, color, width, autoSize, textAlign, topPadding, bottomPadding }`
  — a wrapping text block (as in `text`).
- **Rich (mixed fonts on one line):** `{ runs: [ { content, font, color }, … ], textAlign, topPadding, bottomPadding }`.
  Runs render inline on a **shared baseline**, so different font sizes line up on
  the baseline (the line box is sized by the tallest run) rather than at their tops.

### mask

Clips its children to a shape. Currently supports circles.

| Property                | Type       | Notes                                              |
| ----------------------- | ---------- | -------------------------------------------------- |
| `type`                  | `"mask"`   |                                                    |
| `left/top/width/height` | mm         | The clip box.                                      |
| `typeMask`              | `"circle"` | Circle uses `min(width, height)` as diameter.      |
| `children`              | array      | Drawn inside the clip (typically one `imageData`). |

Child coordinates are **relative to the mask box** (so `left: 0, top: 0` = the
mask's top-left).

### imageData

Draws a raster image (JPEG/PNG). Typically nested inside a `mask`.

| Property                | Type                                                   | Notes                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                  | `"imageData"`                                          |                                                                                                                                                                                          |
| `left/top/width/height` | mm                                                     | Target box (relative to parent).                                                                                                                                                         |
| `src`                   | string                                                 | Filename/template (e.g. `"{{image}}"`), a `data:` URL, or a path. Bare filenames are resolved via the image folder (`--image-dir` / picked folder), matched case- and NFC-insensitively. |
| `objectFit`             | `"cover"` \| `"contain"` \| `"fill"`                   | Default `"cover"`.                                                                                                                                                                       |
| `align`                 | `"left"` \| `"center"` \| `"right"` \| number \| `"%"` | Horizontal placement (default center).                                                                                                                                                   |
| `verticalAlign`         | `"top"` \| `"center"` \| `"bottom"` \| number \| `"%"` | Vertical placement (default center).                                                                                                                                                     |
| `faceDetect`            | boolean                                                | Place the photo via face detection (see below).                                                                                                                                          |
| `faceHeightFraction`    | number                                                 | Face box height ÷ mask height (default `0.6`).                                                                                                                                           |
| `faceCenterX`           | number                                                 | Where the face center sits horizontally, `0..1` (default `0.5`).                                                                                                                         |
| `faceCenterY`           | number                                                 | Where the face center sits vertically, `0..1` (default `0.55`).                                                                                                                          |

### qrcode

Generates and embeds a QR code (via the `qrcode` package).

| Property                | Type       | Notes                                 |
| ----------------------- | ---------- | ------------------------------------- |
| `type`                  | `"qrcode"` |                                       |
| `left/top/width/height` | mm         | The QR box.                           |
| `text`                  | string     | Encoded value; may contain templates. |

### circle / ellipse

A filled circle/ellipse (e.g. a small registration dot).

| Property                | Type                        | Notes                           |
| ----------------------- | --------------------------- | ------------------------------- |
| `type`                  | `"circle"` (or `"ellipse"`) |                                 |
| `left/top/width/height` | mm                          | Bounding box.                   |
| `color`                 | hex string                  | Fill color (default `#808080`). |

## Face detection

When an `imageData` has `faceDetect: true`, the photo is placed by detecting the
face (via [@vladmandic/human](https://github.com/vladmandic/human)) and
scaling/positioning it so **every face ends up at the same size and position**
inside the box. Robustness rules:

- The face is scaled to `faceHeightFraction` of the box height and anchored at
  `faceCenterX` / `faceCenterY`.
- If that would leave the box uncovered, the image is scaled up to the closest
  fit that fully covers the box, then clamped so no gap is exposed.
- If no face is found, it falls back to the `objectFit` / `align` behavior.

Environments:

- **CLI (Node):** enabled automatically when a layout uses `faceDetect`. Uses
  Human's WASM TensorFlow backend with models bundled locally — no native build
  and no network access required.
- **Web:** the detection library is lazy-loaded (WebGL backend) and models are
  fetched from a CDN, so the first run needs network access. Select the image
  folder first.

## Full example

The badge layout (`team-ensemble-badge-90x135`): 90×135 mm, three up on A4
landscape (0 mm gap, centered), crop marks, a face-detected circular photo, a
name + company, a footer with mixed-weight runs, a QR code, and a registration
dot.

```js
{
  name: "Team Ensemble Badge 90×135mm (3 auf A4 quer)",
  paperFormat: "A4",
  landscape: true,
  columns: 3,
  rows: 1,
  labelWidth: 90,
  labelHeight: 135,
  rowGap: 0,       // horizontal gap between badges
  columnGap: 0,    // vertical gap between rows
  marginLeft: 13.5,
  marginTop: 37.5,
  showBorder: false,
  cropMarks: true,
  elements: [
    { type: "circle", left: "44.75mm", top: "7.75mm", width: "0.5mm", height: "0.5mm", color: "#808080" },
    {
      type: "mask", left: "7.5mm", top: "14mm", width: "75mm", height: "75mm", typeMask: "circle",
      children: [
        {
          type: "imageData", left: "0mm", top: "0mm", width: "75mm", height: "75mm", src: "{{image}}",
          faceDetect: true, faceHeightFraction: 0.6, faceCenterX: 0.5, faceCenterY: 0.55,
          objectFit: "cover", align: "center", verticalAlign: "center",
        },
      ],
    },
    {
      type: "textbox", left: "5mm", top: "91.5mm", width: "80mm", height: "24mm",
      textAlign: "center", verticalAlign: "top",
      children: [
        { type: "text", content: '{{join "firstname" "lastname" separator=" "}}', autoSize: true, width: "80mm",
          font: { size: 24, file: "geistSemiBold", name: "Geist-SemiBold", lineHeight: 1.1 }, color: "#000000" },
        { type: "text", content: "{{addition}}", topPadding: 1,
          font: { size: 10, file: "geistRegular", name: "Geist-Regular", lineHeight: 1.2 }, color: "#000000" },
      ],
    },
    {
      type: "textbox", left: "0mm", top: "123.25mm", width: "65.5mm", height: "11mm",
      textAlign: "right", verticalAlign: "top",
      children: [
        { type: "text", runs: [
          { content: "Bleib im Kontakt mit", font: { size: 8, file: "geistRegular", name: "Geist-Regular" }, color: "#000000" },
          { content: " Team Ensemble", font: { size: 10, file: "geistSemiBold", name: "Geist-SemiBold" }, color: "#000000" },
        ] },
      ],
    },
    { type: "qrcode", left: "68.5mm", top: "121mm", width: "10.5mm", height: "10.5mm", text: "https://link.team-ensemble.ch/qmPzVA" },
  ],
}
```
