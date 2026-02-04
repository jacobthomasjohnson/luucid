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

function toLabelFromFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, "");
  const spaced = base.replace(/[-_]+/g, " ").trim();
  if (!spaced) return base;
  return spaced
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function stripTrailingBellWord(label) {
  const s = String(label || "").trim();
  if (!s) return s;
  // Remove a trailing "Bell" / "Bells" word (common in filename-based labels).
  return s.replace(/\s+bells?$/i, "").trim();
}

async function readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
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

function toPublicSrc(prefix, filename) {
  // Encode filename safely for URL paths (spaces, etc).
  return `${prefix}/${encodeURIComponent(filename)}`;
}

async function main() {
  const root = process.cwd();
  const publicAudioRoot = path.join(root, "public", "audio");

  const iconsPath = path.join(publicAudioRoot, "icons.json");
  const loopsPath = path.join(publicAudioRoot, "loops.json");

  const icons = (await readJsonIfExists(iconsPath)) || {};
  const loops = (await readJsonIfExists(loopsPath)) || {};

  const iconMapBackground = icons?.background && typeof icons.background === "object" ? icons.background : {};
  const iconMapBells = icons?.bells && typeof icons.bells === "object" ? icons.bells : {};
  const loopMapBackground = loops?.background && typeof loops.background === "object" ? loops.background : {};

  const bgDir = path.join(publicAudioRoot, "background");
  const bellDir = path.join(publicAudioRoot, "bells");

  const [bgFiles, bellFiles] = await Promise.all([listAudioFiles(bgDir), listAudioFiles(bellDir)]);

  const backgrounds = bgFiles.map((filename) => {
    const id = toIdSlug(filename);
    const icon = typeof iconMapBackground[id] === "string" ? iconMapBackground[id] : null;
    const loopPoints = parseLoopPoints(loopMapBackground[id]);

    return {
      id,
      label: toLabelFromFilename(filename),
      src: toPublicSrc("/audio/background", filename),
      loop: true,
      icon,
      ...loopPoints,
    };
  });

  // Always include a silent option first.
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
    const icon = typeof iconMapBells[id] === "string" ? iconMapBells[id] : null;

    return {
      id,
      label: stripTrailingBellWord(toLabelFromFilename(filename)),
      src: toPublicSrc("/audio/bells", filename),
      icon,
    };
  });

  const outPath = path.join(publicAudioRoot, "catalog.json");
  const payload = { ok: true, backgrounds, bells };
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(`Generated ${path.relative(root, outPath)} (backgrounds: ${backgrounds.length}, bells: ${bells.length})`);
}

await main();
