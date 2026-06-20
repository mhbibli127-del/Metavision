import sharp from "sharp";
import fs from "fs";
import path from "path";

const outDir = "c:/Users/user/Desktop/Metavision/public/partners";
const strip =
  "C:/Users/user/.cursor/projects/c-Users-user-Desktop-Metavision/assets/c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_7895d04ce3f7822328516f6835090075_images_Frame_74__2_-77cbfaf3-ac90-408b-aa13-5f0c3607233e.png";

const targetHeight = 135;
const white = { r: 255, g: 255, b: 255 };

/** Tight bounds — gray divider bleed excluded. */
const STRIP_BOUNDS = {
  amazon: [0, 237],
  make: [568, 803],
};

const GA_ICON = [284, 520];

fs.mkdirSync(outDir, { recursive: true });

function columnIsArtifact(data, width, height, x, channels) {
  const pixels = [];
  for (let y = 0; y < height; y++) {
    const i = (y * width + x) * channels;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  const black = pixels.filter(([r, g, b]) => r < 60 && g < 60 && b < 60).length;
  if (black / height > 0.5) return true;

  const uniformGray = pixels.every(([r, g, b]) => {
    return r < 220 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8;
  });
  if (uniformGray && pixels[0][0] < 220) return true;

  return false;
}

async function trimEdgeArtifacts(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let left = 0;
  let right = info.width - 1;
  const ch = info.channels;

  while (
    left < right &&
    columnIsArtifact(data, info.width, info.height, left, ch)
  ) {
    left++;
  }
  while (
    right > left &&
    columnIsArtifact(data, info.width, info.height, right, ch)
  ) {
    right--;
  }

  const w = right - left + 1;
  if (w < 1 || w === info.width) return input;

  return sharp(input)
    .extract({ left, top: 0, width: w, height: info.height })
    .png()
    .toBuffer();
}

async function saveStripLogo(name, left, right) {
  const tmp = path.join(outDir, `${name}-raw.png`);
  const out = path.join(outDir, `${name}.png`);

  await sharp(strip)
    .extract({ left, top: 0, width: right - left, height: 98 })
    .png()
    .toFile(tmp);

  const trimmed = await trimEdgeArtifacts(tmp);
  await sharp(trimmed)
    .flatten({ background: white })
    .resize({ height: targetHeight, fit: "inside" })
    .png()
    .toBuffer()
    .then((buf) => trimEdgeArtifacts(buf))
    .then((buf) => sharp(buf).png().toFile(out));

  fs.unlinkSync(tmp);
  const meta = await sharp(out).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? targetHeight };
}

async function saveGoogleAnalytics() {
  const [left, right] = GA_ICON;
  const width = right - left;
  const out = path.join(outDir, "google-analytics.png");

  const icon = await sharp(strip)
    .extract({ left, top: 4, width, height: 52 })
    .resize({ height: 72, fit: "inside" })
    .png()
    .toBuffer();

  const iconMeta = await sharp(icon).metadata();
  const canvasW = 340;
  const iconLeft = Math.round((canvasW - (iconMeta.width ?? 0)) / 2);

  const label = Buffer.from(`
    <svg width="${canvasW}" height="${targetHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text
        x="${canvasW / 2}"
        y="118"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="21"
        font-weight="400"
        fill="#5f6368"
      >Google Analytics</text>
    </svg>
  `);

  await sharp(label)
    .composite([{ input: icon, left: iconLeft, top: 10 }])
    .resize({ height: targetHeight, fit: "inside" })
    .flatten({ background: white })
    .png()
    .toFile(out);

  const meta = await sharp(out).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? targetHeight };
}

async function saveGoogleLogo() {
  const url =
    "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";
  const out = path.join(outDir, "google.png");

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error(`google download failed: ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  await sharp(buffer)
    .flatten({ background: white })
    .resize({ height: targetHeight, fit: "inside" })
    .png()
    .toFile(out);

  const meta = await sharp(out).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? targetHeight };
}

const sizes = {};

for (const [name, [left, right]] of Object.entries(STRIP_BOUNDS)) {
  sizes[name] = await saveStripLogo(name, left, right);
  console.log(name, sizes[name]);
}

sizes["google-analytics"] = await saveGoogleAnalytics();
console.log("google-analytics", sizes["google-analytics"]);

sizes.google = await saveGoogleLogo();
console.log("google", sizes.google);

const ts = `export type Partner = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
};

export const partners: Partner[] = [
  {
    id: "amazon",
    name: "Amazon",
    src: "/partners/amazon.png",
    width: ${sizes.amazon.width},
    height: ${sizes.amazon.height},
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    src: "/partners/google-analytics.png",
    width: ${sizes["google-analytics"].width},
    height: ${sizes["google-analytics"].height},
  },
  {
    id: "make",
    name: "Make",
    src: "/partners/make.png",
    width: ${sizes.make.width},
    height: ${sizes.make.height},
  },
  {
    id: "google",
    name: "Google",
    src: "/partners/google.png",
    width: ${sizes.google.width},
    height: ${sizes.google.height},
  },
];
`;

fs.writeFileSync(
  "c:/Users/user/Desktop/Metavision/src/data/partners.ts",
  ts,
  "utf8",
);

console.log("DONE");
