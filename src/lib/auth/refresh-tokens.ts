import { connectDb } from "@/lib/mongodb";
import { RefreshTokenModel } from "@/lib/models";
import {
  generateRefreshToken,
  hashRefreshToken,
  createAccessToken,
  REFRESH_TTL_MS,
} from "@/lib/jwt";
import type { SessionPayload } from "@/lib/auth-types";

export async function issueTokenPair(userId: string, user: Omit<SessionPayload, "exp">) {
  await connectDb();
  const accessToken = await createAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash = await hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await RefreshTokenModel.create({
    userId,
    tokenHash,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(refreshToken: string, userId: string, user: Omit<SessionPayload, "exp">) {
  await connectDb();
  const tokenHash = await hashRefreshToken(refreshToken);
  const row = await RefreshTokenModel.findOne({ tokenHash, revokedAt: { $exists: false } }).lean();
  if (!row || new Date(String(row.expiresAt)) < new Date()) {
    throw new Error("Invalid refresh token");
  }
  await RefreshTokenModel.updateOne({ _id: row._id }, { $set: { revokedAt: new Date() } });
  return issueTokenPair(userId, user);
}

export async function revokeRefreshToken(refreshToken: string) {
  await connectDb();
  const tokenHash = await hashRefreshToken(refreshToken);
  await RefreshTokenModel.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
}
