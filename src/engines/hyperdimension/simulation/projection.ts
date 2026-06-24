/** 4D → 3D perspective projection (visual layer only — not physics) */

export type Vec4 = { x: number; y: number; z: number; w: number };
export type Vec3 = { x: number; y: number; z: number };

export function project4DTo3D(v: Vec4, distance4D: number, distance3D: number): Vec3 {
  const denom4 = distance4D - v.w;
  const safe4 = Math.abs(denom4) < 1e-6 ? Math.sign(denom4 || 1) * 1e-6 : denom4;
  const scale4 = distance4D / safe4;
  const x4 = v.x * scale4;
  const y4 = v.y * scale4;
  const z4 = v.z * scale4;

  const denom3 = distance3D - v.w * 0.25;
  const safe3 = Math.abs(denom3) < 1e-6 ? Math.sign(denom3 || 1) * 1e-6 : denom3;
  const scale3 = distance3D / safe3;

  return {
    x: x4 * scale3 * 0.35,
    y: y4 * scale3 * 0.35,
    z: z4 * scale3 * 0.35,
  };
}

export function tesseractVertices(): Vec4[] {
  const verts: Vec4[] = [];
  for (let i = 0; i < 16; i++) {
    verts.push({
      x: i & 1 ? 1 : -1,
      y: i & 2 ? 1 : -1,
      z: i & 4 ? 1 : -1,
      w: i & 8 ? 1 : -1,
    });
  }
  return verts;
}

export function neighborIndices(index: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    .filter((j) => j !== index && hamming(index, j) === 1);
}

function hamming(a: number, b: number): number {
  let x = a ^ b;
  let c = 0;
  while (x) {
    c += x & 1;
    x >>= 1;
  }
  return c;
}

export function trajectoryDeviation3D(history: Vec3[]): number {
  if (history.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < history.length; i++) {
    const a = history[i - 1]!;
    const b = history[i]!;
    sum += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }
  return sum / (history.length - 1);
}
