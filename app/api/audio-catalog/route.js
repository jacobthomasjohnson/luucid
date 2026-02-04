import fs from "node:fs/promises";
import path from "node:path";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac"]);

function toIdSlug(filename) {
  const base = filename.replace(/\.[^.]+$/, "");
  const slug = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]+/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || base;
}

async function readIconMap(root) {
  const file = path.join(root, "public", "audio", "icons.json");
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    const background = parsed?.background && typeof parsed.background === "object" ? parsed.background : {};
    const bells = parsed?.bells && typeof parsed.bells === "object" ? parsed.bells : {};
    return { background, bells };
  } catch {
    return { background: {}, bells: {} };
  }
}

async function readLoopMap(root) {
  const file = path.join(root, "public", "audio", "loops.json");
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    const background = parsed?.background && typeof parsed.background === "object" ? parsed.background : {};
    return { background };
  } catch {
    return { background: {} };
  }
}

function parseLoopPoints(value) {
  if (!value || typeof value !== "object") return { loopStart: null, loopEnd: null };
  const start = Number(value.start);
  const end = Number(value.end);
  const loopStart = Number.isFinite(start) && start >= 0 ? start : null;
  const loopEnd = Number.isFinite(end) && end > 0 ? end : null;
  if (loopStart != null && loopEnd != null && loopEnd > loopStart) return { loopStart, loopEnd };
  return { loopStart: null, loopEnd: null };
}

function toLabelFromFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, "");
  const spaced = base.replace(/[-_]+/g, " ").trim();
  if (!spaced) return base;
  return spaced
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

async function listAudioFiles(dirAbs) {
  let entries;
  try {
    entries = await fs.readdir(dirAbs, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => {
      if (!name) return false;
      if (name.startsWith(".")) return false;
      const ext = path.extname(name).toLowerCase();
      return AUDIO_EXTENSIONS.has(ext);
    })
    .sort((a, b) => a.localeCompare(b));
}

export async function GET() {
  const root = process.cwd();
  const bgDir = path.join(root, "public", "audio", "background");
  const bellDir = path.join(root, "public", "audio", "bells");

  const [iconMap, loopMap] = await Promise.all([readIconMap(root), readLoopMap(root)]);

  const [bgFiles, bellFiles] = await Promise.all([
    listAudioFiles(bgDir),
    listAudioFiles(bellDir),
  ]);

  const backgrounds = bgFiles.map((filename) => {
    const id = toIdSlug(filename);
    const icon = typeof iconMap.background[id] === "string" ? iconMap.background[id] : null;
    const loops = parseLoopPoints(loopMap.background[id]);
    return {
      id,
      label: toLabelFromFilename(filename),
      src: `/audio/background/${filename}`,
      loop: true,
      icon,
      ...loops,
    };
  });

  // Always include a silent option.
  backgrounds.unshift({
    id: "none",
    label: "None",
    src: null,
    loop: false,
    icon: "Slash",
    loopStart: null,
    loopEnd: null,
  });

  const bells = bellFiles.map((filename) => {
    const id = toIdSlug(filename);
    const icon = typeof iconMap.bells[id] === "string" ? iconMap.bells[id] : null;
    return {
      id,
      label: toLabelFromFilename(filename),
      src: `/audio/bells/${filename}`,
      icon,
    };
  });

  return Response.json({ ok: true, backgrounds, bells });
}
