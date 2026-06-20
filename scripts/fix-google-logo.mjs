import sharp from "sharp";
import path from "path";

const googlePath = "c:/Users/user/Desktop/Metavision/public/partners/google.png";
const meta = await sharp(googlePath).metadata();
const w = meta.width ?? 173;
const h = meta.height ?? 98;

const eWidth = 28;
const svg = `
<svg width="${eWidth}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="0"
    y="${Math.round(h * 0.72)}"
    font-family="Product Sans, Google Sans, Arial, sans-serif"
    font-size="${Math.round(h * 0.58)}"
    font-weight="400"
    fill="#EA4335"
  >e</text>
</svg>
`;

await sharp(googlePath)
  .extend({
    right: eWidth,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .composite([{ input: Buffer.from(svg), left: w, top: 0 }])
  .png()
  .toFile("c:/Users/user/Desktop/Metavision/public/partners/google-full.png");

const fullMeta = await sharp(
  "c:/Users/user/Desktop/Metavision/public/partners/google-full.png",
).metadata();
console.log("google-full:", fullMeta.width, "x", fullMeta.height);
