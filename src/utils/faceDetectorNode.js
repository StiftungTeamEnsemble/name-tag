/**
 * Node.js face detector built on @vladmandic/human.
 *
 * Node 24 cannot build the native @tensorflow/tfjs-node bindings, so this uses
 * Human's `node-wasm` build with the pure-WASM TensorFlow backend. Models and
 * the .wasm binaries are loaded from the local node_modules (offline). Node's
 * global fetch (undici) does not support file:// URLs, so we shim it.
 *
 * Returns a detector: async (bytes) => { x, y, width, height } | null
 * (normalized [0..1] face box in image space, top-left origin).
 */

import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { pathToFileURL, fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Install a file:// fetch shim once so Human can load local model files.
function installFileFetchShim() {
  if (globalThis.__nameTagFileFetchShim) return;
  globalThis.__nameTagFileFetchShim = true;
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    const u = typeof url === "string" ? url : (url && url.url) || String(url);
    if (u.startsWith("file://")) {
      const data = readFileSync(fileURLToPath(u));
      return new Response(data, {
        status: 200,
        headers: { "content-type": "application/octet-stream" },
      });
    }
    return origFetch(url, opts);
  };
}

/**
 * Decode JPEG/PNG bytes into { data: RGB Uint8, width, height }.
 */
function decodeImage(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  // JPEG
  if (u8[0] === 0xff && u8[1] === 0xd8) {
    const jpeg = require("jpeg-js");
    const raw = jpeg.decode(u8, { useTArray: true, formatAsRGBA: false });
    return { data: raw.data, width: raw.width, height: raw.height };
  }
  // PNG
  if (u8[0] === 0x89 && u8[1] === 0x50) {
    const { PNG } = require("pngjs");
    const png = PNG.sync.read(Buffer.from(u8));
    // RGBA -> RGB
    const rgb = new Uint8Array(png.width * png.height * 3);
    for (let i = 0, j = 0; i < png.data.length; i += 4, j += 3) {
      rgb[j] = png.data[i];
      rgb[j + 1] = png.data[i + 1];
      rgb[j + 2] = png.data[i + 2];
    }
    return { data: rgb, width: png.width, height: png.height };
  }
  throw new Error("Unsupported image format (expected JPEG or PNG)");
}

let humanPromise = null;

async function getHuman() {
  if (humanPromise) return humanPromise;

  humanPromise = (async () => {
    installFileFetchShim();

    // Resolve local package locations from this file (src/utils/ -> project root).
    // We can't use require.resolve on these packages' subpaths because their
    // "exports" maps block ./package.json and force the native tfjs-node build.
    const projectRoot = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
    );
    const nodeModules = join(projectRoot, "node_modules");
    const humanPkg = join(nodeModules, "@vladmandic", "human");
    const humanNodeWasm = join(humanPkg, "dist", "human.node-wasm.js");
    const modelBasePath = pathToFileURL(join(humanPkg, "models") + "/").href;

    const wasmDir =
      join(nodeModules, "@tensorflow", "tfjs-backend-wasm", "dist") + "/";

    const wasm = require("@tensorflow/tfjs-backend-wasm");
    wasm.setWasmPaths({
      "tfjs-backend-wasm.wasm": wasmDir + "tfjs-backend-wasm.wasm",
      "tfjs-backend-wasm-simd.wasm": wasmDir + "tfjs-backend-wasm-simd.wasm",
      "tfjs-backend-wasm-threaded-simd.wasm":
        wasmDir + "tfjs-backend-wasm-threaded-simd.wasm",
    });

    const HumanMod = require(humanNodeWasm);
    const Human = HumanMod.Human || HumanMod.default || HumanMod;

    const human = new Human({
      backend: "wasm",
      modelBasePath,
      debug: false,
      face: {
        enabled: true,
        detector: { enabled: true, rotation: false, maxDetected: 1 },
        mesh: { enabled: false },
        iris: { enabled: false },
        description: { enabled: false },
        emotion: { enabled: false },
        antispoof: { enabled: false },
        liveness: { enabled: false },
      },
      body: { enabled: false },
      hand: { enabled: false },
      object: { enabled: false },
      gesture: { enabled: false },
      segmentation: { enabled: false },
      filter: { enabled: false },
    });

    await human.load();
    await human.tf.ready();
    return human;
  })();

  return humanPromise;
}

export async function createNodeFaceDetector() {
  const human = await getHuman();

  return async (bytes) => {
    const { data, width, height } = decodeImage(bytes);
    const tensor = human.tf.tensor3d(data, [height, width, 3]);
    try {
      const result = await human.detect(tensor);
      const face = result.face && result.face[0];
      if (!face || !face.boxRaw) return null;
      const [x, y, w, h] = face.boxRaw; // normalized [0..1]
      return { x, y, width: w, height: h };
    } finally {
      human.tf.dispose(tensor);
    }
  };
}
