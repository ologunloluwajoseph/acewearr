/* Generate a 3D render of a joyful woman with shopping bags, transparent background.
   Saves to /public/hero-woman-3d.png
*/
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

async function main() {
  const zai = await ZAI.create();

  const prompt = `3D rendered character of a joyful young Black woman laughing happily with eyes closed in delight,
leaning back casually with shopping bags on both arms (amber, teal, white glossy shopping bags with tissue paper).
She wears a stylish amber blazer over a white top, navy trousers, and heeled ankle boots.
Her hair is styled in a modern short fade.

STYLE: high-quality 3D Pixar-style character render, octane render, cinema 4D, soft global illumination,
subsurface scattering on skin, glossy reflections on shopping bags, volumetric lighting.
The character should be in a relaxed leaning pose as if resting against something on her right side.
TRUE transparent background (PNG with alpha channel) — NO background, NO scene, NO floor, NO environment,
just the character floating in transparent space. Centered, full body visible from head to feet,
facing slightly toward camera at a three-quarter angle. No text, no logos, no words.`;

  console.log("Generating 3D woman render with transparent background...");
  const response = await zai.images.generations.create({
    prompt,
    size: "768x1344", // portrait — full body
  });

  const imageBase64 = response.data[0]?.base64;
  if (!imageBase64) {
    console.error("No image data returned");
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "hero-woman-3d.png");
  fs.writeFileSync(outPath, Buffer.from(imageBase64, "base64"));
  console.log(`Saved: ${outPath} (${(imageBase64.length * 0.75 / 1024).toFixed(1)} KB)`);

  // Post-process: ensure true transparency by removing near-white/near-gray background pixels.
  // The image gen model often returns a solid background even when asked for transparency.
  // We use sharp (already installed) to detect the corner color and key it out.
  console.log("Post-processing for transparent background...");
  const sharp = (await import("sharp")).default;
  const imgBuffer = Buffer.from(imageBase64, "base64");

  // Get the top-left corner pixel color (the background)
  const metadata = await sharp(imgBuffer).metadata();
  console.log("Image metadata:", metadata.width + "x" + metadata.height, metadata.channels + " channels");

  // Extract a 1x1 pixel from the top-left corner
  const cornerRaw = await sharp(imgBuffer)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer();
  const bgR = cornerRaw[0], bgG = cornerRaw[1], bgB = cornerRaw[2];
  console.log(`Background corner color: rgb(${bgR}, ${bgG}, ${bgB})`);

  // Chroma key: make pixels within a tolerance of the background color transparent.
  // Tolerance of ~40 handles gradients/anti-aliasing.
  const TOLERANCE = 45;

  const processed = await sharp(imgBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const channels = info.channels;
      for (let i = 0; i < data.length; i += channels) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        // Distance from background color
        const dist = Math.sqrt(
          Math.pow(r - bgR, 2) +
          Math.pow(g - bgG, 2) +
          Math.pow(b - bgB, 2)
        );
        if (dist < TOLERANCE) {
          // Make fully transparent
          data[i + 3] = 0;
        } else if (dist < TOLERANCE + 30) {
          // Feather the edge — partial transparency for anti-aliasing
          const alpha = Math.round(((dist - TOLERANCE) / 30) * 255);
          data[i + 3] = Math.min(255, alpha);
        }
      }
      return sharp(data, { raw: { width: info.width, height: info.height, channels } }).png();
    });

  const finalPath = path.join(outDir, "hero-woman-3d.png");
  await processed.toFile(finalPath);
  const finalStat = fs.statSync(finalPath);
  console.log(`Final transparent PNG: ${finalPath} (${(finalStat.size / 1024).toFixed(1)} KB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
