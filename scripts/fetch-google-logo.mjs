import sharp from "sharp";
import path from "path";

const googleUrl =
  "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";
const outPath = "c:/Users/user/Desktop/Metavision/public/partners/google.png";
const targetHeight = 98;

const response = await fetch(googleUrl);
if (!response.ok) {
  throw new Error(`Failed to download Google logo: ${response.status}`);
}

const buffer = Buffer.from(await response.arrayBuffer());
const meta = await sharp(buffer).metadata();
const scale = targetHeight / (meta.height ?? 92);
const width = Math.round((meta.width ?? 272) * scale);

await sharp(buffer)
  .resize({ width, height: targetHeight })
  .png()
  .toFile(outPath);

const saved = await sharp(outPath).metadata();
console.log("google.png", saved.width, saved.height);
