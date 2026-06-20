import sharp from "sharp";

const strip =
  "C:/Users/user/.cursor/projects/c-Users-user-Desktop-Metavision/assets/c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_7895d04ce3f7822328516f6835090075_images_Frame_74__2_-77cbfaf3-ac90-408b-aa13-5f0c3607233e.png";

const { data, info } = await sharp(strip)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const segs = {
  amazon: [0, 237],
  ga: [283, 521],
  make: [567, 805],
};

function isDividerCol(x) {
  let black = 0;
  let gray = 0;
  for (let y = 0; y < info.height; y++) {
    const i = (y * info.width + x) * info.channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 60 && g < 60 && b < 60) black++;
    if (r > 60 && r < 220 && Math.abs(r - g) < 5 && Math.abs(g - b) < 5) gray++;
  }
  return black / info.height > 0.5 || gray / info.height > 0.85;
}

for (const [name, [l, r]] of Object.entries(segs)) {
  let right = r;
  while (right > l && isDividerCol(right - 1)) right--;
  let left = l;
  while (left < right && isDividerCol(left)) left++;
  console.log(name, "->", left, right, "width", right - left);
}
