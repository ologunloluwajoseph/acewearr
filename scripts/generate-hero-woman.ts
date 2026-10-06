/* Generate the hero woman illustration — a joyful woman with shopping bags,
   designed to rest on the final "S" of AceWears.
   Save to /public/hero-woman.png
*/
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

async function main() {
  const zai = await ZAI.create();

  const prompt = `Vibrant fashion illustration of a joyful young Black woman laughing happily with eyes closed in delight,
sitting casually and leaning back as if resting on a giant letter, holding multiple colorful shopping bags
on both arms (amber, teal, white bags with tissue paper peeking out). She wears a stylish amber blazer
over a white top, navy trousers, and heeled ankle boots. Her hair is styled in a modern short fade.

Style: flat vector illustration with bold shapes, modern editorial fashion illustration,
AceWears brand palette (deep navy #0A1128 background, electric amber #FF9F1C, transformative teal #008080, clean white).
The woman and shopping bags should fill most of the frame, centered, with a soft circular vignette around her.
High-end fashion magazine cover illustration aesthetic. No text, no logos, no words.`;

  console.log("Generating hero woman illustration...");
  const response = await zai.images.generations.create({
    prompt,
    size: "1024x1024",
  });

  const imageBase64 = response.data[0]?.base64;
  if (!imageBase64) {
    console.error("No image data returned");
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "hero-woman.png");
  fs.writeFileSync(outPath, Buffer.from(imageBase64, "base64"));
  console.log(`Saved: ${outPath} (${(imageBase64.length * 0.75 / 1024).toFixed(1)} KB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
