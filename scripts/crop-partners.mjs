import sharp from "sharp";
import fs from "fs";
import path from "path";

const src =
  "C:/Users/user/.cursor/projects/c-Users-user-Desktop-Metavision/assets/c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_7895d04ce3f7822328516f6835090075_images_Frame_74__2_-77cbfaf3-ac90-408b-aa13-5f0c3607233e.png";
const outDir = "c:/Users/user/Desktop/Metavision/public/partners";
const names = ["amazon", "google-analytics", "make"];

fs.mkdirSync(outDir, { recursive: true });

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

function columnIsBlack(x) {
  let dark = 0;
  for (let y = 0; y < height; y++) {
    const i = (y * width + x) * channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 40 && g < 40 && b < 40) dark++;
  }
  return dark / height > 0.85;
}

const segments = [];
let inContent = false;
let start = 0;

for (let x = 0; x < width; x++) {
  const black = columnIsBlack(x);
  if (!black && !inContent) {
    start = x;
    inContent = true;
  } else if (black && inContent) {
    segments.push([start, x]);
    inContent = false;
  }
}
if (inContent) segments.push([start, width]);

console.log("Image:", width, "x", height);
console.log("Segments:", segments);

for (let i = 0; i < names.length && i < segments.length; i++) {
  const [left, right] = segments[i];
  const w = right - left;
  await sharp(src)
    .extract({ left, top: 0, width: w, height })
    .png()
    .toFile(path.join(outDir, `${names[i]}.png`));
  console.log(`${names[i]}: ${w}px`);
}

// Trim white margins from each cropped logo
for (const name of names) {
  const file = path.join(outDir, `${name}.png`);
  const { data: px, info: meta } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = meta.width;
  let maxX = 0;
  let minY = meta.height;
  let maxY = 0;

  for (let y = 0; y < meta.height; y++) {
    for (let x = 0; x < meta.width; x++) {
      const i = (y * meta.width + x) * 4;
      const a = px[i + 3];
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      if (a > 15 && !(r > 250 && g > 250 && b > 250)) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX >= minX && maxY >= minY) {
    const tmp = `${file}.tmp.png`;
    await sharp(file)
      .extract({
        left: minX,
        top: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      })
      .png()
      .toFile(tmp);
    fs.renameSync(tmp, file);
    console.log(`trimmed ${name}`);
  }
}
