import { connectDb } from "@/lib/mongodb";
import { SiteContentModel } from "@/lib/models";
import { parseJsonArray } from "@/lib/db/json-fields";
import { partners } from "@/data/partners";
import { industries } from "@/data/industries";
import { solutions, timelineSteps } from "@/data/solutions";

const STATIC_SECTIONS: Record<string, unknown[]> = {
  partners,
  industries,
  solutions,
  timeline: timelineSteps,
};

export async function getSiteSection<T>(section: string): Promise<T[]> {
  try {
    await connectDb();
    const row = await SiteContentModel.findOne({ section }).lean();
    if (row?.items) {
      const items = parseJsonArray<T>(row.items);
      if (items.length > 0) return items;
    }
  } catch {
    // Build / offline — fall back to bundled static content
  }
  return (STATIC_SECTIONS[section] ?? []) as T[];
}

export async function fetchSiteSection(section: string) {
  try {
    await connectDb();
    return SiteContentModel.findOne({ section }).lean();
  } catch {
    return null;
  }
}
