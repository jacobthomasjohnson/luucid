import fs from "node:fs/promises";
import path from "node:path";

import { BACKGROUNDS, BELLS } from "../../../lib/constants";

export async function GET() {
  const file = path.join(process.cwd(), "public", "audio", "catalog.json");

  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return Response.json(parsed);
  } catch {
    // Fall through to defaults.
  }

  return Response.json({ ok: true, backgrounds: BACKGROUNDS, bells: BELLS });
}
