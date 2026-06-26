/**
 * Browser face detector built on @vladmandic/human.
 *
 * Uses the bundled (browser) Human build with the WebGL TensorFlow backend.
 * Models are loaded from the jsDelivr CDN, pinned to the installed version.
 *
 * Returns a detector: async (bytes) => { x, y, width, height } | null
 * (normalized [0..1] face box in image space, top-left origin).
 */

import { Human } from "@vladmandic/human";

// Pin model files to the installed package version (see package.json).
const HUMAN_VERSION = "3.3.6";
const MODEL_BASE_PATH = `https://cdn.jsdelivr.net/npm/@vladmandic/human@${HUMAN_VERSION}/models/`;

let humanPromise = null;

function getHuman() {
  if (humanPromise) return humanPromise;

  humanPromise = (async () => {
    const human = new Human({
      backend: "webgl",
      modelBasePath: MODEL_BASE_PATH,
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
    await human.warmup();
    return human;
  })();

  return humanPromise;
}

export async function createBrowserFaceDetector() {
  const human = await getHuman();

  return async (bytes) => {
    const blob = new Blob([bytes]);
    const bitmap = await createImageBitmap(blob);
    try {
      const result = await human.detect(bitmap);
      const face = result.face && result.face[0];
      if (!face || !face.boxRaw) return null;
      const [x, y, w, h] = face.boxRaw; // normalized [0..1]
      return { x, y, width: w, height: h };
    } finally {
      if (bitmap.close) bitmap.close();
    }
  };
}
