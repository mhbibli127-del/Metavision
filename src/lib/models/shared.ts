import { randomUUID } from "node:crypto";
import mongoose, { Schema, type Model } from "mongoose";

export const id = { type: String, default: () => randomUUID() };
export const ts = { type: Date, default: Date.now };

export type MongoDoc = Record<string, unknown> & { _id: string };

export function registerModel(name: string, schema: Schema): Model<MongoDoc> {
  return (mongoose.models[name] as Model<MongoDoc>) || mongoose.model(name, schema);
}

export function doc(d: { _id: string } | null | undefined): ({ id: string } & Record<string, unknown>) | null {
  if (!d) return null;
  return { ...d, id: d._id };
}

export function docs(list: Array<{ _id: string } & Record<string, unknown>>): Array<{ id: string } & Record<string, unknown>> {
  return list.map((d) => ({ ...d, id: d._id }));
}
