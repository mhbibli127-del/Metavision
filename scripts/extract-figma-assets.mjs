import sharp from "sharp";
import fs from "fs";
import path from "path";

const screenshot =
  "C:/Users/user/.cursor/projects/c-Users-user-Desktop-Metavision/assets/c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_7895d04ce3f7822328516f6835090075_images_Screenshot_2026-06-14_213323-81b0e0bf-ed38-4090-9822-6c13432ecd9c.png";
const outDir = "c:/Users/user/Desktop/Metavision/public";

// Approximate crop regions from 1024x576 Figma screenshot (design area only)
const crops = [
  {
    name: "industries-bg.png",
    left: 95,
    top: 300,
    width: 834,
    height: 230,
  },
];

fs.mkdirSync(outDir, { recursive: true });

for (const crop of crops) {
  await sharp(screenshot)
    .extract({
      left: crop.left,
      top: crop.top,
      width: crop.width,
      height: crop.height,
    })
    .png()
    .toFile(path.join(outDir, crop.name));
  console.log("saved", crop.name);
}
